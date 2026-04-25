const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Account = require("../models/Account");
const { firebaseAuth, hasFirebaseAdminConfig } = require("../config/firebaseAdmin");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const signAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

const buildAuthResponse = (user) => ({
  token: signAccessToken(user),
  refreshToken: signRefreshToken(user),
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  },
});

const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email: email?.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      otp,
      otpExpiry,
    });

    await sendEmail(
      user.email,
      "Verify your banking account",
      `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    );

    return res.status(201).json({ message: "OTP sent to email" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || Date.now() >= new Date(user.otpExpiry).getTime()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const existingAccount = await Account.findOne({ userId: user._id });

    if (!existingAccount) {
      await Account.create({ userId: user._id });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your account" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    if (!hasFirebaseAdminConfig || !firebaseAuth) {
      return res.status(500).json({
        message: "Firebase authentication is not configured on the server",
      });
    }

    const { idToken } = req.body;
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Google account email is required" });
    }

    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        fullName: decodedToken.name || email.split("@")[0],
        email,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
        isVerified: true,
        firebaseUid: decodedToken.uid,
        authProvider: "google",
      });
    } else {
      user.fullName = user.fullName || decodedToken.name || user.email;
      user.isVerified = true;
      user.firebaseUid = decodedToken.uid;

      if (!user.authProvider || user.authProvider !== "local") {
        user.authProvider = "google";
      }

      await user.save();
    }

    const existingAccount = await Account.findOne({ userId: user._id });

    if (!existingAccount) {
      await Account.create({ userId: user._id });
    }

    await sendEmail(
      user.email,
      isNewUser ? "Welcome to Finova" : "Welcome back to Finova",
      `
        <p>Hello ${user.fullName},</p>
        <p>${
          isNewUser
            ? "Welcome to Finova. Your AI-powered banking workspace is ready."
            : "Welcome back to Finova. Your AI-powered banking workspace is ready to go."
        }</p>
        <p>You have successfully signed in with Google.</p>
      `
    );

    return res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("Google authentication failed:", error);

    return res.status(401).json({
      message:
        error.code === "auth/id-token-expired"
          ? "Google sign-in expired. Please try again."
          : error.code === "auth/argument-error" || error.code === "auth/invalid-id-token"
          ? "The Google sign-in token could not be verified."
          : "Google authentication failed",
    });
  }
};

const getMe = async (req, res) => {
  return res.json(req.user);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetToken = hashedResetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Reset your banking password",
      `<p>Reset your password using this link:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    );

    return res.json({ message: "Reset link sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetToken: hashedResetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.json({ message: "Password updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  googleAuth,
  getMe,
  forgotPassword,
  resetPassword,
};

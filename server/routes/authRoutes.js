const express = require("express");
const Joi = require("joi");

const {
  register,
  verifyOTP,
  login,
  googleAuth,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/\d/, "number")
    .required(),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .required(),
});
const otpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
const emailSchema = Joi.object({
  email: Joi.string().email().required(),
});
const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(/\d/, "number")
    .required(),
});
const googleAuthSchema = Joi.object({
  idToken: Joi.string().required(),
});

router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", validate(otpSchema), verifyOTP);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleAuthSchema), googleAuth);
router.get("/me", authMiddleware, getMe);
router.post("/forgot-password", validate(emailSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

module.exports = router;

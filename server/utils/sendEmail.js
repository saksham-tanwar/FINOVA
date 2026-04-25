const nodemailer = require("nodemailer");

const hasEmailCredentials =
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_USER !== "replace_with_gmail" &&
  process.env.EMAIL_PASS !== "replace_with_app_password";

const transporter = hasEmailCredentials
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.warn(`Email skipped for ${to}: SMTP credentials not configured`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;

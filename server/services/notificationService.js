const Notification = require("../models/Notification");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const sendNotification = async (userId, message, type = "in-app") => {
  const notification = await Notification.create({
    userId,
    message,
    type,
  });

  if (type.includes("email")) {
    const user = await User.findById(userId).select("email fullName");

    if (user?.email) {
      try {
        await sendEmail(
          user.email,
          "Banking Notification",
          `<p>Hello ${user.fullName || "User"},</p><p>${message}</p>`
        );
      } catch (error) {
        console.error(`Notification email failed for ${user.email}:`, error.message);
      }
    }
  }

  return notification;
};

module.exports = {
  sendNotification,
};

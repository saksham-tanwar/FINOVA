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
      await sendEmail(
        user.email,
        "Banking Notification",
        `<p>Hello ${user.fullName || "User"},</p><p>${message}</p>`
      );
    }
  }

  return notification;
};

module.exports = {
  sendNotification,
};

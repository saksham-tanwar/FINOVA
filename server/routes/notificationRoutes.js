const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAllRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.post("/mark-all-read", markAllRead);

module.exports = router;

const express = require("express");

const {
  getUsers,
  updateUserStatus,
  getAllTransactions,
  getAllClaims,
  updateClaim,
  getAILogs,
  getStats,
} = require("../controllers/adminController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:userId/status", updateUserStatus);
router.get("/transactions", getAllTransactions);
router.get("/claims", getAllClaims);
router.put("/claims/:id", updateClaim);
router.get("/ai-logs", getAILogs);

module.exports = router;

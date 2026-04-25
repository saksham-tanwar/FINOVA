const express = require("express");

const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const localhostOnly = require("../middleware/localhostOnly");
const upload = require("../middleware/upload");
const {
  getPlans,
  purchasePolicy,
  getMyPolicies,
  getPolicyById,
  fileClaim,
  getMyClaims,
  getClaimById,
  updateClaimStatus,
} = require("../controllers/insuranceController");

const router = express.Router();

router.get("/plans", getPlans);
router.post("/internal/claims", localhostOnly, fileClaim);
router.post("/purchase", authMiddleware, purchasePolicy);
router.get("/my-policies", authMiddleware, getMyPolicies);
router.get("/policy/:id", authMiddleware, getPolicyById);
router.post("/claims", authMiddleware, upload, fileClaim);
router.get("/claims", authMiddleware, getMyClaims);
router.get("/claims/:id", authMiddleware, getClaimById);
router.put("/claims/:id", authMiddleware, adminMiddleware, updateClaimStatus);

module.exports = router;

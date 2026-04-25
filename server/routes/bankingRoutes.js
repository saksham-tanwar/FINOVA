const express = require("express");
const Joi = require("joi");

const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  getAccount,
  getBalance,
  transferFunds,
  getTransactions,
  addBeneficiary,
  getBeneficiaries,
  deleteBeneficiary,
} = require("../controllers/bankingController");

const router = express.Router();

const transferSchema = Joi.object({
  accountNumber: Joi.string().trim().required(),
  amount: Joi.number().positive().required(),
  transferType: Joi.string().valid("NEFT", "RTGS", "IMPS").required(),
  description: Joi.string().allow("").max(250),
});

router.use(authMiddleware);

router.get("/account", getAccount);
router.get("/balance", getBalance);
router.post("/transfer", validate(transferSchema), transferFunds);
router.get("/transactions", getTransactions);
router.post("/beneficiaries", addBeneficiary);
router.get("/beneficiaries", getBeneficiaries);
router.delete("/beneficiaries/:id", deleteBeneficiary);

module.exports = router;

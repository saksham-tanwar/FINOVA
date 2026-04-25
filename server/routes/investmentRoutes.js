const express = require("express");
const Joi = require("joi");

const authMiddleware = require("../middleware/authMiddleware");
const localhostOnly = require("../middleware/localhostOnly");
const validate = require("../middleware/validate");
const {
  getMutualFunds,
  investMutualFund,
  redeemMutualFund,
  toggleSIP,
  createFD,
  breakFD,
  searchStocks,
  getStockPrice,
  buyStock,
  sellStock,
  getPortfolio,
} = require("../controllers/investmentController");

const router = express.Router();

const createFdSchema = Joi.object({
  amount: Joi.number().min(1000).required(),
  tenure: Joi.number().valid(1, 2, 3, 5, 7).required(),
});

router.get("/portfolio", localhostOnly, getPortfolio);

router.use(authMiddleware);

router.get("/mutual-funds", getMutualFunds);
router.post("/mutual-funds/invest", investMutualFund);
router.post("/mutual-funds/:id/redeem", redeemMutualFund);
router.patch("/:id/sip", toggleSIP);
router.post("/fd", validate(createFdSchema), createFD);
router.post("/fd/:id/break", breakFD);
router.get("/stocks/search", searchStocks);
router.get("/stocks/:symbol/price", getStockPrice);
router.post("/stocks/buy", buyStock);
router.post("/stocks/:id/sell", sellStock);
router.get("/portfolio", getPortfolio);

module.exports = router;

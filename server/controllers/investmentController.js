const Account = require("../models/Account");
const Investment = require("../models/Investment");
const mutualFundCatalog = require("../utils/mutualFundCatalog");
const fdRates = require("../utils/fdRates");
const { getLivePrice, searchStocks: searchStockService } = require("../services/stockService");

const getFundById = (fundId) =>
  mutualFundCatalog.find((fund) => fund.id === fundId);

const getFundByName = (name) =>
  mutualFundCatalog.find((fund) => fund.name === name);

const getMutualFunds = async (req, res) => {
  return res.json(mutualFundCatalog);
};

const investMutualFund = async (req, res) => {
  try {
    const { fundId, amount } = req.body;
    const parsedAmount = Number(amount);
    const fund = getFundById(fundId);

    if (!fund) {
      return res.status(404).json({ message: "Fund not found" });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.balance < parsedAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    account.balance -= parsedAmount;
    await account.save();

    const units = Number((parsedAmount / fund.nav).toFixed(4));

    const investment = await Investment.create({
      userId: req.user.id,
      type: "mutual_fund",
      instrumentName: fund.name,
      amount: parsedAmount,
      units,
      purchasePrice: fund.nav,
      currentPrice: fund.nav,
      sipActive: Boolean(req.body.sipActive),
      sipAmount: req.body.sipActive ? Number(req.body.sipAmount) : undefined,
      sipDay: req.body.sipActive ? Number(req.body.sipDay) : undefined,
    });

    return res.status(201).json(investment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const redeemMutualFund = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment || investment.type !== "mutual_fund") {
      return res.status(404).json({ message: "Investment not found" });
    }

    if (String(investment.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (investment.status !== "active") {
      return res.status(400).json({ message: "Investment is not active" });
    }

    const fund = getFundByName(investment.instrumentName);

    if (!fund) {
      return res.status(404).json({ message: "Fund not found" });
    }

    const redemptionValue = Number((investment.units * fund.nav).toFixed(2));
    const account = await Account.findOne({ userId: req.user.id });

    account.balance += redemptionValue;
    await account.save();

    investment.currentPrice = fund.nav;
    investment.status = "redeemed";
    await investment.save();

    return res.json({
      message: "Mutual fund redeemed",
      redemptionValue,
      investment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleSIP = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" });
    }

    if (String(investment.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    investment.sipActive = !investment.sipActive;
    investment.sipAmount = investment.sipActive
      ? Number(req.body.sipAmount)
      : undefined;
    investment.sipDay = investment.sipActive
      ? Number(req.body.sipDay)
      : undefined;

    await investment.save();

    return res.json(investment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createFD = async (req, res) => {
  try {
    const parsedAmount = Number(req.body.amount);
    const tenure = Number(req.body.tenure);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 1000) {
      return res.status(400).json({ message: "FD amount must be at least 1000" });
    }

    if (!Object.prototype.hasOwnProperty.call(fdRates, tenure)) {
      return res.status(400).json({ message: "Invalid tenure" });
    }

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.balance < parsedAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const rate = fdRates[tenure];
    const startDate = new Date();
    const maturityDate = new Date(startDate);
    maturityDate.setFullYear(maturityDate.getFullYear() + tenure);
    const maturityAmount = Number(
      (parsedAmount * Math.pow(1 + rate / 100, tenure)).toFixed(2)
    );

    account.balance -= parsedAmount;
    await account.save();

    const investment = await Investment.create({
      userId: req.user.id,
      type: "fd",
      instrumentName: `${tenure}Y Fixed Deposit`,
      amount: parsedAmount,
      purchasePrice: parsedAmount,
      currentPrice: maturityAmount,
      maturityDate,
    });

    return res.status(201).json({
      investment,
      maturityAmount,
      rate,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const breakFD = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment || investment.type !== "fd") {
      return res.status(404).json({ message: "FD not found" });
    }

    if (String(investment.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (investment.status !== "active") {
      return res.status(400).json({ message: "FD is not active" });
    }

    const startDate = new Date(investment.startDate);
    const now = new Date();
    const elapsedYears = Math.max(
      0,
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    const tenure = Math.max(
      1,
      new Date(investment.maturityDate).getFullYear() - startDate.getFullYear()
    );
    const rate = fdRates[tenure] || fdRates[1];
    const earnedInterest = Number(
      (investment.amount * (rate / 100) * elapsedYears).toFixed(2)
    );
    const penalty = Number((investment.amount * 0.01).toFixed(2));
    const creditAmount = Number(
      (investment.amount + Math.max(earnedInterest - penalty, 0)).toFixed(2)
    );

    const account = await Account.findOne({ userId: req.user.id });
    account.balance += creditAmount;
    await account.save();

    investment.status = "redeemed";
    await investment.save();

    return res.json({
      message: "FD broken successfully",
      earnedInterest,
      penalty,
      creditAmount,
      investment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const searchStocks = async (req, res) => {
  try {
    const results = await searchStockService(req.query.q);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getStockPrice = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const price = await getLivePrice(symbol);
    return res.json({ symbol, price });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const buyStock = async (req, res) => {
  try {
    const symbol = req.body.symbol?.toUpperCase();
    const units = Number(req.body.units);

    if (!symbol || !Number.isFinite(units) || units <= 0) {
      return res.status(400).json({ message: "Invalid stock order" });
    }

    const price = await getLivePrice(symbol);
    const cost = Number((units * price).toFixed(2));
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.balance < cost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    account.balance -= cost;
    await account.save();

    const investment = await Investment.create({
      userId: req.user.id,
      type: "stock",
      instrumentName: symbol,
      amount: cost,
      units,
      purchasePrice: price,
      currentPrice: price,
    });

    return res.status(201).json(investment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const sellStock = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment || investment.type !== "stock") {
      return res.status(404).json({ message: "Stock holding not found" });
    }

    if (String(investment.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (investment.status !== "active") {
      return res.status(400).json({ message: "Holding is not active" });
    }

    const price = await getLivePrice(investment.instrumentName);
    const saleValue = Number((investment.units * price).toFixed(2));
    const pnl = Number((saleValue - investment.amount).toFixed(2));
    const account = await Account.findOne({ userId: req.user.id });

    account.balance += saleValue;
    await account.save();

    investment.currentPrice = price;
    investment.status = "redeemed";
    await investment.save();

    return res.json({
      message: "Stock sold successfully",
      saleValue,
      pnl,
      investment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPortfolio = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const investments = await Investment.find({ userId }).sort({
      startDate: -1,
    });

    const enriched = await Promise.all(
      investments.map(async (investment) => {
        const plain = investment.toObject();

        if (plain.type === "stock" && plain.status === "active") {
          plain.currentPrice = await getLivePrice(plain.instrumentName);
        } else if (plain.type === "mutual_fund" && plain.status === "active") {
          plain.currentPrice = getFundByName(plain.instrumentName)?.nav || plain.currentPrice;
        }

        return plain;
      })
    );

    const grouped = enriched.reduce(
      (acc, investment) => {
        acc.byType[investment.type].push(investment);

        acc.totalInvested += investment.amount;

        const currentValue =
          investment.type === "fd"
            ? investment.currentPrice || investment.amount
            : (investment.units || 1) * (investment.currentPrice || investment.purchasePrice || 0);

        acc.currentValue += currentValue;

        return acc;
      },
      {
        byType: {
          mutual_fund: [],
          stock: [],
          fd: [],
        },
        totalInvested: 0,
        currentValue: 0,
      }
    );

    return res.json({
      ...grouped,
      pnl: Number((grouped.currentValue - grouped.totalInvested).toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};

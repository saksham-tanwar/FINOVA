const Account = require("../models/Account");
const InsurancePolicy = require("../models/InsurancePolicy");
const Investment = require("../models/Investment");
const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const { getLivePrice } = require("../services/stockService");

const getMonthlyWindow = () => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getSummary = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const monthStart = getMonthlyWindow();

    const [
      recentTransactions,
      monthlyTransactions,
      investments,
      policies,
      unreadCount,
      recentNotifications,
    ] = await Promise.all([
      Transaction.find({
        $or: [{ fromAccountId: account._id }, { toAccountId: account._id }],
      })
        .sort({ timestamp: -1 })
        .limit(5),
      Transaction.find({
        $or: [{ fromAccountId: account._id }, { toAccountId: account._id }],
        timestamp: { $gte: monthStart },
      }),
      Investment.find({ userId: req.user.id, status: "active" }),
      InsurancePolicy.find({ userId: req.user.id, status: "active" }).sort({
        endDate: 1,
      }),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
      Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(5),
    ]);

    const monthlyTotals = monthlyTransactions.reduce(
      (acc, transaction) => {
        if (String(transaction.toAccountId) === String(account._id)) {
          acc.totalCredit += transaction.amount;
        }

        if (String(transaction.fromAccountId) === String(account._id)) {
          acc.totalDebit += transaction.amount;
        }

        return acc;
      },
      { totalCredit: 0, totalDebit: 0 }
    );

    const currentValueBreakdown = {
      stocks: 0,
      mutual_fund: 0,
      fd: 0,
    };

    const totalInvestedBreakdown = {
      stocks: 0,
      mutual_fund: 0,
      fd: 0,
    };

    const enrichedInvestments = await Promise.all(
      investments.map(async (investment) => {
        let currentValue = investment.currentPrice || investment.amount;

        if (investment.type === "stock") {
          const livePrice = await getLivePrice(investment.instrumentName);
          currentValue = Number(((investment.units || 0) * livePrice).toFixed(2));
        } else if (investment.type === "mutual_fund") {
          currentValue = Number(
            (((investment.units || 0) * (investment.currentPrice || investment.purchasePrice || 0))).toFixed(2)
          );
        } else if (investment.type === "fd") {
          currentValue = Number((investment.currentPrice || investment.amount).toFixed(2));
        }

        return {
          ...investment.toObject(),
          currentValue,
        };
      })
    );

    enrichedInvestments.forEach((investment) => {
      const bucket =
        investment.type === "stock"
          ? "stocks"
          : investment.type === "mutual_fund"
            ? "mutual_fund"
            : "fd";

      totalInvestedBreakdown[bucket] += investment.amount;
      currentValueBreakdown[bucket] += investment.currentValue;
    });

    const totalInvested =
      totalInvestedBreakdown.stocks +
      totalInvestedBreakdown.mutual_fund +
      totalInvestedBreakdown.fd;
    const currentValue =
      currentValueBreakdown.stocks +
      currentValueBreakdown.mutual_fund +
      currentValueBreakdown.fd;
    const pnl = Number((currentValue - totalInvested).toFixed(2));
    const pnlPercent = totalInvested > 0 ? Number(((pnl / totalInvested) * 100).toFixed(2)) : 0;

    const monthlyFlow = [];

    for (let index = 5; index >= 0; index -= 1) {
      const monthStartDate = new Date();
      monthStartDate.setMonth(monthStartDate.getMonth() - index, 1);
      monthStartDate.setHours(0, 0, 0, 0);

      const monthEndDate = new Date(monthStartDate);
      monthEndDate.setMonth(monthEndDate.getMonth() + 1, 0);
      monthEndDate.setHours(23, 59, 59, 999);

      const monthTransactions = await Transaction.find({
        $or: [{ fromAccountId: account._id }, { toAccountId: account._id }],
        timestamp: { $gte: monthStartDate, $lte: monthEndDate },
      });

      const totals = monthTransactions.reduce(
        (acc, transaction) => {
          if (String(transaction.toAccountId) === String(account._id)) {
            acc.credit += transaction.amount;
          }

          if (String(transaction.fromAccountId) === String(account._id)) {
            acc.debit += transaction.amount;
          }

          return acc;
        },
        { credit: 0, debit: 0 }
      );

      monthlyFlow.push({
        month: monthStartDate.toLocaleString("en-IN", { month: "short" }),
        credit: totals.credit,
        debit: totals.debit,
      });
    }

    return res.json({
      account: {
        balance: account.balance,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
      },
      recentTransactions,
      monthlyActivity: {
        totalCredit: monthlyTotals.totalCredit,
        totalDebit: monthlyTotals.totalDebit,
        monthlyFlow,
      },
      investments: {
        totalInvested,
        currentValue,
        pnl,
        pnlPercent,
        breakdown: totalInvestedBreakdown,
      },
      insurance: {
        activePolicies: policies.length,
        totalCoverage: policies.reduce(
          (sum, policy) => sum + (policy.coverageAmount || 0),
          0
        ),
        nextExpiry: policies[0]?.endDate || null,
      },
      notifications: {
        unreadCount,
        recent: recentNotifications,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSummary,
};

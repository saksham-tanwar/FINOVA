const Account = require("../models/Account");
const AILog = require("../models/AILog");
const Claim = require("../models/Claim");
const InsurancePolicy = require("../models/InsurancePolicy");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { sendNotification } = require("../services/notificationService");

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const search = req.query.search?.trim();
    const filter = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select("-password -otp -otpExpiry -resetToken -resetTokenExpiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const accounts = await Account.find({
      userId: { $in: users.map((user) => user._id) },
    });

    const accountMap = new Map(
      accounts.map((account) => [String(account.userId), account])
    );

    const enrichedUsers = users.map((user) => ({
      ...user.toObject(),
      account: accountMap.get(String(user._id)) || null,
    }));

    return res.json({
      users: enrichedUsers,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.params.userId });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    account.status = account.status === "frozen" ? "active" : "frozen";
    await account.save();

    const message =
      account.status === "frozen"
        ? "Your account has been frozen by an administrator."
        : "Your account has been reactivated by an administrator.";

    await sendNotification(account.userId, message);

    return res.json({
      message: `Account ${account.status === "frozen" ? "frozen" : "activated"} successfully`,
      newStatus: account.status,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};

      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }

      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .populate("fromAccountId", "accountNumber userId")
        .populate("toAccountId", "accountNumber userId")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      transactions,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllClaims = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [claims, totalCount] = await Promise.all([
      Claim.find(filter)
        .populate("userId", "fullName email")
        .populate("policyId", "policyName type policyNumber")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments(filter),
    ]);

    return res.json({
      claims,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate("userId", "fullName email")
      .populate("policyId", "policyName type policyNumber");

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = req.body.status || claim.status;
    claim.adminRemark = req.body.adminRemark || claim.adminRemark;

    if (["approved", "rejected"].includes(claim.status)) {
      claim.resolvedAt = new Date();
    }

    await claim.save();

    const resolutionMessage = `Your claim for ${claim.policyId?.policyName || "policy"} is now ${claim.status}.`;

    await Promise.all([
      sendNotification(claim.userId._id, resolutionMessage),
      sendNotification(claim.userId._id, resolutionMessage, "email"),
    ]);

    return res.json(claim);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAILogs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [logs, totalCount] = await Promise.all([
      AILog.find({})
        .populate("userId", "fullName email")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AILog.countDocuments({}),
    ]);

    return res.json({
      logs,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const today = getStartOfToday();

    const [
      totalUsers,
      todayTransactions,
      todayVolumeResult,
      activePolicies,
      pendingClaims,
      aiCallsToday,
    ] = await Promise.all([
      User.countDocuments({}),
      Transaction.countDocuments({ timestamp: { $gte: today } }),
      Transaction.aggregate([
        { $match: { timestamp: { $gte: today } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      InsurancePolicy.countDocuments({ status: "active" }),
      Claim.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
      AILog.countDocuments({ timestamp: { $gte: today } }),
    ]);

    return res.json({
      totalUsers,
      todayTransactions,
      todayVolume: todayVolumeResult[0]?.total || 0,
      activePolicies,
      pendingClaims,
      aiCallsToday,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updateUserStatus,
  getAllTransactions,
  getAllClaims,
  updateClaim,
  getAILogs,
  getStats,
};

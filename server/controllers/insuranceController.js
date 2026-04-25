const Account = require("../models/Account");
const Claim = require("../models/Claim");
const InsurancePolicy = require("../models/InsurancePolicy");
const User = require("../models/User");
const insuranceCatalog = require("../utils/insuranceCatalog");
const { sendNotification } = require("../services/notificationService");

const getPlans = async (req, res) => {
  return res.json(insuranceCatalog);
};

const purchasePolicy = async (req, res) => {
  try {
    const plan = insuranceCatalog.find((item) => item.id === req.body.planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.balance < plan.premiumPerMonth) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    account.balance -= plan.premiumPerMonth;
    await account.save();

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const policy = await InsurancePolicy.create({
      userId: req.user.id,
      policyName: plan.name,
      provider: plan.provider,
      policyNumber: `POL-${Date.now()}`,
      type: plan.type,
      premium: plan.premiumPerMonth,
      coverageAmount: plan.coverageAmount,
      endDate,
      status: "active",
    });

    await Promise.all([
      sendNotification(req.user.id, "Policy purchased successfully"),
      sendNotification(req.user.id, "Policy purchased successfully", "email"),
    ]);

    return res.status(201).json(policy);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyPolicies = async (req, res) => {
  try {
    const policies = await InsurancePolicy.find({ userId: req.user.id }).sort({
      startDate: -1,
    });

    return res.json(policies);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPolicyById = async (req, res) => {
  try {
    const policy = await InsurancePolicy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    if (String(policy.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(policy);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const fileClaim = async (req, res) => {
  try {
    const requesterId = req.user?.id || req.body.userId;
    let policy = null;

    if (req.body.policyId) {
      policy = await InsurancePolicy.findById(req.body.policyId);
    } else if (req.body.policyNumber) {
      policy = await InsurancePolicy.findOne({ policyNumber: req.body.policyNumber });
    }

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    if (String(policy.userId) !== String(requesterId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const filePaths = (req.files || []).map((file) => file.path.replace(/\\/g, "/"));

    const claim = await Claim.create({
      userId: requesterId,
      policyId: policy._id,
      claimType: req.body.claimType,
      description: req.body.description,
      documents: filePaths,
      status: "submitted",
    });

    const admins = await User.find({ role: "admin" }).select("_id");

    await sendNotification(requesterId, "Claim submitted successfully");
    await Promise.all(
      admins.map((admin) =>
        sendNotification(admin._id, `New claim submitted for policy ${policy.policyNumber}`)
      )
    );

    return res.status(201).json(claim);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ userId: req.user.id })
      .populate("policyId")
      .sort({ submittedAt: -1 });

    return res.json(claims);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("policyId");

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (String(claim.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(claim);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = req.body.status;
    claim.adminRemark = req.body.adminRemark;

    if (["approved", "rejected"].includes(req.body.status)) {
      claim.resolvedAt = new Date();
    }

    await claim.save();

    const statusMessage = `Your claim has been ${claim.status}`;

    await Promise.all([
      sendNotification(claim.userId, statusMessage),
      sendNotification(claim.userId, statusMessage, "email"),
    ]);

    return res.json(claim);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlans,
  purchasePolicy,
  getMyPolicies,
  getPolicyById,
  fileClaim,
  getMyClaims,
  getClaimById,
  updateClaimStatus,
};

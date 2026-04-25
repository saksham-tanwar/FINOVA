const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InsurancePolicy",
    required: true,
  },
  claimType: {
    type: String,
  },
  description: {
    type: String,
  },
  documents: [
    {
      type: String,
    },
  ],
  status: {
    type: String,
    enum: ["submitted", "under_review", "approved", "rejected"],
    default: "submitted",
  },
  adminRemark: {
    type: String,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
});

module.exports = mongoose.models.Claim || mongoose.model("Claim", ClaimSchema);

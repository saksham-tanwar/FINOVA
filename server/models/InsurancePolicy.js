const mongoose = require("mongoose");

const generatePolicyNumber = () => {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `POL-${digits}`;
};

const InsurancePolicySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  policyName: {
    type: String,
  },
  provider: {
    type: String,
  },
  policyNumber: {
    type: String,
    unique: true,
  },
  type: {
    type: String,
    enum: ["life", "health", "vehicle"],
  },
  premium: {
    type: Number,
  },
  coverageAmount: {
    type: Number,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active",
  },
});

InsurancePolicySchema.pre("save", function preSave(next) {
  if (this.isNew && !this.policyNumber) {
    this.policyNumber = generatePolicyNumber();
  }

  next();
});

module.exports =
  mongoose.models.InsurancePolicy ||
  mongoose.model("InsurancePolicy", InsurancePolicySchema);

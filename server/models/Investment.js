const mongoose = require("mongoose");

const InvestmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["mutual_fund", "fd", "stock"],
    required: true,
  },
  instrumentName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  units: {
    type: Number,
  },
  purchasePrice: {
    type: Number,
  },
  currentPrice: {
    type: Number,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  maturityDate: {
    type: Date,
  },
  sipActive: {
    type: Boolean,
    default: false,
  },
  sipAmount: {
    type: Number,
  },
  sipDay: {
    type: Number,
    min: 1,
    max: 28,
  },
  status: {
    type: String,
    enum: ["active", "redeemed", "matured"],
    default: "active",
  },
});

module.exports =
  mongoose.models.Investment || mongoose.model("Investment", InvestmentSchema);

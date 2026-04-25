const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["NEFT", "RTGS", "IMPS", "credit", "debit"],
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "success",
  },
  description: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);

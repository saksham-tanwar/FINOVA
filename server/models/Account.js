const mongoose = require("mongoose");

const generateAccountNumber = () => {
  let accountNumber = "";

  for (let i = 0; i < 12; i += 1) {
    accountNumber += Math.floor(Math.random() * 10);
  }

  return accountNumber;
};

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accountNumber: {
    type: String,
    unique: true,
  },
  accountType: {
    type: String,
    enum: ["savings", "current"],
    default: "savings",
  },
  balance: {
    type: Number,
    default: 50000,
  },
  ifscCode: {
    type: String,
    default: "BANK0001234",
  },
  status: {
    type: String,
    enum: ["active", "frozen", "closed"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AccountSchema.pre("save", function preSave() {
  if (this.isNew && !this.accountNumber) {
    this.accountNumber = generateAccountNumber();
  }
});

module.exports =
  mongoose.models.Account || mongoose.model("Account", AccountSchema);

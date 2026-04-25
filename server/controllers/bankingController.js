const mongoose = require("mongoose");

const Account = require("../models/Account");
const Beneficiary = require("../models/Beneficiary");
const Transaction = require("../models/Transaction");
const { sendNotification } = require("../services/notificationService");

const createTransferTransactions = async ({
  sender,
  receiver,
  amount,
  transferType,
  description,
  session,
}) =>
  Transaction.create(
    [
      {
        fromAccountId: sender._id,
        toAccountId: receiver._id,
        amount,
        type: "debit",
        description: description || `${transferType} transfer sent`,
        status: "success",
      },
      {
        fromAccountId: sender._id,
        toAccountId: receiver._id,
        amount,
        type: "credit",
        description: description || `${transferType} transfer received`,
        status: "success",
      },
    ],
    session ? { session } : undefined
  );

const isReplicaSetTransactionError = (error) =>
  error?.message?.includes(
    "Transaction numbers are only allowed on a replica set member or mongos"
  );

const getAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.json(account);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.json({
      balance: account.balance,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const transferFunds = async (req, res) => {
  const { accountNumber, amount, transferType, description } = req.body;
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const session = await mongoose.startSession();

  try {
    const sender = await Account.findOne({ userId: req.user.id });

    if (!sender) {
      return res.status(404).json({ message: "Sender account not found" });
    }

    if (sender.balance < parsedAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const receiver = await Account.findOne({ accountNumber });

    if (!receiver) {
      return res.status(404).json({ message: "Receiver account not found" });
    }

    if (String(sender._id) === String(receiver._id)) {
      return res
        .status(400)
        .json({ message: "Sender and receiver cannot be the same" });
    }

    try {
      let createdTransactions = [];

      try {
        session.startTransaction();

        sender.balance -= parsedAmount;
        receiver.balance += parsedAmount;

        await sender.save({ session });
        await receiver.save({ session });

        createdTransactions = await createTransferTransactions({
          sender,
          receiver,
          amount: parsedAmount,
          transferType,
          description,
          session,
        });

        await session.commitTransaction();
      } catch (error) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }

        if (!isReplicaSetTransactionError(error)) {
          throw error;
        }

        const freshSender = await Account.findById(sender._id);
        const freshReceiver = await Account.findById(receiver._id);
        const originalSenderBalance = freshSender.balance;
        const originalReceiverBalance = freshReceiver.balance;

        try {
          freshSender.balance -= parsedAmount;
          freshReceiver.balance += parsedAmount;

          await freshSender.save();
          await freshReceiver.save();

          createdTransactions = await createTransferTransactions({
            sender: freshSender,
            receiver: freshReceiver,
            amount: parsedAmount,
            transferType,
            description,
          });
        } catch (fallbackError) {
          freshSender.balance = originalSenderBalance;
          freshReceiver.balance = originalReceiverBalance;

          await freshSender.save();
          await freshReceiver.save();

          throw fallbackError;
        }
      }

      await sendNotification(
        sender.userId,
        `Debit alert: INR ${parsedAmount.toFixed(2)} transferred to account ${receiver.accountNumber}.`
      );
      await sendNotification(
        receiver.userId,
        `Credit alert: INR ${parsedAmount.toFixed(2)} received from account ${sender.accountNumber}.`
      );

      return res.json({
        message: "Transfer successful",
        transactions: createdTransactions,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } finally {
    session.endSession();
  }
};

const getTransactions = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const filter = {
      $or: [{ fromAccountId: account._id }, { toAccountId: account._id }],
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};

      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }

      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = endDate;
      }
    }

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
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

const addBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.create({
      userId: req.user.id,
      name: req.body.name,
      accountNumber: req.body.accountNumber,
      ifscCode: req.body.ifscCode,
      bankName: req.body.bankName,
    });

    return res.status(201).json(beneficiary);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ userId: req.user.id }).sort({
      addedAt: -1,
    });

    return res.json(beneficiaries);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({ message: "Beneficiary not found" });
    }

    if (String(beneficiary.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await beneficiary.deleteOne();

    return res.json({ message: "Beneficiary deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAccount,
  getBalance,
  transferFunds,
  getTransactions,
  addBeneficiary,
  getBeneficiaries,
  deleteBeneficiary,
};

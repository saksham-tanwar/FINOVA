const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Account = require("./models/Account");
const AILog = require("./models/AILog");
const Claim = require("./models/Claim");
const InsurancePolicy = require("./models/InsurancePolicy");
const Investment = require("./models/Investment");
const Notification = require("./models/Notification");
const Transaction = require("./models/Transaction");
const User = require("./models/User");
const mutualFundCatalog = require("./utils/mutualFundCatalog");

dotenv.config();

const formatDateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const stockTemplates = [
  { symbol: "RELIANCE.BSE", price: 2945.5, units: 8 },
  { symbol: "TCS.BSE", price: 3890.25, units: 5 },
  { symbol: "INFY.BSE", price: 1510.4, units: 14 },
];

const insuranceTemplates = [
  {
    policyName: "HDFC Life Secure Shield",
    provider: "HDFC Life",
    type: "life",
    premium: 2800,
    coverageAmount: 1500000,
  },
  {
    policyName: "Star Health Family Protect",
    provider: "Star Health",
    type: "health",
    premium: 1900,
    coverageAmount: 800000,
  },
  {
    policyName: "ICICI Lombard Motor Protect",
    provider: "ICICI Lombard",
    type: "vehicle",
    premium: 2400,
    coverageAmount: 600000,
  },
];

const notificationTemplates = [
  "Your salary credit has been processed.",
  "A new login was detected on your account.",
  "Your monthly statement is ready to view.",
  "SIP reminder: next debit is scheduled soon.",
  "Insurance policy update available in your dashboard.",
];

const createTransactionsForCustomer = (account, counterpartAccount, count) =>
  Array.from({ length: count }, (_, index) => {
    const isCredit = index % 2 === 0;
    const amount = 2500 + index * 750;
    const timestamp = formatDateOffset(-(count - index));
    const transferTypes = ["credit", "debit", "NEFT", "IMPS", "RTGS"];

    return {
      fromAccountId: isCredit ? counterpartAccount._id : account._id,
      toAccountId: isCredit ? account._id : counterpartAccount._id,
      amount,
      type: transferTypes[index % transferTypes.length],
      status: "success",
      description: isCredit ? "Incoming transfer" : "Outgoing transfer",
      timestamp,
    };
  });

const createInvestmentsForCustomer = (userId, index) => {
  const fundA = mutualFundCatalog[index % mutualFundCatalog.length];
  const fundB = mutualFundCatalog[(index + 3) % mutualFundCatalog.length];
  const stock = stockTemplates[index % stockTemplates.length];

  const fdAmount = [50000, 40000, 70000][index];
  const fdMaturity = new Date();
  fdMaturity.setFullYear(fdMaturity.getFullYear() + 3);

  return [
    {
      userId,
      type: "mutual_fund",
      instrumentName: fundA.name,
      amount: 25000,
      units: Number((25000 / fundA.nav).toFixed(4)),
      purchasePrice: fundA.nav,
      currentPrice: fundA.nav,
      sipActive: true,
      sipAmount: fundA.minSIP,
      sipDay: 5 + index,
      status: "active",
    },
    {
      userId,
      type: "mutual_fund",
      instrumentName: fundB.name,
      amount: 18000,
      units: Number((18000 / fundB.nav).toFixed(4)),
      purchasePrice: fundB.nav,
      currentPrice: fundB.nav,
      status: "active",
    },
    {
      userId,
      type: "fd",
      instrumentName: "3Y Fixed Deposit",
      amount: fdAmount,
      purchasePrice: fdAmount,
      currentPrice: Number((fdAmount * Math.pow(1.07, 3)).toFixed(2)),
      maturityDate: fdMaturity,
      status: "active",
    },
    {
      userId,
      type: "stock",
      instrumentName: stock.symbol,
      amount: Number((stock.price * stock.units).toFixed(2)),
      units: stock.units,
      purchasePrice: stock.price,
      currentPrice: stock.price,
      status: "active",
    },
  ];
};

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Promise.all([
      AILog.deleteMany({}),
      Claim.deleteMany({}),
      InsurancePolicy.deleteMany({}),
      Investment.deleteMany({}),
      Notification.deleteMany({}),
      Transaction.deleteMany({}),
      Account.deleteMany({}),
      User.deleteMany({}),
    ]);

    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const customerPassword = await bcrypt.hash("Test@1234", 10);

    const admin = await User.create({
      fullName: "Admin User",
      email: "admin@bank.com",
      password: adminPassword,
      role: "admin",
      isVerified: true,
      phone: "9999999999",
    });

    const customers = await User.insertMany([
      {
        fullName: "Rahul Sharma",
        email: "customer1@bank.com",
        password: customerPassword,
        role: "customer",
        isVerified: true,
        phone: "9876543210",
        panNumber: "ABCDE1234F",
        aadharNumber: "111122223333",
      },
      {
        fullName: "Priya Nair",
        email: "customer2@bank.com",
        password: customerPassword,
        role: "customer",
        isVerified: true,
        phone: "9876501234",
        panNumber: "PQRSN1234K",
        aadharNumber: "444455556666",
      },
      {
        fullName: "Arjun Mehta",
        email: "customer3@bank.com",
        password: customerPassword,
        role: "customer",
        isVerified: true,
        phone: "9812345678",
        panNumber: "LMNOP1234Q",
        aadharNumber: "777788889999",
      },
    ]);

    const accounts = await Account.insertMany([
      {
        userId: customers[0]._id,
        accountNumber: "710000000001",
        balance: 150000,
        accountType: "savings",
        status: "active",
      },
      {
        userId: customers[1]._id,
        accountNumber: "710000000002",
        balance: 75000,
        accountType: "savings",
        status: "active",
      },
      {
        userId: customers[2]._id,
        accountNumber: "710000000003",
        balance: 220000,
        accountType: "current",
        status: "active",
      },
    ]);

    const allTransactions = [
      ...createTransactionsForCustomer(accounts[0], accounts[1], 10),
      ...createTransactionsForCustomer(accounts[1], accounts[2], 10),
      ...createTransactionsForCustomer(accounts[2], accounts[0], 10),
    ];
    await Transaction.insertMany(allTransactions);

    const investments = customers.flatMap((customer, index) =>
      createInvestmentsForCustomer(customer._id, index)
    );
    await Investment.insertMany(investments);

    const policies = await InsurancePolicy.insertMany(
      customers.map((customer, index) => {
        const template = insuranceTemplates[index];
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        return {
          userId: customer._id,
          policyName: template.policyName,
          provider: template.provider,
          policyNumber: `POL-${Date.now() + index}`,
          type: template.type,
          premium: template.premium,
          coverageAmount: template.coverageAmount,
          endDate,
          status: "active",
        };
      })
    );

    await Claim.create({
      userId: customers[0]._id,
      policyId: policies[0]._id,
      claimType: "Hospitalization reimbursement",
      description: "Claim submitted for emergency hospitalization expenses.",
      documents: [],
      status: "submitted",
    });

    await Notification.insertMany(
      customers.flatMap((customer) =>
        notificationTemplates.map((message, index) => ({
          userId: customer._id,
          message,
          type: "in-app",
          isRead: index % 3 === 0,
          createdAt: formatDateOffset(-index),
        }))
      )
    );

    await AILog.insertMany([
      {
        userId: customers[0]._id,
        agentType: "chatbot",
        inputSummary: "Asked how to create a fixed deposit",
        outputSummary: "Provided FD creation steps and rate guidance",
        actionTaken: "Directed user to FD dashboard tab",
      },
      {
        userId: customers[1]._id,
        agentType: "email",
        inputSummary: "Insurance claim request email analyzed",
        outputSummary: "Detected claim filing intent with moderate confidence",
        actionTaken: "Suggested filing a claim with supporting documents",
      },
      {
        userId: admin._id,
        agentType: "recommendation",
        inputSummary: "Requested medium-risk investment ideas",
        outputSummary: "Returned three diversified mutual fund suggestions",
        actionTaken: "Displayed mutual fund recommendation cards",
      },
    ]);

    console.log("Seed complete");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

runSeed();

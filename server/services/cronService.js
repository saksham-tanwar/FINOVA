const cron = require("node-cron");

const Account = require("../models/Account");
const InsurancePolicy = require("../models/InsurancePolicy");
const Investment = require("../models/Investment");
const mutualFundCatalog = require("../utils/mutualFundCatalog");
const { sendNotification } = require("./notificationService");

const startCronJobs = () => {
  cron.schedule("0 8 * * *", async () => {
    const sipInvestments = await Investment.find({
      sipActive: true,
      status: "active",
      type: "mutual_fund",
    });

    for (const investment of sipInvestments) {
      const today = new Date().getDate();

      if (investment.sipDay !== today) {
        continue;
      }

      const account = await Account.findOne({ userId: investment.userId });
      const fund = mutualFundCatalog.find(
        (item) => item.name === investment.instrumentName
      );

      if (!account || !fund || !investment.sipAmount) {
        continue;
      }

      if (account.balance < investment.sipAmount) {
        await sendNotification(
          investment.userId,
          `Low balance alert: SIP for ${investment.instrumentName} could not be processed due to insufficient funds.`
        );
        continue;
      }

      const additionalUnits = Number((investment.sipAmount / fund.nav).toFixed(4));

      account.balance -= investment.sipAmount;
      investment.amount += investment.sipAmount;
      investment.units = Number(((investment.units || 0) + additionalUnits).toFixed(4));
      investment.currentPrice = fund.nav;

      await account.save();
      await investment.save();
    }
  });

  cron.schedule("0 9 * * *", async () => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const upcomingFds = await Investment.find({
      type: "fd",
      status: "active",
      maturityDate: { $gte: now, $lte: nextWeek },
    });

    for (const fd of upcomingFds) {
      await sendNotification(
        fd.userId,
        `${fd.instrumentName} is nearing maturity on ${fd.maturityDate.toDateString()}.`,
        "email"
      );
    }
  });

  cron.schedule("0 10 * * *", async () => {
    const lowBalanceAccounts = await Account.find({ balance: { $lt: 1000 } });

    for (const account of lowBalanceAccounts) {
      await sendNotification(account.userId, "Low balance alert");
    }
  });
};

module.exports = {
  startCronJobs,
};

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import { SkeletonCardGrid } from "../../components/LoadingSkeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

function Banking() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBankingData = async () => {
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        )
          .toISOString()
          .split("T")[0];

        const [accountRes, transactionRes] = await Promise.all([
          axiosInstance.get("/banking/account"),
          axiosInstance.get("/banking/transactions", {
            params: {
              page: 1,
              limit: 100,
              startDate: startOfMonth,
              endDate: endOfMonth,
            },
          }),
        ]);

        setAccount(accountRes.data);
        setTransactions(transactionRes.data.transactions);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load account");
      } finally {
        setLoading(false);
      }
    };

    fetchBankingData();
  }, []);

  const stats = useMemo(() => {
    if (!account) {
      return { totalCredit: 0, totalDebit: 0 };
    }

    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.toAccountId === account._id) {
          acc.totalCredit += transaction.amount;
        }

        if (transaction.fromAccountId === account._id) {
          acc.totalDebit += transaction.amount;
        }

        return acc;
      },
      { totalCredit: 0, totalDebit: 0 }
    );
  }, [account, transactions]);

  if (loading) {
    return <SkeletonCardGrid cards={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-wide text-cyan-400">
            Primary Account
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {formatCurrency(account?.balance)}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Account Number
              </p>
              <p className="mt-2 text-lg text-slate-200">
                {account?.accountNumber}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Account Type
              </p>
              <p className="mt-2 text-lg capitalize text-slate-200">
                {account?.accountType}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Total Credit This Month</p>
          <p className="mt-4 text-2xl font-semibold text-emerald-400">
            {formatCurrency(stats.totalCredit)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Total Debit This Month</p>
          <p className="mt-4 text-2xl font-semibold text-rose-400">
            {formatCurrency(stats.totalDebit)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Banking;

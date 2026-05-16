import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import { SkeletonCardGrid } from "../../components/LoadingSkeleton";

const transferTypes = ["NEFT", "RTGS", "IMPS"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const maskAccountNumber = (accountNumber = "") => {
  const lastFour = accountNumber.slice(-4);
  return `**** **** **** ${lastFour}`;
};

const getTransactionDirection = (transaction, accountId) => {
  const senderId =
    typeof transaction.fromAccountId === "object"
      ? transaction.fromAccountId?._id
      : transaction.fromAccountId;
  const receiverId =
    typeof transaction.toAccountId === "object"
      ? transaction.toAccountId?._id
      : transaction.toAccountId;

  if (String(receiverId || "") === String(accountId || "")) {
    return "credit";
  }

  if (String(senderId || "") === String(accountId || "")) {
    return "debit";
  }

  return transaction.type;
};

const getCounterpartyAccountNumber = (transaction, direction) => {
  if (direction === "credit") {
    return transaction.fromAccountId?.accountNumber || "";
  }

  if (direction === "debit") {
    return transaction.toAccountId?.accountNumber || "";
  }

  return "";
};

const getCategoryKey = (description = "") => {
  const normalized = description.toLowerCase();

  if (normalized.includes("transfer")) return "transfer";
  if (normalized.includes("salary") || normalized.includes("credit")) return "salary";
  if (normalized.includes("insurance") || normalized.includes("premium")) return "insurance";
  if (normalized.includes("investment") || normalized.includes("fund")) return "investment";
  return "default";
};

const iconClassName = "h-4 w-4";

const categoryIcons = {
  transfer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M4 7h11m0 0-3.5-3.5M15 7l-3.5 3.5M20 17H9m0 0 3.5-3.5M9 17l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  salary: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M5 8.5h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5M12 11v4m-2-2h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  insurance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M12 3 5 6v5c0 4.3 2.7 8.2 7 10 4.3-1.8 7-5.7 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.5 12 1.7 1.7 3.3-3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  investment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M4 19h16M7 16V9m5 7V5m5 11v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconClassName}>
      <circle cx="12" cy="12" r="5" />
    </svg>
  ),
};

const shortcutIcons = {
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M5 12h11m0 0-4-4m4 4-4 4M19 5v14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  request: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M19 12H8m0 0 4-4m-4 4 4 4M5 5v14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bills: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M7 4h10v16l-2-1.5L13 20l-2-1.5L9 20l-2-1.5L5 20V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9h6M9 13h4" strokeLinecap="round" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 4v5h5M20 12a8 8 0 1 1-2.3-5.7L20 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Banking() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("5000");
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [revealAccountNumber, setRevealAccountNumber] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [transferForm, setTransferForm] = useState({
    accountNumber: "",
    amount: "",
    transferType: "NEFT",
    description: "",
  });

  const transactionsSectionRef = useRef(null);

  const fetchBankingData = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
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
      setTransactions(transactionRes.data.transactions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingData();
  }, []);

  const monthlySummary = useMemo(() => {
    if (!account) {
      return {
        totalCredit: 0,
        totalDebit: 0,
        netChange: 0,
        largestTransaction: null,
        transactionCount: 0,
      };
    }

    return transactions.reduce(
      (acc, transaction) => {
        const direction = getTransactionDirection(transaction, account._id);
        const amount = Number(transaction.amount || 0);

        if (direction === "credit") {
          acc.totalCredit += amount;
        }

        if (direction === "debit") {
          acc.totalDebit += amount;
        }

        if (!acc.largestTransaction || amount > acc.largestTransaction.amount) {
          acc.largestTransaction = transaction;
        }

        acc.transactionCount += 1;
        return acc;
      },
      {
        totalCredit: 0,
        totalDebit: 0,
        netChange: 0,
        largestTransaction: null,
        transactionCount: 0,
      }
    );
  }, [account, transactions]);

  const computedSummary = useMemo(
    () => ({
      ...monthlySummary,
      netChange: monthlySummary.totalCredit - monthlySummary.totalDebit,
    }),
    [monthlySummary]
  );

  const remainingBalance = useMemo(() => {
    const amount = Number(transferForm.amount);

    if (!Number.isFinite(amount)) {
      return Number(account?.balance || 0);
    }

    return Number(account?.balance || 0) - amount;
  }, [account?.balance, transferForm.amount]);

  const recentRecipients = useMemo(() => {
    if (!account?._id) return [];

    const unique = new Map();

    transactions.forEach((transaction) => {
      const direction = getTransactionDirection(transaction, account._id);

      if (direction !== "debit") {
        return;
      }

      const accountNumber = getCounterpartyAccountNumber(transaction, direction);

      if (!accountNumber || unique.has(accountNumber)) {
        return;
      }

      unique.set(accountNumber, {
        accountNumber,
        description: transaction.description,
      });
    });

    return Array.from(unique.values()).slice(0, 3);
  }, [account?._id, transactions]);

  const handleTopUp = async () => {
    const parsedAmount = Number(topUpAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid top-up amount");
      return;
    }

    setTopUpSubmitting(true);

    try {
      const { data } = await axiosInstance.post("/banking/top-up", {
        amount: parsedAmount,
      });
      setAccount(data.account);
      setTransactions((prev) => [data.transaction, ...prev]);
      toast.success(data.message || "Balance added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add demo balance");
    } finally {
      setTopUpSubmitting(false);
    }
  };

  const handleTransferChange = (event) => {
    setTransferForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();

    const parsedAmount = Number(transferForm.amount);

    if (!transferForm.accountNumber || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter account number and a valid amount");
      return;
    }

    if (parsedAmount > Number(account?.balance || 0)) {
      toast.error("Amount exceeds available balance");
      return;
    }

    setTransferSubmitting(true);

    try {
      const { data } = await axiosInstance.post("/banking/transfer", {
        accountNumber: transferForm.accountNumber,
        amount: parsedAmount,
        transferType: transferForm.transferType,
        description: transferForm.description,
      });

      const debitTransaction = (data.transactions || []).find(
        (transaction) => transaction.type === "debit"
      );
      const timestamp = debitTransaction?.timestamp || new Date().toISOString();
      const reference = debitTransaction?._id
        ? `TXN-${String(debitTransaction._id).slice(-8).toUpperCase()}`
        : `TXN-${Date.now()}`;

      setReceipt({
        amount: parsedAmount,
        receiverAccount: transferForm.accountNumber,
        transferType: transferForm.transferType,
        timestamp,
        reference,
      });

      setTransferForm({
        accountNumber: "",
        amount: "",
        transferType: "NEFT",
        description: "",
      });

      setTransferModalOpen(false);
      toast.success("Transfer successful");
      await fetchBankingData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleCopyAccountDetails = async () => {
    try {
      await navigator.clipboard.writeText(
        `Account Number: ${account.accountNumber}\nIFSC: ${account.ifscCode}\nAccount Type: ${account.accountType}`
      );
      toast.success("Share account details copied");
    } catch (error) {
      toast.error("Unable to copy account details");
    }
  };

  const handleDownloadStatement = () => {
    if (!transactions.length) {
      toast.error("No transactions available to export");
      return;
    }

    const header = "timestamp,description,amount,type";
    const csv = [header]
      .concat(
        transactions.map(
          (transaction) =>
            `${transaction.timestamp},${JSON.stringify(
              transaction.description || ""
            )},${transaction.amount},${transaction.type}`
        )
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "finova-statement.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <SkeletonCardGrid cards={4} />;
  }

  return (
    <div className="page-enter space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-[0_30px_60px_-30px_rgba(8,145,178,0.45)]">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-8 top-0 h-28 w-40 rotate-12 bg-white/10 blur-2xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_40%),linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.06)_45%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px]" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
                  Finova Premium Banking
                </p>
                <div className="mt-5">
                  <p className="text-sm text-slate-300">Available Balance</p>
                  <h2 className="mt-2 text-4xl font-semibold text-white md:text-5xl">
                    {formatCurrency(account?.balance)}
                  </h2>
                </div>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium capitalize text-cyan-200">
                {account?.accountType}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Account Number</p>
                <p className="mt-2 text-2xl font-medium tracking-[0.18em] text-white">
                  {revealAccountNumber
                    ? account?.accountNumber
                    : maskAccountNumber(account?.accountNumber)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevealAccountNumber((prev) => !prev)}
                className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600/70 bg-slate-900/60 text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
                aria-label={revealAccountNumber ? "Hide account number" : "Reveal account number"}
              >
                {revealAccountNumber ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M4 4 20 20" strokeLinecap="round" />
                    <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" strokeLinecap="round" />
                    <path d="M9.4 5.5A11 11 0 0 1 12 5c5.5 0 9.3 4.2 10 7-.3 1.2-1.3 2.9-2.9 4.4M6.1 8.2C4.7 9.3 3.7 10.7 3 12c.5 2 2.7 5 6.1 6.4A10.7 10.7 0 0 0 12 19c1 0 2-.1 2.9-.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">IFSC Code</p>
                <p className="mt-2 text-sm font-medium tracking-[0.12em] text-slate-200">
                  {account?.ifscCode}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Add Demo Balance</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={topUpAmount}
                    onChange={(event) => setTopUpAmount(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTopUp}
                    disabled={topUpSubmitting}
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {topUpSubmitting ? "Adding..." : "Add Demo Funds"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-wide text-cyan-400">This Month&apos;s Summary</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-200">Total Money In</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {formatCurrency(computedSummary.totalCredit)}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-sm text-rose-200">Total Money Out</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">
                {formatCurrency(computedSummary.totalDebit)}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-sm text-cyan-200">Net Change</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">
                {formatCurrency(computedSummary.netChange)}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Largest transaction</p>
              <p className="mt-1 font-medium text-white">
                {computedSummary.largestTransaction
                  ? `${formatCurrency(computedSummary.largestTransaction.amount)} • ${
                      computedSummary.largestTransaction.description || "No description"
                    }`
                  : "No transactions this month"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Transactions this month</p>
              <p className="mt-1 font-medium text-white">{computedSummary.transactionCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setTransferModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
        >
          {shortcutIcons.send}
          Send Money
        </button>
        <button
          type="button"
          onClick={handleCopyAccountDetails}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
        >
          {shortcutIcons.request}
          Request Money
        </button>
        <button
          type="button"
          onClick={() => toast("Coming Soon", { icon: "⏳" })}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
        >
          {shortcutIcons.bills}
          Pay Bills
        </button>
        <button
          type="button"
          onClick={() => transactionsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
        >
          {shortcutIcons.history}
          Transaction History
        </button>
      </div>

      {receipt ? (
        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Transfer Receipt</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {formatCurrency(receipt.amount)}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Receiver</p>
              <p className="mt-1 text-sm text-white">{receipt.receiverAccount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Transfer Type</p>
              <p className="mt-1 text-sm text-white">{receipt.transferType}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Timestamp</p>
              <p className="mt-1 text-sm text-white">
                {new Date(receipt.timestamp).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Reference</p>
              <p className="mt-1 text-sm text-white">{receipt.reference}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={transactionsSectionRef} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-400">Recent Transactions</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Activity this month</h3>
          </div>
          <button
            type="button"
            onClick={handleDownloadStatement}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            Download Statement
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
          {transactions.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {transactions.slice(0, 12).map((transaction) => {
                const direction = getTransactionDirection(transaction, account?._id);
                const counterpartyAccount = getCounterpartyAccountNumber(transaction, direction);
                const categoryKey = getCategoryKey(transaction.description);

                return (
                  <div
                    key={transaction._id}
                    className="flex flex-col gap-4 bg-slate-950 px-5 py-4 transition hover:bg-slate-900/80 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-cyan-300">
                        {categoryIcons[categoryKey]}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {transaction.description || "Banking transaction"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {counterpartyAccount
                            ? `${direction === "credit" ? "From" : "To"} ${counterpartyAccount}`
                            : "Internal account movement"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 lg:justify-end">
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            direction === "credit" ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          {direction === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(transaction.timestamp).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          direction === "credit"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {direction}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-950 px-6 py-10 text-sm text-slate-400">
              No transactions found for this month yet.
            </div>
          )}
        </div>
      </div>

      {transferModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-cyan-400">Quick Transfer</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Send money instantly</h3>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Receiver account number"
                  value={transferForm.accountNumber}
                  onChange={handleTransferChange}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                  required
                />
                <select
                  name="transferType"
                  value={transferForm.transferType}
                  onChange={handleTransferChange}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                >
                  {transferTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {recentRecipients.length > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Recent Recipients</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recentRecipients.map((recipient) => (
                      <button
                        key={recipient.accountNumber}
                        type="button"
                        onClick={() =>
                          setTransferForm((prev) => ({
                            ...prev,
                            accountNumber: recipient.accountNumber,
                          }))
                        }
                        className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
                      >
                        {recipient.accountNumber}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <input
                  type="number"
                  name="amount"
                  min="1"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={handleTransferChange}
                  placeholder="Amount"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                  required
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-400">
                    Remaining balance after transfer:{" "}
                    <span className={remainingBalance < 0 ? "text-rose-300" : "text-cyan-300"}>
                      {formatCurrency(remainingBalance)}
                    </span>
                  </span>
                  {remainingBalance < 0 ? (
                    <span className="text-rose-300">Amount exceeds available balance</span>
                  ) : null}
                </div>
              </div>

              <textarea
                name="description"
                value={transferForm.description}
                onChange={handleTransferChange}
                placeholder="Description"
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={transferSubmitting || remainingBalance < 0}
                  className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {transferSubmitting ? "Processing..." : "Transfer Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Banking;

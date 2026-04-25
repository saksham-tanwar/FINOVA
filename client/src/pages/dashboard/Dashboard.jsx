import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonCardGrid, SkeletonTable } from "../../components/LoadingSkeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const quickActions = [
  { label: "Transfer", to: "/dashboard/transfer" },
  { label: "Invest", to: "/dashboard/investments" },
  { label: "File Claim", to: "/dashboard/insurance" },
  { label: "AI Agent", to: "/dashboard/ai-agent" },
];

const pieColors = ["#22d3ee", "#34d399", "#f59e0b"];

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await axiosInstance.get("/dashboard/summary");
        setSummary(data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const pieData = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      { name: "Stocks", value: summary.investments.breakdown.stocks },
      { name: "Mutual Funds", value: summary.investments.breakdown.mutual_fund },
      { name: "FD", value: summary.investments.breakdown.fd },
    ].filter((item) => item.value > 0);
  }, [summary]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCardGrid cards={4} />
        <SkeletonCardGrid cards={2} />
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (!summary) {
    return (
      <EmptyState
        icon="[]"
        title="Dashboard unavailable"
        description="We couldn't load your summary right now. Refresh and try again."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total Balance</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(summary.account.balance)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total Invested</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(summary.investments.totalInvested)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Insurance Coverage</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(summary.insurance.totalCoverage)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Portfolio P&amp;L</p>
          <p
            className={`mt-3 text-2xl font-semibold ${
              summary.investments.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {summary.investments.pnl >= 0 ? "+" : "-"}{" "}
            {formatCurrency(Math.abs(summary.investments.pnl))}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {summary.investments.pnlPercent}% overall
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Investment Breakdown</h3>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Monthly Credit vs Debit</h3>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyActivity.monthlyFlow}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="credit" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debit" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-t border-slate-800">
                    <td className="px-4 py-4">
                      {new Date(transaction.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4">
                      {transaction.description || "Fund transfer"}
                    </td>
                    <td className="px-4 py-4 capitalize">{transaction.type}</td>
                    <td className="px-4 py-4">{formatCurrency(transaction.amount)}</td>
                  </tr>
                ))}
                {summary.recentTransactions.length === 0 ? null : null}
              </tbody>
            </table>
          </div>
          {summary.recentTransactions.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon="->"
                title="No recent transactions"
                description="Your latest movement will show up here once you start using the account."
                actionLabel="Make your first transfer"
                actionTo="/dashboard/transfer"
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="rounded-md border border-slate-700 px-4 py-4 text-sm text-slate-200 hover:bg-slate-800"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

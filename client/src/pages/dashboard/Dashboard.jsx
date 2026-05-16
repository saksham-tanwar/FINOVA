import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const pieColors = ["#3b82f6", "#06b6d4", "#10b981"];

const metricConfig = [
  {
    key: "balance",
    label: "Total Balance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-24 w-24">
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="M16 12h.01" strokeLinecap="round" />
      </svg>
    ),
    panelClass: "from-blue-500/20 to-sky-500/5",
  },
  {
    key: "invested",
    label: "Total Invested",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-24 w-24">
        <path d="M4 19h16M7 16V9m5 7V5m5 11v-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    panelClass: "from-violet-500/20 to-fuchsia-500/5",
  },
  {
    key: "coverage",
    label: "Insurance Coverage",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-24 w-24">
        <path d="M12 3 5 6v5c0 4.3 2.7 8.2 7 10 4.3-1.8 7-5.7 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    panelClass: "from-cyan-500/20 to-teal-500/5",
  },
  {
    key: "pnl",
    label: "Portfolio P&L",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-24 w-24">
        <path d="M4 17 10 11l4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 7v4h-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    panelClass: "from-emerald-500/20 to-emerald-500/5",
    negativePanelClass: "from-rose-500/20 to-rose-500/5",
  },
];

const animateValue = (start, end, duration, setter) => {
  const range = end - start;
  const startTime = performance.now();

  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    setter(Math.floor(start + range * progress));
    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedMetrics, setAnimatedMetrics] = useState({
    balance: 0,
    invested: 0,
    coverage: 0,
    pnl: 0,
  });

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

  useEffect(() => {
    if (!summary) return;

    animateValue(0, Math.round(summary.account.balance || 0), 700, (value) =>
      setAnimatedMetrics((prev) => ({ ...prev, balance: value }))
    );
    animateValue(0, Math.round(summary.investments.totalInvested || 0), 750, (value) =>
      setAnimatedMetrics((prev) => ({ ...prev, invested: value }))
    );
    animateValue(0, Math.round(summary.insurance.totalCoverage || 0), 800, (value) =>
      setAnimatedMetrics((prev) => ({ ...prev, coverage: value }))
    );
    animateValue(0, Math.round(Math.abs(summary.investments.pnl || 0)), 850, (value) =>
      setAnimatedMetrics((prev) => ({ ...prev, pnl: value }))
    );
  }, [summary]);

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Stocks", value: summary.investments.breakdown.stocks },
      { name: "Mutual Funds", value: summary.investments.breakdown.mutual_fund },
      { name: "FD", value: summary.investments.breakdown.fd },
    ].filter((item) => item.value > 0);
  }, [summary]);

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <SkeletonCardGrid cards={4} />
        <SkeletonCardGrid cards={2} />
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="page-enter">
        <EmptyState
          icon="[]"
          title="Dashboard unavailable"
          description="We couldn't load your summary right now. Refresh and try again."
        />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {metricConfig.map((metric) => {
          const isPnl = metric.key === "pnl";
          const metricValue = animatedMetrics[metric.key];
          const isNegativePnl = isPnl && summary.investments.pnl < 0;
          const pnlColor = summary.investments.pnl >= 0 ? "text-emerald-300" : "text-rose-300";

          return (
            <div
              key={metric.key}
              className={`card-hover relative overflow-hidden rounded-3xl border border-banking-border bg-gradient-to-br ${
                isNegativePnl ? metric.negativePanelClass : metric.panelClass
              } from-0% to-100% p-5`}
            >
              <div className="absolute -right-5 top-1 text-white/5">{metric.icon}</div>
              <p className="relative z-10 text-sm text-slate-400">{metric.label}</p>
              <p
                className={`relative z-10 mt-5 text-3xl font-semibold ${
                  metric.key === "balance" ? "balance-glow text-white" : isPnl ? pnlColor : "text-white"
                }`}
              >
                {isPnl && summary.investments.pnl < 0 ? "-" : ""}
                {formatCurrency(metricValue)}
              </p>
              {isPnl ? (
                <p className="relative z-10 mt-2 text-sm text-slate-400">
                  {summary.investments.pnlPercent}% overall
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="fin-card card-hover p-6">
          <h3 className="text-lg font-semibold text-white">Investment Breakdown</h3>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a2235",
                    borderColor: "#3b82f6",
                    borderRadius: "14px",
                    color: "#f1f5f9",
                  }}
                />
                <Legend wrapperStyle={{ color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fin-card card-hover p-6">
          <h3 className="text-lg font-semibold text-white">Monthly Credit vs Debit</h3>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyActivity.monthlyFlow}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: "#1a2235",
                    borderColor: "#3b82f6",
                    borderRadius: "14px",
                    color: "#f1f5f9",
                  }}
                />
                <Legend wrapperStyle={{ color: "#94a3b8" }} />
                <Bar dataKey="credit" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="debit" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <div className="fin-card p-6">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-[#101726] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-t border-banking-border hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      {new Date(transaction.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4">{transaction.description || "Fund transfer"}</td>
                    <td className="px-4 py-4 capitalize">{transaction.type}</td>
                    <td className="px-4 py-4">{formatCurrency(transaction.amount)}</td>
                  </tr>
                ))}
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

        <div className="fin-card p-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="secondary-button justify-start">
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

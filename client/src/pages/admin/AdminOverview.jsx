import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import { SkeletonCardGrid } from "../../components/LoadingSkeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const quickLinks = [
  { label: "Manage Users", to: "/admin/users" },
  { label: "Review Transactions", to: "/admin/transactions" },
  { label: "Review Claims", to: "/admin/claims" },
  { label: "Inspect AI Logs", to: "/admin/ai-logs" },
];

function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axiosInstance.get("/admin/stats");
        setStats(data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load admin stats");
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return <SkeletonCardGrid cards={5} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-rose-400">Admin Overview</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Operations snapshot</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-slate-900 bg-slate-950 p-5">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.totalUsers}</p>
        </div>
        <div className="rounded-lg border border-slate-900 bg-slate-950 p-5">
          <p className="text-sm text-slate-500">Today&apos;s Transactions</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.todayTransactions}</p>
        </div>
        <div className="rounded-lg border border-slate-900 bg-slate-950 p-5">
          <p className="text-sm text-slate-500">Today&apos;s Volume</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatCurrency(stats.todayVolume)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-900 bg-slate-950 p-5">
          <p className="text-sm text-slate-500">Pending Claims</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.pendingClaims}</p>
        </div>
        <div className="rounded-lg border border-slate-900 bg-slate-950 p-5">
          <p className="text-sm text-slate-500">AI Calls Today</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.aiCallsToday}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-900 bg-slate-950 p-6">
        <h3 className="text-lg font-semibold text-white">Quick Links</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md border border-slate-800 px-4 py-4 text-sm text-slate-200 hover:bg-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;

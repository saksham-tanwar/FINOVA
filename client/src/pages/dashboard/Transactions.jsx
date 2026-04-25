import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonTable } from "../../components/LoadingSkeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

function Transactions() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: "",
    startDate: "",
    endDate: "",
  });

  const fetchTransactions = async (currentFilters = filters) => {
    try {
      const [accountRes, transactionRes] = await Promise.all([
        axiosInstance.get("/banking/account"),
        axiosInstance.get("/banking/transactions", {
          params: currentFilters,
        }),
      ]);
      setAccount(accountRes.data);
      setTransactions(transactionRes.data.transactions);
      setPageInfo({
        page: transactionRes.data.page,
        totalPages: transactionRes.data.totalPages,
        totalCount: transactionRes.data.totalCount,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleFilterChange = (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value,
      page: 1,
    };
    setFilters(nextFilters);
    fetchTransactions(nextFilters);
  };

  const goToPage = (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    fetchTransactions(nextFilters);
  };

  const rows = useMemo(
    () =>
      transactions.map((transaction) => {
        const isCredit = transaction.toAccountId === account?._id;
        return {
          ...transaction,
          isCredit,
        };
      }),
    [transactions, account]
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : null}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          >
            <option value="">All types</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="IMPS">IMPS</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          />
          <div className="rounded-md border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
            {pageInfo.totalCount} transactions
          </div>
        </div>
      </div>

      <div className={`overflow-hidden rounded-lg border border-slate-800 bg-slate-900 ${loading ? "hidden" : ""}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((transaction) => (
                <tr key={transaction._id} className="border-t border-slate-800">
                  <td className="px-4 py-4">{formatDate(transaction.timestamp)}</td>
                  <td className="px-4 py-4">
                    {transaction.description || "Fund transfer"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                      {transaction.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-4 font-medium ${
                      transaction.isCredit ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {transaction.isCredit ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-200">
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? null : null}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="->"
              title="No transactions yet"
              description="Once money starts moving, your full transaction history will appear here."
              actionLabel="Make your first transfer"
              actionTo="/dashboard/transfer"
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-4 text-sm text-slate-400">
          <span>
            Page {pageInfo.page} of {pageInfo.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToPage(Math.max(pageInfo.page - 1, 1))}
              disabled={pageInfo.page === 1}
              className="rounded-md border border-slate-700 px-4 py-2 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => goToPage(Math.min(pageInfo.page + 1, pageInfo.totalPages))}
              disabled={pageInfo.page === pageInfo.totalPages}
              className="rounded-md border border-slate-700 px-4 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transactions;

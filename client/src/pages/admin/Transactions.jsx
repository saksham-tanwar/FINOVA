import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async (nextPage = page, nextFilters = filters) => {
    try {
      const { data } = await axiosInstance.get("/admin/transactions", {
        params: { page: nextPage, limit: 10, ...nextFilters },
      });
      setTransactions(data.transactions);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load transactions");
    }
  };

  useEffect(() => {
    fetchTransactions(1, filters);
  }, []);

  const handleFilterChange = (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value,
    };
    setFilters(nextFilters);
  };

  const applyFilters = () => {
    fetchTransactions(1, filters);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-rose-400">Admin Transactions</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Transaction monitor</h2>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-900 bg-slate-950 p-4 md:grid-cols-5">
        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-800 bg-black px-4 py-3 text-sm text-white"
        >
          <option value="">All types</option>
          <option value="NEFT">NEFT</option>
          <option value="RTGS">RTGS</option>
          <option value="IMPS">IMPS</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-800 bg-black px-4 py-3 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-800 bg-black px-4 py-3 text-sm text-white"
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-800 bg-black px-4 py-3 text-sm text-white"
        />
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-md bg-rose-500 px-4 py-3 text-sm font-medium text-black"
        >
          Apply Filters
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-900 bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-black text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="border-t border-slate-900">
                  <td className="px-4 py-4">
                    {new Date(transaction.timestamp).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4">
                    {transaction.fromAccountId?.accountNumber || "-"}
                  </td>
                  <td className="px-4 py-4">{transaction.toAccountId?.accountNumber || "-"}</td>
                  <td className="px-4 py-4 capitalize">{transaction.type}</td>
                  <td className="px-4 py-4 capitalize">{transaction.status}</td>
                  <td className="px-4 py-4">{formatCurrency(transaction.amount)}</td>
                </tr>
              ))}
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <button
          type="button"
          onClick={() => fetchTransactions(page - 1, filters)}
          disabled={page === 1}
          className="rounded-md border border-slate-800 px-4 py-2 disabled:opacity-40"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => fetchTransactions(page + 1, filters)}
          disabled={page === totalPages}
          className="rounded-md border border-slate-800 px-4 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Transactions;

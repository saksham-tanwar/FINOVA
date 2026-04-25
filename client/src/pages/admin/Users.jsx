import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonTable } from "../../components/LoadingSkeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function Users() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (nextPage = page, nextSearch = appliedSearch) => {
    try {
      const { data } = await axiosInstance.get("/admin/users", {
        params: { page: nextPage, limit: 10, search: nextSearch || undefined },
      });
      setUsers(data.users);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, appliedSearch);
  }, [appliedSearch]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleToggleStatus = async (event, user) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to ${user.account?.status === "frozen" ? "unfreeze" : "freeze"} this account?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const { data } = await axiosInstance.put(`/admin/users/${user._id}/status`);
      toast.success(data.message);
      fetchUsers(page, appliedSearch);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update account");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-rose-400">Admin Users</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">User directory</h2>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-rose-500 px-4 py-3 text-sm font-medium text-black"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-900 bg-slate-950">
        {loading ? <div className="p-4"><SkeletonTable rows={6} columns={6} /></div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-black text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Account Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isExpanded = expandedUserId === user._id;
                const accountStatus = user.account?.status || "unavailable";

                return (
                  <Fragment key={user._id}>
                    <tr
                      className="cursor-pointer border-t border-slate-900 hover:bg-slate-900/50"
                      onClick={() =>
                        setExpandedUserId((prev) => (prev === user._id ? null : user._id))
                      }
                    >
                      <td className="px-4 py-4">{user.fullName}</td>
                      <td className="px-4 py-4">{user.email}</td>
                      <td className="px-4 py-4 capitalize">{user.role}</td>
                      <td className="px-4 py-4">
                        {user.account ? formatCurrency(user.account.balance) : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            accountStatus === "active"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {accountStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={(event) => handleToggleStatus(event, user)}
                          disabled={!user.account}
                          className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
                        >
                          {accountStatus === "frozen" ? "Unfreeze" : "Freeze"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="border-t border-slate-900 bg-black/40">
                        <td colSpan="6" className="px-4 py-4">
                          <div className="grid gap-3 md:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Phone
                              </p>
                              <p className="mt-1 text-sm text-slate-200">{user.phone || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Verified
                              </p>
                              <p className="mt-1 text-sm text-slate-200">
                                {user.isVerified ? "Yes" : "No"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Created
                              </p>
                              <p className="mt-1 text-sm text-slate-200">
                                {new Date(user.createdAt).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                PAN
                              </p>
                              <p className="mt-1 text-sm text-slate-200">{user.panNumber || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Aadhaar
                              </p>
                              <p className="mt-1 text-sm text-slate-200">
                                {user.aadharNumber || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Account Number
                              </p>
                              <p className="mt-1 text-sm text-slate-200">
                                {user.account?.accountNumber || "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {users.length === 0 ? null : null}
            </tbody>
          </table>
        </div>
        {users.length === 0 && !loading ? (
          <div className="p-6">
            <EmptyState
              icon="US"
              title="No users found"
              description="Try a different search term or seed the project again to restore demo users."
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <button
          type="button"
          onClick={() => fetchUsers(page - 1, appliedSearch)}
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
          onClick={() => fetchUsers(page + 1, appliedSearch)}
          disabled={page === totalPages}
          className="rounded-md border border-slate-800 px-4 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Users;

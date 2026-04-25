import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonTable } from "../../components/LoadingSkeleton";
import { API_ORIGIN } from "../../config";

const statusTabs = [
  { label: "All", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const statusStyles = {
  submitted: "bg-sky-500/15 text-sky-300",
  under_review: "bg-amber-500/15 text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-300",
};

function Claims() {
  const [claims, setClaims] = useState([]);
  const [activeStatus, setActiveStatus] = useState("");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [status, setStatus] = useState("under_review");
  const [adminRemark, setAdminRemark] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClaims = async (nextStatus = activeStatus) => {
    try {
      const { data } = await axiosInstance.get("/admin/claims", {
        params: { status: nextStatus || undefined, page: 1, limit: 50 },
      });
      setClaims(data.claims);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims(activeStatus);
  }, [activeStatus]);

  const sortedDocuments = useMemo(
    () => (selectedClaim?.documents || []).map((doc) => `${API_ORIGIN}/${doc}`),
    [selectedClaim]
  );

  const openReview = (claim) => {
    setSelectedClaim(claim);
    setStatus(claim.status);
    setAdminRemark(claim.adminRemark || "");
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    try {
      await axiosInstance.put(`/admin/claims/${selectedClaim._id}`, {
        status,
        adminRemark,
      });
      toast.success("Claim updated");
      setSelectedClaim(null);
      fetchClaims(activeStatus);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update claim");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-rose-400">Admin Claims</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Claims review desk</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveStatus(tab.value)}
            className={`rounded-full px-4 py-2 text-sm ${
              activeStatus === tab.value
                ? "bg-rose-500 text-black"
                : "border border-slate-800 text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-900 bg-slate-950">
        {loading ? <div className="p-4"><SkeletonTable rows={5} columns={7} /></div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-black text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Claim ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Policy</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim._id} className="border-t border-slate-900">
                  <td className="px-4 py-4 text-xs text-slate-400">{claim._id}</td>
                  <td className="px-4 py-4">
                    <p>{claim.userId?.fullName || "-"}</p>
                    <p className="text-xs text-slate-500">{claim.userId?.email || ""}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{claim.policyId?.policyName || "-"}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {claim.policyId?.type || ""}
                    </p>
                  </td>
                  <td className="px-4 py-4">{claim.claimType || "-"}</td>
                  <td className="px-4 py-4">
                    {new Date(claim.submittedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusStyles[claim.status] || "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {claim.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => openReview(claim)}
                      className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {claims.length === 0 ? null : null}
            </tbody>
          </table>
        </div>
        {claims.length === 0 && !loading ? (
          <div className="p-6">
            <EmptyState
              icon="CL"
              title="No claims to review"
              description="When customers submit claims, they’ll queue up here for admin review."
            />
          </div>
        ) : null}
      </div>

      {selectedClaim ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-rose-400">Claim Review</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {selectedClaim.policyId?.policyName || "Policy claim"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">User</p>
                <p className="mt-1 text-sm text-slate-200">{selectedClaim.userId?.fullName}</p>
                <p className="text-xs text-slate-500">{selectedClaim.userId?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Policy Number</p>
                <p className="mt-1 text-sm text-slate-200">
                  {selectedClaim.policyId?.policyNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Claim Type</p>
                <p className="mt-1 text-sm text-slate-200">{selectedClaim.claimType || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
                <p className="mt-1 text-sm text-slate-200">
                  {new Date(selectedClaim.submittedAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-2 rounded-md border border-slate-900 bg-black/40 p-4 text-sm text-slate-200">
                {selectedClaim.description || "No description provided."}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Uploaded Documents</p>
              <div className="mt-2 space-y-2">
                {sortedDocuments.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-slate-800 px-4 py-3 text-sm text-cyan-300 hover:bg-slate-900"
                  >
                    {url.split("/").pop()}
                  </a>
                ))}
                {sortedDocuments.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-800 p-4 text-sm text-slate-500">
                    No documents uploaded.
                  </p>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-6 space-y-4">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-md border border-slate-800 bg-black px-4 py-3 text-sm text-white"
              >
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <textarea
                value={adminRemark}
                onChange={(event) => setAdminRemark(event.target.value)}
                placeholder="Add admin remarks"
                rows="4"
                className="w-full rounded-md border border-slate-800 bg-black px-4 py-3 text-sm text-white"
              />
              <button
                type="submit"
                className="rounded-md bg-rose-500 px-4 py-3 text-sm font-medium text-black"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Claims;

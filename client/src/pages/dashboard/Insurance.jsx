import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import ClaimTimeline from "../../components/ClaimTimeline";
import EmptyState from "../../components/EmptyState";
import { SkeletonCardGrid, SkeletonTable } from "../../components/LoadingSkeleton";
import { API_ORIGIN } from "../../config";

const typeAccent = {
  life: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  health: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  vehicle: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const typeIcon = {
  life: "LF",
  health: "HL",
  vehicle: "VH",
};

const statusAccent = {
  submitted: "text-cyan-300 border-cyan-500/30",
  under_review: "text-amber-300 border-amber-500/30",
  approved: "text-emerald-300 border-emerald-500/30",
  rejected: "text-rose-300 border-rose-500/30",
  active: "text-emerald-300 border-emerald-500/30",
  expired: "text-slate-300 border-slate-700",
  cancelled: "text-rose-300 border-rose-500/30",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

function Insurance() {
  const [plans, setPlans] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [purchasePlan, setPurchasePlan] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimFormOpen, setClaimFormOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    policyId: "",
    claimType: "",
    description: "",
    documents: [],
  });
  const [loading, setLoading] = useState(true);

  const activePolicies = useMemo(
    () => policies.filter((policy) => policy.status === "active"),
    [policies]
  );

  const documentPreviews = useMemo(
    () =>
      claimForm.documents.map((file) => ({
        key: `${file.name}-${file.size}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview:
          file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    [claimForm.documents]
  );

  useEffect(
    () => () => {
      documentPreviews.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    },
    [documentPreviews]
  );

  const loadInsurance = async () => {
    try {
      const [plansRes, policiesRes, claimsRes] = await Promise.all([
        axiosInstance.get("/insurance/plans"),
        axiosInstance.get("/insurance/my-policies"),
        axiosInstance.get("/insurance/claims"),
      ]);

      setPlans(plansRes.data);
      setPolicies(policiesRes.data);
      setClaims(claimsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load insurance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsurance();
  }, []);

  const handlePurchase = async () => {
    try {
      await axiosInstance.post("/insurance/purchase", { planId: purchasePlan.id });
      toast.success("Policy purchased successfully");
      setPurchasePlan(null);
      loadInsurance();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to purchase policy");
    }
  };

  const handleDocumentsChange = (event) => {
    setClaimForm((prev) => ({
      ...prev,
      documents: Array.from(event.target.files || []),
    }));
  };

  const handleSubmitClaim = async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData();
      formData.append("policyId", claimForm.policyId);
      formData.append("claimType", claimForm.claimType);
      formData.append("description", claimForm.description);
      claimForm.documents.forEach((file) => formData.append("documents", file));

      await axiosInstance.post("/insurance/claims", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Claim submitted");
      setClaimFormOpen(false);
      setClaimForm({
        policyId: "",
        claimType: "",
        description: "",
        documents: [],
      });
      loadInsurance();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit claim");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-400">My Policies</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Active insurance coverage
            </h2>
          </div>
        </div>
        {loading ? <div className="mt-6"><SkeletonCardGrid cards={3} /></div> : null}
        <div className={`mt-6 grid gap-4 lg:grid-cols-3 ${loading ? "hidden" : ""}`}>
          {policies.map((policy) => (
            <div
              key={policy._id}
              className="rounded-lg border border-slate-800 bg-slate-950 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                      typeAccent[policy.type]
                    }`}
                  >
                    {typeIcon[policy.type]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {policy.policyName}
                    </h3>
                    <p className="text-sm text-slate-400">{policy.provider}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs capitalize ${
                    statusAccent[policy.status]
                  }`}
                >
                  {policy.status}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Coverage: {formatCurrency(policy.coverageAmount)}</p>
                <p>Premium: {formatCurrency(policy.premium)}/month</p>
                <p>
                  Next premium date:{" "}
                  {formatDate(
                    new Date(
                      new Date(policy.startDate || Date.now()).setMonth(
                        new Date(policy.startDate || Date.now()).getMonth() + 1
                      )
                    )
                  )}
                </p>
              </div>
            </div>
          ))}
          {policies.length === 0 ? (
            <EmptyState
              icon="IN"
              title="No policies purchased yet"
              description="Browse plans below and add your first simulated insurance policy."
              actionLabel="Browse insurance plans"
              actionTo="/dashboard/insurance"
            />
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm uppercase tracking-wide text-cyan-400">Browse Plans</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">{plan.provider}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs capitalize ${
                    typeAccent[plan.type]
                  }`}
                >
                  {plan.type}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Premium: {formatCurrency(plan.premiumPerMonth)}/month</p>
                <p>Coverage: {formatCurrency(plan.coverageAmount)}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                {plan.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setPurchasePlan(plan)}
                className="mt-6 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-400">My Claims</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Track claim requests</h2>
          </div>
          <button
            type="button"
            onClick={() => setClaimFormOpen(true)}
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950"
          >
            File New Claim
          </button>
        </div>
        {loading ? <div className="mt-6"><SkeletonTable rows={4} columns={5} /></div> : null}
        <div className={`mt-6 overflow-x-auto ${loading ? "hidden" : ""}`}>
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Claim Type</th>
                <th className="px-4 py-3">Policy Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">View</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim._id} className="border-t border-slate-800">
                  <td className="px-4 py-4">{claim.claimType}</td>
                  <td className="px-4 py-4">{claim.policyId?.policyName}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs capitalize ${
                        statusAccent[claim.status]
                      }`}
                    >
                      {claim.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">{formatDate(claim.submittedAt)}</td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedClaim(claim)}
                      className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {claims.length === 0 ? null : null}
            </tbody>
          </table>
        </div>
        {claims.length === 0 && !loading ? (
          <div className="mt-4">
            <EmptyState
              icon="CL"
              title="No claims filed yet"
              description="When you submit a claim, its review status and documents will appear here."
            />
          </div>
        ) : null}
      </div>

      {purchasePlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Confirm policy purchase</h3>
            <p className="mt-3 text-sm text-slate-300">
              The first premium deduction for {purchasePlan.name} will be{" "}
              {formatCurrency(purchasePlan.premiumPerMonth)}.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPurchasePlan(null)}
                className="rounded-md border border-slate-700 px-4 py-2 text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedClaim ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedClaim.claimType}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedClaim.policyId?.policyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300"
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-slate-300">{selectedClaim.description}</p>
              <ClaimTimeline
                status={selectedClaim.status}
                adminRemark={selectedClaim.adminRemark}
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Documents</p>
                <div className="mt-2 space-y-2">
                  {selectedClaim.documents?.map((doc) => (
                    <a
                      key={doc}
                      href={`${API_ORIGIN}/${doc}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-cyan-300"
                    >
                      {doc}
                    </a>
                  ))}
                  {selectedClaim.documents?.length === 0 ? (
                    <p className="text-sm text-slate-500">No documents uploaded.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {claimFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <form
            onSubmit={handleSubmitClaim}
            className="w-full max-w-2xl rounded-lg border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">File New Claim</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Upload JPG, PNG, or PDF files up to 5MB each.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClaimFormOpen(false)}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <select
                value={claimForm.policyId}
                onChange={(event) =>
                  setClaimForm((prev) => ({ ...prev, policyId: event.target.value }))
                }
                required
                className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                <option value="">Select active policy</option>
                {activePolicies.map((policy) => (
                  <option key={policy._id} value={policy._id}>
                    {policy.policyName} - {policy.policyNumber}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={claimForm.claimType}
                onChange={(event) =>
                  setClaimForm((prev) => ({ ...prev, claimType: event.target.value }))
                }
                placeholder="Claim type"
                required
                className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />

              <textarea
                value={claimForm.description}
                onChange={(event) =>
                  setClaimForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Describe the incident"
                rows={4}
                required
                className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />

              <label className="rounded-lg border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-400">
                <span className="block">Drop files here or click to upload</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentsChange}
                  className="hidden"
                />
              </label>

              {claimForm.documents.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {documentPreviews.map((file) => (
                    <div
                      key={file.key}
                      className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                    >
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="mb-3 h-28 w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="mb-3 flex h-28 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-xs text-slate-500">
                          PDF Document
                        </div>
                      )}
                      <p className="font-medium">{file.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950"
              >
                Submit Claim
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default Insurance;

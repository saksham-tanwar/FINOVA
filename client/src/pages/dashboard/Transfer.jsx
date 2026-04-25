import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonCardGrid } from "../../components/LoadingSkeleton";

const transferTypes = ["NEFT", "RTGS", "IMPS"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

function Transfer() {
  const [activeTab, setActiveTab] = useState("new");
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    accountNumber: "",
    amount: "",
    transferType: "NEFT",
    description: "",
  });

  const loadData = async () => {
    try {
      const [balanceRes, beneficiaryRes] = await Promise.all([
        axiosInstance.get("/banking/balance"),
        axiosInstance.get("/banking/beneficiaries"),
      ]);
      setBalanceData(balanceRes.data);
      setBeneficiaries(beneficiaryRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load transfer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolvedAccountNumber = useMemo(() => {
    if (activeTab === "new") {
      return formData.accountNumber;
    }

    const beneficiary = beneficiaries.find((item) => item._id === selectedBeneficiary);
    return beneficiary?.accountNumber || "";
  }, [activeTab, beneficiaries, formData.accountNumber, selectedBeneficiary]);

  const canSubmit =
    resolvedAccountNumber &&
    Number(formData.amount) > 0 &&
    Number(formData.amount) <= Number(balanceData?.balance || 0);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleOpenConfirm = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      toast.error("Check account number, amount, and available balance");
      return;
    }

    setShowConfirm(true);
  };

  const handleTransfer = async () => {
    setSubmitting(true);

    try {
      await axiosInstance.post("/banking/transfer", {
        accountNumber: resolvedAccountNumber,
        amount: Number(formData.amount),
        transferType: formData.transferType,
        description: formData.description,
      });
      toast.success("Transfer successful");
      setFormData({
        accountNumber: "",
        amount: "",
        transferType: "NEFT",
        description: "",
      });
      setSelectedBeneficiary("");
      setShowConfirm(false);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? <SkeletonCardGrid cards={2} /> : null}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-400">Transfer Funds</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Available Balance: {formatCurrency(balanceData?.balance)}
            </h2>
          </div>
          <select
            name="transferType"
            value={formData.transferType}
            onChange={handleChange}
            className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          >
            {transferTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 inline-flex rounded-md border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`rounded-md px-4 py-2 text-sm ${
              activeTab === "new" ? "bg-cyan-500 text-slate-950" : "text-slate-300"
            }`}
          >
            New Transfer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`rounded-md px-4 py-2 text-sm ${
              activeTab === "saved" ? "bg-cyan-500 text-slate-950" : "text-slate-300"
            }`}
          >
            Saved Beneficiaries
          </button>
        </div>

        <form onSubmit={handleOpenConfirm} className="mt-6 space-y-4">
          {activeTab === "new" ? (
            <input
              type="text"
              name="accountNumber"
              placeholder="Receiver account number"
              value={formData.accountNumber}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          ) : (
            beneficiaries.length > 0 ? (
              <select
                value={selectedBeneficiary}
                onChange={(event) => setSelectedBeneficiary(event.target.value)}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                <option value="">Select beneficiary</option>
                {beneficiaries.map((beneficiary) => (
                  <option key={beneficiary._id} value={beneficiary._id}>
                    {beneficiary.name} - {beneficiary.accountNumber}
                  </option>
                ))}
              </select>
            ) : (
              <EmptyState
                icon="BN"
                title="No saved beneficiaries"
                description="Add a beneficiary first, then you can transfer with one tap from this tab."
                actionLabel="Manage beneficiaries"
                actionTo="/dashboard/beneficiaries"
              />
            )
          )}

          <input
            type="number"
            name="amount"
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Amount"
            required
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          {Number(formData.amount) > Number(balanceData?.balance || 0) ? (
            <p className="text-sm text-rose-400">Amount exceeds available balance.</p>
          ) : null}

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            rows={4}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          <button
            type="submit"
            className="rounded-md bg-cyan-500 px-5 py-3 font-medium text-slate-950"
          >
            Review Transfer
          </button>
        </form>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Confirm transfer</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>Type: {formData.transferType}</p>
              <p>To: {resolvedAccountNumber}</p>
              <p>Amount: {formatCurrency(Number(formData.amount))}</p>
              <p>Description: {formData.description || "N/A"}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-slate-700 px-4 py-2 text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={submitting}
                className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-70"
              >
                {submitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Transfer;

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonCardGrid } from "../../components/LoadingSkeleton";

const emptyForm = {
  name: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
};

function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBeneficiaries = async () => {
    try {
      const { data } = await axiosInstance.get("/banking/beneficiaries");
      setBeneficiaries(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load beneficiaries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await axiosInstance.post("/banking/beneficiaries", formData);
      toast.success("Beneficiary added");
      setFormData(emptyForm);
      await fetchBeneficiaries();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add beneficiary");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this beneficiary?");

    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.delete(`/banking/beneficiaries/${id}`);
      toast.success("Beneficiary deleted");
      await fetchBeneficiaries();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete beneficiary");
    }
  };

  return (
    <div className="space-y-6">
      {loading ? <SkeletonCardGrid cards={2} /> : null}
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900 p-6 md:grid-cols-2"
      >
        <input
          type="text"
          name="name"
          placeholder="Beneficiary name"
          value={formData.name}
          onChange={handleChange}
          required
          className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
        />
        <input
          type="text"
          name="accountNumber"
          placeholder="Account number"
          value={formData.accountNumber}
          onChange={handleChange}
          required
          className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
        />
        <input
          type="text"
          name="ifscCode"
          placeholder="IFSC code"
          value={formData.ifscCode}
          onChange={handleChange}
          required
          className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
        />
        <input
          type="text"
          name="bankName"
          placeholder="Bank name"
          value={formData.bankName}
          onChange={handleChange}
          className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-cyan-500 px-5 py-3 font-medium text-slate-950 disabled:opacity-70"
          >
            {submitting ? "Adding..." : "Add Beneficiary"}
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {beneficiaries.map((beneficiary) => (
          <div
            key={beneficiary._id}
            className="rounded-lg border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{beneficiary.name}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {beneficiary.accountNumber}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {beneficiary.ifscCode} {beneficiary.bankName ? `• ${beneficiary.bankName}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(beneficiary._id)}
                className="rounded-md border border-rose-500/30 px-3 py-2 text-sm text-rose-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {beneficiaries.length === 0 && !loading ? (
          <EmptyState
            icon="BN"
            title="No beneficiaries saved yet"
            description="Add a trusted beneficiary above to speed up your next transfer."
          />
        ) : null}
      </div>
    </div>
  );
}

export default Beneficiaries;

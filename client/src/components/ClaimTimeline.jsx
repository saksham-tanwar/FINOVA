const steps = ["submitted", "under_review", "approved", "rejected"];

const labels = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

function ClaimTimeline({ status, adminRemark }) {
  const activeIndex = steps.indexOf(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((step, index) => {
          const isActive = index <= activeIndex;
          const isResolved = ["approved", "rejected"].includes(status) && step === status;

          return (
            <div key={step} className="flex min-w-fit items-center gap-2">
              <div
                className={`rounded-full px-3 py-2 text-xs font-medium ${
                  isResolved
                    ? status === "approved"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-rose-500 text-white"
                    : isActive
                      ? "bg-cyan-500 text-slate-950"
                      : "border border-slate-700 text-slate-400"
                }`}
              >
                {labels[step]}
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={`h-px w-8 ${isActive ? "bg-cyan-500" : "bg-slate-700"}`}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {adminRemark && ["approved", "rejected"].includes(status) ? (
        <div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-wide text-slate-500">Admin Remark</p>
          <p className="mt-2">{adminRemark}</p>
        </div>
      ) : null}
    </div>
  );
}

export default ClaimTimeline;

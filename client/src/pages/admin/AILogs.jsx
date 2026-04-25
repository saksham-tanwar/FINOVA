import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../axiosInstance";
import EmptyState from "../../components/EmptyState";
import { SkeletonTable } from "../../components/LoadingSkeleton";

const badgeStyles = {
  email: "bg-purple-500/15 text-purple-300",
  chatbot: "bg-sky-500/15 text-sky-300",
  document: "bg-teal-500/15 text-teal-300",
  recommendation: "bg-amber-500/15 text-amber-300",
};

function AILogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (nextPage = page) => {
    try {
      const { data } = await axiosInstance.get("/admin/ai-logs", {
        params: { page: nextPage, limit: 20 },
      });
      setLogs(data.logs);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load AI logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-rose-400">Admin AI Logs</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Agent activity trail</h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-900 bg-slate-950">
        {loading ? <div className="p-4"><SkeletonTable rows={6} columns={6} /></div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-black text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Agent Type</th>
                <th className="px-4 py-3">Input Summary</th>
                <th className="px-4 py-3">Output Summary</th>
                <th className="px-4 py-3">Action Taken</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t border-slate-900 align-top">
                  <td className="px-4 py-4">
                    {new Date(log.timestamp).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4">
                    <p>{log.userId?.fullName || "System"}</p>
                    <p className="text-xs text-slate-500">{log.userId?.email || ""}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        badgeStyles[log.agentType] || "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {log.agentType}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{log.inputSummary || "-"}</td>
                  <td className="px-4 py-4 text-slate-400">{log.outputSummary || "-"}</td>
                  <td className="px-4 py-4 text-slate-400">{log.actionTaken || "-"}</td>
                </tr>
              ))}
              {logs.length === 0 ? null : null}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && !loading ? (
          <div className="p-6">
            <EmptyState
              icon="AI"
              title="No AI logs found"
              description="Agent interactions will show up here once the AI workflows are used."
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <button
          type="button"
          onClick={() => fetchLogs(page - 1)}
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
          onClick={() => fetchLogs(page + 1)}
          disabled={page === totalPages}
          className="rounded-md border border-slate-800 px-4 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AILogs;

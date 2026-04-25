import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm uppercase tracking-wide text-cyan-400">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-slate-400">
          We couldn&apos;t find that route in the banking workspace.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;

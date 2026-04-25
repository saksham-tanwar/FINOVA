import { Link } from "react-router-dom";

function EmptyState({ icon = "[]", title, description, actionLabel, actionTo }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xl text-slate-400">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default EmptyState;

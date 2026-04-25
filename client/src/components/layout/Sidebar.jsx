import { Link, useLocation } from "react-router-dom";

import useAuthStore from "../../stores/authStore";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Banking", to: "/dashboard/banking" },
  { label: "Investments", to: "/dashboard/investments" },
  { label: "Insurance", to: "/dashboard/insurance" },
  { label: "AI Agent", to: "/dashboard/ai-agent" },
];

function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const initials = (user?.fullName || "User")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="flex w-full flex-col border-r border-slate-800 bg-slate-900 lg:w-72">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <img
            src="/finova-logo.svg"
            alt="Finova"
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-400">Finova</p>
            <h1 className="mt-1 text-lg font-semibold text-white">
              AI powered Banking
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-md px-4 py-3 text-sm ${
                isActive
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {user?.role === "admin" ? (
          <Link
            to="/admin"
            className="block rounded-md px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Admin
          </Link>
        ) : null}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500 font-semibold text-slate-950">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded-md border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

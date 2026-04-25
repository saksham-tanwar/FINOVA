import { Link, Outlet, useLocation } from "react-router-dom";

import useAuthStore from "../stores/authStore";

const navItems = [
  { label: "Overview", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Transactions", to: "/admin/transactions" },
  { label: "Claims", to: "/admin/claims" },
  { label: "AI Logs", to: "/admin/ai-logs" },
];

function AdminLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-black text-white lg:flex">
      <aside className="w-full border-r border-slate-900 bg-slate-950 lg:w-80">
        <div className="border-b border-slate-900 px-6 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/finova-logo.svg"
              alt="Finova"
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm uppercase tracking-wide text-rose-400">Finova Admin</p>
              <h1 className="mt-1 text-2xl font-semibold">Control Center</h1>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block rounded-md px-4 py-3 text-sm ${
                  isActive
                    ? "bg-rose-500 text-black"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-900 px-4 py-4">
          <div className="rounded-lg border border-slate-900 bg-black p-4">
            <p className="text-sm font-medium text-white">{user?.fullName}</p>
            <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-md border border-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-slate-900"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;

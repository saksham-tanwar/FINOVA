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

  const initials = (user?.fullName || "Admin")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-banking-dark text-white lg:flex">
      <aside className="w-full border-r border-banking-border bg-[#0b1324] lg:w-80">
        <div className="h-[2px] w-full bg-gradient-to-r from-banking-accent via-banking-cyan to-transparent" />
        <div className="border-b border-banking-border px-6 py-6">
          <div className="flex items-center gap-3">
            <img src="/finova-logo.svg" alt="Finova" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-rose-300">Finova Admin</p>
              <h1 className="mt-1 text-2xl font-semibold gradient-text">Control Center</h1>
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
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-banking-accent to-banking-cyan text-white shadow-[0_12px_30px_rgba(59,130,246,0.22)]"
                    : "text-slate-300 hover:bg-blue-500/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-banking-border px-4 py-4">
          <div className="rounded-2xl border border-banking-border bg-banking-card/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-banking-accent to-banking-cyan font-semibold text-white">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-rose-300">
                    admin
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button type="button" onClick={logout} className="secondary-button mt-3 w-full">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_32%)] px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;

import { Link, useLocation } from "react-router-dom";

import useAuthStore from "../../stores/authStore";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Zm10-7h6v-3h-6v3Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Banking",
    to: "/dashboard/banking",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M3 9 12 4l9 5M5 10.5V18m4-7.5V18m6-7.5V18m4-7.5V18M3 20h18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Investments",
    to: "/dashboard/investments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M4 19h16M7 16V9m5 7V5m5 11v-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Insurance",
    to: "/dashboard/insurance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M12 3 5 6v5c0 4.3 2.7 8.2 7 10 4.3-1.8 7-5.7 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "AI Agent",
    to: "/dashboard/ai-agent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <rect x="5" y="7" width="14" height="10" rx="3" />
        <path d="M9 7V5m6 2V5m-7 7h.01M12 12h.01M16 12h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
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
    <aside className="flex w-full flex-col border-r border-banking-border bg-banking-dark lg:w-72">
      <div className="h-[2px] w-full bg-gradient-to-r from-banking-accent via-banking-cyan to-transparent" />

      <div className="border-b border-banking-border px-6 py-6">
        <div className="flex items-center gap-3">
          <img
            src="/finova-logo.svg"
            alt="Finova"
            className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/5"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold gradient-text">Finova</span>
              <span className="pulse-dot bg-emerald-400" />
            </div>
            <p className="mt-1 text-sm text-slate-400">Premium Banking Workspace</p>
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
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-banking-accent to-banking-cyan text-white shadow-[0_12px_32px_rgba(59,130,246,0.22)]"
                  : "text-slate-300 hover:bg-blue-500/10 hover:text-white"
              }`}
            >
              <span
                className={`absolute left-0 top-2 h-8 w-1 rounded-r-full transition-all ${
                  isActive ? "bg-white/80" : "bg-transparent group-hover:bg-banking-accent"
                }`}
              />
              <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-banking-cyan"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user?.role === "admin" ? (
          <Link
            to="/admin"
            className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-blue-500/10 hover:text-white"
          >
            <span className="absolute left-0 top-2 h-8 w-1 rounded-r-full bg-transparent group-hover:bg-banking-accent" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-slate-400 group-hover:text-banking-cyan">
              <path d="M12 3 4 7v5c0 5 3.3 9.4 8 11 4.7-1.6 8-6 8-11V7l-8-4Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 12h5M12 9.5v5" strokeLinecap="round" />
            </svg>
            <span>Admin</span>
          </Link>
        ) : null}
      </nav>

      <div className="border-t border-banking-border p-4">
        <div className="rounded-2xl border border-banking-border bg-banking-card/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-banking-accent to-banking-cyan font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">{user?.fullName}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
                <span className="rounded-full border border-banking-accent/30 bg-banking-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-banking-cyan">
                  {user?.role || "user"}
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
  );
}

export default Sidebar;

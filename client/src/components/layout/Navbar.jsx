import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import axiosInstance from "../../axiosInstance";
import useAuthStore from "../../stores/authStore";

const titles = {
  "/dashboard": "Dashboard",
  "/dashboard/banking": "Banking",
  "/dashboard/transfer": "Transfer",
  "/dashboard/transactions": "Transactions",
  "/dashboard/beneficiaries": "Beneficiaries",
  "/dashboard/investments": "Investments",
  "/dashboard/insurance": "Insurance",
  "/dashboard/ai-agent": "AI Agent",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function Navbar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = useMemo(
    () => titles[location.pathname] || "Dashboard",
    [location.pathname]
  );

  const initials = (user?.fullName || "User")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosInstance.get("/notifications", {
        params: { page: 1, limit: 5 },
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      // stay quiet on navbar fetch hiccups
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNotificationToggle = async () => {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);

    if (nextOpen) {
      try {
        await axiosInstance.post("/notifications/mark-all-read");
        setUnreadCount(0);
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      } catch (error) {
        // no-op
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-banking-border bg-[#111827]/95 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {getGreeting()},{" "}
            <span className="font-medium text-slate-200">
              {(user?.fullName || "Saksham").split(" ")[0]}
            </span>{" "}
            <span role="img" aria-label="wave">
              👋
            </span>
          </p>
          <h2 className="mt-1 text-3xl font-semibold gradient-text">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-3 self-end xl:self-auto">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-banking-border bg-banking-card/70 text-slate-300 transition hover:border-banking-accent/40 hover:text-white"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.2-4.2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={handleNotificationToggle}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-banking-border bg-banking-card/70 text-slate-300 transition hover:border-banking-accent/40 hover:text-white"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
              </svg>
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow-[0_0_0_4px_rgba(10,15,30,1)]">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {notificationOpen ? (
              <div className="absolute right-0 z-50 mt-3 w-96 rounded-2xl border border-banking-border bg-banking-card p-3 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Recent notifications</p>
                  <span className="text-xs text-slate-500">{unreadCount} unread</span>
                </div>
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="rounded-xl border border-banking-border bg-[#101726] p-3"
                    >
                      <p className="text-sm text-slate-200">{notification.message}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(notification.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                  {notifications.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-banking-border p-4 text-sm text-slate-500">
                      No notifications yet.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-2xl border border-banking-border bg-banking-card/70 px-3 py-2 text-sm text-slate-200 transition hover:border-banking-accent/40"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-banking-accent to-banking-cyan text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden md:inline">{user?.fullName || "User"}</span>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 z-50 mt-3 w-60 rounded-2xl border border-banking-border bg-banking-card p-4">
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

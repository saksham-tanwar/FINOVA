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

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosInstance.get("/notifications", {
        params: { page: 1, limit: 5 },
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      // Keep navbar quiet on transient fetch failures.
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
        // No-op
      }
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
      <div className="flex items-center gap-4">
        <img
          src="/finova-logo.svg"
          alt="Finova"
          className="h-11 w-11 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm uppercase tracking-wide text-cyan-400">
            Finova - AI powered Banking
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{pageTitle}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={handleNotificationToggle}
            className="relative rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200"
          >
            Alerts
            {unreadCount > 0 ? (
              <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {notificationOpen ? (
            <div className="absolute right-0 z-50 mt-3 w-96 rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Recent notifications</p>
                <span className="text-xs text-slate-500">{unreadCount} unread</span>
              </div>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="rounded-md border border-slate-800 bg-slate-900 p-3"
                  >
                    <p className="text-sm text-slate-200">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(notification.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
                {notifications.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-800 p-4 text-sm text-slate-500">
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
            className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200"
          >
            {user?.fullName || "User"}
          </button>

          {menuOpen ? (
            <div className="absolute right-0 z-50 mt-3 w-60 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

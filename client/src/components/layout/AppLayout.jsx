import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function AppLayout() {
  return (
    <div className="min-h-screen bg-banking-dark text-slate-100 lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_35%)] p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

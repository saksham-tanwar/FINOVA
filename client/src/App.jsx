import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import AILogs from "./pages/admin/AILogs";
import Claims from "./pages/admin/Claims";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminTransactions from "./pages/admin/Transactions";
import Users from "./pages/admin/Users";
import ProtectedRoute from "./components/ProtectedRoute";
import AIAgent from "./pages/dashboard/AIAgent";
import Banking from "./pages/dashboard/Banking";
import Beneficiaries from "./pages/dashboard/Beneficiaries";
import Dashboard from "./pages/dashboard/Dashboard";
import Insurance from "./pages/dashboard/Insurance";
import Investments from "./pages/dashboard/Investments";
import Transactions from "./pages/dashboard/Transactions";
import Transfer from "./pages/dashboard/Transfer";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import useAuthStore from "./stores/authStore";

function App() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="banking" element={<Banking />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="beneficiaries" element={<Beneficiaries />} />
          <Route path="investments" element={<Investments />} />
          <Route path="insurance" element={<Insurance />} />
          <Route path="ai-agent" element={<AIAgent />} />
        </Route>
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<Users />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="claims" element={<Claims />} />
          <Route path="ai-logs" element={<AILogs />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;

import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./stores/authStore";

const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AILogs = lazy(() => import("./pages/admin/AILogs"));
const Claims = lazy(() => import("./pages/admin/Claims"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminTransactions = lazy(() => import("./pages/admin/Transactions"));
const Users = lazy(() => import("./pages/admin/Users"));
const AIAgent = lazy(() => import("./pages/dashboard/AIAgent"));
const Banking = lazy(() => import("./pages/dashboard/Banking"));
const Beneficiaries = lazy(() => import("./pages/dashboard/Beneficiaries"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Insurance = lazy(() => import("./pages/dashboard/Insurance"));
const Investments = lazy(() => import("./pages/dashboard/Investments"));
const Transactions = lazy(() => import("./pages/dashboard/Transactions"));
const Transfer = lazy(() => import("./pages/dashboard/Transfer"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        <p className="text-lg font-medium">Loading Finova</p>
        <p className="mt-2 text-sm text-slate-400">
          Waking up services and preparing your workspace.
        </p>
      </div>
    </div>
  );
}

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
      <Suspense fallback={<RouteLoader />}>
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
      </Suspense>
    </>
  );
}

export default App;

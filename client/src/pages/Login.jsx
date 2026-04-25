import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import axiosInstance from "../axiosInstance";
import GoogleAuthButton from "../components/GoogleAuthButton";
import useAuthStore from "../stores/authStore";

function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { data } = await axiosInstance.post("/auth/login", formData);
      login(data.token, data.user);
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-lg border border-slate-800 bg-slate-900 p-8"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Login</h1>
          <p className="text-sm text-slate-400">Access your banking workspace.</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          <span>or</span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <GoogleAuthButton label="Continue with Google" />

        <div className="flex items-center justify-between text-sm text-slate-400">
          <Link to="/forgot-password" className="hover:text-white">
            Forgot password?
          </Link>
          <Link to="/register" className="hover:text-white">
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Login;

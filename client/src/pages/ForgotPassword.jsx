import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import axiosInstance from "../axiosInstance";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { data } = await axiosInstance.post("/auth/forgot-password", {
        email,
      });
      setMessage(data.message);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send reset link");
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
          <h1 className="text-3xl font-semibold">Forgot password</h1>
          <p className="text-sm text-slate-400">
            Enter your email and we’ll send a reset link.
          </p>
        </div>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>

        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

        <Link to="/login" className="block text-sm text-slate-400 hover:text-white">
          Back to login
        </Link>
      </form>
    </div>
  );
}

export default ForgotPassword;

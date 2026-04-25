import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import axiosInstance from "../axiosInstance";
import { firebaseAuth, googleProvider, isFirebaseConfigured } from "../firebase";
import useAuthStore from "../stores/authStore";

function GoogleAuthButton({ label = "Continue with Google" }) {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleAuth = async () => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      toast.error("Firebase Google sign-in is not configured yet");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken(true);
      const { data } = await axiosInstance.post("/auth/google", { idToken });

      login(data.token, data.user);
      toast.success("Signed in with Google");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Google sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={isSubmitting}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-700 bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C17 3.3 14.8 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8S6.8 21.2 12 21.2c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.2H12z"
        />
        <path
          fill="#34A853"
          d="M3.7 7.3 6.9 9.6c.9-1.8 2.8-3 5.1-3 1.9 0 3.1.8 3.9 1.5l2.7-2.6C17 3.3 14.8 2.4 12 2.4 8.3 2.4 5 4.4 3.7 7.3z"
        />
        <path
          fill="#4A90E2"
          d="M12 21.2c2.7 0 5-.9 6.7-2.5l-3.1-2.5c-.8.6-1.9 1.1-3.6 1.1-3.9 0-5.2-2.5-5.5-3.9l-3.2 2.5c1.4 2.9 4.5 5.3 8.7 5.3z"
        />
        <path
          fill="#FBBC05"
          d="M6.5 13.4c-.1-.4-.2-.9-.2-1.4s.1-1 .2-1.4L3.3 8.1c-.5 1-.7 2.1-.7 3.3s.2 2.3.7 3.3l3.2-2.5z"
        />
      </svg>
      {isSubmitting ? "Connecting..." : label}
    </button>
  );
}

export default GoogleAuthButton;

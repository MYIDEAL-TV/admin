import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { secureFetch } from "@/utils/api";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing verification token.");
      setIsValidating(false);
      return;
    }

    const validateTokenStatus = async () => {
      try {
        const response = await fetch(`${VITE_API_URL}/api/admin/auth/validate-token?token=${token}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "This activation link is invalid or has expired.");
        }
      } catch (err) {
        setError("Network error while validating activation link.");
      } finally {
        setIsValidating(false);
      }
    };

    validateTokenStatus();
  }, [token, VITE_API_URL]);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsSubmitting(true);
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/auth/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Account activated! Redirecting to login...");
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        toast.error(data.error || "Activation failed");
      }
    } catch (err) {
      toast.error("Server connection lost");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div className="min-h-screen bg-[#191121] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#1f1629] border border-[#7f19e6]/20 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#7f19e6]/10 rounded-full flex items-center justify-center text-[#7f19e6] mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Activate Account</h1>
          <p className="text-slate-400 text-sm mt-2 text-center">Set your permanent password to access the IdealTV Admin Panel.</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                required
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-xl py-3 pl-10 pr-12 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirm Password</label>
            <input
              required
              type="password"
              className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#7f19e6] hover:bg-[#8e29f7] text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#7f19e6]/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Finalize Activation"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Sub-components for state management
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#191121] flex items-center justify-center">
    <Loader2 className="animate-spin text-[#7f19e6]" size={48} />
  </div>
);

const ErrorScreen = ({ message }) => (
  <div className="min-h-screen bg-[#191121] flex items-center justify-center p-6 text-center">
    <div className="max-w-md space-y-4">
      <h2 className="text-3xl font-bold text-white">Oops!</h2>
      <p className="text-slate-400">{message}</p>
      <button onClick={() => window.location.href = "/admin/login"} className="text-[#7f19e6] underline font-bold">Return to Login</button>
    </div>
  </div>
);

export default VerifyAccount;
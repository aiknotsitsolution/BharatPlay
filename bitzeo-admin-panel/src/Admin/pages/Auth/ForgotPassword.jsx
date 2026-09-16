import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound, Loader2, CheckCircle } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await API.post("/admin/forgot-password", { email });
      if (!res.data.success) throw new Error(res.data.message || "Something went wrong");
      toast.success(res.data.message || "Reset link sent to your email!");
      setIsSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to send reset link. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bp-navy overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-36 -left-36 w-[460px] h-[460px] rounded-full bg-bp-blue/10 blur-[130px]" />
        <div className="absolute -bottom-36 -right-36 w-[460px] h-[460px] rounded-full bg-bp-cyan/10 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-bp-blue/[0.04] blur-[140px]" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">
        {/* Card */}
        <div className="glass-card relative overflow-hidden glow-hover">
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-bp-blue/40 to-transparent" />
          <div className="p-6">
            {/* Logo row */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-bp-blue/50 to-bp-cyan/50 opacity-40 blur-md" />
                <img src="/Logo-image.jpg" alt="BharatPlay" className="relative w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight flex items-baseline gap-0.5">
                  <span className="text-bp-text">Bharat</span>
                  <span className="bg-gradient-to-r from-bp-orange via-bp-yellow to-bp-cyan bg-clip-text text-transparent">play</span>
                </h1>
                <p className="text-bp-text-secondary text-sm mt-1.5">Forgot Password</p>
              </div>
            </div>
            {isSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-bp-text">Check your email</h2>
                  <p className="text-bp-text-secondary text-sm mt-1">We have sent a password reset link to <span className="text-bp-text font-medium">{email}</span></p>
                </div>
                <Link to="/admin-login" className="inline-flex items-center gap-2 text-sm text-bp-blue hover:text-bp-cyan font-medium transition mt-4">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            ) : (
              <>
                <p className="text-bp-text-secondary text-sm mb-5 text-center">Enter your email address and we'll send you a link to reset your password.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-4.5 h-4.5 transition-colors group-focus-within:text-bp-blue" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@bharatplay.com"
                        className="w-full pl-11 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 hover:border-bp-border outline-none transition-all duration-200 text-sm" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-bp-blue to-bp-cyan hover:from-bp-cyan hover:to-bp-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-bp-blue/25 hover:shadow-bp-blue/40 text-sm inline-flex items-center justify-center gap-2">
                    {isLoading ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Sending...</span>) : (<><KeyRound size={15} /> Send Reset Link</>)}
                  </button>
                </form>
                <div className="text-center mt-5">
                  <Link to="/admin-login" className="inline-flex items-center gap-2 text-sm text-bp-blue hover:text-bp-cyan font-medium transition">
                    <ArrowLeft size={16} /> Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
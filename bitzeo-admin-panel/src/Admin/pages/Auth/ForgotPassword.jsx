import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
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
    <div className="relative min-h-screen bg-bp-navy overflow-hidden flex items-center justify-center px-4 py-6">
      <div className="relative w-full max-w-[440px] animate-fade-in">
        <div className="glass-card p-6">
          {/* Logo row */}
          <div className="flex flex-col items-center text-center gap-3 mb-5">
            <img src="/Logo-image.jpg" alt="BharatPlay" className="w-14 h-14 rounded-2xl object-cover ring-1 ring-bp-border" />
            <div>
              <h1 className="text-[26px] font-black tracking-tight font-display" style={{ background: "linear-gradient(120deg, #F8E7B3 0%, #E7C766 25%, #EF6B5E 50%, #EA8A7E 62%, #56A1E8 85%, #7FBCF2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 8px rgba(231,199,102,0.4)) drop-shadow(0 0 15px rgba(239,107,94,0.3)) drop-shadow(0 0 20px rgba(86,161,232,0.3))" }}>
                Bharatplay
              </h1>
              <p className="text-bp-text-secondary text-sm mt-1.5">Forgot Password</p>
            </div>
          </div>
          {isSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-bp-text">Check your email</h2>
                <p className="text-bp-text-secondary text-sm mt-1">We have sent a password reset link to <span className="text-bp-text font-medium">{email}</span></p>
              </div>
              <Link to="/admin-login" className="inline-flex items-center gap-2 text-sm font-medium text-bp-blue hover:opacity-80 transition mt-4">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-bp-text-secondary text-sm mb-5 text-center">Enter your email address and we'll send you a link to reset your password.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-bp-text-secondary mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-[18px] h-[18px]" />
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@bharatplay.com"
                      className="w-full pl-10 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-2 px-4 rounded-lg btn-primary font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm inline-flex items-center justify-center gap-2">
                  {isLoading ? (<span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Sending...</span>) : (<><KeyRound size={15} /> Send Reset Link</>)}
                </button>
              </form>
              <div className="text-center mt-5">
                <Link to="/admin-login" className="inline-flex items-center gap-2 text-sm font-medium text-bp-blue hover:opacity-80 transition">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
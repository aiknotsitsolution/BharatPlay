import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const getErrorMessage = (err) => {
    const data = err?.response?.data;
    return data?.message || data?.error || data?.details || err?.message || "Login failed. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const res = await API.post("/admin/admin-login", { email, password });
      if (!res.data.success) throw new Error(res.data.message || "Login failed");

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));
      localStorage.setItem("adminRole", "admin");
      window.dispatchEvent(new Event("auth-change"));
      toast.success(res.data.message || "Login successful!");
      navigate("/", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      setLoginError(message);
      toast.error(message);
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
        <div className="glass-card relative overflow-hidden p-8 glow-hover">
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-bp-blue/40 to-transparent" />
          {/* Logo row */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-bp-blue/50 to-bp-cyan/50 opacity-40 blur-md" />
              <img src="/Logo-image.jpg" alt="BharatPlay" className="relative w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight flex items-baseline gap-0.5">
                <span className="text-bp-text">Bharat</span>
                <span className="bg-gradient-to-r from-bp-orange via-bp-yellow to-bp-cyan bg-clip-text text-transparent">play</span>
              </h1>
              <p className="text-bp-text-secondary mt-2 text-sm">Admin Login</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-bp-text-muted transition-colors group-focus-within:text-bp-blue" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 hover:border-bp-border outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-bp-text-muted transition-colors group-focus-within:text-bp-blue" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 hover:border-bp-border outline-none transition-all duration-200"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition">
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-bp-blue hover:text-bp-cyan transition">Forgot Password?</Link>
            </div>

            {loginError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">{loginError}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-bp-blue to-bp-cyan hover:from-bp-cyan hover:to-bp-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-bp-blue/25 hover:shadow-bp-blue/40 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-bp-border space-y-3">
            <p className="text-center text-sm text-bp-text-secondary">
              New admin? <Link to="/register" className="text-bp-blue hover:text-bp-cyan font-medium transition">Register</Link>
            </p>
            <p className="text-center text-sm text-bp-text-secondary">
              Employee login? <Link to="/employee-login" className="text-bp-yellow hover:text-bp-orange font-medium transition">Staff Portal</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
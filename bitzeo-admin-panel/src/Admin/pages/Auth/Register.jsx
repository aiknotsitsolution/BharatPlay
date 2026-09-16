import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [regStatus, setRegStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    API.get("/admin/registration-status")
      .then((res) => { if (!cancelled) setRegStatus(res.data); })
      .catch(() => { if (!cancelled) setRegStatus({ success: false, registrationAvailable: false }); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (formData.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsLoading(true);
    try {
      const res = await API.post("/admin/register", { name: formData.name, email: formData.email, password: formData.password });
      if (!res.data.success) throw new Error(res.data.message || "Registration failed");
      toast.success(res.data.message || "Admin account created successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const regNotAvailable = regStatus && !regStatus.registrationAvailable;

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
                <p className="text-bp-text-secondary text-sm mt-1.5">Create an administrator account for this panel</p>
              </div>
            </div>
            {regStatus && !regNotAvailable && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">Registration authorized</p>
                  <p className="text-xs text-emerald-400/70">Protected by server-side setup credentials</p>
                </div>
              </div>
            )}

            {!regStatus && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-bp-elevated border border-bp-border flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-bp-text-muted shrink-0 animate-spin" />
                <p className="text-sm text-bp-text-muted">Checking registration status...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-4.5 h-4.5 transition-colors group-focus-within:text-bp-blue" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" autoComplete="name"
                    className="w-full pl-11 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 hover:border-bp-border outline-none transition-all duration-200 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-4.5 h-4.5 transition-colors group-focus-within:text-bp-blue" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="admin@company.com" autoComplete="email"
                    className="w-full pl-11 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 hover:border-bp-border outline-none transition-all duration-200 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-4.5 h-4.5 transition-colors group-focus-within:text-bp-blue" />
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required placeholder="Minimum 8 characters" autoComplete="new-password"
                    className="w-full pl-11 pr-12 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 hover:border-bp-border outline-none transition-all duration-200 text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition" tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-4.5 h-4.5 transition-colors group-focus-within:text-bp-blue" />
                  <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Repeat password" autoComplete="new-password"
                    className="w-full pl-11 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 hover:border-bp-border outline-none transition-all duration-200 text-sm" />
                </div>
              </div>

              <button type="submit" disabled={isLoading || regNotAvailable || !regStatus}
                className="w-full py-2.5 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-bp-blue to-bp-cyan hover:from-bp-cyan hover:to-bp-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-bp-blue/25 hover:shadow-bp-blue/40 text-sm mt-1">
                {isLoading ? (<span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating Account...</span>) : "Create Admin Account"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-bp-border">
              <p className="text-center text-sm text-bp-text-secondary">
                Already have an account? <Link to="/login" className="text-bp-blue font-medium hover:text-bp-cyan transition">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
    <div className="relative min-h-screen bg-bp-navy overflow-hidden flex items-center justify-center px-4 py-4">
      <div className="relative w-full max-w-[440px] animate-fade-in">
        <div className="glass-card p-5">
          {/* Logo row */}
          <div className="flex flex-col items-center text-center gap-2 mb-4">
            <img src="/Logo-image.jpg" alt="BharatPlay" className="w-12 h-12 rounded-2xl object-cover ring-1 ring-bp-border" />
            <div>
              <h1 className="text-[24px] font-black tracking-tight font-display" style={{ background: "linear-gradient(120deg, #F8E7B3 0%, #E7C766 25%, #EF6B5E 50%, #EA8A7E 62%, #56A1E8 85%, #7FBCF2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 8px rgba(231,199,102,0.4)) drop-shadow(0 0 15px rgba(239,107,94,0.3)) drop-shadow(0 0 20px rgba(86,161,232,0.3))" }}>
                Bharatplay
              </h1>
              <p className="text-bp-text-secondary text-xs mt-1">Create an administrator account for this panel</p>
            </div>
          </div>

          {regStatus && !regNotAvailable && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-emerald-800">Registration authorized</p>
                <p className="text-xs text-emerald-700/80">Protected by server-side setup credentials</p>
              </div>
            </div>
          )}

          {!regStatus && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-bp-elevated border border-bp-border flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-bp-text-muted shrink-0 animate-spin" />
              <p className="text-[13px] text-bp-text-muted">Checking registration status...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-bp-text-secondary mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-[18px] h-[18px]" />
                <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" autoComplete="name"
                  className="w-full pl-10 py-2 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bp-text-secondary mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-[18px] h-[18px]" />
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="admin@company.com" autoComplete="email"
                  className="w-full pl-10 py-2 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-bp-text-secondary mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-[18px] h-[18px]" />
                <input id="password" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required placeholder="Minimum 8 characters" autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-2 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition" tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-bp-text-secondary mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-[18px] h-[18px]" />
                <input id="confirmPassword" type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Repeat password" autoComplete="new-password"
                  className="w-full pl-10 py-2 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm" />
              </div>
            </div>

            <button type="submit" disabled={isLoading || regNotAvailable || !regStatus}
              className="w-full py-2 px-4 rounded-lg btn-primary font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
              {isLoading ? (<span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Creating Account...</span>) : "Create Admin Account"}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-bp-border">
            <p className="text-center text-sm text-bp-text-secondary">
              Already have an account? <Link to="/login" style={{ color: "#FFFFFF" }} className="font-medium hover:opacity-80 transition">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
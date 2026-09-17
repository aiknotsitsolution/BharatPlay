import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ChevronDown } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";
import RocketButton from "../../../components/RocketButton";

const ROLES = [
  { value: "admin", label: "Admin - Full Access" },
  { value: "finance", label: "Finance - Finance Module" },
  { value: "support", label: "Support - Support Module" },
  { value: "read-only", label: "Read-Only - View Only" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await API.post("/admin/login", { email, password, role });
      if (!res.data.success) throw new Error(res.data.message || "Login failed");

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));
      localStorage.setItem("adminRole", res.data.user.role || role);
      window.dispatchEvent(new Event("auth-change"));
      toast.success(res.data.message || "Login successful!");

      const userRole = res.data.user.role || role;
      window.dispatchEvent(new Event("bp-login-celebrate"));
      if (userRole === "finance") navigate("/finance-dashboard", { replace: true });
      else if (userRole === "support") navigate("/support-dashboard", { replace: true });
      else if (userRole === "read-only") navigate("/read-only-dashboard", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Login failed. Please try again.");
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
              <p className="text-bp-text-secondary mt-1.5 text-sm">Admin Login</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bp-text-secondary mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-bp-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-bp-text-secondary mb-1 flex items-center gap-2">
                <Shield size={15} className="text-bp-blue" />
                Login Role
              </label>
              <div className="relative">
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors cursor-pointer">
                  {ROLES.map((r) => (<option key={r.value} value={r.value} className="bg-bp-card">{r.label}</option>))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted pointer-events-none" />
              </div>
              <p className="text-xs text-bp-text-muted mt-1.5">Select your role to access the corresponding dashboard</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-bp-text-secondary mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-bp-text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium hover:opacity-80 transition" style={{ color: "#FFFFFF" }}>Forgot Password?</Link>
            </div>

            <RocketButton loading={isLoading}>
              Sign In
            </RocketButton>
          </form>

          <div className="mt-5 pt-4 border-t border-bp-border">
            <p className="text-center text-sm text-bp-text-secondary">
              Don't have an account? <Link to="/register" style={{ color: "#FFFFFF" }} className="font-medium hover:opacity-80 transition">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
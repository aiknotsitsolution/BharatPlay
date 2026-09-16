import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginEmployee } from "../api/adminApi.js";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const EmployeeLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginEmployee(form);
      const { token, user } = res.data;
      login(user, token);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bp-navy overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-36 -left-36 w-[460px] h-[460px] rounded-full bg-bp-orange/10 blur-[130px]" />
        <div className="absolute -bottom-36 -right-36 w-[460px] h-[460px] rounded-full bg-bp-yellow/10 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-bp-orange/[0.04] blur-[140px]" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">
        {/* Card */}
        <div className="glass-card relative overflow-hidden p-8 glow-hover">
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-bp-orange/40 to-transparent" />
          {/* Logo row */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-bp-orange/50 to-bp-yellow/50 opacity-40 blur-md" />
              <img src="/Logo-image.jpg" alt="BharatPlay" className="relative w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight flex items-baseline gap-0.5">
                <span className="text-bp-text">Bharat</span>
                <span className="bg-gradient-to-r from-bp-orange via-bp-yellow to-bp-cyan bg-clip-text text-transparent">play</span>
              </h1>
              <p className="text-bp-text-secondary mt-2 text-sm">Finance Admin Login</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-bp-text-muted transition-colors group-focus-within:text-bp-yellow" />
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-yellow/20 focus:border-bp-yellow/60 hover:border-bp-border outline-none transition-all duration-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-bp-text-muted transition-colors group-focus-within:text-bp-yellow" />
                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-yellow/20 focus:border-bp-yellow/60 hover:border-bp-border outline-none transition-all duration-200" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition">
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-bp-orange to-bp-yellow hover:from-bp-yellow hover:to-bp-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-bp-orange/25 hover:shadow-bp-orange/40">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-bp-border">
            <p className="text-center text-sm text-bp-text-secondary">
              Need to create an account? <Link to="/register" className="text-bp-blue hover:text-bp-cyan font-medium transition">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
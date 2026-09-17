import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginEmployee } from "../api/adminApi.js";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import RocketButton from "../../../components/RocketButton";

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
      window.dispatchEvent(new Event("bp-login-celebrate"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bp-navy overflow-hidden flex items-center justify-center px-4 py-6">
      <div className="relative w-full max-w-[440px] animate-fade-in">
        <div className="glass-card p-6">
          <div className="flex flex-col items-center text-center gap-3 mb-5">
            <img src="/Logo-image.jpg" alt="BharatPlay" className="w-14 h-14 rounded-2xl object-cover ring-1 ring-bp-border" />
            <div>
              <h1 className="text-[26px] font-black tracking-tight font-display" style={{ background: "linear-gradient(120deg, #F8E7B3 0%, #E7C766 25%, #EF6B5E 50%, #EA8A7E 62%, #56A1E8 85%, #7FBCF2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 8px rgba(231,199,102,0.4)) drop-shadow(0 0 15px rgba(239,107,94,0.3)) drop-shadow(0 0 20px rgba(86,161,232,0.3))" }}>
                Bharatplay
              </h1>
              <p className="text-bp-text-secondary mt-1.5 text-sm">Finance Admin Login</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bp-text-secondary mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-bp-text-muted" />
                <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-bp-text-secondary mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-bp-text-muted" />
                <input id="password" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors" />
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

            <RocketButton loading={loading}>
              Login
            </RocketButton>
          </form>

          <div className="mt-5 pt-4 border-t border-bp-border">
            <p className="text-center text-sm text-bp-text-secondary">
              Need to create an account? <Link to="/register" style={{ color: "#FFFFFF" }} className="font-medium hover:opacity-80 transition">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
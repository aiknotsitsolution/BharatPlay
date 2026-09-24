import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ChevronDown } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";
import RocketButton from "../../../components/RocketButton";

const ROLES = [
  { value: "finance", label: "Finance Admin" },
  { value: "support", label: "Support Admin" },
  { value: "read-only", label: "Read-Only Admin" },
];

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [role, setRole] = useState("finance");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const getErrorMessage = (err) => {
    const data = err?.response?.data;
    return (
      data?.message ||
      data?.error ||
      data?.details ||
      err?.message ||
      "Login failed. Please try again."
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const res = await API.post(
        "/admin/employee-login",
        requiresOtp
          ? { email: email.trim().toLowerCase(), otp, role }
          : { email: email.trim().toLowerCase(), password, role },
      );
      if (!res.data.success)
        throw new Error(res.data.message || "Login failed");

      if (res.data.requiresOtp) {
        setRequiresOtp(true);
        setPassword("");
        toast.success(res.data.message || "OTP sent to your email");
        return;
      }

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));
      localStorage.setItem("adminRole", role);
      window.dispatchEvent(new Event("auth-change"));
      window.dispatchEvent(new Event("bp-login-celebrate"));
      toast.success(res.data.message || "Login successful!");

      if (role === "finance") navigate("/finance-dashboard", { replace: true });
      else if (role === "support")
        navigate("/support-dashboard", { replace: true });
      else if (role === "read-only")
        navigate("/read-only-dashboard", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      setLoginError(message);
      toast.error(message);
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
            <img
              src="/Logo-image.jpg"
              alt="BharatPlay"
              className="w-14 h-14 rounded-2xl object-cover ring-1 ring-bp-border"
            />
            <div>
              <h1
                className="text-[26px] font-black tracking-tight font-display"
                style={{
                  background:
                    "linear-gradient(120deg, #F8E7B3 0%, #E7C766 25%, #EF6B5E 50%, #EA8A7E 62%, #56A1E8 85%, #7FBCF2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter:
                    "drop-shadow(0 0 8px rgba(231,199,102,0.4)) drop-shadow(0 0 15px rgba(239,107,94,0.3)) drop-shadow(0 0 20px rgba(86,161,232,0.3))",
                }}
              >
                Bharatplay
              </h1>
              <p className="text-bp-text-secondary mt-1.5 text-sm">
                Employee &amp; Staff Login
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-bp-text-secondary mb-1 flex items-center gap-2"
              >
                <Shield size={15} className="text-bp-blue" />
                Select Role
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option
                      key={r.value}
                      value={r.value}
                      className="bg-bp-card"
                    >
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted pointer-events-none"
                />
              </div>
              <p className="text-xs text-bp-text-muted mt-1.5">
                Select your employee role to access your dashboard
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-bp-text-secondary mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-bp-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="employee@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors"
                />
              </div>
            </div>

            {!requiresOtp && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-bp-text-secondary mb-1"
                >
                  Password
                </label>
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
            )}

            {requiresOtp && (
              <div>
                <label
                  htmlFor="employee-login-otp"
                  className="block text-sm font-medium text-bp-text-secondary mb-1"
                >
                  Email OTP
                </label>
                <input
                  id="employee-login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors"
                />
                <p className="text-xs text-bp-text-muted mt-1.5">
                  A verification code was sent to your email.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-bp-blue hover:opacity-80 transition"
              >
                Forgot Password?
              </Link>
            </div>

            {loginError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <RocketButton loading={isLoading}>
              {requiresOtp ? "Verify & Sign In" : "Sign In"}
            </RocketButton>
            {requiresOtp && (
              <button
                type="button"
                onClick={() => {
                  setRequiresOtp(false);
                  setOtp("");
                  setLoginError("");
                }}
                className="w-full text-sm text-bp-text-secondary hover:text-bp-text transition"
              >
                Use a different account
              </button>
            )}
          </form>

          <div className="mt-5 pt-4 border-t border-bp-border">
            <p className="text-center text-sm text-bp-text-secondary">
              Admin login?{" "}
              <Link
                to="/admin-login"
                className="font-medium text-bp-blue hover:opacity-80 transition"
              >
                Admin Panel
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

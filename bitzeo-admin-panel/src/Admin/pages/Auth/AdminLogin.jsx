import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";
import RocketButton from "../../../components/RocketButton";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
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
        "/admin/admin-login",
        requiresOtp
          ? { email: email.trim().toLowerCase(), otp }
          : { email: email.trim().toLowerCase(), password }
      );

      if (!res.data.success) {
        throw new Error(res.data.message || "Login failed");
      }

      if (res.data.requiresOtp) {
        setRequiresOtp(true);
        setPassword("");
        toast.success(res.data.message || "OTP sent to your email");
        return;
      }

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));
      localStorage.setItem("adminRole", "admin");

      window.dispatchEvent(new Event("auth-change"));
      window.dispatchEvent(new Event("bp-login-celebrate"));

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080B14] px-4 py-10">

      {/* Background ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#E6C45A]/10 blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#4598F2]/10 blur-[130px]" />
        <div className="absolute top-[35%] right-[15%] h-72 w-72 rounded-full bg-[#F16D60]/5 blur-[120px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />
      </div>

      {/* Login wrapper */}
      <div className="relative z-10 w-full max-w-[450px] animate-fade-in">

        {/* Top branding */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-[24px] bg-[#E7C766]/20 blur-2xl" />

            <img
              src="/VidBuxApp-logo.png"
              alt="VidBuxApp"
              className="relative h-[76px] w-[76px] rounded-[22px] border border-white/10 bg-[#131A28] p-2.5 object-contain shadow-[0_0_35px_rgba(231,199,102,0.13)]"
            />
          </div>

          <h1
            className="text-[32px] font-black tracking-tight"
            style={{
              background:
                "linear-gradient(115deg, #F8E7B3 0%, #E7C766 25%, #EF6B5E 50%, #EA8A7E 65%, #56A1E8 85%, #7FBCF2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            VidBuxApp
          </h1>

          <p className="mt-2 text-sm tracking-wide text-gray-400">
            Your platform. Your control center.
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-[26px] border border-white/[0.09] bg-[#111724]/90 p-6 shadow-[0_25px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">

          {/* Card heading */}
          <div className="mb-7">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7C766]/20 bg-[#E7C766]/10">
                {requiresOtp ? (
                  <ShieldCheck size={18} className="text-[#E7C766]" />
                ) : (
                  <Sparkles size={17} className="text-[#E7C766]" />
                )}
              </div>

              <span className="text-xs font-semibold uppercase tracking-[2px] text-[#E7C766]">
                {requiresOtp ? "Security verification" : "Admin Portal"}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              {requiresOtp ? "Verify your identity" : "Welcome back"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              {requiresOtp
                ? "Enter the verification code sent to your email to continue."
                : "Sign in to access your administration dashboard."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[13px] font-medium text-gray-300"
              >
                Email address
              </label>

              <div className="group relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition group-focus-within:text-[#E7C766]"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={requiresOtp}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0B101A] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-gray-600 hover:border-white/[0.15] focus:border-[#DDBE68]/60 focus:ring-4 focus:ring-[#DDBE68]/[0.07] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            {!requiresOtp && (
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[13px] font-medium text-gray-300"
                >
                  Password
                </label>

                <div className="group relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition group-focus-within:text-[#E7C766]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0B101A] py-3.5 pl-12 pr-12 text-sm text-white outline-none transition-all placeholder:text-gray-600 hover:border-white/[0.15] focus:border-[#DDBE68]/60 focus:ring-4 focus:ring-[#DDBE68]/[0.07]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP */}
            {requiresOtp && (
              <div>
                <label
                  htmlFor="login-otp"
                  className="mb-2 block text-[13px] font-medium text-gray-300"
                >
                  6-digit verification code
                </label>

                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  placeholder="000000"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0B101A] px-4 py-4 text-center text-xl font-bold tracking-[10px] text-[#E7C766] outline-none transition placeholder:text-gray-700 focus:border-[#DDBE68]/60 focus:ring-4 focus:ring-[#DDBE68]/[0.07]"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Check your inbox for the verification code.
                </p>
              </div>
            )}

            {/* Forgot password */}
            {!requiresOtp && (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#78B7F2] transition hover:text-[#A5D3FA]"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Error */}
            {loginError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-400">
                {loginError}
              </div>
            )}

            {/* Submit button */}
            <div className="relative pt-1">
              <div className="pointer-events-none absolute inset-x-8 bottom-0 h-8 rounded-full bg-[#DDBE68]/10 blur-xl" />

              <div className="relative">
                <RocketButton loading={isLoading}>
                  <span className="flex items-center justify-center gap-2">
                    {requiresOtp ? "Verify & Sign In" : "Sign In to Dashboard"}
                    {!isLoading && <ArrowRight size={17} />}
                  </span>
                </RocketButton>
              </div>
            </div>

            {/* Switch account */}
            {requiresOtp && (
              <button
                type="button"
                onClick={() => {
                  setRequiresOtp(false);
                  setOtp("");
                  setLoginError("");
                }}
                className="w-full text-sm text-gray-400 transition hover:text-white"
              >
                ← Use a different account
              </button>
            )}
          </form>

          {/* Footer */}
          <div className="mt-7 border-t border-white/[0.07] pt-5">
            <p className="text-center text-sm text-gray-400">
              New admin?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#E7C766] transition hover:text-[#F5DE97]"
              >
                Create account
              </Link>
            </p>

            <p className="mt-3 text-center text-sm text-gray-400">
              Employee access?{" "}
              <Link
                to="/employee-login"
                className="font-semibold text-[#78B7F2] transition hover:text-[#A5D3FA]"
              >
                Staff Portal →
              </Link>
            </p>
          </div>
        </div>

        {/* Security footer */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] tracking-wide text-gray-600">
          <ShieldCheck size={13} />
          <span>SECURE ADMIN ACCESS</span>
          <span>·</span>
          <span>VIDBUXAPP</span>
        </div>
      </div>
    </div>
  );
}

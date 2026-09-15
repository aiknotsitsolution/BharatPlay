import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { API_BASE } from "../../config/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);

  const [deviceLocked, setDeviceLocked] = useState(false);
  const [deviceLockEmail, setDeviceLockEmail] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  useEffect(() => {
    if (!otpRequired || otpCountdown <= 0) return;

    const timer = setTimeout(() => {
      setOtpCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpRequired, otpCountdown]);

  const startOtpCountdown = (seconds = 60) => {
    setOtpCountdown(seconds);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setOtpRequired(false);
    setOtp("");
    setOtpCountdown(0);
    setResendingOtp(false);
    setDeviceLocked(false);
    setClaimError("");
  };

  // Shared success logic (used by both email/password and Google)
  const handleAuthSuccess = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("auth-change"));
    toast.success("Welcome! Authentication successful.");
    navigate(from, { replace: true });
  };

  // Plain email/password login used by the form AND by the auto-login after a
  // successful "Continue on this device" claim.
  const performLogin = async (email, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Authentication failed");
    handleAuthSuccess(data);
  };

  const handleEmailSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.name) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (otpRequired && !otp) {
      setError("Please enter the OTP sent to your email.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const body = {
        ...(isLogin
          ? {
              email: formData.email,
              password: formData.password,
            }
          : { ...formData }),
        ...(otpRequired ? { otp } : {}),
      };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === "DEVICE_LOCKED") {
          setDeviceLocked(true);
          setDeviceLockEmail(formData.email);
          setClaimPassword(formData.password);
          setError(data.message || "Authentication failed");
          return;
        }
        throw new Error(data.message || "Authentication failed");
      }

      if (data.requiresOtp) {
        setOtpRequired(true);
        setOtp("");
        startOtpCountdown(60);
        setError(
          isLogin
            ? "OTP sent to your email. Enter the 6-digit code to continue."
            : "OTP sent to your email. Verify it to complete registration.",
        );
        toast.info("OTP sent to your email. Please verify it.");
        return;
      }

      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData.email || otpCountdown > 0) {
      return;
    }

    setResendingOtp(true);
    setError("");

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not resend OTP");
      }

      if (data.requiresOtp) {
        setOtpRequired(true);
        setOtp("");
        startOtpCountdown(60);
        toast.info("A new OTP has been sent to your email.");
        return;
      }

      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message || "Could not resend OTP");
      toast.error(err.message || "Could not resend OTP");
    } finally {
      setResendingOtp(false);
    }
  };

  // "Continue on this device" recovery flow (device-lock 403 path)
  const handleClaimDevice = async () => {
    const email = deviceLockEmail;
    const password = claimPassword;
    if (!email || !password) return;
    setClaiming(true);
    setClaimError("");

    try {
      const res = await fetch(`${API_BASE}/claim-device`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Could not continue on this device");

      setShowClaimModal(false);
      setDeviceLocked(false);
      setClaimError("");
      setClaimPassword("");
      toast.success(
        "All other sessions have been signed out. Signing you in...",
      );

      // Continue the login flow automatically on the now-bound device.
      setFormData((f) => ({ ...f, email }));
      await performLogin(email, password);
    } catch (err) {
      setClaimError(
        err.message || "Could not continue on this device. Please try again.",
      );
      toast.error("Could not continue on this device. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  // Decode the email from Google's id_token JWT payload (for the claim flow).
  const decodeGoogleEmail = (credential) => {
    try {
      const payload = credential
        .split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      return JSON.parse(atob(payload)).email || "";
    } catch (_) {
      return "";
    }
  };

  // Google login handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          credential: credentialResponse.credential, // this is the id_token
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === "DEVICE_LOCKED") {
          // Same recovery flow as email/password: no silent rebinding.
          setDeviceLocked(true);
          setDeviceLockEmail(decodeGoogleEmail(credentialResponse.credential));
          setClaimPassword("");
          setError(data.message || "Google login failed");
          return;
        }
        throw new Error(data.message || "Google login failed");
      }

      handleAuthSuccess(data);
    } catch (err) {
      const message = err.message || "Could not sign in with Google";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const message = "Google sign-in failed. Please try again.";
    setError(message);
    toast.error(message);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-8 pb-4 text-center">
            <h1 className="text-3xl font-bold text-red-600">Bharat Play</h1>
            <p className="text-gray-400 mt-2">
              {isLogin ? "Sign in to continue" : "Create your account"}
            </p>
          </div>

          <div className="flex border-b border-gray-800">
            <button
              onClick={() => {
                setDeviceLocked(false);
                setShowClaimModal(false);
                setClaimError("");
                setOtpRequired(false);
                setOtp("");
                setOtpCountdown(0);
                setIsLogin(true);
              }}
              className={`flex-1 py-4 font-medium ${
                isLogin
                  ? "text-white border-b-2 border-red-600"
                  : "text-gray-400"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setDeviceLocked(false);
                setShowClaimModal(false);
                setClaimError("");
                setOtpRequired(false);
                setOtp("");
                setOtpCountdown(0);
                setIsLogin(false);
              }}
              className={`flex-1 py-4 font-medium ${
                !isLogin
                  ? "text-white border-b-2 border-red-600"
                  : "text-gray-400"
              }`}
            >
              Register
            </button>
          </div>

          <div className="p-8 pt-6 space-y-5">
            {deviceLocked && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm space-y-1">
                <p className="font-semibold text-red-200">
                  Account already active on another device
                </p>
                <p>
                  This account is currently linked to another browser or device.
                  If you want to use this account here, you can sign out all
                  other active sessions and continue on this device.
                </p>
              </div>
            )}
            {!deviceLocked && error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {deviceLocked && (
              <button
                type="button"
                onClick={() => {
                  setClaimError("");
                  setShowClaimModal(true);
                }}
                disabled={claiming}
                className="w-full py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                Continue on this device
              </button>
            )}

            {/* Google Button – works for both login & signup (hidden when unconfigured) */}
            {GOOGLE_CLIENT_ID && (
              <div className="flex justify-center">
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black" // or "outline"
                    text={isLogin ? "signin_with" : "signup_with"} // "signup_with" available
                    shape="rectangular"
                    logo_alignment="left"
                    width="100%"
                  />
                </GoogleOAuthProvider>
              </div>
            )}

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-5">
              {!isLogin && (
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#121212] border border-gray-700 rounded-lg py-3.5 pl-11 pr-4 focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#121212] border border-gray-700 rounded-lg py-3.5 pl-11 pr-4 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#121212] border border-gray-700 rounded-lg py-3.5 pl-11 pr-12 focus:outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {otpRequired && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="w-full bg-[#121212] border border-gray-700 rounded-lg py-3.5 px-4 focus:outline-none focus:border-red-600 text-center tracking-[0.35em]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                    <span>
                      {otpCountdown > 0
                        ? `Resend OTP in ${otpCountdown}s`
                        : "Didn't receive the code?"}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendingOtp || otpCountdown > 0 || loading}
                      className="font-medium text-red-400 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {resendingOtp ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  loading ? "bg-gray-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading
                  ? "Processing..."
                  : otpRequired
                    ? isLogin
                      ? "Verify OTP & Sign In"
                      : "Verify OTP & Create Account"
                    : isLogin
                      ? "Sign In"
                      : "Create Account"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-6">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceLocked(false);
                      setShowClaimModal(false);
                      setClaimError("");
                      setOtpRequired(false);
                      setOtp("");
                      setIsLogin(false);
                    }}
                    className="text-red-500 hover:text-red-400"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceLocked(false);
                      setShowClaimModal(false);
                      setClaimError("");
                      setOtpRequired(false);
                      setOtp("");
                      setIsLogin(true);
                    }}
                    className="text-red-500 hover:text-red-400"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================== CONFIRM CONTINUE ON THIS DEVICE ====================== */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl p-6 space-y-5">
            <h2 className="text-xl font-semibold">Continue on this device?</h2>
            <p className="text-sm text-gray-400">
              This will sign you out from all other browsers and devices where
              this account is currently active.
            </p>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Account: {deviceLockEmail || "your account"}
              </label>
              <input
                type="password"
                placeholder="Enter your password to continue"
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                className="w-full bg-[#121212] border border-gray-700 rounded-lg py-3 pl-4 pr-4 focus:outline-none focus:border-red-600"
              />
            </div>

            {claimError && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                {claimError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                disabled={claiming}
                className="flex-1 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClaimDevice}
                disabled={claiming || !deviceLockEmail || !claimPassword}
                className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {claiming ? "Signing out..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}

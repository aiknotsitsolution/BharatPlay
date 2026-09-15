import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { API_BASE } from "../../config/api";
import AnimatedBackground from "./AnimatedBackground";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function AuthPageV2() {
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

  const handleAuthSuccess = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("auth-change"));
    toast.success("Welcome! Authentication successful.");
    navigate(from, { replace: true });
  };

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
          ? { email: formData.email, password: formData.password }
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
    if (!formData.email || otpCountdown > 0) return;
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
      if (!res.ok) throw new Error(data.message || "Could not resend OTP");

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.code === "DEVICE_LOCKED") {
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

  const resetAllModals = () => {
    setDeviceLocked(false);
    setShowClaimModal(false);
    setClaimError("");
    setOtpRequired(false);
    setOtp("");
    setOtpCountdown(0);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* h-screen + overflow-hidden → no page scroll */}
      <div className="h-screen w-full relative flex items-center justify-center px-3 sm:px-4 overflow-hidden">
        <AnimatedBackground />

        <div className="loginv2-card relative z-10 w-full max-w-[400px] px-5 py-5 sm:px-7 sm:py-6 rounded-2xl animate-cardIn">
          {/* Header - compact */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/20 mb-3">
              <span className="text-xl font-black text-red-500 tracking-tight">
                BP
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Bharat Play
            </h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
              {isLogin ? "Sign in to continue" : "Create your account"}
            </p>
          </div>

          {/* Tabs - compact */}
          <div className="flex rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5 mb-5">
            <button
              onClick={() => {
                resetAllModals();
                setIsLogin(true);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                isLogin
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                resetAllModals();
                setIsLogin(false);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                !isLogin
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <div className="space-y-3">
            {deviceLocked && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm space-y-1.5 backdrop-blur-sm">
                <p className="font-semibold text-red-300 text-sm">
                  Account already active on another device
                </p>
                <p className="text-red-300/70 text-xs leading-relaxed">
                  This account is currently linked to another browser or device.
                  Sign out all other sessions to continue here.
                </p>
              </div>
            )}

            {!deviceLocked && error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 backdrop-blur-sm animate-shake">
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
                className="w-full py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white text-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.98]"
              >
                Continue on this device
              </button>
            )}

            {/* Custom Google Button */}
            {GOOGLE_CLIENT_ID && (
              <div className="relative w-full">
                <div
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl
                    bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.12]
                    text-white text-sm font-medium transition-all duration-300
                    hover:border-white/25 active:scale-[0.98] cursor-pointer
                    pointer-events-none"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isLogin ? "Sign in with Google" : "Sign up with Google"}
                  </span>
                </div>

                <div className="absolute inset-0 opacity-0 cursor-pointer">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    text={isLogin ? "signin_with" : "signup_with"}
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              </div>
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/[0.08]"></div>
              <span className="flex-shrink mx-3 text-gray-500 text-xs uppercase tracking-wider">
                or
              </span>
              <div className="flex-grow border-t border-white/[0.08]"></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {!isLogin && (
                <div className="relative group">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
                    size={16}
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="loginv2-input w-full pl-10 pr-4 py-2.5"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
                  size={16}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="loginv2-input w-full pl-10 pr-4 py-2.5"
                />
              </div>

              <div className="relative group">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
                  size={16}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="loginv2-input w-full pl-10 pr-11 py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {isLogin && !otpRequired && (
                <div className="text-right animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-red-400/80 hover:text-red-300 transition-colors duration-200"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {otpRequired && (
                <div className="space-y-2.5 animate-fadeIn">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="loginv2-input w-full py-2.5 px-4 text-center tracking-[0.3em] text-base"
                  />
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
                      className="font-medium text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {resendingOtp ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="loginv2-button w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {otpRequired
                      ? isLogin
                        ? "Verify OTP & Sign In"
                        : "Verify OTP & Create Account"
                      : isLogin
                        ? "Sign In"
                        : "Create Account"}
                    <ArrowRight size={15} className="ml-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-gray-500 pt-1">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetAllModals();
                      setIsLogin(false);
                    }}
                    className="text-red-400 hover:text-red-300 font-medium transition-colors"
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
                      resetAllModals();
                      setIsLogin(true);
                    }}
                    className="text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Claim Device Modal */}
        {showClaimModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="loginv2-card w-full max-w-md p-5 space-y-4 animate-cardIn">
              <h2 className="text-lg font-semibold text-white">
                Continue on this device?
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                This will sign you out from all other browsers and devices where
                this account is currently active.
              </p>

              <div className="space-y-2">
                <label className="block text-xs text-gray-400 font-medium">
                  Account: {deviceLockEmail || "your account"}
                </label>
                <input
                  type="password"
                  placeholder="Enter your password to continue"
                  value={claimPassword}
                  onChange={(e) => setClaimPassword(e.target.value)}
                  className="loginv2-input w-full py-2.5 px-4"
                />
              </div>

              {claimError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 backdrop-blur-sm">
                  {claimError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  disabled={claiming}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-sm transition-all duration-300 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClaimDevice}
                  disabled={claiming || !deviceLockEmail || !claimPassword}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white text-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.98]"
                >
                  {claiming ? "Signing out..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .loginv2-card {
          position: relative;
          z-index: 10;
          max-height: 92vh;
          overflow-y: auto;
          background: rgba(10, 8, 12, 0.42);
          backdrop-filter: blur(22px) saturate(1.25);
          -webkit-backdrop-filter: blur(22px) saturate(1.25);
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 0 40px rgba(220, 38, 38, 0.18),
            0 0 90px rgba(200, 30, 40, 0.12),
            0 0 140px rgba(180, 25, 35, 0.07),
            0 25px 60px rgba(0, 0, 0, 0.65),
            0 8px 24px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            inset 0 -1px 0 rgba(255, 255, 255, 0.02);
        }

        .loginv2-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            145deg,
            rgba(255, 240, 235, 0.05) 0%,
            rgba(255, 255, 255, 0.015) 30%,
            rgba(220, 50, 50, 0.04) 100%
          );
          pointer-events: none;
          z-index: 0;
        }

        .loginv2-card > * {
          position: relative;
          z-index: 1;
        }

        .loginv2-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .loginv2-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .loginv2-input:focus {
          border-color: rgba(220, 38, 38, 0.5);
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12), 0 0 24px rgba(220, 38, 38, 0.08);
          background: rgba(255, 255, 255, 0.07);
        }

        .loginv2-button {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .loginv2-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .loginv2-button:hover::before {
          opacity: 1;
        }

        .loginv2-button:hover {
          box-shadow: 0 8px 30px rgba(220, 38, 38, 0.4);
          transform: translateY(-1px);
        }

        .loginv2-button:active {
          transform: translateY(0) scale(0.98);
        }

        .loginv2-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loginv2-button:disabled::before {
          display: none;
        }

        .loginv2-button > * {
          position: relative;
          z-index: 1;
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        .animate-cardIn {
          animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.35s ease forwards;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        /* Small height screens */
        @media (max-height: 720px) {
          .loginv2-card {
            max-height: 94vh;
            transform: scale(0.95);
            transform-origin: center;
          }
        }

        @media (max-height: 640px) {
          .loginv2-card {
            transform: scale(0.9);
          }
        }

        @media (max-width: 480px) {
          .loginv2-card {
            backdrop-filter: blur(14px) saturate(1.1);
            -webkit-backdrop-filter: blur(14px) saturate(1.1);
            background: rgba(10, 8, 12, 0.55);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-cardIn,
          .animate-fadeIn,
          .animate-shake {
            animation: none;
          }
          .loginv2-button:hover {
            transform: none;
          }
        }
      `}</style>
    </GoogleOAuthProvider>
  );
}

// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
// import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
// import { toast } from "react-toastify";
// import { API_BASE } from "../../config/api";
// import AnimatedBackground from "./AnimatedBackground";

// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// export default function AuthPageV2()
// {
//   const [isLogin, setIsLogin] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [otpRequired, setOtpRequired] = useState(false);
//   const [otp, setOtp] = useState("");
//   const [otpCountdown, setOtpCountdown] = useState(0);
//   const [resendingOtp, setResendingOtp] = useState(false);

//   const [deviceLocked, setDeviceLocked] = useState(false);
//   const [deviceLockEmail, setDeviceLockEmail] = useState("");
//   const [claimPassword, setClaimPassword] = useState("");
//   const [showClaimModal, setShowClaimModal] = useState(false);
//   const [claiming, setClaiming] = useState(false);
//   const [claimError, setClaimError] = useState("");

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });

//   const navigate = useNavigate();
//   const location = useLocation();
//   const from = location.state?.from?.pathname || "/";

//   useEffect(() =>
//   {
//     const token = localStorage.getItem("token");
//     if (token)
//     {
//       navigate(from, { replace: true });
//     }
//   }, [navigate, from]);

//   useEffect(() =>
//   {
//     if (!otpRequired || otpCountdown <= 0) return;
//     const timer = setTimeout(() =>
//     {
//       setOtpCountdown((prev) => Math.max(0, prev - 1));
//     }, 1000);
//     return () => clearTimeout(timer);
//   }, [otpRequired, otpCountdown]);

//   const startOtpCountdown = (seconds = 60) =>
//   {
//     setOtpCountdown(seconds);
//   };

//   const handleChange = (e) =>
//   {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     setError("");
//     setOtpRequired(false);
//     setOtp("");
//     setOtpCountdown(0);
//     setResendingOtp(false);
//     setDeviceLocked(false);
//     setClaimError("");
//   };

//   const handleAuthSuccess = (data) =>
//   {
//     localStorage.setItem("token", data.token);
//     localStorage.setItem("user", JSON.stringify(data.user));
//     window.dispatchEvent(new Event("auth-change"));
//     toast.success("Welcome! Authentication successful.");
//     navigate(from, { replace: true });
//   };

//   const performLogin = async (email, password) =>
//   {
//     const res = await fetch(`${API_BASE}/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({ email, password }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.message || "Authentication failed");
//     handleAuthSuccess(data);
//   };

//   const handleEmailSubmit = async (e) =>
//   {
//     if (e) e.preventDefault();
//     setLoading(true);
//     setError("");

//     if (!formData.email || !formData.password)
//     {
//       setError("Email and password are required");
//       setLoading(false);
//       return;
//     }

//     if (!isLogin && !formData.name)
//     {
//       setError("Full name is required");
//       setLoading(false);
//       return;
//     }

//     if (formData.password.length < 8)
//     {
//       setError("Password must be at least 8 characters");
//       setLoading(false);
//       return;
//     }

//     if (otpRequired && !otp)
//     {
//       setError("Please enter the OTP sent to your email.");
//       setLoading(false);
//       return;
//     }

//     try
//     {
//       const endpoint = isLogin ? "/login" : "/register";
//       const body = {
//         ...(isLogin
//           ? { email: formData.email, password: formData.password }
//           : { ...formData }),
//         ...(otpRequired ? { otp } : {}),
//       };

//       const res = await fetch(`${API_BASE}${endpoint}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(body),
//       });

//       const data = await res.json();

//       if (!res.ok)
//       {
//         if (res.status === 403 && data.code === "DEVICE_LOCKED")
//         {
//           setDeviceLocked(true);
//           setDeviceLockEmail(formData.email);
//           setClaimPassword(formData.password);
//           setError(data.message || "Authentication failed");
//           return;
//         }
//         throw new Error(data.message || "Authentication failed");
//       }

//       if (data.requiresOtp)
//       {
//         setOtpRequired(true);
//         setOtp("");
//         startOtpCountdown(60);
//         setError(
//           isLogin
//             ? "OTP sent to your email. Enter the 6-digit code to continue."
//             : "OTP sent to your email. Verify it to complete registration."
//         );
//         toast.info("OTP sent to your email. Please verify it.");
//         return;
//       }

//       handleAuthSuccess(data);
//     } catch (err)
//     {
//       setError(err.message);
//       toast.error(err.message || "Authentication failed");
//     } finally
//     {
//       setLoading(false);
//     }
//   };

//   const handleResendOtp = async () =>
//   {
//     if (!formData.email || otpCountdown > 0) return;
//     setResendingOtp(true);
//     setError("");

//     try
//     {
//       const endpoint = isLogin ? "/login" : "/register";
//       const payload = isLogin
//         ? { email: formData.email, password: formData.password }
//         : { name: formData.name, email: formData.email, password: formData.password };

//       const res = await fetch(`${API_BASE}${endpoint}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Could not resend OTP");

//       if (data.requiresOtp)
//       {
//         setOtpRequired(true);
//         setOtp("");
//         startOtpCountdown(60);
//         toast.info("A new OTP has been sent to your email.");
//         return;
//       }
//       handleAuthSuccess(data);
//     } catch (err)
//     {
//       setError(err.message || "Could not resend OTP");
//       toast.error(err.message || "Could not resend OTP");
//     } finally
//     {
//       setResendingOtp(false);
//     }
//   };

//   const handleClaimDevice = async () =>
//   {
//     const email = deviceLockEmail;
//     const password = claimPassword;
//     if (!email || !password) return;
//     setClaiming(true);
//     setClaimError("");

//     try
//     {
//       const res = await fetch(`${API_BASE}/claim-device`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Could not continue on this device");

//       setShowClaimModal(false);
//       setDeviceLocked(false);
//       setClaimError("");
//       setClaimPassword("");
//       toast.success("All other sessions have been signed out. Signing you in...");
//       setFormData((f) => ({ ...f, email }));
//       await performLogin(email, password);
//     } catch (err)
//     {
//       setClaimError(err.message || "Could not continue on this device. Please try again.");
//       toast.error("Could not continue on this device. Please try again.");
//     } finally
//     {
//       setClaiming(false);
//     }
//   };

//   const decodeGoogleEmail = (credential) =>
//   {
//     try
//     {
//       const payload = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
//       return JSON.parse(atob(payload)).email || "";
//     } catch (_)
//     {
//       return "";
//     }
//   };

//   const handleGoogleSuccess = async (credentialResponse) =>
//   {
//     setLoading(true);
//     setError("");

//     try
//     {
//       const res = await fetch(`${API_BASE}/auth/google`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ credential: credentialResponse.credential }),
//       });

//       const data = await res.json();
//       if (!res.ok)
//       {
//         if (res.status === 403 && data.code === "DEVICE_LOCKED")
//         {
//           setDeviceLocked(true);
//           setDeviceLockEmail(decodeGoogleEmail(credentialResponse.credential));
//           setClaimPassword("");
//           setError(data.message || "Google login failed");
//           return;
//         }
//         throw new Error(data.message || "Google login failed");
//       }
//       handleAuthSuccess(data);
//     } catch (err)
//     {
//       const message = err.message || "Could not sign in with Google";
//       setError(message);
//       toast.error(message);
//     } finally
//     {
//       setLoading(false);
//     }
//   };

//   const handleGoogleError = () =>
//   {
//     const message = "Google sign-in failed. Please try again.";
//     setError(message);
//     toast.error(message);
//   };

//   const resetAllModals = () =>
//   {
//     setDeviceLocked(false);
//     setShowClaimModal(false);
//     setClaimError("");
//     setOtpRequired(false);
//     setOtp("");
//     setOtpCountdown(0);
//   };

//   return (
//     <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
//       <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
//         <AnimatedBackground />

//         <div className="loginv2-card relative z-10 w-full max-w-[420px] p-8 sm:p-10 rounded-3xl animate-cardIn">
//           <div className="text-center mb-8">
//             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/20 mb-4">
//               <span className="text-2xl font-black text-red-500 tracking-tight">BP</span>
//             </div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
//               Bharat Play
//             </h1>
//             <p className="text-gray-400 mt-2 text-sm">
//               {isLogin ? "Sign in to continue" : "Create your account"}
//             </p>
//           </div>

//           <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 mb-7">
//             <button
//               onClick={() => { resetAllModals(); setIsLogin(true); }}
//               className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${isLogin
//                   ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20"
//                   : "text-gray-400 hover:text-white"
//                 }`}
//             >
//               Login
//             </button>
//             <button
//               onClick={() => { resetAllModals(); setIsLogin(false); }}
//               className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${!isLogin
//                   ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20"
//                   : "text-gray-400 hover:text-white"
//                 }`}
//             >
//               Register
//             </button>
//           </div>

//           <div className="space-y-4">
//             {deviceLocked && (
//               <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm space-y-2 backdrop-blur-sm">
//                 <p className="font-semibold text-red-300 text-sm">
//                   Account already active on another device
//                 </p>
//                 <p className="text-red-300/70 text-xs leading-relaxed">
//                   This account is currently linked to another browser or device.
//                   Sign out all other sessions to continue here.
//                 </p>
//               </div>
//             )}

//             {!deviceLocked && error && (
//               <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-sm text-red-300 backdrop-blur-sm animate-shake">
//                 {error}
//               </div>
//             )}

//             {deviceLocked && (
//               <button
//                 type="button"
//                 onClick={() => { setClaimError(""); setShowClaimModal(true); }}
//                 disabled={claiming}
//                 className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white text-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.98]"
//               >
//                 Continue on this device
//               </button>
//             )}

//             {GOOGLE_CLIENT_ID && (
//               <div className="relative w-full">
//                 {/* Custom looking button */}
//                 <div className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl
//                     bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.12]
//                     text-white text-sm font-medium transition-all duration-300
//                     hover:border-white/25 active:scale-[0.98] cursor-pointer
//                     pointer-events-none">
//                   <svg width="18" height="18" viewBox="0 0 48 48">
//                     <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
//                     <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
//                     <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
//                     <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
//                   </svg>
//                   <span>{isLogin ? "Sign in with Google" : "Sign up with Google"}</span>
//                 </div>

//                 {/* Actual Google button (invisible but clickable) */}
//                 <div className="absolute inset-0 opacity-0 cursor-pointer">
//                   <GoogleLogin
//                     onSuccess={handleGoogleSuccess}
//                     onError={handleGoogleError}
//                     theme="filled_black"
//                     text={isLogin ? "signin_with" : "signup_with"}
//                     shape="rectangular"
//                     width="100%"
//                   />
//                 </div>
//               </div>
//             )}

//             <div className="relative flex py-2 items-center">
//               <div className="flex-grow border-t border-white/[0.08]"></div>
//               <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider">or</span>
//               <div className="flex-grow border-t border-white/[0.08]"></div>
//             </div>

//             <form onSubmit={handleEmailSubmit} className="space-y-4">
//               {!isLogin && (
//                 <div className="relative group">
//                   <User
//                     className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
//                     size={17}
//                   />
//                   <input
//                     type="text"
//                     name="name"
//                     placeholder="Full Name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     className="loginv2-input w-full pl-11 pr-4 py-3.5"
//                   />
//                 </div>
//               )}

//               <div className="relative group">
//                 <Mail
//                   className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
//                   size={17}
//                 />
//                 <input
//                   type="email"
//                   name="email"
//                   placeholder="Email address"
//                   value={formData.email}
//                   onChange={handleChange}
//                   className="loginv2-input w-full pl-11 pr-4 py-3.5"
//                 />
//               </div>

//               <div className="relative group">
//                 <Lock
//                   className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
//                   size={17}
//                 />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   placeholder="Password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   className="loginv2-input w-full pl-11 pr-12 py-3.5"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
//                 >
//                   {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
//                 </button>
//               </div>

//               {otpRequired && (
//                 <div className="space-y-3 animate-fadeIn">
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={6}
//                     placeholder="Enter 6-digit OTP"
//                     value={otp}
//                     onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
//                     className="loginv2-input w-full py-3.5 px-4 text-center tracking-[0.35em] text-lg"
//                   />
//                   <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
//                     <span>
//                       {otpCountdown > 0
//                         ? `Resend OTP in ${otpCountdown}s`
//                         : "Didn't receive the code?"}
//                     </span>
//                     <button
//                       type="button"
//                       onClick={handleResendOtp}
//                       disabled={resendingOtp || otpCountdown > 0 || loading}
//                       className="font-medium text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
//                     >
//                       {resendingOtp ? "Sending..." : "Resend OTP"}
//                     </button>
//                   </div>
//                 </div>
//               )}

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="loginv2-button w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
//               >
//                 {loading ? (
//                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                 ) : (
//                   <>
//                     {otpRequired
//                       ? isLogin
//                         ? "Verify OTP & Sign In"
//                         : "Verify OTP & Create Account"
//                       : isLogin
//                         ? "Sign In"
//                         : "Create Account"}
//                     <ArrowRight size={16} className="ml-1" />
//                   </>
//                 )}
//               </button>
//             </form>

//             <div className="text-center text-sm text-gray-500 pt-2">
//               {isLogin ? (
//                 <>
//                   Don&apos;t have an account?{" "}
//                   <button
//                     type="button"
//                     onClick={() => { resetAllModals(); setIsLogin(false); }}
//                     className="text-red-400 hover:text-red-300 font-medium transition-colors"
//                   >
//                     Sign up
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   Already have an account?{" "}
//                   <button
//                     type="button"
//                     onClick={() => { resetAllModals(); setIsLogin(true); }}
//                     className="text-red-400 hover:text-red-300 font-medium transition-colors"
//                   >
//                     Sign in
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {showClaimModal && (
//           <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
//             <div className="loginv2-card w-full max-w-md p-6 space-y-5 animate-cardIn">
//               <h2 className="text-lg font-semibold text-white">Continue on this device?</h2>
//               <p className="text-sm text-gray-400 leading-relaxed">
//                 This will sign you out from all other browsers and devices where
//                 this account is currently active.
//               </p>

//               <div className="space-y-2">
//                 <label className="block text-xs text-gray-400 font-medium">
//                   Account: {deviceLockEmail || "your account"}
//                 </label>
//                 <input
//                   type="password"
//                   placeholder="Enter your password to continue"
//                   value={claimPassword}
//                   onChange={(e) => setClaimPassword(e.target.value)}
//                   className="loginv2-input w-full py-3 px-4"
//                 />
//               </div>

//               {claimError && (
//                 <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 backdrop-blur-sm">
//                   {claimError}
//                 </div>
//               )}

//               <div className="flex gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setShowClaimModal(false)}
//                   disabled={claiming}
//                   className="flex-1 py-3 rounded-xl font-medium bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 text-sm transition-all duration-300 active:scale-[0.98]"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleClaimDevice}
//                   disabled={claiming || !deviceLockEmail || !claimPassword}
//                   className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white text-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.98]"
//                 >
//                   {claiming ? "Signing out..." : "Continue"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       <style>{`
//  .loginv2-card {
//   position: relative;
//   z-index: 10;
//   background: rgba(10, 8, 12, 0.42);
//   backdrop-filter: blur(22px) saturate(1.25);
//   -webkit-backdrop-filter: blur(22px) saturate(1.25);
//   border: 1px solid rgba(255, 255, 255, 0.09);
//   box-shadow:
//     0 0 0 1px rgba(255, 255, 255, 0.05),
//     0 0 40px rgba(220, 38, 38, 0.18),
//     0 0 90px rgba(200, 30, 40, 0.12),
//     0 0 140px rgba(180, 25, 35, 0.07),
//     0 25px 60px rgba(0, 0, 0, 0.65),
//     0 8px 24px rgba(0, 0, 0, 0.45),
//     inset 0 1px 0 rgba(255, 255, 255, 0.07),
//     inset 0 -1px 0 rgba(255, 255, 255, 0.02);
//   overflow: hidden; /* important */
// }

// .loginv2-card::before {
//   content: '';
//   position: absolute;
//   inset: 0;
//   border-radius: inherit;
//   background: linear-gradient(
//     145deg,
//     rgba(255, 240, 235, 0.05) 0%,
//     rgba(255, 255, 255, 0.015) 30%,
//     rgba(220, 50, 50, 0.04) 100%
//   );
//   pointer-events: none;   /* ← yeh zaroori hai */
//   z-index: 0;             /* form ke neeche */
// }

// /* Form content ko upar laane ke liye */
// .loginv2-card > * {
//   position: relative;
//   z-index: 1;
// }

//         .loginv2-input {
//           background: rgba(255, 255, 255, 0.05);
//           border: 1px solid rgba(255, 255, 255, 0.1);
//           border-radius: 12px;
//           color: white;
//           font-size: 0.875rem;
//           outline: none;
//           transition: all 0.3s ease;
//         }

//         .loginv2-input::placeholder {
//           color: rgba(255, 255, 255, 0.3);
//         }

//         .loginv2-input:focus {
//           border-color: rgba(220, 38, 38, 0.5);
//           box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12), 0 0 24px rgba(220, 38, 38, 0.08);
//           background: rgba(255, 255, 255, 0.07);
//         }

//         .loginv2-button {
//           background: linear-gradient(135deg, #dc2626, #b91c1c);
//           color: white;
//           border: none;
//           cursor: pointer;
//           position: relative;
//           overflow: hidden;
//           transition: all 0.3s ease;
//         }

//         .loginv2-button::before {
//           content: '';
//           position: absolute;
//           inset: 0;
//           background: linear-gradient(135deg, #ef4444, #dc2626);
//           opacity: 0;
//           transition: opacity 0.3s ease;
//         }

//         .loginv2-button:hover::before {
//           opacity: 1;
//         }

//         .loginv2-button:hover {
//           box-shadow: 0 8px 30px rgba(220, 38, 38, 0.4);
//           transform: translateY(-1px);
//         }

//         .loginv2-button:active {
//           transform: translateY(0) scale(0.98);
//         }

//         .loginv2-button:disabled {
//           opacity: 0.5;
//           cursor: not-allowed;
//           transform: none;
//           box-shadow: none;
//         }

//         .loginv2-button:disabled::before {
//           display: none;
//         }

//         .loginv2-button > * {
//           position: relative;
//           z-index: 1;
//         }

//         @keyframes cardIn {
//           from {
//             opacity: 0;
//             transform: translateY(30px) scale(0.96);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0) scale(1);
//           }
//         }

//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(8px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         @keyframes shake {
//           0%, 100% { transform: translateX(0); }
//           20% { transform: translateX(-4px); }
//           40% { transform: translateX(4px); }
//           60% { transform: translateX(-3px); }
//           80% { transform: translateX(3px); }
//         }

//         .animate-cardIn {
//           animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//         }

//         .animate-fadeIn {
//           animation: fadeIn 0.4s ease forwards;
//         }

//         .animate-shake {
//           animation: shake 0.4s ease-in-out;
//         }

//         @media (max-width: 480px) {
//           .loginv2-card {
//             backdrop-filter: blur(14px) saturate(1.1);
//             -webkit-backdrop-filter: blur(14px) saturate(1.1);
//             background: rgba(10, 8, 12, 0.55);
//           }
//         }

//         @media (prefers-reduced-motion: reduce) {
//           .animate-cardIn,
//           .animate-fadeIn,
//           .animate-shake {
//             animation: none;
//           }
//           .loginv2-button:hover {
//             transform: none;
//           }
//         }
//       `}</style>
//     </GoogleOAuthProvider>
//   );
// }

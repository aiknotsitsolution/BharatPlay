import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { API_BASE } from "../../config/api";
import AnimatedBackground from "./AnimatedBackground";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newPassword, 4=success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);
  const otpTimerRef = useRef(null);

  const startOtpCountdown = useCallback((seconds) => {
    setOtpCountdown(seconds);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    otpTimerRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(otpTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    };
  }, []);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send verification code.");

      toast.info("Verification code sent to your email.");
      setStep(2);
      startOtpCountdown(60);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otp || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit verification code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.message && data.message.toLowerCase().includes("expired")) {
          setError("This verification code has expired. Please request a new one.");
        } else if (data.message && data.message.toLowerCase().includes("incorrect")) {
          setError("The verification code is incorrect.");
        } else if (data.message && data.message.toLowerCase().includes("too many")) {
          setError("Too many incorrect attempts. Please request a new code.");
        } else {
          setError(data.message || "Verification failed. Please try again.");
        }
        return;
      }

      setResetToken(data.resetToken);
      toast.success("OTP verified! Now create your new password.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (!resetToken) {
      setError("Your reset session has expired. Please start again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.message && data.message.toLowerCase().includes("expired")) {
          setError("Your reset session has expired. Please start again.");
        } else {
          setError(data.message || "Failed to reset password. Please try again.");
        }
        return;
      }

      toast.success("Password reset successful!");
      setStep(4);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResendingOtp(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend code.");
      toast.info("New verification code sent to your email.");
      startOtpCountdown(60);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResendingOtp(false);
    }
  };

  const goBack = () => {
    setError("");
    if (step === 2) {
      setStep(1);
      setOtp("");
    } else if (step === 3) {
      setStep(2);
      setNewPassword("");
      setConfirmPassword("");
      setResetToken(null);
    }
  };

  const stepTitle = step === 1
    ? "Forgot Password?"
    : step === 2
    ? "Verify OTP"
    : step === 3
    ? "Create New Password"
    : "Password Reset Successful";

  const stepSubtitle = step === 1
    ? "Enter your registered email address and we'll send you a verification code."
    : step === 2
    ? "Enter the 6-digit code sent to your email."
    : step === 3
    ? "Your new password must be at least 8 characters."
    : "Your password has been updated successfully.";

  return (
    <div className="h-screen w-full relative flex items-center justify-center px-3 sm:px-4 overflow-hidden">
      <AnimatedBackground />

      <div className="loginv2-card relative z-10 w-full max-w-[400px] px-5 py-5 sm:px-7 sm:py-6 rounded-2xl animate-cardIn">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/20 mb-3">
            <span className="text-xl font-black text-red-500 tracking-tight">BP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {stepTitle}
          </h1>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">
            {stepSubtitle}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 backdrop-blur-sm animate-shake mb-3">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-3 animate-fadeIn">
            <div className="relative group">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
                size={16}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="loginv2-input w-full pl-10 pr-4 py-2.5"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="loginv2-button w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight size={15} className="ml-0.5" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-3 animate-fadeIn">
            <div className="relative group">
              <KeyRound
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
                size={16}
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="loginv2-input w-full pl-10 pr-4 py-2.5 text-center tracking-[0.3em] text-base"
                autoFocus
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
                className="font-medium text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {resendingOtp ? "Sending..." : "Resend OTP"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="loginv2-button w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify OTP
                  <ArrowRight size={15} className="ml-0.5" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={goBack}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-3 animate-fadeIn">
            <div className="relative group">
              <EyeOff
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
                size={16}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password (min. 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="loginv2-input w-full pl-10 pr-11 py-2.5"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative group">
              <EyeOff
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors duration-300"
                size={16}
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="loginv2-input w-full pl-10 pr-11 py-2.5"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-amber-400/80 text-xs animate-fadeIn">
                Password must be at least 8 characters.
              </p>
            )}

            {newPassword.length >= 8 && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-400/80 text-xs animate-fadeIn">
                Passwords do not match.
              </p>
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
                  Reset Password
                  <ArrowRight size={15} className="ml-0.5" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={goBack}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center space-y-4 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/15 border border-green-500/25">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="loginv2-button w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
            >
              Go to Login
              <ArrowRight size={15} className="ml-0.5" />
            </button>
          </div>
        )}

        {/* CSS */}
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

          @media (max-height: 720px) {
            .loginv2-card {
              max-height: 94vh;
              transform: scale(0.95);
              transform-origin: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

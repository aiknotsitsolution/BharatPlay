import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  KeyRound,
  CheckCircle,
  Lock,
  ShieldCheck,
} from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [step, setStep] = useState("email");
  const otpRequestInFlight = useRef(false);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setTimeout(
      () => setResendSeconds((seconds) => seconds - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const requestOtp = async () => {
    if (otpRequestInFlight.current || resendSeconds > 0) return;
    otpRequestInFlight.current = true;
    setIsLoading(true);
    try {
      const res = await API.post("/admin/forgot-password", { email });
      if (!res.data.success)
        throw new Error(res.data.message || "Something went wrong");
      setStep("otp");
      setResendSeconds(60);
      toast.success(
        res.data.message ||
          "If this email is registered, a verification code has been sent.",
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to send verification code. Try again.",
      );
    } finally {
      otpRequestInFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === "email") {
      await requestOtp();
      return;
    }

    if (step === "otp") {
      if (!/^\d{6}$/.test(otp)) {
        toast.error("Please enter the 6-digit verification code.");
        return;
      }
      setIsLoading(true);
      try {
        const res = await API.post("/admin/verify-reset-otp", { email, otp });
        if (!res.data.success)
          throw new Error(res.data.message || "Verification failed.");
        setResetToken(res.data.resetToken);
        setStep("password");
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Could not verify the code.",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.post("/admin/reset-password", {
        token: resetToken,
        newPassword,
      });
      if (!res.data.success)
        throw new Error(res.data.message || "Password reset failed.");
      setStep("success");
      toast.success(res.data.message || "Password reset successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Could not reset your password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stepContent = {
    email: {
      title: "Forgot Password",
      description:
        "Enter your registered email address. We will send you a 6-digit verification code.",
      button: "Send verification code",
      icon: <KeyRound size={15} />,
    },
    otp: {
      title: "Verify your email",
      description: (
        <>
          Enter the 6-digit code sent to{" "}
          <span className="text-bp-text font-medium">{email}</span>.
        </>
      ),
      button: "Verify code",
      icon: <ShieldCheck size={16} />,
    },
    password: {
      title: "Create a new password",
      description: "Choose a new password with at least 8 characters.",
      button: "Reset password",
      icon: <Lock size={16} />,
    },
  };
  const currentStep = stepContent[step];

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
              <p className="text-bp-text-secondary text-sm mt-1.5">
                {step === "success" ? "Password Updated" : "Account Recovery"}
              </p>
            </div>
          </div>
          {step === "success" ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-bp-text">
                  Password reset complete
                </h2>
                <p className="text-bp-text-secondary text-sm mt-1">
                  You can now sign in with your new password.
                </p>
              </div>
              <Link
                to="/admin-login"
                className="inline-flex items-center gap-2 text-sm font-medium text-bp-blue hover:opacity-80 transition mt-4"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-bp-text text-center">
                {currentStep.title}
              </h2>
              <p className="text-bp-text-secondary text-sm mt-1 mb-5 text-center">
                {currentStep.description}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {step === "email" && (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-bp-text-secondary mb-1"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bp-text-muted w-[18px] h-[18px]" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="admin@bharatplay.com"
                        className="w-full pl-10 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>
                )}
                {step === "otp" && (
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-bp-text-secondary mb-1"
                    >
                      Verification code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      required
                      placeholder="6-digit code"
                      maxLength={6}
                      className="w-full px-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg placeholder:text-bp-text-muted focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm tracking-[0.3em]"
                    />
                  </div>
                )}
                {step === "password" && (
                  <>
                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-sm font-medium text-bp-text-secondary mb-1"
                      >
                        New password
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-sm font-medium text-bp-text-secondary mb-1"
                      >
                        Confirm new password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-4 py-2.5 bg-bp-card border border-bp-border text-bp-text rounded-lg focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue outline-none transition-colors text-sm"
                      />
                    </div>
                  </>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-lg btn-primary font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm inline-flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-30"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Please wait...
                    </span>
                  ) : (
                    <>
                      {currentStep.icon} {currentStep.button}
                    </>
                  )}
                </button>
              </form>
              {step === "otp" && (
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={isLoading || resendSeconds > 0}
                  className="w-full mt-3 text-sm font-medium text-bp-blue hover:opacity-80 disabled:opacity-50 transition"
                >
                  {resendSeconds > 0
                    ? `Resend code in ${resendSeconds}s`
                    : "Resend code"}
                </button>
              )}
              <div className="text-center mt-5">
                <Link
                  to="/admin-login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-bp-blue hover:opacity-80 transition"
                >
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

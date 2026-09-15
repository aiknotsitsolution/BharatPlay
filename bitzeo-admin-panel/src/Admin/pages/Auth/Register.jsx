import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [regStatus, setRegStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    API.get("/admin/registration-status")
      .then((res) => {
        if (!cancelled) setRegStatus(res.data);
      })
      .catch(() => {
        if (!cancelled) setRegStatus({ success: false, registrationAvailable: false });
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await API.post("/admin/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Registration failed");
      }

      toast.success(res.data.message || "Admin account created successfully!");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const regNotAvailable = regStatus && !regStatus.registrationAvailable;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Administrative Account Setup
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Create an administrator account for this panel
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Security Status */}
          {regStatus && !regNotAvailable && (
            <div className="mx-5 mt-5 px-4 py-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  Registration authorized
                </p>
                <p className="text-xs text-emerald-400/70">
                  Protected by server-side setup credentials
                </p>
              </div>
            </div>
          )}

          {/* {regNotAvailable && (
            <div className="mx-5 mt-5 px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">
                  Registration not available
                </p>
                <p className="text-xs text-red-400/70">
                  Contact your system administrator to enable admin registration.
                </p>
              </div>
            </div>
          )} */}

          {/* Loading status */}
          {!regStatus && (
            <div className="mx-5 mt-5 px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-gray-400 shrink-0 animate-spin" />
              <p className="text-sm text-gray-400">Checking registration status...</p>
            </div>
          )}

          {/* Form */}
          <div className="p-5 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    autoComplete="name"
                    className="w-full pl-10 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg
                               placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="admin@company.com"
                    autoComplete="email"
                    className="w-full pl-10 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg
                               placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg
                               placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="w-full pl-10 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg
                               placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || regNotAvailable || !regStatus}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed
                           text-white py-2.5 rounded-lg font-medium transition-all duration-200 mt-1 text-sm"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  "Create Admin Account"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline transition"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

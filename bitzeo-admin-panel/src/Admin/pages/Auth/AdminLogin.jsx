import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await API.post("/admin/admin-login", { email, password });

      if (!res.data.success) {
        throw new Error(res.data.message || "Login failed");
      }

      // Save token & admin info
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));
      localStorage.setItem("adminRole", "admin");

      // Dispatch auth event
      window.dispatchEvent(new Event("auth-change"));

      toast.success(res.data.message || "Login successful!", {
        style: {
          background: "#1f2937",
          color: "#f9fafb",
          border: "1px solid #374151",
        },
      });

      navigate("/", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      setLoginError(message);

      toast.error(message, {
        style: {
          background: "#1f2937",
          color: "#f9fafb",
          border: "1px solid #374151",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Admin<span className="text-indigo-400">X</span>
          </h1>
          <p className="text-gray-400 mt-2">👨‍💼 Admin Login</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg 
                             placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                             outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg 
                             placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                             outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                Forgot Password?
              </Link>
            </div>

            {loginError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {loginError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 
                         disabled:cursor-not-allowed text-white font-medium rounded-lg 
                         transition duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            New admin?{" "}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Register
            </Link>
          </p>

          {/* Employee Login Link */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-center text-sm text-gray-400">
              Employee login?{" "}
              <Link
                to="/employee-login"
                className="text-amber-400 hover:text-amber-300 font-medium transition"
              >
                Staff Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

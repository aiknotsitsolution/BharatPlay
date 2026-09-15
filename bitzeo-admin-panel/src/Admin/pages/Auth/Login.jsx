import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

const ROLES = [
  { value: "admin", label: "Admin - Full Access", icon: "👨‍💼" },
  { value: "finance", label: "Finance - Finance Module", icon: "💰" },
  { value: "support", label: "Support - Support Module", icon: "🎧" },
  { value: "read-only", label: "Read-Only - View Only", icon: "👁️" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await API.post("/admin/login", { email, password, role });

      if (!res.data.success) {
        throw new Error(res.data.message || "Login failed");
      }

      // Save token & admin info with role
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));
      localStorage.setItem("adminRole", res.data.user.role || role);

      // Dispatch auth event to sync header/sidebar
      window.dispatchEvent(new Event("auth-change"));

      toast.success(res.data.message || "Login successful!", {
        style: {
          background: "#1f2937",
          color: "#f9fafb",
          border: "1px solid #374151",
        },
      });

      // Route based on role
      const userRole = res.data.user.role || role;
      if (userRole === "finance") {
        navigate("/finance-dashboard", { replace: true });
      } else if (userRole === "support") {
        navigate("/support-dashboard", { replace: true });
      } else if (userRole === "read-only") {
        navigate("/read-only-dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";

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
          <p className="text-gray-400 mt-2">Admin Login</p>
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
                  placeholder="admin@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg 
                             placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                             outline-none transition"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                <Shield size={16} className="text-indigo-400" />
                Login Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           outline-none transition cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select your role to access the corresponding dashboard
              </p>
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
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

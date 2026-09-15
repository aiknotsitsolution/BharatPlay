import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import API from "../../../api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // NOTE: the backend admin forgot-password endpoint is not implemented yet,
      // so this request currently returns 404. Wired to the env-based API instance
      // so it works as soon as the endpoint exists.
      const res = await API.post("/admin/forgot-password", { email });

      if (!res.data.success) {
        throw new Error(res.data.message || "Something went wrong");
      }

      toast.success(res.data.message || "Reset link sent to your email!");
      setIsSuccess(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to send reset link. Try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 text-white text-center py-8">
          <h1 className="text-3xl font-bold">AdminX</h1>
          <p className="text-indigo-200 mt-1">Forgot Password</p>
        </div>

        <div className="p-8">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-gray-600 text-sm">
                We have sent a password reset link to <strong>{email}</strong>
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-indigo-600 hover:underline mt-4"
              >
                <ArrowLeft size={18} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6 text-center">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@gmail.com"
                      className="w-full pl-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-medium transition"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
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

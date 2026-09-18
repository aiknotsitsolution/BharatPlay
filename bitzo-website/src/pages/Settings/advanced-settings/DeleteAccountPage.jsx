import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Trash2, ShieldCheck, Clock, UserX, Mail, Loader2 } from "lucide-react";
import LegalPageLayout from "../../../components/public/LegalPageLayout";
import { useTheme } from "../../../context/ThemeContext";
import { submitDeletionRequest } from "../../../api/support";
import SITE from "../../../config/site";

const REASONS = [
  "Not the account I want",
  "Too many emails or notifications",
  "Privacy concerns",
  "No longer using BharatPlay",
  "I want to start fresh",
  "Other",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getLoggedInUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getInitialDeletionForm = () => {
  const user = getLoggedInUser();
  return {
    email: user?.email || "",
    accountIdentifier: "",
    reason: "",
  };
};

export default function DeleteAccountPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [step, setStep] = useState("form"); // form | confirm | success
  const [form, setForm] = useState(getInitialDeletionForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Please enter the email address on your account.";
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = "Please enter a valid email address.";
    else if (form.email.trim().length > 200) next.email = "Email must be 200 characters or fewer.";

    if (form.accountIdentifier && form.accountIdentifier.trim().length > 200)
      next.accountIdentifier = "Account identifier must be 200 characters or fewer.";
    if (form.reason && form.reason.trim().length > 1000)
      next.reason = "Reason must be 1000 characters or fewer.";

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    setServerError("");

    const result = await submitDeletionRequest({
      email: form.email.trim(),
      accountIdentifier: form.accountIdentifier.trim(),
      reason: form.reason.trim(),
    });

    setSubmitting(false);

    if (result.success) {
      setStep("confirm");
    } else {
      setServerError(result.message || "Failed to submit. Please try again.");
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setServerError("");

    const result = await submitDeletionRequest({
      email: form.email.trim(),
      accountIdentifier: form.accountIdentifier.trim(),
      reason: form.reason.trim(),
    });

    setSubmitting(false);

    if (result.success) {
      setStep("success");
    } else {
      setServerError(result.message || "Failed to submit. Please try again.");
    }
  };

  const errorText = (key) =>
    errors[key] ? (
      <p id={`delete-${key}-error`} className="mt-1.5 text-sm text-red-400" role="alert">
        {errors[key]}
      </p>
    ) : null;

  const inputClasses = (key) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
      isDark ? "bg-[#121212] text-white placeholder-zinc-600" : "bg-gray-50 text-gray-900 placeholder-gray-400"
    } ${
      errors[key]
        ? "border-red-600/70 focus:border-red-500 focus:ring-red-500/30"
        : isDark
          ? "border-zinc-800 hover:border-zinc-700 focus:border-red-500 focus:ring-red-500/30"
          : "border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500/30"
    }`;

  return (
    <LegalPageLayout
      title="Account & Data Deletion"
      description="Request deletion of your BharatPlay account and associated personal information through the Account & Data Deletion page."
      intro="Your privacy matters. If you no longer wish to use BharatPlay, you can request the deletion of your account and the personal information associated with it."
    >
      {/* Explanation */}
      <div className={`space-y-4 text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
        <p>
          Deleting your account means your profile, your uploaded content and
          other account-related personal information associated with the
          provided email address will be processed for removal from the
          Service.
        </p>
        <p>
          Please note that deleting an account is significant. Your uploaded
          videos, channel information, rewards balance and access to features
          that require a signed-in account will no longer be available after
          deletion is completed.
        </p>
      </div>

      {/* Deletion request form */}
      <div className={`mt-8 rounded-2xl border p-6 sm:p-8 ${isDark ? "border-zinc-800/70 bg-[#161616]" : "border-gray-200 bg-white"}`}>
        {step === "success" ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Deletion request received</h2>
            <p className={`mt-2 max-w-md text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
              We've received your deletion request for{" "}
              <span className={isDark ? "text-zinc-200" : "text-gray-700"}>{form.email}</span>. Our team
              will verify your request and process the deletion of your account
              and associated personal information in accordance with applicable
              law. You will receive a confirmation email shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setForm(getInitialDeletionForm());
                setErrors({});
                setStep("form");
              }}
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                isDark
                  ? "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              Submit another request
            </button>
            <Link
              to="/my-support-requests"
              className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
            >
              Track your request status
            </Link>
          </div>
        ) : (
          <>
            {step === "form" ? (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Deletion request form</h2>
                <p className={`mt-1 text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                  Provide the email address linked to the account you want
                  deleted. Additional identifiers help us locate the correct
                  account.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="delete-email" className={`mb-1.5 block text-sm font-medium ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                      Email Address *
                    </label>
                    <input
                      id="delete-email"
                      type="email"
                      autoComplete="email"
                      maxLength={200}
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "delete-email-error" : undefined}
                      className={inputClasses("email")}
                      placeholder="you@example.com"
                    />
                    {errorText("email")}
                  </div>

                  <div>
                    <label htmlFor="delete-account-id" className={`mb-1.5 block text-sm font-medium ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                      Account Identifier (optional)
                    </label>
                    <input
                      id="delete-account-id"
                      type="text"
                      maxLength={200}
                      value={form.accountIdentifier}
                      onChange={(e) => setField("accountIdentifier", e.target.value)}
                      aria-invalid={Boolean(errors.accountIdentifier)}
                      aria-describedby={errors.accountIdentifier ? "delete-accountIdentifier-error" : undefined}
                      className={inputClasses("accountIdentifier")}
                      placeholder="Username or channel name, if applicable"
                    />
                    {errorText("accountIdentifier")}
                  </div>

                  <div>
                    <label htmlFor="delete-reason" className={`mb-1.5 block text-sm font-medium ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                      Reason for deletion (optional)
                    </label>
                    <select
                      id="delete-reason"
                      value={form.reason}
                      onChange={(e) => setField("reason", e.target.value)}
                      className={inputClasses("reason")}
                    >
                      <option value="">Select a reason (optional)</option>
                      {REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                    <p className={`mt-1.5 text-xs ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                      We use reasons to improve the Service. You can leave this
                      empty if you prefer.
                    </p>
                    {errorText("reason")}
                  </div>
                </div>

                {serverError && (
                  <p className="mt-4 text-sm text-red-400">{serverError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {submitting ? "Submitting..." : "Request Account Deletion"}
                </button>
              </form>
            ) : (
              <div className="text-center sm:text-left">
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Please confirm</h2>
                <p className={`mx-auto mt-2 max-w-lg text-sm leading-relaxed sm:mx-0 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                  Are you sure you want to request deletion of the BharatPlay
                  account associated with{" "}
                  <span className={isDark ? "text-zinc-200" : "text-gray-700"}>{form.email}</span>? This
                  action cannot be undone once completed.
                </p>
                {serverError && (
                  <p className="mt-4 text-sm text-red-400">{serverError}</p>
                )}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {submitting ? "Processing..." : "Confirm Deletion Request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                      isDark
                        ? "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data handling details */}
      <div className="mt-8 space-y-5">
        <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>What happens after you request deletion</h2>
        <div className="space-y-4">
          {[
            {
              icon: UserX,
              title: "Account deletion",
              body: "Your account profile and account-related personal information will be processed for deletion. Content you uploaded may also be removed from the Service.",
            },
            {
              icon: ShieldCheck,
              title: "Legally required retention",
              body: "Some information may be retained where required by applicable law, or for legitimate purposes such as fraud prevention, dispute resolution and legal obligations.",
            },
            {
              icon: Clock,
              title: "Processing time",
              body: "We do not advertise a fixed processing window. Our team will process your verified request as soon as possible and in line with applicable law. A status update is not guaranteed through this form.",
            },
            {
              icon: Mail,
              title: "Support contact",
              body: SITE.supportEmail
                ? `For help with account deletion or privacy requests, email us at ${SITE.supportEmail} or use the Contact page.`
                : "For help with account deletion or privacy requests, use the Contact page and our team will respond.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`flex items-start gap-4 rounded-xl border p-4 sm:p-5 ${isDark ? "border-zinc-800/70 bg-[#161616]" : "border-gray-200 bg-white"}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${isDark ? "bg-zinc-800/80 ring-zinc-700/60" : "bg-gray-100 ring-gray-200"}`}>
                  <Icon size={16} className="text-red-500" />
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${isDark ? "text-zinc-100" : "text-gray-800"}`}>{item.title}</h3>
                  <p className={`mt-1 text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </LegalPageLayout>
  );
}

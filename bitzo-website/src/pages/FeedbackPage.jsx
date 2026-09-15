import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { SettingsPageShell, SettingsPageHeader } from "../components/common/SettingsShared";

const FEEDBACK_TYPES = [
  "General Feedback",
  "Bug Report",
  "Feature Request",
  "UI/UX Feedback",
  "Performance Issue",
  "Other",
];

const INITIAL_FORM = { type: "", subject: "", message: "" };

function validate(form) {
  const errors = {};
  if (!form.type) errors.type = "Please select a feedback type.";
  if (!form.subject.trim()) errors.subject = "Subject is required.";
  else if (form.subject.trim().length < 3)
    errors.subject = "Subject must be at least 3 characters.";
  if (!form.message.trim()) errors.message = "Message is required.";
  else if (form.message.trim().length < 10)
    errors.message = "Message must be at least 10 characters.";
  return errors;
}

export default function FeedbackPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // No backend feedback API exists yet.
      // Simulate a brief delay, then show success.
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
      toast.success("Feedback submitted successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SettingsPageShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-green-900/30 p-4">
            <CheckCircle size={32} className="text-green-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-200">Thank you!</h2>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">
            Your feedback has been received. We appreciate you helping us
            improve Bharat Play.
          </p>
          <button
            onClick={() => {
              setForm(INITIAL_FORM);
              setSubmitted(false);
              setErrors({});
            }}
            className="mt-6 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Send Another
          </button>
        </div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell>
      <SettingsPageHeader title="Send Feedback" />

      <p className="mt-2 max-w-2xl text-sm text-zinc-500">
        Help us improve Bharat Play. Your feedback is reviewed by our team.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 space-y-5"
      >
        {/* Feedback Type */}
        <div>
          <label
            htmlFor="feedback-type"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Feedback Type
          </label>
          <select
            id="feedback-type"
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            className={`w-full appearance-none rounded-xl border bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-200 transition-colors focus:outline-none ${
              errors.type
                ? "border-red-500/50 focus:border-red-500"
                : "border-zinc-800 focus:border-zinc-700"
            }`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
            }}
          >
            <option value="">Select a type...</option>
            {FEEDBACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-400">{errors.type}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="feedback-subject"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Subject
          </label>
          <input
            id="feedback-subject"
            type="text"
            value={form.subject}
            onChange={(e) => updateField("subject", e.target.value)}
            placeholder="Brief summary of your feedback"
            className={`w-full rounded-xl border bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:outline-none ${
              errors.subject
                ? "border-red-500/50 focus:border-red-500"
                : "border-zinc-800 focus:border-zinc-700"
            }`}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-400">{errors.subject}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="feedback-message"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Message
          </label>
          <textarea
            id="feedback-message"
            rows={5}
            value={form.message}
            onChange={(e) => updateField("message", e.target.value)}
            placeholder="Describe your feedback in detail..."
            className={`w-full resize-none rounded-xl border bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:outline-none ${
              errors.message
                ? "border-red-500/50 focus:border-red-500"
                : "border-zinc-800 focus:border-zinc-700"
            }`}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-400">{errors.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          <Send size={14} />
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      {/* Note */}
      <p className="mt-6 text-xs text-zinc-600">
        Note: Feedback submission is currently processed locally. A backend
        endpoint is not yet connected.
      </p>
    </SettingsPageShell>
  );
}

import { useState } from "react";
import { Mail, HelpCircle, ShieldCheck, UserX, AlertTriangle, Briefcase, CheckCircle2, Send } from "lucide-react";
import LegalPageLayout from "../../components/public/LegalPageLayout";
import SITE from "../../config/site";

const INQUIRY_TYPES = [
  "General Inquiry",
  "Technical Support",
  "Privacy Request",
  "Data Deletion",
  "Complaint",
  "Business Inquiry",
  "Other",
];

const CONTACT_CHANNELS = [
  { icon: HelpCircle, title: "General inquiries", body: "Questions about BharatPlay, its features or how to get started." },
  { icon: Briefcase, title: "Technical support", body: "Issues with signing in, playback, uploads, payments or the application." },
  { icon: ShieldCheck, title: "Privacy requests", body: "Questions about your data or requests related to the Privacy Policy." },
  { icon: UserX, title: "Data deletion", body: "Requests to delete your account and associated personal information." },
  { icon: AlertTriangle, title: "Complaints", body: "Report inappropriate content, bugs, security concerns or policy violations." },
  { icon: Briefcase, title: "Business inquiries", body: "Partnerships, advertising or other business opportunities." },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    inquiryType: INQUIRY_TYPES[0],
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your full name.";
    else if (form.name.trim().length > 100) next.name = "Name must be 100 characters or fewer.";

    if (!form.email.trim()) next.email = "Please enter your email address.";
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = "Please enter a valid email address.";
    else if (form.email.trim().length > 200) next.email = "Email must be 200 characters or fewer.";

    if (!form.subject.trim()) next.subject = "Please enter a subject.";
    else if (form.subject.trim().length > 150) next.subject = "Subject must be 150 characters or fewer.";

    if (!form.message.trim()) next.message = "Please write a message.";
    else if (form.message.trim().length < 10) next.message = "Message must be at least 10 characters.";
    else if (form.message.trim().length > 5000) next.message = "Message must be 5000 characters or fewer.";

    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    // Frontend-only submission. Backend/email integration can be added here.
    setSubmitted(true);
  };

  const errorText = (key) =>
    errors[key] ? (
      <p id={`${key}-error`} className="mt-1.5 text-sm text-red-400" role="alert">
        {errors[key]}
      </p>
    ) : null;

  const inputClasses = (key) =>
    `w-full rounded-xl border bg-[#121212] px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:outline-none focus:ring-2 ${
      errors[key]
        ? "border-red-600/70 focus:border-red-500 focus:ring-red-500/30"
        : "border-zinc-800 hover:border-zinc-700 focus:border-red-500 focus:ring-red-500/30"
    }`;

  return (
    <LegalPageLayout
      title="Contact & Support"
      description="Contact the BharatPlay team for general inquiries, technical support, privacy requests, data deletion, complaints or business inquiries."
      intro="We're here to help. Choose the topic that best matches your request and send us a message — our team will get back to you."
    >
      {/* Contact options */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CONTACT_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.title}
              className="rounded-xl border border-zinc-800/70 bg-[#161616] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 ring-1 ring-zinc-700/60">
                  <Icon size={16} className="text-red-500" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-100">{channel.title}</h2>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{channel.body}</p>
            </div>
          );
        })}
      </div>

      {SITE.supportEmail && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-[#161616] p-4">
          <Mail size={18} className="shrink-0 text-red-500" />
          <p className="text-sm text-zinc-400">
            Prefer email? Reach us directly at{" "}
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="font-medium text-zinc-200 transition-colors hover:text-white"
            >
              {SITE.supportEmail}
            </a>
          </p>
        </div>
      )}

      {/* Contact form */}
      <div className="mt-8 rounded-2xl border border-zinc-800/70 bg-[#161616] p-6 sm:p-8">
        {submitted ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Request received</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              Thank you, {form.name.split(" ")[0] || "there"}. We've captured your{" "}
              {form.inquiryType.toLowerCase()} request. This is a frontend-only
              submission — once the support inbox is connected, we will respond
              to{" "}
              <span className="text-zinc-200">{form.email}</span> as soon as
              possible.
            </p>
            <button
              type="button"
              onClick={() => {
                setForm({
                  name: "",
                  email: "",
                  inquiryType: INQUIRY_TYPES[0],
                  subject: "",
                  message: "",
                });
                setErrors({});
                setSubmitted(false);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#272727] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a]"
            >
              Send another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="text-lg font-semibold text-white">Send us a message</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Fields marked * are required.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Full Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={inputClasses("name")}
                  placeholder="Your full name"
                />
                {errorText("name")}
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Email Address *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClasses("email")}
                  placeholder="you@example.com"
                />
                {errorText("email")}
              </div>

              <div>
                <label htmlFor="contact-type" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Inquiry Type *
                </label>
                <select
                  id="contact-type"
                  value={form.inquiryType}
                  onChange={(e) => setField("inquiryType", e.target.value)}
                  className={inputClasses("inquiryType")}
                >
                  {INQUIRY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Subject *
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  maxLength={150}
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={errors.subject ? "subject-error" : undefined}
                  className={inputClasses("subject")}
                  placeholder="What is this about?"
                />
                {errorText("subject")}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Message *
              </label>
              <textarea
                id="contact-message"
                rows={6}
                maxLength={5000}
                value={form.message}
                onChange={(e) => setField("message", e.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                className={`${inputClasses("message")} resize-y`}
                placeholder="Describe your issue or question in a few lines…"
              />
              <div className="mt-1 flex items-center justify-between">
                {errorText("message")}
                <span className="ml-auto text-xs tabular-nums text-zinc-600">
                  {form.message.length}/5000
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              <Send size={16} />
              Submit Request
            </button>
          </form>
        )}
      </div>
    </LegalPageLayout>
  );
}
import {
  UserCircle,
  Film,
  Wallet,
  AlertTriangle,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { SettingsPageShell, SettingsPageHeader } from "../components/common/SettingsShared";

const TOPICS = [
  {
    icon: UserCircle,
    title: "Account & Login",
    description:
      "Issues with signing in, password reset, account settings, or profile management.",
  },
  {
    icon: Film,
    title: "Video Issues",
    description:
      "Problems with uploading, playback, quality, thumbnails, or video not appearing.",
  },
  {
    icon: Wallet,
    title: "Payments & Rewards",
    description:
      "Questions about earnings, withdrawals, rewards program, or payment methods.",
  },
  {
    icon: AlertTriangle,
    title: "Report a Problem",
    description:
      "Report bugs, inappropriate content, copyright issues, or security concerns.",
  },
];

export default function SupportPage() {
  return (
    <SettingsPageShell>
      <SettingsPageHeader title="Customer Support" />

      <p className="mt-2 max-w-2xl text-sm text-zinc-500">
        We&apos;re here to help. Choose a topic below or reach out to our
        support team.
      </p>

      {/* Topics */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <div
              key={topic.title}
              className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700/60 sm:p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80">
                  <Icon size={18} className="text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-zinc-200 sm:text-base">
                  {topic.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-zinc-500">
                {topic.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Help */}
      <div className="mt-8 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5 sm:p-6">
        <h3 className="text-base font-medium text-zinc-200">Quick Help</h3>
        <div className="mt-4 divide-y divide-zinc-800/60">
          {[
            { label: "How do I reset my password?", href: "/faq" },
            { label: "How do I upload a video?", href: "/faq" },
            { label: "How do I withdraw my earnings?", href: "/faq" },
            { label: "How do I report inappropriate content?", href: "/faq" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center justify-between py-3 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <span>{item.label}</span>
              <ChevronRight size={14} className="shrink-0 text-zinc-600" />
            </a>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-8 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5 text-center sm:p-6">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80">
          <MessageCircle size={18} className="text-zinc-400" />
        </div>
        <h3 className="text-base font-medium text-zinc-200">Still need help?</h3>
        <p className="mt-1.5 text-sm text-zinc-500">
          Send us a message and our team will get back to you.
        </p>
        <a
          href="/feedback"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          <MessageCircle size={14} />
          Contact Support
        </a>
      </div>
    </SettingsPageShell>
  );
}

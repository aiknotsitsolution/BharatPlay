import { Link } from "react-router-dom";
import { ArrowRight, Code2, Users, ShieldCheck } from "lucide-react";
import usePageMeta from "../../../hooks/usePageMeta";
import { useTheme } from "../../../context/ThemeContext";
import SITE from "../../../config/site";

const DEV_SECTIONS = [
  {
    icon: Code2,
    title: "Platform Integration",
    body: "BharatPlay provides the official web platform and Android application. Developers can build experiences that integrate with the BharatPlay ecosystem for watching, uploading and managing video content.",
  },
  {
    icon: Users,
    title: "Community & Feedback",
    body: "We value input from the developer community. Share your feedback and suggestions so we can keep improving the platform experience and the tools available to builders.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible Development",
    body: "Developers are expected to follow our policies and respect user data and content rights when building integrations with BharatPlay.",
  },
];

export default function DevelopersPage() {
  usePageMeta(
    "Developers",
    "Information for developers building with and for the BharatPlay platform.",
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
          Developers
        </h1>
        <p className={`mt-4 text-base leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
          This page is a starting point for developers and partners interested
          in the BharatPlay platform. Learn about the official applications,
          integration guidelines and how to get in touch with our team.
        </p>
      </div>

      <section className="mt-12">
        <div className="grid gap-5 md:grid-cols-3">
          {DEV_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className={`rounded-2xl border p-6 ${isDark ? "border-zinc-800/70 bg-[#161616]" : "border-gray-200 bg-white"}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${isDark ? "bg-zinc-800/80 ring-zinc-700/60" : "bg-gray-100 ring-gray-200"}`}>
                  <Icon size={18} className="text-red-500" />
                </div>
                <h2 className={`mt-4 text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{section.title}</h2>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{section.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className={`mt-12 rounded-2xl border p-6 sm:p-8 ${isDark ? "border-zinc-800/70 bg-[#161616]" : "border-gray-200 bg-white"}`}>
        <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Official applications</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Code2 size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className={`font-medium ${isDark ? "text-zinc-200" : "text-gray-700"}`}>Web platform</p>
              <p className={isDark ? "text-zinc-500" : "text-gray-400"}>{SITE.websiteUrl || "BharatPlay web platform"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <code className={`rounded px-2 py-0.5 text-xs ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600"}`}>
              com.bharatplay.app
            </code>
          </div>
        </div>
        <div className="mt-6">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Contact Developer Team
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
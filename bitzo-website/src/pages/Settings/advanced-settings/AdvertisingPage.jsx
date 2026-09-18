import { Link } from "react-router-dom";
import { ArrowRight, Target, BarChart3, Rocket } from "lucide-react";
import usePageMeta from "../../../hooks/usePageMeta";
import { useTheme } from "../../../context/ThemeContext";

const AD_SECTIONS = [
  {
    icon: Target,
    title: "Reach the Right Audience",
    body: "BharatPlay lets you put your brand in front of viewers who are actively watching short and long-form videos, so your message lands where people are already engaged.",
  },
  {
    icon: BarChart3,
    title: "Measure Campaign Performance",
    body: "Track how your campaigns perform with clear reporting on views, engagement and audience response, helping you refine what works.",
  },
  {
    icon: Rocket,
    title: "Grow Your Brand",
    body: "Use the BharatPlay platform to build awareness, drive discovery and connect with a community of viewers and creators across web and Android.",
  },
];

export default function AdvertisingPage() {
  usePageMeta(
    "BharatPlay Advertising",
    "Learn how to advertise and grow your brand with the BharatPlay video platform.",
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
          BharatPlay Advertising
        </h1>
        <p className={`mt-4 text-base leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
          BharatPlay offers advertising and brand opportunities for businesses
          of all sizes. Reach an active video audience, measure performance and
          grow your brand across the BharatPlay ecosystem.
        </p>
      </div>

      <section className="mt-12">
        <div className="grid gap-5 md:grid-cols-3">
          {AD_SECTIONS.map((section) => {
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
        <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Start advertising</h2>
        <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
          To get started with advertising on BharatPlay, contact our team and we
          will help you build a campaign that matches your goals and budget.
        </p>
        <div className="mt-5">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Contact Advertising Team
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
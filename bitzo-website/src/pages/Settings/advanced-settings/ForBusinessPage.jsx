import { Link } from "react-router-dom";
import { ArrowRight, Megaphone, MonitorPlay, HeartHandshake } from "lucide-react";
import usePageMeta from "../../../hooks/usePageMeta";
import { useTheme } from "../../../context/ThemeContext";

const OFFER_SECTIONS = [
  {
    icon: Megaphone,
    title: "Advertising",
    body: "Reach viewers who are actively watching and creating on BharatPlay. Partner with us to run integrated campaigns that connect your brand with an engaged video audience.",
  },
  {
    icon: MonitorPlay,
    title: "Creator Partnerships",
    body: "Connect with creators on BharatPlay who fit your brand. From sponsored content to product integrations, our creator ecosystem offers many ways to collaborate.",
  },
  {
    icon: HeartHandshake,
    title: "Business Presence",
    body: "Establish an official presence for your business on BharatPlay, share updates through video and stay close to the community you serve.",
  },
];

export default function ForBusinessPage() {
  usePageMeta(
    "For Business",
    "Explore advertising and partnership opportunities for businesses on BharatPlay.",
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
          For Business
        </h1>
        <p className={`mt-4 text-base leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
          BharatPlay connects businesses with a growing community of viewers
          and creators. Whether you want to advertise, partner with creators or
          build an official presence, this page explains how your business can
          engage with the BharatPlay ecosystem.
        </p>
      </div>

      <section className="mt-12">
        <div className="grid gap-5 md:grid-cols-3">
          {OFFER_SECTIONS.map((section) => {
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
        <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Get in touch</h2>
        <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
          To discuss advertising, partnerships or any business inquiry, reach
          out through our contact page and we will route your request to the
          right team.
        </p>
        <div className="mt-5">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Contact Business Team
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
import { Link } from "react-router-dom";
import { ArrowRight, Globe, Smartphone, MonitorPlay, Upload, Award, ShieldCheck } from "lucide-react";
import usePageMeta from "../../../hooks/usePageMeta";
import { useTheme } from "../../../context/ThemeContext";
import SITE from "../../../config/site";

const PILLARS = [
  {
    icon: MonitorPlay,
    title: "Watch",
    body: "Explore short and long-form videos across a wide range of content, follow the channels you love and build your own watch history.",
  },
  {
    icon: Upload,
    title: "Create & Share",
    body: "Upload videos, manage a channel and reach your audience from both the web platform and the BharatPlay mobile application.",
  },
  {
    icon: Award,
    title: "Rewards & Engagement",
    body: "Participate in the BharatPlay rewards experience, track your activity and connect with the community through leaderboards.",
  },
];

export default function AboutPage() {
  usePageMeta(
    "About BharatPlay",
    "Learn about BharatPlay — the official video platform for watching, creating and sharing short and long videos across web and Android.",
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
          About BharatPlay
        </h1>
        <p className={`mt-4 text-base leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
          BharatPlay is a digital video platform built to be a home for
          creators and viewers. Through the official website and the BharatPlay
          Android application, we provide a connected experience for watching
          videos, uploading content and staying engaged with the community.
        </p>
      </div>

      {/* What we do */}
      <section className="mt-12">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <h2 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
              What BharatPlay is
            </h2>
            <div className={`mt-4 space-y-4 text-base leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
              <p>
                BharatPlay is a video-sharing platform where creators can upload
                short and long-form videos and viewers can watch, discover and
                engage with content. It is designed as an ecosystem: the same
                account and content experience is available on the web
                platform and in the official mobile application.
              </p>
              <p>
                The platform is intended for everyone — casual viewers looking
                for entertainment and creators who want a channel to publish
                videos, build an audience and participate in the BharatPlay
                rewards experience.
              </p>
              <p>
                Beyond playback, BharatPlay provides creator-focused features
                such as channel management, a creation studio, watch history,
                favourites, subscriptions and a copyright centre to help
                protect original work.
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border p-6 sm:p-8 ${isDark ? "border-zinc-800/70 bg-[#161616]" : "border-gray-200 bg-white"}`}>
            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Brand &amp; developer</h3>
            <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
              BharatPlay is the official brand used for the website, the mobile
              application and related digital products. If and when a legal
              entity name, office address and contact registration details are
              published, they will be shown here.
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Globe size={18} className="mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className={`font-medium ${isDark ? "text-zinc-200" : "text-gray-700"}`}>Website</p>
                  <p className={isDark ? "text-zinc-500" : "text-gray-400"}>{SITE.websiteUrl || "BharatPlay web platform"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone size={18} className="mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className={`font-medium ${isDark ? "text-zinc-200" : "text-gray-700"}`}>Android application</p>
                  <p className={isDark ? "text-zinc-500" : "text-gray-400"}>
                    Package name: <span className={isDark ? "text-zinc-300" : "text-gray-600"}>{SITE.androidPackageName}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mt-14">
        <h2 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          What we focus on
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className={`rounded-2xl border p-6 ${isDark ? "border-zinc-800/70 bg-[#161616]" : "border-gray-200 bg-white"}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${isDark ? "bg-zinc-800/80 ring-zinc-700/60" : "bg-gray-100 ring-gray-200"}`}>
                  <Icon size={18} className="text-red-500" />
                </div>
                <h3 className={`mt-4 text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{pillar.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Privacy note */}
      <section className={`mt-14 rounded-2xl border p-6 sm:p-8 ${isDark ? "border-zinc-800/70 bg-[#161616]" : "border-gray-200 bg-white"}`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${isDark ? "bg-zinc-800/80 ring-zinc-700/60" : "bg-gray-100 ring-gray-200"}`}>
            <ShieldCheck size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>How we approach your data</h2>
            <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
              We take privacy and transparency seriously. Our policies explain
              what information we collect, how it is used, and how you can
              request access or deletion. You can also contact us any time for
              account, privacy or support requests.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/privacy-policy"
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Privacy Policy
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/contact"
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Contact Us
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

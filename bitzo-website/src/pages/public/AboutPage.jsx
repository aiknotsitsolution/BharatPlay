import { Link } from "react-router-dom";
import { ArrowRight, Globe, Smartphone, MonitorPlay, Upload, Award, ShieldCheck } from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";
import SITE from "../../config/site";

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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          About BharatPlay
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
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
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              What BharatPlay is
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-zinc-400">
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

          <div className="rounded-2xl border border-zinc-800/70 bg-[#161616] p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-white">Brand &amp; developer</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              BharatPlay is the official brand used for the website, the mobile
              application and related digital products. If and when a legal
              entity name, office address and contact registration details are
              published, they will be shown here.
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Globe size={18} className="mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-zinc-200">Website</p>
                  <p className="text-zinc-500">{SITE.websiteUrl || "BharatPlay web platform"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone size={18} className="mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-zinc-200">Android application</p>
                  <p className="text-zinc-500">
                    Package name: <span className="text-zinc-300">{SITE.androidPackageName}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          What we focus on
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-zinc-800/70 bg-[#161616] p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 ring-1 ring-zinc-700/60">
                  <Icon size={18} className="text-red-500" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Privacy note */}
      <section className="mt-14 rounded-2xl border border-zinc-800/70 bg-[#161616] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 ring-1 ring-zinc-700/60">
            <ShieldCheck size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">How we approach your data</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              We take privacy and transparency seriously. Our policies explain
              what information we collect, how it is used, and how you can
              request access or deletion. You can also contact us any time for
              account, privacy or support requests.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/privacy-policy"
                className="inline-flex items-center gap-2 rounded-full bg-[#272727] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a]"
              >
                Privacy Policy
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#272727] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a]"
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
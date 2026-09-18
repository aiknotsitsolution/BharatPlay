import { Link } from "react-router-dom";
import {
  ArrowRight,
  Globe,
  Smartphone,
  PlayCircle,
  FileText,
  Scale,
  HeartHandshake,
  UserX,
  Box,
  Users,
  Video,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";
import SITE from "../../config/site";
import SiteLogo from "../../components/public/SiteLogo";

const TRUST_LINKS = [
  { label: "About Us", path: "/about", icon: Users },
  { label: "Privacy Policy", path: "/privacy-policy", icon: FileText },
  { label: "Terms & Conditions", path: "/terms", icon: Scale },
  { label: "Community Guidelines", path: "/community-guidelines", icon: Users },
  { label: "Content Policy", path: "/content-policy", icon: FileText },
  { label: "Copyright Policy", path: "/copyright-policy", icon: Scale },
  { label: "Help & Support", path: "/help-support", icon: HeartHandshake },
  { label: "Contact / Support", path: "/contact", icon: HeartHandshake },
  { label: "Account & Data Deletion", path: "/delete-account", icon: UserX },
  { label: "Apps", path: "/apps", icon: Box },
];

const HIGHLIGHTS = [
  {
    icon: Video,
    title: "Watch premium video content",
    description:
      "Enjoy short-form entertainment, long-form discovery, creator uploads, and trending content across web and mobile.",
  },
  {
    icon: Sparkles,
    title: "Create, grow, and engage",
    description:
      "Build your channel, publish videos, and connect with audiences using community-driven discovery and creator tools.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted, safe, and transparent",
    description:
      "BharatPlay supports creator protections, user safety policies, and easy access to support, privacy, and compliance information.",
  },
];

function ProductCard({ icon, title, subtitle, availability, children, cta }) {
  const Icon = icon;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800/70 bg-[#161616] p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 ring-1 ring-zinc-700/60">
          <Icon size={22} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">{children}</p>
      <div className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {availability}
      </div>
      <div className="mt-auto pt-5">{cta}</div>
    </div>
  );
}

export default function HomePage() {
  usePageMeta(
    "BharatPlay | Watch, Create & Discover Videos",
    "BharatPlay is a video platform for streaming, discovering, uploading and sharing content across web and Android. Explore trending videos, creator channels and official BharatPlay apps.",
  );

  const playUrl = SITE.googlePlayUrl;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BharatPlay",
    url: "https://bharatplay.com/",
    description:
      "BharatPlay is a modern video platform for watching, creating, discovering, and sharing content across web and Android.",
    publisher: {
      "@type": "Organization",
      name: "BharatPlay",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://bharatplay.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="relative overflow-hidden border-b border-zinc-800/60 bg-[#0b0b0b]">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 15% 10%, rgba(239,68,68,0.24) 0%, rgba(0,0,0,0) 52%), radial-gradient(50% 50% at 90% 0%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 50%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 lg:pt-10">
          <div className="mb-6 flex justify-center">
            <SiteLogo to="/" />
          </div>

          <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[#121212] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="grid items-center gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300">
                  <BadgeCheck size={14} />
                  Official BharatPlay platform
                </span>

                <h1 className="mt-5 max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Watch, create and discover content that feels built for India.
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                  BharatPlay brings together trending short videos, long-form
                  entertainment, creator channels, and community engagement in
                  one modern digital experience for web and Android users.
                </p>

                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row">
                  <Link
                    to={SITE.appPath}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 sm:w-auto"
                  >
                    <PlayCircle size={18} />
                    Launch Web App
                  </Link>
                  <Link
                    to="/apps"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#272727] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 sm:w-auto"
                  >
                    Explore Apps
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {playUrl && (
                  <p className="mt-5 text-sm text-zinc-400">
                    Also available on Android —{" "}
                    <a
                      href={playUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-red-400 transition-colors hover:text-red-300"
                    >
                      Get BharatPlay on Google Play
                    </a>
                  </p>
                )}
              </div>

              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-[32px] bg-red-500/10 blur-3xl"
                  aria-hidden="true"
                />
                <img
                  src="/BharatPlayBanner.png"
                  alt="BharatPlay app preview banner showing video platform experience"
                  className="relative z-10 w-full rounded-[24px] border border-zinc-800 object-cover shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
            Why BharatPlay
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            A modern video platform built for creators, viewers, and
            communities.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-800 bg-[#161616] p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700/60">
                <Icon size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Products preview */}
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Official BharatPlay products
          </h2>
          <p className="mt-2 text-base text-zinc-400">
            One platform, everything connected. Choose the experience that works
            best for you.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ProductCard
            icon={Globe}
            title="BharatPlay Website"
            subtitle="Web platform"
            availability="Web Browser"
            cta={
              <Link
                to={SITE.appPath}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
              >
                Visit Website
                <ArrowRight size={15} />
              </Link>
            }
          >
            The full BharatPlay experience in your browser. Watch trending
            videos, upload your own content, follow channels and keep track of
            your watch history and favourites.
          </ProductCard>

          <ProductCard
            icon={Smartphone}
            title="BharatPlay Mobile App"
            subtitle="Native Android application"
            availability="Google Play Store"
            cta={
              playUrl ? (
                <a
                  href={playUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                >
                  Get it on Google Play
                  <ArrowRight size={15} />
                </a>
              ) : (
                <Link
                  to="/apps"
                  className="inline-flex items-center gap-2 rounded-full bg-[#272727] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
                >
                  View App Details
                  <ArrowRight size={15} />
                </Link>
              )
            }
          >
            Take BharatPlay wherever you go. The official Android app delivers
            videos, creator tools and the rewards experience on your mobile
            device. Package name:{" "}
            <span className="text-zinc-300">{SITE.androidPackageName}</span>.
          </ProductCard>
        </div>
      </section>

      {/* Trust links */}
      <section className="border-t border-zinc-800/60 bg-[#111111]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Support &amp; trust
            </h2>
            <p className="mt-2 text-base text-zinc-400">
              Transparent policies and easy-to-reach support for every
              BharatPlay user.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-800/70 bg-[#161616] p-5 transition-colors hover:border-zinc-700 hover:bg-[#1c1c1c]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 ring-1 ring-zinc-700/60">
                    <Icon size={18} className="text-zinc-300" />
                  </div>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white">
                    {item.label}
                  </span>
                  <ArrowRight
                    size={15}
                    className="ml-auto text-zinc-600 transition-colors group-hover:text-red-400"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

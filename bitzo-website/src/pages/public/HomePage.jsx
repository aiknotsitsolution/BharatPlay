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
} from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";
import SITE from "../../config/site";
import SiteLogo from "../../components/public/SiteLogo";

const TRUST_LINKS = [
  { label: "About Us", path: "/about", icon: Users },
  { label: "Privacy Policy", path: "/privacy-policy", icon: FileText },
  { label: "Terms & Conditions", path: "/terms", icon: Scale },
  { label: "Contact / Support", path: "/contact", icon: HeartHandshake },
  { label: "Account & Data Deletion", path: "/delete-account", icon: UserX },
  { label: "Apps", path: "/apps", icon: Box },
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
    "BharatPlay",
    "Discover the official BharatPlay digital experience across web and mobile — watch, discover and upload videos on the BharatPlay platform.",
  );

  const playUrl = SITE.googlePlayUrl;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800/60">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 0%, rgba(220,38,38,0.18) 0%, rgba(0,0,0,0) 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex w-fit flex-col items-center">
              <SiteLogo to="/" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Discover the official BharatPlay digital experience.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
              BharatPlay is a video platform built for watching, discovering and
              uploading short and long videos — across the web and on
              Android. Stream your favourite content, follow channels and
              engage with a growing creator community.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to={SITE.appPath}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 sm:w-auto"
              >
                <PlayCircle size={18} />
                Launch the Web App
              </Link>
              <Link
                to="/apps"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#272727] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 sm:w-auto"
              >
                Explore our Apps
                <ArrowRight size={16} />
              </Link>
            </div>
            {playUrl && (
              <p className="mt-6 text-sm text-zinc-500">
                Also available on the go —{" "}
                <a
                  href={playUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-red-400 transition-colors hover:text-red-300"
                >
                  Get BharatPlay on Google Play
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Products preview */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Official BharatPlay products
          </h2>
          <p className="mt-2 text-base text-zinc-400">
            One platform, everything connected. Choose the experience that
            works best for you.
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
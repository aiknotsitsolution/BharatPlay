import { Link } from "react-router-dom";
import { Globe, Smartphone, ArrowRight, FileText, HeartHandshake, UserX, CheckCircle2 } from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";
import SITE from "../../config/site";

function AppLink({ to, href, label, icon }) {
  const Icon = icon;
  const classes =
    "inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:rounded";
  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className={classes}>
        <Icon size={15} />
        {label}
      </a>
    );
  }
  return (
    <Link to={to} className={classes}>
      <Icon size={15} />
      {label}
    </Link>
  );
}

export default function AppsPage() {
  usePageMeta(
    "BharatPlay Apps & Products",
    "Explore BharatPlay products — the BharatPlay website and the official BharatPlay Android app available on Google Play.",
  );

  const playUrl = SITE.googlePlayUrl;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Apps &amp; Products
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          BharatPlay provides its digital experience through the official
          website and a native Android mobile application. Everything is part
          of the same connected platform — your account and content follow
          you across web and mobile.
        </p>
      </div>

      {/* Website product */}
      <section className="mt-12 rounded-2xl border border-zinc-800/70 bg-[#161616] p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800/80 ring-1 ring-zinc-700/60">
              <Globe size={22} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">BharatPlay Website</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Web platform · Web Browser</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1 text-xs font-medium text-zinc-300">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Available now
            </span>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-400">
          The BharatPlay web platform runs in any modern web browser. Watch
          trending videos, browse short and long-form content, upload your own
          videos, follow channels, manage your watch history and favourites,
          and access creator and rewards features — all without installing
          anything.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <AppLink to="/privacy-policy" label="Privacy Policy" icon={FileText} />
            <AppLink to="/contact" label="Support" icon={HeartHandshake} />
            <AppLink to="/delete-account" label="Delete Account" icon={UserX} />
          </div>
          <Link
            to={SITE.appPath}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          >
            Visit Website
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Mobile app product */}
      <section className="mt-6 rounded-2xl border border-zinc-800/70 bg-[#161616] p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-zinc-700/60">
              <img
                src="/Bharatplay-Cb3qGLyP-Cb3qGLyP-DSDLqCtA.png"
                alt="BharatPlay Android app icon"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">BharatPlay Mobile App</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Android · Google Play Store</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1 text-xs font-medium text-zinc-300">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Published on Google Play
            </span>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-400">
          The official BharatPlay application for Android brings the full
          platform to your pocket. Watch and upload videos, follow channels,
          take part in the rewards experience and keep your account in sync
          with the web platform. Download it from the Google Play Store using
          the button below.
        </p>

        {/* Technical info */}
        <div className="mt-6 grid gap-4 rounded-xl border border-zinc-800/70 bg-[#121212] p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Platform</p>
            <p className="mt-1 text-sm text-zinc-200">Android</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Availability</p>
            <p className="mt-1 text-sm text-zinc-200">Google Play Store</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Package Name</p>
            <p className="mt-1 text-sm text-zinc-200 tabular-nums">{SITE.androidPackageName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Developer</p>
            <p className="mt-1 text-sm text-zinc-200">{SITE.brandName}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <AppLink to="/privacy-policy" label="Privacy Policy" icon={FileText} />
            <AppLink to="/contact" label="Support" icon={HeartHandshake} />
            <AppLink to="/delete-account" label="Delete Account" icon={UserX} />
            {playUrl ? (
              <AppLink href={playUrl} label="Google Play" icon={Smartphone} />
            ) : null}
          </div>

          {playUrl ? (
            <a
              href={playUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#00a24e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#018f46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <Smartphone size={16} />
              Get it on Google Play
            </a>
          ) : (
            <span
              className="inline-flex cursor-default items-center gap-2 rounded-full bg-[#00a24e] px-5 py-2.5 text-sm font-semibold text-white"
              title="The Google Play listing URL has not been configured yet."
            >
              <Smartphone size={16} />
              Get it on Google Play
            </span>
          )}
        </div>

        <p className="mt-4 text-xs text-zinc-600">
          English (India) only. iOS availability is not offered at this time.
        </p>
      </section>

      {/* Redirect helper */}
      <section className="mt-10 rounded-2xl border border-zinc-800/70 bg-[#161616] p-6 text-center sm:text-left">
        <h2 className="text-lg font-semibold text-white">Already use BharatPlay?</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Sign in to continue watching, uploading and managing your content on
          the web platform.
        </p>
        <Link
          to={SITE.appPath}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#272727] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3a3a3a]"
        >
          Open BharatPlay
          <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  );
}
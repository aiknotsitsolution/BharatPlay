import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Globe,
  Smartphone,
  PlayCircle,
  Film,
  Crown,
  Clapperboard,
  Users,
  FileText,
  Scale,
  HeartHandshake,
  UserX,
  Box,
  Shield,
  Headphones,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import usePageMeta from "../../../hooks/usePageMeta";
import { useTheme } from "../../../context/ThemeContext";
import SITE from "../../../config/site";

const PRODUCTS = [
  {
    icon: Globe,
    category: "WEB PLATFORM",
    title: "BharatPlay Website",
    description:
      "The full BharatPlay experience in your browser. Watch trending videos, upload your own content and follow channels.",
    ctaLabel: "Visit Website",
    ctaTo: SITE.appPath,
    featured: true,
  },
  {
    icon: Smartphone,
    category: "ANDROID APP",
    title: "BharatPlay Mobile App",
    description:
      "Take BharatPlay wherever you go. Videos, creator tools and rewards on your mobile device.",
    ctaLabel: "View App Details",
    ctaTo: "/apps",
  },
  {
    icon: Film,
    category: "SHORT-FORM VIDEO",
    title: "BharatPlay Shorts",
    description:
      "Discover and create engaging short-form content across the platform.",
    ctaLabel: "Explore Shorts",
    ctaTo: "/",
  },
  {
    icon: Crown,
    category: "PREMIUM ENTERTAINMENT",
    title: "BharatPlay Premium",
    description:
      "An elevated experience with early access and enhanced features.",
    ctaLabel: "Learn More",
    ctaTo: "/about",
  },
  {
    icon: Clapperboard,
    category: "CREATOR PLATFORM",
    title: "BharatPlay Studio",
    description:
      "Upload, manage and grow your channel with powerful creator tools.",
    ctaLabel: "Open Studio",
    ctaTo: "/studio",
  },
];

const SUPPORT_TILES = [
  {
    icon: Users,
    title: "About Us",
    description: "Learn about BharatPlay and what we stand for.",
    path: "/about",
  },
  {
    icon: FileText,
    title: "Privacy Policy",
    description: "Understand how your information is handled.",
    path: "/privacy-policy",
  },
  {
    icon: Scale,
    title: "Terms & Conditions",
    description: "Review the terms governing platform use.",
    path: "/terms",
  },
  {
    icon: HeartHandshake,
    title: "Contact / Support",
    description: "Reach out for help or general inquiries.",
    path: "/contact",
  },
  {
    icon: UserX,
    title: "Account & Data Deletion",
    description: "Manage your account and deletion requests.",
    path: "/delete-account",
  },
  {
    icon: Box,
    title: "Apps",
    description: "Explore all BharatPlay platform applications.",
    path: "/apps",
  },
];

const TRUST_BLOCKS = [
  {
    icon: Shield,
    title: "Privacy",
    description:
      "Clear information about data collection, usage and your rights as a user.",
  },
  {
    icon: Lock,
    title: "Security",
    description:
      "Designed with responsible access controls and protection measures in mind.",
  },
  {
    icon: Headphones,
    title: "Support",
    description:
      "Help is available when you need it through multiple support channels.",
  },
];

const ECOSYSTEM_NODES = [
  { label: "BharatPlay Web", color: "from-red-600/40 to-red-500/10" },
  { label: "BharatPlay Android", color: "from-emerald-600/30 to-emerald-500/10" },
  { label: "Shorts", color: "from-amber-600/30 to-amber-500/10" },
  { label: "Premium", color: "from-violet-600/30 to-violet-500/10" },
  { label: "Studio", color: "from-blue-600/30 to-blue-500/10" },
];

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

function SectionReveal({ children, className = "", delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── HERO ─────────────────────────────────────────────────── */

function HeroSection({ playUrl, isDark }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallaxOffset = Math.min(scrollY * 0.15, 60);

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* Background image with parallax */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <img
          src="/BannerImage.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-99"
        />
      </div>

      {/* Gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0.7) 50%, rgba(15,15,15,0.85) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.85) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(220,38,38,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[85vh] max-w-7xl items-center px-5 sm:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[1fr_420px] lg:items-center">
          {/* Left text */}
          <div>
            <span className={`inline-block rounded-full border px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
              isDark
                ? "border-zinc-700/60 bg-zinc-800/50 text-zinc-400"
                : "border-gray-300 bg-gray-100 text-gray-500"
            }`}>
              BharatPlay Ecosystem
            </span>

            <h1 className={`mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem] ${
              isDark ? "text-white" : "text-gray-900"
            }`}>
              Everything BharatPlay.
              <br />
              <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                One connected experience.
              </span>
            </h1>

            <p className={`mt-5 max-w-lg text-base leading-relaxed sm:text-lg ${
              isDark ? "text-zinc-400" : "text-gray-500"
            }`}>
              Watch, discover, create and connect across the BharatPlay
              ecosystem — all in one platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={SITE.appPath}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
              >
                <PlayCircle size={17} />
                Launch Web App
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/apps"
                className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 ${
                  isDark
                    ? "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                Explore Apps
                <ArrowRight size={15} />
              </Link>
            </div>

            {playUrl && (
              <p className={`mt-6 text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                Also on Google Play —{" "}
                <a
                  href={playUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`font-medium underline underline-offset-2 transition-colors ${
                    isDark
                      ? "text-zinc-400 decoration-zinc-700 hover:text-white"
                      : "text-gray-600 decoration-gray-300 hover:text-gray-900"
                  }`}
                >
                  Get BharatPlay
                </a>
              </p>
            )}
          </div>

          {/* Right ecosystem visual */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connection lines (decorative) */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <line
                  x1="50%" y1="40" x2="25%" y2="140"
                  stroke="rgba(220,38,38,0.15)" strokeWidth="1"
                />
                <line
                  x1="50%" y1="40" x2="75%" y2="140"
                  stroke="rgba(220,38,38,0.15)" strokeWidth="1"
                />
                <line
                  x1="25%" y1="140" x2="15%" y2="250"
                  stroke="rgba(220,38,38,0.1)" strokeWidth="1"
                />
                <line
                  x1="75%" y1="140" x2="85%" y2="250"
                  stroke="rgba(220,38,38,0.1)" strokeWidth="1"
                />
                <line
                  x1="25%" y1="140" x2="75%" y2="140"
                  stroke="rgba(220,38,38,0.08)" strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </svg>

              <div className="relative space-y-4">
                {/* Top node */}
                <div className="mx-auto w-fit">
                  <div className={`rounded-xl border px-5 py-3 backdrop-blur-sm ${
                    isDark
                      ? "border-red-500/20 bg-gradient-to-br from-red-600/20 to-red-500/5"
                      : "border-red-200 bg-gradient-to-br from-red-50 to-white"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Globe size={18} className="text-red-400" />
                      <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        BharatPlay Web
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle row */}
                <div className="flex justify-center gap-4">
                  {ECOSYSTEM_NODES.slice(1, 3).map((node) => (
                    <div
                      key={node.label}
                      className={`rounded-xl border px-4 py-3 backdrop-blur-sm transition-all ${
                        isDark
                          ? "border-zinc-700/50 bg-gradient-to-br from-zinc-800/80 to-zinc-900/50 hover:border-zinc-600/60"
                          : "border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${node.color}`} />
                        <span className={`text-xs font-medium ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                          {node.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="flex justify-center gap-4">
                  {ECOSYSTEM_NODES.slice(3).map((node) => (
                    <div
                      key={node.label}
                      className={`rounded-xl border px-4 py-3 backdrop-blur-sm transition-all ${
                        isDark
                          ? "border-zinc-700/50 bg-gradient-to-br from-zinc-800/80 to-zinc-900/50 hover:border-zinc-600/60"
                          : "border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${node.color}`} />
                        <span className={`text-xs font-medium ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                          {node.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Glow */}
                <div
                  className="pointer-events-none absolute -left-20 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(220,38,38,0.3), transparent)",
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        style={{
          background: isDark
            ? "linear-gradient(to top, #0f0f0f 0%, transparent 100%)"
            : "linear-gradient(to top, #f5f5f5 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
    </section>
  );
}

/* ─── PRODUCT ECOSYSTEM ────────────────────────────────────── */

function ProductsSection({ playUrl, isDark }) {
  const [ref] = useInView();

  return (
    <section ref={ref} className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-400">
            Product Ecosystem
          </p>
          <h2 className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
            Explore the BharatPlay ecosystem
          </h2>
          <p className={`mt-3 max-w-xl text-base ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
            Choose the experience that fits the way you watch, create and
            connect.
          </p>
        </SectionReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product, i) => {
            const Icon = product.icon;
            return (
              <SectionReveal
                key={product.title}
                delay={i * 0.07}
                className={
                  product.featured ? "sm:col-span-2 lg:col-span-1" : ""
                }
              >
                <div
                  className={`group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
                    product.featured
                      ? isDark
                        ? "border-red-500/20 bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(220,38,38,0.08)]"
                        : "border-red-200 bg-gradient-to-br from-white to-red-50/30 hover:border-red-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.08)]"
                      : isDark
                        ? "border-zinc-800/70 bg-[#161616] hover:border-zinc-700/80 hover:bg-[#1a1a1a]"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Top accent line */}
                  {product.featured && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                  )}

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${
                          product.featured
                            ? "bg-red-600/15 ring-red-500/30"
                            : isDark
                              ? "bg-zinc-800/80 ring-zinc-700/60"
                              : "bg-gray-100 ring-gray-200"
                        }`}
                      >
                        <Icon
                          size={20}
                          className={
                            product.featured
                              ? "text-red-400"
                              : isDark
                                ? "text-zinc-400"
                                : "text-gray-500"
                          }
                        />
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                          isDark ? "text-zinc-500" : "text-gray-400"
                        }`}>
                          {product.category}
                        </span>
                        <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {product.title}
                        </h3>
                      </div>
                    </div>

                    <p className={`mb-5 flex-1 text-sm leading-relaxed ${
                      isDark ? "text-zinc-400" : "text-gray-500"
                    }`}>
                      {product.description}
                    </p>

                    {product.ctaTo && (
                      <Link
                        to={
                          product.ctaLabel === "Visit Website"
                            ? playUrl || product.ctaTo
                            : product.ctaTo
                        }
                        target={
                          product.ctaLabel === "Visit Website" && playUrl
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          product.ctaLabel === "Visit Website" && playUrl
                            ? "noreferrer"
                            : undefined
                        }
                        className={`inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors group-hover:text-red-400 ${
                          isDark ? "text-zinc-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {product.ctaLabel}
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                    )}
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── SUPPORT HUB ──────────────────────────────────────────── */

function SupportSection({ isDark }) {
  return (
    <section className={`relative border-y px-5 py-20 sm:px-8 ${
      isDark ? "border-zinc-800/60 bg-[#111111]" : "border-gray-200 bg-gray-50"
    }`}>
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-400">
            Support Center
          </p>
          <h2 className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
            BharatPlay Support Center
          </h2>
          <p className={`mt-3 max-w-xl text-base ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
            Everything you need to understand, manage and get help with your
            BharatPlay experience.
          </p>
        </SectionReveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORT_TILES.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <SectionReveal key={tile.path} delay={i * 0.05}>
                <Link
                  to={tile.path}
                  className={`group flex items-start gap-4 rounded-xl border p-5 transition-all duration-200 ${
                    isDark
                      ? "border-zinc-800/60 bg-[#161616] hover:border-zinc-700/80 hover:bg-[#1a1a1a]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors group-hover:bg-red-600/15 group-hover:ring-red-500/30 ${
                    isDark
                      ? "bg-zinc-800/80 ring-zinc-700/60"
                      : "bg-gray-100 ring-gray-200"
                  }`}>
                    <Icon
                      size={17}
                      className={`transition-colors group-hover:text-red-400 ${isDark ? "text-zinc-400" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold transition-colors group-hover:text-red-400 ${
                      isDark ? "text-zinc-200 group-hover:text-white" : "text-gray-800 group-hover:text-red-600"
                    }`}>
                      {tile.title}
                    </h3>
                    <p className={`mt-1 text-[13px] leading-relaxed ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                      {tile.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`mt-1 shrink-0 transition-colors group-hover:text-red-400 ${isDark ? "text-zinc-700" : "text-gray-300"}`}
                  />
                </Link>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST & POLICY ───────────────────────────────────────── */

function TrustSection({ isDark }) {
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <SectionReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-400">
              Trust &amp; Transparency
            </p>
            <h2 className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
              Built around transparency.
            </h2>
            <p className={`mt-4 max-w-md text-base leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
              We believe trust is earned through clarity. Here&apos;s how we
              approach the foundations of a responsible platform.
            </p>

            {/* Abstract shield visual */}
            <div className="relative mt-8 hidden lg:block">
              <div className="absolute -left-4 -top-4 h-28 w-28 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, rgba(220,38,38,0.4), transparent)" }} aria-hidden="true" />
              <div className={`inline-flex items-center gap-3 rounded-xl border px-5 py-4 ${
                isDark
                  ? "border-zinc-800/60 bg-[#161616]"
                  : "border-gray-200 bg-white"
              }`}>
                <Shield size={24} className="text-red-400/70" />
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                    Responsible Platform
                  </p>
                  <p className={`text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    Designed with user trust as a core principle
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>

          <div className="space-y-4">
            {TRUST_BLOCKS.map((block, i) => {
              const Icon = block.icon;
              return (
                <SectionReveal key={block.title} delay={i * 0.1}>
                  <div className={`group rounded-xl border p-5 transition-all duration-200 ${
                    isDark
                      ? "border-zinc-800/60 bg-[#161616] hover:border-zinc-700/80 hover:bg-[#1a1a1a]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors group-hover:bg-red-600/15 group-hover:ring-red-500/30 ${
                        isDark
                          ? "bg-zinc-800/80 ring-zinc-700/60"
                          : "bg-gray-100 ring-gray-200"
                      }`}>
                        <Icon
                          size={18}
                          className={`transition-colors group-hover:text-red-400 ${isDark ? "text-zinc-400" : "text-gray-500"}`}
                        />
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold transition-colors group-hover:text-red-400 ${
                          isDark ? "text-zinc-200 group-hover:text-white" : "text-gray-800 group-hover:text-red-600"
                        }`}>
                          {block.title}
                        </h3>
                        <p className={`mt-1.5 text-sm leading-relaxed ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                          {block.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ────────────────────────────────────────────── */

function CTASection({ isDark }) {
  return (
    <section className={`relative overflow-hidden border-y px-5 py-20 sm:px-8 ${
      isDark ? "border-zinc-800/60" : "border-gray-200"
    }`}>
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(220,38,38,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Play watermark */}
      <div
        className="pointer-events-none absolute right-[10%] top-1/2 -translate-y-1/2 opacity-[0.03]"
        aria-hidden="true"
      >
        <PlayCircle size={300} strokeWidth={1} />
      </div>

      <div className="relative mx-auto max-w-7xl text-center">
        <SectionReveal>
          <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
            Your BharatPlay experience starts here.
          </h2>
          <p className={`mx-auto mt-4 max-w-md text-base ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
            Choose your platform and start exploring.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={SITE.appPath}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-7 py-3 text-sm font-medium text-white transition-all hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              <PlayCircle size={17} />
              Launch Web App
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/apps"
              className={`inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 ${
                isDark
                  ? "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900"
              }`}
            >
              Explore Apps
              <ArrowRight size={15} />
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────────── */

export default function HomePage() {
  usePageMeta(
    "BharatPlay",
    "Discover the official BharatPlay digital experience across web and mobile — watch, discover and upload videos on the BharatPlay platform.",
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const playUrl = SITE.googlePlayUrl;

  return (
    <>
      <HeroSection playUrl={playUrl} isDark={isDark} />
      <ProductsSection playUrl={playUrl} isDark={isDark} />
      <SupportSection isDark={isDark} />
      <TrustSection isDark={isDark} />
      <CTASection isDark={isDark} />
    </>
  );
}

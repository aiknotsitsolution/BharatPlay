import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  BadgeCheck,
  ChevronDown,
  CirclePlay,
  Clapperboard,
  Compass,
  Eye,
  Globe,
  Handshake,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  PhoneCall,
  Play,
  Radar,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Target,
  Tv,
  Users,
  Zap,
} from "lucide-react";
import usePageMeta from "../../../hooks/usePageMeta";
import { useTheme } from "../../../context/ThemeContext";
import SITE from "../../../config/site";

/* ─── Reveal on scroll (same pattern as the public Home page) ─── */

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

/* ─── Shared building blocks ─── */

function Eyebrow({ isDark, children }) {
  return (
    <span
      className={`inline-block rounded-full border px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
        isDark
          ? "border-zinc-700/60 bg-zinc-800/50 text-zinc-400"
          : "border-gray-300 bg-gray-100 text-gray-500"
      }`}
    >
      {children}
    </span>
  );
}

function SectionHeading({
  isDark,
  eyebrow,
  title,
  description,
  center = false,
}) {
  return (
    <SectionReveal
      className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}
    >
      <Eyebrow isDark={isDark}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base leading-relaxed ${
            isDark ? "text-zinc-400" : "text-gray-500"
          }`}
        >
          {description}
        </p>
      ) : null}
    </SectionReveal>
  );
}

function PrimaryLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${className}`}
    >
      {children}
      <ArrowRight
        size={16}
        className="transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function SecondaryLink({ to, children, isDark, className = "" }) {
  const classes = `group inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
    to.startsWith("#")
      ? "border-zinc-300 text-gray-700 hover:border-red-400 hover:text-red-600"
      : isDark
        ? "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
        : "border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-600"
  } ${className}`;

  if (to.startsWith("#")) {
    return (
      <a href={to} className={classes}>
        {children}
        <ArrowUpRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    );
  }

  return (
    <Link to={to} className={classes}>
      {children}
      <ArrowUpRight
        size={16}
        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </Link>
  );
}

/* ─── Data ─── */

const VALUE_PROPS = [
  {
    icon: Radar,
    title: "Contextual Reach",
    body: "Place your brand alongside relevant entertainment experiences people are already choosing to watch.",
  },
  {
    icon: Clapperboard,
    title: "Video-First Experiences",
    body: "Build campaigns around engaging video environments built for content discovery.",
  },
  {
    icon: Handshake,
    title: "Creator-Led Discovery",
    body: "Connect campaigns with authentic creator and content experiences.",
  },
  {
    icon: SlidersHorizontal,
    title: "Flexible Campaigns",
    body: "Design campaigns around your business objective and the audience you want to reach.",
  },
];

const JOURNEY = [
  {
    icon: Eye,
    title: "Discover",
    body: "Your brand appears in relevant entertainment environments.",
  },
  {
    icon: MousePointerClick,
    title: "Engage",
    body: "Audiences interact with video and content experiences.",
  },
  {
    icon: Compass,
    title: "Explore",
    body: "Users discover more about your product or campaign.",
  },
  {
    icon: Target,
    title: "Act",
    body: "Drive visits, enquiries or other meaningful actions.",
  },
];

const FORMATS = [
  {
    icon: Clapperboard,
    title: "Video Ads",
    body: "Reach viewers with engaging video placements built around the BharatPlay playback experience.",
    tag: "Flagship",
    size: "large",
    image: "/advertising/format-video.jpg",
    imageAlt:
      "Video production set with a cinema camera",
    accent: "from-red-600/40 via-red-500/10 to-transparent",
  },
  {
    icon: Tv,
    title: "In-Stream",
    body: "Introduce your brand within video viewing experiences.",
    tag: "Opportunity",
    size: "medium",
    image: "/advertising/format-instream.jpg",
    imageAlt: "Cinema theatre seats facing a screen",
    accent: "from-red-500/25 to-transparent",
  },
  {
    icon: LayoutGrid,
    title: "Feed / Discovery",
    body: "Meet audiences while they explore content across the platform.",
    tag: "Opportunity",
    size: "medium",
    image: "/advertising/format-feed.jpg",
    imageAlt: "Laptop screen showing a content dashboard",
    accent: "from-amber-500/25 to-transparent",
  },
  {
    icon: Zap,
    title: "Short-Form",
    body: "Create quick, high-impact experiences for short-form viewers.",
    tag: "Opportunity",
    size: "small",
    image: "/advertising/format-shortform.jpg",
    imageAlt: "A smartphone held in hand",
    accent: "from-red-500/20 to-transparent",
  },
  {
    icon: Sparkles,
    title: "Sponsored Content",
    body: "Build branded experiences around relevant content.",
    tag: "Opportunity",
    size: "small",
    image: "/advertising/format-sponsored.jpg",
    imageAlt: "Vintage film video camera",
    accent: "from-amber-500/20 to-transparent",
  },
  {
    icon: Handshake,
    title: "Creator Partnerships",
    body: "Work with creators to bring campaigns closer to their communities.",
    tag: "Opportunity",
    size: "small",
    image: "/advertising/format-creator.jpg",
    imageAlt: "A creative team collaborating together",
    accent: "from-red-500/20 to-transparent",
  },
];

const OBJECTIVES = [
  {
    icon: Eye,
    title: "Brand Awareness",
    body: "Introduce your brand to new audiences.",
  },
  {
    icon: Compass,
    title: "Product Discovery",
    body: "Help audiences discover what you offer.",
  },
  {
    icon: MessageSquare,
    title: "Engagement",
    body: "Create meaningful interactions around your campaign.",
  },
  {
    icon: MousePointerClick,
    title: "Traffic",
    body: "Guide interested audiences toward your destination.",
  },
  {
    icon: PhoneCall,
    title: "Leads / Enquiries",
    body: "Turn attention into business conversations.",
  },
];

const ECOSYSTEM_NODES = [
  {
    icon: Tv,
    label: "Watch",
    desc: "Full-length video viewing environments.",
  },
  {
    icon: Search,
    label: "Discover",
    desc: "Explore content across the platform.",
  },
  {
    icon: Zap,
    label: "Shorts",
    desc: "Fast, vertical short-form experiences.",
  },
  {
    icon: Users,
    label: "Creators",
    desc: "Communities built around creators.",
  },
  {
    icon: Smartphone,
    label: "Mobile",
    desc: "The BharatPlay Android experience.",
  },
  {
    icon: Globe,
    label: "Web",
    desc: "The BharatPlay web experience.",
  },
];

const WORKFLOW_STEPS = [
  {
    title: "Tell us your objective",
    body: "Share what you are building and what success looks like for your brand.",
  },
  {
    title: "Choose your audience and format",
    body: "Work with the BharatPlay team to shape the right format and audience approach.",
  },
  {
    title: "Launch your campaign",
    body: "Go live with a campaign built around the BharatPlay entertainment experience.",
  },
  {
    title: "Measure and optimize",
    body: "Review results with your team and refine future campaigns.",
  },
];

const SHOWCASE = [
  {
    label: "YOUR BRAND",
    kind: "Mobile video placement",
    aspect: "aspect-[9/16]",
    image: "/advertising/showcase-mobile.jpg",
    imageAlt: "Smartphone in hand showing a video",
  },
  {
    label: "CAMPAIGN",
    kind: "Short-form content",
    aspect: "aspect-[9/16]",
    image: "/advertising/showcase-short.jpg",
    imageAlt: "Portrait video content on a phone",
  },
  {
    label: "NEW PRODUCT",
    kind: "Feed placement",
    aspect: "aspect-video",
    image: "/advertising/showcase-feed.jpg",
    imageAlt: "Content feed layout on a laptop",
  },
  {
    label: "SUMMER COLLECTION",
    kind: "Branded content",
    aspect: "aspect-video",
    image: "/advertising/showcase-branded.jpg",
    imageAlt: "Creative team producing branded content",
  },
];

const WHY_STATEMENTS = [
  {
    title: "Entertainment-first",
    body: "Connect with audiences in environments designed for content discovery.",
  },
  {
    title: "Content-driven",
    body: "Build creative experiences that feel native to the viewing journey.",
  },
  {
    title: "Flexible",
    body: "Shape campaigns around your brand objectives and audience.",
  },
];

const FAQS = [
  {
    q: "Who can advertise on BharatPlay?",
    a: "BharatPlay advertising is open to brands, businesses and organizations of all sizes. Contact our advertising team to discuss your goals and the options available for your campaign.",
  },
  {
    q: "What advertising formats are available?",
    a: "BharatPlay is building a range of advertising opportunities including video ads, in-stream placements, feed and discovery placements, short-form ads, sponsored content and creator partnerships. Contact the team to understand the options currently available.",
  },
  {
    q: "How do I start a campaign?",
    a: "Get started by contacting the BharatPlay advertising team through our contact page. Share your objective and we will help shape the right format and audience approach for your brand.",
  },
  {
    q: "Can I advertise through video?",
    a: "Yes. Video is at the heart of the BharatPlay experience, and video-led advertising placements are a key part of the opportunities we are building. Contact the team to explore the video formats available for your campaign.",
  },
  {
    q: "Can brands work with BharatPlay creators?",
    a: "Yes. BharatPlay is a creator-driven platform, and creator partnerships are an important part of how brands can connect with engaged communities. Reach out to discuss collaboration options.",
  },
  {
    q: "How are campaigns planned?",
    a: "Campaigns are planned around your objective, audience and activity. The BharatPlay team works with you to design an advertising experience that fits your brand. Contact us to start the conversation.",
  },
  {
    q: "How can I contact the advertising team?",
    a: (
      <>
        Reach the advertising team through the{" "}
        <Link
          to="/contact"
          className="font-medium underline underline-offset-2 transition-colors hover:text-red-400"
        >
          Contact page
        </Link>
        . For brand and partnership enquiries, you can also explore the{" "}
        <Link
          to="/for-business"
          className="font-medium underline underline-offset-2 transition-colors hover:text-red-400"
        >
          For Business
        </Link>{" "}
        section.
      </>
    ),
  },
];

/* ─── HERO ─── */

function HeroSection({ isDark }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 80% 60% at 75% 40%, rgba(220,38,38,0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(245,158,11,0.08) 0%, transparent 55%)"
            : "radial-gradient(ellipse 80% 60% at 75% 40%, rgba(220,38,38,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(245,158,11,0.06) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <SectionReveal>
            <Eyebrow isDark={isDark}>BharatPlay for Business</Eyebrow>
            <h1
              className={`mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Put your brand{" "}
              <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                where India watches.
              </span>
            </h1>
            <p
              className={`mt-6 max-w-xl text-base leading-relaxed sm:text-lg ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}
            >
              Reach entertainment audiences through video, content and
              creator-led experiences across the BharatPlay ecosystem.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PrimaryLink to="/contact">Start Advertising</PrimaryLink>
              <SecondaryLink to="#ad-formats" isDark={isDark}>
                Explore Ad Formats
              </SecondaryLink>
            </div>
            <p
              className={`mt-8 flex items-center gap-2 text-sm ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}
            >
              <BadgeCheck size={16} className="text-red-500/80" />
              Built for brands of every size — from first campaigns to
              always-on presence.
            </p>
          </SectionReveal>

          {/* Cinematic visual — ad frame with a real image */}
          <SectionReveal delay={0.15} className="relative">
            <div className="relative mx-auto max-w-sm">
              {/* Glow behind the frame */}
              <div
                className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-70 blur-3xl"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(220,38,38,0.2) 0%, transparent 65%)",
                }}
              />
              {/* Ad frame */}
              <div
                className={`relative overflow-hidden rounded-2xl border shadow-2xl ${
                  isDark
                    ? "border-zinc-800 bg-[#161616] shadow-black/50"
                    : "border-gray-200 bg-white shadow-black/10"
                }`}
              >
                {/* Top bar — ad unit */}
                <div
                  className={`flex items-center justify-between border-b px-4 py-3 sm:px-5 ${
                    isDark ? "border-zinc-800" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 items-center gap-1.5 rounded-full bg-red-600/15 px-2.5 text-[11px] font-semibold text-red-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Ad
                    </span>
                    <span className="text-xs font-semibold opacity-90">
                      YOUR BRAND
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      isDark ? "text-zinc-500" : "text-gray-400"
                    }`}
                  >
                    Sponsored
                  </span>
                </div>
                {/* Video area */}
                <div className="relative flex aspect-[9/16] items-center justify-center overflow-hidden">
                  <img
                    src="/advertising/hero-video.jpg"
                    alt="Audience watching content on a cinema screen"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden="true"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.4) 100%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden="true"
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 40% at 50% 20%, rgba(220,38,38,0.18) 0%, transparent 60%)",
                    }}
                  />
                  <div className="relative flex flex-col items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80 drop-shadow">
                      Play
                    </span>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 backdrop-blur-sm">
                      <Play size={26} className="ml-1 text-white" />
                    </span>
                    <span className="rounded bg-black/50 px-2 py-1 text-[11px] font-medium text-white/80">
                      Your campaign in the watching moment
                    </span>
                  </div>
                </div>
                {/* Bottom info — placement meta */}
                <div className="space-y-2 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={14} className="text-red-500" />
                    <p className="text-xs font-semibold">Sponsored content</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Reach", "Engagement", "Action"].map((label) => (
                      <span
                        key={label}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ring-1 ${
                          isDark
                            ? "border-zinc-700/60 bg-zinc-800/50 ring-zinc-800 text-zinc-400"
                            : "border-gray-200 bg-gray-50 ring-gray-100 text-gray-500"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating chips — hidden on small screens to avoid overflow */}
              <div className="hidden sm:block">
                <div
                  className={`absolute -left-16 top-10 flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-sm ${
                    isDark
                      ? "border-zinc-800 bg-[#161616]/90 text-white"
                      : "border-gray-200 bg-white/90 text-gray-900"
                  }`}
                >
                  <Clapperboard size={16} className="text-red-500" />
                  <span className="text-xs font-semibold">Video Ads</span>
                </div>
                <div
                  className={`absolute -right-14 top-1/3 flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-sm ${
                    isDark
                      ? "border-zinc-800 bg-[#161616]/90 text-white"
                      : "border-gray-200 bg-white/90 text-gray-900"
                  }`}
                >
                  <Zap size={16} className="text-amber-500" />
                  <span className="text-xs font-semibold">Shorts</span>
                </div>
                <div
                  className={`absolute -left-12 bottom-16 flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-sm ${
                    isDark
                      ? "border-zinc-800 bg-[#161616]/90 text-white"
                      : "border-gray-200 bg-white/90 text-gray-900"
                  }`}
                >
                  <Users size={16} className="text-red-500" />
                  <span className="text-xs font-semibold">Creators</span>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

/* ─── VALUE PROPOSITION ─── */

function ValueSection({ isDark }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <SectionHeading
        isDark={isDark}
        eyebrow="Why BharatPlay"
        title="Reach audiences through entertainment."
        description="Build awareness, consideration and action with advertising experiences designed around the way people discover and consume content."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPS.map((item, i) => {
          const Icon = item.icon;
          return (
            <SectionReveal key={item.title} delay={i * 0.06}>
              <div
                className={`group relative h-full overflow-hidden rounded-2xl border p-6 transition-colors duration-300 ${
                  isDark
                    ? "border-zinc-800/70 bg-[#161616] hover:border-red-500/30"
                    : "border-gray-200 bg-white hover:border-red-300"
                }`}
              >
                <div
                  className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                  style={{
                    background:
                      "radial-gradient(circle at top right, rgba(220,38,38,0.12), transparent 65%)",
                  }}
                />
                <span
                  className={`text-xs font-bold tracking-widest ${
                    isDark ? "text-zinc-600" : "text-gray-300"
                  }`}
                >
                  0{i + 1}
                </span>
                <div
                  className={`mt-4 flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-colors duration-300 ${
                    isDark
                      ? "bg-zinc-800/80 ring-zinc-700/60"
                      : "bg-gray-100 ring-gray-200"
                  }`}
                >
                  <Icon size={18} className="text-red-500" />
                </div>
                <h3
                  className={`mt-4 text-base font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {item.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-zinc-400" : "text-gray-500"
                  }`}
                >
                  {item.body}
                </p>
              </div>
            </SectionReveal>
          );
        })}
      </div>
    </section>
  );
}

/* ─── CAMPAIGN JOURNEY ─── */

function JourneySection({ isDark }) {
  return (
    <section
      id="journey"
      className={`border-y scroll-mt-24 ${
        isDark ? "border-zinc-800/70" : "border-gray-200"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHeading
          isDark={isDark}
          eyebrow="The journey"
          title="From attention to action."
          description="A simple way to think about how a BharatPlay advertising experience can work for your brand."
        />

        <div className="relative mt-12">
          {/* Connector line (desktop) */}
          <div
            className={`pointer-events-none absolute left-0 right-0 top-7 hidden h-px lg:block ${
              isDark
                ? "bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
                : "bg-gradient-to-r from-transparent via-gray-300 to-transparent"
            }`}
            aria-hidden="true"
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map((step, i) => {
              const Icon = step.icon;
              return (
                <SectionReveal key={step.title} delay={i * 0.1}>
                  <div className="relative">
                    <div
                      className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg ${
                        isDark
                          ? "border-zinc-700/70 bg-[#161616] shadow-black/40"
                          : "border-gray-200 bg-white shadow-gray-200"
                      }`}
                    >
                      <Icon size={22} className="text-red-500" />
                    </div>
                    <h3
                      className={`mt-5 text-base font-semibold uppercase tracking-wide ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2 max-w-xs text-sm leading-relaxed ${
                        isDark ? "text-zinc-400" : "text-gray-500"
                      }`}
                    >
                      {step.body}
                    </p>
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

/* ─── AD FORMATS ─── */

function FormatCard({ item, isDark, className = "" }) {
  const Icon = item.icon;
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border transition-colors duration-300 ${
        isDark
          ? "border-zinc-800/70 bg-[#161616] hover:border-red-500/30"
          : "border-gray-200 bg-white hover:border-red-300"
      } ${className}`}
    >
      {/* Media */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={item.image}
          alt={item.imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${item.accent}`}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/10" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 backdrop-blur-sm ${
              isDark ? "bg-black/40 ring-white/20" : "bg-white/80 ring-white/60"
            }`}
          >
            <Icon size={16} className="text-red-500" />
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            <span className="h-1 w-1 rounded-full bg-red-500" />
            {item.tag}
          </span>
        </div>
        <div className="absolute bottom-3 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 opacity-0 ring-1 ring-white/30 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <Play size={14} className="ml-0.5 text-white" />
        </div>
      </div>
      {/* Body */}
      <div className="p-6">
        <h3
          className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {item.title}
        </h3>
        <p
          className={`mt-2 text-sm leading-relaxed ${
            isDark ? "text-zinc-400" : "text-gray-500"
          }`}
        >
          {item.body}
        </p>
      </div>
    </div>
  );
}

function FormatsSection({ isDark }) {
  const large = FORMATS.find((f) => f.size === "large");
  const medium = FORMATS.filter((f) => f.size === "medium");
  const small = FORMATS.filter((f) => f.size === "small");

  return (
    <section
      id="ad-formats"
      className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-20"
    >
      <SectionHeading
        isDark={isDark}
        eyebrow="Ad formats"
        title="Choose the format that fits your campaign."
        description="Build campaigns around the way your audience watches."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-12">
        {/* Large feature card */}
        <SectionReveal className="lg:col-span-7">
          <FormatCard item={large} isDark={isDark} className="h-full" />
        </SectionReveal>

        {/* Two medium cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5">
          {medium.map((item, i) => (
            <SectionReveal
              key={item.title}
              delay={0.08 + i * 0.06}
              className="h-full"
            >
              <FormatCard item={item} isDark={isDark} className="h-full" />
            </SectionReveal>
          ))}
        </div>

        {/* Three smaller cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3">
          {small.map((item, i) => (
            <SectionReveal key={item.title} delay={i * 0.06} className="h-full">
              <FormatCard item={item} isDark={isDark} className="h-full" />
            </SectionReveal>
          ))}
        </div>
      </div>

      <SectionReveal className="mt-6">
        <p
          className={`max-w-3xl text-sm leading-relaxed ${
            isDark ? "text-zinc-500" : "text-gray-500"
          }`}
        >
          These represent the advertising opportunities BharatPlay is building
          around its entertainment experiences. Availability evolves with the
          platform — talk to our team to understand the options for your
          campaign today.
        </p>
      </SectionReveal>
    </section>
  );
}

/* ─── CAMPAIGN OBJECTIVES ─── */

function ObjectivesSection({ isDark }) {
  return (
    <section
      className={`border-y scroll-mt-24 ${
        isDark ? "border-zinc-800/70" : "border-gray-200"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHeading
          isDark={isDark}
          eyebrow="Objectives"
          title="What are you trying to achieve?"
          description="Campaigns are shaped around a business objective. These are the kinds of outcomes campaigns can be built toward — the BharatPlay team works with you to find the right approach."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {OBJECTIVES.map((item, i) => {
            const Icon = item.icon;
            return (
              <SectionReveal key={item.title} delay={i * 0.05}>
                <div
                  className={`group h-full rounded-2xl border p-5 transition-all duration-300 focus-within:ring-2 focus-within:ring-red-500/50 ${
                    isDark
                      ? "border-zinc-800/70 bg-[#161616] hover:-translate-y-0.5 hover:border-red-500/40"
                      : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-red-300"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-colors duration-300 ${
                      isDark
                        ? "bg-zinc-800/80 ring-zinc-700/60 group-hover:bg-red-600/15 group-hover:ring-red-500/40"
                        : "bg-gray-100 ring-gray-200 group-hover:bg-red-50 group-hover:ring-red-200"
                    }`}
                  >
                    <Icon size={18} className="text-red-500" />
                  </div>
                  <h3
                    className={`mt-4 text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`mt-1.5 text-[13px] leading-relaxed ${
                      isDark ? "text-zinc-400" : "text-gray-500"
                    }`}
                  >
                    {item.body}
                  </p>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── ECOSYSTEM ─── */

function EcosystemSection({ isDark }) {
  const nodeCard = (node) => {
    const Icon = node.icon;
    return (
      <div
        key={node.label}
        className={`rounded-2xl border p-4 transition-colors duration-300 ${
          isDark
            ? "border-zinc-800/70 bg-[#161616] hover:border-red-500/30"
            : "border-gray-200 bg-white hover:border-red-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${
              isDark
                ? "bg-zinc-800/80 ring-zinc-700/60"
                : "bg-gray-100 ring-gray-200"
            }`}
          >
            <Icon size={16} className="text-red-500" />
          </div>
          <span
            className={`text-sm font-semibold uppercase tracking-wide ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {node.label}
          </span>
        </div>
        <p
          className={`mt-2 text-[13px] leading-relaxed ${
            isDark ? "text-zinc-400" : "text-gray-500"
          }`}
        >
          {node.desc}
        </p>
      </div>
    );
  };

  return (
    <section
      id="ecosystem"
      className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-20"
    >
      <SectionHeading
        isDark={isDark}
        eyebrow="Ecosystem"
        title="Advertise across the BharatPlay experience."
        description="One platform. Multiple entertainment experiences. Multiple opportunities for brands."
      />

      {/* Desktop hub diagram */}
      <SectionReveal className="relative mt-16 hidden aspect-[16/9] max-h-[640px] lg:block">
        {/* Dashed ring */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-40"
          style={{ borderColor: isDark ? "#71717a" : "#d4d4d8" }}
          aria-hidden="true"
        />
        {/* Connections from hub to cardinal nodes */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[36%] w-px -translate-y-full opacity-30"
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(220,38,38,0.6), transparent)"
              : "linear-gradient(to top, rgba(220,38,38,0.35), transparent)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[36%] w-px opacity-30"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(220,38,38,0.6), transparent)"
              : "linear-gradient(to bottom, rgba(220,38,38,0.35), transparent)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 w-[30%] h-px -translate-x-full opacity-30"
          style={{
            background: isDark
              ? "linear-gradient(to left, rgba(245,158,11,0.5), transparent)"
              : "linear-gradient(to left, rgba(245,158,11,0.3), transparent)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 w-[30%] h-px opacity-30"
          style={{
            background: isDark
              ? "linear-gradient(to right, rgba(245,158,11,0.5), transparent)"
              : "linear-gradient(to right, rgba(245,158,11,0.3), transparent)",
          }}
          aria-hidden="true"
        />

        {/* Central hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-full border shadow-2xl sm:h-32 sm:w-32 ${
              isDark
                ? "border-zinc-700/70 bg-[#161616] shadow-black/50"
                : "border-gray-200 bg-white shadow-gray-300"
            }`}
          >
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-red-600 to-red-700 sm:h-24 sm:w-24">
              <span className="text-sm font-black tracking-tight text-white">
                {SITE.brandName}
              </span>
              <span className="absolute inset-0 rounded-full ring-1 ring-white/20" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-600 shadow">
                <Play size={10} className="ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Cardinal nodes */}
        <div className="absolute left-1/2 top-1 w-44 -translate-x-1/2">
          {nodeCard(ECOSYSTEM_NODES[0])}
        </div>
        <div className="absolute bottom-1 left-1/2 w-44 -translate-x-1/2">
          {nodeCard(ECOSYSTEM_NODES[3])}
        </div>
        <div className="absolute left-1 top-1/2 w-44 -translate-y-1/2">
          {nodeCard(ECOSYSTEM_NODES[4])}
        </div>
        <div className="absolute right-1 top-1/2 w-44 -translate-y-1/2">
          {nodeCard(ECOSYSTEM_NODES[5])}
        </div>
        {/* Diagonal nodes */}
        <div className="absolute right-[14%] top-2 w-40">
          {nodeCard(ECOSYSTEM_NODES[1])}
        </div>
        <div className="absolute bottom-2 right-[14%] w-40">
          {nodeCard(ECOSYSTEM_NODES[2])}
        </div>
      </SectionReveal>

      {/* Mobile / tablet layout */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:hidden">
        {ECOSYSTEM_NODES.map(nodeCard)}
      </div>
    </section>
  );
}

/* ─── WORKFLOW ─── */

function WorkflowSection({ isDark }) {
  return (
    <section
      id="workflow"
      className={`border-y scroll-mt-24 ${
        isDark ? "border-zinc-800/70" : "border-gray-200"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            isDark={isDark}
            eyebrow="How it works"
            title="From idea to campaign."
            description="A simple, guided process to bring your advertising idea to life on BharatPlay."
          />

          <ol className="relative space-y-8">
            <div
              className={`pointer-events-none absolute bottom-4 left-[27px] top-4 w-px ${
                isDark ? "bg-zinc-800" : "bg-gray-200"
              }`}
              aria-hidden="true"
            />
            {WORKFLOW_STEPS.map((step, i) => (
              <SectionReveal key={step.title} delay={i * 0.08}>
                <li className="relative flex gap-5">
                  <span
                    className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold shadow-lg ${
                      isDark
                        ? "border-zinc-700/70 bg-[#161616] text-red-500 shadow-black/40"
                        : "border-gray-200 bg-white text-red-600 shadow-gray-200"
                    }`}
                  >
                    0{i + 1}
                  </span>
                  <div className="pt-1">
                    <h3
                      className={`text-base font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-1.5 max-w-md text-sm leading-relaxed ${
                        isDark ? "text-zinc-400" : "text-gray-500"
                      }`}
                    >
                      {step.body}
                    </p>
                  </div>
                </li>
              </SectionReveal>
            ))}
          </ol>
        </div>

        <SectionReveal className="mt-12">
          <PrimaryLink to="/contact">
            Talk to BharatPlay Advertising
          </PrimaryLink>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ─── CREATIVE SHOWCASE ─── */

function ShowcaseSection({ isDark }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <SectionHeading
        isDark={isDark}
        eyebrow="Creative showcase"
        title="Make your brand part of the story."
        description="Placement concepts that show how your brand could live inside the BharatPlay experience."
        center
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SHOWCASE.map((item, i) => (
          <SectionReveal key={item.label} delay={i * 0.06}>
            <div className="group">
              <div
                className={`relative overflow-hidden rounded-2xl border shadow-lg ${
                  isDark
                    ? "border-zinc-800/70 shadow-black/40"
                    : "border-gray-200 shadow-gray-200"
                } ${item.aspect}`}
              >
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/30" />
                {/* Ad badge */}
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  Ad
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
                  {item.kind}
                </span>
                {/* Center play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 opacity-80 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/25">
                    <Play size={18} className="ml-0.5 text-white" />
                  </span>
                </div>
                {/* Brand label */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="text-base font-extrabold uppercase tracking-widest text-white drop-shadow-md">
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
          </SectionReveal>
        ))}
      </div>
      <SectionReveal className="mt-6">
        <p
          className={`mx-auto max-w-2xl text-center text-sm leading-relaxed ${
            isDark ? "text-zinc-500" : "text-gray-500"
          }`}
        >
          Placeholder creative used to demonstrate placement concepts only. Your
          campaign creative is brought to life by your team and ours.
        </p>
      </SectionReveal>
    </section>
  );
}

/* ─── WHY BHARATPLAY ─── */

function WhySection({ isDark }) {
  return (
    <section
      className={`border-y ${
        isDark ? "border-zinc-800/70" : "border-gray-200"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          isDark ? "bg-[#111111]" : "bg-white"
        }`}
      >
        {/* Faint cinematic backdrop */}
        <img
          src="/advertising/why-bg.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${
            isDark ? "opacity-15" : "opacity-[0.06]"
          }`}
        />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 70% 90% at 50% 120%, rgba(220,38,38,0.1) 0%, transparent 60%)"
              : "radial-gradient(ellipse 70% 90% at 50% 120%, rgba(220,38,38,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionHeading
            isDark={isDark}
            eyebrow="Why BharatPlay"
            title="Advertising built around entertainment."
            center
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {WHY_STATEMENTS.map((item, i) => (
              <SectionReveal key={item.title} delay={i * 0.08}>
                <div className="group border-l-2 border-red-500/60 pl-5">
                  <h3
                    className={`text-2xl font-bold tracking-tight ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 text-base leading-relaxed ${
                      isDark ? "text-zinc-400" : "text-gray-500"
                    }`}
                  >
                    {item.body}
                  </p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */

function FaqSection({ isDark }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="faq"
      className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-20"
    >
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          isDark={isDark}
          eyebrow="FAQ"
          title="Questions, answered."
          description="Common questions about advertising on BharatPlay. If you cannot find what you are looking for, contact the team."
        />
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <SectionReveal key={faq.q} delay={i * 0.05}>
                <div
                  className={`rounded-2xl border transition-colors duration-300 ${
                    isDark
                      ? open
                        ? "border-red-500/30 bg-[#161616]"
                        : "border-zinc-800/70 bg-[#161616]"
                      : open
                        ? "border-red-300 bg-white"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? -1 : i)}
                      aria-expanded={open}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-button-${i}`}
                      className={`flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {faq.q}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        } ${
                          isDark
                            ? "bg-zinc-800/80 ring-zinc-700/60"
                            : "bg-gray-100 ring-gray-200"
                        }`}
                      >
                        <ChevronDown size={15} className="text-red-500" />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    className={`grid transition-all duration-300 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className={`px-5 pb-5 text-sm leading-relaxed ${
                          isDark ? "text-zinc-400" : "text-gray-500"
                        }`}
                      >
                        {faq.a}
                      </p>
                    </div>
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

/* ─── FINAL CTA ─── */

function FinalCtaSection({ isDark }) {
  return (
    <section
      className={`border-t ${isDark ? "border-zinc-800/70" : "border-gray-200"}`}
    >
      <div
        className={`relative overflow-hidden ${
          isDark ? "bg-[#111111]" : "bg-white"
        }`}
      >
        {/* Watermark play button */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
          aria-hidden="true"
        >
          <CirclePlay size={320} />
        </div>
        {/* Atmospheric glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 60% 70% at 50% 110%, rgba(220,38,38,0.14) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 50% 0%, rgba(220,38,38,0.08) 0%, transparent 60%)"
              : "radial-gradient(ellipse 60% 70% at 50% 110%, rgba(220,38,38,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <SectionReveal>
            <Eyebrow isDark={isDark}>Let&apos;s talk</Eyebrow>
            <h2
              className={`mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Ready to put your brand{" "}
              <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                in the spotlight?
              </span>
            </h2>
            <p
              className={`mx-auto mt-5 max-w-xl text-base leading-relaxed ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}
            >
              Tell us what you&apos;re building and let&apos;s explore the right
              BharatPlay advertising experience for your campaign.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <PrimaryLink to="/contact">Advertise With BharatPlay</PrimaryLink>
              <SecondaryLink to="/contact" isDark={isDark}>
                Contact Us
              </SecondaryLink>
            </div>
            <div
              className={`mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Megaphone size={15} className="text-red-500/80" />
                For Business
              </span>
              <span className="flex items-center gap-1.5">
                <AtSign size={15} className="text-red-500/80" />
                Advertising
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={15} className="text-red-500/80" />
                BharatPlay Ecosystem
              </span>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

/* ─── PAGE ─── */

export default function AdvertisingPage() {
  usePageMeta(
    "Advertise With BharatPlay | Reach Audiences Through Entertainment",
    "Discover advertising opportunities across the BharatPlay entertainment ecosystem and build campaigns around video, content and audience experiences.",
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="overflow-x-clip">
      <HeroSection isDark={isDark} />
      <ValueSection isDark={isDark} />
      <JourneySection isDark={isDark} />
      <FormatsSection isDark={isDark} />
      <ObjectivesSection isDark={isDark} />
      <EcosystemSection isDark={isDark} />
      <WorkflowSection isDark={isDark} />
      <ShowcaseSection isDark={isDark} />
      <WhySection isDark={isDark} />
      <FaqSection isDark={isDark} />
      <FinalCtaSection isDark={isDark} />
    </div>
  );
}
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { SettingsPageShell, SettingsPageHeader } from "../components/common/SettingsShared";

const FAQ_DATA = [
  {
    category: "General",
    items: [
      { q: "What is Bharat Play?", a: "Bharat Play is a video platform where creators can upload, share, and monetize their content. Viewers can watch videos, subscribe to channels, and engage with creators." },
      { q: "Is Bharat Play free to use?", a: "Yes. Creating an account and watching videos is completely free. Some features like creator monetization may have additional requirements." },
      { q: "How do I create an account?", a: "You can sign up using your email address or via Google OAuth. Tap the Sign Up or Sign In button on the login page to get started." },
    ],
  },
  {
    category: "Account & Login",
    items: [
      { q: "I forgot my password. How do I reset it?", a: "Tap 'Forgot Password?' on the login page. Enter your registered email address, and we will send you an OTP to reset your password." },
      { q: "How do I change my profile picture?", a: "Go to your profile page and tap the edit icon on your avatar. You can upload a new image from your device." },
      { q: "Can I delete my account?", a: "Please contact customer support to request account deletion. This action is permanent and cannot be undone." },
    ],
  },
  {
    category: "Videos",
    items: [
      { q: "How do I upload a video?", a: "Tap the Upload button in the navigation bar. Select a video file, fill in the title and description, choose a category, and publish." },
      { q: "What video formats are supported?", a: "We support MP4, MOV, AVI, and MKV formats. For best results, we recommend uploading in MP4 with H.264 encoding." },
      { q: "Why was my video removed?", a: "Videos may be removed for violating our content policies, including copyright infringement, harmful content, or spam. Check your email for a detailed notification." },
      { q: "How do I add a video to Watch Later?", a: "Tap the bookmark icon on any video card or use the 'Save to Watch Later' option in the video player menu." },
    ],
  },
  {
    category: "Privacy & Security",
    items: [
      { q: "How is my data protected?", a: "We use industry-standard encryption for all data in transit and at rest. Your personal information is never sold to third parties." },
      { q: "How do I report inappropriate content?", a: "Tap the three-dot menu on any video and select 'Report'. Choose a reason and submit. Our team will review the report promptly." },
      { q: "Can I make my videos private?", a: "Yes. When uploading or editing a video, you can set its visibility to Public, Unlisted, or Private." },
    ],
  },
  {
    category: "Payments & Rewards",
    items: [
      { q: "How do I earn rewards?", a: "You can earn rewards through the Watch & Earn program, referrals, and creator monetization features. Visit the Earn section for details." },
      { q: "How do I withdraw my earnings?", a: "Go to your profile and tap 'Withdraw Rewards'. You can transfer earnings to your linked payment method." },
      { q: "What is the minimum withdrawal amount?", a: "The minimum withdrawal amount and available payment methods may vary by region. Check the Withdraw page for current thresholds." },
    ],
  },
  {
    category: "Technical Issues",
    items: [
      { q: "Videos are not loading. What should I do?", a: "Check your internet connection, clear your browser cache, and try again. If the issue persists, try a different browser or device." },
      { q: "The app feels slow. How can I fix this?", a: "Make sure you are using the latest version of your browser. Clearing cache and closing unused tabs can also improve performance." },
      { q: "I found a bug. How do I report it?", a: "Go to the Feedback page from the profile dropdown menu and submit a Bug Report. Include as much detail as possible about the issue." },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className="border-b border-zinc-800/60 last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-zinc-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/50 sm:px-5"
      >
        <span className="text-sm font-medium text-zinc-200 sm:text-base">
          {item.q}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className="shrink-0 text-zinc-500" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-zinc-500" />
        )}
      </button>
      <div
        role="region"
        style={{ height: height + "px" }}
        className="overflow-hidden transition-[height] duration-200 ease-out"
      >
        <div ref={contentRef} className="px-4 pb-4 sm:px-5">
          <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...FAQ_DATA.map((c) => c.category)];

  const filteredData = FAQ_DATA.filter(
    (cat) => activeCategory === "All" || cat.category === activeCategory,
  )
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          !search ||
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const handleToggle = useCallback(
    (globalIndex) => {
      setOpenIndex((prev) => (prev === globalIndex ? null : globalIndex));
    },
    [],
  );

  let itemCounter = 0;

  return (
    <SettingsPageShell>
      <SettingsPageHeader title="Frequently Asked Questions" />

      <p className="mt-2 max-w-2xl text-sm text-zinc-500">
        Find answers to common questions about using Bharat Play.
      </p>

      {/* Search */}
      <div className="relative mt-6">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpenIndex(null);
          }}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-zinc-700 focus:outline-none sm:text-base"
        />
      </div>

      {/* Category Tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setOpenIndex(null);
            }}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-red-600 text-white"
                : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/40">
        {filteredData.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            No questions match your search.
          </div>
        ) : (
          filteredData.map((cat) => (
            <div key={cat.category}>
              <div className="border-b border-zinc-800/60 bg-zinc-900/60 px-4 py-2.5 sm:px-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {cat.category}
                </h3>
              </div>
              {cat.items.map((item) => {
                const idx = itemCounter++;
                return (
                  <AccordionItem
                    key={idx}
                    item={item}
                    isOpen={openIndex === idx}
                    onToggle={() => handleToggle(idx)}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5 text-center sm:p-6">
        <p className="text-sm text-zinc-400">
          Can&apos;t find what you&apos;re looking for?{" "}
          <a
            href="/feedback"
            className="font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Send us feedback
          </a>
        </p>
      </div>
    </SettingsPageShell>
  );
}

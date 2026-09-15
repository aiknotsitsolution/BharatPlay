import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Play,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Grid,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const recentShorts = [
  { id: "r1", dur: "1:40", title: "Mountain Sunrise", creator: "@NatureVib", earn: "₹45.00", thumb: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=500&fit=crop" },
  { id: "r2", dur: "1:00", title: "City Nights", creator: "@UrbanLife", earn: "₹32.00", thumb: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=500&fit=crop" },
  { id: "r3", dur: "2:40", title: "Ocean Waves", creator: "@BeachVibes", earn: "₹67.00", thumb: "https://images.unsplash.com/photo-1571759560077-65296cc77dfd?w=300&h=500&fit=crop" },
  { id: "r4", dur: "0:55", title: "Runner's High", creator: "@FitLife", earn: "₹28.00", thumb: "https://images.unsplash.com/photo-1552250575-67576307f935?w=300&h=500&fit=crop" },
  { id: "r5", dur: "1:22", title: "Trail Run", creator: "@RunnerX", earn: "₹51.00", thumb: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=500&fit=crop" },
  { id: "r6", dur: "0:48", title: "Forest Walk", creator: "@NatureVib", earn: "₹19.00", thumb: "https://images.unsplash.com/photo-1470146718580-010796192dd8?w=300&h=500&fit=crop" },
];

const topShorts = [
  { id: "t1", title: "High Earning Video", creator: "@Swaet", earn: "₹500", thumb: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=560&fit=crop" },
  { id: "t2", title: "High Earning Video", creator: "@Crimflow", earn: "₹162.00", thumb: "https://images.unsplash.com/photo-1470146718580-010796192dd8?w=400&h=560&fit=crop" },
  { id: "t3", title: "High Earning Video", creator: "@ZarnMore", earn: "₹81.00", thumb: "https://images.unsplash.com/photo-1551244653-a5a5a1ace188?w=400&h=560&fit=crop" },
  { id: "t4", title: "Top Earning Short", creator: "@NatureVib", earn: "₹240.00", thumb: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=560&fit=crop" },
  { id: "t5", title: "Viral Street Food", creator: "@FoodieMP", earn: "₹95.00", thumb: "https://images.unsplash.com/photo-1470146718580-010796192dd8?w=400&h=560&fit=crop" },
  { id: "t6", title: "Sunset Timelapse", creator: "@NatureVib", earn: "₹180.00", thumb: "https://images.unsplash.com/photo-1551244653-a5a5a1ace188?w=400&h=560&fit=crop" },
];

const earnMore = [
  { id: "e1", title: "Golden Hour", creator: "@PhotoPro", earn: "$1.30", thumb: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop" },
  { id: "e2", title: "Portrait Session", creator: "@PortraitArt", earn: "₹9.40", thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" },
  { id: "e3", title: "Nature Close-up", creator: "@MacroShots", earn: "₹3.00", thumb: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop" },
  { id: "e4", title: "Abstract Light", creator: "@LightPainter", earn: "₹5.70", thumb: "https://images.unsplash.com/photo-1544148921-1e6f2134d89d?w=300&h=300&fit=crop" },
  { id: "e5", title: "Face Sketch", creator: "@SketchMaster", earn: "₹7.20", thumb: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop" },
  { id: "e6", title: "Studio Light", creator: "@StudioPro", earn: "₹4.10", thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" },
];

const suggestedVideos = [
  { id: "s1", title: "Sky Dreams", creator: "@SkyChaser", views: "9.0K", earn: "₹120", thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=260&fit=crop" },
  { id: "s2", title: "Waterfall Magic", creator: "@WaterVib", views: "1.0K", earn: "₹55", thumb: "https://images.unsplash.com/photo-1494783160278-93b2a2027a02?w=400&h=260&fit=crop" },
  { id: "s3", title: "Sunset Glow", creator: "@GlowCaster", views: "9.0K", earn: "₹200", thumb: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=260&fit=crop" },
  { id: "s4", title: "Valley View", creator: "@ValleyLens", views: "4.2K", earn: "₹88", thumb: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=260&fit=crop" },
  { id: "s5", title: "Forest Canopy", creator: "@ForestWalker", views: "12.5K", earn: "₹310", thumb: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=260&fit=crop" },
  { id: "s6", title: "River Flow", creator: "@RiverSoul", views: "3.1K", earn: "₹72", thumb: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=260&fit=crop" },
];

// Master list — used for detail page lookup
const allVideos = [...recentShorts, ...topShorts, ...earnMore, ...suggestedVideos];

// ─────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────
function PlayOverlay({ size = 40 }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/55 border border-white/20 pointer-events-none"
      style={{ width: size, height: size, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
    >
      <Play size={size * 0.4} fill="white" color="white" strokeWidth={0} className="ml-0.5" />
    </div>
  );
}

function BottomGradient({ opacity = 0.6 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{ background: `linear-gradient(to top, rgba(0,0,0,${opacity}) 0%, transparent 55%)` }}
    />
  );
}

function SectionHeader({ title }) {
  return (
    <div className="mb-3 flex items-center justify-between md:mb-4">
      <h2 className="text-[17px] font-bold tracking-tight text-white md:text-[19px]">{title}</h2>
      <div className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
        See All <ChevronRight size={15} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPLORE PAGE
// ─────────────────────────────────────────────
function ExplorePage({ onVideoClick }) {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const isMobile = width < 768;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-10 md:pb-16">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 pt-5 md:gap-10 md:px-6 lg:px-8">

        {/* ── RECENT ROW ── */}
        <div>
          <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {recentShorts.map((item) => (
              <div
                key={item.id}
                onClick={() => onVideoClick(item)}
                className={`flex-shrink-0 rounded-lg overflow-hidden relative bg-zinc-900 cursor-pointer transition-transform duration-200 hover:scale-[1.04] active:scale-[0.96]`}
                style={{ width: isMobile ? 108 : 148, height: isMobile ? 148 : 200 }}
              >
                <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                <BottomGradient opacity={0.5} />
                <PlayOverlay size={isMobile ? 36 : 42} />
                <div className="absolute bottom-1.5 right-1.5 z-20 rounded bg-black/60 px-1.5 py-0.5 text-[10.5px] font-medium text-white" style={{ backdropFilter: "blur(6px)" }}>
                  {item.dur}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TOP SHORTS ── */}
        <div>
          <SectionHeader title="Top Shorts" />
          {isMobile ? (
            <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {topShorts.map((item) => (
                <div key={item.id} onClick={() => onVideoClick(item)} className="w-[153px] flex-shrink-0 cursor-pointer">
                  <div className="relative h-[204px] w-full rounded-lg overflow-hidden bg-zinc-900 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.96]">
                    <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                    <BottomGradient opacity={0.7} />
                    <PlayOverlay size={38} />
                    <div className="absolute bottom-2 left-2 z-20 flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs" style={{ backdropFilter: "blur(6px)" }}>
                      <span>🔥</span>
                      <span className="font-semibold text-white truncate">{item.title}</span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span>💰</span>
                    <span className="font-medium text-zinc-300">{item.earn}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-zinc-500">{item.creator}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-5">
              {topShorts.map((item) => (
                <div key={item.id} onClick={() => onVideoClick(item)} className="group cursor-pointer">
                  <div className="relative aspect-[9/13] rounded-xl overflow-hidden bg-zinc-900 transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-black/40">
                    <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                    <BottomGradient opacity={0.7} />
                    <PlayOverlay size={44} />
                    <div className="absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-lg bg-black/65 px-3 py-1.5 text-sm" style={{ backdropFilter: "blur(6px)" }}>
                      <span className="text-base">🔥</span>
                      <span className="font-semibold text-white truncate">{item.title}</span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-sm">
                    <span>💰</span>
                    <span className="font-medium text-zinc-200">{item.earn}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-zinc-500">{item.creator}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── EARN MORE ── */}
        <div>
          <SectionHeader title="Earn More, Watch More" />
          {isMobile ? (
            <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {earnMore.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onVideoClick(item)}
                  className="relative h-[132px] w-[132px] flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 cursor-pointer transition-transform hover:scale-105 active:scale-[0.96] duration-200"
                >
                  <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                  <BottomGradient opacity={0.55} />
                  <PlayOverlay size={32} />
                  <div className="absolute bottom-1.5 left-1.5 z-20 rounded bg-black/60 px-2 py-0.5 text-xs font-semibold text-white" style={{ backdropFilter: "blur(4px)" }}>
                    {item.earn}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-5">
              {earnMore.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onVideoClick(item)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.025] hover:shadow-xl hover:shadow-black/35"
                >
                  <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                  <BottomGradient opacity={0.55} />
                  <PlayOverlay size={38} />
                  <div className="absolute bottom-3 left-3 z-20 rounded bg-black/60 px-3 py-1.5 text-sm font-semibold text-white" style={{ backdropFilter: "blur(6px)" }}>
                    {item.earn}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RECOMMENDED (marquee) ── */}
        <div>
          <div className="mb-3 flex items-center justify-between md:mb-4">
            <h2 className="text-[17px] font-bold tracking-tight text-white md:text-[19px]">Recommended</h2>
            <ChevronRight size={18} className="text-zinc-500 cursor-pointer" />
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div className="overflow-hidden">
            <div className="flex py-2" style={{ animation: "marquee 30s linear infinite", width: "200%" }}>
              {[...recentShorts, ...recentShorts].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onVideoClick(item)}
                  className="flex-shrink-0 rounded-lg overflow-hidden relative bg-zinc-900 cursor-pointer transition-transform duration-200 hover:scale-[1.04] mx-1.5 md:mx-2.5"
                  style={{ width: isMobile ? 110 : 150, height: isMobile ? 150 : 200 }}
                >
                  <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                  <BottomGradient opacity={0.5} />
                  <PlayOverlay size={isMobile ? 32 : 40} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FULL VIDEO / DETAIL PAGE
// ─────────────────────────────────────────────
function FullVideoPage({ video, onBack }) {
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef(null);

  // Auto-play a looping dummy video overlay using a canvas shimmer
  // Since we don't have real video files, we simulate with a pulsing play state

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0a0a", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)", padding: "18px 22px", height: 68 }}>
        <button onClick={onBack} className="text-white hover:opacity-60 transition-opacity active:scale-90">
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <button className="text-white hover:opacity-60 transition-opacity">
          <Grid size={22} strokeWidth={1.8} />
        </button>
      </header>

      {/* ── HERO VIDEO SECTION ── */}
      <section className="relative w-full" style={{ height: "100vh", maxHeight: 720 }}>
        <img src={video.thumb} alt={video.title || "Video"} className="absolute inset-0 w-full h-full object-cover" />

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.06) 65%, transparent 85%)" }} />

        {/* Playing indicator (pulse ring) */}
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ pointerEvents: "none" }}>
          <div
            onClick={() => setPlaying(!playing)}
            className="relative flex items-center justify-center cursor-pointer"
            style={{ pointerEvents: "auto", width: 72, height: 72 }}
          >
            {/* Outer pulse ring */}
            {playing && (
              <div className="absolute inset-0 rounded-full border-2 border-white/30" style={{ animation: "pulseRing 1.8s ease-out infinite" }} />
            )}
            {/* Main circle */}
            <div
              className="relative z-10 flex items-center justify-center rounded-full"
              style={{
                width: 56, height: 56,
                background: playing ? "rgba(255,60,60,0.85)" : "rgba(0,0,0,0.6)",
                border: "2px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                transition: "background 0.3s",
              }}
            >
              {playing ? (
                // Pause icon (two bars)
                <div className="flex gap-1.5">
                  <div className="w-[4px] h-[18px] rounded-sm bg-white" />
                  <div className="w-[4px] h-[18px] rounded-sm bg-white" />
                </div>
              ) : (
                <Play size={22} fill="white" color="white" strokeWidth={0} className="ml-0.5" />
              )}
            </div>
          </div>
        </div>

        {/* Title + meta at bottom */}
        <div className="relative z-10 flex flex-col justify-end w-full h-full" style={{ padding: "0 24px 32px" }}>
          <div className="flex items-start justify-between w-full">
            <div>
              <h1 className="font-bold text-white" style={{ fontSize: "clamp(20px, 5vw, 32px)", lineHeight: 1.25 }}>
                {video.title || "Amazing Video"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-zinc-300 font-medium" style={{ fontSize: 14 }}>{video.creator || "@Creator"}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400" style={{ fontSize: 14 }}>124k views</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400" style={{ fontSize: 14 }}>2 days ago</span>
              </div>
            </div>
            <button className="text-white hover:opacity-60 transition-opacity mt-1">
              <MoreHorizontal size={22} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* ── ACTION BUTTONS ── */}
      <section className="flex items-center justify-around flex-wrap gap-y-3" style={{ background: "#111", padding: "18px 20px" }}>
        {/* Like */}
        <button onClick={() => setLiked(!liked)} className="flex items-center gap-2 hover:opacity-75 transition-opacity active:scale-90">
          <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: liked ? "rgba(255,70,70,0.2)" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }}>
            <ThumbsUp size={19} fill={liked ? "#ff5555" : "none"} color={liked ? "#ff5555" : "#ccc"} style={{ transition: "all 0.3s" }} />
          </div>
          <span className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Like</span>
        </button>

        {/* Comment */}
        <button className="flex items-center gap-2 hover:opacity-75 transition-opacity active:scale-90">
          <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}>
            <MessageSquare size={19} color="#ccc" strokeWidth={1.8} fill="none" />
          </div>
          <span className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Comment</span>
        </button>

        {/* Share */}
        <button className="flex items-center gap-2 hover:opacity-75 transition-opacity active:scale-90">
          <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}>
            <Share2 size={19} color="#ccc" strokeWidth={1.8} />
          </div>
          <span className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Share</span>
        </button>
      </section>

      {/* ── WATCH NEXT & EARN MORE ── */}
      <section style={{ background: "#0a0a0a", padding: "28px 0 48px" }}>
        <div className="flex items-center justify-between" style={{ padding: "0 24px 18px" }}>
          <h2 className="text-white font-bold" style={{ fontSize: 18 }}>Watch Next & Earn More</h2>
          <ChevronRight size={20} color="#aaa" strokeWidth={2} />
        </div>

        <div className="flex gap-4 flex-wrap" style={{ padding: "0 24px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {suggestedVideos.map((v) => (
            <SuggestedCard key={v.id} video={v} onVideoClick={() => {
              // Navigate to this suggested video
              window.scrollTo({ top: 0, behavior: "smooth" });
              // Re-render with new video
              onBack(); // go back first
              setTimeout(() => {}, 50);
            }} onClickDirect={() => {
              // We'll use a different approach — call a prop
            }} />
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function SuggestedCard({ video, onVideoClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onVideoClick}
      className="cursor-pointer"
      style={{ flexShrink: 0, width: "clamp(140px, 28vw, 240px)" }}
    >
      <div className="relative overflow-hidden" style={{ borderRadius: 12, aspectRatio: "16/10", background: "#1a1a1a" }}>
        <img
          src={video.thumb}
          alt=""
          className="w-full h-full object-cover"
          style={{ transition: "transform 0.4s ease", transform: hovered ? "scale(1.07)" : "scale(1)" }}
        />
        <div className="absolute inset-0" style={{ background: hovered ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.3)", transition: "background 0.3s" }} />
        {/* Play circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.18)", opacity: hovered ? 1 : 0.82, transition: "opacity 0.3s" }}>
            <Play size={15} fill="#fff" color="#fff" />
          </div>
        </div>
        {/* Earn badge */}
        <div className="absolute flex items-center gap-1" style={{ bottom: 8, left: 10 }}>
          <span className="text-[9px]">💰</span>
          <span className="text-[10px] font-semibold text-white">{video.earn}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP — handles navigation state
// ─────────────────────────────────────────────
export default function ShortsApp() {
  const [currentVideo, setCurrentVideo] = useState(null); // null = Explore page

  const handleVideoClick = (video) => {
    setCurrentVideo(video);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentVideo(null);
  };

  // ── Suggested video click on detail page navigates to that video ──
  // We re-render FullVideoPage with a wrapper that also handles suggested clicks
  if (currentVideo) {
    return (
      <FullVideoPageWrapper
        video={currentVideo}
        onBack={handleBack}
        onSuggestedClick={handleVideoClick}
      />
    );
  }

  return <ExplorePage onVideoClick={handleVideoClick} />;
}

// Wrapper to pass suggested click handler into FullVideoPage
function FullVideoPageWrapper({ video, onBack, onSuggestedClick }) {
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(true);

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0a0a", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)", padding: "18px 22px", height: 68 }}>
        <button onClick={onBack} className="text-white hover:opacity-60 transition-opacity active:scale-90">
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <button className="text-white hover:opacity-60 transition-opacity">
          <Grid size={22} strokeWidth={1.8} />
        </button>
      </header>

      {/* ── HERO ── */}
      <section className="relative w-full" style={{ height: "100vh", maxHeight: 720 }}>
        <img src={video.thumb} alt={video.title || "Video"} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.06) 65%, transparent 85%)" }} />

        {/* Play/Pause button with pulse */}
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ pointerEvents: "none" }}>
          <div
            onClick={() => setPlaying(!playing)}
            className="relative flex items-center justify-center cursor-pointer"
            style={{ pointerEvents: "auto", width: 72, height: 72 }}
          >
            {playing && <div className="absolute inset-0 rounded-full border-2 border-white/30" style={{ animation: "pulseRing 1.8s ease-out infinite" }} />}
            <div
              className="relative z-10 flex items-center justify-center rounded-full"
              style={{ width: 56, height: 56, background: playing ? "rgba(255,60,60,0.85)" : "rgba(0,0,0,0.6)", border: "2px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", transition: "background 0.3s" }}
            >
              {playing ? (
                <div className="flex gap-1.5">
                  <div className="w-[4px] h-[18px] rounded-sm bg-white" />
                  <div className="w-[4px] h-[18px] rounded-sm bg-white" />
                </div>
              ) : (
                <Play size={22} fill="white" color="white" strokeWidth={0} className="ml-0.5" />
              )}
            </div>
          </div>
        </div>

        {/* Title + meta */}
        <div className="relative z-10 flex flex-col justify-end w-full h-full" style={{ padding: "0 24px 32px" }}>
          <div className="flex items-start justify-between w-full">
            <div>
              <h1 className="font-bold text-white" style={{ fontSize: "clamp(20px, 5vw, 32px)", lineHeight: 1.25 }}>{video.title || "Amazing Video"}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-zinc-300 font-medium" style={{ fontSize: 14 }}>{video.creator || "@Creator"}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400" style={{ fontSize: 14 }}>124k views</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400" style={{ fontSize: 14 }}>2 days ago</span>
              </div>
            </div>
            <button className="text-white hover:opacity-60 transition-opacity mt-1">
              <MoreHorizontal size={22} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* ── ACTION BUTTONS ── */}
      <section className="flex items-center justify-around flex-wrap gap-y-3" style={{ background: "#111", padding: "18px 20px" }}>
        <button onClick={() => setLiked(!liked)} className="flex items-center gap-2 hover:opacity-75 transition-opacity active:scale-90">
          <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: liked ? "rgba(255,70,70,0.2)" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }}>
            <ThumbsUp size={19} fill={liked ? "#ff5555" : "none"} color={liked ? "#ff5555" : "#ccc"} style={{ transition: "all 0.3s" }} />
          </div>
          <span className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Like</span>
        </button>

        <button className="flex items-center gap-2 hover:opacity-75 transition-opacity active:scale-90">
          <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}>
            <MessageSquare size={19} color="#ccc" strokeWidth={1.8} fill="none" />
          </div>
          <span className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Comment</span>
        </button>

        <button className="flex items-center gap-2 hover:opacity-75 transition-opacity active:scale-90">
          <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}>
            <Share2 size={19} color="#ccc" strokeWidth={1.8} />
          </div>
          <span className="text-zinc-400 font-medium" style={{ fontSize: 14 }}>Share</span>
        </button>
      </section>

      {/* ── WATCH NEXT ── */}
      <section style={{ background: "#0a0a0a", padding: "28px 0 48px" }}>
        <div className="flex items-center justify-between" style={{ padding: "0 24px 18px" }}>
          <h2 className="text-white font-bold" style={{ fontSize: 18 }}>Watch Next & Earn More</h2>
          <ChevronRight size={20} color="#aaa" strokeWidth={2} />
        </div>

        <div className="flex gap-4 flex-wrap" style={{ padding: "0 24px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {suggestedVideos.map((v) => (
            <SuggestedCardClickable key={v.id} video={v} onClick={() => {
              onSuggestedClick(v);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} />
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function SuggestedCardClickable({ video, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="cursor-pointer"
      style={{ flexShrink: 0, width: "clamp(140px, 28vw, 240px)" }}
    >
      <div className="relative overflow-hidden" style={{ borderRadius: 12, aspectRatio: "16/10", background: "#1a1a1a" }}>
        <img
          src={video.thumb}
          alt=""
          className="w-full h-full object-cover"
          style={{ transition: "transform 0.4s ease", transform: hovered ? "scale(1.07)" : "scale(1)" }}
        />
        <div className="absolute inset-0" style={{ background: hovered ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.3)", transition: "background 0.3s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.18)", opacity: hovered ? 1 : 0.82, transition: "opacity 0.3s" }}>
            <Play size={15} fill="#fff" color="#fff" />
          </div>
        </div>
        <div className="absolute flex items-center gap-1" style={{ bottom: 8, left: 10 }}>
          <span className="text-[9px]">💰</span>
          <span className="text-[10px] font-semibold text-white">{video.earn}</span>
        </div>
      </div>
    </div>
  );
}
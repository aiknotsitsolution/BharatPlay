import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Play,
  Plus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { fetchHomeVideos } from "../../features/videos/videosSlice";
import { addToWatchLater, removeFromWatchLater } from "../../api/watchLater";
import { formatTime } from "../player/utils";
import ShortCard from "./ShortCard";
import { ShortsCardSkeletonRow, VideoCardSkeletonRow } from "./Skeletons";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

const supportsHover =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

let activePreviewVideo = null;

const stopActivePreview = () => {
  if (activePreviewVideo) {
    activePreviewVideo.pause();
    activePreviewVideo.currentTime = 0;
    activePreviewVideo = null;
  }
};

const romanticShows = [
  {
    id: 1,
    title: "Love in the Clouds",
    thumb:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=225&fit=crop",
  },
  {
    id: 2,
    title: "Hidden Love",
    thumb:
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=225&fit=crop",
  },
  {
    id: 3,
    title: "Queen of Tears",
    thumb:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=225&fit=crop",
  },
  {
    id: 4,
    title: "Inheritors",
    thumb:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop",
  },
  {
    id: 5,
    title: "When I Fly Towards You",
    thumb:
      "https://images.unsplash.com/photo-1522158637959-30385a09e0da?w=400&h=225&fit=crop",
  },
];

const kidsFilms = [
  {
    id: 101,
    title: "Chhota Bheem: The Crown",
    thumb:
      "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&h=225&fit=crop",
  },
  {
    id: 102,
    title: "Motu Patlu: Kung Fu",
    thumb:
      "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=225&fit=crop",
  },
  {
    id: 103,
    title: "Doraemon: Nobita",
    thumb:
      "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=225&fit=crop",
  },
  {
    id: 104,
    title: "Oggy & Cockroaches",
    thumb:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=225&fit=crop",
  },
  {
    id: 105,
    title: "Shinchan Movie",
    thumb:
      "https://images.unsplash.com/photo-1606164587034-81b84c4e11d0?w=400&h=225&fit=crop",
  },
  {
    id: 106,
    title: "Tom & Jerry",
    thumb:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=225&fit=crop",
  },
];

// ────────────────────────────────────────────────
// Reusable components
// ────────────────────────────────────────────────

function useWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

function SectionHeader({ title, onClick }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2
        onClick={onClick}
        className="text-white text-xl font-semibold flex items-center gap-2 hover:text-white/80 transition-colors cursor-pointer"
      >
        {title}
        <ChevronRight size={20} className="text-zinc-400" />
      </h2>
    </div>
  );
}

const resolveImage = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${BACKEND_URL}/${String(value).replace(/^\/+/, "").replace(/\\/g, "/")}`;
};

const formatDuration = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "string" && value.includes(":")) return value;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? formatTime(n) : "";
};

const formatViews = (num) => {
  const n = Number(num) || 0;
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${n} views`;
};

const formatUploadTime = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

export function MovieCard({
  item,
  onClick,
  onAddToWatchLater,
  onRemoveFromWatchLater,
  progress,
}) {
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPreviewing, setPreviewing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const timelineFillRef = useRef(null);
  const hoveredRef = useRef(false);
  const isMutedRef = useRef(true);

  const updateTimeline = () => {
    const video = videoRef.current;
    const fill = timelineFillRef.current;
    if (!video || !fill) return;
    const duration = video.duration || 0;
    const pct = duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
    fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };

  const stopPreview = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setPreviewing(false);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      if (activePreviewVideo === video) activePreviewVideo = null;
    }
  };

  const startPreview = () => {
    if (!supportsHover || !item.videoUrl) return;
    if (videoRef.current && activePreviewVideo === videoRef.current) return;
    stopActivePreview();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      hoverTimerRef.current = null;
      setPreviewing(true);
    }, 300);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (isPreviewing && video && item.videoUrl) {
      stopActivePreview();
      activePreviewVideo = video;
      video.muted = isMutedRef.current;
      video.currentTime = 0;
      if (timelineFillRef.current) timelineFillRef.current.style.width = "0%";
      video.play().catch(() => {});
    }
  }, [isPreviewing, item.videoUrl]);

  useEffect(() => {
    if (!isPreviewing) return;
    let rafId;
    const tick = () => {
      updateTimeline();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPreviewing]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
        if (activePreviewVideo === video) activePreviewVideo = null;
      }
    };
  }, []);

  const handleMuteClick = (e) => {
    e.stopPropagation();
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    const video = videoRef.current;
    if (video) video.muted = next;
  };

  const handleWatchLaterClick = async (e) => {
    e.stopPropagation(); // video open na ho
    if (adding) return;
    setAdding(true);

    const prev = saved;
    if (!saved) {
      setSaved(true); // optimistic
      const res = onAddToWatchLater
        ? await onAddToWatchLater(item)
        : { success: false };
      if (res && res.success === false) setSaved(prev);
    } else if (onRemoveFromWatchLater) {
      setSaved(false); // optimistic
      const res = await onRemoveFromWatchLater(item);
      if (res && res.success === false) setSaved(prev);
    }

    setAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(item);
    } else if (e.key === "Escape") {
      stopPreview();
    }
  };

  const channel =
    item.channel && typeof item.channel === "object" ? item.channel : null;
  const uploadedBy =
    item.uploadedBy && typeof item.uploadedBy === "object"
      ? item.uploadedBy
      : null;
  const creator =
    item.creator && typeof item.creator === "object" ? item.creator : null;

  const channelName =
    channel?.name ||
    uploadedBy?.name ||
    creator?.name ||
    item.channelName ||
    "Unknown Channel";

  const channelAvatar = resolveImage(
    channel?.avatar ||
      channel?.profileImage ||
      channel?.channelImage ||
      uploadedBy?.avatar ||
      uploadedBy?.profileImage ||
      "",
  );
  const isVerified = Boolean(
    channel?.isVerified || channel?.verified || uploadedBy?.isVerified,
  );

  const durationText = formatDuration(item.duration);
  const viewsText = formatViews(item.views);
  const uploadText = formatUploadTime(item.uploadDate);
  const watchedPercent =
    progress != null && progress > 0 ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <div
      onClick={() => onClick(item)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        hoveredRef.current = true;
        startPreview();
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
        stopPreview();
      }}
      onFocus={startPreview}
      onBlur={() => {
        if (!hoveredRef.current) stopPreview();
      }}
      role="button"
      tabIndex={0}
      className="card-hover group w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 transition-transform duration-200 group-hover:scale-[1.01]">
        <img
          src={item.thumb}
          alt={item.title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://via.placeholder.com/640x360?text=No+Thumbnail";
          }}
          className="h-full w-full object-cover transition-all duration-200 group-hover:brightness-[1.02]"
        />

        {item.videoUrl && (
          <video
            ref={videoRef}
            src={item.videoUrl}
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            onTimeUpdate={updateTimeline}
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isPreviewing ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Progress strip: live preview progress on hover, watched progress otherwise */}
        {(isPreviewing || watchedPercent > 0) && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
            <div
              ref={timelineFillRef}
              className="h-full bg-red-600"
              style={{ width: isPreviewing ? "0%" : `${watchedPercent}%` }}
            />
          </div>
        )}

        {/* Duration badge */}
        {durationText && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {durationText}
          </span>
        )}

        {/* Mute / unmute button (top-right, visible on hover) */}
        <button
          onClick={handleMuteClick}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-lg transition-all duration-300 hover:bg-black/60 group-focus-within:opacity-100 group-hover:opacity-100 md:h-9 md:w-9"
          title={isMuted ? "Unmute" : "Mute"}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX size={16} className="h-4 w-4" />
          ) : (
            <Volume2 size={16} className="h-4 w-4" />
          )}
        </button>

        {/* Overlay controls: Play + Watch Later (bottom-left) */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 opacity-0 transition-all duration-300 focus-within:opacity-100 group-hover:scale-105 group-hover:opacity-100">
          <div className="pointer-events-none flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white md:h-10 md:w-10">
            <Play
              size={20}
              fill="white"
              className="ml-0.5 h-4 w-4 md:h-5 md:w-5"
            />
          </div>

          {onAddToWatchLater && (
            <button
              onClick={handleWatchLaterClick}
              disabled={adding}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-black/60 disabled:opacity-40 md:h-10 md:w-10"
              title={saved ? "Remove from Watch Later" : "Add to Watch Later"}
              aria-label={
                saved ? "Remove from Watch Later" : "Add to Watch Later"
              }
            >
              {saved ? (
                <Check size={20} className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Plus size={20} className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 flex items-start gap-3">
        {/* Channel avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800">
          {channelAvatar ? (
            <img
              src={channelAvatar}
              alt={channelName}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-white">
              {channelName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Text area */}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">
            {item.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-neutral-400 line-clamp-1">
            {channelName}
            {isVerified && <BadgeCheck size={13} className="shrink-0" />}
          </p>
          <p className="text-[13px] text-neutral-400 line-clamp-1">
            {viewsText}
            {uploadText && <span> • {uploadText}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NetflixStylePage() {
  const navigate = useNavigate();
  const isMobile = useWidth() < 768;
  const dispatch = useDispatch();
  const {
    recommended,
    trending,
    latest,
    subscriptions,
    shorts,
    loading,
    selectedCategory,
    homePage,
    homeHasMore,
  } = useSelector((state) => state.videos);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    dispatch(fetchHomeVideos({ category: selectedCategory, page: 1 }));
  }, [dispatch, selectedCategory]);

  useEffect(() => {
    const loadMore = loadMoreRef.current;
    if (!loadMore || !homeHasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          dispatch(
            fetchHomeVideos({
              category: selectedCategory,
              page: homePage + 1,
            }),
          );
        }
      },
      { rootMargin: "500px 0px" },
    );

    observer.observe(loadMore);
    return () => observer.disconnect();
  }, [dispatch, homeHasMore, homePage, loading, selectedCategory]);

  const isShortContent = (item) => {
    const rawTypes = item?.videoType ?? item?.raw?.videoType ?? [];
    const normalizedTypes = (Array.isArray(rawTypes) ? rawTypes : [rawTypes])
      .filter(Boolean)
      .map((type) => String(type).toLowerCase());

    return (
      Boolean(item?.isShort) ||
      normalizedTypes.some(
        (type) =>
          type === "short" || type === "shorts" || type.includes("short"),
      )
    );
  };

  const handleItemClick = (item) => {
    if (isShortContent(item)) {
      navigate(`/shorts/${item.id}`, { state: { video: item } });
      return;
    }

    navigate(`/video/${item.id}`, { state: { video: item } });
  };

  const goToViewAll = (type) => navigate(`/videos/${type}`);

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-show:hover::-webkit-scrollbar { display: block; height: 8px; }
        .scrollbar-show:hover::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .scrollbar-show:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
        .scrollbar-show:hover::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
      `}</style>

      <div className="mx-auto max-w-screen-2xl px-4 pt-20 md:px-12 lg:px-16 -mt-24 relative z-10 pb-10">
        {/* Recommended Videos */}
        <div className="mb-10 pt-8">
          <SectionHeader
            title="Recommended Videos"
            onClick={() => goToViewAll("recommended")}
          />
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show">
            {loading && recommended.length === 0 ? (
              <VideoCardSkeletonRow />
            ) : recommended.length > 0 ? (
              recommended.map((item) => (
                <div key={item.id} className="shrink-0 w-64 md:w-72">
                  <MovieCard
                    item={item}
                    onClick={handleItemClick}
                    onAddToWatchLater={addToWatchLater}
                    onRemoveFromWatchLater={removeFromWatchLater}
                    progress={70}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No recommended videos available right now.
              </p>
            )}
          </div>
        </div>

        {/* Trending Videos */}
        <div className="mb-10">
          <SectionHeader
            title="Trending Videos"
            onClick={() => goToViewAll("trending")}
          />
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show">
            {loading && trending.length === 0 ? (
              <VideoCardSkeletonRow />
            ) : trending.length > 0 ? (
              trending.map((item) => (
                <div key={item.id} className="shrink-0 w-64 md:w-72">
                  <MovieCard
                    item={item}
                    onClick={handleItemClick}
                    onAddToWatchLater={addToWatchLater}
                    onRemoveFromWatchLater={removeFromWatchLater}
                    progress={70}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No trending videos available right now.
              </p>
            )}
          </div>
        </div>

        {/* Trending Shorts */}
        <div className="mb-12">
          <SectionHeader
            title="Trending Shorts"
            onClick={() => goToViewAll("shorts")}
          />
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show snap-x snap-mandatory">
            {loading && shorts.length === 0 ? (
              <ShortsCardSkeletonRow />
            ) : shorts.length > 0 ? (
              shorts.map((item) => (
                <div
                  key={item.id}
                  className="shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 snap-start"
                >
                  <ShortCard item={item} onClick={handleItemClick} />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No trending shorts available right now.
              </p>
            )}
          </div>
        </div>

        {/* Latest Videos */}
        <div className="mb-10">
          <SectionHeader
            title="Latest Videos"
            onClick={() => goToViewAll("latest")}
          />
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show">
            {loading && latest.length === 0 ? (
              <VideoCardSkeletonRow />
            ) : latest.length > 0 ? (
              latest.map((item) => (
                <div key={item.id} className="shrink-0 w-64 md:w-72">
                  <MovieCard
                    item={item}
                    onClick={handleItemClick}
                    onAddToWatchLater={addToWatchLater}
                    onRemoveFromWatchLater={removeFromWatchLater}
                    progress={70}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No latest videos available right now.
              </p>
            )}
          </div>
        </div>

        {/* Subscription Videos */}
        <div className="mb-10">
          <SectionHeader
            title="Subscription Videos"
            onClick={() => goToViewAll("subscriptions")}
          />
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show">
            {loading && subscriptions.length === 0 ? (
              <VideoCardSkeletonRow />
            ) : subscriptions.length > 0 ? (
              subscriptions.map((item) => (
                <div key={item.id} className="shrink-0 w-64 md:w-72">
                  <MovieCard
                    item={item}
                    onClick={handleItemClick}
                    onAddToWatchLater={addToWatchLater}
                    onRemoveFromWatchLater={removeFromWatchLater}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                Subscribe to channels to see their videos here.
              </p>
            )}
          </div>
        </div>

        {/* Top Shorts */}
        <div className="mb-12">
          <SectionHeader
            title="Top Shorts"
            onClick={() => goToViewAll("top-shorts")}
          />
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show snap-x snap-mandatory">
            {loading && shorts.length === 0 ? (
              <ShortsCardSkeletonRow />
            ) : shorts.length > 0 ? (
              shorts.map((item) => (
                <div
                  key={item.id}
                  className="shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 snap-start"
                >
                  <ShortCard item={item} onClick={handleItemClick} />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No top shorts available right now.
              </p>
            )}
          </div>
        </div>

        <div
          ref={loadMoreRef}
          className="flex min-h-12 items-center justify-center"
        >
          {loading && homePage > 0 && (
            <p className="text-sm text-gray-400">Loading more videos...</p>
          )}
          {!loading && !homeHasMore && homePage > 0 && (
            <p className="text-sm text-gray-500">You&apos;re all caught up.</p>
          )}
        </div>
      </div>
    </div>
  );
}

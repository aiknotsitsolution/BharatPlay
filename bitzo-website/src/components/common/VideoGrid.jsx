import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Play,
  Plus,
} from "lucide-react";
import {
  fetchHomeVideos,
  fetchNextHomeSection,
} from "../../features/videos/videosSlice";
import {
  addToWatchLater,
  removeFromWatchLater,
} from "../../features/videos/watchLaterApi";
import { formatTime } from "../player/utils";
import ShortCard from "./ShortCard";
import { ShortsCardSkeletonRow, VideoCardSkeletonRow } from "./Skeletons";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";
import { promptLogin } from "../../utils/loginPrompt";

const FEED_AD_FREQUENCY_MS = 10 * 60 * 1000;
const FEED_AD_LAST_IMPRESSION_KEY = "vidbux:last-feed-ad-impression";

const hasRecentFeedAdImpression = () => {
  try {
    const lastImpression = Number(
      localStorage.getItem(FEED_AD_LAST_IMPRESSION_KEY),
    );
    return (
      Number.isFinite(lastImpression) &&
      lastImpression > 0 &&
      Date.now() - lastImpression < FEED_AD_FREQUENCY_MS
    );
  } catch {
    return false;
  }
};

const HOME_ROW_SIZE = 5;
const HOME_SECTIONS = [
  {
    buffer: "recommended",
    title: "Recommended for you",
    viewAll: "recommended",
    kind: "video",
    emptyText: "No recommended videos available right now.",
  },
  {
    buffer: "trending",
    title: "Trending Videos",
    viewAll: "trending",
    kind: "video",
    emptyText: "No trending videos available right now.",
  },
  {
    buffer: "shorts",
    title: "Trending Shorts",
    viewAll: "shorts",
    kind: "shorts",
    emptyText: "No trending shorts available right now.",
  },
  {
    buffer: "latest",
    title: "Latest Videos",
    viewAll: "latest",
    kind: "video",
    emptyText: "No latest videos available right now.",
  },
  {
    buffer: "subscriptions",
    title: "Subscription Videos",
    viewAll: "subscriptions",
    kind: "video",
    emptyText: "Subscribe to channels to see their videos here.",
  },
  {
    buffer: "shorts",
    title: "Top Shorts",
    viewAll: "top-shorts",
    kind: "shorts",
    emptyText: "No top shorts available right now.",
  },
];

// ────────────────────────────────────────────────
// Reusable components
// ────────────────────────────────────────────────

function SectionHeader({ title, onClick }) {
  return (
    <div className="mb-3 flex items-center">
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

        {watchedPercent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
            <div
              className="h-full bg-red-600"
              style={{ width: `${watchedPercent}%` }}
            />
          </div>
        )}

        {/* Duration badge */}
        {durationText && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {durationText}
          </span>
        )}

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

function FeedAdvertisementCard({ videoId }) {
  const [advertisement, setAdvertisement] = useState(null);
  const [nearViewport, setNearViewport] = useState(false);
  const impressionTracked = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearViewport) return undefined;
    let cancelled = false;
    const loadAdvertisement = async () => {
      try {
        if (hasRecentFeedAdImpression()) return;
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BACKEND_URL}/v1/player/manifest/${encodeURIComponent(videoId)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        if (!response.ok) {
          throw new Error(`Ad manifest request failed (${response.status})`);
        }
        const payload = await response.json();
        if (!payload.adAvailable || !payload.ad?.vastXml) return;

        const xml = new DOMParser().parseFromString(
          payload.ad.vastXml,
          "application/xml",
        );
        if (xml.querySelector("parsererror")) {
          throw new Error("The ad provider returned invalid VAST XML");
        }
        const mediaFile = Array.from(xml.querySelectorAll("MediaFile"))
          .map((node) => ({
            url: node.textContent.trim(),
            type: node.getAttribute("type") || "",
          }))
          .find(
            (media) =>
              media.url &&
              (media.type.startsWith("video/") ||
                /\.(mp4|webm)(?:[?#]|$)/i.test(media.url)),
          );
        if (!mediaFile) return;

        const clickThrough =
          xml.querySelector("ClickThrough")?.textContent.trim() || "";
        if (!cancelled) {
          impressionTracked.current = false;
          setAdvertisement({
            mediaUrl: mediaFile.url,
            networkId: payload.ad.networkId,
            networkName: payload.ad.networkName,
            clickThrough,
          });
        }
      } catch (error) {
        console.warn("Could not load feed advertisement:", error);
      }
    };

    loadAdvertisement();
    return () => {
      cancelled = true;
    };
  }, [nearViewport, videoId]);

  const trackEvent = (event) => {
    const token = localStorage.getItem("token");
    fetch(`${BACKEND_URL}/v1/player/ad-impression`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        videoId,
        networkId: advertisement.networkId,
        event,
      }),
    }).catch((error) => {
      console.warn(`Could not track ad ${event}:`, error);
    });
  };

  return (
    <div ref={containerRef} className="min-h-px">
      {advertisement ? (
        <section className="mx-auto mb-10 w-full max-w-screen-2xl px-4 md:px-12 lg:px-16">
          <div className="max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between px-4 py-2 text-xs text-zinc-400">
              <span>Sponsored</span>
              <span>{advertisement.networkName || "Advertisement"}</span>
            </div>
            <video
              src={advertisement.mediaUrl}
              controls
              playsInline
              preload="none"
              className="aspect-video w-full bg-black"
              onPlay={(event) => {
                if (!impressionTracked.current) {
                  if (hasRecentFeedAdImpression()) {
                    event.currentTarget.pause();
                    setAdvertisement(null);
                    return;
                  }
                  try {
                    localStorage.setItem(
                      FEED_AD_LAST_IMPRESSION_KEY,
                      String(Date.now()),
                    );
                  } catch (error) {
                    console.warn("Could not save ad frequency limit:", error);
                  }
                  impressionTracked.current = true;
                  trackEvent("impression");
                }
              }}
              onEnded={() => trackEvent("complete")}
            />
            {advertisement.clickThrough ? (
              <a
                href={advertisement.clickThrough}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm font-medium text-white hover:bg-zinc-900"
              >
                Visit advertiser
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function NetflixStylePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    recommended,
    trending,
    latest,
    subscriptions,
    shorts,
    loading,
    selectedCategory,
    sectionHasMore,
    sectionFetching,
  } = useSelector((state) => state.videos);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    dispatch(fetchHomeVideos({ category: selectedCategory, page: 1 }));
  }, [dispatch, selectedCategory]);

  const anyHomeHasMore = Object.values(sectionHasMore).some(Boolean);
  const anySectionFetching = Object.values(sectionFetching).some(Boolean);

  useEffect(() => {
    const loadMore = loadMoreRef.current;
    if (!loadMore || !anyHomeHasMore || anySectionFetching || loading)
      return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Grow the feed by one loop: pull the next page of every section
          // that still has videos left.
          Object.keys(sectionHasMore).forEach((section) => {
            if (sectionHasMore[section]) {
              dispatch(fetchNextHomeSection({ section }));
            }
          });
        }
      },
      { rootMargin: "500px 0px" },
    );

    observer.observe(loadMore);
    return () => observer.disconnect();
  }, [dispatch, sectionHasMore, anyHomeHasMore, anySectionFetching, loading]);

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
  const handleAddToWatchLater = (item) => {
    if (promptLogin(navigate, location)) return { success: false };
    return addToWatchLater(item);
  };
  const handleRemoveFromWatchLater = (item) => {
    if (promptLogin(navigate, location)) return { success: false };
    return removeFromWatchLater(item);
  };

  // The home feed repeats the same six sections as single horizontal rows.
  // Every section walks its own list: row 1 gets its first 5 videos, row 2
  // the next 5, and so on — so a section never repeats its own videos.
  // (Trending Shorts and Top Shorts share the shorts list, taking their
  // batches one after another.) A row pulls the next page of its section
  // whenever it needs more videos.
  const buffers = useMemo(
    () => ({ recommended, trending, latest, subscriptions, shorts }),
    [recommended, trending, latest, subscriptions, shorts],
  );

  const { homeRows, topUpSections } = useMemo(() => {
    const ptr = { recommended: 0, trending: 0, latest: 0, subscriptions: 0, shorts: 0 };
    const titleCounts = {};
    const counters = {};
    const rows = [];
    let growing = true;

    while (growing) {
      growing = false;
      const isFirstPass = rows.length === 0;
      HOME_SECTIONS.forEach((section) => {
        const list = buffers[section.buffer];
        const items = [];
        while (
          ptr[section.buffer] < list.length &&
          items.length < HOME_ROW_SIZE
        ) {
          // Each row takes the section's next videos in order — a video can
          // never land in two rows of the same section.
          items.push(list[ptr[section.buffer]]);
          ptr[section.buffer] += 1;
        }

        // The first pass always emits a row (skeleton/empty message while the
        // section is still loading); later loops only emit non-empty rows.
        if (items.length === 0 && !isFirstPass) return;

        const bufferCount = counters[section.buffer] || 0;
        counters[section.buffer] = bufferCount + 1;
        // Recommended rows get friendly naming: the first row greets, every
        // repeat row asks for more.
        const title =
          section.buffer === "recommended"
            ? bufferCount === 0
              ? "Recommended for you"
              : "More Recommended Videos"
            : section.title;
        const count = titleCounts[title] || 0;
        titleCounts[title] = count + 1;
        rows.push({
          key: `${title}-${count}`,
          buffer: section.buffer,
          title,
          viewAll: section.viewAll,
          kind: section.kind,
          emptyText: section.emptyText,
          items,
        });
        if (items.length > 0) growing = true;
      });
    }

    const lastRowLen = {};
    rows.forEach((row) => {
      if (row.items.length > 0) lastRowLen[row.buffer] = row.items.length;
    });
    const topUpSections = Object.keys(buffers).filter((buffer) => {
      if (!sectionHasMore[buffer] || sectionFetching[buffer]) return false;
      const lastLen = lastRowLen[buffer];
      return lastLen === undefined || lastLen < HOME_ROW_SIZE;
    });

    return { homeRows: rows, topUpSections };
  }, [
    buffers,
    sectionHasMore,
    sectionFetching,
  ]);

  useEffect(() => {
    if (loading) return;
    // Fill any incomplete row (or start its first row) with the next page.
    topUpSections.forEach((section) => {
      dispatch(fetchNextHomeSection({ section }));
    });
  }, [dispatch, loading, topUpSections]);

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
        {homeRows.map((row, index) => (
          <div key={row.key}>
            <section
              className={`${row.kind === "shorts" ? "mb-12" : "mb-10"}${
                index === 0 ? " pt-8" : ""
              }`}
            >
              <SectionHeader
                title={row.title}
                onClick={() => goToViewAll(row.viewAll)}
              />
              <div
                className={
                  row.kind === "shorts"
                    ? "flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show snap-x snap-mandatory"
                    : "flex gap-4 overflow-x-auto pb-3 scrollbar-hide hover:scrollbar-show"
                }
              >
                {row.items.length > 0 ? (
                  row.items.map((item) =>
                    row.kind === "shorts" ||
                    (row.buffer === "subscriptions" && isShortContent(item)) ? (
                      <div
                        key={item.id}
                        className="shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 snap-start"
                      >
                        <ShortCard item={item} onClick={handleItemClick} />
                      </div>
                    ) : (
                      <div key={item.id} className="shrink-0 w-64 md:w-72">
                        <MovieCard
                          item={item}
                          onClick={handleItemClick}
                          onAddToWatchLater={handleAddToWatchLater}
                          onRemoveFromWatchLater={handleRemoveFromWatchLater}
                          progress={70}
                        />
                      </div>
                    ),
                  )
                ) : (
                  <div className="w-full">
                    {loading ? (
                      row.kind === "shorts" ? (
                        <ShortsCardSkeletonRow />
                      ) : (
                        <VideoCardSkeletonRow />
                      )
                    ) : (
                      <p className="text-sm text-gray-400">{row.emptyText}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
            {index > 0 && index % 3 === 2 && row.items.length > 0 ? (
              <FeedAdvertisementCard videoId={`home-feed-${row.key}`} />
            ) : null}
          </div>
        ))}


        <div
          ref={loadMoreRef}
          className="flex min-h-12 items-center justify-center"
        >
          {anySectionFetching && (
            <p className="text-sm text-gray-400">Loading more videos...</p>
          )}
          {!loading && !anySectionFetching && !anyHomeHasMore && (
            <p className="text-sm text-gray-500">You&apos;re all caught up.</p>
          )}
        </div>
      </div>
    </div>
  );
}

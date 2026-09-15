import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfileData } from "../features/profile/profileSlice";
import { fetchHomeVideos } from "../features/videos/videosSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSwipeable } from "react-swipeable"; // ← install: npm install react-swipeable
import { getWatchSession, flushAllSessions } from "../utils/watchSession";
import ShortVideo from "../components/shorts/ShortVideo";
import ShortOverlay from "../components/shorts/ShortOverlay";
import ActionRail from "../components/shorts/ActionRail";
import BottomInfo from "../components/shorts/BottomInfo";
import CommentsSheet from "../components/shorts/CommentsSheet";
import SwipeHint from "../components/shorts/SwipeHint";
import { API_ORIGIN as BACKEND_URL } from "../config/api";

const API_BASE = `${BACKEND_URL}/api/uservideo`;

const toMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value.replace(/\\/g, "/");
  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("/uploads/")) return `${BACKEND_URL}${normalized}`;
  if (normalized.startsWith("uploads/")) return `${BACKEND_URL}/${normalized}`;
  return `${BACKEND_URL}/${normalized.replace(/^\/+/, "")}`;
};

function resolveCommenter(profileUser) {
  let local = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) local = JSON.parse(raw);
  } catch {
    local = null;
  }
  const localName = local?.name || local?.username || local?.fullName || "";
  const localAvatar =
    local?.avatar ||
    local?.profileImage ||
    local?.channelImage ||
    local?.image ||
    "";
  return {
    name: profileUser?.name || localName,
    avatar: profileUser?.avatar || localAvatar,
  };
}

const normalizeShort = (v) => ({
  id: v._id || v.id,
  title: v.title || "Untitled Short",
  videoUrl: toMediaUrl(v.videoUrl),
  views: Number(v.views) || 0,
  likes: Number(v.likesCount ?? v.likes) || 0,
  comments: Array.isArray(v.comments)
    ? v.comments.length
    : Number(v.comments) || 0,
  isLiked: v.userReaction === "like" || v.isLiked === true,
  reaction: v.userReaction || v.reaction || null,
  thumbnail: toMediaUrl(v.thumbnail || v.thumb || ""),
  raw: v.raw || v,
});

const formatViews = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M views`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${v} views`;
};

const formatCount = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${v}`;
};

export default function Shorts() {
  const { id: urlId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stateShort = location.state?.video || null;
  const { shorts: reduxShorts, loading } = useSelector((state) => state.videos);
  const profileUser = useSelector((state) => state.profile?.user || null);
  const commenter = resolveCommenter(profileUser);

  // Ensure the profile (which carries the real avatar) is loaded so comment
  // avatars show even if the user never visited their profile this session.
  useEffect(() => {
    if (!profileUser) {
      dispatch(fetchProfileData());
    }
  }, [dispatch, profileUser]);
  const [fetchedShort, setFetchedShort] = useState(null);
  const [urlShortLoading, setUrlShortLoading] = useState(false);

  // URL id is the source of truth. Prefer location.state (optimization),
  // then Redux, then the by-id fetch result.
  const primaryShort = useMemo(() => {
    if (!urlId) return stateShort;

    if (stateShort && String(stateShort.id || stateShort._id) === urlId) {
      return stateShort;
    }

    const inRedux = (reduxShorts || []).find(
      (short) => String(short.id || short._id) === urlId,
    );
    if (inRedux) return inRedux;

    return fetchedShort;
  }, [urlId, stateShort, reduxShorts, fetchedShort]);

  const [shorts, setShorts] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState({});
  const [pendingLike, setPendingLike] = useState({});
  const [commentOpenForId, setCommentOpenForId] = useState(null);
  const [commentsById, setCommentsById] = useState({});
  const [commentTextById, setCommentTextById] = useState({});
  const [commentLoading, setCommentLoading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [playerBox, setPlayerBox] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const playerAreaRef = useRef(null);
  const rootRef = useRef(null);
  const videoRefs = useRef([]);
  const reportedPercentRef = useRef({});
  const isProgrammaticScrollRef = useRef(false);
  const pendingInitialScrollRef = useRef(null);
  const lastSyncedUrlIdRef = useRef(null);
  const currentIndexRef = useRef(0);
  const lastActiveIndexRef = useRef(-1);
  const playAttemptsRef = useRef({});
  const pendingReadyRetriesRef = useRef({});
  const commentsOpenRef = useRef(false);
  const wasPlayingBeforeCommentsRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keep keyboard focus on the player so Space / M / Escape work.
  useEffect(() => {
    const node = rootRef.current;
    if (node && document.activeElement !== node) {
      node.focus({ preventScroll: true });
    }
  }, []);

  const setVideoRef = (el, index) => {
    if (el) {
      videoRefs.current[index] = el;
    } else {
      delete videoRefs.current[index];
      // Persist any untracked unique-seconds for the departing video.
      flushAllSessions(false);
    }
  };

  const togglePlayCurrent = () => {
    if (commentsOpenRef.current) return;
    const video = videoRefs.current[currentIndexRef.current];
    if (!video) return;
    if (video.paused) {
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    } else {
      video.pause();
    }
  };

  const getChannelId = (short) => {
    const channel = short?.raw?.channel;
    return typeof channel === "string"
      ? channel
      : channel?._id || channel?.id || null;
  };

  const handleSubscribe = async (short) => {
    const channelId = getChannelId(short);
    const token = localStorage.getItem("token");
    if (!channelId || !token) return;
    try {
      const response = await fetch(`${API_BASE}/subscribe/${channelId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Subscribed");
      } else {
        toast.error(data.message || "Failed to subscribe");
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Something went wrong");
    }
  };

  const handleKeyDown = (e) => {
    const target = e.target;
    const isEditable =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable);

    if (e.key === "Escape") {
      if (commentOpenForId) setCommentOpenForId(null);
      return;
    }
    if (
      isEditable ||
      (target instanceof HTMLElement && target.tagName === "BUTTON")
    ) {
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      togglePlayCurrent();
    } else if (e.key === "m" || e.key === "M") {
      setMuted((m) => !m);
    }
  };

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const trackShortProgress = async (short, videoEl) => {
    if (!short?.id || !videoEl) return;

    getWatchSession(videoEl, { id: short.id, videoType: "short" })?.tick();

    const duration = Number(videoEl.duration);
    if (!duration || !Number.isFinite(duration) || duration <= 0) return;

    const percent = Math.min(
      100,
      Math.round((videoEl.currentTime / duration) * 100),
    );
    if (percent < 25) return;

    const reported = reportedPercentRef.current[short.id] || 0;
    if (reported >= 80 || percent <= reported) return;

    const isHistoryCheckpoint = reported < 25 && percent >= 25;
    const isViewCheckpoint = percent >= 80;
    if (!isHistoryCheckpoint && !isViewCheckpoint) return;

    reportedPercentRef.current[short.id] = percent;

    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    const userId = parsedUser?._id || parsedUser?.id || null;

    try {
      const response = await fetch(`${API_BASE}/${short.id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ watchedPercent: percent, userId }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.success && typeof data.views === "number") {
        setShorts((prev) =>
          prev.map((s) =>
            s.id === short.id ? { ...s, views: data.views } : s,
          ),
        );
      }
    } catch (error) {
      console.error("Error tracking short view:", error);
      if (reportedPercentRef.current[short.id] === percent) {
        delete reportedPercentRef.current[short.id];
      }
    }
  };

  // ─── Load real shorts from backend ───
  useEffect(() => {
    dispatch(fetchHomeVideos());
  }, [dispatch]);

  // ─── Resolve the URL short by id when not already in state/Redux ───
  useEffect(() => {
    if (!urlId) return;

    const alreadyKnown =
      (stateShort && String(stateShort.id || stateShort._id) === urlId) ||
      (reduxShorts || []).some(
        (short) => String(short.id || short._id) === urlId,
      );
    if (alreadyKnown) {
      setUrlShortLoading(false);
      return;
    }

    let cancelled = false;
    const token = localStorage.getItem("token");

    setUrlShortLoading(true);
    setFetchedShort(null);

    fetch(`${API_BASE}/${urlId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.video) {
          setFetchedShort(data.video);
        }
        setUrlShortLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUrlShortLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlId, stateShort, reduxShorts]);

  useEffect(() => {
    let cancelled = false;

    if (urlShortLoading) {
      return;
    }

    if (urlId && lastSyncedUrlIdRef.current === urlId) {
      return;
    }

    const list = (reduxShorts || [])
      .map(normalizeShort)
      .filter((short) => short.videoUrl);

    if (!list.length && !primaryShort) {
      setLoadingState(false);
      return;
    }

    let queue = list;
    let startIndex = 0;

    if (primaryShort) {
      const primaryId = String(primaryShort.id || primaryShort._id);
      const existingIdx = list.findIndex(
        (short) => String(short.id) === primaryId,
      );
      if (existingIdx >= 0) {
        startIndex = existingIdx;
      } else {
        const clicked = normalizeShort(primaryShort);
        queue = [
          clicked,
          ...list.filter((short) => String(short.id) !== primaryId),
        ];
        startIndex = 0;
      }
    }

    if (queue.length === 0 && primaryShort) {
      const clicked = normalizeShort(primaryShort);
      if (clicked.videoUrl) {
        queue = [clicked];
        startIndex = 0;
      }
    }

    const likedMap = Object.fromEntries(
      queue.map((short) => [short.id, Boolean(short.isLiked)]),
    );

    if (!cancelled) {
      setShorts(queue);
      setLiked(likedMap);
      setCurrentIndex(startIndex);
      setLoadingState(false);

      if (startIndex > 0) {
        pendingInitialScrollRef.current = startIndex;
      }
    }

    return () => {
      cancelled = true;
    };
  }, [reduxShorts, primaryShort, urlShortLoading, urlId]);

  useEffect(() => {
    const activeShort = shorts[currentIndex];
    const activeId = activeShort?.id;
    if (!activeId || String(activeId) === urlId) return;
    lastSyncedUrlIdRef.current = String(activeId);
    navigate(`/shorts/${activeId}`, { replace: true });
  }, [currentIndex, shorts, urlId, navigate]);

  // ─── Sync scroll container to the deep-linked short ───
  useLayoutEffect(() => {
    const index = pendingInitialScrollRef.current;
    if (index == null || !containerRef.current) return;

    pendingInitialScrollRef.current = null;
    isProgrammaticScrollRef.current = true;
    containerRef.current.scrollTop = index * containerRef.current.clientHeight;
  }, [shorts]);

  // ─── Size the 9:16 player to fit inside the layout column ───
  useLayoutEffect(() => {
    const measure = () => {
      const el = playerAreaRef.current;
      if (!el) return;
      const cw = el.clientWidth || 0;
      const ch = el.clientHeight || 0;
      if (!cw || !ch) return;
      let h = ch;
      let w = h * (9 / 16);
      if (w > cw) {
        w = cw;
        h = w * (16 / 9);
      }
      setPlayerBox({
        width: Math.max(1, Math.floor(w)),
        height: Math.max(1, Math.floor(h)),
      });
    };

    measure();

    const ro =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => measure())
        : null;
    if (ro && playerAreaRef.current) ro.observe(playerAreaRef.current);
    window.addEventListener("resize", measure);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // ─── Change video with bounds check ───
  const goToVideo = (newIndex) => {
    if (commentsOpenRef.current) return;
    if (newIndex < 0 || newIndex >= shorts.length) return;
    setCurrentIndex(newIndex);

    // Optional: smooth scroll to make vertical feel natural too
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: newIndex * containerRef.current.clientHeight,
        behavior: "smooth",
      });
    }
  };

  // ─── Swipe left = next ─── swipe right = previous ───
  const handlers = useSwipeable({
    onSwipedLeft: () => goToVideo(currentIndex + 1),
    onSwipedRight: () => goToVideo(currentIndex - 1),
    trackMouse: true, // for desktop testing (optional)
    delta: 60, // how many px needed to count as swipe
    preventScrollOnSwipe: true, // prevents vertical scroll conflict
    swipeDuration: 400,
  });

  const attemptPlay = useCallback(
    (index, video) => {
      if (!video || !mountedRef.current) return;
      if (index !== currentIndexRef.current) return;
      if (commentsOpenRef.current) return;

      const short = shorts[index];
      if (!short) return;
      const key = short.id;

      const tryPlay = () => {
        const promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {
            if (!mountedRef.current) return;
            const attempts = (playAttemptsRef.current[key] || 0) + 1;
            playAttemptsRef.current[key] = attempts;
            if (attempts < 4) {
              window.setTimeout(() => attemptPlay(index, video), 400);
            } else {
              console.error(
                `Shorts: autoplay failed for "${short.title || key}" after 4 attempts`,
              );
            }
          });
        }
      };

      if (video.readyState >= 2) {
        tryPlay();
      } else if (!pendingReadyRetriesRef.current[index]) {
        pendingReadyRetriesRef.current[index] = true;
        window.setTimeout(() => {
          pendingReadyRetriesRef.current[index] = false;
          if (
            mountedRef.current &&
            index === currentIndexRef.current &&
            video.readyState >= 2
          ) {
            attemptPlay(index, video);
          }
        }, 600);
      }
    },
    [shorts],
  );

  const handleVideoReady = (index, video) => {
    if (index === currentIndexRef.current && video.readyState >= 2) {
      attemptPlay(index, video);
    }
  };

  // Play only current video
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;

      if (i === currentIndex) {
        video.muted = muted;
        if (lastActiveIndexRef.current !== i) {
          lastActiveIndexRef.current = i;
          const key = shorts[i]?.id;
          if (key) playAttemptsRef.current[key] = 0;
          video.currentTime = 0;
        }
        attemptPlay(i, video);
      } else {
        video.pause();
      }
    });
  }, [currentIndex, muted, shorts, attemptPlay]);

  // Update current index when user scrolls vertically
  const handleScroll = () => {
    if (!containerRef.current) return;
    if (commentsOpenRef.current) return;
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight || window.innerHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const toggleLike = async (short) => {
    const token = localStorage.getItem("token");
    if (!token || !short.id || pendingLike[short.id]) return;

    const wasLiked = Boolean(liked[short.id]);
    const nextLiked = !wasLiked;

    setPendingLike((prev) => ({ ...prev, [short.id]: true }));
    setLiked((prev) => ({ ...prev, [short.id]: nextLiked }));

    try {
      const response = await fetch(`${API_BASE}/${short.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && typeof data.likes === "number") {
        setShorts((prev) =>
          prev.map((s) =>
            s.id === short.id
              ? {
                  ...s,
                  likes: data.likes,
                  isLiked: data.liked === true,
                  reaction: data.reaction || null,
                }
              : s,
          ),
        );
      } else {
        setLiked((prev) => ({ ...prev, [short.id]: wasLiked }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      setLiked((prev) => ({ ...prev, [short.id]: wasLiked }));
    } finally {
      setPendingLike((prev) => ({ ...prev, [short.id]: false }));
    }
  };

  const fetchComments = async (short) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/${short.id}/comments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setCommentsById((prev) => ({
          ...prev,
          [short.id]: Array.isArray(data.comments) ? data.comments : [],
        }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCommentOpen = async (short) => {
    if (commentOpenForId === short.id) {
      setCommentOpenForId(null);
      return;
    }

    setCommentOpenForId(short.id);
    if (!commentsById[short.id]) {
      await fetchComments(short);
    }
  };

  const handleCommentSubmit = async (e, short) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const text = (commentTextById[short.id] || "").trim();

    if (!text || !token) return;

    setCommentLoading(true);

    try {
      const response = await fetch(`${API_BASE}/${short.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          commentText: text,
          userName: commenter?.name || "",
          userImage: commenter?.avatar || "",
        }),
      });
      const data = await response.json();

      if (data.success) {
        const newComment = data.comment || {
          _id: Date.now().toString(),
          text,
          createdAt: new Date().toISOString(),
          userName: commenter?.name || "You",
          userImage: commenter?.avatar || "",
        };

        setCommentsById((prev) => ({
          ...prev,
          [short.id]: [newComment, ...(prev[short.id] || [])],
        }));
        setCommentTextById((prev) => ({ ...prev, [short.id]: "" }));
        setShorts((prev) =>
          prev.map((s) =>
            s.id === short.id
              ? { ...s, comments: (Number(s.comments) || 0) + 1 }
              : s,
          ),
        );
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = async (short) => {
    if (!short?.id) return;
    const shareUrl = `${window.location.origin}/shorts/${short.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: short.title || "Bharat Play Short",
          text: short.title
            ? `${short.title} - Watch on Bharat Play`
            : "Watch on Bharat Play",
          url: shareUrl,
        });
        return;
      }
    } catch (error) {
      if (!error || error.name !== "AbortError") {
        console.warn(
          "Shorts: Web Share API unavailable, falling back to clipboard",
        );
      }
    }

    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      toast.success("Link copied to clipboard");
    } else {
      toast.error("Could not copy the link");
    }
  };

  useEffect(() => {
    const wasOpen = Boolean(commentOpenForId);
    commentsOpenRef.current = wasOpen;
    const video = videoRefs.current[currentIndexRef.current];
    if (!video) return;

    if (wasOpen) {
      wasPlayingBeforeCommentsRef.current = !video.paused;
      video.pause();
    } else if (wasPlayingBeforeCommentsRef.current) {
      wasPlayingBeforeCommentsRef.current = false;
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {
          console.error(
            "Shorts: failed to resume playback after closing comments",
          );
        });
      }
    }
  }, [commentOpenForId]);

  // Swipe hint (appears briefly after settling on a video)
  useEffect(() => {
    setShowSwipeHint(false);
    const show = setTimeout(() => setShowSwipeHint(true), 10000);
    return () => clearTimeout(show);
  }, [currentIndex]);

  useEffect(() => {
    if (!showSwipeHint) return;
    const hide = setTimeout(() => setShowSwipeHint(false), 3200);
    return () => clearTimeout(hide);
  }, [showSwipeHint]);

  // Virtualization window: only mount previous / current / next.
  const renderStart = Math.max(0, currentIndex - 1);
  const renderEnd = Math.min(shorts.length - 1, currentIndex + 1);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      aria-label="Shorts player"
      className="flex h-[calc(100dvh-7.5rem)] w-full touch-none outline-none md:h-[calc(100dvh-3.5rem)]"
      onKeyDown={handleKeyDown}
      {...handlers} // ← swipe gestures work on the player area
    >
      <div className="mx-auto flex h-full w-full max-w-[1200px]">
        {/* Player column – the Shorts player lives INSIDE the app layout */}
        <div ref={playerAreaRef} className="relative h-full min-w-0 flex-1">
          {/* Ambient glow behind the player (desktop) */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 hidden h-[85%] w-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl md:block"
            aria-hidden="true"
          />

          {/* 9:16 player sized to fit the column (largest size that preserves ratio) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: playerBox.width || undefined,
              height: playerBox.height || undefined,
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10">
              {/* Main scroll container – vertical snap */}
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="
                  relative z-10
                  h-full w-full
                  overflow-y-scroll
                  snap-y snap-mandatory
                  overscroll-contain
                  touch-pan-y
                  scrollbar-hide
                "
              >
                {loading || loadingState ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <p className="text-white/70 text-sm">Loading shorts...</p>
                  </div>
                ) : shorts.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <p className="text-white/70 text-sm">
                      No shorts available yet.
                    </p>
                  </div>
                ) : (
                  shorts.map((short, index) => {
                    const active = index === currentIndex;
                    const inWindow = index >= renderStart && index <= renderEnd;
                    return (
                      <div
                        key={short.id}
                        className="relative h-full w-full snap-start snap-always bg-black"
                      >
                        {inWindow && (
                          <>
                            <ShortVideo
                              index={index}
                              src={short.videoUrl}
                              poster={short.thumbnail}
                              title={short.title}
                              muted={muted}
                              preload={active ? "auto" : "metadata"}
                              disabled={Boolean(commentOpenForId)}
                              onRegister={setVideoRef}
                              onReady={handleVideoReady}
                              onMetadata={(el) => trackShortProgress(short, el)}
                              onTimeUpdate={(el) =>
                                trackShortProgress(short, el)
                              }
                              onTogglePlay={togglePlayCurrent}
                              onLike={() => toggleLike(short)}
                            />

                            <ShortOverlay />

                            <ActionRail
                              liked={Boolean(liked[short.id])}
                              likeLabel={formatCount(short.likes)}
                              commentLabel={formatCount(short.comments)}
                              pending={Boolean(pendingLike[short.id])}
                              onLike={() => toggleLike(short)}
                              onComment={() => handleCommentOpen(short)}
                              onShare={() => handleShare(short)}
                              muted={muted}
                              onToggleMute={() => setMuted((m) => !m)}
                            />

                            <BottomInfo
                              short={short}
                              formattedViews={formatViews(short.views)}
                              onSubscribe={
                                getChannelId(short)
                                  ? () => handleSubscribe(short)
                                  : undefined
                              }
                            />

                            {commentOpenForId === short.id && (
                              <CommentsSheet
                                comments={commentsById[short.id] || []}
                                text={commentTextById[short.id] || ""}
                                loading={commentLoading}
                                commenterName={commenter.name}
                                commenterImage={commenter.avatar}
                                onTextChange={(value) =>
                                  setCommentTextById((prev) => ({
                                    ...prev,
                                    [short.id]: value,
                                  }))
                                }
                                onSubmit={(e) => handleCommentSubmit(e, short)}
                                onClose={() => setCommentOpenForId(null)}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {showSwipeHint ? <SwipeHint /> : null}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer limit={1} />
    </div>
  );
}

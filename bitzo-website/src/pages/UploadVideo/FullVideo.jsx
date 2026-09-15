import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfileData } from "../../features/profile/profileSlice";
import { getWatchSession } from "../../utils/watchSession";
import VideoPlayer from "../../components/player/VideoPlayer";
import {
  BadgeCheck,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Send,
  Shield,
  Share2,
  SkipForward,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { formatTimeAgo } from "../../utils/timeAgo";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

const API_BASE = `${BACKEND_URL}/api/uservideo`;

const AUTOPLAY_KEY = "videoo.autoplay";
const AUTOPLAY_COUNTDOWN_SECONDS = 5;

// Fake data (fallback only)
const VIDEO_POOL = [
  {
    video:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
  },
  {
    video: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    poster:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
  },
  {
    video:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    poster:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
  },
  {
    video:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    poster:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
  },
];

const UP_NEXT_VIDEOS = [
  {
    id: 2,
    title: "Sintel – Short Fantasy Film",
    channel: "Blender Foundation",
    views: "4.2M",
    time: "2 days ago",
  },
  {
    id: 3,
    title: "Elephants Dream – Surreal Animation",
    channel: "Blender Foundation",
    views: "1.8M",
    time: "1 week ago",
  },
  {
    id: 4,
    title: "Tears of Steel – Post-Apocalyptic CGI",
    channel: "Blender Foundation",
    views: "3.1M",
    time: "5 days ago",
  },
  {
    id: 5,
    title: "Big Buck Bunny – Funny Animation",
    channel: "Blender Foundation",
    views: "12M",
    time: "3 years ago",
  },
  {
    id: 6,
    title: "Cosmos – A Spacetime Odyssey (clip)",
    channel: "National Geographic",
    views: "8.7M",
    time: "1 month ago",
  },
];

function getVideoEntry(id) {
  const idx =
    (typeof id === "number" ? id : parseInt(id) || 1) % VIDEO_POOL.length;
  return VIDEO_POOL[idx];
}

function getChannelName(channel) {
  if (typeof channel === "string" && channel) return channel;
  if (
    channel &&
    typeof channel === "object" &&
    typeof channel.name === "string" &&
    channel.name
  ) {
    return channel.name;
  }
  return null;
}

function formatCount(value) {
  const n = Number(value) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${n}`;
}

function getCurrentUser(profileUser) {
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

function formatDuration(seconds) {
  const raw = Number(seconds);
  if (!Number.isFinite(raw) || raw <= 0) return "--:--";
  const total = Math.max(0, Math.floor(raw));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export default function YouTubeLikeVideoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const videoData = location.state?.video || {
    id: id || 1,
    title: "Big Buck Bunny",
    channel: "Blender Foundation",
  };

  // ==================== STATE ====================
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [reaction, setReaction] = useState(null); // "like" | "dislike" | null
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoDetails, setVideoDetails] = useState(null);
  const [stats, setStats] = useState({ likes: 0, dislikes: 0 });
  const [reactionLoading, setReactionLoading] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [autoplay, setAutoplay] = useState(() => {
    try {
      return localStorage.getItem(AUTOPLAY_KEY) !== "false";
    } catch {
      return true;
    }
  });
  const [upNextOverlay, setUpNextOverlay] = useState(null); // { video }
  const [countdownLeft, setCountdownLeft] = useState(null); // null => end screen
  const [upNextVideos, setUpNextVideos] = useState(UP_NEXT_VIDEOS);

  const playerRef = useRef(null);
  const viewTracked = useRef(false);
  const countdownTimerRef = useRef(null);
  const nextTargetRef = useRef(null);
  const autoplayNextRef = useRef(false);
  const playedVideoIdsRef = useRef(new Set());

  const descriptionRef = useRef(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descFullHeight, setDescFullHeight] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const profileUser = useSelector((state) => state.profile?.user || null);
  const currentUser = getCurrentUser(profileUser);

  const dispatch = useDispatch();

  // Ensure the profile (which carries the real avatar) is loaded so comment
  // avatars show even if the user never visited their profile this session.
  useEffect(() => {
    if (!profileUser) {
      dispatch(fetchProfileData());
    }
  }, [dispatch, profileUser]);

  // Clear the autoplay countdown from every exit path (Replay, Cancel,
  // manual navigation, unmount). Idempotent; safe to call repeatedly.
  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    nextTargetRef.current = null;
    setUpNextOverlay(null);
    setCountdownLeft(null);
  }, []);

  const entry = getVideoEntry(videoData.id);

  const resolveMediaUrl = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;

    const normalized = value.replace(/\\/g, "/");
    if (normalized.startsWith("uploads/")) {
      return `${BACKEND_URL}/${normalized}`;
    }
    if (normalized.includes("uploads/")) {
      return `${BACKEND_URL}/${normalized.split("uploads/").pop()}`;
    }
    if (normalized.startsWith("/uploads/")) {
      return `${BACKEND_URL}${normalized}`;
    }

    return `${BACKEND_URL}/${normalized}`;
  };

  const resolvedVideoUrl = videoDetails?.videoUrl
    ? resolveMediaUrl(videoDetails.videoUrl)
    : entry.video;
  const resolvedPoster = videoDetails?.thumbnail
    ? resolveMediaUrl(videoDetails.thumbnail)
    : entry.poster;

  // ==================== EFFECTS ====================

  // Bridge player events to the existing watch tracking. The session attaches
  // to the native <video> element, so watchSession.js keeps working unchanged.
  const handlePlayerReady = (videoEl) => {
    playerRef.current = videoEl;
    getWatchSession(videoEl, { id, videoType: "long" });
  };

  const handlePlayerDispose = (videoEl) => {
    if (playerRef.current === videoEl) playerRef.current = null;
    getWatchSession(videoEl, { id, videoType: "long" })?.destroy();
  };

  // Re-bind the watch session whenever the video changes. The <video> element
  // is never remounted during in-page navigation, so without this the session
  // stays closed over the previous id: its seconds would be lost (autoplay)
  // or mis-attributed (manual Play Next). getWatchSession destroys the old
  // session and creates a fresh one for the new id. Also reset the per-video
  // view guards so the next video's watch % and view can still be recorded
  // (the server dedupes counted views, so this can never double-increment).
  useEffect(() => {
    const el = playerRef.current;
    if (el) getWatchSession(el, { id, videoType: "long" });
    viewTracked.current = false;
    setViewCounted(false);
    // Reset playback metrics so the 80% view effect can't fire with stale
    // values from the previous video before the new one has loaded.
    setCurrentTime(0);
    setDuration(0);
    return () => cancelCountdown();
  }, [id, cancelCountdown]);

  // Persist the autoplay preference.
  useEffect(() => {
    try {
      localStorage.setItem(AUTOPLAY_KEY, String(autoplay));
    } catch {
      // ignore
    }
  }, [autoplay]);

  // Fetch video details + comments
  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (data.success && data.video) {
          const video = data.video;
          setVideoDetails(video);
          setStats({
            likes: video.likesCount || 0,
            dislikes: video.dislikesCount || 0,
          });
          // Backend se user reaction aana chahiye
          setReaction(video.userReaction || null); // "like" | "dislike" | null
          setIsSubscribed(Boolean(video.isSubscribed));
          setSubscribersCount(
            video.channel?.subscribersCount || video.subscribersCount || 0,
          );

          // Restore previously watched percentage (agar backend se aaye)
          const prevPercent = video.watchedPercent || 0;
          if (prevPercent >= 80) setViewCounted(true);
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
      }
    };

    const fetchComments = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/${id}/comments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (data.success) {
          setComments(Array.isArray(data.comments) ? data.comments : []);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchVideo();
    fetchComments();
  }, [id]);

  // Measure the full description height so the Show more/less animation can
  // animate max-height between the collapsed (3-line) and expanded states.
  useEffect(() => {
    const el = descriptionRef.current;
    if (el) setDescFullHeight(el.scrollHeight);
  }, [videoDetails?.description]);

  // Track every video played in this session so the "Up next" queue never
  // re-offers one (prevents A→B→A autoplay loops and duplicate cards).
  // The id is added in the cleanup, i.e. right after we navigate away from it.
  useEffect(() => {
    const played = playedVideoIdsRef.current;
    return () => {
      if (id) played.add(String(id));
    };
  }, [id]);

  // Fetch database-driven related videos for the "Up next" sidebar.
  // On any failure/empty response the hardcoded UP_NEXT_VIDEOS stays as fallback.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchRelated = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/${id}/related`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load related videos");
        }
        const related = Array.isArray(data.videos) ? data.videos : [];
        if (cancelled) return;
        if (related.length === 0) return;

        // The API only excludes the *current* video, so a just-watched video
        // can legitimately come back at the top of the next list — which made
        // autoplay bounce between two videos forever. Drop the current id and
        // every id played this session. Order stays exactly as the API
        // returned it; nothing is prepended or reordered.
        const currentId = String(id);
        const watched = playedVideoIdsRef.current;
        const filtered = related.filter((video) => {
          const vidId = String(video._id || video.id);
          return vidId !== currentId && !watched.has(vidId);
        });

        setUpNextVideos(
          filtered.slice(0, 12).map((video) => {
            const channel =
              typeof video.channel === "string"
                ? video.channel
                : video.channel?.name || "Channel";
            return {
              id: video._id || video.id,
              title: video.title || "Untitled video",
              channel,
              channelImage: video.channel?.channelImage || "",
              views: formatCount(video.views),
              time: formatTimeAgo(video.createdAt),
              duration: formatDuration(video.duration),
              thumbnail: video.thumbnail || "",
            };
          }),
        );
      } catch (error) {
        console.error("Error fetching related videos:", error);
      }
    };

    fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // View tracking (initial hit — registers a "view attempt", not a counted view)
  useEffect(() => {
    if (!id || viewTracked.current) return;

    viewTracked.current = true;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/${id}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        watchedPercent: 0,
        userId: localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user"))._id ||
            JSON.parse(localStorage.getItem("user")).id
          : null,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (data.success && typeof data.views === "number") {
          setVideoDetails((prev) =>
            prev ? { ...prev, views: data.views } : prev,
          );
        }
      })
      .catch(() => {});
  }, [id]);

  // Watch percentage tracking + view count when 80% watched
  useEffect(() => {
    if (!id || !duration) return;

    const percent = Math.min(100, Math.round((currentTime / duration) * 100));

    if (percent >= 80 && !viewCounted) {
      setViewCounted(true);
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const parsedUser = user ? JSON.parse(user) : null;

      fetch(`${API_BASE}/${id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          watchedPercent: percent,
          userId: parsedUser?._id || parsedUser?.id || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.views === "number") {
            setVideoDetails((prev) =>
              prev ? { ...prev, views: data.views } : prev,
            );
          }
        })
        .catch(() => {});
    }
  }, [currentTime, duration, id, viewCounted]);

  // ==================== LIKE / DISLIKE (Correct) ====================
  const handleReaction = async (type) => {
    if (!id || reactionLoading) return;

    setReactionLoading(true);
    const token = localStorage.getItem("token");
    const endpoint =
      type === "like" ? `${API_BASE}/${id}/like` : `${API_BASE}/${id}/dislike`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success) {
        // Backend se accurate counts + reaction aata hai
        setStats({
          likes: data.likes ?? 0,
          dislikes: data.dislikes ?? 0,
        });
        setReaction(data.reaction); // "like" | "dislike" | null
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
    } finally {
      setReactionLoading(false);
    }
  };

  // ==================== SUBSCRIBE ====================
  const handleSubscribe = async () => {
    const channelId = videoDetails?.channel?._id || videoDetails?.channel?.id;
    if (!channelId) return;

    setSubscribeLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/subscribe/${channelId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();

      if (data.success) {
        setIsSubscribed(Boolean(data.subscribed));
        if (typeof data.subscribersCount === "number") {
          setSubscribersCount(data.subscribersCount);
        }
      }
    } catch (error) {
      console.error("Error subscribing to channel:", error);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;

    setCommentLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          commentText: commentText.trim(),
          userName: currentUser?.name || "",
          userImage: currentUser?.avatar || "",
        }),
      });
      const data = await response.json();

      if (data.success) {
        const newComment = {
          _id: Date.now().toString(),
          text: commentText.trim(),
          createdAt: new Date().toISOString(),
          userName: currentUser?.name || "",
          userImage: currentUser?.avatar || "",
        };
        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  const openVideo = useCallback(
    (vid) => {
      cancelCountdown();
      navigate(`/video/${vid.id}`, { state: { video: vid }, replace: true });
      window.scrollTo(0, 0);
    },
    [cancelCountdown, navigate],
  );

  // Walk the "Up next" queue for the player's previous/next buttons.
  const stepVideo = useCallback(
    (step) => {
      if (upNextVideos.length === 0) return;
      const idx = upNextVideos.findIndex(
        (vid) => String(vid.id) === String(videoData.id),
      );
      const target =
        idx >= 0
          ? upNextVideos[
              (idx + step + upNextVideos.length) % upNextVideos.length
            ]
          : upNextVideos[0];
      openVideo(target);
    },
    [upNextVideos, videoData.id, openVideo],
  );

  // ==================== UP NEXT AUTOPLAY ====================

  // Pick the next video. Self-navigation guard: if the computed next video is
  // the current one (single-item queue, or current not in the queue and the
  // fallback is itself), return null so we never auto-navigate in a loop.
  const getNextUpNext = () => {
    if (!upNextVideos || upNextVideos.length === 0) return null;
    const idx = upNextVideos.findIndex(
      (vid) => String(vid.id) === String(videoData.id),
    );
    const next =
      idx >= 0
        ? upNextVideos[(idx + 1) % upNextVideos.length]
        : upNextVideos[0];
    if (!next || String(next.id) === String(videoData.id)) return null;
    return next;
  };

  // Start the 5s countdown. Single active timer guard: if a countdown is
  // already running, ignore the call (covers double "ended" events).
  const startCountdown = (next) => {
    if (countdownTimerRef.current) return;
    nextTargetRef.current = next;
    setUpNextOverlay(next);
    setCountdownLeft(AUTOPLAY_COUNTDOWN_SECONDS);
    countdownTimerRef.current = setInterval(() => {
      setCountdownLeft((prev) =>
        Math.max(0, (prev ?? AUTOPLAY_COUNTDOWN_SECONDS) - 1),
      );
    }, 1000);
  };

  // Strictly on native "ended": autoplay ON => countdown, OFF => end screen.
  // Normal player controls (pause, seek, volume, fullscreen, speed) do NOT
  // cancel the countdown — only Replay, Cancel, or manual navigation do.
  const handlePlayerEnded = () => {
    autoplayNextRef.current = false;
    const next = getNextUpNext();
    if (!next) {
      setUpNextOverlay(null);
      setCountdownLeft(null);
      return;
    }
    if (autoplay) {
      startCountdown(next);
    } else {
      nextTargetRef.current = next;
      setUpNextOverlay(next);
      setCountdownLeft(null);
    }
  };

  const handleReplay = () => {
    const v = playerRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    setPlaying(true);
    cancelCountdown();
  };

  // Force-play the incoming video once its metadata is actually ready. The
  // src-change autoplay path (autoplay={playing}) can miss or be blocked when
  // playback ended, so the countdown / "Play Next" flow sets an explicit
  // intent and this handler consumes it exactly when the new video can play.
  const handleLoadedMetadata = (videoDuration) => {
    setDuration(videoDuration);
    if (autoplayNextRef.current) {
      autoplayNextRef.current = false;
      const v = playerRef.current;
      if (v && v.paused) v.play().catch(() => {});
    }
  };

  // Auto-advance when the countdown reaches zero.
  useEffect(() => {
    if (!countdownTimerRef.current) return;
    if ((countdownLeft ?? AUTOPLAY_COUNTDOWN_SECONDS) <= 0) {
      const target = nextTargetRef.current;
      cancelCountdown();
      if (target) {
        autoplayNextRef.current = true;
        openVideo(target);
      }
    }
  }, [countdownLeft, cancelCountdown, openVideo]);

  const upNextTarget = upNextOverlay;
  const upNextOverlayNode = upNextTarget ? (
    <div
      className="bp-upnext-overlay"
      role="dialog"
      aria-label={countdownLeft !== null ? "Up next" : "Video ended"}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bp-upnext-card">
        {countdownLeft !== null && (
          <div className="bp-upnext-count">
            <SkipForward size={14} aria-hidden="true" />
            Up next in {countdownLeft}s
          </div>
        )}
        <div className="bp-upnext-body">
          <img
            className="bp-upnext-thumb"
            src={
              upNextTarget.thumbnail
                ? resolveMediaUrl(upNextTarget.thumbnail)
                : upNextTarget.poster || getVideoEntry(upNextTarget.id)?.poster
            }
            alt=""
          />
          <div className="bp-upnext-meta">
            <p className="bp-upnext-title">{upNextTarget.title}</p>
            <p className="bp-upnext-channel">
              {getChannelName(upNextTarget.channel) ||
                upNextTarget.channel ||
                "Channel"}
            </p>
          </div>
        </div>
        <div className="bp-upnext-actions">
          <button
            type="button"
            className="bp-upnext-btn"
            onClick={handleReplay}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Replay
          </button>
          {countdownLeft !== null ? (
            <button
              type="button"
              className="bp-upnext-btn"
              onClick={cancelCountdown}
            >
              <X size={16} aria-hidden="true" />
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className="bp-upnext-btn bp-upnext-btn--primary"
              onClick={() => {
                autoplayNextRef.current = true;
                openVideo(upNextTarget);
              }}
            >
              <SkipForward size={16} aria-hidden="true" />
              Play Next
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const goToChannel = () => {
    const channelId = videoDetails?.channel?._id || videoDetails?.channel?.id;
    if (channelId) navigate(`/channel/${channelId}`);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/video/${id}`,
      );
      setShareCopied(true);
      setMoreMenuOpen(false);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const toggleDescription = () => {
    if (!descriptionExpanded) {
      const el = descriptionRef.current;
      if (el) setDescFullHeight(el.scrollHeight);
    }
    setDescriptionExpanded((prev) => !prev);
  };

  const renderDescription = (text) => {
    if (!text) return null;
    return text.split(/(#[A-Za-z0-9_]+)/g).map((part, index) =>
      /^#[A-Za-z0-9_]+$/.test(part) ? (
        <a
          key={index}
          href={`/search?q=${encodeURIComponent(part)}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/search?q=${encodeURIComponent(part)}`);
          }}
          className="text-[#3ea6ff] hover:underline"
        >
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
  };

  const channelObj =
    videoDetails?.channel && typeof videoDetails.channel === "object"
      ? videoDetails.channel
      : null;
  const channelName =
    getChannelName(videoDetails?.channel) ||
    getChannelName(videoData.channel) ||
    "Channel";
  const channelAvatar =
    channelObj?.channelImage ||
    channelObj?.avatar ||
    channelObj?.profileImage ||
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop";
  const channelId = channelObj?._id || channelObj?.id;
  const isVerified = Boolean(channelObj?.isVerified || channelObj?.verified);
  const videoCreatedAt = videoDetails?.createdAt;
  const commentInitial = currentUser?.name
    ? currentUser.name.trim().charAt(0).toUpperCase()
    : "?";

  return (
    <div className="bg-[#0f0f0f] text-white min-h-screen">
      <div className="max-w-[1750px] mx-auto px-4 pt-4 md:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        {/* Left – Video + Description + Comments */}
        <div
          className={`flex-1 ${theaterMode ? "max-w-none" : "max-w-[1280px]"}`}
        >
          {/* Video Player */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video group">
            <VideoPlayer
              src={resolvedVideoUrl}
              poster={resolvedPoster}
              title={videoDetails?.title || videoData.title}
              autoplay={playing}
              muted={muted}
              onReady={handlePlayerReady}
              onDispose={handlePlayerDispose}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={handlePlayerEnded}
              onTimeUpdate={setCurrentTime}
              onLoadedMetadata={handleLoadedMetadata}
              onVolumeChange={(isMuted) => setMuted(isMuted)}
              onPrevious={() => stepVideo(-1)}
              onNext={() => stepVideo(1)}
              onTheaterModeChange={setTheaterMode}
              onError={(error) => console.error("Video player error:", error)}
              overlay={upNextOverlayNode}
            />
          </div>

          {/* Video Info */}
          <div className="mt-4 bg-[#1a1a1a] rounded-xl p-4 md:p-6">
            {/* Title */}
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-snug line-clamp-2">
              {videoDetails?.title || videoData.title}
            </h1>

            {/* Views • time ago */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-400">
              <span>{formatCount(videoDetails?.views || 0)} views</span>
              {videoCreatedAt && (
                <>
                  <span className="text-gray-600">•</span>
                  <span>{formatTimeAgo(videoCreatedAt)}</span>
                </>
              )}
            </div>

            <div className="my-4 h-px bg-white/10 md:my-5" />

            {/* Channel row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <div className="flex items-center gap-3 md:flex-1 min-w-0">
                <button
                  type="button"
                  onClick={goToChannel}
                  disabled={!channelId}
                  aria-label="Visit channel"
                  className={`h-12 w-12 md:h-14 md:w-14 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden ${
                    channelId
                      ? "cursor-pointer transition-transform hover:scale-105"
                      : "cursor-default"
                  }`}
                >
                  <img
                    src={resolveMediaUrl(channelAvatar)}
                    alt={channelName}
                    className="h-full w-full object-cover"
                  />
                </button>

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={goToChannel}
                    disabled={!channelId}
                    className={`flex items-center gap-1.5 min-w-0 max-w-full text-left ${
                      channelId ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className="font-semibold text-[15px] truncate transition-colors hover:text-gray-200">
                      {channelName}
                    </span>
                    {isVerified && (
                      <BadgeCheck
                        size={16}
                        className="shrink-0 text-gray-400"
                      />
                    )}
                  </button>
                  <p className="mt-0.5 text-sm text-gray-400">
                    {subscribersCount.toLocaleString()} subscribers
                  </p>
                </div>
              </div>

              {/* Subscribe */}
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribeLoading}
                className={`h-11 w-full md:w-auto px-5 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isSubscribed
                    ? "bg-white/15 text-white hover:bg-white/20"
                    : "bg-white text-black hover:bg-gray-200"
                } ${subscribeLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {subscribeLoading
                  ? "Please wait..."
                  : isSubscribed
                    ? "Subscribed"
                    : "Subscribe"}
              </button>
            </div>

            <div className="my-4 h-px bg-white/10 md:my-5" />

            {/* Action buttons */}
            <div className="flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible pb-1 md:pb-0 scrollbar-hide">
              {/* Like / Dislike group */}
              <div className="flex items-center rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleReaction("like")}
                  disabled={reactionLoading}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    reaction === "like"
                      ? "bg-white/25 text-white"
                      : "hover:bg-white/15"
                  }`}
                >
                  <ThumbsUp
                    size={18}
                    fill={reaction === "like" ? "currentColor" : "none"}
                  />
                  <span>{formatCount(stats.likes)}</span>
                </button>
                <span className="h-5 w-px bg-white/15 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => handleReaction("dislike")}
                  disabled={reactionLoading}
                  aria-label="Dislike"
                  title="Dislike"
                  className={`flex items-center p-2.5 pr-4 text-sm transition-colors ${
                    reaction === "dislike"
                      ? "bg-white/25 text-white"
                      : "hover:bg-white/15"
                  }`}
                >
                  <ThumbsDown
                    size={18}
                    fill={reaction === "dislike" ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-sm font-semibold hover:bg-white/15 transition-colors flex-shrink-0"
              >
                {shareCopied ? <Check size={18} /> : <Share2 size={18} />}
                {shareCopied ? "Copied" : "Share"}
              </button>

              {/* Save (future) */}
              <button
                type="button"
                onClick={() => setSaved((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-sm font-semibold hover:bg-white/15 transition-colors flex-shrink-0"
              >
                <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
                {saved ? "Saved" : "Save"}
              </button>

              {/* More */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  aria-label="More options"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>

                {moreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMoreMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-12 z-50 w-52 bg-[#212121] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1.5">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors"
                      >
                        <Share2 size={16} /> Share
                      </button>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors"
                      >
                        <Copy size={16} /> Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          const title = videoDetails?.title || videoData.title || "";
                          navigate(`/copyright/claim?videoId=${id}&title=${encodeURIComponent(title)}`);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors"
                      >
                        <Shield size={16} /> Report Copyright
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="mt-4 bg-[#1a1a1a] rounded-xl p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-400">
              <span className="font-medium text-white/90">
                {formatCount(videoDetails?.views || 0)} views
              </span>
              {videoCreatedAt && (
                <>
                  <span className="text-gray-600">•</span>
                  <span>{formatTimeAgo(videoCreatedAt)}</span>
                </>
              )}
            </div>

            <div
              ref={descriptionRef}
              style={{ maxHeight: descriptionExpanded ? descFullHeight : 72 }}
              className="mt-3 overflow-hidden whitespace-pre-line text-[15px] leading-relaxed text-gray-300 transition-[max-height] duration-300 ease-in-out"
            >
              {renderDescription(
                videoDetails?.description ||
                  "This video is being loaded from the server. The selected content will play here.",
              )}
            </div>

            {descFullHeight > 72 && (
              <button
                type="button"
                onClick={toggleDescription}
                className="mt-3 -ml-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
              >
                {descriptionExpanded ? (
                  <>
                    Show less <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown size={16} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-6 bg-[#1a1a1a] rounded-xl p-4 md:p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare size={20} />
              Comments • {comments.length}
            </h3>

            <form onSubmit={handleCommentSubmit} className="flex gap-3 mt-6">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 overflow-hidden">
                {currentUser?.avatar ? (
                  <img
                    src={resolveMediaUrl(currentUser.avatar)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  commentInitial
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-b border-white/15 px-2 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-colors"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setCommentText("")}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={commentLoading || !commentText.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} />{" "}
                    {commentLoading ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </form>

            {comments.length > 0 ? (
              <div className="space-y-5 mt-6">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 overflow-hidden">
                      {comment.userImage ? (
                        <img
                          src={resolveMediaUrl(comment.userImage)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (comment.userName || "You").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-white/80">
                          {comment.userName || "You"}
                        </span>
                        <span>
                          {comment.createdAt
                            ? formatTimeAgo(comment.createdAt)
                            : "Just now"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-200 break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No comments yet • Be the first to share what you think!
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar – Up Next */}
        <div className="w-full lg:w-96 xl:w-[402px] flex-shrink-0">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-lg font-semibold">Up next</h2>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="hidden sm:inline">Autoplay</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoplay}
                onClick={() => setAutoplay((prev) => !prev)}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  autoplay ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    autoplay ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {upNextVideos.map((vid) => {
              const posterSrc = vid.thumbnail
                ? resolveMediaUrl(vid.thumbnail)
                : vid.poster || getVideoEntry(vid.id)?.poster;
              const isActive = String(vid.id) === String(videoData.id);
              return (
                <div
                  key={vid.id}
                  onClick={() => openVideo(vid)}
                  className={`relative flex gap-4 p-2 -mx-2 rounded-xl cursor-pointer group transition-colors ${
                    isActive ? "bg-white/10" : "hover:bg-white/[0.06]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-10 rounded-r bg-[#f00]"></span>
                  )}

                  <div className="relative w-[168px] aspect-video flex-shrink-0 rounded-xl overflow-hidden bg-black">
                    <img
                      src={posterSrc}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded font-medium">
                      {vid.duration || "--:--"}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-[1.4] line-clamp-2">
                      {vid.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={
                          vid.channelImage ||
                          "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=48&h=48&fit=crop"
                        }
                        alt={vid.channel}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                          {vid.channel}
                          {vid.verified && (
                            <Check
                              size={12}
                              className="text-gray-500 flex-shrink-0"
                            />
                          )}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {vid.views} views • {vid.time}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

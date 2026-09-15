import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import PlayerControls from "./PlayerControls";
import { clamp } from "./utils";
import "./player.css";

const HIDE_DELAY_MS = 2500;

export default function VideoPlayer({
  src,
  poster,
  title,
  autoplay = false,
  muted = false,
  preload = "auto",
  className = "",
  overlay = null,
  onReady,
  onDispose,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  onVolumeChange,
  onError,
  onPrevious,
  onNext,
  onTheaterModeChange,
}) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const hideTimerRef = useRef(null);

  const propsRef = useRef({});
  propsRef.current = {
    onReady,
    onDispose,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onLoadedMetadata,
    onVolumeChange,
    onError,
    onTheaterModeChange,
  };

  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [userActive, setUserActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const pipSupported = useMemo(
    () =>
      typeof document !== "undefined" &&
      "pictureInPictureEnabled" in document &&
      document.pictureInPictureEnabled,
    [],
  );

  const controlsHidden = !userActive && isPlaying;
  const controlsVisible = userActive || !isPlaying;

  // ---- buffered progress -------------------------------------------------
  const updateBuffered = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!v.buffered || v.buffered.length === 0) {
      setBuffered(0);
      return;
    }
    setBuffered(v.buffered.end(v.buffered.length - 1));
  }, []);

  // ---- playback controls -------------------------------------------------
  const seekTo = useCallback((time) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(time)) return;
    v.currentTime = clamp(time, 0, v.duration || time);
  }, []);

  const changeVolume = useCallback((nextMuted, nextVolume) => {
    const v = videoRef.current;
    if (v) {
      v.muted = nextMuted;
      v.volume = nextVolume;
    }
    setIsMuted(nextMuted);
    setVolume(nextVolume);
  }, []);

  const setPlaybackRateFromControl = useCallback((rate) => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const togglePip = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else {
      v.requestPictureInPicture().catch(() => {});
    }
  }, []);

  const toggleTheater = useCallback(() => {
    const next = !theaterMode;
    setTheaterMode(next);
    propsRef.current.onTheaterModeChange?.(next);
  }, [theaterMode]);

  // ---- auto-hide ---------------------------------------------------------
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      const v = videoRef.current;
      if (v && v.paused) return;
      setUserActive(false);
    }, HIDE_DELAY_MS);
  }, []);

  const wake = useCallback(() => {
    setUserActive(true);
    scheduleHide();
  }, [scheduleHide]);

  const handleScrubStart = useCallback(() => {
    setUserActive(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const handleScrubEnd = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  const handleRootClick = useCallback(
    (e) => {
      if (e.target.closest(".bp-player-controls")) return;
      if (e.target.closest(".bp-center-play-btn")) return;
      togglePlay();
    },
    [togglePlay],
  );

  // ---- keyboard shortcuts ------------------------------------------------
  const handleKeyDown = useCallback(
    (e) => {
      wake();
      const v = videoRef.current;
      if (!v) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const tag = target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (tag === "BUTTON" && (key === " " || key === "enter")) return;
      if (
        target.closest(".bp-seekbar") &&
        ["arrowleft", "arrowright", "pageup", "pagedown"].includes(key)
      ) {
        return;
      }
      switch (key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
          break;
        case "arrowleft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 5);
          break;
        case "arrowup": {
          const nextUp = Math.min(1, v.volume + 0.1);
          e.preventDefault();
          changeVolume(nextUp <= 0, nextUp);
          break;
        }
        case "arrowdown": {
          const nextDown = Math.max(0, v.volume - 0.1);
          e.preventDefault();
          changeVolume(nextDown <= 0, nextDown);
          break;
        }
        case "m":
          e.preventDefault();
          changeVolume(!v.muted, v.volume);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "i":
          e.preventDefault();
          if (pipSupported) togglePip();
          break;
        case "j":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case "l":
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          break;
        case "home":
          e.preventDefault();
          v.currentTime = 0;
          break;
        case "end":
          e.preventDefault();
          v.currentTime = v.duration || 0;
          break;
        default:
          break;
      }
    },
    [wake, togglePlay, changeVolume, toggleFullscreen, togglePip, pipSupported],
  );

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(Boolean(document.fullscreenElement));
  }, []);

  const handlePipChange = useCallback(() => {
    setIsPip(Boolean(document.pictureInPictureElement));
  }, []);

  // ---- video element listeners ------------------------------------------
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => {
      setIsPlaying(true);
      propsRef.current.onPlay?.();
    };
    const onPause = () => {
      setIsPlaying(false);
      propsRef.current.onPause?.();
    };
    const onEnded = () => {
      propsRef.current.onEnded?.();
    };
    const onTime = () => {
      const t = v.currentTime;
      setCurrentTime(t);
      propsRef.current.onTimeUpdate?.(t, v.duration);
    };
    const onMeta = () => {
      setDuration(v.duration);
      updateBuffered();
      propsRef.current.onLoadedMetadata?.(v.duration);
    };
    const onVol = () => {
      setIsMuted(v.muted);
      setVolume(v.volume);
      propsRef.current.onVolumeChange?.(v.muted, v.volume);
    };
    const onErr = () => {
      propsRef.current.onError?.(v.error);
    };
    const onWait = () => setWaiting(true);
    const onResume = () => setWaiting(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("error", onErr);
    v.addEventListener("waiting", onWait);
    v.addEventListener("playing", onResume);
    v.addEventListener("canplay", onResume);
    v.addEventListener("progress", updateBuffered);

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("enterpictureinpicture", handlePipChange);
    document.addEventListener("leavepictureinpicture", handlePipChange);

    v.muted = muted;
    v.volume = 1;
    v.playbackRate = 1;

    propsRef.current.onReady?.(v);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("error", onErr);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("playing", onResume);
      v.removeEventListener("canplay", onResume);
      v.removeEventListener("progress", updateBuffered);

      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("enterpictureinpicture", handlePipChange);
      document.removeEventListener("leavepictureinpicture", handlePipChange);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      propsRef.current.onDispose?.(v);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- source changes ----------------------------------------------------
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    if (v.getAttribute("src") !== src) {
      v.src = src;
    }
  }, [src]);

  useEffect(() => {
    if (!autoplay) return;
    const v = videoRef.current;
    if (!v) return;
    v.play()
      .then(() => {})
      .catch(() => {
        if (v.paused) setIsPlaying(false);
      });
  }, [autoplay, src]);

  const rootClass = [
    "bp-player",
    controlsHidden ? "bp-player--hidden" : "",
    !isPlaying ? "bp-player--paused" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapperRef}
      className={rootClass}
      role="group"
      aria-label={title ? `Video player: ${title}` : "Video player"}
      tabIndex={0}
      onPointerMove={wake}
      onPointerDown={wake}
      onTouchStart={wake}
      onKeyDown={handleKeyDown}
      onClick={handleRootClick}
    >
      <video
        ref={videoRef}
        className="bp-player-video"
        poster={poster}
        preload={preload}
        playsInline
        aria-label={title}
      />

      <div className="bp-player-gradient" aria-hidden="true" />

      {waiting && <div className="bp-spinner" aria-hidden="true" />}

      <div className="bp-center-controls">
        <button
          type="button"
          className="bp-center-play-btn"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause size={30} aria-hidden="true" />
          ) : (
            <Play size={30} fill="currentColor" aria-hidden="true" />
          )}
        </button>
      </div>

      <PlayerControls
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        onSeek={seekTo}
        onScrubStart={handleScrubStart}
        onScrubEnd={handleScrubEnd}
        muted={isMuted}
        volume={volume}
        onVolumeChange={changeVolume}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRateFromControl}
        pipSupported={pipSupported}
        isPip={isPip}
        onTogglePip={togglePip}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        theaterMode={theaterMode}
        onToggleTheater={toggleTheater}
        onPrevious={onPrevious}
        onNext={onNext}
        menuVisible={controlsVisible}
      />

      {overlay}
    </div>
  );
}

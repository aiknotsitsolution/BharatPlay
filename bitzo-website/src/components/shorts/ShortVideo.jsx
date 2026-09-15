import { useEffect, useRef, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const LONG_PRESS_MS = 600;
const DOUBLE_TAP_MS = 250;
const TAP_DRAG_THRESHOLD = 10;

export default function ShortVideo({
  index,
  src,
  poster,
  title,
  muted,
  preload,
  disabled = false,
  onRegister,
  onReady,
  onMetadata,
  onTimeUpdate,
  onTogglePlay,
  onLike,
}) {
  const videoRef = useRef(null);
  const downRef = useRef({ x: 0, y: 0 });
  const tapTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const [waiting, setWaiting] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [burst, setBurst] = useState(0);

  // Reset transient state whenever the source or element changes.
  useEffect(() => {
    setWaiting(false);
    setMetadataLoaded(false);
    setError(false);
  }, [src, reloadKey]);

  // Auto-remove the double-tap heart burst after the animation.
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 700);
    return () => clearTimeout(t);
  }, [burst]);

  // Upgrade preload as a video becomes active (adjacent = metadata → auto).
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.preload !== preload) v.preload = preload;
  }, [preload]);

  const setRef = (el) => {
    if (el) {
      videoRef.current = el;
      onRegister(el, index);
    } else {
      videoRef.current = null;
      onRegister(null, index);
    }
  };

  const clearTimers = () => {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDoubleTap = () => {
    setBurst((k) => k + 1);
    onLike();
  };

  const handlePointerDown = (e) => {
    if (disabled) return;
    downRef.current = { x: e.clientX, y: e.clientY };
    clearTimers();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      const v = videoRef.current;
      if (v && !v.paused) v.playbackRate = 2;
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e) => {
    if (!longPressTimerRef.current) return;
    const dx = Math.abs(e.clientX - downRef.current.x);
    const dy = Math.abs(e.clientY - downRef.current.y);
    if (dx > TAP_DRAG_THRESHOLD || dy > TAP_DRAG_THRESHOLD) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerUp = (e) => {
    if (disabled) return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      const v = videoRef.current;
      if (v) v.playbackRate = 1;
      return;
    }
    const dx = Math.abs(e.clientX - downRef.current.x);
    const dy = Math.abs(e.clientY - downRef.current.y);
    if (dx > TAP_DRAG_THRESHOLD || dy > TAP_DRAG_THRESHOLD) return; // swipe/drag
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      handleDoubleTap();
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        onTogglePlay();
      }, DOUBLE_TAP_MS);
    }
  };

  const handlePointerCancel = () => {
    clearTimers();
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      const v = videoRef.current;
      if (v) v.playbackRate = 1;
    }
  };

  const handleLoadedMetadata = (e) => {
    setMetadataLoaded(true);
    onMetadata(e.currentTarget);
  };

  const handleError = () => {
    setError(true);
  };

  const handleRetry = () => {
    setError(false);
    setWaiting(false);
    setMetadataLoaded(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div
      className="absolute inset-0 z-0 cursor-pointer select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        key={reloadKey}
        ref={setRef}
        src={src}
        poster={poster || undefined}
        aria-label={title}
        className="h-full w-full object-cover"
        loop
        muted={muted}
        playsInline
        preload={preload}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={(e) => onReady(index, e.currentTarget)}
        onCanPlay={(e) => onReady(index, e.currentTarget)}
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlayThrough={() => setWaiting(false)}
        onError={handleError}
      />

      {/* Skeleton before metadata loads (only when no poster is available) */}
      {!metadataLoaded && !poster && !error ? (
        <div className="absolute inset-0 z-[1] bg-zinc-950">
          <div className="h-full w-full animate-pulse bg-linear-to-b from-zinc-900 via-zinc-950 to-black" />
        </div>
      ) : null}

      {/* Buffering spinner */}
      {waiting && metadataLoaded && !error ? (
        <div className="absolute inset-0 z-[2] flex items-center justify-center">
          <LoadingSpinner label="Buffering" />
        </div>
      ) : null}

      {/* Error + retry */}
      {error ? (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-4 bg-black/70 text-white">
          <p className="text-sm text-white/70">Video failed to load</p>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : null}

      {/* Double-tap like burst */}
      {burst > 0 ? (
        <div
          key={burst}
          className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center"
        >
          <Heart
            size={88}
            className="shorts-burst fill-red-500 text-red-500"
          />
        </div>
      ) : null}
    </div>
  );
}

import { useCallback, useRef, useState } from "react";
import { clamp, formatTime } from "./utils";

export default function SeekBar({
  currentTime,
  duration,
  buffered,
  onSeek,
  onScrubStart,
  onScrubEnd,
}) {
  const barRef = useRef(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(null);

  const timeFromEvent = useCallback(
    (e) => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      return ratio * (duration || 0);
    },
    [duration],
  );

  const clampedX = (bar, x) => clamp(x, 8, (bar.clientWidth || 0) - 8);

  const handlePointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    onScrubStart?.();
    if (barRef.current?.setPointerCapture) {
      barRef.current.setPointerCapture(e.pointerId);
    }
    const time = timeFromEvent(e);
    const x = clampedX(barRef.current, e.clientX - barRef.current.getBoundingClientRect().left);
    setHover({ x, time });
    onSeek(time);
  };

  const handlePointerMove = (e) => {
    const bar = barRef.current;
    if (!bar) return;
    const time = timeFromEvent(e);
    const x = clampedX(bar, e.clientX - bar.getBoundingClientRect().left);
    setHover({ x, time });
    if (draggingRef.current) onSeek(time);
  };

  const handlePointerUp = (e) => {
    if (!draggingRef.current) return;
    onSeek(timeFromEvent(e));
    draggingRef.current = false;
    setDragging(false);
    onScrubEnd?.();
    if (barRef.current?.hasPointerCapture?.(e.pointerId)) {
      barRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerLeave = () => {
    if (!draggingRef.current) setHover(null);
  };

  const handleKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 5;
    let next = currentTime;
    if (e.key === "ArrowRight") next = currentTime + step;
    else if (e.key === "ArrowLeft") next = currentTime - step;
    else if (e.key === "PageUp") next = currentTime + (duration || 0) * 0.1;
    else if (e.key === "PageDown") next = currentTime - (duration || 0) * 0.1;
    else return;
    e.preventDefault();
    onSeek(clamp(next, 0, duration || 0));
  };

  const playedRatio = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const bufferedRatio =
    duration > 0 ? clamp(buffered / duration, 0, 1) : 0;
  const displayTime = dragging && hover ? hover.time : currentTime;
  const displayRatio =
    dragging && hover
      ? clamp(hover.time / (duration || 1), 0, 1)
      : playedRatio;
  const tooltipX = hover ? hover.x : 0;

  return (
    <div
      ref={barRef}
      className={`bp-seekbar${dragging ? " bp-seekbar--dragging" : ""}`}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 0)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={formatTime(displayTime)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
    >
      <div className="bp-seekbar-track">
        <div
          className="bp-seekbar-buffered"
          style={{ width: `${bufferedRatio * 100}%` }}
        />
        <div
          className="bp-seekbar-played"
          style={{ width: `${displayRatio * 100}%` }}
        />
        <div
          className="bp-seekbar-thumb"
          style={{ left: `${displayRatio * 100}%` }}
        />
      </div>
      {(hover || dragging) && (
        <div className="bp-seekbar-tooltip" style={{ left: tooltipX }}>
          {formatTime(displayTime)}
        </div>
      )}
    </div>
  );
}

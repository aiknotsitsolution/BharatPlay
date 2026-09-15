import { useRef, useState } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import ControlButton from "./ControlButton";
import { clamp } from "./utils";

export default function VolumeControl({ muted, volume, onChange }) {
  const sliderRef = useRef(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const applyFromEvent = (e) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    onChange(ratio === 0, ratio);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    sliderRef.current?.setPointerCapture?.(e.pointerId);
    applyFromEvent(e);
  };

  const handlePointerMove = (e) => {
    if (draggingRef.current) applyFromEvent(e);
  };

  const handlePointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (sliderRef.current?.hasPointerCapture?.(e.pointerId)) {
      sliderRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e) => {
    const step = 0.1;
    let next = muted ? 0 : volume;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") next += step;
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") next -= step;
    else return;
    e.preventDefault();
    onChange(next <= 0, clamp(next, 0, 1));
  };

  const visibleVolume = muted ? 0 : volume;

  const handleMuteToggle = () => {
    if (muted || volume === 0) onChange(false, volume === 0 ? 0.5 : volume);
    else onChange(true, volume);
  };

  return (
    <div className="bp-volume">
      <ControlButton
        label={muted || volume === 0 ? "Unmute" : "Mute"}
        onClick={handleMuteToggle}
      >
        <Icon size={20} aria-hidden="true" />
      </ControlButton>
      <div className={`bp-volume-slider${dragging ? " bp-volume-slider--dragging" : ""}`}>
        <div
          ref={sliderRef}
          className="bp-vol-track"
          role="slider"
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(visibleVolume * 100)}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <div className="bp-vol-fill" style={{ width: `${visibleVolume * 100}%` }} />
          <div className="bp-vol-thumb" style={{ left: `${visibleVolume * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

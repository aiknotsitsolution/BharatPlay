import { useState } from "react";
import { Check } from "lucide-react";
import ControlButton from "./ControlButton";
import { PLAYBACK_RATES, formatPlaybackRate } from "./utils";

function Menu({ open, onClose, ariaLabel, children }) {
  return (
    <>
      {open && <div className="bp-menu-backdrop" onClick={onClose} />}
      <div
        className={`bp-menu${open ? " bp-menu--open" : ""}`}
        role="menu"
        aria-label={ariaLabel}
        aria-hidden={!open}
        inert={!open}
      >
        {children}
      </div>
    </>
  );
}

export function QualityMenu({
  quality,
  qualities = [],
  onChange,
  menuVisible = true,
}) {
  const [open, setOpen] = useState(false);
  const [prevMenuVisible, setPrevMenuVisible] = useState(menuVisible);

  if (prevMenuVisible !== menuVisible) {
    setPrevMenuVisible(menuVisible);
    if (!menuVisible) setOpen(false);
  }

  const standardQualities = ["144p", "240p", "360p", "480p", "720p", "1080p"];
  const availableValues = new Set(qualities.map((option) => option.value));
  const options = [
    ...standardQualities.map((value) => ({
      label: value,
      value,
      available: availableValues.has(value),
    })),
  ];
  return (
    <div className="bp-menu-anchor">
      <ControlButton
        label={`Video quality: ${quality === "auto" ? "Quality" : quality}`}
        onClick={() => setOpen((value) => !value)}
        active={open}
      >
        <span className="bp-speed-label">
          {quality === "auto" ? "Quality" : quality}
        </span>
      </ControlButton>
      <Menu open={open} onClose={() => setOpen(false)} ariaLabel="Video quality">
        <div className="bp-menu-heading">Quality</div>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={option.value === quality}
            disabled={!option.available}
            className={`bp-menu-item${option.value === quality ? " bp-menu-item--active" : ""}`}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <span>{option.label || option.value}</span>
            {option.value === quality && <Check size={16} aria-hidden="true" />}
          </button>
        ))}
        {!qualities.length && (
          <div className="bp-menu-note">
            Other qualities are unavailable for this video.
          </div>
        )}
      </Menu>
    </div>
  );
}

export function PlaybackSpeedMenu({ playbackRate, onChange, menuVisible = true }) {
  const [open, setOpen] = useState(false);
  const [prevMenuVisible, setPrevMenuVisible] = useState(menuVisible);

  if (prevMenuVisible !== menuVisible) {
    setPrevMenuVisible(menuVisible);
    if (!menuVisible) setOpen(false);
  }

  return (
    <div className="bp-menu-anchor">
      <ControlButton
        label={`Playback speed: ${formatPlaybackRate(playbackRate)}`}
        onClick={() => setOpen((value) => !value)}
        active={open}
      >
        <span className="bp-speed-label">{formatPlaybackRate(playbackRate)}</span>
      </ControlButton>
      <Menu open={open} onClose={() => setOpen(false)} ariaLabel="Playback speed">
        <div className="bp-menu-heading">Playback speed</div>
        {PLAYBACK_RATES.map((rate) => (
          <button
            key={rate}
            type="button"
            role="menuitemradio"
            aria-checked={rate === playbackRate}
            className={`bp-menu-item${rate === playbackRate ? " bp-menu-item--active" : ""}`}
            onClick={() => {
              onChange(rate);
              setOpen(false);
            }}
          >
            <span>{formatPlaybackRate(rate)}</span>
            {rate === playbackRate && <Check size={16} aria-hidden="true" />}
          </button>
        ))}
      </Menu>
    </div>
  );
}

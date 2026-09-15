import { useState } from "react";
import { Check, Settings } from "lucide-react";
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

function SpeedOptions({ playbackRate, onSelect }) {
  return (
    <>
      <div className="bp-menu-heading">Playback speed</div>
      {PLAYBACK_RATES.map((rate) => (
        <button
          key={rate}
          type="button"
          role="menuitemradio"
          aria-checked={rate === playbackRate}
          className={`bp-menu-item${rate === playbackRate ? " bp-menu-item--active" : ""}`}
          onClick={() => onSelect(rate)}
        >
          <span>{formatPlaybackRate(rate)}</span>
          {rate === playbackRate && <Check size={16} aria-hidden="true" />}
        </button>
      ))}
    </>
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
        onClick={() => setOpen((o) => !o)}
        active={open}
      >
        <span className="bp-speed-label">{formatPlaybackRate(playbackRate)}</span>
      </ControlButton>
      <Menu open={open} onClose={() => setOpen(false)} ariaLabel="Playback speed">
        <SpeedOptions
          playbackRate={playbackRate}
          onSelect={(rate) => {
            onChange(rate);
            setOpen(false);
          }}
        />
      </Menu>
    </div>
  );
}

export function SettingsMenu({ playbackRate, onChange, menuVisible = true }) {
  const [open, setOpen] = useState(false);
  const [prevMenuVisible, setPrevMenuVisible] = useState(menuVisible);

  if (prevMenuVisible !== menuVisible) {
    setPrevMenuVisible(menuVisible);
    if (!menuVisible) setOpen(false);
  }

  return (
    <div className="bp-menu-anchor">
      <ControlButton label="Settings" onClick={() => setOpen((o) => !o)} active={open}>
        <Settings size={20} aria-hidden="true" />
      </ControlButton>
      <Menu open={open} onClose={() => setOpen(false)} ariaLabel="Settings">
        <SpeedOptions
          playbackRate={playbackRate}
          onSelect={(rate) => {
            onChange(rate);
            setOpen(false);
          }}
        />
      </Menu>
    </div>
  );
}

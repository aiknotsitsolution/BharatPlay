import {
  Maximize2,
  Minimize2,
  Pause,
  PictureInPicture2,
  Play,
  RectangleHorizontal,
  SkipBack,
  SkipForward,
} from "lucide-react";
import ControlButton from "./ControlButton";
import SeekBar from "./SeekBar";
import VolumeControl from "./VolumeControl";
import { PlaybackSpeedMenu, SettingsMenu } from "./Menus";
import { formatTime } from "./utils";

export default function PlayerControls({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  buffered,
  onSeek,
  onScrubStart,
  onScrubEnd,
  muted,
  volume,
  onVolumeChange,
  playbackRate,
  onPlaybackRateChange,
  pipSupported,
  isPip,
  onTogglePip,
  isFullscreen,
  onToggleFullscreen,
  theaterMode,
  onToggleTheater,
  onPrevious,
  onNext,
  menuVisible,
}) {
  return (
    <div className="bp-player-controls">
      <SeekBar
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        onSeek={onSeek}
        onScrubStart={onScrubStart}
        onScrubEnd={onScrubEnd}
      />

      <div className="bp-controls-row">
        <div className="bp-controls-cluster">
          <ControlButton label={isPlaying ? "Pause" : "Play"} onClick={onTogglePlay}>
            {isPlaying ? (
              <Pause size={22} aria-hidden="true" />
            ) : (
              <Play size={22} aria-hidden="true" />
            )}
          </ControlButton>

          {onPrevious && (
            <ControlButton label="Previous video" onClick={onPrevious}>
              <SkipBack size={20} aria-hidden="true" />
            </ControlButton>
          )}
          {onNext && (
            <ControlButton label="Next video" onClick={onNext}>
              <SkipForward size={20} aria-hidden="true" />
            </ControlButton>
          )}

          <VolumeControl muted={muted} volume={volume} onChange={onVolumeChange} />

          <span
            className="bp-time"
            aria-label={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          >
            {formatTime(currentTime)}
            <span className="bp-time-divider"> / </span>
            {formatTime(duration)}
          </span>
        </div>

        <div className="bp-controls-cluster">
          <PlaybackSpeedMenu playbackRate={playbackRate} onChange={onPlaybackRateChange} menuVisible={menuVisible} />
          <SettingsMenu playbackRate={playbackRate} onChange={onPlaybackRateChange} menuVisible={menuVisible} />

          {pipSupported && (
            <ControlButton
              label={isPip ? "Exit picture-in-picture" : "Picture in picture"}
              onClick={onTogglePip}
            >
              <PictureInPicture2 size={20} aria-hidden="true" />
            </ControlButton>
          )}

          <ControlButton
            label={theaterMode ? "Exit theater mode" : "Theater mode"}
            onClick={onToggleTheater}
            active={theaterMode}
          >
            <RectangleHorizontal size={20} aria-hidden="true" />
          </ControlButton>

          <ControlButton
            label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 size={20} aria-hidden="true" />
            ) : (
              <Maximize2 size={20} aria-hidden="true" />
            )}
          </ControlButton>
        </div>
      </div>
    </div>
  );
}

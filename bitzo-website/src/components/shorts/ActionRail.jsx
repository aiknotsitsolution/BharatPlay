import { Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";

function RailButton({
  label,
  active = false,
  activeClass = "",
  disabled = false,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active ? "true" : "false"}
      onClick={onClick}
      disabled={disabled}
      className="group pointer-events-auto flex cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform duration-200 hover:scale-105 active:scale-90 focus-visible:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-lg shadow-black/30 backdrop-blur-md transition-all duration-200 group-hover:bg-white/20 ${activeClass}`}
      >
        {children}
      </span>
      {label ? (
        <span className="text-xs font-medium text-white drop-shadow">
          {label}
        </span>
      ) : null}
    </button>
  );
}

export default function ActionRail({
  liked,
  likeLabel,
  commentLabel,
  pending,
  onLike,
  onComment,
  onShare,
  muted,
  onToggleMute,
}) {
  return (
    <div className="pointer-events-none absolute right-3 bottom-32 z-30 flex flex-col items-center gap-5">
      <RailButton
        label={likeLabel}
        active={liked}
        activeClass="bg-red-500/30 border-red-400/40"
        onClick={onLike}
        disabled={pending}
      >
        <Heart
          size={26}
          className={liked ? "fill-red-500 text-red-500" : "text-white"}
        />
      </RailButton>

      <RailButton label={commentLabel} onClick={onComment}>
        <MessageCircle size={26} className="text-white" />
      </RailButton>

      <RailButton label="Share" onClick={onShare}>
        <Share2 size={26} className="text-white" />
      </RailButton>

      <RailButton label={muted ? "Unmute" : "Mute"} onClick={onToggleMute}>
        {muted ? (
          <VolumeX size={26} className="text-white" />
        ) : (
          <Volume2 size={26} className="text-white" />
        )}
      </RailButton>
    </div>
  );
}

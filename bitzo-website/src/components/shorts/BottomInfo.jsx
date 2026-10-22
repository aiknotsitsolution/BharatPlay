import { BadgeCheck, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

const resolveImage = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${BACKEND_URL}/${String(value).replace(/^\/+/, "").replace(/\\/g, "/")}`;
};

export default function BottomInfo({
  short,
  formattedViews,
  channelId,
  onSubscribe,
  isSubscribed,
  subscribePending = false,
  onOpenDetails,
  detailsOpen = false,
}) {
  const raw = short.raw || {};
  const channel = typeof raw.channel === "string" ? null : raw.channel || null;
  const uploadedBy =
    typeof raw.uploadedBy === "string" ? null : raw.uploadedBy || null;
  const creator = typeof raw.creator === "string" ? null : raw.creator || null;

  const displayName =
    channel?.name ||
    raw.channelName ||
    uploadedBy?.name ||
    creator?.name ||
    "VidBuxApp Creator";

  const avatar = resolveImage(
    channel?.channelImage ||
      uploadedBy?.avatar ||
      creator?.avatar ||
      creator?.profileImage ||
      raw.avatar ||
      raw.channelImage ||
      "",
  );

  const verified = Boolean(
    raw.verified === true ||
    channel?.verified === true ||
    uploadedBy?.verified === true ||
    creator?.verified === true,
  );

  const stopVideoPointer = (event) => event.stopPropagation();

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 bottom-0 px-4 pb-6 pr-24">
        {/* Channel row */}
        <div className="flex items-center gap-3">
          <Link
            to={channelId ? `/channel/${channelId}` : "#"}
            aria-label={`Open ${displayName} channel`}
            tabIndex={channelId ? 0 : -1}
            onPointerDown={stopVideoPointer}
            onPointerUp={stopVideoPointer}
            onClick={(event) => {
              event.stopPropagation();
              if (!channelId) event.preventDefault();
            }}
            className={`pointer-events-auto shrink-0 ${channelId ? "" : "cursor-default"}`}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-pink-500 to-purple-600 ring-2 ring-white/20">
                <span className="text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {channelId ? (
                <Link
                  to={`/channel/${channelId}`}
                  onPointerDown={stopVideoPointer}
                  onPointerUp={stopVideoPointer}
                  onClick={stopVideoPointer}
                  className="pointer-events-auto truncate text-sm font-semibold text-white hover:underline"
                >
                  {displayName}
                </Link>
              ) : (
                <span className="truncate text-sm font-semibold text-white">
                  {displayName}
                </span>
              )}
              {verified ? (
                <BadgeCheck size={16} className="shrink-0 text-blue-400" />
              ) : null}
            </div>
          </div>
          {onSubscribe ? (
            <button
              type="button"
              onClick={onSubscribe}
              onPointerDown={stopVideoPointer}
              onPointerUp={stopVideoPointer}
              disabled={subscribePending}
              className={`pointer-events-auto shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition duration-200 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 disabled:cursor-wait disabled:opacity-60 ${
                isSubscribed
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {isSubscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          ) : null}
        </div>

        {/* Title */}
        <h1 className="mt-2.5">
          <button
            type="button"
            aria-label="Open video details"
            onPointerDown={stopVideoPointer}
            onPointerUp={stopVideoPointer}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails?.();
            }}
            aria-expanded={detailsOpen}
            className="pointer-events-auto line-clamp-2 text-left text-base font-semibold text-white drop-shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
          >
            {short.title}
          </button>
        </h1>

        {/* Views */}
        <p className="mt-1 text-xs font-medium text-white/80">{formattedViews}</p>

        {/* Music row */}
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80">
          <Music2 size={16} className="shrink-0" />
          <span className="truncate">Original Audio</span>
        </div>
      </div>
    </div>
  );
}

export function ShortDetails({ short, formattedViews, onClose }) {
  const raw = short.raw || {};
  const channel =
    typeof raw.channel === "string" ? null : raw.channel || null;
  const uploadedBy =
    typeof raw.uploadedBy === "string" ? null : raw.uploadedBy || null;
  const creator = typeof raw.creator === "string" ? null : raw.creator || null;
  const displayName =
    channel?.name ||
    raw.channelName ||
    uploadedBy?.name ||
    creator?.name ||
    "VidBuxApp Creator";
  const description = raw.description || "";
  const hashtags = Array.isArray(raw.hashtags) ? raw.hashtags : [];
  const likes = Number(raw.likesCount ?? raw.likes ?? short.likes) || 0;
  const uploadDate = raw.createdAt || raw.uploadDate || raw.uploadedAt;
  const parsedUploadDate = uploadDate ? new Date(uploadDate) : null;
  const formattedUploadDate =
    parsedUploadDate && !Number.isNaN(parsedUploadDate.getTime())
      ? parsedUploadDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <section
      aria-label="Video details"
      className="pointer-events-auto h-[38%] min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain border-t border-white/10 bg-[#0f0f0f] px-4 py-4 text-white touch-pan-y sm:px-6"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold leading-snug sm:text-xl">
            {short.title}
          </h2>
          <button
            type="button"
            aria-label="Close video details"
            onClick={onClose}
            className="shrink-0 rounded-full px-2 py-1 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-sm font-medium text-white/80">{displayName}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
          <span>{likes.toLocaleString()} likes</span>
          <span>{formattedViews}</span>
          {formattedUploadDate ? <span>Uploaded {formattedUploadDate}</span> : null}
        </div>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-white/90">
          {description || "No description available."}
        </p>
        {hashtags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
            {hashtags.map((tag) => (
              <span key={tag} className="text-sm font-medium text-sky-300">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

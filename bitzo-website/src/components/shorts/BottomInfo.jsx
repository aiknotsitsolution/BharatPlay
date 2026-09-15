import { BadgeCheck, Music2 } from "lucide-react";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

const resolveImage = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${BACKEND_URL}/${String(value).replace(/^\/+/, "").replace(/\\/g, "/")}`;
};

export default function BottomInfo({ short, formattedViews, onSubscribe }) {
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
    "Bharat Play Creator";

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

  const description = raw.description || "";
  const hashtags = Array.isArray(raw.hashtags) ? raw.hashtags : [];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-6 pr-24">
      {/* Channel row */}
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/20"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-500 to-purple-600 ring-2 ring-white/20">
            <span className="text-sm font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-white">
              {displayName}
            </span>
            {verified ? (
              <BadgeCheck size={16} className="shrink-0 text-blue-400" />
            ) : null}
          </div>
        </div>
        {onSubscribe ? (
          <button
            type="button"
            onClick={onSubscribe}
            className="pointer-events-auto shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition duration-200 hover:bg-white/90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
          >
            Subscribe
          </button>
        ) : null}
      </div>

      {/* Title */}
      <h1 className="mt-2.5 line-clamp-2 text-base font-semibold text-white drop-shadow-md">
        {short.title}
      </h1>

      {/* Views */}
      <p className="mt-1 text-xs font-medium text-white/80">{formattedViews}</p>

      {/* Music row */}
      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80">
        <Music2 size={16} className="shrink-0" />
        <span className="truncate">Original Audio</span>
      </div>

      {/* Description */}
      {description ? (
        <p className="mt-2 line-clamp-2 text-sm text-white/85">{description}</p>
      ) : null}

      {/* Hashtags */}
      {hashtags.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <span key={tag} className="text-sm font-medium text-sky-300">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

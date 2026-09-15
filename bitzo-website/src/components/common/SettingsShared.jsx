import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { resolveMediaUrl } from "../../utils/mediaUrl";

/* ------------------------------------------------------------------ */
/*  Page Shell — consistent container for all settings list pages      */
/* ------------------------------------------------------------------ */

export function SettingsPageShell({ children }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Header                                                        */
/* ------------------------------------------------------------------ */

export function SettingsPageHeader({ icon: Icon, title, count, controls }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={22} className="text-zinc-400" />}
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="text-sm text-zinc-500 tabular-nums">
            {count} {count === 1 ? "video" : "videos"}
          </span>
        )}
      </div>
      {controls && <div className="flex items-center gap-2">{controls}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Duration formatter                                                  */
/* ------------------------------------------------------------------ */

function formatDuration(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string" && value.includes(":")) return value;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = Math.floor(n % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Video Row Card — horizontal thumbnail + info layout                */
/* ------------------------------------------------------------------ */

export function VideoRowCard({ video, onClick, badge, meta, action, thumbnailFallback }) {
  const thumbSrc =
    resolveMediaUrl(video.thumbnail) || thumbnailFallback || "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(video)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(video);
        }
      }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900 cursor-pointer sm:flex-row focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-0"
    >
      {/* Thumbnail */}
      <div className="relative w-full shrink-0 overflow-hidden sm:w-44 md:w-52">
        <div className="aspect-video w-full bg-zinc-800">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={video.title || "Video thumbnail"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/320x180?text=No+Thumbnail";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
              No thumbnail
            </div>
          )}
        </div>
        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {video.durationText || formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 p-3 sm:p-4">
        <div className="min-w-0 space-y-1">
          {badge && <div>{badge}</div>}
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white md:text-base">
            {video.title || "Untitled video"}
          </h3>
          {video.channelName && (
            <p className="truncate text-xs text-zinc-400 md:text-sm">
              {video.channelName}
            </p>
          )}
        </div>
        {meta && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            {meta}
          </div>
        )}
      </div>

      {/* Optional action (e.g. remove button) */}
      {action && <div className="absolute right-2 top-2 sm:right-3 sm:top-3">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Video Row Card — Skeleton                                           */
/* ------------------------------------------------------------------ */

const shimmer = "animate-shimmer";

export function VideoRowCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 sm:flex-row" aria-hidden="true">
      <div className="relative w-full shrink-0 sm:w-44 md:w-52">
        <div className={`${shimmer} aspect-video w-full`} />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className={`${shimmer} h-4 w-3/4 rounded`} />
        <div className={`${shimmer} h-3.5 w-1/2 rounded`} />
        <div className="flex gap-3">
          <div className={`${shimmer} h-3 w-16 rounded`} />
          <div className={`${shimmer} h-3 w-12 rounded`} />
        </div>
      </div>
    </div>
  );
}

export function VideoRowCardSkeletonStack({ count = 4 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading videos">
      {Array.from({ length: count }).map((_, i) => (
        <VideoRowCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

export function SettingsPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-3 pt-4"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg bg-zinc-800/80 px-3.5 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="min-w-[80px] text-center text-sm tabular-nums text-zinc-400">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg bg-zinc-800/80 px-3.5 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

export function SettingsEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-zinc-800/60 p-4">
          <Icon size={32} className="text-zinc-500" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error State                                                        */
/* ------------------------------------------------------------------ */

export function SettingsErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-red-950/40 p-4">
        <AlertTriangle size={32} className="text-red-400/70" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-zinc-300">
        Something went wrong
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
        We couldn&apos;t load your videos. Please try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth Required State                                                */
/* ------------------------------------------------------------------ */

export function SettingsAuthState({ icon: Icon, title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-zinc-800/60 p-4">
          <Icon size={32} className="text-zinc-500" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-medium text-zinc-300">{title}</h3>
    </div>
  );
}

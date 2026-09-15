import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Clock, Heart, ArrowUpDown } from "lucide-react";
import { formatTime } from "../../components/player/utils";
import { API_USERVIDEO } from "../../config/api";
import { authFetch } from "../../utils/session";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import {
  SettingsPageShell,
  SettingsPageHeader,
  VideoRowCard,
  VideoRowCardSkeletonStack,
  SettingsPagination,
  SettingsEmptyState,
  SettingsErrorState,
  SettingsAuthState,
} from "../../components/common/SettingsShared";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "views", label: "Most Viewed" },
  { value: "earnings", label: "Most Earnings" },
];

export default function YourVideosTab({
  openDetail,
  sortBy: sortByProp,
  onSortChange: onSortChangeProp,
}) {
  const navigate = useNavigate();
  const [internalSortBy, setInternalSortBy] = useState("latest");
  const sortBy = sortByProp ?? internalSortBy;
  const onSortChange = onSortChangeProp ?? setInternalSortBy;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const fetchMyVideos = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(
          `${API_USERVIDEO}/my-videos?page=${pageNum}&limit=${PAGE_SIZE}`,
        );
        if (res.status === 401 || res.status === 403) {
          setError("auth");
          return;
        }
        if (!res.ok) {
          setError("server");
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data?.videos) ? data.videos : [];
        setVideos(list);
        setTotal(data.total ?? 0);
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchMyVideos(page);
  }, [page, fetchMyVideos]);

  const handleOpen = (video) => {
    if (typeof openDetail === "function") {
      openDetail(video);
      return;
    }
    navigate(`/video/${video._id || video.id}`, { state: { video } });
  };

  const sortedVideos = [...videos].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    if (sortBy === "earnings")
      return (b.likesCount || b.likes || 0) - (a.likesCount || a.likes || 0);
    return 0;
  });

  const formatViews = (num) => {
    if (!num) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const getStatusBadge = (status) => {
    const isActive = status?.toLowerCase() === "active";
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
          isActive
            ? "bg-green-900/40 text-green-400 ring-1 ring-green-800/50"
            : "bg-amber-900/40 text-amber-400 ring-1 ring-amber-800/50"
        }`}
      >
        {isActive ? "Active" : "Limited"}
      </span>
    );
  };

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="Your Videos"
        count={!loading && !error ? sortedVideos.length : undefined}
        controls={
          !error &&
          !loading && (
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                aria-label="Sort videos"
                className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 pr-8 text-sm text-zinc-200 transition-colors hover:border-zinc-600 focus:border-red-600 focus:outline-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      <div className="mt-5">
        {loading ? (
          <VideoRowCardSkeletonStack count={4} />
        ) : error === "auth" ? (
          <SettingsAuthState
            icon={Eye}
            title="Sign in to see your uploaded videos"
          />
        ) : error ? (
          <SettingsErrorState onRetry={() => fetchMyVideos(page)} />
        ) : sortedVideos.length === 0 ? (
          <SettingsEmptyState
            icon={Eye}
            title="No videos uploaded yet"
            description="Upload your first video to get started."
          />
        ) : (
          <>
            <div className="space-y-2.5">
              {sortedVideos.map((video) => {
                const videoId = video._id || video.id;
                return (
                  <VideoRowCard
                    key={videoId}
                    video={{
                      ...video,
                      channelName:
                        video.channelName ||
                        video.channel?.name ||
                        "Unknown channel",
                      durationText:
                        video.duration && video.duration !== "—"
                          ? formatTime(video.duration)
                          : undefined,
                      thumbnail:
                        resolveMediaUrl(video.thumbnail || video.thumb) ||
                        undefined,
                    }}
                    onClick={handleOpen}
                    badge={getStatusBadge(video.status)}
                    meta={
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Eye size={12} />
                          {formatViews(video.views)}
                        </span>
                        {video.duration && video.duration !== "—" && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(video.duration)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-red-400/80">
                          <Heart size={12} />
                          {formatViews(
                            video.likesCount || video.likes || 0,
                          )}
                        </span>
                        {video.createdAt && (
                          <span>
                            {new Date(
                              video.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    }
                  />
                );
              })}
            </div>

            <SettingsPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}

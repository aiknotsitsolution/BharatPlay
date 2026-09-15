import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Trash2, AlertTriangle, History } from "lucide-react";
import { toast } from "react-toastify";
import { formatTime } from "../../components/player/utils";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";
import { authFetch } from "../../utils/session";
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

export default function WatchHistoryTab({ openDetail }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const fetchHistory = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(
          `${BACKEND_URL}/api/uservideo/history?page=${pageNum}&limit=${PAGE_SIZE}`,
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
        setVideos(Array.isArray(data.videos) ? data.videos : []);
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
    fetchHistory(page);
  }, [page, fetchHistory]);

  const handleOpen = (video) => {
    if (typeof openDetail === "function") {
      openDetail(video);
      return;
    }
    navigate(`/video/${video._id || video.id}`, { state: { video } });
  };

  const handleRemove = async (e, videoId) => {
    e.stopPropagation();
    try {
      const res = await authFetch(
        `${BACKEND_URL}/api/uservideo/history/${videoId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        toast.error("Failed to remove from history");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setVideos((prev) =>
          prev.filter((v) => (v._id || v.id) !== videoId),
        );
        setTotal((prev) => Math.max(prev - 1, 0));
        toast.success("Removed from watch history");
      } else {
        toast.error(data.message || "Failed to remove from history");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleClearAll = async () => {
    setShowClearConfirm(false);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/uservideo/history`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to clear history");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setVideos([]);
        setTotal(0);
        setPage(1);
        toast.success("Watch history cleared");
      } else {
        toast.error(data.message || "Failed to clear history");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const formatViews = (num) => {
    if (!num) return "0 views";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M views";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K views";
    return num.toLocaleString() + " views";
  };

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        icon={Clock}
        title="Watch History"
        count={!loading && !error ? videos.length : undefined}
        controls={
          videos.length > 0 &&
          !error && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-zinc-500 transition-colors hover:text-red-400"
            >
              Clear all
            </button>
          )
        }
      />

      {showClearConfirm && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <AlertTriangle size={16} className="shrink-0 text-amber-400" />
            <span>Clear your entire watch history? This cannot be undone.</span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <VideoRowCardSkeletonStack count={4} />
        ) : error === "auth" ? (
          <SettingsAuthState
            icon={History}
            title="Sign in to see your watch history"
          />
        ) : error ? (
          <SettingsErrorState onRetry={() => fetchHistory(page)} />
        ) : videos.length === 0 ? (
          <SettingsEmptyState
            icon={History}
            title="No watch history yet"
            description="Videos you watch will appear here."
          />
        ) : (
          <>
            <div className="space-y-2.5">
              {videos.map((video) => {
                const videoId = video._id || video.id;
                return (
                  <VideoRowCard
                    key={videoId}
                    video={{
                      ...video,
                      channelName:
                        video.channel?.name ||
                        video.channelName ||
                        "Unknown channel",
                      durationText: video.duration
                        ? formatTime(video.duration)
                        : undefined,
                    }}
                    onClick={handleOpen}
                    meta={
                      <>
                        <span>{formatViews(video.views)}</span>
                        {video.watchedAt && (
                          <span>
                            Watched{" "}
                            {new Date(video.watchedAt).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    }
                    action={
                      <button
                        onClick={(e) => handleRemove(e, videoId)}
                        className="rounded-full p-2 text-zinc-500 opacity-0 transition-all hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100 focus-visible:opacity-100"
                        title="Remove from history"
                      >
                        <Trash2 size={16} />
                      </button>
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

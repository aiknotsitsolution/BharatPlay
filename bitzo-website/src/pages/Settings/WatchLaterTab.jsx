import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, X } from "lucide-react";
import { toast } from "react-toastify";
import { formatTime } from "../../components/player/utils";
import { API_USERVIDEO as API_BASE } from "../../config/api";
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

export default function WatchLaterTab({ openDetail }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const fetchWatchLater = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(
          `${API_BASE}/watch-later?page=${pageNum}&limit=${PAGE_SIZE}`,
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
        const normalizedVideos = Array.isArray(data.videos)
          ? data.videos.map((video) => ({
              ...video,
              channel:
                typeof video.channel === "object" && video.channel !== null
                  ? video.channel
                  : {
                      name:
                        video.channelName ||
                        video.channel ||
                        "Unknown channel",
                    },
            }))
          : [];
        setVideos(normalizedVideos);
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
    fetchWatchLater(page);
  }, [page, fetchWatchLater]);

  const handleOpen = (video) => {
    if (typeof openDetail === "function") {
      openDetail(video);
      return;
    }
    navigate(`/video/${video._id || video.id}`, { state: { video } });
  };

  const handleRemove = async (videoId) => {
    try {
      const res = await authFetch(`${API_BASE}/watch-later/${videoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to remove from Watch Later");
        return;
      }
      const data = await res.json();
      if (data.success) {
        const targetId = String(videoId);
        setVideos((prev) =>
          prev.filter((v) => String(v._id || v.id) !== targetId),
        );
        setTotal((prev) => Math.max(prev - 1, 0));
        toast.success("Removed from Watch Later");
      } else {
        toast.error(data.message || "Failed to remove from Watch Later");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        icon={Bookmark}
        title="Watch Later"
        count={!loading && !error ? videos.length : undefined}
      />

      <div className="mt-5">
        {loading ? (
          <VideoRowCardSkeletonStack count={4} />
        ) : error === "auth" ? (
          <SettingsAuthState
            icon={Bookmark}
            title="Sign in to see your watch later list"
          />
        ) : error ? (
          <SettingsErrorState onRetry={() => fetchWatchLater(page)} />
        ) : videos.length === 0 ? (
          <SettingsEmptyState
            icon={Bookmark}
            title="Watch Later is empty"
            description="Save videos here to watch them later."
          />
        ) : (
          <>
            <div className="space-y-2.5">
              {videos.map((video) => (
                <VideoRowCard
                  key={video._id || video.id}
                  video={{
                    ...video,
                    channelName: video.channel?.name || "Unknown channel",
                    durationText: video.duration
                      ? formatTime(video.duration)
                      : undefined,
                  }}
                  onClick={handleOpen}
                  action={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(video._id || video.id);
                      }}
                      className="rounded-full p-2 text-zinc-500 opacity-0 transition-all hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100 focus-visible:opacity-100"
                      title="Remove from Watch Later"
                    >
                      <X size={16} />
                    </button>
                  }
                />
              ))}
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

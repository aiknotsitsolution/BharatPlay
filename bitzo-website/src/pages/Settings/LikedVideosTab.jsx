import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { API_USERVIDEO } from "../../config/api";
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

export default function LikedVideosTab({ openDetail }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const fetchLiked = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(
          `${API_USERVIDEO}/liked?page=${pageNum}&limit=${PAGE_SIZE}`,
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
    fetchLiked(page);
  }, [page, fetchLiked]);

  const handleOpen = (video) => {
    if (typeof openDetail === "function") {
      openDetail(video);
      return;
    }
    navigate(`/video/${video._id || video.id}`, { state: { video } });
  };

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        icon={Heart}
        title="Liked Videos"
        count={!loading && !error ? videos.length : undefined}
      />

      <div className="mt-5">
        {loading ? (
          <VideoRowCardSkeletonStack count={4} />
        ) : error === "auth" ? (
          <SettingsAuthState
            icon={Heart}
            title="Sign in to see your liked videos"
          />
        ) : error ? (
          <SettingsErrorState onRetry={() => fetchLiked(page)} />
        ) : videos.length === 0 ? (
          <SettingsEmptyState
            icon={Heart}
            title="No liked videos yet"
            description="Tap the heart on any video to save it here."
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
                  }}
                  onClick={handleOpen}
                  badge={
                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                      <Heart size={12} className="fill-red-500" />
                      {(video.likesCount ?? video.likes ?? 0).toLocaleString()}
                    </span>
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

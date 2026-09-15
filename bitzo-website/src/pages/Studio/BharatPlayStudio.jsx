import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Plus,
  Eye,
  Heart,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { API_USERVIDEO, API_ORIGIN } from "../../config/api";
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

const PAGE_SIZE = 10;

const STATUSES = {
  active: { label: "Active", classes: "bg-green-500/15 text-green-400 border border-green-500/30" },
  disabled: { label: "Disabled", classes: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
};

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function EditModal({ video, onClose, onSaved }) {
  const [title, setTitle] = useState(video.title || "");
  const [description, setDescription] = useState(video.description || "");
  const [videoType, setVideoType] = useState(
    Array.isArray(video.videoType) ? video.videoType[0] : video.videoType || "long",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_ORIGIN}/api/adminvideo/update/${video._id || video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type: videoType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Video updated");
        onSaved();
        onClose();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#1a1a1a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Edit Video</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-zinc-300">
              Title
            </label>
            <input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              placeholder="Video title"
            />
          </div>

          <div>
            <label htmlFor="edit-desc" className="mb-1 block text-sm font-medium text-zinc-300">
              Description
            </label>
            <textarea
              id="edit-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              placeholder="Video description"
            />
          </div>

          <div>
            <label htmlFor="edit-type" className="mb-1 block text-sm font-medium text-zinc-300">
              Type
            </label>
            <select
              id="edit-type"
              value={videoType}
              onChange={(e) => setVideoType(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
            >
              <option value="long">Long Video</option>
              <option value="short">Short</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ video, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(
        `${API_ORIGIN}/api/adminvideo/my-video/${video._id || video.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Video deleted");
        onDeleted();
        onClose();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#1a1a1a] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Delete Video</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-6">
          Are you sure you want to delete &quot;{video.title}&quot;? This action
          cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BharatPlayStudio() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deletingVideo, setDeletingVideo] = useState(null);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const fetchVideos = useCallback(
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
    fetchVideos(page);
  }, [page, fetchVideos]);

  const handleVideoRemoved = (videoId) => {
    setVideos((prev) => prev.filter((v) => (v._id || v.id) !== videoId));
    setTotal((prev) => Math.max(prev - 1, 0));
  };

  const handleVideoUpdated = () => {
    fetchVideos(page);
  };

  // Derive stats from current page data
  const stats = {
    totalVideos: total,
    totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
    totalLikes: videos.reduce((sum, v) => sum + (v.likesCount || 0), 0),
    activeCount: videos.filter((v) => v.status === "active").length,
  };

  return (
    <SettingsPageShell>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Bharat Play Studio
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your videos, track performance, and grow your audience.
          </p>
        </div>
        <button
          onClick={() => navigate("/uploadvideo")}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          <Plus size={16} />
          Upload Video
        </button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[
            { label: "Total Videos", value: formatCount(stats.totalVideos) },
            { label: "Total Views", value: formatCount(stats.totalViews) },
            { label: "Total Likes", value: formatCount(stats.totalLikes) },
            {
              label: "Active",
              value: formatCount(stats.activeCount),
              accent: true,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3.5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <p
                className={`mt-1 text-xl font-bold tabular-nums ${
                  stat.accent ? "text-green-400" : "text-white"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <>
            {/* Stat skeleton */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-shimmer rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-4 py-3.5"
                >
                  <div className="h-3 w-16 rounded bg-zinc-800" />
                  <div className="mt-2 h-6 w-12 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
            <VideoRowCardSkeletonStack count={5} />
          </>
        ) : error === "auth" ? (
          <SettingsAuthState
            icon={Video}
            title="Sign in to access Bharat Play Studio"
          />
        ) : error ? (
          <SettingsErrorState onRetry={() => fetchVideos(page)} />
        ) : videos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60">
              <Video size={28} className="text-zinc-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-medium text-zinc-300">No videos yet</h3>
            <p className="mt-1.5 text-sm text-zinc-500">
              Upload your first video and start building your audience.
            </p>
            <button
              onClick={() => navigate("/uploadvideo")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              <Plus size={14} />
              Upload Video
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {videos.map((video) => {
                const videoId = video._id || video.id;
                const statusInfo =
                  STATUSES[video.status] || STATUSES.active;

                return (
                  <VideoRowCard
                    key={videoId}
                    video={{
                      ...video,
                      channelName:
                        video.channelName || video.channel?.name || "Unknown channel",
                    }}
                    onClick={() =>
                      navigate(`/video/${videoId}`, { state: { video } })
                    }
                    badge={
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.classes}`}
                      >
                        {statusInfo.label}
                      </span>
                    }
                    meta={
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Eye size={12} />
                          {formatCount(video.views)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart size={12} />
                          {formatCount(video.likesCount)}
                        </span>
                        {video.createdAt && (
                          <span>
                            {new Date(video.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    }
                    action={
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/video/${videoId}`, { state: { video } });
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVideo(video);
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingVideo(video);
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

      {/* Modals */}
      {editingVideo && (
        <EditModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSaved={handleVideoUpdated}
        />
      )}
      {deletingVideo && (
        <DeleteConfirm
          video={deletingVideo}
          onClose={() => setDeletingVideo(null)}
          onDeleted={() => handleVideoRemoved(deletingVideo._id || deletingVideo.id)}
        />
      )}
    </SettingsPageShell>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Edit,
  Video as VideoIcon,
  ChevronDown,
  Plus,
  Play,
  Users,
  Search,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { API_BASE, API_ORIGIN } from "../../config/api";
import { authFetch } from "../../utils/session";
import {
  uploadVideoMultipart,
  uploadVideoThumbnail,
} from "../../utils/multipartVideoUpload";
import {
  filterChannelVideos,
  isShortVideo,
} from "./channelVideoSearch";
import AdaptiveVideo from "../player/AdaptiveVideo";
import {
  uploadFailed,
  uploadProgressUpdated,
  uploadStarted,
  uploadSucceeded,
} from "../../features/upload/uploadSlice";

// API base URLs
const API_CATEGORY = `${API_BASE}/category`;
const BACKEND_URL = API_ORIGIN;

// Helpers
const getToken = () => localStorage.getItem("token") || null;
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.id || user?._id || null;
};

// Valid MongoDB ObjectId check (24 hex characters)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));
const PROCESSING_POLL_INTERVAL_MS = 5000;
const PROCESSING_POLL_ATTEMPTS = 60;
const CHANNEL_VIDEO_PAGE_SIZE = 20;

const isCreativeCornerCategory = (cat) =>
  cat?.isCreativeCorner ||
  cat?.slug === "creative-corner" ||
  cat?.name?.toLowerCase() === "creative corner";

const readVideoDuration = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });

const getVideoId = (video) => video?._id || video?.id;

function ChannelVideoSearch({ value, onChange }) {
  return (
    <div
      role="search"
      aria-label="Search channel videos"
      className="relative w-full sm:max-w-sm"
    >
      <Search
        aria-hidden="true"
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search videos in this channel"
        placeholder="Search videos in this channel"
        className="h-11 w-full rounded-full border border-zinc-700 bg-zinc-900/90 pl-11 pr-11 text-sm text-white shadow-inner outline-none transition placeholder:text-zinc-500 hover:border-zinc-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear video search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function ChannelVideoActions({ isOpen, onToggle, onEdit, onDelete }) {
  return (
    <div
      className="absolute right-2 top-2 z-20 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Video actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-white hover:bg-black"
      >
        <MoreVertical size={19} />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1 min-w-36 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onEdit}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-white hover:bg-zinc-800"
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function OwnerChannelsGrid({
  channels,
  selectedChannelId,
  getThumbnailUrl,
  onSelect,
}) {
  if (!channels.length) {
    return (
      <p className="col-span-full py-10 text-center text-gray-400">
        This creator has no other channels yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((channel) => (
        <button
          key={channel._id}
          type="button"
          onClick={() => onSelect(channel._id)}
          aria-current={
            String(selectedChannelId) === String(channel._id) ? "page" : null
          }
          className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:border-zinc-600 hover:bg-zinc-800"
        >
          {channel.channelImage ? (
            <img
              src={getThumbnailUrl(channel.channelImage)}
              alt=""
              loading="lazy"
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xl font-bold">
              {channel.name?.charAt(0)?.toUpperCase() || "C"}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-semibold text-white">
              {channel.name}
            </span>
            <span className="mt-1 block text-sm text-zinc-400">
              {Number(
                channel.subscribersCount ?? channel.subscribedBy?.length ?? 0,
              ).toLocaleString()} subscribers
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function EditChannelVideoModal({
  video,
  channels,
  categories,
  categoriesLoading,
  getThumbnailUrl,
  onClose,
  onSaved,
}) {
  const initialCategoryId =
    typeof video.category === "object"
      ? video.category?._id || ""
      : video.category || "";
  const initialCategory = categories.find(
    (category) => String(category._id) === String(initialCategoryId),
  );
  const initialCreativeCorner = Boolean(
    video.isCreativeCorner || isCreativeCornerCategory(initialCategory),
  );
  const rawVideoType = Array.isArray(video.videoType)
    ? video.videoType[0]
    : video.videoType;
  const [channelId, setChannelId] = useState(
    String(video.channel?._id || video.channel || channels[0]?._id || ""),
  );
  const [title, setTitle] = useState(video.title || "");
  const [description, setDescription] = useState(video.description || "");
  const [videoCategory, setVideoCategory] = useState(
    initialCreativeCorner ? "creative-corner" : String(initialCategoryId),
  );
  const [videoType, setVideoType] = useState(
    rawVideoType === "long" ? "long" : "short",
  );
  const [hashtags, setHashtags] = useState(
    (video.hashtags || [])
      .map((hashtag) => `#${String(hashtag).replace(/^#+/, "")}`)
      .join(", "),
  );
  const [isCreativeCorner, setIsCreativeCorner] = useState(
    initialCreativeCorner,
  );
  const [videoFile, setVideoFile] = useState(null);
  const [videoFileDuration, setVideoFileDuration] = useState(0);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleVideoFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setVideoFile(file);
    setVideoFileDuration(file ? await readVideoDuration(file) : 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const token = getToken();
    const duration = videoFile
      ? videoFileDuration
      : Number(video.duration) || 0;
    const categoryIsCreative = categories.some(
      (category) =>
        (String(category._id) === String(videoCategory) ||
          (category.slug === "creative-corner" &&
            videoCategory === "creative-corner")) &&
        isCreativeCornerCategory(category),
    );
    const creativeCorner = isCreativeCorner || categoryIsCreative;
    if (!token) return setError("Please sign in again to edit this video.");
    if (!channelId) return setError("Select a channel.");
    if (!title.trim()) return setError("Video title is required.");
    if (
      videoCategory !== "creative-corner" &&
      !isValidObjectId(videoCategory)
    ) {
      return setError("Select a valid video category.");
    }
    if (creativeCorner && !hashtags.trim()) {
      return setError("Add at least one hashtag for Creative Corner videos.");
    }
    if (videoFile && !duration) {
      return setError("Video duration could not be read. Choose another file.");
    }
    if (
      duration > 0 &&
      ((videoType === "short" && duration > 60) ||
        (videoType === "long" && (duration < 60 || duration > 300)))
    ) {
      return setError(
        videoType === "short"
          ? "Short videos must be 60 seconds or shorter."
          : "Long videos must be between 1 and 5 minutes.",
      );
    }

    setSaving(true);
    try {
      const metadata = {
        name: title.trim(),
        description: description.trim(),
        category: videoCategory,
        videoType,
        duration,
        isCreativeCorner: creativeCorner,
        hashtags,
      };
      let updates = {
        title: metadata.name,
        description: metadata.description,
        category: videoCategory,
        videoType: [videoType],
        hashtags,
        isCreativeCorner: creativeCorner,
        channelId,
      };

      if (videoFile) {
        const uploadResult = await uploadVideoMultipart({
          api: API_BASE,
          channelId,
          token,
          file: videoFile,
          metadata,
          thumbnail: thumbnailFile,
          replaceVideoId: getVideoId(video),
          onProgress: setProgress,
        });
        updates = {
          ...updates,
          videoId: uploadResult.videoId,
          processingStatus: uploadResult.processingStatus,
        };
        toast.success("Video uploaded. Reprocessing has started.");
      } else {
        const thumbnail = thumbnailFile
          ? await uploadVideoThumbnail({
              api: API_BASE,
              token,
              videoId: getVideoId(video),
              file: thumbnailFile,
            })
          : {};
        const response = await authFetch(
          `${API_ORIGIN}/api/adminvideo/update/${getVideoId(video)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: metadata.name,
              description: metadata.description,
              category: metadata.category,
              videoType: metadata.videoType,
              duration: metadata.duration,
              isCreativeCorner: metadata.isCreativeCorner,
              hashtags: metadata.hashtags,
              channelId,
              ...thumbnail,
            }),
          },
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not update this video.");
        }
        updates.thumbnail = data.video?.thumbnail || video.thumbnail;
        toast.success("Video details updated");
      }

      onSaved(getVideoId(video), updates);
      onClose();
    } catch (error) {
      setError(error.message || "Could not update this video.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-channel-video-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-[#1a1a1a] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 id="edit-channel-video-title" className="text-lg font-semibold">
            Edit {isShortVideo(video) ? "Short" : "Video"} details
          </h2>
          <button
            type="button"
            aria-label="Close edit dialog"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {error && (
            <div className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="edit-video-channel"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Upload to channel
            </label>
            <select
              id="edit-video-channel"
              value={channelId}
              onChange={(event) => setChannelId(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
              required
            >
              {channels.map((channel) => (
                <option key={channel._id} value={channel._id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="edit-video-file"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Replace video file (optional)
            </label>
            <input
              id="edit-video-file"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              onChange={handleVideoFileChange}
              disabled={saving}
              className="w-full text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {videoFile
                ? `Selected: ${videoFile.name}`
                : "Leave empty to keep the current video."}
            </p>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              Video type
            </span>
            <div className="flex gap-3">
              {[
                { value: "short", label: "Short" },
                { value: "long", label: "Long video" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setVideoType(type.value)}
                  disabled={saving}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                    videoType === type.value
                      ? "bg-green-600 text-white"
                      : "border border-zinc-700 bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="edit-video-thumbnail"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Thumbnail
            </label>
            <input
              id="edit-video-thumbnail"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setThumbnailFile(file);
                setThumbnailPreview(file ? URL.createObjectURL(file) : "");
              }}
              disabled={saving}
              className="w-full text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white"
            />
            <img
              src={
                thumbnailPreview ||
                getThumbnailUrl(video.thumbnail || video.thumb)
              }
              alt="Video thumbnail preview"
              className="mt-2 h-32 w-full rounded-lg border border-zinc-700 object-cover"
            />
          </div>
          <div>
            <label
              htmlFor="channel-video-title"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Title
            </label>
            <input
              id="channel-video-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={150}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="channel-video-description"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Description
            </label>
            <textarea
              id="channel-video-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="edit-video-category"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Video category
            </label>
            <select
              id="edit-video-category"
              value={videoCategory}
              onChange={(event) => {
                setVideoCategory(event.target.value);
                const selected = categories.find(
                  (category) => String(category._id) === event.target.value,
                );
                setIsCreativeCorner(
                  Boolean(selected && isCreativeCornerCategory(selected)),
                );
              }}
              disabled={categoriesLoading || saving}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option
                  key={category._id}
                  value={
                    isCreativeCornerCategory(category)
                      ? "creative-corner"
                      : category._id
                  }
                >
                  {isCreativeCornerCategory(category)
                    ? "Other (Creative Corner)"
                    : category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isCreativeCorner}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setIsCreativeCorner(checked);
                  if (checked) setVideoCategory("creative-corner");
                  else setVideoCategory("");
                }}
                disabled={saving}
                className="h-4 w-4"
              />
              Creative Corner (Others)
            </label>
            {isCreativeCorner && (
              <input
                type="text"
                aria-label="Video hashtags"
                value={hashtags}
                onChange={(event) => setHashtags(event.target.value)}
                disabled={saving}
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white"
                placeholder="#Cooking, #Vlog"
              />
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {saving
                ? videoFile
                  ? `Uploading ${progress}%`
                  : "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteChannelVideoModal({ video, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await authFetch(
        `${API_ORIGIN}/api/adminvideo/my-video/${getVideoId(video)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not delete this video.");
      }

      toast.success(`${isShortVideo(video) ? "Short" : "Video"} deleted`);
      onDeleted(getVideoId(video));
      onClose();
    } catch (error) {
      toast.error(error.message || "Could not delete this video.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
      onClick={deleting ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-channel-video-title"
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#1a1a1a] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h2 id="delete-channel-video-title" className="text-lg font-semibold">
            Delete {isShortVideo(video) ? "Short" : "Video"}?
          </h2>
        </div>
        <p className="mb-6 text-sm text-zinc-400">
          &quot;{video.title || "Untitled"}&quot; will be permanently deleted.
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Static fallback categories
const STATIC_CATEGORIES = [
  { _id: "1", name: "Gaming" },
  {
    _id: "creative-corner",
    name: "Creative Corner",
    slug: "creative-corner",
    isCreativeCorner: true,
  },
];

export default function ChannelPage() {
  const { id: urlHandle } = useParams();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [publicOwnerChannels, setPublicOwnerChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [channel, setChannel] = useState(null);
  const [channelVideoPage, setChannelVideoPage] = useState(1);
  const [channelVideosHasMore, setChannelVideosHasMore] = useState(false);
  const [openVideoMenuId, setOpenVideoMenuId] = useState(null);
  const [loadingEditVideoId, setLoadingEditVideoId] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deletingVideo, setDeletingVideo] = useState(null);
  const [loadingMoreChannelVideos, setLoadingMoreChannelVideos] =
    useState(false);
  const channelVideoRequestId = useRef(0);
  const [isPublicChannel, setIsPublicChannel] = useState(false);
  const [channelsFetchSucceeded, setChannelsFetchSucceeded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Videos");
  const [videoTypeFilter, setVideoTypeFilter] = useState("all");
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  // Create channel modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPromptDismissed, setCreatePromptDismissed] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    channelDescription: "",
    category: "",
    hashtags: "",
    channelImageFile: null,
    channelImagePreview: "",
    channelBannerFile: null,
    channelBannerPreview: "",
    contactemail: "",
  });
  const [createError, setCreateError] = useState("");

  // Upload video modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadChannelId, setSelectedUploadChannelId] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [videoname, setVideoname] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoCategory, setVideoCategory] = useState("");
  const [videoHashtags, setVideoHashtags] = useState("");
  const [isCreativeCorner, setIsCreativeCorner] = useState(false);
  const [videoType, setVideoType] = useState("short");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const dispatch = useDispatch();
  const uploadProgress = useSelector((state) => state.upload.progress);

  // Video player modal
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);

  // Helpers
  const getVideoUrl = (videoPath) => {
    if (!videoPath) return "";
    if (videoPath.startsWith("http")) return videoPath;
    return `${BACKEND_URL}/${videoPath.replace(/\\/g, "/")}`;
  };

  const getThumbnailUrl = (thumbnailPath) => {
    if (!thumbnailPath) {
      return "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&h=450&fit=crop";
    }
    if (thumbnailPath.startsWith("http")) return thumbnailPath;
    return `${BACKEND_URL}/${thumbnailPath.replace(/\\/g, "/")}`;
  };

  const parseDurationToSeconds = (value) => {
    if (value === null || value === undefined || value === "") return null;

    if (typeof value === "number") return Number.isFinite(value) ? value : null;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const directNumber = Number(trimmed);
      if (!Number.isNaN(directNumber)) return directNumber;

      const colonParts = trimmed.split(":").map((part) => part.trim());
      if (colonParts.length === 2) {
        const [mins, secs] = colonParts;
        const minsNum = Number(mins);
        const secsNum = Number(secs);
        if (!Number.isNaN(minsNum) && !Number.isNaN(secsNum)) {
          return minsNum * 60 + secsNum;
        }
      }

      if (colonParts.length === 3) {
        const [hrs, mins, secs] = colonParts;
        const hrsNum = Number(hrs);
        const minsNum = Number(mins);
        const secsNum = Number(secs);
        if (
          !Number.isNaN(hrsNum) &&
          !Number.isNaN(minsNum) &&
          !Number.isNaN(secsNum)
        ) {
          return hrsNum * 3600 + minsNum * 60 + secsNum;
        }
      }

      const match = trimmed.match(
        /(\d+)\s*(h|hr|hrs|hour|hours)?\s*(\d+)\s*(m|min|mins|minute|minutes)?\s*(\d+)?\s*(s|sec|secs|second|seconds)?/i,
      );
      if (match) {
        const hours = Number(match[1] || 0);
        const mins = Number(match[3] || 0);
        const secs = Number(match[5] || 0);
        return hours * 3600 + mins * 60 + secs;
      }
    }

    return null;
  };

  const formatDuration = (value) => {
    const seconds = parseDurationToSeconds(value);
    if (seconds === null) return "--:--";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(API_CATEGORY);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        const apiCategories = Array.isArray(data) ? data : [];

        const validApiCategories = apiCategories.filter((cat) =>
          isValidObjectId(cat._id),
        );

        const hasCreativeCorner = validApiCategories.some((category) =>
          isCreativeCornerCategory(category),
        );

        if (validApiCategories.length > 0) {
          // Always ensure Creative Corner option is available via slug
          if (!hasCreativeCorner) {
            setCategories([
              ...validApiCategories,
              {
                _id: "creative-corner",
                name: "Creative Corner",
                slug: "creative-corner",
                isCreativeCorner: true,
              },
            ]);
          } else {
            setCategories(validApiCategories);
          }
        } else {
          setCategories(STATIC_CATEGORIES);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(STATIC_CATEGORIES);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch user's channels
  useEffect(() => {
    const fetchUserChannels = async () => {
      const token = getToken();
      try {
        setLoading(true);
        setChannel(null);
        setIsPublicChannel(false);
        setPublicOwnerChannels([]);
        setChannelsFetchSucceeded(false);
        let userChannels = [];
        if (token) {
          const res = await authFetch(`${API_BASE}/uservideo/channel`, {
          headers: { Authorization: `Bearer ${token}` },
        });

          if (!res.ok) throw new Error("Failed to fetch channels");

          const data = await res.json();
          userChannels = data.channels || [];
          setChannelsFetchSucceeded(true);
        }

        setChannels(userChannels);

        let initialChannelId = null;
        if (urlHandle) {
          const matched = userChannels.find(
            (ch) =>
              String(ch._id) === urlHandle ||
              ch.name?.replace(/\s+/g, "").toLowerCase() ===
                urlHandle.toLowerCase(),
          );
          if (matched) initialChannelId = matched._id;
        }

        const currentUserId = getUserId();
        if (
          !initialChannelId &&
          userChannels.length > 0 &&
          (urlHandle === "me" || String(urlHandle) === String(currentUserId))
        ) {
          initialChannelId = userChannels[0]._id || userChannels[0].id;
        }

        if (!initialChannelId && isValidObjectId(urlHandle)) {
          const publicRes = await authFetch(
            `${API_BASE}/uservideo/channel/${urlHandle}?page=1&limit=${CHANNEL_VIDEO_PAGE_SIZE}`,
          );
          const publicData = await publicRes.json();
          if (!publicRes.ok || !publicData.success || !publicData.channel) {
            throw new Error(
              publicData.message || "Channel could not be loaded.",
            );
          }

          const publicChannel = publicData.channel;
          const videos = publicData.videos || [];
          setPublicOwnerChannels(
            Array.isArray(publicData.ownerChannels)
              ? publicData.ownerChannels
              : [],
          );
          const videoCount =
            Number(publicData.total ?? publicChannel.videoCount) || videos.length;
          setChannel({
            ...publicChannel,
            handle:
              publicChannel.handle ||
              `@${publicChannel.name?.replace(/\s+/g, "") || publicChannel._id}`,
            avatar: publicChannel.channelImage || "",
            banner: publicChannel.channelBanner || "",
            description:
              publicChannel.description ||
              publicChannel.channeldescription ||
              "No description available",
            videos,
            videosCount: videoCount,
          });
          setChannelVideoPage(Number(publicData.page) || 1);
          setChannelVideosHasMore(Boolean(publicData.hasMore));
          setSelectedChannelId(publicChannel._id);
          setSubscribersCount(Number(publicChannel.subscribersCount) || 0);
          setIsSubscribed(Boolean(publicChannel.isSubscribed));
          setIsPublicChannel(true);
          return;
        }

        if (!initialChannelId && userChannels.length > 0) {
          initialChannelId = userChannels[0]._id;
        }

        setSelectedChannelId(initialChannelId);
      } catch (err) {
        console.error("Error fetching channels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserChannels();
  }, [urlHandle]);

  // Fetch selected channel + videos
  useEffect(() => {
    channelVideoRequestId.current += 1;
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId) return;

    let active = true;
    const fetchChannelVideos = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const selected = channels.find((c) => c._id === selectedChannelId);
        if (!selected) return;

        const videosRes = await authFetch(
          `${API_BASE}/uservideo/channel/${selectedChannelId}/videos?page=1&limit=${CHANNEL_VIDEO_PAGE_SIZE}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        let videos = [];
        let videosCount = 0;
        let hasMore = false;
        if (videosRes.ok) {
          const result = await videosRes.json();
          videos = result.videos || [];
          videosCount = Number(result.total) || videos.length;
          hasMore = Boolean(result.hasMore);
        }
        if (!active) return;

        const cleanHandle = selected.name?.replace(/\s+/g, "") || selected._id;

        const channelData = {
          ...selected,
          handle: `@${cleanHandle}`,
          avatar:
            selected.channelImage ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
          banner:
            selected.channelBanner ||
            "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600",
          description:
            selected.channeldescription || "No description available",
          videos,
          videosCount,
        };

        setChannel(channelData);
        setChannelVideoPage(1);
        setChannelVideosHasMore(hasMore);
        setSubscribersCount(selected.subscribedBy?.length || 0);
        setIsSubscribed(
          (selected.subscribedBy || []).some(
            (s) => String(s?._id || s) === String(getUserId()),
          ) || false,
        );

        navigate(`/channel/${cleanHandle}`, { replace: true });
      } catch (err) {
        console.error("Error fetching channel/videos:", err);
      }
    };

    fetchChannelVideos();
    return () => {
      active = false;
    };
  }, [selectedChannelId, channels, navigate]);

  const loadMoreChannelVideos = async () => {
    if (
      !selectedChannelId ||
      !channelVideosHasMore ||
      loadingMoreChannelVideos
    ) {
      return;
    }

    const token = getToken();
    const nextPage = channelVideoPage + 1;
    const channelId = selectedChannelId;
    const requestId = ++channelVideoRequestId.current;
    setLoadingMoreChannelVideos(true);
    try {
      const response = await authFetch(
        `${API_BASE}/uservideo/channel/${channelId}/videos?page=${nextPage}&limit=${CHANNEL_VIDEO_PAGE_SIZE}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load more channel videos.");
      }
      if (requestId !== channelVideoRequestId.current) return;

      const nextVideos = Array.isArray(data.videos) ? data.videos : [];
      setChannel((previous) => {
        if (!previous || String(previous._id) !== String(channelId)) {
          return previous;
        }
        const existingIds = new Set(
          (previous.videos || []).map((video) => String(video._id || video.id)),
        );
        return {
          ...previous,
          videos: [
            ...(previous.videos || []),
            ...nextVideos.filter(
              (video) => !existingIds.has(String(video._id || video.id)),
            ),
          ],
          videosCount: Number(data.total) || previous.videosCount,
        };
      });
      setChannelVideoPage(Number(data.page) || nextPage);
      setChannelVideosHasMore(Boolean(data.hasMore));
    } catch (error) {
      if (requestId !== channelVideoRequestId.current) return;
      console.error("Error loading more channel videos:", error);
      toast.error(error.message || "Failed to load more channel videos.");
    } finally {
      if (requestId === channelVideoRequestId.current) {
        setLoadingMoreChannelVideos(false);
      }
    }
  };

  useEffect(() => {
    if (
      getToken() &&
      channelsFetchSucceeded &&
      !isPublicChannel &&
      !loading &&
      !showCreateModal &&
      !createPromptDismissed &&
      channels.length === 0
    ) {
      setShowCreateModal(true);
    }
  }, [
    loading,
    channelsFetchSucceeded,
    createPromptDismissed,
    channels.length,
    isPublicChannel,
    showCreateModal,
  ]);

  // Handle Subscribe / Unsubscribe
  const handleSubscription = async () => {
    if (!selectedChannelId) return;

    const token = getToken();
    if (!token) {
      toast.error("Please login to subscribe");
      return;
    }

    const wasSubscribed = isSubscribed;
    setIsSubscribed((prev) => !prev);
    setSubscribersCount((prev) => Math.max(0, prev + (wasSubscribed ? -1 : 1)));

    try {
      const res = await authFetch(
        `${API_BASE}/uservideo/subscribe/${selectedChannelId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Subscription failed");

      setIsSubscribed(Boolean(result.subscribed));
      setSubscribersCount(result.subscribersCount);
      toast.success(result.subscribed ? "Subscribed" : "Unsubscribed");

      setChannel((prev) => ({
        ...prev,
        subscribers: result.subscribersCount,
      }));
    } catch (error) {
      console.error("Subscription error:", error);
      setIsSubscribed(wasSubscribed);
      setSubscribersCount((prev) =>
        Math.max(0, prev + (wasSubscribed ? 1 : -1)),
      );
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleChannelChange = (channelId) => {
    setSelectedChannelId(channelId);
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setNewChannel((prev) => ({
        ...prev,
        [`${field}File`]: file,
        [`${field}Preview`]: previewUrl,
      }));
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    const token = getToken();

    if (!token) {
      setCreateError("Please login first.");
      return;
    }

    if (!newChannel.name.trim()) {
      setCreateError("Channel name is required");
      return;
    }

    if (!newChannel.category) {
      setCreateError("Please select a category");
      return;
    }

    // Allow "creative-corner" slug OR valid ObjectId
    if (
      newChannel.category !== "creative-corner" &&
      !isValidObjectId(newChannel.category)
    ) {
      setCreateError("Invalid category selected");
      return;
    }

    const isCreative =
      newChannel.category === "creative-corner" ||
      categories.some(
        (cat) =>
          String(cat._id) === String(newChannel.category) &&
          isCreativeCornerCategory(cat),
      );

    if (isCreative && !newChannel.hashtags.trim()) {
      setCreateError("Add at least one hashtag for Other (Creative Corner)");
      return;
    }

    try {
      setCreateError("");
      setCreating(true);

      const formData = new FormData();
      formData.append("name", newChannel.name.trim());
      formData.append(
        "channeldescription",
        newChannel.channelDescription || "",
      );
      formData.append("category", newChannel.category);
      formData.append("hashtags", newChannel.hashtags);
      formData.append("contactemail", newChannel.contactemail || "");

      if (newChannel.channelImageFile) {
        formData.append("channelImage", newChannel.channelImageFile);
      }
      if (newChannel.channelBannerFile) {
        formData.append("channelBanner", newChannel.channelBannerFile);
      }

      const response = await authFetch(`${API_BASE}/uservideo/createchannel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to create channel",
        );
      }

      // Refetch channels
      const channelsRes = await authFetch(`${API_BASE}/uservideo/channel`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(data.channels || []);
        if (result.channel?._id) {
          setSelectedChannelId(result.channel._id);
        }
      }

      setShowCreateModal(false);
      setNewChannel({
        name: "",
        channelDescription: "",
        category: "",
        hashtags: "",
        channelImageFile: null,
        channelImagePreview: "",
        channelBannerFile: null,
        channelBannerPreview: "",
        contactemail: "",
      });

      toast.success("Channel created successfully!");
    } catch (error) {
      console.error("Channel creation error:", error);
      setCreateError(error.message || "Failed to create channel.");
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatePromptDismissed(true);
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    const token = getToken();

    if (!token) {
      setUploadError("Please login first.");
      return;
    }

    if (!selectedUploadChannelId) {
      setUploadError("Please select a channel");
      return;
    }

    if (!videoFile) {
      setUploadError("Please select a video file");
      return;
    }

    if (!videoname.trim()) {
      setUploadError("Please enter a video name");
      return;
    }

    if (!videoCategory) {
      setUploadError("Please select a video category");
      return;
    }

    // Allow "creative-corner" slug OR valid ObjectId
    if (
      videoCategory !== "creative-corner" &&
      !isValidObjectId(videoCategory)
    ) {
      setUploadError("Invalid category selected");
      return;
    }

    if (isCreativeCorner && !videoHashtags.trim()) {
      setUploadError("Add at least one hashtag for Creative Corner videos");
      return;
    }

    if (!agreeTerms) {
      setUploadError("Please agree to the terms");
      return;
    }

    try {
      setUploading(true);
      dispatch(uploadStarted());
      setUploadError("");
      const uploadChannelId = selectedUploadChannelId;
      const duration = await readVideoDuration(videoFile);
      if (!duration) {
        throw new Error("Video duration could not be read. Choose another file.");
      }
      if (videoType === "short" && duration > 60) {
        throw new Error("Short videos must be 60 seconds or shorter.");
      }
      if (videoType === "long" && (duration < 60 || duration > 300)) {
        throw new Error("Long videos must be between 1 and 5 minutes.");
      }

      const uploadResult = await uploadVideoMultipart({
        api: API_BASE,
        channelId: uploadChannelId,
        token,
        file: videoFile,
        metadata: {
          name: videoname.trim(),
          description: videoDescription || "",
          category: videoCategory,
          videoType,
          duration,
          isCreativeCorner,
          hashtags: videoHashtags,
        },
        thumbnail: thumbnailFile,
        onProgress: (progress) => dispatch(uploadProgressUpdated(progress)),
      });

      toast.success("Video uploaded. Processing has started.");
      dispatch(uploadSucceeded());

      const refreshUploadedChannelVideos = async () => {
        const videosRes = await authFetch(
          `${API_BASE}/uservideo/channel/${uploadChannelId}/videos?page=1&limit=${CHANNEL_VIDEO_PAGE_SIZE}`,
          {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!videosRes.ok) return [];

        const data = await videosRes.json();
        const videos = data.videos || [];
        setChannel((prev) =>
          prev && String(prev._id) === String(uploadChannelId)
            ? {
                ...prev,
                videos,
                videosCount: Number(data.total) || videos.length,
              }
            : prev,
        );
        setChannelVideoPage(Number(data.page) || 1);
        setChannelVideosHasMore(Boolean(data.hasMore));
        return videos;
      };

      await refreshUploadedChannelVideos();

      if (uploadResult.videoId && uploadResult.processingStatus !== "ready") {
        const waitForVideoProcessing = async () => {
          for (let attempt = 0; attempt < PROCESSING_POLL_ATTEMPTS; attempt += 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, PROCESSING_POLL_INTERVAL_MS),
            );
            const statusRes = await authFetch(
              `${API_BASE}/uservideo/upload/${uploadChannelId}/multipart/${uploadResult.videoId}`,
              {
                cache: "no-store",
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (!statusRes.ok) {
              throw new Error(
                `Video processing status check failed (${statusRes.status}).`,
              );
            }

            const status = await statusRes.json();
            if (status.processingStatus === "failed") {
              toast.error(
                "Video processing failed. Please try uploading it again.",
              );
              return;
            }
            if (status.processingStatus !== "ready") continue;

            for (let refreshAttempt = 0; refreshAttempt < 5; refreshAttempt += 1) {
              const videos = await refreshUploadedChannelVideos();
              if (
                videos.some(
                  (video) =>
                    String(video._id || video.id) ===
                    String(uploadResult.videoId),
                )
              ) {
                toast.success("Video processing complete. It is now on your channel.");
                return;
              }
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            toast.info(
              "Video is ready. Reload your channel if it is not visible yet.",
            );
            return;
          }
          toast.info(
            "Video is still processing. It will appear on your channel when ready.",
          );
        };

        void waitForVideoProcessing().catch((error) => {
          console.error("Video processing status check failed:", error);
          toast.error(
            "Upload finished, but the channel could not be refreshed. Reload it later.",
          );
        });
      }

      // Reset form
      setShowUploadModal(false);
      setVideoFile(null);
      setVideoPreview("");
      setThumbnailFile(null);
      setThumbnailPreview("");
      setVideoname("");
      setVideoDescription("");
      setVideoCategory("");
      setVideoHashtags("");
      setIsCreativeCorner(false);
      setVideoType("short");
      setAgreeTerms(false);
      setSelectedUploadChannelId("");
    } catch (error) {
      console.error("Video upload error:", error);
      const message =
        error.message || "Failed to upload video. Please try again.";
      dispatch(uploadFailed(message));
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handlePlayVideo = (video) => {
    const videoId = video?._id || video?.id;
    if (!videoId) {
      toast.error("Unable to open this video.");
      return;
    }

    if (isShortVideo(video)) {
      navigate(`/shorts/${videoId}`, {
        state: {
          video: {
            ...video,
            id: videoId,
            videoUrl: video.videoUrl || video.videofile || video.url || "",
            thumbnail: video.thumbnail || video.thumb || "",
          },
        },
      });
      return;
    }

    navigate(`/video/${videoId}`, {
      state: {
        video: {
          ...video,
          id: videoId,
        },
      },
    });
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setCurrentVideo(null);
    setVideoDuration(null);
  };

  const handleEditChannelVideo = async (video) => {
    const videoId = getVideoId(video);
    if (!videoId) {
      toast.error("Could not find this video.");
      return;
    }

    setOpenVideoMenuId(null);
    setLoadingEditVideoId(String(videoId));
    try {
      const response = await authFetch(`${API_BASE}/uservideo/${videoId}`);
      const data = await response.json();
      if (!response.ok || !data.success || !data.video) {
        throw new Error(data.message || "Could not load video details.");
      }
      setEditingVideo({ ...video, ...data.video });
    } catch (error) {
      toast.error(error.message || "Could not load video details.");
    } finally {
      setLoadingEditVideoId(null);
    }
  };

  const handleChannelVideoSaved = (videoId, updates) => {
    const currentChannelId = selectedChannelId || channel?._id;
    const destinationChannelId = updates.channelId || currentChannelId;
    if (String(destinationChannelId) !== String(currentChannelId)) {
      handleChannelVideoDeleted(videoId);
      navigate(`/channel/${destinationChannelId}`);
    } else {
      setChannel((previous) =>
        previous
          ? {
              ...previous,
              videos: previous.videos.map((video) =>
                String(getVideoId(video)) === String(videoId)
                  ? { ...video, ...updates }
                  : video,
              ),
            }
          : previous,
      );
    }

    if (
      updates.videoId &&
      updates.processingStatus &&
      updates.processingStatus !== "ready"
    ) {
      const token = getToken();
      void (async () => {
        for (let attempt = 0; attempt < PROCESSING_POLL_ATTEMPTS; attempt += 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, PROCESSING_POLL_INTERVAL_MS),
          );
          const statusResponse = await authFetch(
            `${API_BASE}/uservideo/upload/${destinationChannelId}/multipart/${updates.videoId}`,
            {
              cache: "no-store",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );
          if (!statusResponse.ok) {
            throw new Error(
              `Video processing status check failed (${statusResponse.status}).`,
            );
          }
          const status = await statusResponse.json();
          if (status.processingStatus === "failed") {
            toast.error(
              status.processingError ||
                "Video processing failed. The previous video is still available.",
            );
            return;
          }
          if (status.processingStatus !== "ready") continue;

          const videosResponse = await authFetch(
            `${API_BASE}/uservideo/channel/${destinationChannelId}/videos?page=1&limit=${CHANNEL_VIDEO_PAGE_SIZE}`,
            {
              cache: "no-store",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );
          if (!videosResponse.ok) {
            throw new Error("Replacement is ready, but the channel refresh failed.");
          }
          const data = await videosResponse.json();
          setChannel((previous) =>
            previous &&
            String(previous._id) === String(destinationChannelId)
              ? {
                  ...previous,
                  videos: data.videos || [],
                  videosCount: Number(data.total) || 0,
                }
              : previous,
          );
          setChannelVideoPage(Number(data.page) || 1);
          setChannelVideosHasMore(Boolean(data.hasMore));
          toast.success("Video replacement is ready.");
          return;
        }
        toast.info(
          "Video is still processing. It will update on your channel when ready.",
        );
      })().catch((error) => {
        console.error("Video replacement status check failed:", error);
        toast.error(
          error.message || "Video replacement status could not be checked.",
        );
      });
    }
  };

  const handleChannelVideoDeleted = (videoId) => {
    setChannel((previous) =>
      previous
        ? {
            ...previous,
            videos: previous.videos.filter(
              (video) => String(getVideoId(video)) !== String(videoId),
            ),
            videosCount: Math.max(
              0,
              (previous.videosCount ?? previous.videos.length) - 1,
            ),
          }
        : previous,
    );
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">Loading channels...</div>
    );
  }

  const currentChannel = channel || {
    name: "Your channel",
    handle: "@yourchannel",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    banner: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600",
    description: "Create your channel to get started.",
    videos: [],
    category: { name: "" },
  };
  const canManageChannelVideos = channels.some(
    (item) => String(item._id) === String(currentChannel._id),
  );
  const creatorId =
    currentChannel.creator?._id ||
    currentChannel.creator?.id ||
    currentChannel.creator;
  const isOwnChannel =
    canManageChannelVideos ||
    Boolean(getUserId() && String(creatorId) === String(getUserId()));

  const tabs = ["Videos", "Channels"];
  const displayedChannels = isPublicChannel
    ? publicOwnerChannels
    : channels;
  const selectOwnerChannel = (channelId) => {
    setActiveTab("Videos");
    if (channels.some((item) => String(item._id) === String(channelId))) {
      handleChannelChange(channelId);
    } else {
      navigate(`/channel/${channelId}`);
    }
  };

  // Categories for dropdown (include creative-corner even if static)
  const displayCategories = categories.filter(
    (cat) => isValidObjectId(cat._id) || isCreativeCornerCategory(cat),
  );
  const channelVideos = currentChannel.videos || [];
  const filteredChannelVideos = filterChannelVideos(
    channelVideos,
    videoTypeFilter,
    channelSearchQuery,
  );

  if (isPublicChannel) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 text-white md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative h-40 overflow-hidden rounded-2xl bg-zinc-800 md:h-64">
            {currentChannel.banner ? (
              <img
                src={getThumbnailUrl(currentChannel.banner)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-4 py-6">
            {currentChannel.avatar ? (
              <img
                src={getThumbnailUrl(currentChannel.avatar)}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-700 text-3xl font-bold">
                {currentChannel.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold md:text-3xl">
                {currentChannel.name}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {subscribersCount.toLocaleString()} subscribers
              </p>
              {currentChannel.description ? (
                <p className="mt-2 max-w-3xl text-sm text-gray-300">
                  {currentChannel.description}
                </p>
              ) : null}
            </div>
            {!isOwnChannel && (
              <button
                type="button"
                onClick={handleSubscription}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  isSubscribed
                    ? "bg-zinc-700 hover:bg-zinc-600"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>
          <div className="mb-6 flex gap-6 border-b border-zinc-800">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-2 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? "border-white text-white"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === "Videos" && (
            <section>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Filter channel videos by type"
                >
                  {[
                    { value: "all", label: "All" },
                    { value: "long", label: "Videos" },
                    { value: "short", label: "Shorts" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setVideoTypeFilter(filter.value)}
                      aria-pressed={videoTypeFilter === filter.value}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        videoTypeFilter === filter.value
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <ChannelVideoSearch
                  value={channelSearchQuery}
                  onChange={setChannelSearchQuery}
                />
              </div>
              {filteredChannelVideos.length ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filteredChannelVideos.map((video) => (
                    <button
                      key={getVideoId(video)}
                      type="button"
                      onClick={() => handlePlayVideo(video)}
                      className="overflow-hidden rounded-xl bg-zinc-900 text-left transition hover:bg-zinc-800"
                    >
                      <img
                        src={getThumbnailUrl(video.thumbnail || video.thumb)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-video w-full object-cover"
                      />
                      <span className="block line-clamp-2 p-3 text-sm font-medium">
                        {video.title || "Untitled video"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-gray-400">
                  {channelSearchQuery.trim()
                    ? (
                        <>
                          No videos match "{channelSearchQuery.trim()}".
                          {channelVideosHasMore && (
                            <span className="mt-1 block text-sm text-zinc-500">
                              Load more to include older uploads.
                            </span>
                          )}
                        </>
                      )
                    : channelVideos.length
                      ? `This channel has no ${videoTypeFilter === "short" ? "Shorts" : "videos"} yet.`
                      : "This channel has no videos yet."}
                </p>
              )}
              {channelVideosHasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreChannelVideos}
                    disabled={loadingMoreChannelVideos}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {loadingMoreChannelVideos && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {loadingMoreChannelVideos
                      ? "Loading videos..."
                      : "Load more"}
                  </button>
                </div>
              )}
            </section>
          )}
          {activeTab === "Channels" && (
            <OwnerChannelsGrid
              channels={displayedChannels}
              selectedChannelId={currentChannel._id}
              getThumbnailUrl={getThumbnailUrl}
              onSelect={selectOwnerChannel}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-20">
      {/* Banner + Profile Header */}
      <div className="relative">
        <div className="relative h-[clamp(180px,28vw,360px)] overflow-hidden bg-[#111]">
          <img
            src={currentChannel.banner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
          <img
            src={currentChannel.banner}
            alt={`${currentChannel.name} channel banner`}
            className="relative z-[1] h-full w-full object-contain"
          />
        </div>

        <div className="px-6 md:px-12 lg:px-24 -mt-20 md:-mt-28 relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#0f0f0f] overflow-hidden bg-gray-800 shadow-2xl">
            <img
              src={currentChannel.avatar}
              alt="Channel avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex flex-wrap gap-4 mt-5">
              <button
                onClick={() => {
                  if (selectedChannelId) {
                    localStorage.setItem("selectedChannelId", selectedChannelId);
                  }
                  navigate("/channel/customize", {
                    state: { channelId: selectedChannelId },
                  });
                }}
                className="px-6 py-2.5 bg-[#272727] hover:bg-[#3a3a3a] rounded-full flex items-center gap-2 transition"
              >
                <Edit size={18} />
                Customize channel
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-full flex items-center gap-2 transition"
              >
                <VideoIcon size={18} />
                Upload video
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center gap-2 transition"
              >
                <Plus size={18} />
                Create channel
              </button>
            </div>
          </div>
        </div>

        {/* Channel Info Section */}
        <div className="px-6 md:px-12 lg:px-24 mt-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            {currentChannel.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-3 text-gray-400">
            {currentChannel.handle && (
              <span className="text-lg">{currentChannel.handle}</span>
            )}

            {!isOwnChannel && (
              <button
                onClick={handleSubscription}
                className={`px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-all ${
                  isSubscribed
                    ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                <Users size={18} />
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}

            <span className="text-lg font-medium">
              {subscribersCount.toLocaleString()} subscribers
            </span>

            {currentChannel.category?.name && (
              <span className="text-sm bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                {currentChannel.category.name}
              </span>
            )}
          </div>

          {currentChannel.description && (
            <p className="text-gray-400 mt-4 max-w-3xl text-[15px] leading-relaxed">
              {currentChannel.description}
            </p>
          )}
        </div>
      </div>

      {/* Tabs + Channel Switcher */}
      <div className="px-6 md:px-12 lg:px-24 mt-10 border-b border-gray-700">
        <div className="flex gap-10 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-medium text-base whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {channels.length > 0 && (
          <div className="mt-6 pb-4">
            <label className="text-sm text-gray-400 block mb-1.5">
              Switch channel
            </label>
            <div className="relative inline-block w-full max-w-xs">
              <select
                value={selectedChannelId || ""}
                onChange={(e) => handleChannelChange(e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white appearance-none pr-10 focus:outline-none focus:border-blue-500 text-sm"
              >
                {channels.map((ch) => (
                  <option key={ch._id} value={ch._id}>
                    {ch.name} (@{ch.name?.replace(/\s+/g, "") || ch._id})
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="px-6 md:px-12 lg:px-24 py-10">
        {activeTab === "Videos" && (
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="Filter channel videos by type"
              >
                {[
                  {
                    value: "all",
                    label: `All (${currentChannel.videosCount ?? channelVideos.length})`,
                  },
                  { value: "long", label: "Videos" },
                  { value: "short", label: "Shorts" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setVideoTypeFilter(filter.value)}
                    aria-pressed={videoTypeFilter === filter.value}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      videoTypeFilter === filter.value
                        ? "bg-white text-black"
                        : "bg-[#272727] text-gray-300 hover:bg-[#3a3a3a] hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <ChannelVideoSearch
                value={channelSearchQuery}
                onChange={setChannelSearchQuery}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 md:gap-6">
              {filteredChannelVideos.length > 0 ? (
                filteredChannelVideos.map((video) => (
                  <div
                    key={getVideoId(video)}
                    className="cursor-pointer group"
                    onClick={() => handlePlayVideo(video)}
                  >
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg">
                      <img
                        src={getThumbnailUrl(video.thumbnail)}
                        alt={video.title || video.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                          <Play
                            size={28}
                            fill="white"
                            className="text-white ml-1"
                          />
                        </div>
                      </div>
                      {canManageChannelVideos && (
                        <ChannelVideoActions
                          isOpen={
                            openVideoMenuId === String(getVideoId(video))
                          }
                          onToggle={() =>
                            setOpenVideoMenuId((openId) =>
                              openId === String(getVideoId(video))
                                ? null
                                : String(getVideoId(video)),
                            )
                          }
                          onEdit={() => handleEditChannelVideo(video)}
                          onDelete={() => {
                            setOpenVideoMenuId(null);
                            setDeletingVideo(video);
                          }}
                        />
                      )}
                      {loadingEditVideoId === String(getVideoId(video)) && (
                        <div className="absolute left-2 top-2 rounded-full bg-black/75 p-2">
                          <Loader2
                            size={16}
                            className="animate-spin"
                            aria-label="Loading video details"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {video.title || video.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1.5">
                        {video.views?.toLocaleString() || 0} views •{" "}
                        {video.uploaded || "recent"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-10 col-span-full">
                  {channelSearchQuery.trim()
                    ? (
                        <>
                          No videos match "{channelSearchQuery.trim()}".
                          {channelVideosHasMore && (
                            <span className="mt-1 block text-sm text-zinc-500">
                              Load more to include older uploads.
                            </span>
                          )}
                        </>
                      )
                    : channelVideos.length === 0
                      ? "No videos yet"
                      : `No ${videoTypeFilter === "short" ? "Shorts" : "long videos"} yet`}
                </p>
              )}
            </div>
            {channelVideosHasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadMoreChannelVideos}
                  disabled={loadingMoreChannelVideos}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {loadingMoreChannelVideos && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {loadingMoreChannelVideos ? "Loading videos..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "Channels" && (
          <OwnerChannelsGrid
            channels={displayedChannels}
            selectedChannelId={currentChannel._id}
            getThumbnailUrl={getThumbnailUrl}
            onSelect={selectOwnerChannel}
          />
        )}

        {activeTab === "Posts" && (
          <p className="text-center text-gray-400 py-20 text-lg">
            No community posts yet
          </p>
        )}
      </div>

      {editingVideo && (
        <EditChannelVideoModal
          video={editingVideo}
          channels={channels}
          categories={displayCategories}
          categoriesLoading={categoriesLoading}
          getThumbnailUrl={getThumbnailUrl}
          onClose={() => setEditingVideo(null)}
          onSaved={handleChannelVideoSaved}
        />
      )}
      {deletingVideo && (
        <DeleteChannelVideoModal
          video={deletingVideo}
          onClose={() => setDeletingVideo(null)}
          onDeleted={handleChannelVideoDeleted}
        />
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && currentVideo && (
        <div
          className="fixed inset-0 bg-black/95 z-50 p-4 overflow-y-auto"
          onClick={handleCloseVideoPlayer}
        >
          <div
            className="mx-auto w-full max-w-6xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {currentVideo.title || currentVideo.name}
              </h2>
              <button
                onClick={handleCloseVideoPlayer}
                className="text-white hover:text-gray-300 text-3xl font-bold"
                aria-label="Close video player"
              >
                ×
              </button>
            </div>

            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <AdaptiveVideo
                className="w-full max-h-[70vh] object-contain"
                controls
                autoPlay
                playsInline
                src={getVideoUrl(currentVideo.videofile || currentVideo.videoUrl)}
                onLoadedMetadata={(e) => {
                  const duration = e.currentTarget.duration;
                  if (Number.isFinite(duration) && duration > 0) {
                    setVideoDuration(duration);
                  }
                }}
              >
                Your browser does not support the video tag.
              </AdaptiveVideo>
            </div>

            <div className="mt-4 bg-[#1a1a1a] rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3 text-gray-400">
                <span>{currentVideo.views?.toLocaleString() || 0} views</span>
                <span>•</span>
                <span>
                  {new Date(currentVideo.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>
                  Duration:{" "}
                  {formatDuration(currentVideo.duration || videoDuration)}
                </span>
              </div>

              {currentVideo.description && (
                <div className="mt-3">
                  <p className="text-gray-300">{currentVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md p-5 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create a new channel</h2>

            {createError && (
              <div className="bg-red-500/20 text-red-400 p-2.5 rounded mb-4 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateChannel} className="space-y-3.5">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Channel name *
                </label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="My Awesome Channel"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={newChannel.category}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, category: e.target.value })
                  }
                  disabled={categoriesLoading}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Select category</option>
                  {displayCategories.map((cat) => {
                    const isCreative = isCreativeCornerCategory(cat);
                    return (
                      <option
                        key={cat._id}
                        value={isCreative ? "creative-corner" : cat._id}
                      >
                        {isCreative ? "Other (Creative Corner)" : cat.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {(newChannel.category === "creative-corner" ||
                displayCategories.some(
                  (cat) =>
                    String(cat._id) === String(newChannel.category) &&
                    isCreativeCornerCategory(cat),
                )) && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Hashtags *
                  </label>
                  <input
                    type="text"
                    value={newChannel.hashtags}
                    onChange={(e) =>
                      setNewChannel({ ...newChannel, hashtags: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="#Cooking, #Vlog"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Channel Image (avatar)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "channelImage")}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {newChannel.channelImagePreview && (
                  <img
                    src={newChannel.channelImagePreview}
                    alt="Avatar preview"
                    className="mt-2 w-20 h-20 rounded-full object-cover border border-gray-600"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Channel Banner
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "channelBanner")}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {newChannel.channelBannerPreview && (
                  <img
                    src={newChannel.channelBannerPreview}
                    alt="Banner preview"
                    className="mt-2 w-full h-24 object-cover rounded-lg border border-gray-600"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newChannel.channelDescription}
                  onChange={(e) =>
                    setNewChannel({
                      ...newChannel,
                      channelDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 h-20 text-sm resize-none"
                  placeholder="Tell people about your channel..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Contact email (optional)
                </label>
                <input
                  type="email"
                  value={newChannel.contactemail}
                  onChange={(e) =>
                    setNewChannel({
                      ...newChannel,
                      contactemail: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="example@email.com"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                {uploading && (
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Video upload progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-gray-700"
                      role="progressbar"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={uploadProgress}
                    >
                      <div
                        className="h-full rounded-full bg-green-500 transition-[width] duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-full text-sm transition flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 size={15} className="animate-spin" />}
                  {creating ? "Creating..." : "Create channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md p-5 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Upload Video</h2>

            {uploadError && (
              <div className="bg-red-500/20 text-red-400 p-2.5 rounded mb-4 text-sm">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadVideo} className="space-y-3.5">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Upload to channel *
                </label>
                <select
                  value={selectedUploadChannelId}
                  onChange={(e) => setSelectedUploadChannelId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Select channel</option>
                  {channels.map((ch) => (
                    <option key={ch._id} value={ch._id}>
                      {ch.name} (@{ch.name?.replace(/\s+/g, "") || ch._id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Video file *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setVideoFile(file);
                      setVideoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  required
                />
                {videoPreview && (
                  <div className="mt-2 text-xs text-gray-400">
                    Selected: {videoFile?.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Video Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setVideoType("short")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      videoType === "short"
                        ? "bg-green-600 text-white"
                        : "bg-[#0f0f0f] border border-gray-700 text-gray-400 hover:bg-gray-800"
                    }`}
                  >
                    Short
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType("long")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      videoType === "long"
                        ? "bg-green-600 text-white"
                        : "bg-[#0f0f0f] border border-gray-700 text-gray-400 hover:bg-gray-800"
                    }`}
                  >
                    Long
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Thumbnail (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setThumbnailFile(file);
                      setThumbnailPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="mt-2 w-full h-28 object-cover rounded-lg border border-gray-600"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={videoname}
                  onChange={(e) => setVideoname(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Enter video title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Video Category *
                </label>
                <select
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value)}
                  disabled={categoriesLoading}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Select category</option>
                  {displayCategories.map((cat) => {
                    const isCreative = isCreativeCornerCategory(cat);
                    return (
                      <option
                        key={cat._id}
                        value={isCreative ? "creative-corner" : cat._id}
                      >
                        {isCreative ? "Other (Creative Corner)" : cat.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 h-20 text-sm resize-none"
                  placeholder="Describe your video..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={isCreativeCorner}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsCreativeCorner(checked);
                      if (checked) {
                        // Always send the special slug
                        setVideoCategory("creative-corner");
                      } else {
                        setVideoCategory("");
                      }
                    }}
                    className="w-4 h-4"
                  />
                  Creative Corner (Others)
                </label>
                {isCreativeCorner && (
                  <input
                    type="text"
                    value={videoHashtags}
                    onChange={(e) => setVideoHashtags(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="#Cooking, #Vlog"
                    required
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-gray-400">
                    I agree to the Terms of Service and confirm I own/have
                    rights to this content.
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadError("");
                  }}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-full text-sm transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {uploading ? `Uploading ${uploadProgress}%` : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

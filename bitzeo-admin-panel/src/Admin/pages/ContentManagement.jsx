import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Mail,
  User,
  Tv,
  Search,
  X,
} from "lucide-react";
import API, { API_BASE_URL } from "../../api";
import { hasFeature } from "../../config/roleConfig";
import { formatDateTime } from "../../utils/helpers";
import tableCustomStyles from "../../utils/tableStyles";
import PageHeader from "../../components/layout/PageHeader";



const MEDIA_BASE = API_BASE_URL.replace(/\/api\/?$/, "");

function formatDuration(sec) {
  if (!sec && sec !== 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const contentTableStyles = {
  ...tableCustomStyles,
  rows: {
    ...tableCustomStyles.rows,
    style: {
      ...tableCustomStyles.rows.style,
      paddingTop: "12px",
      paddingBottom: "12px",
      marginTop: "4px",
      marginBottom: "4px",
      borderRadius: "8px",
    },
    highlightOnHoverStyle: {
      ...tableCustomStyles.rows.highlightOnHoverStyle,
      borderRadius: "8px",
    },
  },
};

export default function ContentManagement({ type = "long" }) {
  const pageType = type === "short" ? "short" : "long";
  const isShorts = pageType === "short";

  const [view, setView] = useState("list"); // list | upload | player | update
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: pageType,
    duration: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [pageType, isShorts]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(
        `/adminvideo?videoType=${pageType}`,
      );
      setVideos(res.data?.videos || []);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
      setError("Failed to load videos. Please try again.");
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (view === "upload" && !videoFile) {
      toast.error("Please select a video file");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title.trim());
    if (formData.description)
      data.append("description", formData.description.trim());
    data.append("type", pageType);
    if (formData.duration) data.append("duration", formData.duration);
    if (videoFile) data.append("video", videoFile);

    try {
      setSubmitting(true);

      if (view === "upload") {
        await API.post(`/adminvideo/upload`, data);
        toast.success(
          isShorts
            ? "Short uploaded successfully!"
            : "Video uploaded successfully!",
        );
      } else if (view === "update" && selectedVideo) {
        await API.put(
          `/adminvideo/update/${selectedVideo._id}`,
          data,
        );
        toast.success("Video updated successfully!");
      }

      await fetchVideos();
      resetForm();
      setView("list");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Operation failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", type: pageType, duration: "" });
    setVideoFile(null);
    setSelectedVideo(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      await API.delete(`/adminvideo/${id}`);
      toast.success("Video deleted successfully");
      fetchVideos();
      if (view === "player") setView("list");
    } catch {
      toast.error("Failed to delete video");
    }
  };

  // ================= FILTERED DATA =================
  const filteredVideos = videos.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.title?.toLowerCase().includes(q) ||
      v.uploadedBy?.name?.toLowerCase().includes(q) ||
      v.uploadedBy?.email?.toLowerCase().includes(q) ||
      v.channel?.name?.toLowerCase().includes(q) ||
      v.type?.toLowerCase().includes(q)
    );
  });

  // ================= TABLE COLUMNS =================
  const columns = [
    {
      name: "Thumbnail",
      width: "140px",
      cell: (row) => {
        const thumbSrc = row.thumbnail
          ? row.thumbnail.startsWith("http")
            ? row.thumbnail
            : `${MEDIA_BASE}/${row.thumbnail}`
          : null;

        const videoSrc = row.videoUrl?.startsWith("http")
          ? row.videoUrl
          : `${MEDIA_BASE}/${row.videoUrl}`;

        return (
          <div
            className="relative w-28 h-16 rounded-lg overflow-hidden cursor-pointer group bg-bp-elevated"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVideo(row);
              setView("player");
            }}
          >
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt={row.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={videoSrc}
                muted
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Play size={22} style={{ color: "#fff" }} />
            </div>
          </div>
        );
      },
    },
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="py-2">
          <p className="font-medium text-white line-clamp-1">{row.title}</p>
          <p className="text-xs text-bp-text-muted mt-0.5">
            {row.category?.name || "—"} • {formatDuration(row.duration)} • {isShorts ? "Short" : "Long"}
          </p>
        </div>
      ),
    },
    {
      name: "Uploaded By",
      grow: 1.5,
      cell: (row) => {
        const uploader = row.uploadedBy;
        return (
          <div className="flex items-center gap-2 py-1">
            <div className="w-8 h-8 rounded-full bg-bp-blue/20 text-bp-blue flex items-center justify-center text-xs font-bold flex-shrink-0">
              {uploader?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {uploader?.name || "Unknown"}
              </p>
              <p className="text-xs text-bp-text-muted truncate flex items-center gap-1">
                <Mail size={11} />
                {uploader?.email || "—"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      name: "Channel",
      cell: (row) =>
        row.channel ? (
          <span className="inline-flex items-center gap-1 text-sm text-bp-yellow bg-bp-yellow/10 border border-bp-yellow/20 px-2.5 py-1 rounded-full">
            <Tv size={13} />
            {row.channel.name || row.channel.handle}
          </span>
        ) : (
          <span className="text-bp-text-muted text-sm">—</span>
        ),
    },
    {
      name: "Views",
      selector: (row) => row.views || 0,
      sortable: true,
      width: "90px",
      cell: (row) => (
        <span className="font-medium text-white">{row.views || 0}</span>
      ),
    },
    {
      name: "Date",
      selector: (row) => row.createdAt,
      sortable: true,
      width: "160px",
      cell: (row) => (
        <span className="text-sm text-bp-text-muted">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      name: "Actions",
      width: "130px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVideo(row);
              setView("player");
            }}
            className="p-1.5 rounded-lg bg-bp-blue/10 text-bp-blue hover:bg-bp-blue/20 border border-bp-blue/20 transition"
            title="Play"
          >
            <Play size={16} />
          </button>
          {hasFeature("canUploadVideo") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVideo(row);
                setFormData({
                  title: row.title,
                  description: row.description || "",
                  type: pageType,
                  duration: row.duration || "",
                });
                setView("update");
              }}
              className="p-1.5 rounded-lg bg-bp-cyan/10 text-bp-cyan hover:bg-bp-cyan/20 border border-bp-cyan/20 transition"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {hasFeature("canModerateContent") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row._id);
              }}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ================= VIDEO PLAYER VIEW =================
  if (view === "player" && selectedVideo) {
    const videoSrc = selectedVideo.videoUrl?.startsWith("http")
      ? selectedVideo.videoUrl
      : `${MEDIA_BASE}/${selectedVideo.videoUrl}`;

    const uploader = selectedVideo.uploadedBy;
    const channel = selectedVideo.channel;

    return (
      <div className="text-white">
        <button
          onClick={() => setView("list")}
          className="mb-6 flex items-center gap-2 text-bp-text-secondary hover:text-bp-text transition"
        >
          <ArrowLeft size={20} />
          Back to list
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="bg-bp-card rounded-xl overflow-hidden shadow-2xl">
            <video
              src={videoSrc}
              controls
              autoPlay
              playsInline
              className="w-full aspect-video"
              onError={() =>
                toast.error("Cannot load video – check file or server")
              }
            />
          </div>

          <div className="mt-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {selectedVideo.title}
            </h2>
            <p className="text-bp-text-secondary mt-2">
              {selectedVideo.description || "No description provided"}
            </p>

            {/* Uploader + Channel */}
            <div className="mt-6 p-5 bg-bp-card rounded-xl">
              <h3 className="text-sm font-semibold text-bp-text-secondary uppercase tracking-wider mb-4">
                Uploaded By
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-bp-blue text-white flex items-center justify-center text-lg font-bold">
                    {uploader?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-2">
                      <User size={16} className="text-bp-blue" />
                      {uploader?.name || "Unknown User"}
                    </p>
                    <p className="text-sm text-bp-text-secondary flex items-center gap-2 mt-0.5">
                      <Mail size={14} />
                      {uploader?.email || "No email"}
                    </p>
                  </div>
                </div>

                {channel && (
                  <div className="sm:ml-auto flex items-center gap-2 px-4 py-2 bg-bp-elevated rounded-lg">
                    <Tv size={16} className="text-bp-yellow" />
                    <div>
                      <p className="text-xs text-bp-text-secondary">Channel</p>
                      <p className="font-medium text-white">
                        {channel.name || channel.handle || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 text-sm">
              <div>
                <div className="text-bp-text-muted">Category</div>
                <div className="font-medium text-white">
                  {selectedVideo.category?.name || "—"}
                </div>
              </div>
              <div>
                <div className="text-bp-text-muted">Type</div>
                <div className="font-medium text-white">
                  {isShorts ? "Short" : "Long"}
                </div>
              </div>
              <div>
                <div className="text-bp-text-muted">Duration</div>
                <div className="font-medium text-white">
                  {selectedVideo.duration
                    ? `${selectedVideo.duration} sec`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-bp-text-muted">Views</div>
                <div className="font-medium text-white">
                  {selectedVideo.views || 0}
                </div>
              </div>
              <div>
                <div className="text-bp-text-muted">Uploaded</div>
                <div className="font-medium text-white">
                  {formatDateTime(selectedVideo.createdAt)}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {hasFeature("canUploadVideo") && (
                <button
                  onClick={() => {
                    setFormData({
                      title: selectedVideo.title,
                      description: selectedVideo.description || "",
                      type: pageType,
                      duration: selectedVideo.duration || "",
                    });
                    setView("update");
                  }}
                  className="flex items-center gap-2 bg-bp-elevated border border-bp-border text-bp-text-secondary hover:text-bp-text hover:bg-bp-hover px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  <Edit size={18} />
                  Edit Video
                </button>
              )}
              {hasFeature("canModerateContent") && (
                <button
                  onClick={() => handleDelete(selectedVideo._id)}
                  className="flex items-center gap-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  <Trash2 size={18} />
                  Delete Video
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= FORM (UPLOAD / UPDATE) =================
  if (view === "upload" || view === "update") {
    const isUpdate = view === "update";

    return (
      <div className="flex items-start justify-center py-10 px-4">
        <div className="bg-bp-card p-8 rounded-2xl shadow-xl w-full max-w-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isUpdate
              ? isShorts
                ? "Update Short"
                : "Update Video"
              : isShorts
                ? "Upload New Short"
                : "Upload New Video"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Title *
              </label>
              <input
                required
                placeholder="Enter video title"
                className="w-full px-4 py-3 bg-bp-elevated border border-bp-border rounded-lg 
                           text-white placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue focus:border-bp-blue"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Enter description (optional)"
                className="w-full px-4 py-3 bg-bp-elevated border border-bp-border rounded-lg 
                           text-white placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue focus:border-bp-blue"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Type *
              </label>
              <select
                disabled
                className="w-full px-4 py-3 bg-bp-elevated border border-bp-border rounded-lg 
                           text-white focus:outline-none focus:ring-2 focus:ring-bp-blue focus:border-bp-blue"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="short">Short</option>
                <option value="long">Long</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Duration (seconds)
              </label>
              <input
                type="number"
                placeholder="e.g. 120"
                className="w-full px-4 py-3 bg-bp-elevated border border-bp-border rounded-lg 
                           text-white placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue focus:border-bp-blue"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                {isUpdate ? "Replace Video (optional)" : "Video File *"}
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white
                           file:mr-4 file:py-2 file:px-5 file:rounded file:border-0 file:text-sm 
                           file:bg-bp-blue/20 file:text-bp-blue hover:file:bg-bp-blue/30"
              />
            </div>

            <div className="flex gap-4 pt-4">
              {hasFeature("canUploadVideo") && (
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    submitting
                      ? "bg-bp-border cursor-not-allowed text-bp-text-secondary"
                      : "bg-bp-blue hover:bg-bp-blue text-white"
                  }`}
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {submitting
                    ? isUpdate
                      ? "Updating..."
                      : "Uploading..."
                    : isUpdate
                      ? "Update Video"
                      : isShorts
                        ? "Upload Short"
                        : "Upload Video"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
                className="flex-1 py-3 bg-bp-elevated hover:bg-bp-border text-white rounded-lg font-medium transition border border-bp-border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ================= LIST VIEW (DATA TABLE) =================
  return (
    <div>

      <div className="max-w-7xl mx-auto">
        {/* Header with Title and Search */}
        <PageHeader
          title={isShorts ? "Shorts Management" : "Video Management"}
          subtitle={`${videos.length} ${isShorts ? "shorts" : "videos"} total`}
          className="mb-8"
        >
          <div className="relative w-full md:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by title, user, email, channel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 rounded-xl
                         text-bp-text text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border transition-colors duration-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-bp-text-muted hover:text-bp-text hover:bg-bp-elevated transition-colors duration-150"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {hasFeature("canUploadVideo") && (
            <button
              onClick={() => setView("upload")}
              className="flex items-center justify-center gap-2 bg-bp-elevated border border-bp-border text-bp-text-secondary hover:text-bp-text hover:bg-bp-hover px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            >
              <Plus size={18} />
              {isShorts ? "Upload Short" : "Upload Video"}
            </button>
          )}
        </PageHeader>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-bp-card rounded-2xl overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredVideos}
            progressPending={loading}
            progressComponent={
              <div className="py-12 text-center text-bp-text-muted">
                Loading videos...
              </div>
            }
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[5, 10, 15, 25, 50]}
            customStyles={contentTableStyles}
            highlightOnHover
            pointerOnHover={false}
            noDataComponent={
              <div className="py-12 text-center text-bp-text-muted">
                <p className="text-sm">No videos found</p>
                <p className="mt-2 text-sm">
                  {search
                    ? "Try a different search term"
                    : "Start by uploading a new video"}
                </p>
              </div>
            }
            onRowClicked={(row) => {
              setSelectedVideo(row);
              setView("player");
            }}
          />
        </div>
      </div>
    </div>
  );
}

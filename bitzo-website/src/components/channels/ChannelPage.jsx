import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit,
  Video as VideoIcon,
  ChevronDown,
  Plus,
  Play,
  Users,
  Search,
} from "lucide-react";
import { API_BASE, API_ORIGIN } from "../../config/api";

// API base URLs
const API_CATEGORY = `${API_BASE}/category`;
const BACKEND_URL = API_ORIGIN;

// Helpers
const getToken = () => localStorage.getItem("token") || null;
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.id || user?._id || null;
};

// Static fallback categories
const STATIC_CATEGORIES = [
  { _id: "1", name: "Gaming" },
  { _id: "2", name: "Education" },
  { _id: "3", name: "Entertainment" },
  { _id: "4", name: "Music" },
  { _id: "5", name: "Technology" },
  { _id: "6", name: "Sports" },
  { _id: "7", name: "Cooking" },
  { _id: "8", name: "Travel" },
];

export default function ChannelPage() {
  const { handle: urlHandle } = useParams();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [channel, setChannel] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Videos");
  const [loading, setLoading] = useState(true);

  // Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  // Create channel modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    channelDescription: "",
    category: "",
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
  const [videoType, setVideoType] = useState("short"); // short or long
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

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
        setCategories(
          Array.isArray(data) && data.length > 0 ? data : STATIC_CATEGORIES,
        );
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
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/uservideo/channel`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch channels");

        const data = await res.json();
        const userChannels = data.channels || [];

        setChannels(userChannels);

        let initialChannelId = null;
        if (urlHandle) {
          const matched = userChannels.find(
            (ch) =>
              ch.name?.replace(/\s+/g, "").toLowerCase() ===
              urlHandle.toLowerCase(),
          );
          if (matched) initialChannelId = matched._id;
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
    if (!selectedChannelId) return;

    const fetchChannelVideos = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const selected = channels.find((c) => c._id === selectedChannelId);
        if (!selected) return;

        const videosRes = await fetch(
          `${API_BASE}/uservideo/channel/${selectedChannelId}/videos`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        let videos = [];
        if (videosRes.ok) {
          const result = await videosRes.json();
          videos = result.videos || [];
        }

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
          videosCount: videos.length,
        };

        setChannel(channelData);
        setSubscribersCount(selected.subscribedBy?.length || 0);
        setIsSubscribed(selected.subscribedBy?.includes(getUserId()) || false);

        navigate(`/channel/${cleanHandle}`, { replace: true });
      } catch (err) {
        console.error("Error fetching channel/videos:", err);
      }
    };

    fetchChannelVideos();
  }, [selectedChannelId, channels, navigate]);

  useEffect(() => {
    if (!loading && !showCreateModal && (!channel || channels.length === 0)) {
      setShowCreateModal(true);
    }
  }, [loading, channel, channels.length]);

  // Handle Subscribe / Unsubscribe
  const handleSubscription = async () => {
    if (!selectedChannelId) return;

    const token = getToken();
    if (!token) {
      alert("Please login to subscribe");
      return;
    }

    try {
      const res = await fetch(
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

      setIsSubscribed(result.subscribed);
      setSubscribersCount(result.subscribersCount);

      // Update channel object
      setChannel((prev) => ({
        ...prev,
        subscribers: result.subscribersCount,
      }));
    } catch (error) {
      console.error("Subscription error:", error);
      alert(error.message || "Something went wrong");
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

  try {
    setCreateError("");

    const formData = new FormData();
    formData.append("name", newChannel.name.trim());
    formData.append(
      "channeldescription",
      newChannel.channelDescription || ""
    );
    formData.append("category", newChannel.category);
    formData.append("contactemail", newChannel.contactemail || "");

    if (newChannel.channelImageFile) {
      formData.append("channelImage", newChannel.channelImageFile);
    }
    if (newChannel.channelBannerFile) {
      formData.append("channelBanner", newChannel.channelBannerFile);
    }

    const response = await fetch(`${API_BASE}/uservideo/createchannel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — browser will set it with boundary
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || "Failed to create channel");
    }

    // Refetch channels
    const channelsRes = await fetch(`${API_BASE}/uservideo/channel`, {
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
      channelImageFile: null,
      channelImagePreview: "",
      channelBannerFile: null,
      channelBannerPreview: "",
      contactemail: "",
    });

    alert("Channel created successfully!");
  } catch (error) {
    console.error("Channel creation error:", error);
    setCreateError(error.message || "Failed to create channel.");
  }
};

  // Generate thumbnail from video if user didn't upload one
  const generateVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 4 || 1);
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
      };
      video.onerror = () => resolve(null);
    });
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

    if (!agreeTerms) {
      setUploadError("Please agree to the terms");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("name", videoname.trim());
      formData.append("description", videoDescription || "");
      formData.append("category", videoCategory);
      formData.append("videoType", videoType);
      formData.append("video", videoFile);

      // Thumbnail: use uploaded or generate
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else {
        const generated = await generateVideoThumbnail(videoFile);
        if (generated) {
          formData.append("thumbnail", generated, "auto-thumbnail.jpg");
        }
      }

      const response = await fetch(
        `${API_BASE}/uservideo/upload/${selectedUploadChannelId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to upload video",
        );
      }

      alert("Video uploaded successfully!");

      // Refresh videos
      const videosRes = await fetch(
        `${API_BASE}/uservideo/channel/${selectedChannelId}/videos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (videosRes.ok) {
        const data = await videosRes.json();
        setChannel((prev) => ({
          ...prev,
          videos: data.videos || [],
          videosCount: data.videos?.length || 0,
        }));
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
      setVideoType("short");
      setAgreeTerms(false);
      setSelectedUploadChannelId("");
    } catch (error) {
      console.error("Video upload error:", error);
      setUploadError(
        error.message || "Failed to upload video. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePlayVideo = (video) => {
    setCurrentVideo(video);
    setVideoDuration(null);
    setShowVideoPlayer(true);
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setCurrentVideo(null);
    setVideoDuration(null);
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

  const tabs = ["Videos", "Playlists", "Posts"];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-20">
      {/* Banner + Profile Header */}
      <div className="relative">
        <div className="h-40 md:h-56 lg:h-72 bg-gray-800 relative overflow-hidden">
          <img
            src={currentChannel.banner}
            alt="Channel banner"
            className="w-full h-full object-cover"
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
                onClick={() => navigate("/channel/customize")}
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

            {/* Subscribe Button */}
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
          <button className="pb-4 px-2 text-gray-400 hover:text-gray-200">
            <Search size={22} />
          </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 md:gap-6">
            {currentChannel.videos?.length > 0 ? (
              currentChannel.videos.map((video) => (
                <div
                  key={video._id}
                  className="cursor-pointer group"
                  onClick={() => handlePlayVideo(video)}
                >
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg">
                    <img
                      src={getThumbnailUrl(video.thumbnail)}
                      alt={video.title || video.name}
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
                No videos yet
              </p>
            )}
          </div>
        )}

        {activeTab === "Playlists" && (
          <p className="text-center text-gray-400 py-20 text-lg">
            No playlists created yet
          </p>
        )}

        {activeTab === "Posts" && (
          <p className="text-center text-gray-400 py-20 text-lg">
            No community posts yet
          </p>
        )}
      </div>

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
              <video
                className="w-full max-h-[70vh] object-contain"
                controls
                autoPlay
                playsInline
                src={getVideoUrl(
                  currentVideo.videofile || currentVideo.videoUrl,
                )}
                onLoadedMetadata={(e) => {
                  const duration = e.currentTarget.duration;
                  if (Number.isFinite(duration) && duration > 0) {
                    setVideoDuration(duration);
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
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
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

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
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm transition"
                >
                  Create channel
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
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
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
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

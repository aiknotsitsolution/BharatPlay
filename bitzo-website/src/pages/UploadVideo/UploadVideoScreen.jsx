"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { API_BASE as API } from "../../config/api";

export default function UploadVideo() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [videoType, setVideoType] = useState("short"); // short or long
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/category`);
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch user's channels
  useEffect(() => {
    const fetchChannels = async () => {
      if (!token) return;

      try {
        const res = await axios.get(`${API}/uservideo/channel`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && Array.isArray(res.data.channels)) {
          setChannels(res.data.channels);
          if (res.data.channels.length > 0) {
            setSelectedChannelId(res.data.channels[0]._id); // auto-select first
          }
        }
      } catch (err) {
        console.error("Failed to load channels", err);
        setErrorMsg("Could not load your channels. Please try again.");
      }
    };
    fetchChannels();
  }, [token]);

  const isFormValid =
    title.trim() && category && selectedChannelId && videoFile && !loading;

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
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

  const handleUpload = async () => {
    if (!isFormValid) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("name", title.trim()); // backend expects "name"
      formData.append("description", description);
      formData.append("category", category);
      formData.append("videoType", videoType);
      formData.append("video", videoFile);

      const duration = await getVideoDuration(videoFile);
      if (duration > 0) formData.append("duration", String(duration));

      // Thumbnail: use uploaded or generate
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else {
        const generated = await generateVideoThumbnail(videoFile);
        if (generated) {
          formData.append("thumbnail", generated, "auto-thumbnail.jpg");
        }
      }

      const res = await axios.post(
        `${API}/uservideo/upload/${selectedChannelId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data?.success) {
        alert("Video uploaded successfully! 🎉");
        // Reset form
        setTitle("");
        setDescription("");
        setCategory("");
        setVideoType("short");
        setVideoFile(null);
        setThumbnailFile(null);
        // You can keep the selected channel or reset
        // setSelectedChannelId("");
      }
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message || "Upload failed. Please try again.";
      setErrorMsg(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex justify-center items-start pt-8 md:pt-12 px-4">
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-zinc-800">
          <ArrowLeft size={22} className="text-zinc-400" />
          <h1 className="ml-3 text-xl font-semibold">Upload Video</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Error message */}
          {errorMsg && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          {/* Channel Selection */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Select Channel *
            </label>
            {channels.length === 0 ? (
              <div className="text-zinc-500 text-sm py-3">
                You don't have any channels yet. Create one first.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white appearance-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                >
                  <option value="">Choose a channel</option>
                  {channels.map((ch) => (
                    <option key={ch._id} value={ch._id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Video Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an engaging title"
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
            />
          </div>

          {/* Short / Long */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Video Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVideoType("short")}
                className={`flex-1 py-3 px-5 rounded-lg font-medium transition-all ${
                  videoType === "short"
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"
                }`}
              >
                Short
              </button>
              <button
                type="button"
                onClick={() => setVideoType("long")}
                className={`flex-1 py-3 px-5 rounded-lg font-medium transition-all ${
                  videoType === "long"
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"
                }`}
              >
                Long
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video..."
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700 resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Category *
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white appearance-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Video File */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Video File *
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer border border-zinc-700 rounded-lg p-2"
            />
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Thumbnail (optional – auto-generated if empty)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer border border-zinc-700 rounded-lg p-2"
            />
          </div>

          {/* Submit */}
          <button
            disabled={!isFormValid}
            onClick={handleUpload}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
              isFormValid
                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Uploading...
              </>
            ) : (
              "Upload Video"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE as API } from "../../config/api";
import { uploadVideoMultipart } from "../../utils/multipartVideoUpload";
import {
  uploadFailed,
  uploadProgressUpdated,
  uploadStarted,
  uploadSucceeded,
} from "../../features/upload/uploadSlice";

const isCreativeCornerCategory = (category) =>
  category?.isCreativeCorner ||
  category?.slug === "creative-corner" ||
  category?.name?.toLowerCase() === "creative corner";

export default function UploadVideo() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [isCreativeCorner, setIsCreativeCorner] = useState(false);
  const [hashtags, setHashtags] = useState("");
  const [videoType, setVideoType] = useState("short"); // short or long
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [durationChecking, setDurationChecking] = useState(false);
  const [durationError, setDurationError] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const validationRequestRef = useRef(0);
  const dispatch = useDispatch();
  const { progress: uploadProgress } = useSelector(
    (state) => state.upload,
  );

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
    title.trim() &&
    category &&
    selectedChannelId &&
    (!isCreativeCorner || hashtags.trim()) &&
    videoFile &&
    videoDuration !== null &&
    !durationError &&
    !durationChecking &&
    agreeTerms &&
    !loading;

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

  const formatDuration = (seconds) => {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = String(total % 60).padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const getVideoRule = (type = videoType) =>
    type === "short"
      ? "Shorts: maximum 1 minute"
      : "Long video: between 1 and 5 minutes";

  const resetUploadForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setIsCreativeCorner(false);
    setHashtags("");
    setVideoType("short");
    setAgreeTerms(false);
    setVideoFile(null);
    setVideoDuration(null);
    setDurationError("");
    setThumbnailFile(null);
    setErrorMsg("");
  };

  const displayCategories = categories.some(isCreativeCornerCategory)
    ? categories
    : [
        ...categories,
        {
          _id: "creative-corner",
          name: "Creative Corner",
          slug: "creative-corner",
          isCreativeCorner: true,
        },
      ];

  const handleCategoryChange = (value) => {
    const creative = value === "creative-corner";
    setCategory(value);
    setIsCreativeCorner(creative);
    if (!creative) setHashtags("");
  };

  const validateSelectedVideo = async (file, type = videoType) => {
    const requestId = ++validationRequestRef.current;
    setVideoDuration(null);
    setDurationError("");
    if (!file) return;

    setDurationChecking(true);
    const duration = await getVideoDuration(file);
    if (requestId !== validationRequestRef.current) return;

    const isShort = type === "short";
    const minDuration = isShort ? 0 : 60;
    const maxDuration = isShort ? 60 : 300;
    setDurationChecking(false);

    if (!duration) {
      const message = "Video duration could not be read. Choose another file.";
      setDurationError(message);
      toast.error(`This video cannot be uploaded: ${message}`);
      return;
    }

    setVideoDuration(duration);
    if (duration < minDuration) {
      const message = "Long videos must be 1 minute or longer.";
      setDurationError(`${message} This video is too short.`);
      toast.error(`This video cannot be uploaded: ${message}`);
    } else if (duration > maxDuration) {
      const message = isShort
        ? "Shorts must be 1 minute or shorter."
        : "Long videos must be between 1 minute and 5 minutes.";
      setDurationError(`${message} This video is ${formatDuration(duration)}.`);
      toast.error(`This video cannot be uploaded: ${message}`);
    } else {
      toast.success(
        `This video can be uploaded as a ${isShort ? "Short" : "Long video"}.`,
      );
    }
  };

  const handleVideoTypeChange = (type) => {
    setVideoType(type);
    if (videoFile) validateSelectedVideo(videoFile, type);
  };

  const handleUpload = async () => {
    if (!isFormValid) return;

    setLoading(true);
    dispatch(uploadStarted());
    setErrorMsg("");

    try {
      const duration = await getVideoDuration(videoFile);
      const minDuration = videoType === "short" ? 0 : 60;
      const maxDuration = videoType === "short" ? 60 : 300;
      if (!duration) {
        throw new Error("Could not read the video duration.");
      }
      if (duration < minDuration) {
        throw new Error("Long videos must be 1 minute or longer.");
      }
      if (duration > maxDuration) {
        throw new Error(
          videoType === "short"
            ? "Shorts must be 1 minute or shorter."
            : "Long videos must be between 1 minute and 5 minutes.",
        );
      }

      await uploadVideoMultipart({
        api: API,
        channelId: selectedChannelId,
        token,
        file: videoFile,
        metadata: {
          name: title.trim(),
          description,
          category,
          videoType,
          duration,
          hashtags,
          isCreativeCorner,
        },
        thumbnail: thumbnailFile,
        onProgress: (progress) => dispatch(uploadProgressUpdated(progress)),
      });
      toast.success("Video uploaded. Processing has started.");
      dispatch(uploadSucceeded());
      resetUploadForm();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Upload failed. Please try again.";
      setErrorMsg(msg);
      dispatch(uploadFailed(msg));
      toast.error(msg);
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
                onClick={() => handleVideoTypeChange("short")}
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
                onClick={() => handleVideoTypeChange("long")}
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
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white appearance-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              >
                <option value="">Select Category</option>
                {displayCategories.map((cat) => (
                  <option
                    key={cat._id}
                    value={isCreativeCornerCategory(cat) ? "creative-corner" : cat._id}
                  >
                    {isCreativeCornerCategory(cat) ? "Creative Corner" : cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isCreativeCorner}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsCreativeCorner(checked);
                  setCategory(checked ? "creative-corner" : "");
                  if (!checked) setHashtags("");
                }}
                className="h-4 w-4"
              />
              Creative Corner
            </label>
            {isCreativeCorner && (
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#funny #comedy (at least one hashtag)"
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                required
              />
            )}
          </div>

          {/* Video File */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300 font-medium">
              Video File *
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setVideoFile(file);
                validateSelectedVideo(file);
              }}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer border border-zinc-700 rounded-lg p-2"
            />
            <div
              aria-live="polite"
              className={`rounded-lg border px-3 py-2 text-sm ${
                durationError
                  ? "border-red-800 bg-red-950/40 text-red-300"
                  : durationChecking
                    ? "border-zinc-700 bg-zinc-800 text-zinc-300"
                    : videoDuration !== null
                      ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
              }`}
            >
              {!videoFile && `Select a video to check whether it can be uploaded.`}
              {videoFile && (
                <>
                  <p className="font-medium break-all">{videoFile.name}</p>
                  <p className="mt-1">{getVideoRule()}</p>
                  {durationChecking && (
                    <p className="mt-1">Checking video duration...</p>
                  )}
                  {!durationChecking && videoDuration !== null && !durationError && (
                    <p className="mt-1">
                      This video can be uploaded as a{" "}
                      {videoType === "short" ? "Short" : "Long video"} (
                      {formatDuration(videoDuration)}).
                    </p>
                  )}
                  {durationError && (
                    <p className="mt-1" role="alert">
                      This video cannot be uploaded: {durationError}
                    </p>
                  )}
                </>
              )}
            </div>
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

          <label className="flex items-start gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
              required
            />
            <span>
              I agree to the Terms of Service and confirm I own/have rights to
              this content.
            </span>
          </label>

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
                Uploading {uploadProgress}%
              </>
            ) : (
              "Upload Video"
            )}
          </button>
          {loading && (
            <div className="space-y-2" aria-live="polite">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-600 transition-[width] duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-zinc-400">
                Uploading directly to Backblaze B2: {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

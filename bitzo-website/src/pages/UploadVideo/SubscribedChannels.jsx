import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Bell,
  Search,
  MoreVertical,
  Play,
  Link as LinkIcon,
} from "lucide-react";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

const API_BASE = `${BACKEND_URL}/api/uservideo`;

const formatDuration = (seconds) => {
  if (!seconds || typeof seconds !== "number" || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function SubscribedChannels() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const tabs = ["Home", "Videos", "Playlists"];

  useEffect(() => {
    const fetchChannel = async () => {
      if (!id) {
        setLoading(false);
        setError("Channel not found.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/channel/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();

        if (data.success && data.channel) {
          setChannel(data.channel);
          setSubscribersCount(data.channel.subscribersCount || 0);
          setIsSubscribed(Boolean(data.channel.isSubscribed));
          setVideos(data.videos || []);
        } else {
          setError(data.message || "Channel not found.");
          setChannel(null);
          setVideos([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load channel. Please try again.");
        setChannel(null);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [id]);

  const handleSubscribe = async () => {
    if (!id) return;
    setSubscribeLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/subscribe/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(data.subscribed);
        if (typeof data.subscribersCount === "number") {
          setSubscribersCount(data.subscribersCount);
        }
        toast.success(
          data.subscribed
            ? "Subscribed successfully"
            : "Unsubscribed successfully",
        );
      } else {
        toast.error(data.message || "Subscription action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubscribeLoading(false);
    }
  };

  const formatCount = (num) => {
    if (!num) return "0";
    if (num >= 1_000_000_000)
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1_000_000)
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-3">
        <p className="text-gray-300 text-lg">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-red-400 text-sm font-medium hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const channelDescription = channel?.description || "";
  const showDescription = channelDescription.length > 0;
  const isDescriptionLong = channelDescription.length > 120;
  const displayDescription =
    showDescription && isDescriptionLong && !descExpanded
      ? channelDescription.slice(0, 120) + "..."
      : channelDescription;

  const channelLinks = [];
  if (channel?.videoUrl) {
    channelLinks.push({ url: channel.videoUrl, label: channel.videoUrl });
  }
  if (channel?.contactemail) {
    channelLinks.push({
      url: `mailto:${channel.contactemail}`,
      label: channel.contactemail,
    });
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
      {/* ========== CHANNEL HEADER ========== */}
      <div className="max-w-[1280px] mx-auto px-6 pt-6">
        <div className="flex gap-6 items-start rounded-2xl border border-gray-800 bg-[#1a1a1a] p-5">
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-[#0f0f0f] flex-shrink-0 border border-gray-700">
            <img
              src={
                channel?.channelImage
                  ? channel.channelImage.startsWith("http")
                    ? channel.channelImage
                    : `${BACKEND_URL}/${channel.channelImage}`
                  : "https://via.placeholder.com/150"
              }
              alt={channel?.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-bold leading-tight text-white">
                {channel?.name}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-[14px] text-gray-400">
              <span>@{channel?.handle}</span>
              <span>•</span>
              <span>{formatCount(subscribersCount)} subscribers</span>
              <span>•</span>
              <span>
                {formatCount(channel?.videoCount || videos.length)} videos
              </span>
            </div>

            {showDescription && (
              <p className="mt-2 text-[14px] text-gray-300 max-w-[600px] leading-snug">
                {displayDescription}
                {isDescriptionLong && (
                  <button
                    onClick={() => setDescExpanded((prev) => !prev)}
                    className="text-red-400 font-medium ml-1 hover:underline"
                  >
                    {descExpanded ? "show less" : "...more"}
                  </button>
                )}
              </p>
            )}

            {channelLinks.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[14px]">
                {channelLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-red-400 font-medium cursor-pointer hover:underline"
                  >
                    <LinkIcon size={14} />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={handleSubscribe}
                disabled={subscribeLoading}
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-[14px] font-medium transition ${
                  isSubscribed
                    ? "bg-[#272727] hover:bg-[#3a3a3a] text-gray-200 border border-gray-700"
                    : "bg-red-600 hover:bg-red-700 text-white"
                } ${subscribeLoading ? "opacity-70" : ""}`}
              >
                {isSubscribed ? (
                  <>
                    <Bell size={18} />
                    <span>Subscribed</span>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 10l5 5 5-5H7z" />
                    </svg>
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== TABS ========== */}
      <div className="border-b border-gray-800 mt-5 sticky top-0 bg-[#0f0f0f]/95 backdrop-blur z-20">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-3 text-[14px] font-medium whitespace-nowrap transition ${
                    activeTab === tab
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
            <button className="ml-auto p-2 text-gray-400 hover:bg-[#272727] hover:text-white rounded-full transition">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ========== VIDEOS LIST ========== */}
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-[#1a1a1a] px-6 py-10 text-center">
              <p className="text-gray-400">No videos found for this channel.</p>
            </div>
          ) : (
            videos.map((video) => {
              const durationText = formatDuration(video.duration);
              return (
                <div
                  key={video._id}
                  onClick={() => navigate(`/video/${video._id}`)}
                  className="flex gap-4 cursor-pointer group rounded-2xl border border-gray-800 bg-[#1a1a1a] p-3 transition hover:bg-[#272727]"
                >
                  <div className="relative w-[246px] h-[138px] flex-shrink-0 rounded-xl overflow-hidden bg-black">
                    <img
                      src={
                        video.thumbnail
                          ? video.thumbnail.startsWith("http")
                            ? video.thumbnail
                            : `${BACKEND_URL}/${video.thumbnail}`
                          : "https://via.placeholder.com/246x138"
                      }
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    {durationText && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[12px] font-medium px-1 rounded">
                        {durationText}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-[16px] font-medium leading-snug line-clamp-2 text-gray-100 group-hover:text-white">
                      {video.title}
                    </h3>

                    <div className="flex items-center gap-1 mt-1.5 text-[13px] text-gray-400">
                      <span className="font-medium text-gray-200">
                        {channel?.name}
                      </span>
                      <span>•</span>
                      <span>{formatCount(video.views)} views</span>
                      <span>•</span>
                      <span>
                        {video.createdAt
                          ? new Date(video.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>

                    {video.description && (
                      <p className="mt-1.5 text-[13px] text-gray-500 line-clamp-2 max-w-[600px]">
                        {video.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="self-start p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-[#272727] rounded-full transition"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {videos.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-medium text-gray-200">
                {channel?.name} - Playlist
              </h2>
              <button className="flex items-center gap-1.5 text-[14px] font-medium px-3 py-1.5 rounded-full text-gray-300 hover:bg-[#272727] transition">
                <Play size={16} fill="currentColor" />
                Play all
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {videos.slice(0, 4).map((video) => {
                const durationText = formatDuration(video.duration);
                return (
                  <div
                    key={video._id + "-pl"}
                    className="w-[210px] flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/video/${video._id}`)}
                  >
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                      <img
                        src={
                          video.thumbnail
                            ? video.thumbnail.startsWith("http")
                              ? video.thumbnail
                              : `${BACKEND_URL}/${video.thumbnail}`
                            : "https://via.placeholder.com/210x118"
                        }
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {durationText && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[12px] px-1 rounded">
                          {durationText}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

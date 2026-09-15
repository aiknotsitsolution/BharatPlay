import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Clock, DollarSign, ArrowUpDown, X } from "lucide-react";
import { fetchMyVideos } from "../../features/videos/videosSlice";

export default function MyVideos() {
  const dispatch = useDispatch();
  const { myVideos, myVideosLoading } = useSelector((state) => state.videos);
  const [sortBy, setSortBy] = useState("latest");
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    dispatch(fetchMyVideos());
  }, [dispatch]);

  const sortedVideos = useMemo(() => {
    return [...myVideos].sort((a, b) => {
      if (sortBy === "latest")
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "earnings") return b.earnings - a.earnings;
      return 0;
    });
  }, [myVideos, sortBy]);

  const handleSortChange = (e) => setSortBy(e.target.value);
  const openDetail = (video) => setSelectedVideo(video);
  const closeDetail = () => setSelectedVideo(null);

  const getStatusBadge = (status) => {
    const isActive = String(status || "Public").toLowerCase() === "public";
    return (
      <span
        className={`
          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
          ${
            isActive
              ? "bg-green-900/40 text-green-400 border border-green-800/50"
              : "bg-red-900/40 text-red-400 border border-red-800/50"
          }
        `}
      >
        {isActive ? "Active" : "Deactive"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 scrollbar-hide">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Videos</h1>
        <div className="flex items-center gap-2.5">
          <ArrowUpDown size={18} className="text-zinc-500" />
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="
              bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm
              text-zinc-200 focus:outline-none focus:border-red-600 focus:ring-1
              focus:ring-red-600/30 transition-all appearance-none
            "
          >
            <option value="latest">Latest</option>
            <option value="views">Highest Views</option>
            <option value="earnings">Highest Earnings</option>
          </select>
        </div>
      </div>

      {/* Video List - scrollable area with hidden scrollbar */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-76px)] overflow-y-auto scrollbar-hide">
        {sortedVideos.map((video) => (
          <div
            key={video.id}
            onClick={() => openDetail(video)}
            className="
              bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden
              hover:border-zinc-700 transition-all duration-200 shadow-sm
              cursor-pointer active:scale-[0.995]
            "
          >
            <div className="flex flex-col sm:flex-row">
              <div className="relative w-full sm:w-36 h-52 sm:h-24 shrink-0">
                <img
                  src={video.thumb || video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent sm:opacity-0 sm:hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex-1 p-4 flex flex-col">
                <h3 className="font-medium text-base leading-tight line-clamp-2 mb-3">
                  {video.title}
                </h3>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400 mb-4">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <Eye size={15} />
                      <span>{video.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={15} />
                      <span>{video.avgWatchPercent}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-red-500">
                    <DollarSign size={15} />
                    <span>₹{video.earnings.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 mt-auto">
                  {getStatusBadge(video.status)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(video);
                    }}
                    className="
                      px-5 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800
                      text-white text-sm font-medium rounded-lg transition-colors
                      shadow-sm shadow-red-900/30
                    "
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 scrollbar-hide">
          <div
            className="
              bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto
              border border-zinc-800 shadow-2xl shadow-black/60 scrollbar-hide
            "
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 px-6 pt-5 pb-3 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Video Details</h2>
              <button
                onClick={closeDetail}
                className="
                  p-2.5 hover:bg-zinc-800 text-zinc-400 hover:text-white
                  rounded-full transition-colors
                "
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-7">
              <div>
                <img
                  src={selectedVideo.thumb || selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-full h-56 object-cover rounded-xl border border-zinc-800 shadow-md"
                />
                <h3 className="mt-5 text-2xl font-semibold leading-tight">
                  {selectedVideo.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Uploaded:{" "}
                  {new Date(selectedVideo.uploadDate).toLocaleDateString(
                    "en-IN",
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Eye,
                    color: "blue",
                    label: "Total Views",
                    value: selectedVideo.views.toLocaleString(),
                  },
                  {
                    icon: Clock,
                    color: "purple",
                    label: "Avg. Watch %",
                    value: `${selectedVideo.avgWatchPercent}%`,
                  },
                  {
                    icon: Clock,
                    color: "emerald",
                    label: "Total Watch Time",
                    value: selectedVideo.totalWatchTime,
                  },
                  {
                    icon: DollarSign,
                    color: "red",
                    label: "Total Earnings",
                    value: `₹${selectedVideo.earnings.toFixed(2)}`,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="
                      bg-zinc-950/60 p-5 rounded-xl text-center border border-zinc-800
                      shadow-sm shadow-black/30
                    "
                  >
                    <item.icon
                      size={28}
                      className={`mx-auto mb-3 text-${item.color}-500`}
                    />
                    <p className={`text-2xl font-bold text-${item.color}-400`}>
                      {item.value}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400">
                    Status
                  </span>
                  {getStatusBadge(selectedVideo.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

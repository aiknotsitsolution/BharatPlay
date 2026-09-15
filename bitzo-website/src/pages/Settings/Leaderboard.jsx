

import React, { useEffect, useState } from 'react';
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

// Thumbnail / media URL fix
const resolveMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("uploads/")) {
    return `${BACKEND_URL}/${normalized}`;
  }
  if (normalized.includes("uploads/")) {
    return `${BACKEND_URL}/${normalized.split("uploads/").pop()}`;
  }
  if (normalized.startsWith("/uploads/")) {
    return `${BACKEND_URL}${normalized}`;
  }
  return `${BACKEND_URL}/${normalized}`;
};

const Leaderboard = () => {
  const [topCreators, setTopCreators] = useState([]);
  const [topVideos, setTopVideos] = useState([]);
  const [videoType, setVideoType] = useState("long");
  const [loading, setLoading] = useState(() => !localStorage.getItem("token"));
  const [error, setError] = useState(() =>
    localStorage.getItem("token")
      ? null
      : "Please login to view the leaderboard.",
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;

    fetch(`${BACKEND_URL}/api/leaderboard?videoType=${videoType}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load leaderboard (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (!data.success) {
          throw new Error(data.message || "Failed to load leaderboard");
        }
        setTopCreators(data.data?.topCreators || []);
        setTopVideos(data.data?.topVideos || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load leaderboard data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [videoType]);

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-red-600">
            LEADERBOARD
          </h1>
          <p className="mt-3 text-gray-400 text-lg">
            Top Creators & Most Viewed Content • February 2026
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">
            Loading leaderboard...
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-20">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
            {/* TOP CREATORS */}
            <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-red-950/30">
              <div className="bg-red-950/60 px-6 py-5 border-b border-red-900/50">
                <h2 className="text-2xl font-bold text-red-500 flex items-center gap-3">
                  <span className="text-3xl">🏆</span> TOP CREATORS
                </h2>
              </div>

              <div className="divide-y divide-gray-800">
                {topCreators.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400">
                    No creators yet.
                  </div>
                ) : (
                  topCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="px-6 py-5 flex items-center gap-5 hover:bg-gray-900 transition-colors"
                    >
                      <div
                        className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-full min-w-[48px] ${
                          creator.rank === 1
                            ? "bg-yellow-600 text-white border-2 border-yellow-500"
                            : creator.rank === 2
                              ? "bg-gray-500 text-white border-2 border-gray-400"
                              : creator.rank === 3
                                ? "bg-amber-700 text-white border-2 border-amber-600"
                                : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {creator.rank}
                      </div>

                      {creator.avatar ? (
                        <img
                          src={resolveMediaUrl(creator.avatar)}
                          alt={creator.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full border-2 border-gray-700 bg-gray-800 flex items-center justify-center text-gray-400 text-lg font-semibold">
                          {(creator.name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg text-white truncate">
                          {creator.name || "Unknown"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {creator.channelName}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-white font-bold">
                          {Number(
                            creator.totalSubscribers || 0,
                          ).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">followers</p>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <p className="text-red-400 font-bold">
                          {Number(creator.rewardPoints || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TOP VIEWS */}
            <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-red-950/30">
              <div className="bg-red-950/60 px-6 py-5 border-b border-red-900/50 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-red-500 flex items-center gap-3">
                  <span className="text-3xl">🔥</span> TOP VIEWS
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Select Video Type
                  </span>
                  <select
                    value={videoType}
                    onChange={(e) => {
                      setVideoType(e.target.value);
                      setLoading(true);
                      setError(null);
                    }}
                    className="bg-gray-900 text-white text-sm rounded-lg border border-gray-700 px-3 py-1.5 focus:outline-none focus:border-red-500"
                  >
                    <option value="long">Top Videos</option>
                    <option value="short">Top Shorts</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-800">
                {topVideos.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400">
                    No videos yet.
                  </div>
                ) : (
                  topVideos.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-5 flex items-center gap-5 hover:bg-gray-900 transition-colors"
                    >
                      <div
                        className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-full min-w-[48px] ${
                          item.rank === 1
                            ? "bg-yellow-600 text-white border-2 border-yellow-500"
                            : item.rank === 2
                              ? "bg-gray-500 text-white border-2 border-gray-400"
                              : item.rank === 3
                                ? "bg-amber-700 text-white border-2 border-amber-600"
                                : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {item.rank}
                      </div>

                      {item.thumbnail ? (
                        <img
                          src={resolveMediaUrl(item.thumbnail)}
                          alt={item.title}
                          className="w-20 h-12 object-cover rounded-md border border-gray-700"
                        />
                      ) : (
                        <div className="w-20 h-12 rounded-md border border-gray-700 bg-gray-800 flex items-center justify-center text-gray-500">
                          No thumb
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-white line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {item.creatorName}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-white font-bold text-lg">
                          {Number(item.views || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">views</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12 text-gray-500 text-sm">
          Keep creating fire content to reach the top! 🔥
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

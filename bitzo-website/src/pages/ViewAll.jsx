import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  API_BASE,
  normalizeVideoListItem,
  normalizeShort,
  shuffleAfterPinnedItems,
} from "../features/videos/videosSlice";
import { addToWatchLater, removeFromWatchLater } from "../api/watchLater";
import { MovieCard } from "../components/common/VideoGrid";
import ShortCard from "../components/common/ShortCard";
import { fetchAllRecommendedVideos } from "../utils/fetchAllRecommendedVideos";
import { promptLogin } from "../utils/loginPrompt";

const PAGE_SIZE = 20;

const SECTIONS = {
  recommended: {
    title: "Recommended Videos",
    endpoint: "/recommended",
    normalize: normalizeVideoListItem,
    isShort: false,
  },
  trending: {
    title: "Trending Videos",
    endpoint: "/trending",
    normalize: normalizeVideoListItem,
    isShort: false,
  },
  latest: {
    title: "Latest Videos",
    endpoint: "/latest",
    normalize: normalizeVideoListItem,
    isShort: false,
  },
  subscriptions: {
    title: "Subscription Videos",
    endpoint: "/subscriptions",
    normalize: normalizeVideoListItem,
    isShort: false,
  },
  shorts: {
    title: "Trending Shorts",
    endpoint: "/trending-shorts",
    normalize: normalizeShort,
    isShort: true,
  },
  "top-shorts": {
    title: "Top Shorts",
    endpoint: "/top-shorts",
    normalize: normalizeShort,
    isShort: true,
  },
};

const ViewAll = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const section = SECTIONS[type];
  const selectedCategory = useSelector(
    (state) => state.videos.selectedCategory,
  );

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState(null);
  const [error, setError] = useState(null);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const needsLogin =
    type === "subscriptions" && !localStorage.getItem("token");
  const requestPage = type === "recommended" ? 1 : page;
  const requestKey = `${type}-${requestPage}-${selectedCategory || "all"}`;
  const loading = !needsLogin && loadedRequestKey !== requestKey;

  useEffect(() => {
    if (!section) return;
    const token = localStorage.getItem("token");
    if (type === "subscriptions" && !token) return;

    let active = true;
    if (type === "recommended") {
      fetchAllRecommendedVideos({
        apiBase: API_BASE,
        category: selectedCategory,
        token,
      })
        .then((videos) => {
          if (!active) return;
          const shuffledVideos = shuffleAfterPinnedItems(
            videos.map(section.normalize),
          );
          setItems(shuffledVideos);
          setTotal(shuffledVideos.length);
          setError(null);
        })
        .catch((err) => {
          if (active) setError(err.message || "Failed to load videos.");
        })
        .finally(() => {
          if (active) setLoadedRequestKey(requestKey);
        });

      return () => {
        active = false;
      };
    }

    const categoryParam = selectedCategory
      ? `&category=${selectedCategory}`
      : "";

    fetch(
      `${API_BASE}${section.endpoint}?page=${requestPage}&limit=${PAGE_SIZE}${categoryParam}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load videos (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (!data.success) {
          throw new Error(data.message || "Failed to load videos");
        }
        const list = Array.isArray(data.videos) ? data.videos : [];
        const pinnedCount =
          requestPage === 1 &&
          ["trending", "shorts", "top-shorts"].includes(type)
            ? 3
            : 0;
        setItems(
          shuffleAfterPinnedItems(
            list.map(section.normalize),
            pinnedCount,
          ),
        );
        setTotal(Number(data.total) || list.length);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load videos.");
      })
      .finally(() => {
        if (active) setLoadedRequestKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [type, requestPage, section, selectedCategory, requestKey]);

  const visibleItems =
    type === "recommended"
      ? items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : items;

  const handleItemClick = (item) => {
    if (section.isShort) {
      navigate(`/shorts/${item.id}`, { state: { video: item } });
      return;
    }
    navigate(`/video/${item.id}`, { state: { video: item } });
  };

  const handleAddToWatchLater = addToWatchLater;
  const handleRemoveFromWatchLater = removeFromWatchLater;
  const requestLogin = () => promptLogin(navigate, location);

  if (!section) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-8">
        <p className="text-center text-gray-400 py-20">Section not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-12 lg:px-16 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">{section.title}</h1>
          <span className="text-sm text-gray-400">
            {total.toLocaleString()} videos
          </span>
        </div>

        {needsLogin ? (
          <div className="text-center">
            <p className="text-sm text-gray-300">
              Sign in to view videos from subscribed channels.
            </p>
            <button
              onClick={requestLogin}
              className="mt-3 rounded-full border border-blue-500 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10"
            >
              Sign in
            </button>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-400">
            Loading {section.title.toLowerCase()}...
          </p>
        ) : error ? (
          <p className="text-sm text-gray-300">{error}</p>
        ) : visibleItems.length > 0 ? (
          <>
            {section.isShort ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {visibleItems.map((item) => (
                  <ShortCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleItems.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                    onAddToWatchLater={(item) => {
                      if (requestLogin()) return { success: false };
                      return handleAddToWatchLater(item);
                    }}
                    onRemoveFromWatchLater={(item) => {
                      if (requestLogin()) return { success: false };
                      return handleRemoveFromWatchLater(item);
                    }}
                  />
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-sm flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-sm flex items-center gap-1"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            No videos available right now.
          </p>
        )}
      </div>
    </div>
  );
};

export default ViewAll;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  API_BASE,
  normalizeVideoListItem,
  normalizeShort,
} from "../features/videos/videosSlice";
import { addToWatchLater, removeFromWatchLater } from "../api/watchLater";
import { MovieCard } from "../components/common/VideoGrid";
import ShortCard from "../components/common/ShortCard";

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
  const section = SECTIONS[type];
  const selectedCategory = useSelector(
    (state) => state.videos.selectedCategory,
  );

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(
    () => !localStorage.getItem("token"),
  );
  const [error, setError] = useState(() =>
    localStorage.getItem("token") ? null : "Please login to view videos.",
  );

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  useEffect(() => {
    if (!section) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;
    const categoryParam = selectedCategory
      ? `&category=${selectedCategory}`
      : "";

    fetch(
      `${API_BASE}${section.endpoint}?page=${page}&limit=${PAGE_SIZE}${categoryParam}`,
      {
        headers: { Authorization: `Bearer ${token}` },
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
        setItems(list.map(section.normalize));
        setTotal(Number(data.total) || list.length);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load videos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type, page, section, selectedCategory]);

  const handleItemClick = (item) => {
    if (section.isShort) {
      navigate(`/shorts/${item.id}`, { state: { video: item } });
      return;
    }
    navigate(`/video/${item.id}`, { state: { video: item } });
  };

  const handleAddToWatchLater = addToWatchLater;

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

        {loading ? (
          <p className="text-sm text-gray-400">
            Loading {section.title.toLowerCase()}...
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : items.length > 0 ? (
          <>
            {section.isShort ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map((item) => (
                  <ShortCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                    onAddToWatchLater={handleAddToWatchLater}
                    onRemoveFromWatchLater={removeFromWatchLater}
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

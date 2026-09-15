import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";
export const API_BASE = `${BACKEND_URL}/api/uservideo`;

export const normalizeVideoListItem = (video) => ({
  id: video._id || video.id,
  title: video.title || "Untitled video",
  thumb: video.thumbnail
    ? video.thumbnail.startsWith("http")
      ? video.thumbnail.replace(/\\/g, "/")
      : `${BACKEND_URL}/${video.thumbnail.replace(/\\/g, "/")}`
    : "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
  description: video.description || "",
  duration: video.duration || "",
  views: Number(video.views || 0),
  category: video.category || null,
  videoType: video.videoType || null,
  videoUrl: video.videoUrl
    ? video.videoUrl.startsWith("http")
      ? video.videoUrl.replace(/\\/g, "/")
      : `${BACKEND_URL}/${video.videoUrl.replace(/\\/g, "/")}`
    : "",
  channel: video.channel || null,
  uploadedBy: video.uploadedBy || null,
  creator: video.creator || null,
  channelName: video.channelName || video.channel?.name || null,
  uploadDate: video.createdAt || video.uploadDate || null,
  status: video.status || (video.isPublic === false ? "Private" : "Public"),
  likesCount: Number(video.likesCount || video.likes || 0),
  avgWatchPercent: Number(video.avgWatchPercent || 0),
  earnings: Number(video.earnings || 0),
  totalWatchTime: video.totalWatchTime || "",
  raw: video,
});

export const normalizeShort = (video) => ({
  id: video._id || video.id,
  title: video.title || "Untitled Short",
  videoUrl: video.videoUrl
    ? video.videoUrl.startsWith("http")
      ? video.videoUrl.replace(/\\/g, "/")
      : `${BACKEND_URL}/${video.videoUrl.replace(/\\/g, "/")}`
    : "",
  views: Number(video.views || 0),
  likes: Number(video.likesCount ?? video.likes ?? 0),
  comments: Array.isArray(video.comments)
    ? video.comments.length
    : Number(video.comments) || 0,
  isLiked: video.userReaction === "like",
  reaction: video.userReaction || null,
  thumbnail: video.thumbnail
    ? video.thumbnail.startsWith("http")
      ? video.thumbnail.replace(/\\/g, "/")
      : `${BACKEND_URL}/${video.thumbnail.replace(/\\/g, "/")}`
    : "",
  raw: video,
});

const getVideosArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.videos)) return payload.videos;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

let homeFetchRequestId = 0;

export const fetchHomeVideos = createAsyncThunk(
  "videos/fetchHomeVideos",
  async ({ category, page = 1, limit = 5 } = {}, { rejectWithValue }) => {
    const requestId = ++homeFetchRequestId;
    try {
      const token = localStorage.getItem("token");
      if (!token)
        return {
          recommended: [],
          trending: [],
          latest: [],
          subscriptions: [],
          shorts: [],
        };

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (category) params.set("category", category);
      const categoryParam = `?${params.toString()}`;

      const [
        recommendedRes,
        trendingRes,
        latestRes,
        subscriptionsRes,
        shortsRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/recommended${categoryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/trending${categoryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/latest${categoryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/subscriptions${categoryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/trending-shorts${categoryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (requestId !== homeFetchRequestId) return { cancelled: true };

      const [
        recommendedData,
        trendingData,
        latestData,
        subscriptionsData,
        shortsData,
      ] = await Promise.all([
        recommendedRes.json().catch(() => ({ videos: [] })),
        trendingRes.json().catch(() => ({ videos: [] })),
        latestRes.json().catch(() => ({ videos: [] })),
        subscriptionsRes.json().catch(() => ({ videos: [] })),
        shortsRes.json().catch(() => ({ videos: [] })),
      ]);

      if (requestId !== homeFetchRequestId) return { cancelled: true };

      const getSection = (data, normalize) => {
        const list = getVideosArray(data);
        return {
          items: list.map(normalize),
          hasMore: Number(data?.total) > page * limit || list.length === limit,
        };
      };

      return {
        page,
        recommended: getSection(recommendedData, normalizeVideoListItem),
        trending: getSection(trendingData, normalizeVideoListItem),
        latest: getSection(latestData, normalizeVideoListItem),
        subscriptions: getSection(subscriptionsData, normalizeVideoListItem),
        shorts: getSection(shortsData, normalizeShort),
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load videos");
    }
  },
);

export const fetchMyVideos = createAsyncThunk(
  "videos/fetchMyVideos",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const response = await fetch(`${API_BASE}/my-videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      const videos = Array.isArray(data.videos) ? data.videos : [];
      return videos.map(normalizeVideoListItem);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load My Videos");
    }
  },
);

let searchRequestId = 0;

export const searchVideos = createAsyncThunk(
  "videos/searchVideos",
  async ({ query, page = 1, limit = 20 }, { rejectWithValue }) => {
    const requestId = ++searchRequestId;
    const token = localStorage.getItem("token");
    if (!token) return rejectWithValue("Please login to search videos");
    const q = String(query || "").trim();
    if (!q) return { cancelled: true };

    try {
      const res = await fetch(
        `${API_BASE}/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (requestId !== searchRequestId) return { cancelled: true };

      const data = await res.json().catch(() => ({ videos: [] }));

      if (requestId !== searchRequestId) return { cancelled: true };

      if (!res.ok) {
        return rejectWithValue(data.message || "Failed to load search results");
      }

      const list = getVideosArray(data);
      const videos = [];
      const shorts = [];

      list.forEach((video) => {
        const rawTypes = Array.isArray(video.videoType)
          ? video.videoType
          : [video.videoType];
        const isShort = rawTypes.some((type) =>
          String(type || "")
            .toLowerCase()
            .includes("short"),
        );
        if (isShort) shorts.push(normalizeShort(video));
        else videos.push(normalizeVideoListItem(video));
      });

      return {
        query: q,
        page,
        limit,
        videos,
        shorts,
        total: Number(data.total || list.length),
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to search videos");
    }
  },
);

const initialState = {
  recommended: [],
  trending: [],
  latest: [],
  subscriptions: [],
  shorts: [],
  homePage: 0,
  homeHasMore: true,
  myVideos: [],
  selectedCategory: null,
  loading: false,
  myVideosLoading: false,
  error: null,
  searchVideos: [],
  searchShorts: [],
  searchTotal: 0,
  searchQuery: null,
  searchLoading: false,
  searchError: null,
};

const videosSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    clearVideosError: (state) => {
      state.error = null;
    },
    clearSearch: (state) => {
      state.searchVideos = [];
      state.searchShorts = [];
      state.searchTotal = 0;
      state.searchQuery = null;
      state.searchLoading = false;
      state.searchError = null;
    },
    setSelectedCategory: (state, action) => {
      if (state.selectedCategory === action.payload) return;
      state.selectedCategory = action.payload;
      state.recommended = [];
      state.trending = [];
      state.latest = [];
      state.subscriptions = [];
      state.shorts = [];
      state.homePage = 0;
      state.homeHasMore = true;
      state.loading = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeVideos.fulfilled, (state, action) => {
        if (action.payload?.cancelled) return;
        state.loading = false;
        state.error = null;
        const isFirstPage = action.payload.page === 1;
        const append = (current, section) =>
          isFirstPage ? section.items : [...current, ...section.items];
        state.recommended = append(
          state.recommended,
          action.payload.recommended,
        );
        state.trending = append(state.trending, action.payload.trending);
        state.latest = append(state.latest, action.payload.latest);
        state.subscriptions = append(
          state.subscriptions,
          action.payload.subscriptions,
        );
        state.shorts = append(state.shorts, action.payload.shorts);
        state.homePage = action.payload.page;
        state.homeHasMore = [
          action.payload.recommended,
          action.payload.trending,
          action.payload.latest,
          action.payload.subscriptions,
          action.payload.shorts,
        ].some((section) => section.hasMore);
      })
      .addCase(fetchHomeVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load videos";
      })
      .addCase(fetchMyVideos.pending, (state) => {
        state.myVideosLoading = true;
      })
      .addCase(fetchMyVideos.fulfilled, (state, action) => {
        state.myVideosLoading = false;
        state.myVideos = action.payload;
      })
      .addCase(fetchMyVideos.rejected, (state, action) => {
        state.myVideosLoading = false;
        state.error = action.payload || "Failed to load My Videos";
      })
      .addCase(searchVideos.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchVideos.fulfilled, (state, action) => {
        if (action.payload?.cancelled) return;
        state.searchLoading = false;
        state.searchError = null;
        state.searchQuery = action.payload.query;
        state.searchVideos = action.payload.videos;
        state.searchShorts = action.payload.shorts;
        state.searchTotal = action.payload.total;
      })
      .addCase(searchVideos.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || "Failed to search videos";
      });
  },
});

export const { clearVideosError, setSelectedCategory, clearSearch } =
  videosSlice.actions;
export default videosSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";
import {
  fetchAllRecommendedVideos,
  fetchAllShortsVideos,
  fetchAllTrendingVideos,
  fetchAllLatestVideos,
} from "../../utils/fetchAllRecommendedVideos";
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

export const shuffleAfterPinnedItems = (items, pinnedCount = 0) => {
  const result = [...items];
  for (let index = result.length - 1; index > pinnedCount; index -= 1) {
    const swapIndex =
      pinnedCount + Math.floor(Math.random() * (index - pinnedCount + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export const prioritizeCategoryChannels = (items, categoryId) => {
  if (!categoryId) return shuffleAfterPinnedItems(items);

  const getId = (value) =>
    value && typeof value === "object" ? value._id || value.id : value;
  const selectedId = String(getId(categoryId));
  const matching = [];
  const remaining = [];

  items.forEach((item) => {
    const channelCategoryId = getId(item.channel?.category);
    if (channelCategoryId && String(channelCategoryId) === selectedId) {
      matching.push(item);
    } else {
      remaining.push(item);
    }
  });

  return [
    ...shuffleAfterPinnedItems(matching),
    ...shuffleAfterPinnedItems(remaining),
  ];
};

export const rankShortsByEngagement = (shorts) => {
  const metrics = ["views", "likes", "comments"];
  const ranks = new Map(shorts.map((short) => [short.id, 0]));

  metrics.forEach((metric) => {
    [...shorts]
      .sort((left, right) => right[metric] - left[metric])
      .forEach((short, index) => {
        ranks.set(short.id, ranks.get(short.id) + index);
      });
  });

  return [...shorts].sort((left, right) => {
    const rankDifference = ranks.get(left.id) - ranks.get(right.id);
    if (rankDifference) return rankDifference;
    return (
      right.views - left.views ||
      right.likes - left.likes ||
      right.comments - left.comments
    );
  });
};

let homeFetchRequestId = 0;

// The home feed loops the same six sections over and over. Each section pulls
// its videos from one shared "buffer"; the newest page is appended and the UI
// hands out rows of 5, never repeating a video anywhere in the feed.
export const HOME_SECTIONS = [
  "recommended",
  "trending",
  "latest",
  "subscriptions",
  "shorts",
];

const HOME_SECTION_ENDPOINTS = {
  recommended: "recommended",
  trending: "trending",
  latest: "latest",
  subscriptions: "subscriptions",
  shorts: "trending-shorts",
};

const makeSectionMap = (value) =>
  HOME_SECTIONS.reduce((acc, section) => {
    acc[section] = typeof value === "function" ? value(section) : value;
    return acc;
  }, {});

export const fetchHomeVideos = createAsyncThunk(
  "videos/fetchHomeVideos",
  async ({ category, page = 1, limit = 5 } = {}, { rejectWithValue }) => {
    const requestId = ++homeFetchRequestId;
    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (category) params.set("category", category);
      const categoryParam = `?${params.toString()}`;

      const [
        recommendedVideos,
        trendingVideos,
        latestVideos,
        shortsVideos,
      ] = await Promise.all([
        fetchAllRecommendedVideos({
          apiBase: API_BASE,
          token,
        }),
        fetchAllTrendingVideos({
          apiBase: API_BASE,
          category,
          token,
        }),
        fetchAllLatestVideos({
          apiBase: API_BASE,
          category,
          token,
        }),
        fetchAllShortsVideos({
          apiBase: API_BASE,
          category,
          token,
        }),
      ]);
      const subscriptionsRes = token
        ? await fetch(`${API_BASE}/subscriptions${categoryParam}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : null;

      if (requestId !== homeFetchRequestId) return { cancelled: true };

      const trendingData = {
        videos: [...trendingVideos].sort(
          (left, right) => Number(right.views || 0) - Number(left.views || 0),
        ),
        total: trendingVideos.length,
        allPagesLoaded: true,
      };
      const latestData = {
        videos: latestVideos,
        total: latestVideos.length,
        allPagesLoaded: true,
      };
      const shortsData = {
        videos: rankShortsByEngagement(shortsVideos.map(normalizeShort)),
        total: shortsVideos.length,
        allPagesLoaded: true,
      };
      const recommendedData = {
        videos: recommendedVideos,
        total: recommendedVideos.length,
        allPagesLoaded: true,
      };
      const subscriptionsData = subscriptionsRes
        ? await subscriptionsRes.json().catch(() => ({ videos: [] }))
        : { videos: [], total: 0 };

      if (requestId !== homeFetchRequestId) return { cancelled: true };

      const getSection = (
        data,
        normalize,
        pinnedCount = 0,
        allPagesLoaded = false,
        shuffle = true,
        categoryPriority = null,
      ) => {
        const list = getVideosArray(data);
        const items = list.map(normalize);
        return {
          items: categoryPriority
            ? prioritizeCategoryChannels(items, categoryPriority)
            : shuffle
              ? shuffleAfterPinnedItems(items, page === 1 ? pinnedCount : 0)
              : items,
          hasMore:
            !allPagesLoaded &&
            (Number(data?.total) > page * limit || list.length === limit),
        };
      };

      return {
        page,
        recommended: getSection(
          recommendedData,
          normalizeVideoListItem,
          0,
          true,
          true,
          category,
        ),
        trending: getSection(
          trendingData,
          normalizeVideoListItem,
          2,
          true,
        ),
        latest: getSection(
          latestData,
          normalizeVideoListItem,
          1,
          true,
        ),
        subscriptions: getSection(subscriptionsData, normalizeVideoListItem),
        shorts: getSection(shortsData, (short) => short, 2, true),
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load videos");
    }
  },
);

export const fetchShortsFeed = createAsyncThunk(
  "videos/fetchShortsFeed",
  async ({ limit = 100 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const category = getState().videos.selectedCategory;
      const params = new URLSearchParams({ page: "1", limit: String(limit) });
      if (category) params.set("category", category);

      const response = await fetch(
        `${API_BASE}/trending-shorts?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to load Shorts");
      }

      const items = shuffleAfterPinnedItems(
        getVideosArray(data).map(normalizeShort),
        3,
      );
      return {
        category,
        items,
        page: Number(data.page) || 1,
        limit: Number(data.limit) || limit,
        total: Number(data.total) || 0,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load Shorts");
    }
  },
);

// Fetches the next page of a single home section (used to fill partially
// consumed rows and to grow the feed with fresh loop rows while scrolling).
export const fetchNextHomeSection = createAsyncThunk(
  "videos/fetchNextHomeSection",
  async ({ section, limit = 5 } = {}, { getState, rejectWithValue }) => {
    const endpoint = HOME_SECTION_ENDPOINTS[section];
    if (!endpoint) return rejectWithValue(`Unknown home section: ${section}`);

    const token = localStorage.getItem("token");

    const videosState = getState().videos;
    const page = (videosState.sectionPages[section] || 0) + 1;
    const category = videosState.selectedCategory;
    const existingItems = videosState[section];

    if (section === "subscriptions" && !token) {
      return {
        section,
        page,
        limit,
        category,
        orderedItems: existingItems,
        receivedCount: 0,
        total: 0,
      };
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (category) params.set("category", category);

    try {
      const res = await fetch(`${API_BASE}/${endpoint}?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({ videos: [] }));
      if (!res.ok) {
        return rejectWithValue(data.message || `Failed to load ${section}`);
      }

      const normalize =
        section === "shorts" ? normalizeShort : normalizeVideoListItem;
      const list = getVideosArray(data);
      const existingIds = new Set(existingItems.map((video) => video.id));
      const freshItems = list
        .map(normalize)
        .filter((video) => !existingIds.has(video.id));
      const pinnedCount =
        section === "trending" || section === "shorts" ? 3 : 0;
      return {
        section,
        page,
        limit,
        category,
        orderedItems: shuffleAfterPinnedItems(
          [...existingItems, ...freshItems],
          pinnedCount,
        ),
        receivedCount: list.length,
        total: Number(data?.total) || 0,
      };
    } catch (error) {
      return rejectWithValue(error.message || `Failed to load ${section}`);
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
  sectionPages: makeSectionMap(0),
  sectionHasMore: makeSectionMap(false),
  sectionFetching: makeSectionMap(false),
  shortsFeedRequestId: null,
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
      state.sectionPages = makeSectionMap(0);
      state.sectionHasMore = makeSectionMap(false);
      state.sectionFetching = makeSectionMap(false);
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
        // Sync the per-section loop trackers with this load.
        const loadedPage = action.payload.page || 0;
        state.sectionPages = makeSectionMap(loadedPage);
        state.sectionHasMore = makeSectionMap(
          (section) => Boolean(action.payload[section]?.hasMore),
        );
        state.sectionFetching = makeSectionMap(false);
        state.homeHasMore = Object.values(state.sectionHasMore).some(Boolean);
      })
      .addCase(fetchHomeVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load videos";
      })
      .addCase(fetchShortsFeed.pending, (state, action) => {
        state.shortsFeedRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShortsFeed.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.shortsFeedRequestId) return;
        const { category, items, page, limit, total } = action.payload;
        state.loading = false;
        if (category !== state.selectedCategory) return;
        state.error = null;
        state.shorts = items;
        state.sectionPages.shorts = page;
        state.sectionHasMore.shorts =
          total > page * limit || items.length === limit;
        state.sectionFetching.shorts = false;
      })
      .addCase(fetchShortsFeed.rejected, (state, action) => {
        if (action.meta.requestId !== state.shortsFeedRequestId) return;
        state.loading = false;
        state.error = action.payload || "Failed to load Shorts";
      })
      .addCase(fetchNextHomeSection.pending, (state, action) => {
        const { section } = action.meta.arg;
        if (HOME_SECTIONS.includes(section)) {
          state.sectionFetching[section] = true;
          if (section === "shorts") state.error = null;
        }
      })
      .addCase(fetchNextHomeSection.fulfilled, (state, action) => {
        const {
          section,
          page,
          limit,
          orderedItems,
          receivedCount,
          total,
          category,
        } =
          action.payload;
        if (!HOME_SECTIONS.includes(section)) return;
        state.sectionFetching[section] = false;
        // Ignore pages that were requested before a category switch.
        if (category !== state.selectedCategory) return;

        state[section] = orderedItems;
        state.sectionPages[section] = page;
        state.sectionHasMore[section] =
          total > page * limit || receivedCount === limit;
        state.homePage = Math.max(state.homePage || 0, page);
        state.homeHasMore = Object.values(state.sectionHasMore).some(Boolean);
      })
      .addCase(fetchNextHomeSection.rejected, (state, action) => {
        const { section } = action.meta.arg;
        if (!HOME_SECTIONS.includes(section)) return;
        state.sectionFetching[section] = false;
        // Stop feeding this section so the feed can settle.
        state.sectionHasMore[section] = false;
        state.error = action.payload || `Failed to load ${section}`;
        state.homeHasMore = Object.values(state.sectionHasMore).some(Boolean);
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

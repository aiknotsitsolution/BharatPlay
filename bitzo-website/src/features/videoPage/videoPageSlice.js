import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";
import { authFetch } from "../../utils/session";

const API_BASE = `${BACKEND_URL}/api/uservideo`;
const VIDEO_PAGE_CACHE_TTL_MS = 30_000;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: "Bearer " + token } : {};
};

const getError = (error, fallback) =>
  error?.message || fallback;

export const fetchVideoPage = createAsyncThunk(
  "videoPage/fetchVideoPage",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.video) {
        throw new Error(data.message || "Failed to load video");
      }

      let comments = [];
      try {
        const commentsResponse = await fetch(`${API_BASE}/${id}/comments`, {
          headers: authHeaders(),
        });
        const commentsData = await commentsResponse.json();
        if (commentsResponse.ok && commentsData.success) {
          comments = Array.isArray(commentsData.comments)
            ? commentsData.comments
            : [];
        }
      } catch {
        comments = [];
      }

      return {
        id,
        video: data.video,
        comments,
      };
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to load video"));
    }
  },
  {
    condition: (id, { getState }) => {
      const state = getState().videoPage;
      if (state.loading && state.id === id) return false;
      if (state.id !== id || !state.videoLoadedAt) return true;
      return Date.now() - state.videoLoadedAt >= VIDEO_PAGE_CACHE_TTL_MS;
    },
  },
);

export const fetchRelatedVideos = createAsyncThunk(
  "videoPage/fetchRelatedVideos",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/${id}/related`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load related videos");
      }
      return { id, data };
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to load related videos"));
    }
  },
);

export const updateVideoReaction = createAsyncThunk(
  "videoPage/updateVideoReaction",
  async ({ id, type }, { rejectWithValue }) => {
    try {
      const endpoint = type === "like" ? "like" : "dislike";
      const response = await fetch(`${API_BASE}/${id}/${endpoint}`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update reaction");
      }
      return data;
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to update reaction"));
    }
  },
);

export const updateSubscription = createAsyncThunk(
  "videoPage/updateSubscription",
  async ({ channelId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/subscribe/${channelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update subscription");
      }
      return data;
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to update subscription"));
    }
  },
);

export const postVideoComment = createAsyncThunk(
  "videoPage/postVideoComment",
  async ({ id, commentText, userName, userImage }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ commentText, userName, userImage }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to post comment");
      }
      return {
        _id: data.comment?._id || Date.now().toString(),
        ...(data.comment || {}),
        text: data.comment?.text || commentText,
        createdAt: data.comment?.createdAt || new Date().toISOString(),
        userName: data.comment?.userName || userName,
        userImage: data.comment?.userImage || userImage,
      };
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to post comment"));
    }
  },
);

export const toggleWatchLater = createAsyncThunk(
  "videoPage/toggleWatchLater",
  async ({ id, saved }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_BASE}/watch-later/${id}`, {
        method: saved ? "DELETE" : "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update Watch Later");
      }
      return { saved: saved ? false : data.added !== false, message: data.message };
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to update Watch Later"));
    }
  },
);

export const registerVideoView = createAsyncThunk(
  "videoPage/registerVideoView",
  async ({ id, watchedPercent }, { dispatch, rejectWithValue }) => {
    try {
      const rawUser = localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      const response = await fetch(`${API_BASE}/${id}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          watchedPercent,
          userId: user?._id || user?.id || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to register video view");
      }
      if (typeof data.views === "number") dispatch(updateVideoViews(data.views));
      return data;
    } catch (error) {
      return rejectWithValue(getError(error, "Failed to register video view"));
    }
  },
);

const initialState = {
  id: null,
  video: null,
  comments: [],
  previousVideo: null,
  nextVideo: null,
  related: [],
  loading: false,
  commentsLoading: false,
  relatedLoading: false,
  reactionLoading: false,
  subscribeLoading: false,
  commentLoading: false,
  saveLoading: false,
  error: null,
  videoLoadedAt: 0,
};

const videoPageSlice = createSlice({
  name: "videoPage",
  initialState,
  reducers: {
    resetVideoPage: () => initialState,
    updateVideoViews: (state, action) => {
      if (state.video && typeof action.payload === "number") {
        state.video.views = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideoPage.pending, (state, action) => {
        state.id = action.meta.arg;
        state.video = null;
        state.comments = [];
        state.error = null;
        state.loading = true;
      })
      .addCase(fetchVideoPage.fulfilled, (state, action) => {
        state.loading = false;
        state.videoLoadedAt = Date.now();
        state.video = action.payload.video;
        state.comments = action.payload.comments;
      })
      .addCase(fetchVideoPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load video";
      })
      .addCase(fetchRelatedVideos.pending, (state) => {
        state.relatedLoading = true;
      })
      .addCase(fetchRelatedVideos.fulfilled, (state, action) => {
        state.relatedLoading = false;
        state.related = action.payload.data.videos || [];
        state.previousVideo = action.payload.data.previousVideo || null;
        state.nextVideo = action.payload.data.nextVideo || null;
      })
      .addCase(fetchRelatedVideos.rejected, (state) => {
        state.relatedLoading = false;
      })
      .addCase(updateVideoReaction.pending, (state) => {
        state.reactionLoading = true;
      })
      .addCase(updateVideoReaction.fulfilled, (state, action) => {
        state.reactionLoading = false;
        if (state.video) {
          state.video.likesCount = action.payload.likes ?? 0;
          state.video.dislikesCount = action.payload.dislikes ?? 0;
          state.video.userReaction = action.payload.reaction;
        }
      })
      .addCase(updateVideoReaction.rejected, (state) => {
        state.reactionLoading = false;
      })
      .addCase(updateSubscription.pending, (state) => {
        state.subscribeLoading = true;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.subscribeLoading = false;
        if (state.video) {
          state.video.isSubscribed = Boolean(action.payload.subscribed);
          state.video.subscribersCount = action.payload.subscribersCount;
        }
      })
      .addCase(updateSubscription.rejected, (state) => {
        state.subscribeLoading = false;
      })
      .addCase(postVideoComment.pending, (state) => {
        state.commentLoading = true;
      })
      .addCase(postVideoComment.fulfilled, (state, action) => {
        state.commentLoading = false;
        state.comments.unshift(action.payload);
      })
      .addCase(postVideoComment.rejected, (state) => {
        state.commentLoading = false;
      })
      .addCase(toggleWatchLater.pending, (state) => {
        state.saveLoading = true;
      })
      .addCase(toggleWatchLater.fulfilled, (state, action) => {
        state.saveLoading = false;
        if (state.video) state.video.isWatchLater = action.payload.saved;
      })
      .addCase(toggleWatchLater.rejected, (state) => {
        state.saveLoading = false;
      });
  },
});

export const { resetVideoPage, updateVideoViews } = videoPageSlice.actions;
export default videoPageSlice.reducer;

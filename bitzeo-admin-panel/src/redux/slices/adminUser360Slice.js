import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api";
import {
  suspendAdminUser, restoreAdminUser, banAdminUser,
  disableAdminChannel, enableAdminChannel, banAdminChannel, restoreAdminChannel, deleteAdminChannel,
  disableAdminVideo, enableAdminVideo, deleteAdminVideo,
  disableAdminShort, enableAdminShort, deleteAdminShort,
} from "../../api";

export const fetchAdminUserOverview = createAsyncThunk(
  "adminUser360/fetchAdminUserOverview",
  async ({ userId, force }, { getState, rejectWithValue }) => {
    if (!force) {
      const e = getState().adminUser360.overview[userId];
      if (e?._loaded) return { userId, skip: true };
    }
    try {
      const res = await API.get(`/admin/users/${userId}/overview`);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.overview[userId]?._loading }
);

export const fetchAdminUserActivity = createAsyncThunk(
  "adminUser360/fetchAdminUserActivity",
  async ({ userId, page = 1, limit = 25, filter = "" }, { getState, rejectWithValue }) => {
    const e = getState().adminUser360.activity[userId];
    if (e?._loaded && e?._page === page && (e?._filter || "") === (filter || "")) {
      return { userId, skip: true };
    }
    try {
      const params = { page, limit };
      if (filter) params.type = filter;
      const res = await API.get(`/admin/users/${userId}/activity`, { params });
      return { userId, data: res.data, _page: page, _filter: filter };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.activity[userId]?._loading }
);

export const fetchAdminUserWatchHistory = createAsyncThunk(
  "adminUser360/fetchAdminUserWatchHistory",
  async ({ userId, page = 1, limit = 20 }, { getState, rejectWithValue }) => {
    const e = getState().adminUser360.watchHistory[userId];
    if (e?._loaded && e?._page === page) {
      return { userId, skip: true };
    }
    try {
      const res = await API.get(`/admin/users/${userId}/watch-history`, { params: { page, limit } });
      return { userId, data: res.data, _page: page };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.watchHistory[userId]?._loading }
);

export const fetchAdminUserEngagement = createAsyncThunk(
  "adminUser360/fetchAdminUserEngagement",
  async ({ userId, force }, { getState, rejectWithValue }) => {
    if (!force) {
      const e = getState().adminUser360.engagement[userId];
      if (e?._loaded) return { userId, skip: true };
    }
    try {
      const res = await API.get(`/admin/users/${userId}/engagement`);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.engagement[userId]?._loading }
);

export const fetchAdminUserSubscriptions = createAsyncThunk(
  "adminUser360/fetchAdminUserSubscriptions",
  async ({ userId, force }, { getState, rejectWithValue }) => {
    if (!force) {
      const e = getState().adminUser360.subscriptions[userId];
      if (e?._loaded) return { userId, skip: true };
    }
    try {
      const res = await API.get(`/admin/users/${userId}/subscriptions`);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.subscriptions[userId]?._loading }
);

export const fetchAdminUserFraudEvents = createAsyncThunk(
  "adminUser360/fetchAdminUserFraudEvents",
  async ({ userId, page = 1, limit = 25, severity = "" }, { getState, rejectWithValue }) => {
    const e = getState().adminUser360.fraudEvents[userId];
    if (e?._loaded && e?._page === page && (e?._severity || "") === (severity || "")) {
      return { userId, skip: true };
    }
    try {
      const params = { page, limit };
      if (severity) params.severity = severity;
      const res = await API.get(`/admin/users/${userId}/fraud-events`, { params });
      return { userId, data: res.data, _page: page, _severity: severity };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.fraudEvents[userId]?._loading }
);

export const fetchAdminUserDevices = createAsyncThunk(
  "adminUser360/fetchAdminUserDevices",
  async ({ userId, force }, { getState, rejectWithValue }) => {
    if (!force) {
      const e = getState().adminUser360.devices[userId];
      if (e?._loaded) return { userId, skip: true };
    }
    try {
      const res = await API.get(`/admin/users/${userId}/devices`);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.devices[userId]?._loading }
);

export const fetchAdminUserNotifications = createAsyncThunk(
  "adminUser360/fetchAdminUserNotifications",
  async ({ userId, page = 1, limit = 50, force }, { getState, rejectWithValue }) => {
    if (!force) {
      const e = getState().adminUser360.notifications[userId];
      if (e?._loaded) return { userId, skip: true };
    }
    try {
      const res = await API.get(`/admin/users/${userId}/notifications`, { params: { page, limit } });
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.notifications[userId]?._loading }
);

export const updateUser = createAsyncThunk(
  "adminUser360/updateUser",
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const res = await API.put(`/admin/users/${userId}`, data);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const deleteUser = createAsyncThunk(
  "adminUser360/deleteUser",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const res = await API.delete(`/admin/users/${userId}`);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const suspendUser = createAsyncThunk(
  "adminUser360/suspendUser",
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const res = await suspendAdminUser(userId, reason);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const restoreUser = createAsyncThunk(
  "adminUser360/restoreUser",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const res = await restoreAdminUser(userId);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const banUser = createAsyncThunk(
  "adminUser360/banUser",
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const res = await banAdminUser(userId, reason);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

// ==================== CHANNEL MODERATION THUNKS ====================

export const disableChannel = createAsyncThunk(
  "adminUser360/disableChannel",
  async ({ userId, channelId, reason }, { rejectWithValue }) => {
    try {
      const res = await disableAdminChannel(userId, channelId, reason);
      return { userId, channelId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const enableChannel = createAsyncThunk(
  "adminUser360/enableChannel",
  async ({ userId, channelId }, { rejectWithValue }) => {
    try {
      const res = await enableAdminChannel(userId, channelId);
      return { userId, channelId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const banChannel = createAsyncThunk(
  "adminUser360/banChannel",
  async ({ userId, channelId, reason }, { rejectWithValue }) => {
    try {
      const res = await banAdminChannel(userId, channelId, reason);
      return { userId, channelId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const restoreChannel = createAsyncThunk(
  "adminUser360/restoreChannel",
  async ({ userId, channelId }, { rejectWithValue }) => {
    try {
      const res = await restoreAdminChannel(userId, channelId);
      return { userId, channelId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const deleteChannel = createAsyncThunk(
  "adminUser360/deleteChannel",
  async ({ userId, channelId, reason }, { rejectWithValue }) => {
    try {
      const res = await deleteAdminChannel(userId, channelId, reason);
      return { userId, channelId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

// ==================== VIDEO MODERATION THUNKS ====================

export const disableVideo = createAsyncThunk(
  "adminUser360/disableVideo",
  async ({ userId, videoId, reason }, { rejectWithValue }) => {
    try {
      const res = await disableAdminVideo(userId, videoId, reason);
      return { userId, videoId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const enableVideo = createAsyncThunk(
  "adminUser360/enableVideo",
  async ({ userId, videoId }, { rejectWithValue }) => {
    try {
      const res = await enableAdminVideo(userId, videoId);
      return { userId, videoId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const deleteVideo = createAsyncThunk(
  "adminUser360/deleteVideo",
  async ({ userId, videoId, reason }, { rejectWithValue }) => {
    try {
      const res = await deleteAdminVideo(userId, videoId, reason);
      return { userId, videoId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

// ==================== SHORT MODERATION THUNKS ====================

export const disableShort = createAsyncThunk(
  "adminUser360/disableShort",
  async ({ userId, videoId, reason }, { rejectWithValue }) => {
    try {
      const res = await disableAdminShort(userId, videoId, reason);
      return { userId, videoId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const enableShort = createAsyncThunk(
  "adminUser360/enableShort",
  async ({ userId, videoId }, { rejectWithValue }) => {
    try {
      const res = await enableAdminShort(userId, videoId);
      return { userId, videoId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const deleteShort = createAsyncThunk(
  "adminUser360/deleteShort",
  async ({ userId, videoId, reason }, { rejectWithValue }) => {
    try {
      const res = await deleteAdminShort(userId, videoId, reason);
      return { userId, videoId, data: res.data };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  }
);

export const fetchAdminUserChannelsRedux = createAsyncThunk(
  "adminUser360/fetchAdminUserChannelsRedux",
  async ({ userId, page = 1, limit = 10, search = "" }, { getState, rejectWithValue }) => {
    const key = `${page}:${limit}:${search}`;
    const e = getState().adminUser360.channels[userId];
    if (e?._loaded && e?._key === key) return { userId, skip: true };
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const res = await API.get(`/admin/users/${userId}/channels`, { params });
      return { userId, data: res.data, _key: key, _page: page, _search: search, _limit: limit };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.channels[userId]?._loading }
);

export const fetchAdminUserVideosRedux = createAsyncThunk(
  "adminUser360/fetchAdminUserVideosRedux",
  async ({ userId, channelId, page = 1, limit = 10, search = "", sortBy = "createdAt", sortOrder = "desc" }, { getState, rejectWithValue }) => {
    const key = `${channelId}:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;
    const e = getState().adminUser360.videos[userId];
    if (e?._loaded && e?._key === key) return { userId, skip: true };
    try {
      const params = { page, limit, sortBy, sortOrder };
      if (channelId) params.channelId = channelId;
      if (search) params.search = search;
      const res = await API.get(`/admin/users/${userId}/videos`, { params });
      return { userId, data: res.data, _key: key };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.videos[userId]?._loading }
);

export const fetchAdminUserShortsRedux = createAsyncThunk(
  "adminUser360/fetchAdminUserShortsRedux",
  async ({ userId, channelId, page = 1, limit = 10, search = "", sortBy = "createdAt", sortOrder = "desc" }, { getState, rejectWithValue }) => {
    const key = `${channelId}:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;
    const e = getState().adminUser360.shorts[userId];
    if (e?._loaded && e?._key === key) return { userId, skip: true };
    try {
      const params = { page, limit, sortBy, sortOrder };
      if (channelId) params.channelId = channelId;
      if (search) params.search = search;
      const res = await API.get(`/admin/users/${userId}/shorts`, { params });
      return { userId, data: res.data, _key: key };
    } catch (err) {
      return rejectWithValue({ userId, error: err.response?.data || { message: err.message } });
    }
  },
  { condition: ({ userId }, { getState }) => !getState().adminUser360.shorts[userId]?._loading }
);

function ensureSection(state, key, userId) {
  if (!state[key]) state[key] = {};
  if (!state[key][userId]) state[key][userId] = {};
}

function sectionPending(state, key, userId) {
  ensureSection(state, key, userId);
  state[key][userId]._loading = true;
  state[key][userId]._error = null;
}

function sectionFulfilled(state, key, userId, data) {
  ensureSection(state, key, userId);
  state[key][userId]._loading = false;
  state[key][userId]._loaded = true;
  state[key][userId]._error = null;
  if (data && typeof data === "object") {
    Object.assign(state[key][userId], data);
  }
}

function sectionRejected(state, key, userId, error) {
  ensureSection(state, key, userId);
  state[key][userId]._loading = false;
  state[key][userId]._loaded = false;
  state[key][userId]._error = error;
}

const adminUser360Slice = createSlice({
  name: "adminUser360",
  initialState: {
    overview: {},
    channels: {},
    videos: {},
    shorts: {},
    activity: {},
    watchHistory: {},
    engagement: {},
    subscriptions: {},
    fraudEvents: {},
    devices: {},
    notifications: {},
    updateResult: null,
    deleteResult: null,
    suspendResult: null,
    restoreResult: null,
    banResult: null,
    channelModerationResult: null,
    videoModerationResult: null,
    shortModerationResult: null,
  },
  reducers: {
    clearAllUser360(state, { payload }) {
      const userId = payload;
      ["users", "overview", "channels", "videos", "shorts", "activity", "watchHistory", "engagement", "subscriptions", "fraudEvents", "devices", "notifications"].forEach((k) => {
        if (state[k]?.[userId]) delete state[k][userId];
      });
    },
    clearUpdateResult(state) {
      state.updateResult = null;
    },
    clearDeleteResult(state) {
      state.deleteResult = null;
    },
    clearSuspendResult(state) {
      state.suspendResult = null;
    },
    clearRestoreResult(state) {
      state.restoreResult = null;
    },
    clearBanResult(state) {
      state.banResult = null;
    },
    clearChannelModerationResult(state) {
      state.channelModerationResult = null;
    },
    clearVideoModerationResult(state) {
      state.videoModerationResult = null;
    },
    clearShortModerationResult(state) {
      state.shortModerationResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUserOverview.pending, (s, a) => { sectionPending(s, "overview", a.meta.arg.userId); })
      .addCase(fetchAdminUserOverview.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "overview", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserOverview.rejected, (s, a) => { sectionRejected(s, "overview", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserActivity.pending, (s, a) => { sectionPending(s, "activity", a.meta.arg.userId); })
      .addCase(fetchAdminUserActivity.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "activity", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserActivity.rejected, (s, a) => { sectionRejected(s, "activity", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserWatchHistory.pending, (s, a) => { sectionPending(s, "watchHistory", a.meta.arg.userId); })
      .addCase(fetchAdminUserWatchHistory.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "watchHistory", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserWatchHistory.rejected, (s, a) => { sectionRejected(s, "watchHistory", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserEngagement.pending, (s, a) => { sectionPending(s, "engagement", a.meta.arg.userId); })
      .addCase(fetchAdminUserEngagement.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "engagement", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserEngagement.rejected, (s, a) => { sectionRejected(s, "engagement", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserSubscriptions.pending, (s, a) => { sectionPending(s, "subscriptions", a.meta.arg.userId); })
      .addCase(fetchAdminUserSubscriptions.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "subscriptions", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserSubscriptions.rejected, (s, a) => { sectionRejected(s, "subscriptions", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserFraudEvents.pending, (s, a) => { sectionPending(s, "fraudEvents", a.meta.arg.userId); })
      .addCase(fetchAdminUserFraudEvents.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "fraudEvents", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserFraudEvents.rejected, (s, a) => { sectionRejected(s, "fraudEvents", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserDevices.pending, (s, a) => { sectionPending(s, "devices", a.meta.arg.userId); })
      .addCase(fetchAdminUserDevices.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "devices", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserDevices.rejected, (s, a) => { sectionRejected(s, "devices", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserNotifications.pending, (s, a) => { sectionPending(s, "notifications", a.meta.arg.userId); })
      .addCase(fetchAdminUserNotifications.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "notifications", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserNotifications.rejected, (s, a) => { sectionRejected(s, "notifications", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(updateUser.pending, (s) => { s.updateResult = { loading: true, error: null }; })
      .addCase(updateUser.fulfilled, (s, a) => { s.updateResult = { loading: false, data: a.payload.data, error: null }; })
      .addCase(updateUser.rejected, (s, a) => { s.updateResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(deleteUser.pending, (s) => { s.deleteResult = { loading: true, error: null }; })
      .addCase(deleteUser.fulfilled, (s, a) => { s.deleteResult = { loading: false, data: a.payload.data, error: null }; })
      .addCase(deleteUser.rejected, (s, a) => { s.deleteResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(suspendUser.pending, (s) => { s.suspendResult = { loading: true, error: null }; })
      .addCase(suspendUser.fulfilled, (s, a) => {
        s.suspendResult = { loading: false, data: a.payload.data, error: null };
        const userId = a.payload.userId;
        if (s.users[userId]?._loaded && s.users[userId].data) {
          s.users[userId].data.status = "suspended";
        }
        if (s.overview[userId]?._loaded && s.overview[userId].data?.user) {
          s.overview[userId].data.user.status = "suspended";
        }
      })
      .addCase(suspendUser.rejected, (s, a) => { s.suspendResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(restoreUser.pending, (s) => { s.restoreResult = { loading: true, error: null }; })
      .addCase(restoreUser.fulfilled, (s, a) => {
        s.restoreResult = { loading: false, data: a.payload.data, error: null };
        const userId = a.payload.userId;
        if (s.users[userId]?._loaded && s.users[userId].data) {
          s.users[userId].data.status = "active";
        }
        if (s.overview[userId]?._loaded && s.overview[userId].data?.user) {
          s.overview[userId].data.user.status = "active";
        }
      })
      .addCase(restoreUser.rejected, (s, a) => { s.restoreResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(banUser.pending, (s) => { s.banResult = { loading: true, error: null }; })
      .addCase(banUser.fulfilled, (s, a) => {
        s.banResult = { loading: false, data: a.payload.data, error: null };
        const userId = a.payload.userId;
        if (s.users[userId]?._loaded && s.users[userId].data) {
          s.users[userId].data.status = "banned";
        }
        if (s.overview[userId]?._loaded && s.overview[userId].data?.user) {
          s.overview[userId].data.user.status = "banned";
        }
      })
      .addCase(banUser.rejected, (s, a) => { s.banResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      // ==================== CHANNEL MODERATION ====================
      .addCase(disableChannel.pending, (s) => { s.channelModerationResult = { loading: true, error: null }; })
      .addCase(disableChannel.fulfilled, (s, a) => {
        s.channelModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, channelId } = a.payload;
        const chItems = s.channels[userId]?.items;
        if (chItems) {
          const ch = chItems.find((c) => c._id === channelId);
          if (ch) ch.status = "disabled";
        }
      })
      .addCase(disableChannel.rejected, (s, a) => { s.channelModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(enableChannel.pending, (s) => { s.channelModerationResult = { loading: true, error: null }; })
      .addCase(enableChannel.fulfilled, (s, a) => {
        s.channelModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, channelId } = a.payload;
        const chItems = s.channels[userId]?.items;
        if (chItems) {
          const ch = chItems.find((c) => c._id === channelId);
          if (ch) ch.status = "active";
        }
      })
      .addCase(enableChannel.rejected, (s, a) => { s.channelModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(banChannel.pending, (s) => { s.channelModerationResult = { loading: true, error: null }; })
      .addCase(banChannel.fulfilled, (s, a) => {
        s.channelModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, channelId } = a.payload;
        const chItems = s.channels[userId]?.items;
        if (chItems) {
          const ch = chItems.find((c) => c._id === channelId);
          if (ch) ch.status = "banned";
        }
      })
      .addCase(banChannel.rejected, (s, a) => { s.channelModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(restoreChannel.pending, (s) => { s.channelModerationResult = { loading: true, error: null }; })
      .addCase(restoreChannel.fulfilled, (s, a) => {
        s.channelModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, channelId } = a.payload;
        const chItems = s.channels[userId]?.items;
        if (chItems) {
          const ch = chItems.find((c) => c._id === channelId);
          if (ch) ch.status = "active";
        }
      })
      .addCase(restoreChannel.rejected, (s, a) => { s.channelModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(deleteChannel.pending, (s) => { s.channelModerationResult = { loading: true, error: null }; })
      .addCase(deleteChannel.fulfilled, (s, a) => {
        s.channelModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, channelId } = a.payload;
        const chState = s.channels[userId];
        if (chState?.items) {
          chState.items = chState.items.filter((c) => c._id !== channelId);
        }
      })
      .addCase(deleteChannel.rejected, (s, a) => { s.channelModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      // ==================== VIDEO MODERATION ====================
      .addCase(disableVideo.pending, (s) => { s.videoModerationResult = { loading: true, error: null }; })
      .addCase(disableVideo.fulfilled, (s, a) => {
        s.videoModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, videoId } = a.payload;
        const vItems = s.videos[userId]?.items;
        if (vItems) {
          const v = vItems.find((item) => item._id === videoId);
          if (v) v.status = "disabled";
        }
      })
      .addCase(disableVideo.rejected, (s, a) => { s.videoModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(enableVideo.pending, (s) => { s.videoModerationResult = { loading: true, error: null }; })
      .addCase(enableVideo.fulfilled, (s, a) => {
        s.videoModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, videoId } = a.payload;
        const vItems = s.videos[userId]?.items;
        if (vItems) {
          const v = vItems.find((item) => item._id === videoId);
          if (v) v.status = "active";
        }
      })
      .addCase(enableVideo.rejected, (s, a) => { s.videoModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(deleteVideo.pending, (s) => { s.videoModerationResult = { loading: true, error: null }; })
      .addCase(deleteVideo.fulfilled, (s, a) => {
        s.videoModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, videoId } = a.payload;
        const vState = s.videos[userId];
        if (vState?.items) {
          vState.items = vState.items.filter((item) => item._id !== videoId);
        }
      })
      .addCase(deleteVideo.rejected, (s, a) => { s.videoModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      // ==================== SHORT MODERATION ====================
      .addCase(disableShort.pending, (s) => { s.shortModerationResult = { loading: true, error: null }; })
      .addCase(disableShort.fulfilled, (s, a) => {
        s.shortModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, videoId } = a.payload;
        const sItems = s.shorts[userId]?.items;
        if (sItems) {
          const v = sItems.find((item) => item._id === videoId);
          if (v) v.status = "disabled";
        }
      })
      .addCase(disableShort.rejected, (s, a) => { s.shortModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(enableShort.pending, (s) => { s.shortModerationResult = { loading: true, error: null }; })
      .addCase(enableShort.fulfilled, (s, a) => {
        s.shortModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, videoId } = a.payload;
        const sItems = s.shorts[userId]?.items;
        if (sItems) {
          const v = sItems.find((item) => item._id === videoId);
          if (v) v.status = "active";
        }
      })
      .addCase(enableShort.rejected, (s, a) => { s.shortModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(deleteShort.pending, (s) => { s.shortModerationResult = { loading: true, error: null }; })
      .addCase(deleteShort.fulfilled, (s, a) => {
        s.shortModerationResult = { loading: false, data: a.payload.data, error: null };
        const { userId, videoId } = a.payload;
        const sState = s.shorts[userId];
        if (sState?.items) {
          sState.items = sState.items.filter((item) => item._id !== videoId);
        }
      })
      .addCase(deleteShort.rejected, (s, a) => { s.shortModerationResult = { loading: false, error: a.payload?.error || { message: a.error?.message } }; })

      .addCase(fetchAdminUserChannelsRedux.pending, (s, a) => { sectionPending(s, "channels", a.meta.arg.userId); })
      .addCase(fetchAdminUserChannelsRedux.fulfilled, (s, a) => {
        if (a.payload.skip) return;
        const { userId, data, _key, _page, _search, _limit } = a.payload;
        ensureSection(s, "channels", userId);
        s.channels[userId]._loading = false;
        s.channels[userId]._loaded = true;
        s.channels[userId]._error = null;
        s.channels[userId]._key = _key;
        s.channels[userId]._page = _page;
        s.channels[userId]._search = _search;
        s.channels[userId]._limit = _limit;
        if (data && typeof data === "object") {
          Object.assign(s.channels[userId], data);
        }
      })
      .addCase(fetchAdminUserChannelsRedux.rejected, (s, a) => { sectionRejected(s, "channels", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserVideosRedux.pending, (s, a) => { sectionPending(s, "videos", a.meta.arg.userId); })
      .addCase(fetchAdminUserVideosRedux.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "videos", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserVideosRedux.rejected, (s, a) => { sectionRejected(s, "videos", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); })

      .addCase(fetchAdminUserShortsRedux.pending, (s, a) => { sectionPending(s, "shorts", a.meta.arg.userId); })
      .addCase(fetchAdminUserShortsRedux.fulfilled, (s, a) => { if (!a.payload.skip) sectionFulfilled(s, "shorts", a.payload.userId, a.payload.data); })
      .addCase(fetchAdminUserShortsRedux.rejected, (s, a) => { sectionRejected(s, "shorts", a.meta.arg.userId, a.payload?.error || { message: a.error?.message }); });
  },
});

export const {
  clearAllUser360,
  clearUpdateResult,
  clearDeleteResult,
  clearSuspendResult,
  clearRestoreResult,
  clearBanResult,
  clearChannelModerationResult,
  clearVideoModerationResult,
  clearShortModerationResult,
} = adminUser360Slice.actions;
export default adminUser360Slice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { formatWatchTime } from "../../utils/watchTime";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";
import { authFetch, clearAuthState } from "../../utils/session";

const normalizeProfileVideos = (videos = []) =>
  Array.isArray(videos)
    ? videos.map((video) => ({
        id: video._id || video.id,
        title: video.title || "Untitled video",
        thumbnail:
          video.thumbnail ||
          "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400",
        views: Number(video.views || 0),
        likesCount: Number(video.likesCount || 0),
        duration: video.duration || "—",
        uploadDate: video.createdAt
          ? new Date(video.createdAt).toLocaleDateString("en-IN")
          : "Recently uploaded",
        status: "Public",
        raw: video,
      }))
    : [];

const normalizeHistoryVideos = (videos = []) =>
  Array.isArray(videos)
    ? videos.map((video) => ({
        id: video._id || video.id,
        title: video.title || "Untitled video",
        thumbnail:
          video.thumbnail ||
          "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400",
        channel: video.channel?.name || video.channelName || "Unknown channel",
        views: Number(video.views || 0),
        duration: video.duration || "—",
        watchedAt: video.watchedAt || video.updatedAt || video.createdAt,
        raw: video,
      }))
    : [];

export const fetchProfileData = createAsyncThunk(
  "profile/fetchProfileData",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please login first.");

      const profileRes = await authFetch(
        `${BACKEND_URL}/api/me?tzOffsetMinutes=${new Date().getTimezoneOffset()}`,
        {
          method: "GET",
        },
      );

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          clearAuthState();
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`Server error: ${profileRes.status}`);
      }

      const profileData = await profileRes.json();
      if (!profileData.success || !profileData.user) {
        throw new Error("Invalid profile data received");
      }

      const profile = profileData.user;
      const profileVideos = normalizeProfileVideos(profile.videos);

      let historyItems = [];
      try {
        const historyRes = await authFetch(
          `${BACKEND_URL}/api/uservideo/history`,
          {
            method: "GET",
          },
        );

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          historyItems = normalizeHistoryVideos(historyData.videos);
        }
      } catch (historyErr) {
        console.error("Failed to load watch history:", historyErr);
      }

      return {
        user: {
          _id: profile._id,
          name: profile.name || "User",
          handle: `@${(profile.name || "user").toLowerCase().replace(/\s+/g, "")}`,
          email: profile.email || "",
          phone: profile.phone || "",
          phoneVerified: Boolean(profile.phoneVerified),
          deviceVerified: Boolean(profile.deviceVerified),
          advertisingId: profile.advertisingId || "",
          deviceFingerprint: profile.deviceFingerprint || "",
          country: profile.country || "",
          timezone: profile.timezone || "",
          simMcc: profile.simMcc || "",
          trustScore: profile.trustScore ?? 50,
          trustTier: profile.trustTier || "standard",
          walletBalance: profile.walletBalance || 0,
          pendingBalance: profile.pendingBalance || 0,
          totalWithdrawn: profile.totalWithdrawn || 0,
          minimumWithdrawal: profile.minimumWithdrawal || 0,
          withdrawalStatus: profile.withdrawalStatus || "none",
          avatar:
            profile.avatar ||
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
          createdAt: profile.createdAt
            ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })
            : "Unknown date",
          subscribers: profile.subscribers || 0,
          totalVideos: profile.totalVideos || profile.videos?.length || 0,
          totalViews: profile.totalViews || 0,
          totalEarnings: profile.totalEarnings || 0,
          avgRPM: profile.avgRPM || "0.0",
          watchTimeToday: formatWatchTime(profile.watchTimeTodaySeconds),
          watchTimeTotal: formatWatchTime(profile.watchTimeTotalSeconds),
          watchTimeTodaySeconds: profile.watchTimeTodaySeconds || 0,
          watchTimeTotalSeconds: profile.watchTimeTotalSeconds || 0,
          videos: profileVideos,
        },
        myVideos: profileVideos,
        historyVideos: historyItems,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load profile");
    }
  },
);

export const removeHistoryItem = createAsyncThunk(
  "profile/removeHistoryItem",
  async (videoId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login again");
      const res = await authFetch(
        `${BACKEND_URL}/api/uservideo/history/${videoId}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to remove from history");
      }
      return videoId;
    } catch (error) {
      return rejectWithValue(error.message || "Something went wrong");
    }
  },
);

const initialState = {
  user: null,
  myVideos: [],
  historyVideos: [],
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfileData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.myVideos = action.payload.myVideos;
        state.historyVideos = action.payload.historyVideos;
      })
      .addCase(fetchProfileData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load profile";
      })
      .addCase(removeHistoryItem.fulfilled, (state, action) => {
        state.historyVideos = state.historyVideos.filter(
          (video) => video.id !== action.payload,
        );
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  ArrowLeft,
  Loader2,
  Tv,
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  Shield,
  Mail,
  AlertTriangle,
  Clapperboard,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Clock,
  Heart,
  Bell,
  Smartphone,
  AlertOctagon,
  BarChart3,
  Play,
  MonitorPlay,
} from "lucide-react";
import { hasFeature } from "../../config/roleConfig";
import {
  fetchAdminUserOverview,
  fetchAdminUserActivity,
  fetchAdminUserWatchHistory,
  fetchAdminUserEngagement,
  fetchAdminUserSubscriptions,
  fetchAdminUserNotifications,
  fetchAdminUserDevices,
  fetchAdminUserFraudEvents,
  fetchAdminUserChannelsRedux,
  fetchAdminUserVideosRedux,
  fetchAdminUserShortsRedux,
} from "../../redux/slices/adminUser360Slice";

function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "channels", label: "Channels", icon: Tv },
  { key: "engagement", label: "Engagement", icon: Heart },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "security", label: "Security", icon: Shield },
];

export default function User360() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("overview");

  const [selectedChannelId, setSelectedChannelId] = useState(null);

  const [channelContentTab, setChannelContentTab] = useState("videos");

  const [activityFilter, setActivityFilter] = useState("");
  const [fraudFilter, setFraudFilter] = useState("");

  // ==================== REDUX SELECTORS ====================
  const overviewState = useSelector((s) => s.adminUser360.overview[userId]);
  const overviewLoading = overviewState?._loading ?? true;
  const overviewError = overviewState?._error ?? null;
  const data = overviewState?._loaded ? overviewState.data || null : null;

  const channelsState = useSelector((s) => s.adminUser360.channels[userId]);
  const channelsLoading = channelsState?._loading ?? false;
  const channelsRaw = channelsState?._loaded ? channelsState.items : null;
  const channels = useMemo(() => channelsRaw || [], [channelsRaw]);

  const effectiveSelectedChannelId = useMemo(
    () => selectedChannelId || channels[0]?._id || null,
    [selectedChannelId, channels],
  );

  const videosState = useSelector((s) => s.adminUser360.videos[userId]);
  const videosLoading = videosState?._loading ?? false;
  const videosError = videosState?._error ?? null;
  const videos = videosState?._loaded ? (videosState.items || []) : [];
  const videosPagination = videosState?._loaded
    ? (videosState.pagination || { page: 1, totalPages: 1 })
    : { page: 1, totalPages: 1 };

  const shortsState = useSelector((s) => s.adminUser360.shorts[userId]);
  const shortsLoading = shortsState?._loading ?? false;
  const shortsError = shortsState?._error ?? null;
  const shorts = shortsState?._loaded ? (shortsState.items || []) : [];
  const shortsPagination = shortsState?._loaded
    ? (shortsState.pagination || { page: 1, totalPages: 1 })
    : { page: 1, totalPages: 1 };

  const engagementState = useSelector((s) => s.adminUser360.engagement[userId]);
  const engagementLoading = engagementState?._loading ?? false;
  const engagementData = engagementState?._loaded ? (engagementState.engagement || null) : null;

  const subscriptionsState = useSelector((s) => s.adminUser360.subscriptions[userId]);
  const subscriptionsLoading = subscriptionsState?._loading ?? false;
  const subscriptions = subscriptionsState?._loaded ? (subscriptionsState.subscriptions || []) : [];

  const watchHistoryState = useSelector((s) => s.adminUser360.watchHistory[userId]);
  const watchHistoryLoading = watchHistoryState?._loading ?? false;
  const watchHistory = watchHistoryState?._loaded ? (watchHistoryState.sessions || []) : [];
  const watchHistoryPagination = watchHistoryState?._loaded
    ? (watchHistoryState.pagination || { page: 1, totalPages: 1, total: 0 })
    : { page: 1, totalPages: 1, total: 0 };

  const activityState = useSelector((s) => s.adminUser360.activity[userId]);
  const activityLoading = activityState?._loading ?? false;
  const activityEvents = activityState?._loaded ? (activityState.events || []) : [];
  const activityPagination = activityState?._loaded
    ? (activityState.pagination || { page: 1, totalPages: 1, total: 0 })
    : { page: 1, totalPages: 1, total: 0 };

  const devicesState = useSelector((s) => s.adminUser360.devices[userId]);
  const devicesLoading = devicesState?._loading ?? false;
  const devices = devicesState?._loaded ? (devicesState.devices || []) : [];
  const activeSessions = devicesState?._loaded ? (devicesState.activeSessions || 0) : 0;
  const currentDeviceId = devicesState?._loaded ? (devicesState.currentDeviceId || null) : null;

  const fraudState = useSelector((s) => s.adminUser360.fraudEvents[userId]);
  const fraudLoading = fraudState?._loading ?? false;
  const fraudEvents = fraudState?._loaded ? (fraudState.events || []) : [];
  const severityCounts = fraudState?._loaded ? (fraudState.severityCounts || {}) : {};
  const fraudPagination = fraudState?._loaded
    ? (fraudState.pagination || { page: 1, totalPages: 1, total: 0 })
    : { page: 1, totalPages: 1, total: 0 };

  const notificationsState = useSelector((s) => s.adminUser360.notifications[userId]);
  const notificationsLoading = notificationsState?._loading ?? false;
  const notifications = notificationsState?._loaded ? (notificationsState.notifications || []) : [];
  const unreadCount = notificationsState?._loaded ? (notificationsState.unreadCount || 0) : 0;

  const selectedChannel = channels.find((ch) => ch._id === effectiveSelectedChannelId) || null;

  // ==================== LOAD OVERVIEW ====================
  useEffect(() => {
    dispatch(fetchAdminUserOverview({ userId }));
  }, [userId, dispatch]);

  // ==================== LOAD CHANNELS ====================
  useEffect(() => {
    dispatch(fetchAdminUserChannelsRedux({ userId }));
  }, [userId, dispatch]);

  // ==================== TAB DATA LOADING ====================
  useEffect(() => {
    if (activeTab === "engagement") {
      dispatch(fetchAdminUserEngagement({ userId }));
      dispatch(fetchAdminUserSubscriptions({ userId }));
    }
    if (activeTab === "activity") {
      dispatch(fetchAdminUserActivity({ userId, page: 1, filter: activityFilter }));
      dispatch(fetchAdminUserWatchHistory({ userId, page: 1 }));
    }
    if (activeTab === "security") {
      dispatch(fetchAdminUserDevices({ userId }));
      dispatch(fetchAdminUserFraudEvents({ userId, page: 1, severity: fraudFilter }));
      dispatch(fetchAdminUserNotifications({ userId, page: 1, limit: 50 }));
    }
  }, [activeTab, userId, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==================== FILTER CHANGES ====================
  useEffect(() => {
    if (activeTab === "activity") {
      dispatch(fetchAdminUserActivity({ userId, page: 1, filter: activityFilter }));
    }
  }, [activityFilter, activeTab, userId, dispatch]);

  useEffect(() => {
    if (activeTab === "security") {
      dispatch(fetchAdminUserFraudEvents({ userId, page: 1, severity: fraudFilter }));
    }
  }, [fraudFilter, activeTab, userId, dispatch]);

  // ==================== LAZY-LOAD CONTENT ON TAB CLICK ====================
  useEffect(() => {
    if (!effectiveSelectedChannelId || !channelContentTab) return;
    if (channelContentTab === "videos") {
      dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: 1 }));
    } else if (channelContentTab === "shorts") {
      dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: 1 }));
    }
  }, [effectiveSelectedChannelId, channelContentTab, userId, dispatch]);

  // ==================== BADGES ====================
  const roleBadge = (role) => {
    if (role === "admin") return "bg-purple-500/15 text-purple-400 border border-purple-500/20";
    if (role === "creator") return "bg-blue-500/15 text-blue-400 border border-blue-500/20";
    return "bg-gray-500/15 text-gray-400 border border-gray-500/20";
  };

  const statusBadge = (status) => {
    const s = status || "active";
    if (s === "active") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
    if (s === "suspended") return "bg-amber-500/15 text-amber-400 border border-amber-500/20";
    if (s === "banned") return "bg-red-500/15 text-red-400 border border-red-500/20";
    return "bg-gray-500/15 text-gray-400 border border-gray-500/20";
  };

  const severityBadge = (severity) => {
    if (severity === "critical") return "bg-red-500/15 text-red-400 border border-red-500/20";
    if (severity === "high") return "bg-orange-500/15 text-orange-400 border border-orange-500/20";
    if (severity === "medium") return "bg-amber-500/15 text-amber-400 border border-amber-500/20";
    return "bg-gray-500/15 text-gray-400 border border-gray-500/20";
  };

  const eventTypeLabel = (type) => {
    const map = {
      USER_REGISTER: "Registered", USER_LOGIN: "Logged in", USER_LOGOUT: "Logged out",
      USER_LOGOUT_ALL: "Signed out all", PASSWORD_CHANGE: "Password changed",
      PASSWORD_RESET_REQUEST: "Reset requested", PASSWORD_RESET_COMPLETE: "Reset completed",
      PROFILE_UPDATE: "Profile updated", DEVICE_CLAIM: "Device claimed",
      VIDEO_VIEW: "Viewed video", VIDEO_LIKE: "Liked video", VIDEO_DISLIKE: "Disliked video",
      VIDEO_UPLOAD: "Uploaded video", VIDEO_DELETE: "Deleted video",
      COMMENT_ADD: "Comment added", COMMENT_DELETE: "Comment deleted",
      CHANNEL_CREATE: "Channel created", CHANNEL_DELETE: "Channel deleted",
      CHANNEL_SUBSCRIBE: "Subscribed", CHANNEL_UNSUBSCRIBE: "Unsubscribed",
      WATCH_LATER_ADD: "Added to Watch Later", WATCH_LATER_REMOVE: "Removed from Watch Later",
      WATCH_HISTORY_CLEAR: "Cleared watch history",
    };
    return map[type] || type;
  };

  const eventTypeColor = (type) => {
    if (type.includes("LOGIN") || type.includes("REGISTER") || type.includes("LOGOUT")) return "text-blue-400";
    if (type.includes("PASSWORD") || type.includes("DEVICE")) return "text-amber-400";
    if (type.includes("LIKE") || type.includes("SUBSCRIBE")) return "text-emerald-400";
    if (type.includes("UPLOAD") || type.includes("CREATE")) return "text-purple-400";
    if (type.includes("DELETE") || type.includes("DISLIKE") || type.includes("UNSUBSCRIBE")) return "text-red-400";
    return "text-gray-400";
  };

  // ==================== PAGINATION HANDLERS ====================
  const handleVideoPageChange = (newPage) => dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: newPage }));
  const handleShortsPageChange = (newPage) => dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: newPage }));
  const handleActivityPageChange = (newPage) => {
    dispatch(fetchAdminUserActivity({ userId, page: newPage, filter: activityFilter }));
  };
  const handleWatchHistoryPageChange = (newPage) => {
    dispatch(fetchAdminUserWatchHistory({ userId, page: newPage }));
  };
  const handleFraudPageChange = (newPage) => {
    dispatch(fetchAdminUserFraudEvents({ userId, page: newPage, severity: fraudFilter }));
  };

  // ==================== RETRY HANDLERS ====================
  const retryOverview = () => dispatch(fetchAdminUserOverview({ userId, force: true }));
  const retryEngagement = () => dispatch(fetchAdminUserEngagement({ userId, force: true }));
  const retryVideos = () => dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: videosPagination.page }));
  const retryShorts = () => dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: shortsPagination.page }));

  // ==================== LOADING STATE ====================
  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/alluser")}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-indigo-400 mb-3" />
          <p className="text-gray-400">Loading user overview...</p>
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (overviewError || !data) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/alluser")}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={40} className="text-red-400 mb-3 opacity-60" />
          <p className="text-lg font-medium text-gray-300 mb-1">User not found</p>
          <p className="text-sm text-gray-500 mb-4">
            {overviewError?.message || "Could not load user data"}
          </p>
          <button
            onClick={retryOverview}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user, account, content, engagement } = data;

  return (
    <div className="space-y-5">
      {/* NAV */}
      <button
        onClick={() => navigate("/alluser")}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      {/* USER HEADER */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-2xl font-bold flex-shrink-0 border border-indigo-500/20">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              user.name?.charAt(0)?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${roleBadge(user.role)}`}>{user.role}</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${statusBadge(user.status)}`}>{user.status || "active"}</span>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1.5 mb-0.5">
              <Mail size={13} />
              {user.email}
            </p>
            <p className="text-xs text-gray-500">
              Joined {formatDate(user.createdAt)}
              {user.lastLoginAt && <>, Last login {formatDateTime(user.lastLoginAt)}</>}
            </p>
          </div>
          <div className="flex gap-5 text-center">
            <div>
              <p className="text-xl font-bold text-white">{user.trustScore}</p>
              <p className="text-xs text-gray-500">Trust</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{user.rewardPoints}</p>
              <p className="text-xs text-gray-500">Points</p>
            </div>
          </div>
          {hasFeature("canEditUsers") && (
            <button
              onClick={() => navigate(`/users/${userId}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition flex-shrink-0"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-1 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                isActive ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Tv, color: "amber", value: content.channelCount, label: "Channels" },
              { icon: Video, color: "blue", value: content.videoCount, label: "Videos" },
              { icon: Clapperboard, color: "orange", value: content.shortCount, label: "Shorts" },
              { icon: Eye, color: "emerald", value: content.totalViews.toLocaleString(), label: "Views" },
              { icon: ThumbsUp, color: "pink", value: content.totalLikes.toLocaleString(), label: "Likes" },
              { icon: MessageSquare, color: "cyan", value: content.totalComments.toLocaleString(), label: "Comments" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3 hover:border-gray-700 transition">
                <div className={`w-10 h-10 rounded-lg bg-${item.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={18} className={`text-${item.color}-400`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-tight">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { value: engagement.likedVideosCount, label: "Liked" },
              { value: engagement.dislikedVideosCount, label: "Disliked" },
              { value: engagement.subscribedChannelsCount, label: "Subscriptions" },
              { value: engagement.watchLaterCount, label: "Watch Later" },
              { value: engagement.viewedVideosCount, label: "Viewed" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center hover:border-gray-700 transition">
                <p className="text-lg font-bold text-white">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield size={15} className="text-indigo-400" />
              Account Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">User ID</p>
                <p className="text-sm text-gray-300 font-mono break-all">{user._id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Registration</p>
                <p className="text-sm text-gray-300 capitalize">{account.registrationMethod}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Status</p>
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${statusBadge(user.status)}`}>{user.status || "active"}</span>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Account Age</p>
                <p className="text-sm text-gray-300">{account.accountAge} days</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Created</p>
                <p className="text-sm text-gray-300">{formatDateTime(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Last Login</p>
                <p className="text-sm text-gray-300">{formatDateTime(user.lastLoginAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Last Activity</p>
                <p className="text-sm text-gray-300">{formatDateTime(user.lastActivityAt)}</p>
              </div>
              {user.suspendedAt && (
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Suspended At</p>
                  <p className="text-sm text-amber-400">{formatDateTime(user.suspendedAt)}</p>
                </div>
              )}
              {user.suspendReason && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-600 mb-0.5">Suspension Reason</p>
                  <p className="text-sm text-amber-400">{user.suspendReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHANNELS TAB ==================== */}
      {activeTab === "channels" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT: Channel List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tv size={15} className="text-amber-400" />
              Channels ({channels.length})
            </h2>
            {channelsLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-amber-400 mb-2" />
                <p className="text-xs text-gray-500">Loading channels...</p>
              </div>
            ) : channels.length === 0 ? (
              <div className="py-8 text-center">
                <Tv size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No channels found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {channels.map((ch) => {
                  const isActive = effectiveSelectedChannelId === ch._id;
                  return (
                    <button
                      key={ch._id}
                      type="button"
                      onClick={() => setSelectedChannelId(ch._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                        isActive ? "bg-indigo-500/10 border-indigo-500/30" : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {ch.channelImage ? (
                          <img src={ch.channelImage} alt={ch.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <Tv size={18} className={isActive ? "text-indigo-400" : "text-gray-500"} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isActive ? "text-indigo-300" : "text-gray-200"}`}>{ch.name}</p>
                        <p className="text-xs text-gray-500">{formatNumber(ch.subscriberCount)} subs &middot; {ch.videoCount} videos</p>
                      </div>
                      {isActive && <Check size={16} className="text-indigo-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Selected Channel + Internal Tabs */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            {selectedChannel ? (
              <>
                {/* Channel Summary */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-700/50">
                      {selectedChannel.channelImage ? (
                        <img src={selectedChannel.channelImage} alt={selectedChannel.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <Tv size={20} className="text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{selectedChannel.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                        <span>{formatNumber(selectedChannel.subscriberCount)} subscribers</span>
                        <span>&middot;</span>
                        <span>{selectedChannel.videoCount} videos</span>
                        {selectedChannel.shortCount > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{selectedChannel.shortCount} shorts</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-center flex-shrink-0">
                      <div>
                        <p className="text-sm font-bold text-white">{formatNumber(selectedChannel.totalViews || 0)}</p>
                        <p className="text-[10px] text-gray-500">Views</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{formatNumber(selectedChannel.totalLikes || 0)}</p>
                        <p className="text-[10px] text-gray-500">Likes</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Tab Bar */}
                <div className="flex gap-1 mb-4 bg-gray-800/50 border border-gray-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setChannelContentTab("videos")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition flex-1 justify-center ${
                      channelContentTab === "videos" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    <Video size={13} />
                    Videos
                  </button>
                  <button
                    onClick={() => setChannelContentTab("shorts")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition flex-1 justify-center ${
                      channelContentTab === "shorts" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    <Clapperboard size={13} />
                    Shorts
                  </button>
                </div>

                {/* Content Area */}
                {channelContentTab === "videos" ? (
                  <ContentGrid
                    items={videos}
                    loading={videosLoading}
                    error={videosError}
                    pagination={videosPagination}
                    emptyIcon={Video}
                    emptyText="No videos found"
                    onPageChange={handleVideoPageChange}
                    onRetry={retryVideos}
                  />
                ) : channelContentTab === "shorts" ? (
                  <ContentGrid
                    items={shorts}
                    loading={shortsLoading}
                    error={shortsError}
                    pagination={shortsPagination}
                    emptyIcon={Clapperboard}
                    emptyText="No shorts found"
                    onPageChange={handleShortsPageChange}
                    onRetry={retryShorts}
                  />
                ) : (
                  <div className="py-12 text-center">
                    <Video size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Select Videos or Shorts to view content</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <Tv size={32} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Select a channel to view content</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== ENGAGEMENT TAB ==================== */}
      {activeTab === "engagement" && (
        <div className="space-y-5">
          {engagementLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-red-400 mb-2" />
              <p className="text-sm text-gray-500">Loading engagement data...</p>
            </div>
          ) : engagementData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { icon: ThumbsUp, value: engagementData.totalLikes, label: "Total Likes", color: "pink" },
                  { icon: Heart, value: engagementData.totalDislikes, label: "Total Dislikes", color: "red" },
                  { icon: Tv, value: engagementData.totalSubscriptions, label: "Subscriptions", color: "amber" },
                  { icon: Clock, value: engagementData.totalWatchLater, label: "Watch Later", color: "blue" },
                  { icon: Eye, value: engagementData.totalViewedVideos, label: "Viewed Videos", color: "emerald" },
                  { icon: Video, value: engagementData.totalVideosUploaded, label: "Uploaded Videos", color: "purple" },
                  { icon: Tv, value: engagementData.totalChannelsCreated, label: "Channels Created", color: "orange" },
                  { icon: MessageSquare, value: engagementData.totalComments, label: "Comments", color: "cyan" },
                  { icon: Play, value: formatDuration(engagementData.totalWatchMinutes * 60), label: "Watch Time", color: "red" },
                  { icon: MonitorPlay, value: engagementData.totalSessions, label: "Watch Sessions", color: "blue" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3 hover:border-gray-700 transition">
                    <div className={`w-10 h-10 rounded-lg bg-${item.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                      <item.icon size={18} className={`text-${item.color}-400`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white leading-tight">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscribed Channels</h2>
                <SubscriptionsList subscriptions={subscriptions} loading={subscriptionsLoading} />
              </div>
            </>
          ) : (
            <SectionError message="Failed to load engagement data" onRetry={retryEngagement} />
          )}
        </div>
      )}

      {/* ==================== ACTIVITY TAB ==================== */}
      {activeTab === "activity" && (
        <div className="space-y-5">
          {/* Watch History */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={15} className="text-blue-400" />
              Watch History
              <span className="text-xs text-gray-600 font-normal">({watchHistoryPagination.total} sessions)</span>
            </h2>
            {watchHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-blue-400 mb-2" />
                <p className="text-xs text-gray-500">Loading watch history...</p>
              </div>
            ) : watchHistory.length === 0 ? (
              <div className="py-8 text-center">
                <Clock size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No watch history found</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {watchHistory.map((session) => (
                    <div key={session._id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-20 h-12 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                        {session.videoId?.thumbnail ? (
                          <img src={session.videoId.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={16} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 font-medium truncate">{session.videoId?.title || "Deleted video"}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{session.videoType}</span>
                          <span>{session.watchedPercent?.toFixed(0)}% watched</span>
                          <span>{formatDuration(session.watchedSeconds)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 flex-shrink-0">{formatDateTime(session.startedAt)}</p>
                    </div>
                  ))}
                </div>
                {watchHistoryPagination.totalPages > 1 && (
                  <Pagination pagination={watchHistoryPagination} onPageChange={handleWatchHistoryPageChange} />
                )}
              </>
            )}
          </div>

          {/* Audit Events */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Activity size={15} className="text-emerald-400" />
                Audit Events
                <span className="text-xs text-gray-600 font-normal">({activityPagination.total} events)</span>
              </h2>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500"
              >
                <option value="">All events</option>
                <option value="USER_LOGIN">Login</option>
                <option value="USER_REGISTER">Register</option>
                <option value="USER_LOGOUT">Logout</option>
                <option value="PASSWORD_CHANGE">Password Change</option>
                <option value="VIDEO_LIKE">Video Like</option>
                <option value="VIDEO_UPLOAD">Video Upload</option>
                <option value="CHANNEL_SUBSCRIBE">Subscribe</option>
                <option value="COMMENT_ADD">Comment</option>
                <option value="PROFILE_UPDATE">Profile Update</option>
                <option value="DEVICE_CLAIM">Device Claim</option>
              </select>
            </div>
            {activityLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-emerald-400 mb-2" />
                <p className="text-xs text-gray-500">Loading activity...</p>
              </div>
            ) : activityEvents.length === 0 ? (
              <div className="py-8 text-center">
                <Activity size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No activity events recorded. Tracking was not available before this update.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {activityEvents.map((event) => (
                    <div key={event._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 transition">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${eventTypeColor(event.eventType)}`}
                        style={{ backgroundColor: "currentColor" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${eventTypeColor(event.eventType)}`}>{eventTypeLabel(event.eventType)}</p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <p className="text-xs text-gray-600 truncate">
                            {Object.entries(event.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">{formatDateTime(event.createdAt)}</p>
                        {event.ip && <p className="text-[10px] text-gray-600 font-mono">{event.ip}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {activityPagination.totalPages > 1 && (
                  <Pagination pagination={activityPagination} onPageChange={handleActivityPageChange} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== SECURITY TAB ==================== */}
      {activeTab === "security" && (
        <div className="space-y-5">
          {/* Trust Score + Active Sessions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{user.trustScore}</p>
              <p className="text-xs text-gray-500 mt-1">Trust Score</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{activeSessions}</p>
              <p className="text-xs text-gray-500 mt-1">Active Sessions</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{devices.length}</p>
              <p className="text-xs text-gray-500 mt-1">Known Devices</p>
            </div>
          </div>

          {/* Devices */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Smartphone size={15} className="text-blue-400" />
              Devices
            </h2>
            {devicesLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-blue-400 mb-2" />
                <p className="text-xs text-gray-500">Loading devices...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="py-8 text-center">
                <Smartphone size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No devices recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => {
                  const isCurrent = currentDeviceId === device.deviceId;
                  return (
                    <div
                      key={device._id}
                      className={`bg-gray-800/50 border rounded-xl p-3 flex items-center gap-3 ${isCurrent ? "border-emerald-500/30" : "border-gray-700/50"}`}
                    >
                      <Smartphone size={18} className={isCurrent ? "text-emerald-400" : "text-gray-500"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 font-mono truncate">{device.deviceId}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span className="truncate max-w-[200px]">{device.userAgent || "Unknown UA"}</span>
                          {device.lastIp && <span className="font-mono">{device.lastIp}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Current</span>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1">{formatDateTime(device.lastSeen)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fraud Events */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon size={15} className="text-red-400" />
                Fraud Events
                <span className="text-xs text-gray-600 font-normal">({fraudPagination.total} events)</span>
              </h2>
              <div className="flex gap-2">
                {Object.entries(severityCounts).map(([severity, count]) => (
                  <span key={severity} className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${severityBadge(severity)}`}>
                    {severity}: {count}
                  </span>
                ))}
                <select
                  value={fraudFilter}
                  onChange={(e) => setFraudFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500"
                >
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            {fraudLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-red-400 mb-2" />
                <p className="text-xs text-gray-500">Loading fraud events...</p>
              </div>
            ) : fraudEvents.length === 0 ? (
              <div className="py-8 text-center">
                <AlertOctagon size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No fraud events detected</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {fraudEvents.map((event) => (
                    <div key={event._id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${severityBadge(event.severity)}`}>{event.severity}</span>
                          <p className="text-sm font-medium text-gray-200">{event.eventType}</p>
                        </div>
                        <p className="text-xs text-gray-600">{formatDateTime(event.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {event.ip && <span className="font-mono">{event.ip}</span>}
                        {event.isVPN && <span className="text-amber-400">VPN</span>}
                        {event.isProxy && <span className="text-amber-400">Proxy</span>}
                        {event.riskScoreImpact !== 0 && <span className="text-red-400">Risk: {event.riskScoreImpact}</span>}
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <p className="text-[11px] text-gray-600 mt-1">
                          {Object.entries(event.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {fraudPagination.totalPages > 1 && (
                  <Pagination pagination={fraudPagination} onPageChange={handleFraudPageChange} />
                )}
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bell size={15} className="text-purple-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/15 text-red-400">{unreadCount} unread</span>
              )}
            </h2>
            {notificationsLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-purple-400 mb-2" />
                <p className="text-xs text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition ${n.isRead ? "hover:bg-gray-800/30" : "bg-gray-800/50 border border-gray-700/30"}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {n.actor?.avatar ? (
                        <img src={n.actor.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <Bell size={14} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">{n.actor?.name || "User"}</span>{" "}
                        {n.type === "subscribe" && "subscribed to your channel"}
                        {n.type === "like" && "liked your video"}
                        {n.type === "comment" && "commented on your video"}
                        {n.type === "upload" && "uploaded a new video"}
                      </p>
                      <p className="text-[11px] text-gray-600">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SHARED SUB-COMPONENTS ====================

function SectionError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle size={32} className="text-red-400 mb-2 opacity-60" />
      <p className="text-sm text-gray-400 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

function ContentGrid(props) {
  const { items, loading, error, pagination, emptyText, onPageChange, onRetry } = props;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-red-400 mb-2" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-2 opacity-60" />
          <p className="text-sm text-gray-400 mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <props.emptyIcon size={32} className="text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{emptyText}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {items.map((v) => (
              <div key={v._id} className="flex items-center gap-3 p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600 transition">
                <div className="w-28 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={18} className="text-gray-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-200 truncate">{v.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Eye size={12} />{(v.views || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={12} />{(v.likesCount || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} />{v.commentCount || v.comments?.length || 0}</span>
                    <span className="text-gray-600">{formatDate(v.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <Pagination pagination={pagination} onPageChange={onPageChange} />
          )}
        </>
      )}
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
      <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
      <div className="flex gap-2">
        <button
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-40 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-40 transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function SubscriptionsList({ subscriptions, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-amber-400 mb-2" />
        <p className="text-xs text-gray-500">Loading subscriptions...</p>
      </div>
    );
  }
  if (subscriptions.length === 0) {
    return (
      <div className="py-8 text-center">
        <Tv size={28} className="text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No subscriptions found</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {subscriptions.map((sub) => (
        <div key={sub._id} className="flex items-center gap-3 p-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {sub.channelImage ? (
              <img src={sub.channelImage} alt={sub.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <Tv size={18} className="text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{sub.name}</p>
            <p className="text-xs text-gray-500">{formatNumber(sub.subscriberCount)} subscribers</p>
          </div>
          {sub.creator && <p className="text-xs text-gray-600 flex-shrink-0">by {sub.creator.name}</p>}
        </div>
      ))}
    </div>
  );
}

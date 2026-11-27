

import { createElement, useState, useEffect, useMemo } from "react";
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
  Star,
  Award,
  Edit,
} from "lucide-react";
import { hasFeature } from "../../config/roleConfig";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatDuration,
} from "../../utils/helpers";
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
import ListPagination from "../../components/common/ListPagination";
import { PAGINATION_PER_PAGE } from "../../utils/paginationConfig";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "channels", label: "Channels", icon: Tv },
  { key: "engagement", label: "Engagement", icon: Heart },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "security", label: "Security", icon: Shield },
];

const getNotificationText = (notification) => {
  const actorName = notification.actor?.name || "Someone";
  const videoTitle = notification.video?.title || "your video";

  switch (notification.type) {
    case "subscribe":
      return `${actorName} subscribed to your channel`;
    case "like":
      return `${actorName} liked your video`;
    case "comment":
      return `${actorName} commented on your video`;
    case "upload":
      return `${actorName} uploaded a new video`;
    case "copyright_takedown_received":
      return `A copyright takedown request has been filed for "${videoTitle}"`;
    case "copyright_takedown_approved":
      return `Your video "${videoTitle}" was removed due to a copyright takedown`;
    case "copyright_takedown_rejected":
      return `A copyright takedown request on "${videoTitle}" was rejected`;
    case "copyright_strike_received":
      return `Your video "${videoTitle}" received a copyright strike`;
    case "copyright_dispute_filed":
      return `A dispute was filed for the copyright claim on "${videoTitle}"`;
    case "copyright_dispute_resolved":
      return `Your copyright dispute for "${videoTitle}" was resolved`;
    case "copyright_case_assigned":
      return `The copyright case involving "${videoTitle}" was assigned for review`;
    case "copyright_case_created":
      return `A new copyright claim was filed on "${videoTitle}"`;
    case "copyright_case_resolved":
      return `A copyright case involving "${videoTitle}" was resolved`;
    case "support_reply":
      return "The support team replied to your request";
    case "support_status":
      return "Your support request status was updated";
    default:
      return "You have a new notification";
  }
};

export default function User360() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [channelContentTab, setChannelContentTab] = useState("videos");
  const [activityFilter, setActivityFilter] = useState("");
  const [fraudFilter, setFraudFilter] = useState("");
  const [contentLimit, setContentLimit] = useState(PAGINATION_PER_PAGE);
  const [watchHistoryLimit, setWatchHistoryLimit] = useState(PAGINATION_PER_PAGE);
  const [activityLimit, setActivityLimit] = useState(PAGINATION_PER_PAGE);
  const [fraudLimit, setFraudLimit] = useState(PAGINATION_PER_PAGE);

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
  const videos = videosState?._loaded ? videosState.items || [] : [];
  const videosPagination = videosState?._loaded
    ? videosState.pagination || { page: 1, totalPages: 1 }
    : { page: 1, totalPages: 1 };

  const shortsState = useSelector((s) => s.adminUser360.shorts[userId]);
  const shortsLoading = shortsState?._loading ?? false;
  const shortsError = shortsState?._error ?? null;
  const shorts = shortsState?._loaded ? shortsState.items || [] : [];
  const shortsPagination = shortsState?._loaded
    ? shortsState.pagination || { page: 1, totalPages: 1 }
    : { page: 1, totalPages: 1 };

  const engagementState = useSelector((s) => s.adminUser360.engagement[userId]);
  const engagementLoading = engagementState?._loading ?? false;
  const engagementData = engagementState?._loaded
    ? engagementState.engagement || null
    : null;

  const subscriptionsState = useSelector((s) => s.adminUser360.subscriptions[userId]);
  const subscriptionsLoading = subscriptionsState?._loading ?? false;
  const subscriptions = subscriptionsState?._loaded
    ? subscriptionsState.subscriptions || []
    : [];

  const watchHistoryState = useSelector((s) => s.adminUser360.watchHistory[userId]);
  const watchHistoryLoading = watchHistoryState?._loading ?? false;
  const watchHistory = watchHistoryState?._loaded
    ? watchHistoryState.sessions || []
    : [];
  const watchHistoryPagination = watchHistoryState?._loaded
    ? watchHistoryState.pagination || { page: 1, totalPages: 1, total: 0 }
    : { page: 1, totalPages: 1, total: 0 };

  const activityState = useSelector((s) => s.adminUser360.activity[userId]);
  const activityLoading = activityState?._loading ?? false;
  const activityEvents = activityState?._loaded ? activityState.events || [] : [];
  const activityPagination = activityState?._loaded
    ? activityState.pagination || { page: 1, totalPages: 1, total: 0 }
    : { page: 1, totalPages: 1, total: 0 };

  const devicesState = useSelector((s) => s.adminUser360.devices[userId]);
  const devicesLoading = devicesState?._loading ?? false;
  const devices = devicesState?._loaded ? devicesState.devices || [] : [];
  const activeSessions = devicesState?._loaded ? devicesState.activeSessions || 0 : 0;
  const currentDeviceId = devicesState?._loaded ? devicesState.currentDeviceId || null : null;

  const fraudState = useSelector((s) => s.adminUser360.fraudEvents[userId]);
  const fraudLoading = fraudState?._loading ?? false;
  const fraudEvents = fraudState?._loaded ? fraudState.events || [] : [];
  const severityCounts = fraudState?._loaded ? fraudState.severityCounts || {} : {};
  const fraudPagination = fraudState?._loaded
    ? fraudState.pagination || { page: 1, totalPages: 1, total: 0 }
    : { page: 1, totalPages: 1, total: 0 };

  const notificationsState = useSelector((s) => s.adminUser360.notifications[userId]);
  const notificationsLoading = notificationsState?._loading ?? false;
  const notifications = notificationsState?._loaded
    ? notificationsState.notifications || []
    : [];
  const unreadCount = notificationsState?._loaded
    ? notificationsState.unreadCount || 0
    : 0;

  const selectedChannel =
    channels.find((ch) => ch._id === effectiveSelectedChannelId) || null;

  // ==================== EFFECTS (same as before) ====================
  useEffect(() => {
    dispatch(fetchAdminUserOverview({ userId }));
  }, [userId, dispatch]);

  useEffect(() => {
    dispatch(fetchAdminUserChannelsRedux({ userId }));
  }, [userId, dispatch]);

  useEffect(() => {
    if (activeTab === "engagement") {
      dispatch(fetchAdminUserEngagement({ userId }));
      dispatch(fetchAdminUserSubscriptions({ userId }));
    }
    if (activeTab === "activity") {
      dispatch(fetchAdminUserWatchHistory({ userId, page: 1, limit: watchHistoryLimit }));
    }
    if (activeTab === "security") {
      dispatch(fetchAdminUserDevices({ userId }));
      dispatch(fetchAdminUserNotifications({ userId, page: 1, limit: 50 }));
    }
  }, [activeTab, userId, dispatch, watchHistoryLimit]);

  useEffect(() => {
    if (activeTab === "activity") {
      dispatch(fetchAdminUserActivity({ userId, page: 1, limit: activityLimit, filter: activityFilter }));
    }
  }, [activityFilter, activityLimit, activeTab, userId, dispatch]);

  useEffect(() => {
    if (activeTab === "security") {
      dispatch(fetchAdminUserFraudEvents({ userId, page: 1, limit: fraudLimit, severity: fraudFilter }));
    }
  }, [fraudFilter, fraudLimit, activeTab, userId, dispatch]);

  useEffect(() => {
    if (!effectiveSelectedChannelId || !channelContentTab) return;
    if (channelContentTab === "videos") {
      dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: 1, limit: contentLimit }));
    } else if (channelContentTab === "shorts") {
      dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: 1, limit: contentLimit }));
    }
  }, [contentLimit, effectiveSelectedChannelId, channelContentTab, userId, dispatch]);

  // ==================== BADGES (Material style) ====================
  const roleBadge = (role) => {
    if (role === "admin") return "bg-violet-50 text-violet-600";
    if (role === "creator") return "bg-cyan-50 text-cyan-600";
    return "bg-slate-100 text-slate-500";
  };

  const statusBadge = (status) => {
    const s = status || "active";
    if (s === "active") return "bg-emerald-50 text-emerald-600";
    if (s === "suspended") return "bg-amber-50 text-amber-600";
    if (s === "banned") return "bg-red-50 text-red-600";
    return "bg-slate-100 text-slate-500";
  };

  const severityBadge = (severity) => {
    if (severity === "critical") return "bg-red-50 text-red-600";
    if (severity === "high") return "bg-orange-50 text-orange-600";
    if (severity === "medium") return "bg-amber-50 text-amber-600";
    return "bg-slate-100 text-slate-500";
  };

  const eventTypeLabel = (type) => {
    const map = {
      USER_REGISTER: "Registered",
      USER_LOGIN: "Logged in",
      USER_LOGOUT: "Logged out",
      USER_LOGOUT_ALL: "Signed out all",
      PASSWORD_CHANGE: "Password changed",
      PASSWORD_RESET_REQUEST: "Reset requested",
      PASSWORD_RESET_COMPLETE: "Reset completed",
      PROFILE_UPDATE: "Profile updated",
      DEVICE_CLAIM: "Device claimed",
      VIDEO_VIEW: "Viewed video",
      VIDEO_LIKE: "Liked video",
      VIDEO_DISLIKE: "Disliked video",
      VIDEO_UPLOAD: "Uploaded video",
      VIDEO_DELETE: "Deleted video",
      COMMENT_ADD: "Comment added",
      COMMENT_DELETE: "Comment deleted",
      CHANNEL_CREATE: "Channel created",
      CHANNEL_DELETE: "Channel deleted",
      CHANNEL_SUBSCRIBE: "Subscribed",
      CHANNEL_UNSUBSCRIBE: "Unsubscribed",
      WATCH_LATER_ADD: "Added to Watch Later",
      WATCH_LATER_REMOVE: "Removed from Watch Later",
      WATCH_HISTORY_CLEAR: "Cleared watch history",
    };
    return map[type] || type;
  };

  const eventTypeColor = (type) => {
    if (type.includes("LOGIN") || type.includes("REGISTER") || type.includes("LOGOUT"))
      return "text-cyan-600";
    if (type.includes("PASSWORD") || type.includes("DEVICE")) return "text-amber-600";
    if (type.includes("LIKE") || type.includes("SUBSCRIBE")) return "text-emerald-600";
    if (type.includes("UPLOAD") || type.includes("CREATE")) return "text-violet-600";
    if (type.includes("DELETE") || type.includes("DISLIKE") || type.includes("UNSUBSCRIBE"))
      return "text-red-500";
    return "text-slate-500";
  };

  // ==================== HANDLERS ====================
  // The optional second arg lets "rows per page" refetch page 1 with the new
  // size in the same dispatch (state would still be stale inside the handler).
  const handleVideoPageChange = (newPage, newLimit) =>
    dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: newPage, limit: newLimit ?? contentLimit }));
  const handleShortsPageChange = (newPage, newLimit) =>
    dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: newPage, limit: newLimit ?? contentLimit }));
  const handleActivityPageChange = (newPage, newLimit) =>
    dispatch(fetchAdminUserActivity({ userId, page: newPage, limit: newLimit ?? activityLimit, filter: activityFilter }));
  const handleWatchHistoryPageChange = (newPage, newLimit) =>
    dispatch(fetchAdminUserWatchHistory({ userId, page: newPage, limit: newLimit ?? watchHistoryLimit }));
  const handleFraudPageChange = (newPage, newLimit) =>
    dispatch(fetchAdminUserFraudEvents({ userId, page: newPage, limit: newLimit ?? fraudLimit, severity: fraudFilter }));

  const retryOverview = () => dispatch(fetchAdminUserOverview({ userId }));
  const retryEngagement = () => dispatch(fetchAdminUserEngagement({ userId }));
  const retryVideos = () =>
    dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: videosPagination.page, limit: contentLimit }));
  const retryShorts = () =>
    dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: shortsPagination.page, limit: contentLimit }));

  // ==================== LOADING ====================
  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/alluser")}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-blue-500 mb-3" />
          <p className="text-slate-500 text-sm">Loading user overview...</p>
        </div>
      </div>
    );
  }

  // ==================== ERROR ====================
  if (overviewError || !data) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/alluser")}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <p className="text-lg font-semibold text-slate-800 mb-1">User not found</p>
          <p className="text-sm text-slate-400 mb-4">
            {overviewError?.message || "Could not load user data"}
          </p>
          <button
            onClick={retryOverview}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
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
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Back */}
      <button
        onClick={() => navigate("/alluser")}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition shadow-sm"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      {/* USER HEADER */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0 ring-4 ring-blue-50 overflow-hidden shadow-sm">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              user.name?.charAt(0)?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800">{user.name}</h1>
              <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full capitalize ${roleBadge(user.role)}`}>
                {user.role}
              </span>
              <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full capitalize ${statusBadge(user.status)}`}>
                {user.status || "active"}
              </span>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-1.5 mb-0.5">
              <Mail size={13} />
              {user.email}
            </p>
            <p className="text-xs text-slate-400">
              Joined {formatDate(user.createdAt)}
              {user.lastLoginAt && <>, Last login {formatDateTime(user.lastLoginAt)}</>}
            </p>
          </div>
          <div className="flex gap-5 text-center">
            <div>
              <div className="flex items-center justify-center gap-1">
                <Star size={14} className="text-amber-400" />
                <p className="text-xl font-bold text-slate-800">{user.trustScore}</p>
              </div>
              <p className="text-[11px] text-slate-400">Trust</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Award size={14} className="text-violet-400" />
                <p className="text-xl font-bold text-slate-800">{user.rewardPoints}</p>
              </div>
              <p className="text-[11px] text-slate-400">Points</p>
            </div>
          </div>
          {hasFeature("canEditUsers") && (
            <button
              onClick={() => navigate(`/users/${userId}/edit`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex-shrink-0"
            >
              <Edit size={15} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
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
              <div
                key={item.label}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className={`w-11 h-11 rounded-xl bg-${item.color}-50 flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={18} className={`text-${item.color}-500`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800 leading-tight">{item.value}</p>
                  <p className="text-[12px] text-slate-400">{item.label}</p>
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
              <div
                key={item.label}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 text-center hover:shadow-md transition-shadow"
              >
                <p className="text-lg font-bold text-slate-800">{item.value}</p>
                <p className="text-[11px] text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield size={15} className="text-blue-500" />
              Account Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
              {[
                { label: "User ID", value: user._id, mono: true },
                { label: "Registration", value: account.registrationMethod, capitalize: true },
                { label: "Status", value: user.status || "active", badge: true },
                { label: "Account Age", value: `${account.accountAge} days` },
                { label: "Created", value: formatDateTime(user.createdAt) },
                { label: "Last Login", value: formatDateTime(user.lastLoginAt) },
                { label: "Last Activity", value: formatDateTime(user.lastActivityAt) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] text-slate-400 mb-0.5 font-medium">{item.label}</p>
                  {item.badge ? (
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${statusBadge(user.status)}`}>
                      {item.value}
                    </span>
                  ) : (
                    <p className={`text-sm text-slate-800 ${item.mono ? "font-mono break-all text-xs" : ""} ${item.capitalize ? "capitalize" : ""}`}>
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
              {user.suspendedAt && (
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5 font-medium">Suspended At</p>
                  <p className="text-sm text-amber-600">{formatDateTime(user.suspendedAt)}</p>
                </div>
              )}
              {user.suspendReason && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] text-slate-400 mb-0.5 font-medium">Suspension Reason</p>
                  <p className="text-sm text-amber-600">{user.suspendReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHANNELS TAB ==================== */}
      {activeTab === "channels" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tv size={15} className="text-amber-500" />
              Channels ({channels.length})
            </h2>
            {channelsLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-amber-500 mb-2" />
                <p className="text-xs text-slate-400">Loading channels...</p>
              </div>
            ) : channels.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                  <Tv size={22} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No channels found</p>
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
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isActive
                          ? "bg-blue-50 border-blue-200 shadow-sm"
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {ch.channelImage ? (
                          <img src={ch.channelImage} alt={ch.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <Tv size={18} className={isActive ? "text-blue-500" : "text-slate-400"} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                          {ch.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatNumber(ch.subscriberCount)} subs · {ch.videoCount} videos
                        </p>
                      </div>
                      {isActive && <Check size={16} className="text-blue-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            {selectedChannel ? (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100 shadow-sm">
                      {selectedChannel.channelImage ? (
                        <img src={selectedChannel.channelImage} alt={selectedChannel.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <Tv size={20} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{selectedChannel.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                        <span>{formatNumber(selectedChannel.subscriberCount)} subscribers</span>
                        <span>·</span>
                        <span>{selectedChannel.videoCount} videos</span>
                        {selectedChannel.shortCount > 0 && (
                          <>
                            <span>·</span>
                            <span>{selectedChannel.shortCount} shorts</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-center flex-shrink-0">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{formatNumber(selectedChannel.totalViews || 0)}</p>
                        <p className="text-[10px] text-slate-400">Views</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{formatNumber(selectedChannel.totalLikes || 0)}</p>
                        <p className="text-[10px] text-slate-400">Likes</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 mb-4 bg-slate-50 border border-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setChannelContentTab("videos")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition flex-1 justify-center ${
                      channelContentTab === "videos"
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white"
                    }`}
                  >
                    <Video size={13} />
                    Videos
                  </button>
                  <button
                    onClick={() => setChannelContentTab("shorts")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition flex-1 justify-center ${
                      channelContentTab === "shorts"
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white"
                    }`}
                  >
                    <Clapperboard size={13} />
                    Shorts
                  </button>
                </div>

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
                    limit={contentLimit}
                    onLimitChange={(l) => {
                      setContentLimit(l);
                      handleVideoPageChange(1, l);
                    }}
                  />
                ) : (
                  <ContentGrid
                    items={shorts}
                    loading={shortsLoading}
                    error={shortsError}
                    pagination={shortsPagination}
                    emptyIcon={Clapperboard}
                    emptyText="No shorts found"
                    onPageChange={handleShortsPageChange}
                    onRetry={retryShorts}
                    limit={contentLimit}
                    onLimitChange={(l) => {
                      setContentLimit(l);
                      handleShortsPageChange(1, l);
                    }}
                  />
                )}
              </>
            ) : (
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                  <Tv size={22} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Select a channel to view content</p>
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
              <Loader2 size={32} className="animate-spin text-pink-500 mb-2" />
              <p className="text-sm text-slate-400">Loading engagement data...</p>
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
                  { icon: Video, value: engagementData.totalVideosUploaded, label: "Uploaded Videos", color: "violet" },
                  { icon: Tv, value: engagementData.totalChannelsCreated, label: "Channels Created", color: "orange" },
                  { icon: MessageSquare, value: engagementData.totalComments, label: "Comments", color: "cyan" },
                  { icon: Play, value: formatDuration(engagementData.totalWatchMinutes * 60), label: "Watch Time", color: "red" },
                  { icon: MonitorPlay, value: engagementData.totalSessions, label: "Watch Sessions", color: "blue" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${item.color}-50 flex items-center justify-center flex-shrink-0`}>
                      <item.icon size={18} className={`text-${item.color}-500`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800 leading-tight">{item.value}</p>
                      <p className="text-[11px] text-slate-400">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Subscribed Channels
                </h2>
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={15} className="text-cyan-500" />
              Watch History
              <span className="text-xs text-slate-400 font-normal">({watchHistoryPagination.total} sessions)</span>
            </h2>
            {watchHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-cyan-500 mb-2" />
                <p className="text-xs text-slate-400">Loading watch history...</p>
              </div>
            ) : watchHistory.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                  <Clock size={22} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No watch history found</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {watchHistory.map((session) => (
                    <div
                      key={session._id}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100/80 transition"
                    >
                      <div className="w-20 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                        {session.videoId?.thumbnail ? (
                          <img src={session.videoId.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={16} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium truncate">
                          {session.videoId?.title || "Deleted video"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>{session.videoType}</span>
                          <span>{session.watchedPercent?.toFixed(0)}% watched</span>
                          <span>{formatDuration(session.watchedSeconds)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(session.startedAt)}</p>
                    </div>
                  ))}
                </div>
                {watchHistoryPagination.totalPages > 1 && (
                  <Pagination
                    pagination={watchHistoryPagination}
                    onPageChange={handleWatchHistoryPageChange}
                    limit={watchHistoryLimit}
                    onLimitChange={(l) => {
                      setWatchHistoryLimit(l);
                      handleWatchHistoryPageChange(1, l);
                    }}
                  />
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Activity size={15} className="text-emerald-500" />
                Audit Events
                <span className="text-xs text-slate-400 font-normal">({activityPagination.total} events)</span>
              </h2>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-emerald-500 mb-2" />
                <p className="text-xs text-slate-400">Loading activity...</p>
              </div>
            ) : activityEvents.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                  <Activity size={22} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">
                  No activity events recorded. Tracking was not available before this update.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                  {activityEvents.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${eventTypeColor(event.eventType)}`}
                        style={{ backgroundColor: "currentColor" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${eventTypeColor(event.eventType)}`}>
                          {eventTypeLabel(event.eventType)}
                        </p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <p className="text-xs text-slate-400 truncate">
                            {Object.entries(event.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400">{formatDateTime(event.createdAt)}</p>
                        {event.ip && <p className="text-[10px] text-slate-400 font-mono">{event.ip}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {activityPagination.totalPages > 1 && (
                  <Pagination
                    pagination={activityPagination}
                    onPageChange={handleActivityPageChange}
                    limit={activityLimit}
                    onLimitChange={(l) => {
                      setActivityLimit(l);
                      handleActivityPageChange(1, l);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== SECURITY TAB ==================== */}
      {activeTab === "security" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star size={16} className="text-amber-400" />
                <p className="text-3xl font-bold text-slate-800">{user.trustScore}</p>
              </div>
              <p className="text-[11px] text-slate-400">Trust Score</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{activeSessions}</p>
              <p className="text-[11px] text-slate-400 mt-1">Active Sessions</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{devices.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Known Devices</p>
            </div>
          </div>

          {/* Devices */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Smartphone size={15} className="text-cyan-500" />
              Devices
            </h2>
            {devicesLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-cyan-500 mb-2" />
                <p className="text-xs text-slate-400">Loading devices...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                  <Smartphone size={22} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No devices recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => {
                  const isCurrent = currentDeviceId === device.deviceId;
                  return (
                    <div
                      key={device._id}
                      className={`bg-slate-50 border rounded-xl p-3 flex items-center gap-3 ${
                        isCurrent ? "border-emerald-200" : "border-slate-100"
                      }`}
                    >
                      <Smartphone size={18} className={isCurrent ? "text-emerald-500" : "text-slate-400"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-mono truncate">{device.deviceId}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="truncate max-w-[200px]">{device.userAgent || "Unknown UA"}</span>
                          {device.lastIp && <span className="font-mono">{device.lastIp}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-600">
                            Current
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(device.lastSeen)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fraud Events */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon size={15} className="text-red-500" />
                Fraud Events
                <span className="text-xs text-slate-400 font-normal">({fraudPagination.total} events)</span>
              </h2>
              <div className="flex gap-2 flex-wrap items-center">
                {Object.entries(severityCounts).map(([severity, count]) => (
                  <span key={severity} className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${severityBadge(severity)}`}>
                    {severity}: {count}
                  </span>
                ))}
                <select
                  value={fraudFilter}
                  onChange={(e) => setFraudFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400"
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
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-red-500 mb-2" />
                <p className="text-xs text-slate-400">Loading fraud events...</p>
              </div>
            ) : fraudEvents.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                  <AlertOctagon size={22} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No fraud events detected</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {fraudEvents.map((event) => (
                    <div key={event._id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${severityBadge(event.severity)}`}>
                            {event.severity}
                          </span>
                          <p className="text-sm font-medium text-slate-800">{event.eventType}</p>
                        </div>
                        <p className="text-xs text-slate-400">{formatDateTime(event.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {event.ip && <span className="font-mono">{event.ip}</span>}
                        {event.isVPN && <span className="text-amber-600">VPN</span>}
                        {event.isProxy && <span className="text-amber-600">Proxy</span>}
                        {event.riskScoreImpact !== 0 && (
                          <span className="text-red-500">Risk: {event.riskScoreImpact}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {fraudPagination.totalPages > 1 && (
                  <Pagination
            pagination={fraudPagination}
            onPageChange={handleFraudPageChange}
            limit={fraudLimit}
            onLimitChange={(l) => {
              setFraudLimit(l);
              handleFraudPageChange(1, l);
            }}
          />
                )}
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bell size={15} className="text-violet-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-50 text-red-500">
                  {unreadCount} unread
                </span>
              )}
            </h2>
            {notificationsLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-violet-500 mb-2" />
                <p className="text-xs text-slate-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                  <Bell size={22} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition ${
                      n.isRead ? "hover:bg-slate-50" : "bg-slate-50 border border-slate-100"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {n.actor?.avatar ? (
                        <img src={n.actor.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <Bell size={14} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800">
                        {getNotificationText(n)}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</p>
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
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle size={24} className="text-red-400" />
      </div>
      <p className="text-sm text-slate-500 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

function ContentGrid({ items, loading, error, pagination, emptyText, onPageChange, onRetry, emptyIcon: EmptyIcon, limit, onLimitChange }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={28} className="animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
          <AlertTriangle size={22} className="text-red-400" />
        </div>
        <p className="text-sm text-slate-500 mb-3">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
          {createElement(EmptyIcon, { size: 22, className: "text-slate-300" })}
        </div>
        <p className="text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col gap-2">
        {items.map((v) => (
          <div
            key={v._id}
            className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition"
          >
            <div className="w-28 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
              {v.thumbnail ? (
                <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video size={18} className="text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-800 truncate">{v.title}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {(v.views || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={12} />
                  {(v.likesCount || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {v.commentCount || v.comments?.length || 0}
                </span>
                <span>{formatDate(v.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          limit={limit}
          onLimitChange={onLimitChange}
        />
      )}
    </>
  );
}

function Pagination({ pagination, onPageChange, limit, onLimitChange }) {
  // Thin wrapper over the shared bar so every non-table list in the panel
  // paginates exactly like the react-data-table tables do.
  return (
    <ListPagination
      pagination={pagination}
      onPageChange={onPageChange}
      limit={limit}
      onLimitChange={onLimitChange}
      total={pagination?.total}
    />
  );
}

function SubscriptionsList({ subscriptions, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-amber-500 mb-2" />
        <p className="text-xs text-slate-400">Loading subscriptions...</p>
      </div>
    );
  }
  if (subscriptions.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
          <Tv size={22} className="text-slate-300" />
        </div>
        <p className="text-sm text-slate-400">No subscriptions found</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {subscriptions.map((sub) => (
        <div
          key={sub._id}
          className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {sub.channelImage ? (
              <img src={sub.channelImage} alt={sub.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <Tv size={18} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{sub.name}</p>
            <p className="text-xs text-slate-400">{formatNumber(sub.subscriberCount)} subscribers</p>
          </div>
          {sub.creator && (
            <p className="text-xs text-slate-400 flex-shrink-0">by {sub.creator.name}</p>
          )}
        </div>
      ))}
    </div>
  );
}
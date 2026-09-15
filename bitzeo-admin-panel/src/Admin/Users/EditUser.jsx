import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Loader2,
  Save,
  User as UserIcon,
  Mail,
  Shield,
  Award,
  AlertTriangle,
  Trash2,
  Info,
  ShieldOff,
  Ban,
  RotateCcw,
  Tv,
  Video,
  Clapperboard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  Power,
  PowerOff,
  AlertOctagon,
  Search,
} from "lucide-react";
import {
  fetchAdminUserById,
  updateAdminUser,
  deleteAdminUser,
} from "../../api";
import {
  suspendUser,
  restoreUser,
  banUser,
  fetchAdminUserChannelsRedux,
  fetchAdminUserVideosRedux,
  fetchAdminUserShortsRedux,
  disableChannel,
  enableChannel,
  banChannel,
  restoreChannel,
  deleteChannel,
  disableVideo,
  enableVideo,
  deleteVideo,
  disableShort,
  enableShort,
  deleteShort,
  clearChannelModerationResult,
  clearVideoModerationResult,
  clearShortModerationResult,
} from "../../redux/slices/adminUser360Slice";
import ModerationDialog from "./ModerationDialog";
import { hasFeature } from "../../config/roleConfig";

const VALID_ROLES = ["viewer", "creator", "admin"];

function formatDate(dateStr) {
  if (!dateStr) return "Never";
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

export default function EditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "viewer",
    trustScore: 50,
    rewardPoints: 0,
  });
  const originalRef = useRef(null);
  const [dirty, setDirty] = useState(false);

  const [errors, setErrors] = useState({});

  const [moderationDialog, setModerationDialog] = useState({ open: false, action: null, dialogKey: 0 });
  const suspendResult = useSelector((s) => s.adminUser360.suspendResult);
  const restoreResult = useSelector((s) => s.adminUser360.restoreResult);
  const banResult = useSelector((s) => s.adminUser360.banResult);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ==================== LOAD USER ====================
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetchAdminUserById(userId);
        const u = res.data?.data || null;
        if (cancelled) return;
        if (!u) {
          setLoadError("User not found");
          return;
        }
        setUser(u);
        const snapshot = {
          name: u.name || "",
          email: u.email || "",
          role: u.role || "viewer",
          trustScore: u.trustScore ?? 50,
          rewardPoints: u.rewardPoints ?? 0,
        };
        setForm(snapshot);
        originalRef.current = snapshot;
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.response?.data?.message || "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ==================== DIRTY DETECTION ====================
  useEffect(() => {
    if (!originalRef.current) {
      setDirty(false);
      return;
    }
    const orig = originalRef.current;
    const same =
      form.name === orig.name &&
      form.email === orig.email &&
      form.role === orig.role &&
      Number(form.trustScore) === Number(orig.trustScore) &&
      Number(form.rewardPoints) === Number(orig.rewardPoints);
    setDirty(!same);
  }, [form]);

  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ==================== MODERATION RESULTS ====================
  useEffect(() => {
    if (suspendResult?.data) {
      toast.success("User suspended successfully");
      setUser((prev) => prev ? { ...prev, status: "suspended", suspendedAt: new Date().toISOString() } : prev);
    }
    if (suspendResult?.error) {
      toast.error(suspendResult.error.message || "Failed to suspend user");
    }
  }, [suspendResult]);

  useEffect(() => {
    if (restoreResult?.data) {
      toast.success("User restored successfully");
      setUser((prev) => prev ? { ...prev, status: "active", suspendedAt: null, suspendReason: null } : prev);
    }
    if (restoreResult?.error) {
      toast.error(restoreResult.error.message || "Failed to restore user");
    }
  }, [restoreResult]);

  useEffect(() => {
    if (banResult?.data) {
      toast.success("User banned successfully");
      setUser((prev) => prev ? { ...prev, status: "banned" } : prev);
    }
    if (banResult?.error) {
      toast.error(banResult.error.message || "Failed to ban user");
    }
  }, [banResult]);

  // ==================== VALIDATION ====================
  const validate = () => {
    const errs = {};

    const name = (form.name || "").trim();
    if (!name) {
      errs.name = "Name is required";
    } else if (name.length > 100) {
      errs.name = "Name must be 100 characters or less";
    }

    const email = (form.email || "").trim();
    if (!email) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Invalid email format";
    }

    if (!VALID_ROLES.includes(form.role)) {
      errs.role = "Invalid role";
    }

    const ts = Number(form.trustScore);
    if (!Number.isFinite(ts) || ts < 0 || ts > 100) {
      errs.trustScore = "Trust score must be 0–100";
    }

    const rp = Number(form.rewardPoints);
    if (!Number.isFinite(rp) || rp < 0) {
      errs.rewardPoints = "Reward points must be 0 or greater";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ==================== SAVE ====================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      await updateAdminUser(userId, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        trustScore: Number(form.trustScore),
        rewardPoints: Number(form.rewardPoints),
      });
      toast.success("User updated successfully");
      navigate(`/users/${userId}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ==================== CANCEL ====================
  const handleCancel = () => {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) {
      return;
    }
    navigate(`/users/${userId}`);
  };

  // ==================== FIELD CHANGE ====================
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ==================== MODERATION HANDLERS ====================
  const openModerationDialog = (action) => setModerationDialog((prev) => ({ open: true, action, dialogKey: prev.dialogKey + 1 }));
  const closeModerationDialog = () => setModerationDialog({ open: false, action: null, dialogKey: 0 });

  const handleModerationConfirm = (reason) => {
    const { action } = moderationDialog;
    if (action === "suspend") dispatch(suspendUser({ userId, reason }));
    else if (action === "restore") dispatch(restoreUser({ userId }));
    else if (action === "ban") dispatch(banUser({ userId, reason }));
    closeModerationDialog();
  };

  const moderationLoading = suspendResult?.loading || restoreResult?.loading || banResult?.loading;

  // ==================== CHANNEL MANAGEMENT ====================
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [channelContentTab, setChannelContentTab] = useState("videos");
  const [contentDialog, setContentDialog] = useState({ open: false, action: null, targetType: null, targetId: null, targetName: "", dialogKey: 0 });

  const [channelPage, setChannelPage] = useState(1);
  const [channelLimit] = useState(10);
  const [channelSearch, setChannelSearch] = useState("");
  const [debouncedChannelSearch, setDebouncedChannelSearch] = useState("");
  const channelSearchTimer = useRef(null);

  const [videoPage, setVideoPage] = useState(1);
  const [videoLimit, setVideoLimit] = useState(10);
  const [videoSearch, setVideoSearch] = useState("");
  const [debouncedVideoSearch, setDebouncedVideoSearch] = useState("");
  const videoSearchTimer = useRef(null);
  const [videoSortBy, setVideoSortBy] = useState("createdAt");
  const [videoSortOrder, setVideoSortOrder] = useState("desc");

  const [shortsPage, setShortsPage] = useState(1);
  const [shortsLimit, setShortsLimit] = useState(10);
  const [shortsSearch, setShortsSearch] = useState("");
  const [debouncedShortsSearch, setDebouncedShortsSearch] = useState("");
  const shortsSearchTimer = useRef(null);
  const [shortsSortBy, setShortsSortBy] = useState("createdAt");
  const [shortsSortOrder, setShortsSortOrder] = useState("desc");

  const channelsState = useSelector((s) => s.adminUser360.channels[userId]);
  const channelsLoading = channelsState?._loading ?? false;
  const channels = useMemo(() => channelsState?._loaded ? (channelsState.items || []) : [], [channelsState]);
  const channelsPagination = channelsState?._loaded
    ? (channelsState.pagination || { page: 1, totalPages: 1, total: 0 })
    : { page: 1, totalPages: 1, total: 0 };

  const effectiveSelectedChannelId = useMemo(
    () => selectedChannelId || channels[0]?._id || null,
    [selectedChannelId, channels],
  );

  const selectedChannel = useMemo(
    () => channels.find((ch) => ch._id === effectiveSelectedChannelId) || null,
    [channels, effectiveSelectedChannelId],
  );

  const videosState = useSelector((s) => s.adminUser360.videos[userId]);
  const videosLoading = videosState?._loading ?? false;
  const videosError = videosState?._error ?? null;
  const videos = videosState?._loaded ? (videosState.items || []) : [];
  const videosPagination = videosState?._loaded
    ? (videosState.pagination || { page: 1, totalPages: 1, total: 0 })
    : { page: 1, totalPages: 1, total: 0 };

  const shortsState = useSelector((s) => s.adminUser360.shorts[userId]);
  const shortsLoading = shortsState?._loading ?? false;
  const shortsError = shortsState?._error ?? null;
  const shorts = shortsState?._loaded ? (shortsState.items || []) : [];
  const shortsPagination = shortsState?._loaded
    ? (shortsState.pagination || { page: 1, totalPages: 1, total: 0 })
    : { page: 1, totalPages: 1, total: 0 };

  const channelModerationResult = useSelector((s) => s.adminUser360.channelModerationResult);
  const videoModerationResult = useSelector((s) => s.adminUser360.videoModerationResult);
  const shortModerationResult = useSelector((s) => s.adminUser360.shortModerationResult);

  const handleChannelSearchChange = useCallback((e) => {
    const val = e.target.value;
    setChannelSearch(val);
    clearTimeout(channelSearchTimer.current);
    channelSearchTimer.current = setTimeout(() => {
      setDebouncedChannelSearch(val);
      setChannelPage(1);
    }, 350);
  }, []);

  const handleVideoSearchChange = useCallback((e) => {
    const val = e.target.value;
    setVideoSearch(val);
    clearTimeout(videoSearchTimer.current);
    videoSearchTimer.current = setTimeout(() => {
      setDebouncedVideoSearch(val);
      setVideoPage(1);
    }, 350);
  }, []);

  const handleShortsSearchChange = useCallback((e) => {
    const val = e.target.value;
    setShortsSearch(val);
    clearTimeout(shortsSearchTimer.current);
    shortsSearchTimer.current = setTimeout(() => {
      setDebouncedShortsSearch(val);
      setShortsPage(1);
    }, 350);
  }, []);

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      clearTimeout(channelSearchTimer.current);
      clearTimeout(videoSearchTimer.current);
      clearTimeout(shortsSearchTimer.current);
    };
  }, []);

  // Load channels on mount + when page/search/limit changes
  useEffect(() => {
    if (user) dispatch(fetchAdminUserChannelsRedux({ userId, page: channelPage, limit: channelLimit, search: debouncedChannelSearch }));
  }, [userId, user, channelPage, channelLimit, debouncedChannelSearch, dispatch]);

  // Reset channel selection when search results change
  useEffect(() => {
    if (channels.length > 0 && effectiveSelectedChannelId && !channels.find((ch) => ch._id === effectiveSelectedChannelId)) {
      setSelectedChannelId(channels[0]._id);
      setChannelContentTab(null);
    }
  }, [channels, effectiveSelectedChannelId]);

  // Load content when channel/tab changes or page/search/sort changes
  useEffect(() => {
    if (!effectiveSelectedChannelId || !channelContentTab) return;
    if (channelContentTab === "videos") {
      dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: videoPage, limit: videoLimit, search: debouncedVideoSearch, sortBy: videoSortBy, sortOrder: videoSortOrder }));
    } else if (channelContentTab === "shorts") {
      dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: shortsPage, limit: shortsLimit, search: debouncedShortsSearch, sortBy: shortsSortBy, sortOrder: shortsSortOrder }));
    }
  }, [effectiveSelectedChannelId, channelContentTab, videoPage, videoLimit, debouncedVideoSearch, videoSortBy, videoSortOrder, shortsPage, shortsLimit, debouncedShortsSearch, shortsSortBy, shortsSortOrder, userId, dispatch]);

  // Handle channel moderation results
  useEffect(() => {
    if (channelModerationResult?.data) {
      toast.success(channelModerationResult.data.message || "Channel action completed");
      dispatch(clearChannelModerationResult());
    }
    if (channelModerationResult?.error) {
      toast.error(channelModerationResult.error.message || "Channel action failed");
      dispatch(clearChannelModerationResult());
    }
  }, [channelModerationResult, dispatch]);

  // Handle video moderation results
  useEffect(() => {
    if (videoModerationResult?.data) {
      toast.success(videoModerationResult.data.message || "Video action completed");
      dispatch(clearVideoModerationResult());
    }
    if (videoModerationResult?.error) {
      toast.error(videoModerationResult.error.message || "Video action failed");
      dispatch(clearVideoModerationResult());
    }
  }, [videoModerationResult, dispatch]);

  // Handle short moderation results
  useEffect(() => {
    if (shortModerationResult?.data) {
      toast.success(shortModerationResult.data.message || "Short action completed");
      dispatch(clearShortModerationResult());
    }
    if (shortModerationResult?.error) {
      toast.error(shortModerationResult.error.message || "Short action failed");
      dispatch(clearShortModerationResult());
    }
  }, [shortModerationResult, dispatch]);

  // Content moderation dialog handlers
  const openContentDialog = (action, targetType, targetId, targetName) => {
    setContentDialog((prev) => ({ open: true, action, targetType, targetId, targetName, dialogKey: prev.dialogKey + 1 }));
  };
  const closeContentDialog = () => setContentDialog({ open: false, action: null, targetType: null, targetId: null, targetName: "", dialogKey: 0 });

  const handleContentModerationConfirm = (reason) => {
    const { action, targetType, targetId } = contentDialog;
    if (targetType === "channel") {
      if (action === "disableChannel") dispatch(disableChannel({ userId, channelId: targetId, reason }));
      else if (action === "enableChannel") dispatch(enableChannel({ userId, channelId: targetId }));
      else if (action === "banChannel") dispatch(banChannel({ userId, channelId: targetId, reason }));
      else if (action === "restoreChannel") dispatch(restoreChannel({ userId, channelId: targetId }));
      else if (action === "deleteChannel") dispatch(deleteChannel({ userId, channelId: targetId, reason }));
    } else if (targetType === "video") {
      if (action === "disableVideo") dispatch(disableVideo({ userId, videoId: targetId, reason }));
      else if (action === "enableVideo") dispatch(enableVideo({ userId, videoId: targetId }));
      else if (action === "deleteVideo") dispatch(deleteVideo({ userId, videoId: targetId, reason }));
    } else if (targetType === "short") {
      if (action === "disableShort") dispatch(disableShort({ userId, videoId: targetId, reason }));
      else if (action === "enableShort") dispatch(enableShort({ userId, videoId: targetId }));
      else if (action === "deleteShort") dispatch(deleteShort({ userId, videoId: targetId, reason }));
    }
    closeContentDialog();
  };

  const contentModerationLoading = channelModerationResult?.loading || videoModerationResult?.loading || shortModerationResult?.loading;

  // ==================== DELETE HANDLER ====================
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteAdminUser(userId, deleteConfirmText || "Admin deleted user");
      toast.success("User deleted successfully");
      navigate("/alluser");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  // ==================== VALID MODERATION ACTIONS ====================
  const status = user?.status || "active";
  const canSuspend = status === "active";
  const canBan = status === "active";
  const canRestore = status === "suspended" || status === "banned";

  // ==================== LOADING ====================
  if (loading) {
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
          <p className="text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  // ==================== ERROR ====================
  if (loadError || !user) {
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
          <p className="text-lg font-medium text-gray-300 mb-1">
            Could not load user
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {loadError || "User not found"}
          </p>
          <button
            onClick={() => navigate("/alluser")}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const roleBadge = (role) => {
    if (role === "admin")
      return "bg-purple-500/15 text-purple-400 border border-purple-500/20";
    if (role === "creator")
      return "bg-blue-500/15 text-blue-400 border border-blue-500/20";
    return "bg-gray-500/15 text-gray-400 border border-gray-500/20";
  };

  const statusBadge = (s) => {
    const st = s || "active";
    if (st === "active")
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
    if (st === "suspended")
      return "bg-amber-500/15 text-amber-400 border border-amber-500/20";
    if (st === "banned")
      return "bg-red-500/15 text-red-400 border border-red-500/20";
    return "bg-gray-500/15 text-gray-400 border border-gray-500/20";
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition"
        >
          <ArrowLeft size={16} />
          Back to User
        </button>
        {dirty && (
          <span className="text-xs text-amber-400 font-medium">
            Unsaved changes
          </span>
        )}
      </div>

      {/* SECTION 1: USER HEADER */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center text-2xl font-bold flex-shrink-0 border border-red-500/20">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              user.name?.charAt(0)?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${roleBadge(user.role)}`}>
                {user.role}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${statusBadge(user.status)}`}>
                {user.status || "active"}
              </span>
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-0.5">
              <Mail size={13} />
              {user.email}
            </p>
            <p className="text-xs text-gray-500">
              ID: {user._id} &middot; Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* EDIT FORM */}
      <form onSubmit={handleSave} className="space-y-5">
      {/* SECTION 2: BASIC INFORMATION */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserIcon size={15} className="text-indigo-400" />
            Basic Information
          </h2>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                maxLength={100}
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-gray-100 text-sm
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition
                  ${errors.name ? "border-red-500/60" : "border-gray-700"}`}
                placeholder="Enter user name"
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
              <p className="text-[11px] text-gray-600 mt-1">
                {form.name.length}/100 characters
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} />
                  Email
                </span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-gray-100 text-sm
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition
                  ${errors.email ? "border-red-500/60" : "border-gray-700"}`}
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

      {/* SECTION 3: ACCOUNT & PERMISSIONS */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield size={15} className="text-amber-400" />
            Account &amp; Permissions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-gray-100 text-sm
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition
                  ${errors.role ? "border-red-500/60" : "border-gray-700"}`}
              >
                <option value="viewer">Viewer</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-400 mt-1">{errors.role}</p>
              )}
            </div>
          </div>
        </div>

      {/* SECTION 4: TRUST & REWARDS */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award size={15} className="text-pink-400" />
            Trust &amp; Rewards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Trust Score */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Trust Score
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={form.trustScore}
                  onChange={(e) =>
                    setField("trustScore", Number(e.target.value))
                  }
                  className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-gray-100 text-sm
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition
                    ${errors.trustScore ? "border-red-500/60" : "border-gray-700"}`}
                />
              </div>
              {errors.trustScore && (
                <p className="text-xs text-red-400 mt-1">{errors.trustScore}</p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-gray-600">0–100</p>
                <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setField("trustScore", v)}
                      className={`px-1.5 py-0.5 text-[10px] rounded border transition ${
                        Number(form.trustScore) === v
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                          : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              {/* Visual bar */}
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, Number(form.trustScore)))}%`,
                    backgroundColor:
                      Number(form.trustScore) >= 70
                        ? "#10b981"
                        : Number(form.trustScore) >= 40
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                />
              </div>
            </div>

            {/* Reward Points */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Reward Points
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.rewardPoints}
                onChange={(e) =>
                  setField("rewardPoints", Number(e.target.value))
                }
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-gray-100 text-sm
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition
                  ${errors.rewardPoints ? "border-red-500/60" : "border-gray-700"}`}
              />
              {errors.rewardPoints && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.rewardPoints}
                </p>
              )}
              <p className="text-[11px] text-gray-600 mt-1">Minimum: 0</p>
            </div>
          </div>
        </div>

      {/* SECTION 5: MODERATION & ACCOUNT STATUS */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldOff size={15} className="text-amber-400" />
            Moderation &amp; Account Status
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-300">Current status:</span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${statusBadge(user.status)}`}>
                {user.status || "active"}
              </span>
            </div>

            {user.status === "suspended" && user.suspendReason && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Suspension reason</p>
                <p className="text-sm text-amber-400">{user.suspendReason}</p>
                {user.suspendedAt && (
                  <p className="text-[11px] text-gray-600 mt-1">
                    Since {formatDateTime(user.suspendedAt)}
                  </p>
                )}
              </div>
            )}

            {user.status === "banned" && user.banReason && (
              <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Ban reason</p>
                <p className="text-sm text-red-400">{user.banReason}</p>
                {user.bannedAt && (
                  <p className="text-[11px] text-gray-600 mt-1">
                    Since {formatDateTime(user.bannedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {canSuspend && hasFeature("canSuspendUsers") && (
                <button
                  type="button"
                  onClick={() => openModerationDialog("suspend")}
                  disabled={moderationLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition disabled:opacity-50"
                >
                  <ShieldOff size={14} />
                  Suspend
                </button>
              )}
              {canBan && hasFeature("canBanUsers") && (
                <button
                  type="button"
                  onClick={() => openModerationDialog("ban")}
                  disabled={moderationLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition disabled:opacity-50"
                >
                  <Ban size={14} />
                  Ban
                </button>
              )}
              {canRestore && hasFeature("canSuspendUsers") && (
                <button
                  type="button"
                  onClick={() => openModerationDialog("restore")}
                  disabled={moderationLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
              )}
            </div>
          </div>
        </div>

      {/* SECTION 6: ACCOUNT METADATA */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info size={15} className="text-blue-400" />
            Account Metadata
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-0.5">User ID</p>
              <p className="text-sm text-gray-300 font-mono break-all">{user._id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Registration Method</p>
              <p className="text-sm text-gray-300 capitalize">{user.registrationMethod || "local"}</p>
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
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Trust Score</p>
              <p className="text-sm text-gray-300">{user.trustScore}</p>
            </div>
          </div>
        </div>

      </form>

      {/* SECTION 7: CHANNEL & CONTENT MANAGEMENT */}
      <div className="space-y-5">
        {/* Section title */}
        <div className="flex items-center gap-2">
          <Tv size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Channel &amp; Content Management
          </h2>
        </div>

        {/* Two-column layout: fixed left + flexible right */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5">

          {/* ===== LEFT: Channel List ===== */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Channels <span className="text-gray-600">({channelsPagination.total ?? channels.length})</span>
              </h3>
              <span className="text-[10px] text-gray-600">{channelPage} / {channelsPagination.totalPages || 1}</span>
            </div>

            {/* Channel search */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={channelSearch}
                onChange={handleChannelSearchChange}
                placeholder="Search channels..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-800/70 border border-gray-700/50 rounded-lg text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition"
              />
            </div>

            {channelsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-gray-800/50 animate-pulse" />
                ))}
              </div>
            ) : channels.length === 0 ? (
              <div className="py-10 text-center">
                <Tv size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {debouncedChannelSearch ? "No matching channels found" : "No channels found"}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  {debouncedChannelSearch ? "Try a different search term" : "This user has not created any channels."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {channels.map((ch) => {
                    const isActive = effectiveSelectedChannelId === ch._id;
                    const chStatus = ch.status || "active";
                    return (
                      <button
                        key={ch._id}
                        type="button"
                        onClick={() => { setSelectedChannelId(ch._id); setChannelContentTab(null); }}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition text-left ${
                          isActive ? "bg-indigo-500/10 border-indigo-500/30" : "bg-gray-800/40 border-gray-700/40 hover:bg-gray-800 hover:border-gray-600"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {ch.channelImage ? (
                            <img src={ch.channelImage} alt={ch.name} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <Tv size={15} className={isActive ? "text-indigo-400" : "text-gray-500"} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-xs truncate ${isActive ? "text-indigo-300" : "text-gray-200"}`}>{ch.name}</p>
                          <p className="text-[11px] text-gray-500">{formatNumber(ch.subscriberCount || 0)} subs &middot; {ch.videoCount || 0} videos &middot; {ch.shortCount || 0} shorts</p>
                        </div>
                        <ChannelStatusBadge status={chStatus} />
                        {isActive && <Check size={14} className="text-indigo-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {/* Channel pagination */}
                {channelsPagination.totalPages > 1 && (
                  <PaginationBar
                    pagination={channelsPagination}
                    onPageChange={setChannelPage}
                    total={channelsPagination.total}
                    limit={channelLimit}
                  />
                )}
              </>
            )}
          </div>

          {/* ===== RIGHT: Selected Channel Detail ===== */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            {selectedChannel ? (
              <>
                {/* Channel header */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-700/50">
                      {selectedChannel.channelImage ? (
                        <img src={selectedChannel.channelImage} alt={selectedChannel.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <Tv size={20} className="text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white text-sm truncate">{selectedChannel.name}</p>
                        <ChannelStatusBadge status={selectedChannel.status || "active"} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                        <span>{formatNumber(selectedChannel.subscriberCount || 0)} subscribers</span>
                        <span>&middot;</span>
                        <span>{selectedChannel.videoCount || 0} videos</span>
                        {(selectedChannel.shortCount || 0) > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{selectedChannel.shortCount} shorts</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Moderation actions */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-700/50" onClick={(e) => e.stopPropagation()}>
                    {(selectedChannel.status || "active") === "active" && (
                      <>
                        {hasFeature("canModerateContent") && <ChannelActionBtn icon={PowerOff} label="Disable" color="amber" onClick={() => openContentDialog("disableChannel", "channel", selectedChannel._id, selectedChannel.name)} />}
                        {hasFeature("canBanUsers") && <ChannelActionBtn icon={Ban} label="Ban" color="red" onClick={() => openContentDialog("banChannel", "channel", selectedChannel._id, selectedChannel.name)} />}
                      </>
                    )}
                    {(selectedChannel.status || "active") === "disabled" && (
                      <>
                        {hasFeature("canModerateContent") && <ChannelActionBtn icon={Power} label="Enable" color="emerald" onClick={() => openContentDialog("enableChannel", "channel", selectedChannel._id, selectedChannel.name)} />}
                        {hasFeature("canBanUsers") && <ChannelActionBtn icon={Ban} label="Ban" color="red" onClick={() => openContentDialog("banChannel", "channel", selectedChannel._id, selectedChannel.name)} />}
                      </>
                    )}
                    {(selectedChannel.status || "active") === "banned" && (
                      <ChannelActionBtn icon={RotateCcw} label="Restore" color="emerald" onClick={() => openContentDialog("restoreChannel", "channel", selectedChannel._id, selectedChannel.name)} />
                    )}
                    {hasFeature("canDeleteUsers") && <ChannelActionBtn icon={Trash2} label="Delete" color="red" onClick={() => openContentDialog("deleteChannel", "channel", selectedChannel._id, selectedChannel.name)} />}
                  </div>
                </div>

                {/* Content Tabs */}
                <div className="flex gap-1 mb-4 bg-gray-800/50 border border-gray-700/50 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => { setChannelContentTab("videos"); setVideoPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition flex-1 justify-center ${
                      channelContentTab === "videos" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    <Video size={13} />
                    Videos {channelContentTab === "videos" && videosPagination.total > 0 && <span className="text-[10px] opacity-70">({videosPagination.total})</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChannelContentTab("shorts"); setShortsPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition flex-1 justify-center ${
                      channelContentTab === "shorts" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                    }`}
                  >
                    <Clapperboard size={13} />
                    Shorts {channelContentTab === "shorts" && shortsPagination.total > 0 && <span className="text-[10px] opacity-70">({shortsPagination.total})</span>}
                  </button>
                </div>

                {/* Content Table */}
                {channelContentTab === "videos" ? (
                  <ContentTable
                    items={videos}
                    loading={videosLoading}
                    error={videosError}
                    pagination={videosPagination}
                    type="video"
                    emptyIcon={Video}
                    emptyText="No videos found"
                    searchValue={videoSearch}
                    onSearchChange={handleVideoSearchChange}
                    sortBy={videoSortBy}
                    sortOrder={videoSortOrder}
                    onSortChange={(by, order) => { setVideoSortBy(by); setVideoSortOrder(order); setVideoPage(1); }}
                    limit={videoLimit}
                    onLimitChange={(l) => { setVideoLimit(l); setVideoPage(1); }}
                    onPageChange={(p) => setVideoPage(p)}
                    onRetry={() => dispatch(fetchAdminUserVideosRedux({ userId, channelId: effectiveSelectedChannelId, page: videoPage, limit: videoLimit, search: debouncedVideoSearch, sortBy: videoSortBy, sortOrder: videoSortOrder }))}
                    onAction={(action, item) => openContentDialog(action, "video", item._id, item.title)}
                  />
                ) : channelContentTab === "shorts" ? (
                  <ContentTable
                    items={shorts}
                    loading={shortsLoading}
                    error={shortsError}
                    pagination={shortsPagination}
                    type="short"
                    emptyIcon={Clapperboard}
                    emptyText="No shorts found"
                    searchValue={shortsSearch}
                    onSearchChange={handleShortsSearchChange}
                    sortBy={shortsSortBy}
                    sortOrder={shortsSortOrder}
                    onSortChange={(by, order) => { setShortsSortBy(by); setShortsSortOrder(order); setShortsPage(1); }}
                    limit={shortsLimit}
                    onLimitChange={(l) => { setShortsLimit(l); setShortsPage(1); }}
                    onPageChange={(p) => setShortsPage(p)}
                    onRetry={() => dispatch(fetchAdminUserShortsRedux({ userId, channelId: effectiveSelectedChannelId, page: shortsPage, limit: shortsLimit, search: debouncedShortsSearch, sortBy: shortsSortBy, sortOrder: shortsSortOrder }))}
                    onAction={(action, item) => openContentDialog(action, "short", item._id, item.title)}
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
      </div>

      {/* SECTION 8: DANGER ZONE */}
      <form onSubmit={handleSave} className="space-y-5">
      <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={15} />
            Danger Zone
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Delete this user. The user will be moved to Deleted Users and can be restored later.
          </p>
          {hasFeature("canDeleteUsers") && (
            !showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition"
            >
              <Trash2 size={14} />
              Delete User
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-300">
                Type <span className="font-mono text-red-400">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                placeholder='Type "DELETE" to confirm'
                autoFocus
              />
              <div className="flex gap-2">
                {hasFeature("canDeleteUsers") && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ACTION FOOTER */}
        <div className="flex items-center gap-3 pt-2 pb-4">
          {hasFeature("canEditUsers") && (
          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>

      <ModerationDialog
        key={moderationDialog.dialogKey}
        open={moderationDialog.open}
        action={moderationDialog.action}
        userName={user.name}
        onConfirm={handleModerationConfirm}
        onCancel={closeModerationDialog}
        loading={moderationLoading}
      />

      <ModerationDialog
        key={contentDialog.dialogKey}
        open={contentDialog.open}
        action={contentDialog.action}
        userName={user.name}
        targetName={contentDialog.targetName}
        onConfirm={handleContentModerationConfirm}
        onCancel={closeContentDialog}
        loading={contentModerationLoading}
      />
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function ChannelStatusBadge({ status }) {
  const s = status || "active";
  const styles = {
    active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    disabled: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    banned: "bg-red-500/15 text-red-400 border border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${styles[s] || styles.active}`}>
      {s}
    </span>
  );
}

function ChannelActionBtn({ icon, label, color, onClick }) {
  const colors = {
    amber: "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
    red: "text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border rounded-md transition ${colors[color] || colors.amber}`}
    >
      {icon && React.createElement(icon, { size: 12 })}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest" },
  { value: "createdAt:asc", label: "Oldest" },
  { value: "views:desc", label: "Most Views" },
  { value: "likesCount:desc", label: "Most Likes" },
];
const LIMIT_OPTIONS = [10, 20, 50];

function PaginationBar({ pagination, onPageChange, total, limit }) {
  const { page, totalPages } = pagination;
  const start = Math.min((page - 1) * limit + 1, total || 0);
  const end = Math.min(page * limit, total || 0);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const rangeStart = Math.max(2, page - 1);
      const rangeEnd = Math.min(totalPages - 1, page + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-gray-500">Showing {start}–{end} of {total}</p>
      </div>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 transition"
        >
          <ChevronLeft size={14} />
        </button>
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1 text-gray-600 text-xs">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[26px] h-[26px] rounded border text-[11px] font-medium transition ${
                p === page
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function ContentTable({
  items, loading, error, pagination, type,
  emptyIcon, emptyText,
  searchValue, onSearchChange,
  sortBy, sortOrder, onSortChange,
  limit, onLimitChange,
  onPageChange, onRetry, onAction,
}) {
  const sortValue = `${sortBy}:${sortOrder}`;
  const itemTypeLabel = type === "short" ? "shorts" : "videos";

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-48 rounded bg-gray-800/70 animate-pulse" />
          <div className="h-8 w-24 rounded bg-gray-800/70 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle size={24} className="text-red-400 mb-2 opacity-60" />
        <p className="text-sm text-gray-400 mb-3">{error?.message || "Failed to load content"}</p>
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

  if (items.length === 0 && !searchValue) {
    return (
      <div className="py-10 text-center">
        {emptyIcon && React.createElement(emptyIcon, { size: 28, className: "text-gray-700 mx-auto mb-2" })}
        <p className="text-sm text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar: search + sort + limit */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchValue || ""}
            onChange={onSearchChange}
            placeholder={`Search ${itemTypeLabel}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-800/70 border border-gray-700/50 rounded-lg text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>
        <select
          value={sortValue}
          onChange={(e) => {
            const [by, order] = e.target.value.split(":");
            onSortChange(by, order);
          }}
          className="bg-gray-800/70 border border-gray-700/50 rounded-lg text-[11px] text-gray-400 px-2 py-1.5 focus:outline-none focus:border-indigo-500/50"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={limit || 10}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="bg-gray-800/70 border border-gray-700/50 rounded-lg text-[11px] text-gray-400 px-2 py-1.5 focus:outline-none focus:border-indigo-500/50"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <Search size={24} className="text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No matching {itemTypeLabel} found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[11px] text-gray-500 border-b border-gray-800">
                <th className="pb-2 pr-3 font-medium">Content</th>
                <th className="pb-2 pr-3 font-medium text-right">Views</th>
                <th className="pb-2 pr-3 font-medium text-right">Likes</th>
                <th className="pb-2 pr-3 font-medium text-right">Comments</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {items.map((item) => {
                const itemStatus = item.status || "active";
                const disableAction = type === "short" ? "disableShort" : "disableVideo";
                const enableAction = type === "short" ? "enableShort" : "enableVideo";
                const deleteAction = type === "short" ? "deleteShort" : "deleteVideo";
                return (
                  <tr key={item._id} className="hover:bg-gray-800/30 transition">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-10 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video size={14} className="text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] text-gray-200 font-medium truncate max-w-[260px]">{item.title}</p>
                          <p className="text-[10px] text-gray-600">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-[13px] text-gray-400">{(item.views || 0).toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-right text-[13px] text-gray-400">{(item.likesCount || 0).toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-right text-[13px] text-gray-400">{item.commentCount || 0}</td>
                    <td className="py-2.5 pr-3"><ChannelStatusBadge status={itemStatus} /></td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {itemStatus === "active" && hasFeature("canModerateContent") && (
                          <button
                            type="button"
                            onClick={() => onAction(disableAction, item)}
                            title="Disable"
                            className="inline-flex items-center px-1.5 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded transition"
                          >
                            <PowerOff size={11} />
                          </button>
                        )}
                        {itemStatus === "disabled" && hasFeature("canModerateContent") && (
                          <button
                            type="button"
                            onClick={() => onAction(enableAction, item)}
                            title="Enable"
                            className="inline-flex items-center px-1.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded transition"
                          >
                            <Power size={11} />
                          </button>
                        )}
                        {hasFeature("canModerateContent") && (
                        <button
                          type="button"
                          onClick={() => onAction(deleteAction, item)}
                          title="Delete"
                          className="inline-flex items-center px-1.5 py-1 text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition"
                        >
                          <Trash2 size={11} />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <PaginationBar
              pagination={pagination}
              onPageChange={onPageChange}
              total={pagination.total || 0}
              limit={limit || 10}
            />
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProfileData,
  removeHistoryItem,
} from "../features/profile/profileSlice";
import { toast } from "react-toastify";
import {
  Eye,
  Clock,
  DollarSign,
  IndianRupee,
  History,
  Users,
  TrendingUp,
  Calendar,
  Edit,
  Mail,
  ArrowUpDown,
  X,
  Upload,
  Lock,
  Trash2,
  Phone,
  ShieldCheck,
  Eye as EyeIcon,
  EyeOff,
} from "lucide-react";
import { API_BASE, API_ORIGIN as BACKEND_URL } from "../config/api";
import { authFetch } from "../utils/session";

const resolveMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const normalized = String(value).replace(/\\/g, "/");
  if (normalized.startsWith("uploads/")) return `${BACKEND_URL}/${normalized}`;
  if (normalized.startsWith("/uploads/")) return `${BACKEND_URL}${normalized}`;
  if (normalized.includes("uploads/")) {
    return `${BACKEND_URL}/${normalized.split("uploads/").pop()}`;
  }
  return `${BACKEND_URL}/${normalized}`;
};

const COUNTRY_MCC = {
  IN: "404",
  US: "310",
  CA: "302",
  GB: "234",
  AU: "505",
  AE: "424",
  SA: "420",
  SG: "525",
  MY: "502",
  BD: "470",
  PK: "410",
  NP: "429",
  LK: "413",
};

const getMccForCountry = (country) => COUNTRY_MCC[country?.toUpperCase()] || "";

const createDeviceFingerprint = async (value) => {
  const source = String(value || "");
  if (/^[a-f0-9]{64}$/i.test(source)) return source;

  if (window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(source);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return source.slice(0, 64);
};

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, myVideos, historyVideos, loading, error } = useSelector(
    (state) => state.profile,
  );

  const [activeTab, setActiveTab] = useState("my-videos");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Edit Profile Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    advertisingId: "",
    deviceFingerprint: "",
    country: "",
    timezone: "",
    simMcc: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);

  // Change Password Modal States
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchProfileData());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const loadProfileDeviceData = async () => {
      if (!user) return;

      const storedAdvertisingId =
        localStorage.getItem("advertisingId") || window.crypto.randomUUID();
      localStorage.setItem("advertisingId", storedAdvertisingId);
      const rawFingerprint =
        user.deviceFingerprint ||
        `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}`;
      const fingerprint = await createDeviceFingerprint(rawFingerprint);
      if (cancelled) return;

      setEditForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        advertisingId: user.advertisingId || storedAdvertisingId,
        deviceFingerprint: fingerprint,
        country: user.country || "",
        timezone:
          user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        simMcc: user.simMcc || getMccForCountry(user.country),
      });
    };

    loadProfileDeviceData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!isEditOpen || !user) return;

    let cancelled = false;
    const applyDetectedCountry = (country) => {
      if (!country || cancelled || user.country) return;
      const normalizedCountry = country.toUpperCase();
      setEditForm((current) => ({
        ...current,
        country: normalizedCountry,
        simMcc: user.simMcc || getMccForCountry(normalizedCountry),
      }));
    };

    const detectCountryByIp = async () => {
      try {
        const response = await fetch("https://ipwho.is/");
        if (response.ok) {
          const location = await response.json();
          applyDetectedCountry(location.country_code);
        }
      } catch (error) {
        console.warn("Could not detect country from IP:", error);
      }
    };

    if (!user.country && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
            );
            if (!response.ok) return detectCountryByIp();
            const location = await response.json();
            if (location.countryCode) {
              applyDetectedCountry(location.countryCode);
            } else {
              detectCountryByIp();
            }
          } catch (error) {
            console.warn("Could not detect country from location:", error);
            detectCountryByIp();
          }
        },
        () => detectCountryByIp(),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 },
      );
    } else if (!user.country) {
      detectCountryByIp();
    }

    return () => {
      cancelled = true;
    };
  }, [isEditOpen, user]);

  useEffect(() => {
    if (error) {
      const needsRedirect =
        error.includes("Session expired") || error.includes("No token found");
      if (needsRedirect) {
        navigate("/login");
      }
    }
  }, [error, navigate]);

  // Handle Avatar Selection + Client-side Validation
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Only image files are allowed (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError("Image size must be less than 5MB");
      return;
    }

    // Revoke previous preview to prevent memory leak
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setEditError(null);
  };

  // Submit Edit Profile (Name + Email + Avatar) - FIXED
  const handleEditSubmit = async () => {
    setEditLoading(true);
    setEditError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token || !user?._id) throw new Error("Please login again");

      const trimmedName = (editForm.name || "").trim();
      const trimmedEmail = (editForm.email || "").trim().toLowerCase();

      if (!trimmedName) {
        throw new Error("Name cannot be empty");
      }

      const formData = new FormData();

      // Always send name & email (prevents empty / incomplete form issues)
      formData.append("name", trimmedName);
      formData.append("email", trimmedEmail);
      if (editForm.phone.trim())
        formData.append("phone", editForm.phone.trim());
      formData.append("advertisingId", editForm.advertisingId.trim());
      formData.append("deviceFingerprint", editForm.deviceFingerprint.trim());
      formData.append("country", editForm.country.trim());
      formData.append("timezone", editForm.timezone.trim());
      formData.append("simMcc", editForm.simMcc.trim());

      // Avatar only if selected
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch(`${API_BASE}/user/${user._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Important: DO NOT set Content-Type when using FormData
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Refresh profile from the backend so Redux holds the latest data
      await dispatch(fetchProfileData());

      setEditForm({
        name: data.user?.name || trimmedName,
        email: data.user?.email || trimmedEmail,
        phone: data.user?.phone || editForm.phone,
        advertisingId: data.user?.advertisingId || editForm.advertisingId,
        deviceFingerprint:
          data.user?.deviceFingerprint || editForm.deviceFingerprint,
        country: data.user?.country || editForm.country,
        timezone: data.user?.timezone || editForm.timezone,
        simMcc: data.user?.simMcc || editForm.simMcc,
      });

      // Cleanup preview URL
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsEditOpen(false);

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Edit submit error:", err);
      setEditError(err.message || "Something went wrong");
    } finally {
      setEditLoading(false);
    }
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditError(null);
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setPhoneOtp("");
    setPhoneOtpSent(false);
  };

  const requestPhoneOtp = async () => {
    try {
      setPhoneVerifyLoading(true);
      setEditError(null);
      const response = await authFetch(`${API_BASE}/phone/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editForm.phone }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not send verification code");
      }
      setPhoneOtpSent(true);
      toast.info(
        data.otpCode
          ? `Development OTP: ${data.otpCode}`
          : "Verification code sent to your account email",
      );
    } catch (err) {
      setEditError(err.message);
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    try {
      setPhoneVerifyLoading(true);
      setEditError(null);
      const response = await authFetch(`${API_BASE}/phone/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editForm.phone, otp: phoneOtp }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid verification code");
      }
      setPhoneOtpSent(false);
      setPhoneOtp("");
      await dispatch(fetchProfileData());
      toast.success("Phone verified successfully");
    } catch (err) {
      setEditError(err.message);
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  // Password Submit
  const handlePasswordSubmit = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(false);

      const { oldPassword, newPassword, confirmPassword } = passwordForm;

      if (!oldPassword || !newPassword || !confirmPassword) {
        throw new Error("All fields are required");
      }
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      const token = localStorage.getItem("token");
      if (!token || !user?._id) throw new Error("Authentication required");

      const res = await authFetch(`${API_BASE}/user/password/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to change password");
      }

      setPasswordSuccess(true);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setIsPasswordOpen(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordModal = () => {
    setIsPasswordOpen(false);
    setPasswordForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError(null);
    setPasswordSuccess(false);
    setShowPasswords({ old: false, new: false, confirm: false });
  };

  const handleRemoveHistory = async (e, videoId) => {
    e.stopPropagation();
    try {
      await dispatch(removeHistoryItem(videoId)).unwrap();
      toast.success("Removed from watch history");
    } catch (err) {
      toast.error(err || "Something went wrong");
    }
  };

  const getStatusBadge = (status) => {
    const isActive = status?.toLowerCase() === "public";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
          ${
            isActive
              ? "bg-green-900/40 text-green-400 border border-green-800/50"
              : "bg-red-900/40 text-red-400 border border-red-800/50"
          }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const tabs = [
    { id: "my-videos", label: "My Videos", icon: Eye },
    { id: "earnings", label: "Earnings", icon: IndianRupee },
    { id: "watch-history", label: "Watch History", icon: History },
  ];

  const sortedVideos = useMemo(() => {
    return [...myVideos].sort((a, b) => {
      if (sortBy === "latest")
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "earnings") return b.earnings - a.earnings;
      return 0;
    });
  }, [myVideos, sortBy]);

  const getTabContent = () => {
    if (activeTab === "earnings") {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Earnings Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "This Month",
                value: `₹${(user?.earningsThisMonth || 0).toLocaleString()}`,
              },
              {
                label: "Total Earnings",
                value: `₹${(user?.totalEarnings || 0).toLocaleString()}`,
              },
              {
                label: "Pending",
                value: `₹${(user?.pendingWithdrawal || 0).toLocaleString()}`,
              },
              { label: "Avg. RPM", value: `₹${user?.avgRPM || "0.0"}` },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center"
              >
                <p className="text-xs text-zinc-400">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="text-center text-zinc-500 py-10">
            Earnings history will appear here once available
          </div>
        </div>
      );
    }

    if (activeTab === "watch-history") {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Watch History</h3>
          {historyVideos.length === 0 ? (
            <div className="text-center text-zinc-500 py-20">
              <p className="text-xl">No watch history yet</p>
              <p className="mt-2 text-sm">Videos you watch will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => navigate(`/video/${video.id}`)}
                  className="group flex flex-col sm:flex-row items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 hover:border-zinc-600 hover:bg-zinc-900 transition cursor-pointer"
                >
                  <div className="relative aspect-video w-full sm:w-40 md:w-48 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    <img
                      src={resolveMediaUrl(video.avatar)}
                      alt={video.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-base line-clamp-2">
                      {video.title}
                    </h4>
                    <p className="mt-1 text-sm text-zinc-400">
                      {video.channel}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {Number(video.views || 0).toLocaleString()} views
                      {video.watchedAt && (
                        <>
                          {" • "}
                          {new Date(video.watchedAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleRemoveHistory(e, video.id)}
                    className="shrink-0 p-2 rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove from history"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // My Videos Tab
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">My Videos</h3>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
            >
              <option value="latest">Latest</option>
              <option value="views">Highest Views</option>
              <option value="earnings">Highest Earnings</option>
            </select>
          </div>
        </div>

        {myVideos.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-xl">No videos yet</p>
            <p className="mt-2 text-sm">
              Upload your first video to get started
            </p>
          </div>
        ) : (
          sortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onOpen={setSelectedVideo}
              getStatusBadge={getStatusBadge}
            />
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">
          Error: {error || "Profile not loaded"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Profile Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <img
                src={resolveMediaUrl(user.avatar) || user.avatar}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-zinc-700 shadow-lg"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{user.name}</h1>
                <p className="text-zinc-400 mt-1">{user.handle}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Users size={16} />
                    <span>{user.subscribers.toLocaleString()} subscribers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    <span>Joined {user.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                onClick={() => navigate("/withdraw")}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <IndianRupee size={18} />
                Withdraw
              </button>
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg border border-zinc-700 transition-colors"
              >
                <Edit size={16} />
                Edit Profile
              </button>
              <button
                onClick={() => setIsPasswordOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg border border-zinc-700 transition-colors"
              >
                <Lock size={16} />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-5 mb-10">
          {[
            {
              icon: Eye,
              color: "blue",
              value: user.totalViews?.toLocaleString() || "0",
              label: "Total Views",
            },
            {
              icon: DollarSign,
              color: "red",
              value: `₹${(user.totalEarnings || 0).toLocaleString()}`,
              label: "Total Earnings",
            },
            {
              icon: TrendingUp,
              color: "red",
              value: `₹${(user.totalEarnings || 0).toLocaleString()}`,
              label: "Trust Score",
            },
            {
              icon: IndianRupee,
              color: "red",
              value: `₹${(user.totalEarnings || 0).toLocaleString()}`,
              label: "Earning as Viewer",
            },
          ].map((item) => {
            const StatIcon = item.icon;
            return (
              <div
                key={item.label}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center"
              >
                <StatIcon
                  size={24}
                  className={`mx-auto mb-3 text-${item.color}-500`}
                />
                <p className="text-2xl font-bold">{item.value}</p>
                {item.sub ? (
                  <p className="text-xs text-zinc-500 mt-0.5">{item.sub}</p>
                ) : null}
                <p className="text-xs text-zinc-600 mt-1">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-zinc-800">
          <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-800 text-red-400 border-b-2 border-red-600"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-h-125">
          {getTabContent()}
        </div>
      </div>

      {/* ====================== EDIT PROFILE MODAL ====================== */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-lg w-full border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button
                onClick={closeEdit}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {editError && (
                <div className="bg-red-950 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {editError}
                </div>
              )}

              {/* Avatar */}
              <div>
                <span className="text-xs text-zinc-400 block mb-2">Avatar</span>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      avatarPreview ||
                      resolveMediaUrl(user.avatar) ||
                      user.avatar
                    }
                    alt="Avatar Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700"
                  />
                  <label className="cursor-pointer flex-1 flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-sm transition-colors">
                    <Upload size={18} />
                    <span className="truncate">
                      {avatarFile ? avatarFile.name : "Choose new image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Max 5MB • JPG, PNG, WebP supported
                </p>
              </div>

              {/* Name */}
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Name</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Email</span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">Phone number</span>
                  {user.phoneVerified && editForm.phone === user.phone ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => {
                        setEditForm({ ...editForm, phone: e.target.value });
                        setPhoneOtpSent(false);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-3 focus:outline-none focus:border-red-600"
                      placeholder="+919876543210"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={requestPhoneOtp}
                    disabled={phoneVerifyLoading || !editForm.phone.trim()}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs disabled:opacity-50"
                  >
                    {phoneVerifyLoading ? "Sending..." : "Verify"}
                  </button>
                </div>
                {phoneOtpSent && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={(e) =>
                        setPhoneOtp(e.target.value.replace(/\D/g, ""))
                      }
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600"
                      placeholder="6-digit code"
                    />
                    <button
                      type="button"
                      onClick={verifyPhoneOtp}
                      disabled={phoneVerifyLoading || phoneOtp.length !== 6}
                      className="px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-xs disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  Verification code is sent to your account email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["country", "Country", "IN"],
                  ["timezone", "Timezone", "Asia/Kolkata"],
                  ["simMcc", "SIM MCC (auto)", "Detected from location"],
                  ["advertisingId", "Advertising ID", "Optional"],
                ].map(([field, label, placeholder]) => (
                  <div key={field}>
                    <span className="text-xs text-zinc-400 block mb-1">
                      {label}
                    </span>
                    <input
                      type="text"
                      value={editForm[field]}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [field]: e.target.value })
                      }
                      readOnly={field === "simMcc"}
                      className={`w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 ${field === "simMcc" ? "cursor-not-allowed text-zinc-500" : ""}`}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">
                    Device fingerprint
                  </span>
                  <span
                    className={`text-xs ${user.deviceVerified ? "text-green-400" : "text-amber-400"}`}
                  >
                    {user.deviceVerified ? "Verified" : "Not verified"}
                  </span>
                </div>
                <input
                  type="text"
                  value={editForm.deviceFingerprint}
                  readOnly
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-500 focus:outline-none"
                  placeholder="Generating secure fingerprint..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeEdit}
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================== CHANGE PASSWORD MODAL ====================== */}
      {isPasswordOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-red-500" />
                <h2 className="text-xl font-semibold">Change Password</h2>
              </div>
              <button
                onClick={closePasswordModal}
                className="p-2 hover:bg-zinc-800 rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {passwordError && (
                <div className="bg-red-950 border border-red-800 text-red-300 px-4 py-3 rounded text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-950 border border-green-800 text-green-300 px-4 py-3 rounded text-sm">
                  Password updated successfully!
                </div>
              )}

              {/* Old Password */}
              <div>
                <span className="text-xs text-zinc-400 block mb-1">
                  Current Password
                </span>
                <div className="relative">
                  <input
                    type={showPasswords.old ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        oldPassword: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((p) => ({ ...p, old: !p.old }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showPasswords.old ? (
                      <EyeOff size={18} />
                    ) : (
                      <EyeIcon size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <span className="text-xs text-zinc-400 block mb-1">
                  New Password
                </span>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((p) => ({ ...p, new: !p.new }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showPasswords.new ? (
                      <EyeOff size={18} />
                    ) : (
                      <EyeIcon size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <span className="text-xs text-zinc-400 block mb-1">
                  Confirm New Password
                </span>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <EyeIcon size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={passwordLoading || passwordSuccess}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-zinc-800">
            <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Video Details</h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-zinc-800 rounded-full"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <img
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                className="w-full h-56 object-cover rounded-xl"
              />
              <h3 className="mt-5 text-2xl font-semibold">
                {selectedVideo.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Video Card Component
function VideoCard({ video, onOpen, getStatusBadge }) {
  return (
    <div
      onClick={() => onOpen(video)}
      className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-40 h-48 sm:h-28 shrink-0">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 p-4 flex flex-col">
          <h3 className="font-medium leading-tight line-clamp-2 mb-3">
            {video.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-zinc-400 mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye size={15} /> {video.views?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign size={15} className="text-red-500" /> ₹
                {(video.earnings || 0).toFixed(2)}
              </div>
            </div>
            {getStatusBadge(video.status)}
          </div>
        </div>
      </div>
    </div>
  );
}

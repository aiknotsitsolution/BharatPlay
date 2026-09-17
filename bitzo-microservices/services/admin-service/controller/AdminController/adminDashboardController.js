const User = require("../../models/usermodel");
const Video = require("../../models/Videomodel");
const WatchSession = require("../../models/WatchSession");

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatRelativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const formatDuration = (seconds) => {
  const total = Math.floor(seconds || 0);
  const minutes = Math.floor(total / 60);
  const rem = total % 60;
  return `${minutes}:${rem.toString().padStart(2, "0")}`;
};

const getInitials = (name) =>
  (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const buildWeekDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    days.push({ day: DAY_NAMES[start.getDay()], start, end });
  }
  return days;
};

exports.getDashboard = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const weekDays = buildWeekDays();
    const weekStart = weekDays[0].start;
    const sevenDaysAgo = new Date(weekStart);
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalVideos,
      totalShorts,
      activeUsersAgg,
      usersThisWeek,
      videosThisWeek,
      newUsersToday,
      videosToday,
      viewsAgg,
      watchTimeAgg,
      recentUsersDocs,
      recentUploadDocs,
      onlineIds,
    ] = await Promise.all([
      User.estimatedDocumentCount(),
      Video.estimatedDocumentCount(),
      Video.countDocuments({ videoType: "short" }),
      WatchSession.aggregate([
        { $match: { lastActiveAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$userId" } },
        { $count: "count" },
      ]),
      User.find({ createdAt: { $gte: weekStart } }, { createdAt: 1 }).lean(),
      Video.find({ createdAt: { $gte: weekStart } }, { createdAt: 1 }).lean(),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      Video.countDocuments({ createdAt: { $gte: startOfToday } }),
      Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      WatchSession.aggregate([
        { $match: { lastActiveAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: "$watchedSeconds" } } },
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt avatar")
        .lean(),
      Video.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({ path: "uploadedBy", select: "name", model: User })
        .lean(),
      WatchSession.aggregate([
        { $match: { lastActiveAt: { $gte: fifteenMinAgo } } },
        { $group: { _id: "$userId" } },
        { $limit: 100 },
      ]),
    ]);

    const onlineSet = new Set(onlineIds.map((item) => String(item._id)));

    const weekly = weekDays.map(({ day, start, end }) => ({
      day,
      users: usersThisWeek.filter(
        (user) => user.createdAt >= start && user.createdAt < end
      ).length,
      videos: videosThisWeek.filter(
        (video) => video.createdAt >= start && video.createdAt < end
      ).length,
    }));

    const recentUsers = recentUsersDocs.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      joined: formatRelativeTime(user.createdAt),
      avatar: user.avatar || getInitials(user.name),
      status: onlineSet.has(String(user._id)) ? "online" : "offline",
    }));

    const recentUploads = recentUploadDocs.map((video) => ({
      id: video._id,
      title: video.title,
      uploadedBy: video.uploadedBy?.name || "Unknown",
      time: formatRelativeTime(video.createdAt),
      views: video.views || 0,
      duration: formatDuration(video.duration),
    }));

    const stats = {
      totalUsers,
      totalVideos,
      totalShorts,
      totalLongVideos: totalVideos - totalShorts,
      activeUsers: activeUsersAgg[0]?.count || 0,
      newUsersThisWeek: usersThisWeek.length,
    };

    const snapshot = {
      newUsers: newUsersToday,
      videosUploaded: videosToday,
      totalViews: viewsAgg[0]?.total || 0,
      watchTime: Math.round((watchTimeAgg[0]?.total || 0) / 3600),
    };

    return res.status(200).json({
      success: true,
      data: {
        stats,
        weekly,
        snapshot,
        recentUsers,
        recentUploads,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dashboard data",
    });
  }
};

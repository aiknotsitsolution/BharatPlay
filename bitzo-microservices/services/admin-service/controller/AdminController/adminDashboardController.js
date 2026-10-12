const User = require("../../models/usermodel");
const Video = require("../../models/Videomodel");
const Channel = require("../../models/Channel/ChannelModel");
const WatchSession = require("../../models/WatchSession");
const {
  getAdImpressionModel,
  getContactRequestModel,
  getCopyrightCaseModel,
} = require("../../models/DashboardMetrics");

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

// Last 12 calendar months (oldest first) for the month-wise growth trend.
const buildMonths = () => {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_NAMES[start.getMonth()],
      start,
      days: Math.round((end - start) / 86400000),
    });
  }
  return months;
};

const getDailyMetrics = async (label, modelFactory, pipeline) => {
  try {
    return await modelFactory().aggregate(pipeline).exec();
  } catch (error) {
    console.error(`getDashboard ${label} metrics error:`, error.message);
    return null;
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const weekDays = buildWeekDays();
    const weekStart = weekDays[0].start;
    const monthWindow = buildMonths();
    const sevenDaysAgo = new Date(weekStart);
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalVideos,
      totalShorts,
      activeUsers,
      usersThisWeek,
      videosThisWeek,
      newUsersToday,
      videosToday,
      viewsAgg,
      watchTimeAgg,
      recentUsersDocs,
      recentUploadDocs,
      onlineIds,
      usersByMonthAgg,
      videosByMonthAgg,
    ] = await Promise.all([
      User.estimatedDocumentCount(),
      Video.estimatedDocumentCount(),
      Video.countDocuments({ videoType: "short" }),
      User.countDocuments({ status: "active" }),
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
      // Month-wise new users (last 12 months) for the growth trend chart
      getDailyMetrics("monthly-users", () => User, [
        { $match: { createdAt: { $gte: monthWindow[0].start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            total: { $sum: 1 },
          },
        },
      ]),
      // Month-wise video uploads (last 12 months) for the activity chart
      getDailyMetrics("monthly-uploads", () => Video, [
        { $match: { createdAt: { $gte: monthWindow[0].start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const [
      inquiriesByDay,
      copyrightByDay,
      adsByDay,
      copyrightByMonth,
      adsByMonth,
    ] = await Promise.all([
      getDailyMetrics("inquiry", getContactRequestModel, [
          { $match: { createdAt: { $gte: weekStart } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              total: { $sum: 1 },
            },
          },
        ]),
      getDailyMetrics("copyright", getCopyrightCaseModel, [
          { $match: { createdAt: { $gte: weekStart } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              total: { $sum: 1 },
            },
          },
        ]),
      getDailyMetrics("ad", getAdImpressionModel, [
          {
            $match: {
              createdAt: { $gte: weekStart },
              event: { $in: ["impression", "complete"] },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              impressions: {
                $sum: { $cond: [{ $eq: ["$event", "impression"] }, 1, 0] },
              },
              completed: {
                $sum: { $cond: [{ $eq: ["$event", "complete"] }, 1, 0] },
              },
            },
          },
        ]),
      // Month-wise copyright cases (last 12 months) for the cases trend chart
      getDailyMetrics("monthly-copyright", getCopyrightCaseModel, [
          { $match: { createdAt: { $gte: monthWindow[0].start } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              total: { $sum: 1 },
            },
          },
        ]),
      // Month-wise ad impressions/completions (last 12 months) for the ads trend chart
      getDailyMetrics("monthly-ads", getAdImpressionModel, [
          {
            $match: {
              createdAt: { $gte: monthWindow[0].start },
              event: { $in: ["impression", "complete"] },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              impressions: {
                $sum: { $cond: [{ $eq: ["$event", "impression"] }, 1, 0] },
              },
              completed: {
                $sum: { $cond: [{ $eq: ["$event", "complete"] }, 1, 0] },
              },
            },
          },
        ]),
    ]);

    // ── Top-viewed videos per period (long vs short) ────────────────────
    // For every month (last 12) and day (last 7) find the highest-viewed
    // long & short video, then hydrate uploader + channel for the hover card.
    const classifyVideoType = {
      $cond: [{ $in: ["short", "$videoType"] }, "short", "long"],
    };
    const [topByMonthAgg, topByDayAgg] = await Promise.all([
      getDailyMetrics("top-videos-month", () => Video, [
        { $match: { createdAt: { $gte: monthWindow[0].start } } },
        { $sort: { views: -1 } },
        {
          $group: {
            _id: {
              key: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              type: classifyVideoType,
            },
            views: { $first: "$views" },
            videoId: { $first: "$_id" },
          },
        },
      ]),
      getDailyMetrics("top-videos-day", () => Video, [
        { $match: { createdAt: { $gte: weekStart } } },
        { $sort: { views: -1 } },
        {
          $group: {
            _id: {
              key: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              type: classifyVideoType,
            },
            views: { $first: "$views" },
            videoId: { $first: "$_id" },
          },
        },
      ]),
    ]);

    const topVideoIds = [
      ...new Set(
        [...(topByMonthAgg || []), ...(topByDayAgg || [])].map((row) =>
          String(row.videoId),
        ),
      ),
    ];
    let topVideoDocs = [];
    if (topVideoIds.length) {
      try {
        topVideoDocs = await Video.find({ _id: { $in: topVideoIds } })
          .populate({ path: "uploadedBy", select: "name avatar", model: User })
          .populate({ path: "channel", select: "name", model: Channel })
          .lean();
      } catch (error) {
        console.error("getDashboard top-video hydrate error:", error.message);
      }
    }
    const topVideoById = new Map(
      topVideoDocs.map((doc) => [String(doc._id), doc]),
    );
    const serializeTopVideo = (videoId) => {
      if (!videoId) return null;
      const doc = topVideoById.get(String(videoId));
      if (!doc) return null;
      return {
        title: doc.title,
        views: doc.views || 0,
        userName: doc.uploadedBy?.name || "Unknown",
        userAvatar: doc.uploadedBy?.avatar || null,
        channelName: doc.channel?.name || "—",
      };
    };
    const topMapOf = (rows) =>
      rows
        ? new Map(rows.map((row) => [`${row._id.key}|${row._id.type}`, row]))
        : new Map();
    const monthTopMap = topMapOf(topByMonthAgg);
    const dayTopMap = topMapOf(topByDayAgg);

    const topVideosMonthwise = monthWindow.map(({ key, label }) => {
      const longRow = monthTopMap.get(`${key}|long`);
      const shortRow = monthTopMap.get(`${key}|short`);
      return {
        month: label,
        longViews: longRow?.views || 0,
        shortViews: shortRow?.views || 0,
        longTop: serializeTopVideo(longRow?.videoId),
        shortTop: serializeTopVideo(shortRow?.videoId),
      };
    });
    const topVideosDaywise = weekDays.map(({ day, start }) => {
      const dateKey = start.toISOString().slice(0, 10);
      const longRow = dayTopMap.get(`${dateKey}|long`);
      const shortRow = dayTopMap.get(`${dateKey}|short`);
      return {
        day,
        longViews: longRow?.views || 0,
        shortViews: shortRow?.views || 0,
        longTop: serializeTopVideo(longRow?.videoId),
        shortTop: serializeTopVideo(shortRow?.videoId),
      };
    });

    const totalsByDay = (rows) =>
      rows ? new Map(rows.map((row) => [row._id, row.total])) : null;
    const inquiriesMap = totalsByDay(inquiriesByDay);
    const copyrightMap = totalsByDay(copyrightByDay);
    const adsMap = adsByDay
      ? new Map(adsByDay.map((row) => [row._id, row]))
      : null;

    const onlineSet = new Set(onlineIds.map((item) => String(item._id)));

    const weekly = weekDays.map(({ day, start, end }) => {
      const dateKey = start.toISOString().slice(0, 10);
      return {
        day,
        users: usersThisWeek.filter(
          (user) => user.createdAt >= start && user.createdAt < end,
        ).length,
        videos: videosThisWeek.filter(
          (video) => video.createdAt >= start && video.createdAt < end,
        ).length,
        inquiries: inquiriesMap ? inquiriesMap.get(dateKey) || 0 : null,
        copyrightCases: copyrightMap ? copyrightMap.get(dateKey) || 0 : null,
        adImpressions: adsMap ? adsMap.get(dateKey)?.impressions || 0 : null,
        adCompletions: adsMap ? adsMap.get(dateKey)?.completed || 0 : null,
      };
    });

    // Month-wise growth trend (real data — last 12 months of signups)
    const monthlyTotals = usersByMonthAgg
      ? new Map(usersByMonthAgg.map((row) => [row._id, row.total]))
      : null;
    const monthly = monthWindow.map(({ key, label, days }) => {
      const total = monthlyTotals ? monthlyTotals.get(key) || 0 : 0;
      return {
        month: label,
        users: total,
        dayAvg: Math.round(total / days),
      };
    });

    // Month-wise video uploads (real data — last 12 months)
    const uploadTotals = videosByMonthAgg
      ? new Map(videosByMonthAgg.map((row) => [row._id, row.total]))
      : null;
    const monthlyVideos = monthWindow.map(({ key, label, days }) => {
      const total = uploadTotals ? uploadTotals.get(key) || 0 : 0;
      return {
        month: label,
        videos: total,
        dayAvg: Math.round(total / days),
      };
    });

    // Month-wise copyright cases (real data — last 12 months)
    const copyrightMonthMap = copyrightByMonth
      ? new Map(copyrightByMonth.map((row) => [row._id, row.total]))
      : null;
    const monthlyCopyright = monthWindow.map(({ key, label, days }) => {
      const total = copyrightMonthMap ? copyrightMonthMap.get(key) || 0 : 0;
      return {
        month: label,
        cases: total,
        dayAvg: Number((total / days).toFixed(2)),
      };
    });

    // Month-wise ad impressions/completions (last 12 months)
    const adsMonthMap = adsByMonth
      ? new Map(adsByMonth.map((row) => [row._id, row]))
      : null;
    const monthlyAds = monthWindow.map(({ key, label, days }) => {
      const row = adsMonthMap ? adsMonthMap.get(key) : null;
      const impressions = row?.impressions || 0;
      const completed = row?.completed || 0;
      return {
        month: label,
        impressions,
        completed,
        dayAvg: Number((impressions / days).toFixed(2)),
      };
    });

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
      activeUsers,
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
        monthly,
        monthlyVideos,
        monthlyCopyright,
        monthlyAds,
        snapshot,
        recentUsers,
        recentUploads,
        topVideos: {
          monthwise: topVideosMonthwise,
          daywise: topVideosDaywise,
        },
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

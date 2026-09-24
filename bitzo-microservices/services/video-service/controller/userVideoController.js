const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const mongoose = require("mongoose");
const path = require("path");
const imagekit = require("../utils/imagekit");
const categoryModel = require("../models/CategoryModel/category.model");
const HashtagStats = require("../models/CategoryModel/HashtagStats");
const ChannelModel = require("../models/Channel/ChannelModel");
const User = require("../models/usermodel"); // ✅ Import User model
const WatchSession = require("../models/WatchSession");
const { getVideoDuration } = require("../utils/mediaDuration");
const {
  createNotification,
  createBulkNotifications,
} = require("../utils/notificationService");
const { logAuditEvent } = require("../services/auditEventService");
const {
  TRUST_RULES,
  changeTrustScore,
} = require("../services/trustScoreService");
const {
  emitHistoryUpdated,
  emitViewCountUpdated,
} = require("../services/socketService");

const ABS_WATCH_SECONDS_CAP = 12 * 60 * 60; // 43200s hard cap per session

const resolveCategory = async (categoryValue) => {
  const value = String(categoryValue || "").trim();
  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    return categoryModel.findById(value);
  }

  const slug = value.toLowerCase();
  const existingCategory = await categoryModel.findOne({
    $or: [{ slug }, { name: value }],
  });
  if (existingCategory) return existingCategory;

  const name = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return categoryModel.findOneAndUpdate(
    { slug },
    {
      $setOnInsert: {
        name,
        slug,
        isMain: slug !== "creative-corner",
        isCreativeCorner: slug === "creative-corner",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const createChannel = async (req, res) => {
  try {
    const {
      name,
      channeldescription,
      category,
      contactemail,
      videoUrl,
      hashtags: rawHashtags,
    } = req.body;

    const userId = req.user.id;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "Channel name and category are required",
      });
    }

    // Check category exists
    const categoryData = await resolveCategory(category);
    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const hashtags = (Array.isArray(rawHashtags) ? rawHashtags : [rawHashtags])
      .flatMap((value) => String(value || "").split(/[\s,]+/))
      .map((tag) => tag.replace(/^#+/, "").trim().toLowerCase())
      .filter(Boolean);

    const isCreativeCornerCategory =
      categoryData.isCreativeCorner ||
      categoryData.slug === "creative-corner" ||
      categoryData.name?.toLowerCase() === "creative corner";

    if (isCreativeCornerCategory && hashtags.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one hashtag is required for Creative Corner channels",
      });
    }

    let channelImageUrl = "";
    let channelBannerUrl = "";

    if (req.files?.channelImage?.[0]) {
      try {
        const file = req.files.channelImage[0];
        console.log("Uploading channel image:", {
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });

        const base64String = file.buffer.toString("base64");

        const imageRes = await imagekit.upload({
          file: base64String,
          fileName: `channel-img-${Date.now()}-${file.originalname}`,
          folder: "channelImages",
          overwriteFile: true,
        });
        channelImageUrl = imageRes.url;
        console.log("✅ Channel image uploaded:", channelImageUrl);
      } catch (imageError) {
        console.error("❌ ImageKit Error:", imageError);
        throw imageError;
      }
    }

    if (req.files?.channelBanner?.[0]) {
      try {
        const file = req.files.channelBanner[0];
        console.log("Uploading channel banner:", {
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });

        const base64String = file.buffer.toString("base64");

        const bannerRes = await imagekit.upload({
          file: base64String,
          fileName: `channel-banner-${Date.now()}-${file.originalname}`,
          folder: "channelBanners",
          overwriteFile: true,
        });
        channelBannerUrl = bannerRes.url;
        console.log("✅ Channel banner uploaded:", channelBannerUrl);
      } catch (bannerError) {
        console.error("❌ ImageKit Error:", bannerError);
        throw bannerError;
      }
    }

    const newChannel = await Channel.create({
      name,
      channeldescription,
      category: categoryData._id,
      hashtags: [...new Set(hashtags)],
      contactemail,
      videoUrl: videoUrl || "",
      channelImage: channelImageUrl,
      channelBanner: channelBannerUrl,
      creator: userId,
    });

    // ✅ Save channel ID into User's channels array
    await User.findByIdAndUpdate(userId, {
      $push: { channels: newChannel._id },
    });

    await logAuditEvent({
      userId,
      eventType: "CHANNEL_CREATE",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: { channelId: newChannel._id, channelName: name },
    });

    // Populate category name for response
    const populatedChannel = await Channel.findById(newChannel._id).populate({
      path: "category",
      select: "name",
      model: categoryModel,
    });

    return res.status(201).json({
      success: true,
      message: "Channel created successfully",
      channel: populatedChannel,
    });
  } catch (error) {
    console.error("Error in createChannel:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const uploadVideo = async (req, res) => {
  try {
    const { channelId } = req.params;
    const {
      name,
      description,
      category,
      videoType,
      duration,
      hashtags: rawHashtags,
      isCreativeCorner: rawIsCreativeCorner,
    } = req.body;

    const isCreativeCorner =
      rawIsCreativeCorner === true || rawIsCreativeCorner === "true";
    const hashtags = (Array.isArray(rawHashtags) ? rawHashtags : [rawHashtags])
      .flatMap((value) => String(value || "").split(/[\s,]+/))
      .map((tag) => tag.replace(/^#+/, "").trim().toLowerCase())
      .filter(Boolean);

    if (isCreativeCorner && hashtags.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one hashtag is required for Creative Corner videos",
      });
    }

    const channel = await ChannelModel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    if (channel.creator?.toString() !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to upload to this channel",
      });
    }

    // Resolve category (find or create)
    const categoryData = await resolveCategory(category);
    if (!categoryData) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    if (isCreativeCorner && !categoryData.isCreativeCorner) {
      return res.status(400).json({
        success: false,
        message: "Creative Corner videos must use the Creative Corner category",
      });
    }

    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: "Video file required",
      });
    }

    const b2UploadedVideo = req.uploadedVideo;
    const videoFile = req.files?.video?.[0] || null;
    const thumbnailFile = req.files?.thumbnail?.[0] || null;

    const normalizeMediaPath = (filePath) => {
      if (!filePath) return null;

      const normalized = filePath.replace(/\\/g, "/");

      if (/^https?:\/\//i.test(normalized)) {
        return normalized;
      }

      const basename = path.basename(normalized);
      if (normalized.includes("uploads/")) {
        return normalized.replace(/^.*?(uploads\/.*)$/, "$1");
      }

      return `uploads/${basename}`;
    };

    let videoPath = null;
    let thumbnailPath = null;

    if (b2UploadedVideo?.url) {
      videoPath = b2UploadedVideo.url;
      thumbnailPath = b2UploadedVideo.thumbnailUrl || null;
    } else {
      videoPath = normalizeMediaPath(videoFile?.path);
      thumbnailPath = normalizeMediaPath(thumbnailFile?.path || null);
    }

    // Authoritative duration from the media file
    let authoritativeDuration = null;
    try {
      if (videoPath && !/^https?:\/\//i.test(videoPath)) {
        authoritativeDuration = await getVideoDuration(videoPath);
      }
      if (!authoritativeDuration) {
        console.error(
          "[mediaDuration] Could not determine duration for:",
          videoPath || "<no path>",
        );
      }
    } catch (err) {
      console.error("[mediaDuration] Duration extraction failed:", err.message);
    }

    // ✅ FIXED: categoryData._id use karo, raw "category" mat use karo
    const newVideo = new Video({
      channel: channelId,
      category: categoryData._id,          // ← YEH LINE FIX HAI
      title: name?.trim() || "Untitled",
      description,
      videoUrl: videoPath,
      thumbnail: thumbnailPath,
      videoType: videoType ? [videoType] : undefined,
      hashtags: [...new Set(hashtags)],
      isCreativeCorner,
      isMonetized: true,
      duration:
        authoritativeDuration ||
        (Number(duration) > 0 ? Number(duration) : undefined),
      uploadedBy: req.user?.userId,
    });

    await newVideo.save();

    if (isCreativeCorner && hashtags.length > 0) {
      await HashtagStats.bulkWrite(
        hashtags.map((hashtag) => ({
          updateOne: {
            filter: { hashtag },
            update: {
              $setOnInsert: { hashtag },
              $inc: { videoCount: 1 },
              $addToSet: { uniqueCreators: req.user?.userId },
              $set: { updatedAt: new Date() },
            },
            upsert: true,
          },
        })),
      );
    }

    // Push video ID into Channel's videos array
    channel.videos.push(newVideo._id);
    await channel.save();

    // Push video ID into User's videos array
    await User.findByIdAndUpdate(req.user?.userId, {
      $push: { videos: newVideo._id },
    });

    // Notify all subscribers of the channel
    await createBulkNotifications({
      recipients: channel.subscribedBy || [],
      actor: req.user?.userId,
      type: "upload",
      video: newVideo._id,
      channel: channelId,
    });

    await logAuditEvent({
      userId: req.user?.userId,
      eventType: "VIDEO_UPLOAD",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: {
        videoId: newVideo._id,
        videoTitle: newVideo.title,
        videoType: newVideo.videoType,
        channelId,
        channelName: channel.name,
      },
    });

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// const getChannels = async (req, res) => {
//   try {
//     const channels = await Channel.find({}).populate("category", "_id name",).populate("Videosuser"); // 👈 id + name

//     res.status(200).json({
//       success: true,
//       channels,
//     });
//   } catch (error) {
//     console.error("Error in getChannels:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

const getChannels = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id; // handle both

    const channels = await Channel.find({ creator: userId }) // ✅ was "user", must be "creator"
      .populate({ path: "category", select: "_id name", model: categoryModel })
      .populate({ path: "creator", model: User }); // ✅ was "owner" which doesn't exist in schema

    return res.status(200).json({
      success: true,
      count: channels.length,
      channels,
    });
  } catch (error) {
    console.error("Error in getChannels:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getSubscribedChannels = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).populate({
      path: "subscribedChannels",
      select: "name channelImage _id",
      model: Channel,
    });

    const channels = (user?.subscribedChannels || []).map((channel) => ({
      _id: channel._id,
      name: channel.name,
      channelImage: channel.channelImage || "",
      path: `/channel/${channel._id}`,
    }));

    return res.status(200).json({
      success: true,
      channels,
    });
  } catch (error) {
    console.error("Error in getSubscribedChannels:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET /api/channels/:id
// GET /api/uservideo/channel/:id
// Public channel page (channel info + videos)
const getChannelById = async (req, res) => {
  try {
    const channelId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID format",
      });
    }

    // Channel details
    const channel = await Channel.findById(channelId)
      .populate({ path: "category", select: "_id name", model: categoryModel })
      .populate({ path: "creator", select: "name email", model: User })
      .lean();

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Videos of this channel
    const videos = await Video.find({ channel: channelId })
      .populate({ path: "uploadedBy", select: "_id name email", model: User })
      .sort({ createdAt: -1 })
      .lean();

    // Check if current user is subscribed
    let isSubscribed = false;
    const userId = req.user?.id || req.user?.userId || req.user?._id;

    if (userId) {
      const user = await User.findById(userId).select("subscribedChannels");
      isSubscribed = (user?.subscribedChannels || []).some(
        (id) => id.toString() === channelId,
      );
    }

    return res.status(200).json({
      success: true,
      channel: {
        ...channel,
        isSubscribed,
        subscribersCount: channel.subscribedBy?.length || 0,
        videoCount: videos.length,
        handle:
          channel.handle ||
          channel.name?.toLowerCase().replace(/\s+/g, "") ||
          "channel",
        description: channel.channeldescription || channel.description || "",
      },
      videos,
    });
  } catch (error) {
    console.error("Error in getChannelById:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const mapVideoToListItem = (video) => ({
  _id: video?._id,
  id: video?._id,
  title: video?.title || "Untitled video",
  thumbnail:
    video?.thumbnail ||
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800",
  channel: video?.channel?.name || "Unknown channel",
  channelName: video?.channel?.name || "Unknown channel",
  duration: video?.duration || "—",
  watchedDate: video?.updatedAt
    ? new Date(video.updatedAt).toLocaleDateString()
    : "Recently watched",
  createdAt: video?.createdAt,
  videoUrl: video?.videoUrl,
  views: video?.views || 0,
  likesCount: video?.likesCount || 0,
  status: video?.status || "active",
});

const getUserWatchHistory = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { page, limit, skip } = getPagination(req);

    const user = await User.findById(userId).select("viewedVideos");
    const viewedVideoIds = (user?.viewedVideos || []).map((id) =>
      id.toString(),
    );
    const sessions = await WatchSession.find({ userId })
      .sort({ lastActiveAt: -1, startedAt: -1 })
      .select("videoId")
      .lean();
    const sessionVideoIds = sessions
      .map((session) => session.videoId?.toString())
      .filter(Boolean);
    const allVideoIds = Array.from(
      new Set([...sessionVideoIds, ...viewedVideoIds]),
    );

    const total = allVideoIds.length;
    const pagedIds = allVideoIds.slice(skip, skip + limit);

    if (pagedIds.length === 0) {
      return res
        .status(200)
        .json({ success: true, videos: [], total, page, limit });
    }

    const videos = await Video.find({ _id: { $in: pagedIds } })
      .populate("channel", "name channelImage subscribedBy")
      .populate({ path: "uploadedBy", select: "name email", model: User });

    const videoMap = new Map(videos.map((v) => [v._id.toString(), v]));

    const orderedVideos = pagedIds
      .map((id) => videoMap.get(id.toString()))
      .filter(Boolean)
      .map(mapVideoToListItem);

    return res
      .status(200)
      .json({ success: true, videos: orderedVideos, total, page, limit });
  } catch (error) {
    console.error("Error in getUserWatchHistory:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const saveToWatchHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { videoId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!mongoose.isValidObjectId(videoId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid video ID" });
    }

    const video = await Video.exists({ _id: videoId });
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    await User.updateOne({ _id: userId }, { $pull: { viewedVideos: videoId } });
    await User.updateOne(
      { _id: userId },
      { $push: { viewedVideos: { $each: [videoId], $position: 0 } } },
    );
    emitHistoryUpdated(userId, videoId);

    return res.status(200).json({ success: true, historyRecorded: true });
  } catch (error) {
    console.error("Error in saveToWatchHistory:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const removeFromWatchHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    const { videoId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, message: "Video ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.viewedVideos = (user.viewedVideos || []).filter(
      (id) => id.toString() !== videoId.toString(),
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Removed from watch history",
      removed: true,
      historyCount: user.viewedVideos.length,
    });
  } catch (error) {
    console.error("Error in removeFromWatchHistory:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const clearWatchHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.viewedVideos = [];
    await user.save();

    await logAuditEvent({
      userId,
      eventType: "WATCH_HISTORY_CLEAR",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
    });

    return res.status(200).json({
      success: true,
      message: "Watch history cleared",
      historyCount: 0,
    });
  } catch (error) {
    console.error("Error in clearWatchHistory:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserLikedVideos = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).populate({
      path: "likedVideos",
      model: Video,
      populate: {
        path: "channel",
        select: "name channelImage",
      },
      options: { sort: { createdAt: -1 } },
    });

    const videos = (user?.likedVideos || []).map(mapVideoToListItem);

    return res.status(200).json({ success: true, videos });
  } catch (error) {
    console.error("Error in getUserLikedVideos:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserWatchLaterVideos = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { page, limit, skip } = getPagination(req);

    const user = await User.findById(userId).select("watchLaterVideos");
    const watchLaterIds = user?.watchLaterVideos || [];

    const total = watchLaterIds.length;
    const reversedIds = watchLaterIds.slice().reverse();
    const pagedIds = reversedIds.slice(skip, skip + limit);

    if (pagedIds.length === 0) {
      return res
        .status(200)
        .json({ success: true, videos: [], total, page, limit });
    }

    const videos = await Video.find({ _id: { $in: pagedIds } })
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name email", model: User });

    const videoMap = new Map(videos.map((v) => [v._id.toString(), v]));

    const orderedVideos = pagedIds
      .map((id) => videoMap.get(id.toString()))
      .filter(Boolean)
      .map(mapVideoToListItem);

    return res
      .status(200)
      .json({ success: true, videos: orderedVideos, total, page, limit });
  } catch (error) {
    console.error("Error in getUserWatchLaterVideos:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserUploadedVideos = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { page, limit, skip } = getPagination(req);

    const filter = { uploadedBy: userId };

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("channel", "name channelImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      videos: videos.map(mapVideoToListItem),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in getUserUploadedVideos:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getvideosByChannel = async (req, res) => {
  try {
    console.log("───────────────────────────────");
    console.log("URL hit:", req.originalUrl);
    console.log("req.params:", req.params);
    console.log("───────────────────────────────");

    // ✅ FIXED
    const channelId = req.params.id;

    // Channel ID check
    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: "Channel ID is required in URL",
      });
    }

    // Mongo ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Channel ID format",
      });
    }

    // Find videos by channel
    const videos = await Video.find({ channel: channelId })
      .populate({ path: "uploadedBy", select: "_id name email", model: User })
      .populate({
        path: "channel",
        select: "name channelImage channelBanner channeldescription category",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Videos found: ${videos.length}`);

    return res.status(200).json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error("Error in getvideosByChannel:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching videos",
    });
  }
};

const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const channel = await Channel.findOneAndDelete({
      _id: id,
      creator: userId,
    });
    if (!channel) {
      return res
        .status(404)
        .json({ success: false, message: "Channel not found or unauthorized" });
    }
    await Video.deleteMany({ channel: id });

    await logAuditEvent({
      userId,
      eventType: "CHANNEL_DELETE",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: { channelId: id, channelName: channel.name },
    });

    res.status(200).json({
      success: true,
      message: "Channel and associated videos deleted",
    });
  } catch (error) {
    console.error("Error in deleteChannel:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name email", model: User });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    console.error("Error in getAllVideos:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const getCategoryFilter = (req) => {
  const raw = req.query.category;
  if (!raw || typeof raw !== "string") return null;
  if (!mongoose.Types.ObjectId.isValid(raw)) return null;
  return raw;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const recommendedVideos = async (req, res) => {
  try {
    const category = getCategoryFilter(req);
    const { page, limit, skip } = getPagination(req);

    const filter = { videoType: "long" };
    if (category) filter.category = category;

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name avatar", model: User });

    const total = await Video.countDocuments(filter);

    res.status(200).json({
      success: true,
      videos,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Error in recommendedVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const RELATED_VIDEOS_LIMIT = 12;
const RELATED_CHANNEL_CAP = 3;

const getRelatedVideos = async (req, res) => {
  try {
    const { id } = req.params;

    const currentVideoId = mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : null;
    if (!currentVideoId) {
      return res.status(400).json({
        success: false,
        message: "Invalid video id",
      });
    }

    const currentVideo = await Video.findById(currentVideoId).select(
      "category channel videoType",
    );

    const baseFilter = { videoType: "long" };
    if (currentVideo) {
      baseFilter._id = { $ne: currentVideoId };
    }

    const seenIds = new Set();
    const videos = [];
    let done = false;

    const collect = (docs) => {
      for (const doc of docs) {
        if (videos.length >= RELATED_VIDEOS_LIMIT) break;
        const docId = doc._id.toString();
        if (seenIds.has(docId)) continue;
        if (currentVideoId && docId === currentVideoId.toString()) continue;
        seenIds.add(docId);
        videos.push(doc);
      }
      done = videos.length >= RELATED_VIDEOS_LIMIT;
      return done;
    };

    if (currentVideo) {
      // Priority 1: same category, most viewed first.
      if (currentVideo.category) {
        const categoryVideos = await Video.find({
          ...baseFilter,
          category: currentVideo.category,
        })
          .sort({ views: -1, createdAt: -1 })
          .limit(RELATED_VIDEOS_LIMIT)
          .populate("channel", "name channelImage");
        collect(categoryVideos);
      }

      // Priority 2: same channel, capped to avoid a single-channel wall.
      if (currentVideo.channel && !done) {
        const channelVideos = await Video.find({
          ...baseFilter,
          channel: currentVideo.channel,
        })
          .sort({ views: -1, createdAt: -1 })
          .limit(RELATED_CHANNEL_CAP)
          .populate("channel", "name channelImage");
        collect(channelVideos);
      }
    }

    // Priority 3: fill remaining with most viewed videos.
    if (!done) {
      const viewedVideos = await Video.find(baseFilter)
        .sort({ views: -1, createdAt: -1 })
        .limit(RELATED_VIDEOS_LIMIT)
        .populate("channel", "name channelImage");
      collect(viewedVideos);
    }

    // Priority 4: fill remaining with latest uploaded videos.
    if (!done) {
      const latestVideos = await Video.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(RELATED_VIDEOS_LIMIT)
        .populate("channel", "name channelImage");
      collect(latestVideos);
    }

    res.status(200).json({
      success: true,
      videos: videos.slice(0, RELATED_VIDEOS_LIMIT),
    });
  } catch (error) {
    console.error("Error in getRelatedVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const trendingVideos = async (req, res) => {
  try {
    const filter = { videoType: "long" };
    const category = getCategoryFilter(req);
    if (category) filter.category = category;
    const { page, limit, skip } = getPagination(req);

    const videos = await Video.find(filter)
      .sort({ views: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name channelImage subscribedBy")
      .populate({ path: "uploadedBy", select: "name avatar", model: User });

    const total = await Video.countDocuments(filter);

    res.status(200).json({
      success: true,
      videos,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Error in trendingVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const LatestVideos = async (req, res) => {
  try {
    const filter = { videoType: "long" };
    const category = getCategoryFilter(req);
    if (category) filter.category = category;
    const { page, limit, skip } = getPagination(req);

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name avatar", model: User });

    const total = await Video.countDocuments(filter);

    res.status(200).json({
      success: true,
      videos,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Error in LatestVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const trendingShorts = async (req, res) => {
  try {
    const filter = { videoType: "short" };
    const category = getCategoryFilter(req);
    if (category) filter.category = category;
    const { page, limit, skip } = getPagination(req);

    const videos = await Video.find(filter)
      .sort({ views: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name channelImage subscribedBy")
      .populate({ path: "uploadedBy", select: "name avatar", model: User });

    const total = await Video.countDocuments(filter);

    const userId = req.user?.id || req.user?.userId || req.user?._id;
    let user = null;

    if (userId) {
      user = await User.findById(userId);
    }

    const likedVideoIds = new Set(
      (user?.likedVideos || []).map((id) => id.toString()),
    );
    const dislikedVideoIds = new Set(
      (user?.dislikedVideos || []).map((id) => id.toString()),
    );

    const videosWithReaction = videos.map((video) => {
      const videoId = video._id?.toString();
      let userReaction = null;

      if (videoId && likedVideoIds.has(videoId)) {
        userReaction = "like";
      } else if (videoId && dislikedVideoIds.has(videoId)) {
        userReaction = "dislike";
      }

      return {
        ...video.toObject(),
        userReaction,
        subscribersCount: video.channel?.subscribedBy?.length || 0,
        isSubscribed: Boolean(
          userId &&
          video.channel?.subscribedBy?.some(
            (id) => id.toString() === userId.toString(),
          ),
        ),
      };
    });

    res.status(200).json({
      success: true,
      videos: videosWithReaction,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Error in trendingShorts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const topShorts = async (req, res) => {
  try {
    const filter = { videoType: "short" };
    const category = getCategoryFilter(req);
    if (category) filter.category = category;
    const { page, limit, skip } = getPagination(req);

    const videos = await Video.find(filter)
      .sort({ views: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name avatar", model: User });

    const total = await Video.countDocuments(filter);

    res.status(200).json({
      success: true,
      videos,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Error in topShorts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getVideoById = async (req, res) => {
  try {
    const videoId = req.params.id || req.params.videoId;
    const video = await Video.findById(videoId)
      .populate("channel", "name subscribersCount channelImage subscribedBy")
      .populate({ path: "uploadedBy", select: "name avatar", model: User });

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    const userId = req.user?.id || req.user?.userId || req.user?._id;
    let userReaction = null;
    let isSubscribed = false;
    let isWatchLater = false;
    let watchedPercent = 0;

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        if ((user.likedVideos || []).some((i) => i.toString() === videoId)) {
          userReaction = "like";
        } else if (
          (user.dislikedVideos || []).some((i) => i.toString() === videoId)
        ) {
          userReaction = "dislike";
        }

        isSubscribed = (user.subscribedChannels || []).some(
          (chId) => chId.toString() === video.channel?._id?.toString(),
        );
        isWatchLater = (user.watchLaterVideos || []).some(
          (savedVideoId) => savedVideoId.toString() === videoId.toString(),
        );
      }

      const viewerEntry = (video.viewers || []).find(
        (v) => v.userId?.toString() === userId.toString(),
      );
      if (viewerEntry) watchedPercent = viewerEntry.watchedPercent || 0;
    }

    res.status(200).json({
      success: true,
      video: {
        ...video.toObject(),
        userReaction,
        isSubscribed,
        isWatchLater,
        watchedPercent,
        subscribersCount: video.channel?.subscribedBy?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error in getVideoById:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const recordWatchSession = async (video, userId, body) => {
  try {
    const { duration, watchSeconds, sessionId, watchedPercent } = body || {};
    const durationNum = Number(duration);
    const watchSecondsNum = Number(watchSeconds);

    if (!Number.isFinite(watchSecondsNum) || watchSecondsNum <= 0) return null;

    const reportedDuration =
      Number.isFinite(durationNum) && durationNum > 0 ? durationNum : 0;
    const storedDuration =
      Number(video.duration) > 0 ? Number(video.duration) : 0;
    const authoritativeDuration =
      storedDuration > 0 ? storedDuration : reportedDuration;
    const cap =
      authoritativeDuration > 0
        ? Math.min(authoritativeDuration, ABS_WATCH_SECONDS_CAP)
        : ABS_WATCH_SECONDS_CAP;

    const clampedSeconds = Math.max(0, Math.min(watchSecondsNum, cap));
    if (clampedSeconds <= 0) return null;

    const normalizedUserId = userId?.toString();
    const videoIdString = video._id?.toString();

    const finalSessionId =
      typeof sessionId === "string" &&
      sessionId.length >= 8 &&
      sessionId.length <= 64
        ? sessionId
        : `${normalizedUserId}:${videoIdString}:${Math.floor(Date.now() / 60000)}`;

    const videoType = Array.isArray(video.videoType)
      ? video.videoType.includes("short")
        ? "short"
        : "long"
      : video.videoType === "short"
        ? "short"
        : "long";

    await WatchSession.findOneAndUpdate(
      {
        userId: normalizedUserId,
        videoId: videoIdString,
        sessionId: finalSessionId,
      },
      {
        $max: { watchedSeconds: clampedSeconds },
        $set: {
          duration: authoritativeDuration,
          watchedPercent: Math.min(
            100,
            Math.max(0, Number(watchedPercent) || 0),
          ),
          videoType,
          lastActiveAt: new Date(),
        },
        $setOnInsert: { startedAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const effectivePercent =
      authoritativeDuration > 0
        ? (clampedSeconds / authoritativeDuration) * 100
        : Math.min(100, Math.max(0, Number(watchedPercent) || 0));
    const eventContext = {
      deviceId: null,
      ipAddress: null,
      metadata: { videoId: videoIdString, sessionId: finalSessionId },
    };
    if (clampedSeconds > 180) {
      await changeTrustScore({
        userId: normalizedUserId,
        changeAmount: TRUST_RULES.SESSION_OVER_3_MIN,
        eventType: "SESSION_OVER_3_MIN",
        reason: "Watched a video session for more than 3 minutes",
        eventKey: `watch-3m:${normalizedUserId}:${videoIdString}:${finalSessionId}`,
        ...eventContext,
      });
    }
    if (effectivePercent > 60) {
      await changeTrustScore({
        userId: normalizedUserId,
        changeAmount: TRUST_RULES.VIDEO_COMPLETION_OVER_60,
        eventType: "VIDEO_COMPLETION_OVER_60",
        reason: "Completed more than 60% of a video",
        eventKey: `watch-60:${normalizedUserId}:${videoIdString}:${finalSessionId}`,
        ...eventContext,
      });
    }

    return true;
  } catch (error) {
    console.error("Error in recordWatchSession:", error);
    return null;
  }
};

const addView = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { watchedPercent } = req.body || {};

    const video = await Video.findById(videoId);
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    // Identity is server-authoritative: JWT only (optionalAuth).
    // req.body.userId is intentionally ignored (Phase 4 / F13).
    const normalizedUserId = req.user?.userId || req.user?.id;
    const guestId =
      typeof req.body?.guestId === "string"
        ? req.body.guestId.trim().slice(0, 128)
        : null;
    const percent = Math.min(100, Math.max(0, Number(watchedPercent) || 0));
    const watchedEnough = percent >= 80;
    const shouldRecordHistory = Boolean(normalizedUserId);

    let newlyCounted = false;

    if (normalizedUserId) {
      video.viewers = video.viewers || [];
      const viewerEntry = video.viewers.find(
        (v) => v.userId?.toString() === normalizedUserId.toString(),
      );

      if (viewerEntry) {
        if (percent > (viewerEntry.watchedPercent || 0)) {
          viewerEntry.watchedPercent = percent;
        }
        if (watchedEnough && !viewerEntry.counted) {
          viewerEntry.counted = true;
          viewerEntry.completedAt = new Date();
          video.views = (video.views || 0) + 1;
          newlyCounted = true;
        }
      } else {
        video.viewers.push({
          userId: normalizedUserId,
          watchedPercent: percent,
          counted: watchedEnough,
          completedAt: watchedEnough ? new Date() : undefined,
        });
        if (watchedEnough) {
          video.views = (video.views || 0) + 1;
          newlyCounted = true;
        }
      }
    } else if (guestId) {
      video.viewers = video.viewers || [];
      const viewerEntry = video.viewers.find(
        (viewer) => viewer.guestId === guestId,
      );

      if (viewerEntry) {
        if (percent > (viewerEntry.watchedPercent || 0)) {
          viewerEntry.watchedPercent = percent;
        }
        if (watchedEnough && !viewerEntry.counted) {
          viewerEntry.counted = true;
          viewerEntry.completedAt = new Date();
          video.views = (video.views || 0) + 1;
          newlyCounted = true;
        }
      } else {
        video.viewers.push({
          guestId,
          watchedPercent: percent,
          counted: watchedEnough,
          completedAt: watchedEnough ? new Date() : undefined,
        });
        if (watchedEnough) {
          video.views = (video.views || 0) + 1;
          newlyCounted = true;
        }
      }
    }

    await video.save();

    if (newlyCounted) {
      emitViewCountUpdated(video._id, video.views);
    }

    res.status(200).json({
      success: true,
      message: watchedEnough ? "View counted" : "Watch progress recorded",
      views: video.views,
      watchedPercent: percent,
      counted: newlyCounted,
      historyRecorded: shouldRecordHistory && !!normalizedUserId,
    });

    // History and trust/session bookkeeping must not delay the view response.
    const watchUserId = req.user?.userId || req.user?.id || normalizedUserId;
    setImmediate(async () => {
      try {
        if (shouldRecordHistory && normalizedUserId) {
          const user = await User.findById(normalizedUserId);
          if (user) {
            const targetId = video._id.toString();
            const history = (user.viewedVideos || []).map((id) =>
              id.toString(),
            );
            user.viewedVideos = [
              targetId,
              ...history.filter((id) => id !== targetId),
            ].slice(0, 100);
            await user.save();
          }
        }

        if (watchUserId) {
          await recordWatchSession(video, watchUserId, req.body);
        }
      } catch (error) {
        console.error("Async watch bookkeeping error:", error);
      }
    });
  } catch (error) {
    console.error("Error in addView:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const likeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const normalizedVideoId = videoId?.toString();
    const userId = req.user?.id || req.user?.userId || req.user?._id;

    // Guest users (no auth) – just increment, no toggle
    if (!userId) {
      const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { likesCount: 1 } },
        { new: true },
      );
      if (!video) {
        return res
          .status(404)
          .json({ success: false, message: "Video not found" });
      }
      return res.status(200).json({
        success: true,
        likes: video.likesCount || 0,
        dislikes: video.dislikesCount || 0,
        reaction: "like",
      });
    }

    // Authenticated user
    const [video, user] = await Promise.all([
      Video.findById(normalizedVideoId),
      User.findById(userId),
    ]);

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Ensure arrays exist
    user.likedVideos = user.likedVideos || [];
    user.dislikedVideos = user.dislikedVideos || [];

    const alreadyLiked = user.likedVideos.some(
      (id) => id.toString() === normalizedVideoId,
    );
    const alreadyDisliked = user.dislikedVideos.some(
      (id) => id.toString() === normalizedVideoId,
    );

    let reaction = null;

    if (alreadyLiked) {
      // UNLIKE
      user.likedVideos = user.likedVideos.filter(
        (id) => id.toString() !== normalizedVideoId,
      );
      video.likesCount = Math.max(0, (video.likesCount || 0) - 1);
      reaction = null;
    } else {
      // LIKE (and remove dislike if present)
      if (alreadyDisliked) {
        user.dislikedVideos = user.dislikedVideos.filter(
          (id) => id.toString() !== normalizedVideoId,
        );
        video.dislikesCount = Math.max(0, (video.dislikesCount || 0) - 1);
      }
      user.likedVideos.push(video._id);
      video.likesCount = (video.likesCount || 0) + 1;
      reaction = "like";
    }

    await Promise.all([user.save(), video.save()]);

    if (reaction === "like") {
      await createNotification({
        recipient: video.uploadedBy || video.creator,
        actor: userId,
        type: "like",
        video: video._id,
      });

      await logAuditEvent({
        userId,
        eventType: "VIDEO_LIKE",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        metadata: { videoId: normalizedVideoId },
      });
    }

    return res.status(200).json({
      success: true,
      likes: video.likesCount || 0,
      dislikes: video.dislikesCount || 0,
      reaction, // "like" | null
      liked: reaction === "like",
    });
  } catch (error) {
    console.error("Error in likeVideo:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// dislikeVideo waise hi rahega — usme already `|| []` defaults hain, koi change nahi chahiye.

const dislikeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id || req.user?.userId || req.user?._id;

    if (!userId) {
      const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { dislikesCount: 1 } },
        { new: true },
      );
      if (!video) {
        return res
          .status(404)
          .json({ success: false, message: "Video not found" });
      }
      return res.status(200).json({
        success: true,
        likes: video.likesCount || 0,
        dislikes: video.dislikesCount || 0,
        reaction: "dislike",
      });
    }

    const [video, user] = await Promise.all([
      Video.findById(videoId),
      User.findById(userId),
    ]);

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.likedVideos = user.likedVideos || [];
    user.dislikedVideos = user.dislikedVideos || [];

    const alreadyLiked = user.likedVideos.some(
      (id) => id.toString() === videoId,
    );
    const alreadyDisliked = user.dislikedVideos.some(
      (id) => id.toString() === videoId,
    );

    let reaction = null;

    if (alreadyDisliked) {
      // REMOVE DISLIKE
      user.dislikedVideos = user.dislikedVideos.filter(
        (id) => id.toString() !== videoId,
      );
      video.dislikesCount = Math.max(0, (video.dislikesCount || 0) - 1);
      reaction = null;
    } else {
      // DISLIKE (and remove like if present)
      if (alreadyLiked) {
        user.likedVideos = user.likedVideos.filter(
          (id) => id.toString() !== videoId,
        );
        video.likesCount = Math.max(0, (video.likesCount || 0) - 1);
      }
      user.dislikedVideos.push(video._id);
      video.dislikesCount = (video.dislikesCount || 0) + 1;
      reaction = "dislike";
    }

    await Promise.all([user.save(), video.save()]);

    if (reaction === "dislike") {
      await logAuditEvent({
        userId,
        eventType: "VIDEO_DISLIKE",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        metadata: { videoId },
      });
    }

    return res.status(200).json({
      success: true,
      likes: video.likesCount || 0,
      dislikes: video.dislikesCount || 0,
      reaction, // "dislike" | null
    });
  } catch (error) {
    console.error("Error in dislikeVideo:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== SUBSCRIBE / UNSUBSCRIBE ====================
const subscribeChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id || req.user?.userId || req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Login required" });
    }

    const user = await User.findById(userId);
    const channel = await Channel.findById(channelId);

    if (!user || !channel) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    user.subscribedChannels = user.subscribedChannels || [];
    channel.subscribedBy = channel.subscribedBy || [];

    const normalizedChannelId = String(channelId);
    const normalizedUserId = String(userId);
    const alreadySubscribed = user.subscribedChannels.some(
      (id) => String(id) === normalizedChannelId,
    );

    let subscribed = false;

    if (alreadySubscribed) {
      // Unsubscribe
      user.subscribedChannels = user.subscribedChannels.filter(
        (id) => String(id) !== normalizedChannelId,
      );
      channel.subscribedBy = channel.subscribedBy.filter(
        (id) => String(id) !== normalizedUserId,
      );
      subscribed = false;
    } else {
      // Subscribe
      user.subscribedChannels.push(channel._id);
      channel.subscribedBy.push(user._id);
      subscribed = true;
    }

    await user.save();
    await channel.save();

    if (subscribed) {
      await createNotification({
        recipient: channel.creator,
        actor: userId,
        type: "subscribe",
        channel: channel._id,
      });

      await logAuditEvent({
        userId,
        eventType: "CHANNEL_SUBSCRIBE",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        metadata: { channelId, channelName: channel.name },
      });
    } else {
      await logAuditEvent({
        userId,
        eventType: "CHANNEL_UNSUBSCRIBE",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        metadata: { channelId, channelName: channel.name },
      });
    }

    res.status(200).json({
      success: true,
      subscribed,
      subscribersCount: channel.subscribedBy.length,
    });
  } catch (error) {
    console.error("Error in subscribeChannel:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { commentText } = req.body;
    const userId = req.user.id;
    const commenter = await User.findById(userId).select("name avatar").lean();
    const userName = commenter?.name || "User";
    const userImage = commenter?.avatar || null;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text required",
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const newComment = {
      text: commentText.trim(),
      createdAt: new Date(),
      user: userId || null,
      userName,
      userImage,
    };

    video.comments.push(newComment);
    await video.save();

    if (userId) {
      await createNotification({
        recipient: video.uploadedBy || video.creator,
        actor: userId,
        type: "comment",
        video: video._id,
      });

      await logAuditEvent({
        userId,
        eventType: "COMMENT_ADD",
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        metadata: { videoId, commentLength: commentText.trim().length },
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment added",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error in addComment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getComments = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).select("comments");
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const comments = video.comments.map((comment) => comment.toObject());

    // Attach the commenter's name + avatar from the User collection so every
    // comment shows a real profile picture, even ones stored without one.
    const userIds = comments
      .map((comment) => comment.user)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)));

    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } })
        .select("name avatar")
        .lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));
      for (const comment of comments) {
        const user = comment.user ? userMap.get(String(comment.user)) : null;
        if (user) {
          if (!comment.userName) comment.userName = user.name || "User";
          if (!comment.userImage) comment.userImage = user.avatar || null;
        }
      }
    }

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Error in getComments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { videoId, commentId } = req.params;
    const userId = req.user.id;
    const video = await Video.findById(videoId);
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }
    const commentIndex = video.comments.findIndex(
      (comment) => comment._id.toString() === commentId,
    );
    if (commentIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }
    const commentOwner = video.comments[commentIndex].user?.toString();
    if (!commentOwner || commentOwner !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }
    video.comments.splice(commentIndex, 1);
    await video.save();

    await logAuditEvent({
      userId,
      eventType: "COMMENT_DELETE",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: { videoId, commentId },
    });

    res.status(200).json({ success: true, message: "Comment deleted!" });
  } catch (error) {
    console.error("Error in deleteComment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getVideoInteraction = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).lean();

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    return res.status(200).json({
      success: true,
      liked: false, // user identify nahi ho raha
      disliked: false, // user identify nahi ho raha
      likes: video.likes?.length || 0,
      dislikes: video.dislikes?.length || 0,
    });
  } catch (error) {
    console.error("Error in getVideoInteraction:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// const subscribeChannel = async (req, res) => {
//   try {
//     const { channelId } = req.params;
//     const userId = req.user.id;

//     const channel = await Channel.findById(channelId);
//     if (!channel) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Channel not found" });
//     }

//     // Agar already subscribed hai to unsubscribe kar do (toggle)
//     const isSubscribed = channel.subscribedBy.includes(userId);

//     if (isSubscribed) {
//       // Unsubscribe
//       await Channel.findByIdAndUpdate(channelId, {
//         $pull: { subscribedBy: userId },
//         $inc: { subscribers: -1 },
//       });

//       await User.findByIdAndUpdate(userId, {
//         $pull: { subscribedChannels: channelId },
//       });

//       return res.json({
//         success: true,
//         message: "Unsubscribed successfully",
//         subscribed: false,
//       });
//     } else {
//       // Subscribe
//       await Channel.findByIdAndUpdate(channelId, {
//         $addToSet: { subscribedBy: userId },
//         $inc: { subscribers: 1 },
//       });

//       await User.findByIdAndUpdate(userId, {
//         $addToSet: { subscribedChannels: channelId },
//       });

//       return res.json({
//         success: true,
//         message: "Subscribed successfully",
//         subscribed: true,
//       });
//     }
//   } catch (error) {
//     console.error("Subscribe error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const getSubscribedVideos = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select("subscribedChannels");
    const subscribedChannels = user?.subscribedChannels || [];

    const channelDocs = await Channel.find({ subscribedBy: userId }).select(
      "_id",
    );
    const channelIds = [
      ...new Set([
        ...subscribedChannels.map((id) => id.toString()),
        ...channelDocs.map((channel) => channel._id.toString()),
      ]),
    ];

    const channelObjectIds = channelIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const filter = { channel: { $in: channelObjectIds } };
    const category = getCategoryFilter(req);
    if (category) filter.category = category;
    const { page, limit, skip } = getPagination(req);

    const total = await Video.countDocuments(filter);

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name avatar", model: User });

    res.status(200).json({
      success: true,
      videos,
      count: videos.length,
      total,
      page,
      limit,
      subscribedChannelIds: channelIds,
    });
  } catch (error) {
    console.error("Error in getSubscribedVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const HistoricalVideos = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select("viewedVideos");
    const viewedVideoIds = user?.viewedVideos || [];

    if (viewedVideoIds.length === 0) {
      return res.status(200).json({
        success: true,
        videos: [],
      });
    }

    // Fetch all videos that the user has viewed
    const videos = await Video.find({
      _id: { $in: viewedVideoIds },
    })
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name email", model: User });

    // Preserve the order of viewedVideos (most recent watched first)
    // Assuming newer watches are pushed to the end of the array
    const videoMap = new Map(videos.map((v) => [v._id.toString(), v]));

    const orderedVideos = viewedVideoIds
      .slice()
      .reverse()
      .map((id) => videoMap.get(id.toString()))
      .filter(Boolean);

    res.status(200).json({
      success: true,
      videos: orderedVideos,
    });
  } catch (error) {
    console.error("Error in HistoricalVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const LikedVideos = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { page, limit, skip } = getPagination(req);

    const user = await User.findById(userId).select("likedVideos");
    const likedVideoIds = user?.likedVideos || [];

    if (likedVideoIds.length === 0) {
      return res.status(200).json({
        success: true,
        videos: [],
        total: 0,
        page,
        limit,
      });
    }

    const reversedIds = likedVideoIds.slice().reverse();
    const pagedIds = reversedIds.slice(skip, skip + limit);
    const total = reversedIds.length;

    const videos = await Video.find({
      _id: { $in: pagedIds },
      status: "active",
    })
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name email", model: User });

    const videoMap = new Map(videos.map((v) => [v._id.toString(), v]));

    const orderedVideos = pagedIds
      .map((id) => videoMap.get(id.toString()))
      .filter(Boolean);

    res.status(200).json({
      success: true,
      videos: orderedVideos,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in LikedVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const WatchLaterVideos = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select("watchLater");
    const watchLaterIds = user?.watchLater || [];

    if (watchLaterIds.length === 0) {
      return res.status(200).json({
        success: true,
        videos: [],
      });
    }

    // Fetch all watch later videos
    const videos = await Video.find({
      _id: { $in: watchLaterIds },
    })
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name email", model: User });

    // Preserve the order of watchLater (most recently added first)
    const videoMap = new Map(videos.map((v) => [v._id.toString(), v]));

    const orderedVideos = watchLaterIds
      .slice()
      .reverse()
      .map((id) => videoMap.get(id.toString()))
      .filter(Boolean);

    res.status(200).json({
      success: true,
      videos: orderedVideos,
    });
  } catch (error) {
    console.error("Error in WatchLaterVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Remove a video from Watch Later
const RemoveFromWatchLater = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    const { videoId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required",
      });
    }

    const result = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { watchLaterVideos: videoId, watchLater: videoId },
      },
      { new: true },
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logAuditEvent({
      userId,
      eventType: "WATCH_LATER_REMOVE",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: { videoId },
    });

    res.status(200).json({
      success: true,
      message: "Video removed from Watch Later",
      removed: true,
      watchLaterCount: (result.watchLaterVideos || []).length,
    });
  } catch (error) {
    console.error("Error in RemoveFromWatchLater:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const addToWatchLater = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    const { videoId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, message: "Video ID required" });
    }

    const result = await User.findOneAndUpdate(
      { _id: userId, watchLaterVideos: { $ne: videoId } },
      {
        $addToSet: { watchLaterVideos: videoId, watchLater: videoId },
      },
      { new: true },
    );

    if (!result) {
      const user = await User.findById(userId).select("_id");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({
        success: true,
        message: "Already in Watch Later",
        added: false,
      });
    }

    await logAuditEvent({
      userId,
      eventType: "WATCH_LATER_ADD",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: { videoId },
    });

    return res.status(200).json({
      success: true,
      message: "Added to Watch Later",
      added: true,
    });
  } catch (error) {
    console.error("Error in addToWatchLater:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const GENERIC_SEARCH_WORDS = new Set([
  "video",
  "videos",
  "short",
  "shorts",
  "watch",
  "watching",
  "latest",
  "new",
  "trending",
  "viral",
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "with",
  "in",
  "on",
  "to",
  "of",
  "how",
  "what",
  "why",
]);

const buildSearchTokenPattern = (token) => {
  if (token.length > 3 && token.endsWith("s")) {
    return escapeRegex(token.slice(0, -1)) + "s?";
  }
  return escapeRegex(token);
};

const searchVideos = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const { page, limit, skip } = getPagination(req);

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const normalized = q.replace(/\s+/g, " ").toLowerCase();

    let tokens = normalized.split(" ").filter(Boolean);
    const meaningfulTokens = tokens.filter((t) => !GENERIC_SEARCH_WORDS.has(t));
    if (meaningfulTokens.length) tokens = meaningfulTokens;

    const tokensWithRegex = tokens.map((token) => ({
      token,
      regex: new RegExp(buildSearchTokenPattern(token), "i"),
    }));

    const [categoryDocs, channelDocs] = await Promise.all([
      categoryModel
        .find({ name: { $in: tokensWithRegex.map((t) => t.regex) } })
        .select("_id name")
        .lean(),
      Channel.find({ name: { $in: tokensWithRegex.map((t) => t.regex) } })
        .select("_id name")
        .lean(),
    ]);

    const orConditions = [];
    const scoreExpressions = [
      {
        $cond: [
          { $eq: [{ $ifNull: [{ $toLower: "$title" }, ""] }, normalized] },
          100,
          0,
        ],
      },
    ];

    for (const { token, regex } of tokensWithRegex) {
      const regexStr = buildSearchTokenPattern(token);
      orConditions.push({ title: regex }, { description: regex });

      scoreExpressions.push({
        $cond: [
          {
            $regexMatch: {
              input: { $ifNull: [{ $toLower: "$title" }, ""] },
              regex: regexStr,
              options: "i",
            },
          },
          10,
          0,
        ],
      });
      scoreExpressions.push({
        $cond: [
          {
            $regexMatch: {
              input: { $ifNull: [{ $toLower: "$description" }, ""] },
              regex: regexStr,
              options: "i",
            },
          },
          4,
          0,
        ],
      });

      const catIds = categoryDocs
        .filter((c) => regex.test(c.name))
        .map((c) => c._id);
      if (catIds.length) {
        orConditions.push({ category: { $in: catIds } });
        scoreExpressions.push({
          $cond: [{ $in: ["$category", catIds] }, 3, 0],
        });
      }

      const chIds = channelDocs
        .filter((c) => regex.test(c.name))
        .map((c) => c._id);
      if (chIds.length) {
        orConditions.push({ channel: { $in: chIds } });
        scoreExpressions.push({ $cond: [{ $in: ["$channel", chIds] }, 2, 0] });
      }
    }

    const filter = { $or: orConditions };

    const [videos, total] = await Promise.all([
      Video.aggregate([
        { $match: filter },
        { $addFields: { _score: { $add: scoreExpressions } } },
        { $sort: { _score: -1, views: -1, createdAt: -1 } },
        {
          $lookup: {
            from: Channel.collection.name,
            let: { chId: "$channel" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$chId"] } } },
              { $project: { name: 1, channelImage: 1 } },
            ],
            as: "channel",
          },
        },
        { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },
        // NOTE: User lives in auth-service's database now, so it can't be
        // joined here with $lookup (Mongo $lookup only works within a
        // single database). We fetch uploader info separately below and
        // merge it in application code instead.
        { $project: { _score: 0 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      Video.countDocuments(filter),
    ]);

    const uploaderIds = videos.map((v) => v.uploadedBy).filter(Boolean);
    const uploaders = await User.find({ _id: { $in: uploaderIds } })
      .select("name avatar")
      .lean();
    const uploaderMap = new Map(uploaders.map((u) => [String(u._id), u]));
    const videosWithUploader = videos.map((v) => ({
      ...v,
      uploadedBy: uploaderMap.get(String(v.uploadedBy)) || null,
    }));

    const channelFilter = {
      $or: tokensWithRegex.map(({ regex }) => ({
        $or: [{ name: regex }, { channeldescription: regex }],
      })),
    };

    const channels = await Channel.find(channelFilter)
      .sort({ createdAt: -1 })
      .select("_id name channelImage subscribedBy createdAt")
      .limit(8)
      .lean();

    res.status(200).json({
      success: true,
      videos: videosWithUploader,
      channels: channels.map((channel) => ({
        _id: channel._id,
        id: channel._id,
        name: channel.name,
        channelImage: channel.channelImage,
        subscribersCount: channel.subscribedBy?.length || 0,
        createdAt: channel.createdAt,
      })),
      page,
      limit,
      total: total + channels.length,
      query: q,
    });
  } catch (error) {
    console.error("Error in searchVideos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getSearchHints = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q || q.length < 1) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    // Videos titles se hints
    const videoHints = await Video.find({ title: regex })
      .select("title")
      .limit(6)
      .lean();

    // Channels se hints
    const channelHints = await Channel.find({
      $or: [{ name: regex }, { handle: regex }],
    })
      .select("name handle")
      .limit(4)
      .lean();

    const hints = [
      ...videoHints.map((v) => ({
        type: "video",
        text: v.title,
      })),
      ...channelHints.map((c) => ({
        type: "channel",
        text: c.name || c.handle,
      })),
    ];

    // unique + limit
    const unique = [];
    const seen = new Set();
    for (const h of hints) {
      const key = h.text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(h);
      }
      if (unique.length >= 8) break;
    }

    res.status(200).json({
      success: true,
      data: unique,
    });
  } catch (err) {
    console.error("Search hints error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hints",
    });
  }
};

const getCreativeCornerHashtagStats = async (req, res) => {
  try {
    const threshold = parseInt(process.env.HASHTAG_THRESHOLD, 10) || 50;
    const days = parseInt(process.env.HASHTAG_DAYS, 10) || 15;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const stats = await HashtagStats.find({}).sort({ videoCount: -1 }).lean();

    const data = await Promise.all(
      stats.map(async (stat) => {
        const filter = {
          hashtags: stat.hashtag,
          isCreativeCorner: true,
        };
        const [totalVideos, recentVideos] = await Promise.all([
          Video.countDocuments(filter),
          Video.countDocuments({ ...filter, createdAt: { $gte: cutoffDate } }),
        ]);

        return {
          ...stat,
          videoCount: totalVideos,
          last15DaysCount: recentVideos,
          threshold,
          days,
          remaining: Math.max(0, threshold - recentVideos),
          isFlagged: stat.isFlagged || recentVideos >= threshold,
        };
      }),
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error("Creative Corner hashtag stats error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  addView,
  likeVideo,
  dislikeVideo,
  addComment,
  getComments,
  deleteComment,
  getVideoInteraction,
  createChannel,
  getChannels,
  getSubscribedChannels,
  getChannelById,
  getUserWatchHistory,
  saveToWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
  getUserLikedVideos,
  getUserWatchLaterVideos,
  getUserUploadedVideos,
  getvideosByChannel,
  deleteChannel,
  uploadVideo,
  recommendedVideos,
  getRelatedVideos,
  trendingVideos,
  LatestVideos,
  trendingShorts,
  topShorts,
  subscribeChannel,
  getSubscribedVideos,
  HistoricalVideos,
  LikedVideos,
  WatchLaterVideos,
  RemoveFromWatchLater,
  addToWatchLater,
  searchVideos,
  getSearchHints,
  getCreativeCornerHashtagStats,
};

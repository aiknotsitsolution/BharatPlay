const Video = require("../models/Videomodel");
const User = require("../models/usermodel");
const Channel = require("../models/Channel/ChannelModel");
const categoryModel = require("../models/CategoryModel/category.model");
const mongoose = require("mongoose");
const {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getVideoDuration } = require("../utils/mediaDuration");
const {
  getB2Client,
  getB2Config,
  getB2SourceClient,
  getPublicUrl,
  getVideoSourceBucket,
} = require("../utils/b2Storage");
const { getQueue } = require("../../../services/Queues");
const { resolveCategory } = require("./userVideoController");
const {
  cacheVideoCatalog,
  invalidateVideoCatalogCache,
  VIDEO_CATALOG_CACHE_TTL_SECONDS,
} = require("../utils/videoCatalogCache");
const { invalidateCache } = require("../../../services/caching");
const fs = require("fs");
const path = require("node:path");

const getUploadUserId = (req) =>
  req.user?.id || req.user?.userId || req.user?._id;

async function uploadVideoSource(file, userId, videoId, revision = 1) {
  const config = getB2Config();
  const bucket = config.sourceBucket || config.bucket;
  const extension = path.extname(file.originalname).toLowerCase();
  if (![".mp4", ".mov", ".m4v", ".webm"].includes(extension)) {
    const error = new Error("Use an MP4, MOV, M4V, or WebM video.");
    error.status = 400;
    throw error;
  }
  const sourceKey = `Video/${userId}/${videoId}/source${
    revision > 1 ? `-v${revision}` : ""
  }${extension}`;

  await getB2SourceClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
      Body: fs.createReadStream(file.path),
      ContentLength: file.size,
      ContentType: file.mimetype,
      CacheControl:
        bucket === config.bucket
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
    }),
  );
  return { sourceKey, sourceBucket: bucket };
}

const isValidDurationForType = (type, duration) =>
  Number.isFinite(duration) &&
  duration > 0 &&
  (type === "short"
    ? duration <= 60
    : duration >= 60 && duration <= 300);

/**
 * ✏️ Update Video
 */
exports.updateVideoupdated = async (req, res) => {
  let stagedSource;
  let sourcePersisted = false;
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      videoType,
      duration,
      category,
      subCategory,
      hashtags,
      isCreativeCorner,
      channelId,
      thumbnailKey,
      thumbnailContentType,
      thumbnailSize,
    } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const userId = req.user?.id || req.user?.userId || req.user?._id;
    const ownerId = video.uploadedBy || video.creator;
    if (ownerId?.toString() !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this video",
      });
    }

    if (title !== undefined) {
      if (!String(title).trim() || String(title).trim().length > 150) {
        return res.status(400).json({
          success: false,
          message: "A video title of 1–150 characters is required.",
        });
      }
      video.title = String(title).trim();
    }
    if (description !== undefined) video.description = description;
    const nextType = type ?? videoType;
    if (nextType !== undefined) {
      if (!["short", "long"].includes(nextType)) {
        return res.status(400).json({
          success: false,
          message: "Video type must be short or long.",
        });
      }
      const currentType = Array.isArray(video.videoType)
        ? video.videoType[0]
        : video.videoType;
      if (nextType !== currentType) {
        const nextDuration =
          duration === undefined ? Number(video.duration) : Number(duration);
        if (
          (nextType === "short" && nextDuration > 60) ||
          (nextType === "long" &&
            (nextDuration < 60 || nextDuration > 300))
        ) {
          return res.status(400).json({
            success: false,
            message:
              nextType === "short"
                ? "Short videos must be 60 seconds or shorter."
                : "Long videos must be between 60 and 300 seconds.",
          });
        }
      }
      video.videoType = [nextType];
    }
    if (duration !== undefined && Number(duration) > 0) {
      video.duration = Number(duration);
    }

    let categoryData;
    if (category !== undefined) {
      categoryData = await resolveCategory(category);
      if (!categoryData) {
        return res.status(400).json({
          success: false,
          message: "Category not found.",
        });
      }
      video.category = categoryData._id;
    }

    const requestedCreativeCorner =
      isCreativeCorner === undefined
        ? Boolean(video.isCreativeCorner)
        : isCreativeCorner === true || isCreativeCorner === "true";
    const creativeCorner = Boolean(
      categoryData?.isCreativeCorner || requestedCreativeCorner,
    );
    if (
      creativeCorner &&
      categoryData &&
      !categoryData.isCreativeCorner
    ) {
      return res.status(400).json({
        success: false,
        message: "Creative Corner videos must use the Creative Corner category.",
      });
    }
    const normalizedHashtags =
      hashtags === undefined
        ? video.hashtags || []
        : [
        ...new Set(
          (Array.isArray(hashtags) ? hashtags : [hashtags])
            .flatMap((value) => String(value || "").split(/[\s,]+/))
            .map((value) => value.replace(/^#+/, "").trim().toLowerCase())
            .filter(Boolean),
        ),
      ];
    if (creativeCorner && normalizedHashtags.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one hashtag is required for Creative Corner videos.",
      });
    }
    if (hashtags !== undefined) {
      video.hashtags = normalizedHashtags;
    }
    video.isCreativeCorner = creativeCorner;

    if (subCategory) video.subCategory = subCategory; // ✅ update subCategory

    let destinationChannel;
    if (channelId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(String(channelId))) {
        return res.status(400).json({
          success: false,
          message: "Invalid channel.",
        });
      }
      destinationChannel = await Channel.findById(channelId).select("creator");
      if (!destinationChannel) {
        return res.status(404).json({
          success: false,
          message: "Channel not found.",
        });
      }
      if (String(destinationChannel.creator) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: "You cannot move this video to that channel.",
        });
      }
    }

    if (thumbnailKey !== undefined) {
      const expectedPrefix = `Video/${userId}/${id}/thumbnail/`;
      if (
        typeof thumbnailKey !== "string" ||
        !thumbnailKey.startsWith(expectedPrefix) ||
        !["image/jpeg", "image/png", "image/webp"].includes(
          thumbnailContentType,
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid thumbnail upload.",
        });
      }
      const { bucket } = getB2Config();
      const thumbnailObject = await getB2Client().send(
        new HeadObjectCommand({ Bucket: bucket, Key: thumbnailKey }),
      );
      if (
        !Number.isSafeInteger(Number(thumbnailSize)) ||
        Number(thumbnailSize) <= 0 ||
        Number(thumbnailSize) > 10 * 1024 * 1024 ||
        Number(thumbnailObject.ContentLength) !== Number(thumbnailSize)
      ) {
        return res.status(400).json({
          success: false,
          message: "Uploaded thumbnail size is invalid.",
        });
      }
      video.thumbnailKey = thumbnailKey;
      video.thumbnailContentType = thumbnailContentType;
      video.thumbnail = getPublicUrl(thumbnailKey);
    }

    if (req.file) {
      if (!process.env.REDIS_URL?.trim()) {
        return res.status(503).json({
          success: false,
          message: "Video processing is temporarily unavailable.",
        });
      }
      const actualDuration = await getVideoDuration(req.file.path);
      const nextVideoType = video.videoType?.[0] || "long";
      if (!isValidDurationForType(nextVideoType, actualDuration)) {
        return res.status(400).json({
          success: false,
          message:
            nextVideoType === "short"
              ? "Short videos must be 60 seconds or shorter."
              : "Long videos must be between 60 and 300 seconds.",
        });
      }

      const revision = (Number(video.mediaRevision) || 1) + 1;
      stagedSource = await uploadVideoSource(
        req.file,
        userId,
        video._id,
        revision,
      );
      video.sourceKey = stagedSource.sourceKey;
      video.sourceBucket = stagedSource.sourceBucket;
      video.sourceSize = req.file.size;
      video.sourceContentType = req.file.mimetype;
      video.sourceFileName = path.basename(req.file.originalname).slice(0, 255);
      video.videoUrl = getPublicUrl(stagedSource.sourceKey);
      video.duration = actualDuration;
      video.mediaRevision = revision;
      video.thumbnailKey = null;
      video.thumbnailContentType = null;
      video.thumbnail = null;
      video.processingStatus = "queued";
      video.processingError = null;
      video.status = "disabled";
    }

    const previousChannelId = String(video.channel || "");
    if (destinationChannel) video.channel = destinationChannel._id;

    await video.save();
    sourcePersisted = Boolean(stagedSource);
    if (stagedSource) {
      try {
        await getQueue("video-processing").add(
          "process-video",
          { videoId: String(video._id) },
          { jobId: `${video._id}-revision-${video.mediaRevision}` },
        );
      } catch (queueError) {
        video.processingStatus = "failed";
        video.processingError = "Video processing could not be queued.";
        await video.save();
        throw queueError;
      }
    }
    await Promise.all([
      invalidateVideoCatalogCache(),
      previousChannelId
        ? invalidateCache(`channel-videos:${previousChannelId}`)
        : Promise.resolve(),
      video.channel
        ? invalidateCache(`channel-videos:${video.channel}`)
        : Promise.resolve(),
    ]);

    if (
      destinationChannel &&
      previousChannelId !== String(destinationChannel._id)
    ) {
      await Promise.all([
        Channel.updateOne(
          { _id: previousChannelId },
          { $pull: { videos: video._id } },
        ),
        Channel.updateOne(
          { _id: destinationChannel._id },
          { $addToSet: { videos: video._id } },
        ),
      ]);
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fullVideoUrl = video.videoUrl?.startsWith("http")
      ? video.videoUrl
      : `${baseUrl}/${video.videoUrl}`;

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      video: {
        ...video.toObject(),
        videoUrl: fullVideoUrl,
      },
    });
  } catch (error) {
    console.error("Update error:", error);
    if (stagedSource && !sourcePersisted) {
      try {
        const config = getB2Config();
        await getB2SourceClient().send(
          new DeleteObjectCommand({
            Bucket: getVideoSourceBucket(
              { sourceBucket: stagedSource.sourceBucket },
              config,
            ),
            Key: stagedSource.sourceKey,
          }),
        );
      } catch (cleanupError) {
        console.error("[video-update] Failed to remove staged B2 source:", cleanupError);
      }
    }
    res.status(500).json({
      success: false,
      message: "Server error during update",
      error: error.message,
    });
  } finally {
    if (req.file?.path) {
      await fs.promises.rm(req.file.path, { force: true }).catch((cleanupError) => {
        console.error("[video-update] Failed to remove staged file:", cleanupError);
      });
    }
  }
};

exports.createVideoThumbnailUploadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video.",
      });
    }

    const video = await Video.findOne({
      _id: id,
      $or: [{ uploadedBy: userId }, { creator: userId }],
    });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found or not authorized.",
      });
    }

    const { contentType, fileSize } = req.body || {};
    const extensionByType = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const size = Number(fileSize);
    if (
      !extensionByType[contentType] ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > 10 * 1024 * 1024
    ) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail must be a JPEG, PNG, or WebP under 10 MB.",
      });
    }

    const config = getB2Config();
    const key = `Video/${userId}/${id}/thumbnail/${new mongoose.Types.ObjectId()}${extensionByType[contentType]}`;
    const uploadUrl = await getSignedUrl(
      getB2Client(),
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: 900 },
    );

    return res.status(200).json({
      success: true,
      uploadUrl,
      key,
      contentType,
      fileSize: size,
    });
  } catch (error) {
    console.error("Create thumbnail upload URL error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not prepare the thumbnail upload.",
    });
  }
};

exports.uploadVideo = async (req, res) => {
  let stagedSource;
  let sourcePersisted = false;
  let video;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }
    if (!process.env.REDIS_URL?.trim()) {
      return res.status(503).json({
        success: false,
        message: "Video processing is temporarily unavailable.",
      });
    }

    const {
      title,
      description,
      type,
      category,
    } = req.body;
    if (!String(title || "").trim() || String(title).trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "A video title of 1–150 characters is required.",
      });
    }

    const normalizedType =
      type === "short" || type === "long" ? type : "long";
    const userId = getUploadUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }
    const finalDuration = await getVideoDuration(req.file.path);
    if (!isValidDurationForType(normalizedType, finalDuration)) {
      return res.status(400).json({
        success: false,
        message:
          normalizedType === "short"
            ? "Short videos must be 60 seconds or shorter."
            : "Long videos must be between 60 and 300 seconds.",
      });
    }

    let categoryId;
    if (category) {
      const categoryData = await resolveCategory(category);
      if (!categoryData) {
        return res.status(400).json({
          success: false,
          message: "Category not found.",
        });
      }
      categoryId = categoryData._id;
    }

    const videoId = new mongoose.Types.ObjectId();
    stagedSource = await uploadVideoSource(req.file, userId, videoId);
    const videoType = [normalizedType];
    video = await Video.create({
      _id: videoId,
      title: String(title).trim(),
      description: description || "",
      videoType,
      duration: finalDuration,
      category: categoryId,
      creator: userId,
      uploadedBy: userId,
      videoUrl: getPublicUrl(stagedSource.sourceKey),
      sourceKey: stagedSource.sourceKey,
      sourceBucket: stagedSource.sourceBucket,
      sourceSize: req.file.size,
      sourceContentType: req.file.mimetype,
      sourceFileName: path.basename(req.file.originalname).slice(0, 255),
      status: "disabled",
      processingStatus: "queued",
    });
    sourcePersisted = true;
    await getQueue("video-processing").add(
      "process-video",
      { videoId: String(video._id) },
      { jobId: String(video._id) },
    );
    try {
      await invalidateVideoCatalogCache();
    } catch (cacheError) {
      console.error("[video-upload] Failed to invalidate video cache:", cacheError);
    }

    res.status(202).json({
      success: true,
      message: "Video uploaded to Backblaze B2. Processing has started.",
      processingStatus: "queued",
      video: {
        ...video.toObject(),
        videoUrl: getPublicUrl(stagedSource.sourceKey),
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (video && !sourcePersisted) {
      await Video.deleteOne({ _id: video._id }).catch((cleanupError) => {
        console.error("[video-upload] Failed to remove incomplete video record:", cleanupError);
      });
    }
    if (video && sourcePersisted) {
      video.processingStatus = "failed";
      video.processingError = "Video processing could not be queued.";
      await video.save().catch((saveError) => {
        console.error("[video-upload] Failed to record queue error:", saveError);
      });
    }
    if (stagedSource && !sourcePersisted) {
      try {
        const config = getB2Config();
        await getB2SourceClient().send(
          new DeleteObjectCommand({
            Bucket: getVideoSourceBucket(
              { sourceBucket: stagedSource.sourceBucket },
              config,
            ),
            Key: stagedSource.sourceKey,
          }),
        );
      } catch (cleanupError) {
        console.error("[video-upload] Failed to remove staged B2 source:", cleanupError);
      }
    }
    res.status(error?.status || 500).json({
      success: false,
      message:
        error?.message || "Video upload could not be completed.",
    });
  } finally {
    if (req.file?.path) {
      await fs.promises.rm(req.file.path, { force: true }).catch((cleanupError) => {
        console.error("[video-upload] Failed to remove staged file:", cleanupError);
      });
    }
  }
};

exports.getAllVideos = async (req, res) => {
  try {
    // Optional videoType filter: ?videoType=short | ?videoType=long
    // No query param preserves the previous behaviour (all videos).
    const filter = {};
    if (
      req.query.videoType &&
      ["short", "long"].includes(req.query.videoType)
    ) {
      filter.videoType = req.query.videoType;
    }

    const updatedVideos = await cacheVideoCatalog(
      "admin-video-list",
      { videoType: req.query.videoType || "all" },
      VIDEO_CATALOG_CACHE_TTL_SECONDS,
      async () => {
        const videos = await Video.find(filter).sort({ createdAt: -1 }).lean();
        const getIds = (field) => [
          ...new Set(
            videos.map((video) => video[field]?.toString()).filter(Boolean),
          ),
        ];
        const [uploaders, channels, categories] = await Promise.all([
          User.find({ _id: { $in: getIds("uploadedBy") } })
            .select("name email")
            .lean(),
          Channel.find({ _id: { $in: getIds("channel") } })
            .select("name handle")
            .lean(),
          categoryModel
            .find({ _id: { $in: getIds("category") } })
            .select("name")
            .lean(),
        ]);
        const uploadersById = new Map(
          uploaders.map((uploader) => [String(uploader._id), uploader]),
        );
        const channelsById = new Map(
          channels.map((channel) => [String(channel._id), channel]),
        );
        const categoriesById = new Map(
          categories.map((category) => [String(category._id), category]),
        );
        const baseUrl = `${req.protocol}://${req.get("host")}`;

        return videos.map((video) => ({
          ...video,
          uploadedBy: uploadersById.get(String(video.uploadedBy)) || null,
          channel: channelsById.get(String(video.channel)) || null,
          category: categoriesById.get(String(video.category)) || null,
          videoUrl: video.videoUrl?.startsWith("http")
            ? video.videoUrl
            : `${baseUrl}/${video.videoUrl}`,
        }));
      },
    );

    res.status(200).json({
      success: true,
      count: updatedVideos.length,
      videos: updatedVideos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching videos",
      error: error.message, // optional: only in development
    });
  }
};

exports.editMyVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { title, description, type, duration, category, subCategory } =
      req.body;

    const video = await Video.findOne({
      _id: id,
      $or: [{ uploadedBy: userId }, { creator: userId }],
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found or not authorized",
      });
    }

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (type) video.type = type;
    if (duration) video.duration = Number(duration);
    if (category) video.category = category;
    if (subCategory) video.subCategory = subCategory;

    // 🎥 If new video uploaded
    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      video.videoUrl = filePath;
    }

    await video.save();
    await invalidateVideoCatalogCache();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      video: {
        ...video.toObject(),
        videoUrl: `${baseUrl}/${video.videoUrl}`,
      },
    });
  } catch (error) {
    console.error("Edit my video error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteMyVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await Video.findOne({
      _id: id,
      $or: [{ uploadedBy: userId }, { creator: userId }],
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found or not authorized",
      });
    }

    // 🗑️ Delete video file from server
    if (video.videoUrl && fs.existsSync(video.videoUrl)) {
      fs.unlinkSync(video.videoUrl);
    }

    await video.deleteOne();
    await invalidateVideoCatalogCache();

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete my video error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyVideos = async (req, res) => {
  try {
    const userId = req.user.id;

    const videos = await cacheVideoCatalog(
      "my-videos",
      { userId },
      60,
      () =>
        Video.find({
          $or: [{ uploadedBy: userId }, { creator: userId }],
        })
          .populate({ path: "category", select: "name", model: categoryModel })
          .populate({ path: "subCategory", select: "name", model: categoryModel })
          .sort({ createdAt: -1 })
          .lean(),
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const updatedVideos = videos.map((video) => {
      const videoObj =
        typeof video.toObject === "function" ? video.toObject() : video;
      return {
        ...videoObj,
        videoUrl: videoObj.videoUrl?.startsWith("http")
          ? videoObj.videoUrl
          : `${baseUrl}/${videoObj.videoUrl}`,
      };
    });

    res.status(200).json({
      success: true,
      count: updatedVideos.length,
      videos: updatedVideos,
    });
  } catch (error) {
    console.error("Get my videos error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 📄 Get Single Video by ID
 */
exports.getSingleVideo = async (req, res) => {
  try {
    const video = await cacheVideoCatalog(
      "video-detail",
      { videoId: req.params.id },
      VIDEO_CATALOG_CACHE_TTL_SECONDS,
      () => Video.findById(req.params.id).lean(),
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 🗑️ Delete Video
 */
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (
      !req.admin &&
      video.uploadedBy?.toString() !== String(req.user?.id || req.user?._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this video",
      });
    }

    await video.deleteOne();
    await invalidateVideoCatalogCache();

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

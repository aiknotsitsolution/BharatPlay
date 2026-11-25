const path = require("node:path");
const mongoose = require("mongoose");
const {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const { getQueue } = require("../../../services/Queues");
const { getB2Client, getB2Config, getPublicUrl } = require("../utils/b2Storage");
const { resolveCategory } = require("./userVideoController");

const MiB = 1024 * 1024;
const DEFAULT_PART_SIZE = 16 * MiB;
const MAX_FILE_SIZE = Number(process.env.MAX_VIDEO_UPLOAD_BYTES) || 10 * 1024 ** 3;
const MAX_PARTS = 10000;
const SUPPORTED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

const getUserId = (req) => req.user?.id || req.user?.userId || req.user?._id;

const sendError = (res, error, status = 500) => {
  console.error("[multipart-video-upload]", error);
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Video upload could not be completed." : error,
  });
};

async function findOwnedUpload(req) {
  if (!mongoose.Types.ObjectId.isValid(req.params.videoId)) return null;
  return Video.findOne({
    _id: req.params.videoId,
    channel: req.params.channelId,
    uploadedBy: getUserId(req),
    processingStatus: "uploading",
  }).select("+b2UploadId");
}

function getPartSize(fileSize) {
  return Math.max(
    DEFAULT_PART_SIZE,
    Math.ceil(fileSize / MAX_PARTS / MiB) * MiB,
  );
}

async function listAllParts(video) {
  const { bucket } = getB2Config();
  const parts = [];
  let partNumberMarker;

  do {
    const result = await getB2Client().send(
      new ListPartsCommand({
        Bucket: bucket,
        Key: video.sourceKey,
        UploadId: video.b2UploadId,
        PartNumberMarker: partNumberMarker,
      }),
    );
    parts.push(...(result.Parts || []));
    partNumberMarker = result.IsTruncated ? result.NextPartNumberMarker : undefined;
  } while (partNumberMarker);

  return parts;
}

async function initiateMultipartUpload(req, res) {
  let createdUploadId;
  let createdObjectKey;
  let createdVideoId;
  try {
    if (!process.env.REDIS_URL?.trim()) {
      return sendError(res, "Video processing is temporarily unavailable.", 503);
    }

    const userId = getUserId(req);
    const { channelId } = req.params;
    const {
      name,
      description = "",
      category,
      videoType,
      duration,
      hashtags = "",
      isCreativeCorner = false,
      fileName,
      contentType,
      fileSize,
      thumbnailName,
      thumbnailContentType,
      thumbnailSize,
    } = req.body || {};
    const size = Number(fileSize);
    const declaredDuration = Number(duration);

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return sendError(res, "Invalid channel.", 400);
    }
    if (!name?.trim() || name.trim().length > 150) {
      return sendError(res, "A video title of 1–150 characters is required.", 400);
    }
    if (!SUPPORTED_VIDEO_TYPES.has(contentType)) {
      return sendError(res, "Use an MP4, MOV, M4V, or WebM video.", 400);
    }
    if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_FILE_SIZE) {
      return sendError(res, "Video file size is not supported.", 400);
    }
    if (!Number.isFinite(declaredDuration) || declaredDuration <= 0) {
      return sendError(res, "A valid video duration is required.", 400);
    }
    if (!["short", "long"].includes(videoType)) {
      return sendError(res, "Video type must be short or long.", 400);
    }

    const channel = await Channel.findById(channelId).select("creator");
    if (!channel) return sendError(res, "Channel not found.", 404);
    if (String(channel.creator) !== String(userId)) {
      return sendError(res, "You cannot upload to this channel.", 403);
    }

    const categoryData = await resolveCategory(category);
    if (!categoryData) return sendError(res, "Category not found.", 400);

    const creativeCorner =
      isCreativeCorner === true || isCreativeCorner === "true";
    if (creativeCorner && !categoryData.isCreativeCorner) {
      return sendError(
        res,
        "Creative Corner videos must use the Creative Corner category.",
        400,
      );
    }
    const normalizedHashtags = [
      ...new Set(
        (Array.isArray(hashtags) ? hashtags : [hashtags])
          .flatMap((value) => String(value || "").split(/[\s,]+/))
          .map((value) => value.replace(/^#+/, "").trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    if (creativeCorner && normalizedHashtags.length === 0) {
      return sendError(
        res,
        "At least one hashtag is required for Creative Corner videos.",
        400,
      );
    }

    const ext = path.extname(String(fileName || "")).toLowerCase();
    const allowedExtensions = new Set([".mp4", ".mov", ".m4v", ".webm"]);
    if (!allowedExtensions.has(ext)) {
      return sendError(res, "Video file extension is not supported.", 400);
    }

    let normalizedThumbnailName;
    if (thumbnailName) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(
          thumbnailContentType,
        ) ||
        !Number.isSafeInteger(Number(thumbnailSize)) ||
        Number(thumbnailSize) <= 0 ||
        Number(thumbnailSize) > 10 * MiB
      ) {
        return sendError(res, "Thumbnail must be a JPEG, PNG, or WebP under 10 MB.", 400);
      }
      normalizedThumbnailName = `Video/${userId}/thumbnails/${new mongoose.Types.ObjectId()}`;
    }

    const videoId = new mongoose.Types.ObjectId();
    createdVideoId = videoId;
    const sourceKey = `Video/${userId}/${videoId}/source${ext}`;
    createdObjectKey = sourceKey;
    const { bucket } = getB2Config();
    const client = getB2Client();
    const multipart = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: sourceKey,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    createdUploadId = multipart.UploadId;
    if (!createdUploadId) throw new Error("B2 did not return an upload ID.");

    const video = await Video.create({
      _id: videoId,
      channel: channelId,
      category: categoryData._id,
      title: name.trim(),
      description: String(description).slice(0, 5000),
      videoUrl: getPublicUrl(sourceKey),
      videoType: [videoType],
      hashtags: normalizedHashtags,
      isCreativeCorner: creativeCorner,
      duration: declaredDuration,
      uploadedBy: userId,
      status: "disabled",
      processingStatus: "uploading",
      sourceKey,
      b2UploadId: createdUploadId,
      sourceSize: size,
      sourceContentType: contentType,
      sourceFileName: path.basename(String(fileName)).slice(0, 255),
      thumbnailKey: normalizedThumbnailName || undefined,
      thumbnailContentType: thumbnailName ? thumbnailContentType : undefined,
    });

    const partSize = getPartSize(size);
    const partsCount = Math.ceil(size / partSize);
    const thumbnailUploadUrl = normalizedThumbnailName
      ? await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: bucket,
            Key: normalizedThumbnailName,
            ContentType: thumbnailContentType,
            CacheControl: "public, max-age=31536000, immutable",
          }),
          { expiresIn: 900 },
        )
      : undefined;

    return res.status(201).json({
      success: true,
      videoId: String(video._id),
      uploadId: createdUploadId,
      partSize,
      partsCount,
      thumbnailUploadUrl,
    });
  } catch (error) {
    if (createdUploadId) {
      try {
        const { bucket } = getB2Config();
        await getB2Client().send(
          new AbortMultipartUploadCommand({
            Bucket: bucket,
            Key: createdObjectKey,
            UploadId: createdUploadId,
          }),
        );
      } catch (abortError) {
        console.error("[multipart-video-upload] Failed to abort upload:", abortError);
      }
    }
    if (createdVideoId) {
      await Video.deleteOne({ _id: createdVideoId }).catch((cleanupError) => {
        console.error("[multipart-video-upload] Failed to clean up video:", cleanupError);
      });
    }
    return sendError(res, error);
  }
}

async function getPartUploadUrl(req, res) {
  try {
    const video = await findOwnedUpload(req);
    if (!video) return sendError(res, "Upload session not found.", 404);

    const partNumber = Number(req.body?.partNumber);
    const partSize = getPartSize(video.sourceSize);
    const partsCount = Math.ceil(video.sourceSize / partSize);
    if (
      !Number.isInteger(partNumber) ||
      partNumber < 1 ||
      partNumber > partsCount
    ) {
      return sendError(res, "Invalid upload part number.", 400);
    }

    const { bucket } = getB2Config();
    const url = await getSignedUrl(
      getB2Client(),
      new UploadPartCommand({
        Bucket: bucket,
        Key: video.sourceKey,
        UploadId: video.b2UploadId,
        PartNumber: partNumber,
      }),
      { expiresIn: 900 },
    );
    return res.status(200).json({ success: true, url });
  } catch (error) {
    return sendError(res, error);
  }
}

async function resumeMultipartUpload(req, res) {
  try {
    const video = await findOwnedUpload(req);
    if (!video) {
      const completed = await Video.findOne({
        _id: req.params.videoId,
        channel: req.params.channelId,
        uploadedBy: getUserId(req),
      }).select("processingStatus processingError");
      if (completed) {
        return res.status(200).json({
          success: true,
          processingStatus: completed.processingStatus,
          processingError: completed.processingError,
          parts: [],
        });
      }
      return sendError(res, "Upload session not found.", 404);
    }

    const [parts, thumbnailUploadUrl] = await Promise.all([
      listAllParts(video),
      video.thumbnailKey
        ? getSignedUrl(
            getB2Client(),
            new PutObjectCommand({
              Bucket: getB2Config().bucket,
              Key: video.thumbnailKey,
              ContentType: video.thumbnailContentType || "image/jpeg",
              CacheControl: "public, max-age=31536000, immutable",
            }),
            { expiresIn: 900 },
          )
        : undefined,
    ]);

    return res.status(200).json({
      success: true,
      videoId: String(video._id),
      uploadId: video.b2UploadId,
      processingStatus: video.processingStatus,
      partSize: getPartSize(video.sourceSize),
      parts: parts.map((part) => ({
        partNumber: part.PartNumber,
        etag: part.ETag,
        size: part.Size,
      })),
      thumbnailUploadUrl,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function completeMultipartUpload(req, res) {
  try {
    const video = await findOwnedUpload(req);
    if (!video) {
      const existing = await Video.findOne({
        _id: req.params.videoId,
        channel: req.params.channelId,
        uploadedBy: getUserId(req),
      }).select("processingStatus processingError");
      if (existing && existing.processingStatus !== "uploading") {
        if (existing.processingStatus === "queued") {
          await enqueueVideoProcessing(existing._id);
        }
        return res.status(200).json({
          success: true,
          processingStatus: existing.processingStatus,
          videoId: String(existing._id),
        });
      }
      return sendError(res, "Upload session not found.", 404);
    }

    const { bucket } = getB2Config();
    const client = getB2Client();
    const uploadedParts = await listAllParts(video);
    const expectedParts = Math.ceil(video.sourceSize / getPartSize(video.sourceSize));
    if (uploadedParts.length !== expectedParts) {
      return sendError(res, "Some video parts are missing. Retry the upload.", 400);
    }
    const completedParts = uploadedParts
      .sort((left, right) => left.PartNumber - right.PartNumber)
      .map((part, index) => {
        if (part.PartNumber !== index + 1 || !part.ETag) {
          throw new Error("B2 returned an invalid multipart upload part list.");
        }
        return { ETag: part.ETag, PartNumber: part.PartNumber };
      });

    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: video.sourceKey,
        UploadId: video.b2UploadId,
        MultipartUpload: { Parts: completedParts },
      }),
    );

    const object = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: video.sourceKey }),
    );
    if (Number(object.ContentLength) !== video.sourceSize) {
      throw new Error("Uploaded file size does not match the selected video.");
    }

    video.processingStatus = "queued";
    video.b2UploadId = undefined;
    await video.save();

    await enqueueVideoProcessing(video._id);

    return res.status(202).json({
      success: true,
      videoId: String(video._id),
      processingStatus: "queued",
      message: "Upload complete. Video processing has started.",
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function enqueueVideoProcessing(videoId) {
  await getQueue("video-processing").add(
    "process-video",
    { videoId: String(videoId) },
    { jobId: String(videoId) },
  );
}

async function abortMultipartUpload(req, res) {
  try {
    const video = await findOwnedUpload(req);
    if (!video) return res.status(204).end();

    const { bucket } = getB2Config();
    await getB2Client().send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: video.sourceKey,
        UploadId: video.b2UploadId,
      }),
    );
    await video.deleteOne();
    return res.status(204).end();
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  abortMultipartUpload,
  completeMultipartUpload,
  getPartUploadUrl,
  initiateMultipartUpload,
  resumeMultipartUpload,
};

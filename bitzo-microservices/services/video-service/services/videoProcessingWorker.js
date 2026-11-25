const { execFile, spawn } = require("node:child_process");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const ffprobeStatic = require("ffprobe-static");
const { createWorker } = require("../../../services/Queues");
const { invalidateCache } = require("../../../services/caching");
const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const User = require("../models/usermodel");
const HashtagStats = require("../models/CategoryModel/HashtagStats");
const {
  getB2Client,
  getB2Config,
  getPublicUrl,
  getVideoSourceBucket,
  getVideoSourceClient,
} = require("../utils/b2Storage");
const {
  buildTranscodeArgs,
  getAvailableResolutions,
  getContentType,
  writeMasterPlaylist,
} = require("../utils/hlsTranscode");
const { invalidateVideoCatalogCache } = require("../utils/videoCatalogCache");
const { createBulkNotifications } = require("../utils/notificationService");

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      windowsHide: true,
      ...options,
    });
    let stderr = "";
    process.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-12000);
    });
    process.once("error", reject);
    process.once("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${path.basename(command)} exited with code ${code}: ${stderr}`));
    });
  });
}

function probeMedia(filePath) {
  return new Promise((resolve, reject) => {
    execFile(
      ffprobeStatic.path,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_type,width,height",
        "-of",
        "json",
        filePath,
      ],
      { timeout: 30000, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) return reject(error);
        try {
          resolve(JSON.parse(stdout));
        } catch (parseError) {
          reject(parseError);
        }
      },
    );
  });
}

async function downloadSource(video, filePath) {
  const config = getB2Config();
  const bucket = getVideoSourceBucket(video, config);
  const response = await getVideoSourceClient(video, config).send(
    new GetObjectCommand({ Bucket: bucket, Key: video.sourceKey }),
  );
  if (!response.Body) throw new Error("B2 returned an empty source video.");
  await pipeline(response.Body, fs.createWriteStream(filePath));
}

async function generateThumbnail(inputPath, outputPath, duration) {
  await runProcess(process.env.FFMPEG_PATH || "ffmpeg", [
    "-hide_banner",
    "-y",
    "-ss",
    String(Math.min(1, duration / 4)),
    "-i",
    inputPath,
    "-frames:v",
    "1",
    "-vf",
    "scale=640:-2:force_original_aspect_ratio=decrease",
    "-q:v",
    "2",
    outputPath,
  ]);
}

async function listFiles(directory, relativeDirectory = "") {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push({ absolutePath, relativePath });
    }
  }
  return files;
}

async function uploadDirectory(localDirectory, objectPrefix) {
  const { bucket } = getB2Config();
  const files = await listFiles(localDirectory);
  const client = getB2Client();
  const concurrency = 6;
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, async () => {
      while (nextIndex < files.length) {
        const index = nextIndex++;
        const file = files[index];
        const key = `${objectPrefix}/${file.relativePath
          .split(path.sep)
          .join("/")}`;
        const stat = await fsp.stat(file.absolutePath);
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fs.createReadStream(file.absolutePath),
            ContentLength: stat.size,
            ContentType: getContentType(file.absolutePath),
            CacheControl: "public, max-age=31536000, immutable",
          }),
        );
      }
    }),
  );
}

async function processVideo(videoId) {
  const video = await Video.findById(videoId);
  if (!video) throw new Error(`Video ${videoId} was not found.`);
  if (video.processingStatus === "ready") return;
  if (!video.sourceKey) throw new Error("Video source key is missing.");

  video.processingStatus = "processing";
  video.processingError = null;
  await video.save();

  const workDirectory = await fsp.mkdtemp(
    path.join(os.tmpdir(), `bharatplay-${videoId}-`),
  );
  const sourcePath = path.join(workDirectory, `source${path.extname(video.sourceFileName || ".mp4")}`);
  const outputDirectory = path.join(workDirectory, "hls");
  const generatedThumbnailPath = path.join(workDirectory, "thumbnail.jpg");

  try {
    await downloadSource(video, sourcePath);
    const media = await probeMedia(sourcePath);
    const duration = Number(media.format?.duration);
    const videoStream = media.streams?.find((stream) => stream.codec_type === "video");
    if (!duration || !videoStream?.width || !videoStream?.height) {
      throw new Error("Uploaded file does not contain a readable video stream.");
    }
    const isShort = video.videoType?.includes("short");
    if ((isShort && duration > 60) || (!isShort && (duration < 60 || duration > 300))) {
      throw new Error(
        isShort
          ? "Short videos must be 60 seconds or shorter."
          : "Long videos must be between 60 and 300 seconds.",
      );
    }

    const resolutions = getAvailableResolutions(videoStream.height);

    await fsp.mkdir(outputDirectory, { recursive: true });
    await runProcess(
      process.env.FFMPEG_PATH || "ffmpeg",
        buildTranscodeArgs(sourcePath, outputDirectory, resolutions),
    );

    const mediaRevision = Math.max(1, Number(video.mediaRevision) || 1);
    const outputPrefix = `Video/${video.uploadedBy}/${video._id}/hls${
      mediaRevision > 1 ? `/v${mediaRevision}` : ""
    }`;
    let thumbnailKey =
      video.thumbnailKey || `${outputPrefix}/thumbnail.jpg`;
    const { bucket } = getB2Config();
    let customThumbnailAvailable = false;
    if (video.thumbnailKey) {
      try {
        await getB2Client().send(
          new HeadObjectCommand({ Bucket: bucket, Key: video.thumbnailKey }),
        );
        customThumbnailAvailable = true;
      } catch (error) {
        if (error.$metadata?.httpStatusCode !== 404 && error.name !== "NotFound") {
          throw error;
        }
        thumbnailKey = `Video/${video.uploadedBy}/${video._id}/hls/thumbnail.jpg`;
      }
    }
    if (!customThumbnailAvailable) {
      await generateThumbnail(sourcePath, generatedThumbnailPath, duration);
      await getB2Client().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey,
          Body: fs.createReadStream(generatedThumbnailPath),
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    }

    const masterPlaylistPath = path.join(outputDirectory, "master.m3u8");
    writeMasterPlaylist(
      masterPlaylistPath,
      resolutions,
      videoStream.width,
      videoStream.height,
    );
    await uploadDirectory(outputDirectory, outputPrefix);

    video.videoUrl = getPublicUrl(`${outputPrefix}/master.m3u8`);
    video.thumbnail = getPublicUrl(thumbnailKey);
    video.thumbnailKey = thumbnailKey;
    video.duration = duration;
    video.qualitySources = Object.fromEntries(
      resolutions.map(({ height }) => [
        `${height}p`,
        getPublicUrl(`${outputPrefix}/${height}p/index.m3u8`),
      ]),
    );
    await Promise.all([
      Channel.updateOne(
        { _id: video.channel },
        { $addToSet: { videos: video._id } },
      ),
      User.updateOne(
        { _id: video.uploadedBy },
        { $addToSet: { videos: video._id } },
      ),
    ]);

    if (
      !video.replacementUploadId &&
      video.isCreativeCorner &&
      video.hashtags?.length
    ) {
      await HashtagStats.bulkWrite(
        video.hashtags.map((hashtag) => ({
          updateOne: {
            filter: { hashtag },
            update: {
              $setOnInsert: { hashtag },
              $inc: { videoCount: 1 },
              $addToSet: { uniqueCreators: video.uploadedBy },
              $set: { updatedAt: new Date() },
            },
            upsert: true,
          },
        })),
      );
    }

    video.processingStatus = "ready";
    video.processingError = null;
    video.status = "active";
    await video.save();
    try {
      await Promise.all([
        invalidateVideoCatalogCache(),
        invalidateCache(`channel-page:${video.channel}`),
        invalidateCache(`channel-videos:${video.channel}`),
      ]);
    } catch (error) {
      console.error("[video-processing] Video cache invalidation failed:", error);
    }

    const channel = await Channel.findById(video.channel).select("subscribedBy");
    if (!video.replacementUploadId && channel?.subscribedBy?.length) {
      try {
        await createBulkNotifications({
          recipients: channel.subscribedBy,
          actor: video.uploadedBy,
          type: "upload",
          video: video._id,
          channel: video.channel,
        });
      } catch (error) {
        console.error("[video-processing] Subscriber notification failed:", error);
      }
    }
  } finally {
    await fsp.rm(workDirectory, { recursive: true, force: true });
  }
}

function startVideoProcessingWorker() {
  const worker = createWorker(
    "video-processing",
    async (job) => processVideo(job.data.videoId),
    { concurrency: Number(process.env.VIDEO_PROCESSING_CONCURRENCY) || 1 },
  );
  worker.on("failed", async (job, error) => {
    console.error(`[video-processing] Job ${job?.id} failed:`, error);
    if (!job) return;
    const maxAttempts = Number(job.opts.attempts) || 1;
    if (job.attemptsMade >= maxAttempts) {
      await Video.updateOne(
        { _id: job.data.videoId, processingStatus: { $ne: "ready" } },
        {
          $set: {
            processingStatus: "failed",
            processingError: String(error.message).slice(0, 1000),
          },
        },
      );
    }
  });
  worker.on("error", (error) =>
    console.error("[video-processing] Worker error:", error),
  );
  return worker;
}

module.exports = { processVideo, startVideoProcessingWorker };

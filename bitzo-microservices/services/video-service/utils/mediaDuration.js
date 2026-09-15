const { execFile } = require("child_process");
const fs = require("fs");
const http = require("http");
const https = require("https");
const os = require("os");
const path = require("path");
const ffprobeStatic = require("ffprobe-static");

// Bounded budgets so extraction never hangs the upload request.
const PROBE_TIMEOUT_MS = 12000;
const DOWNLOAD_TIMEOUT_MS = 25000;
const MAX_DOWNLOAD_BYTES = 512 * 1024 * 1024; // guard against runaway downloads

const isUrl = (value) => /^https?:\/\//i.test(value);

// Runs `ffprobe` against a file path or remote URL and returns the duration in
// seconds (float), or null when the media cannot be probed.
function probeDuration(target) {
  return new Promise((resolve) => {
    execFile(
      ffprobeStatic.path,
      [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        target,
      ],
      { timeout: PROBE_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          console.error(`[mediaDuration] ffprobe failed for ${target}:`, error.message);
          return resolve(null);
        }
        const duration = parseFloat(String(stdout).trim());
        if (!Number.isFinite(duration) || duration <= 0) return resolve(null);
        resolve(duration);
      },
    );
  });
}

// Streams a remote file to a temp path so it can be probed locally.
function downloadToTemp(url) {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(
      os.tmpdir(),
      `video-probe-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`,
    );
    const cleanup = (error) => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      reject(error);
    };

    const client = url.startsWith("https:") ? https : http;
    const request = client.get(url, (response) => {
      const redirect = response.statusCode >= 300 && response.headers.location;
      if (redirect) {
        response.resume();
        request.destroy();
        return resolve(downloadToTemp(redirect));
      }
      if (response.statusCode >= 400) {
        response.resume();
        return cleanup(new Error(`Download failed with status ${response.statusCode}`));
      }

      const fileStream = fs.createWriteStream(tempPath);
      let received = 0;
      response.on("data", (chunk) => {
        received += chunk.length;
        if (received > MAX_DOWNLOAD_BYTES) {
          request.destroy(new Error("Download exceeded size limit"));
        }
      });
      response.pipe(fileStream);
      fileStream.on("finish", () => fileStream.close(() => resolve(tempPath)));
      fileStream.on("error", cleanup);
    });

    request.setTimeout(DOWNLOAD_TIMEOUT_MS, () =>
      request.destroy(new Error("Download timed out")),
    );
    request.on("error", cleanup);
  });
}

// Resolves any media source (http(s) URL or server-relative/local path) into a
// value ffprobe understands. Storage-provider agnostic by design.
function resolveTarget(value) {
  if (!value || typeof value !== "string") return null;
  if (isUrl(value)) return value;
  return path.resolve(process.cwd(), value);
}

/**
 * Returns the real duration (seconds) of a video, or null if it cannot be read.
 *
 * Provider-independent: works with http(s) URLs (Cloudinary, Backblaze B2,
 * AWS S3, MinIO) or on-disk paths (local storage). Remote files are probed
 * directly first to avoid re-downloading; a file is downloaded to a temp
 * location only when a direct probe is not possible.
 */
async function getVideoDuration(source) {
  const target = resolveTarget(source);
  if (!target) return null;

  try {
    if (isUrl(source)) {
      const direct = await probeDuration(target);
      if (direct !== null) return direct;
    }

    const localTarget = isUrl(source) ? await downloadToTemp(target) : target;
    try {
      return await probeDuration(localTarget);
    } finally {
      if (localTarget !== target && fs.existsSync(localTarget)) {
        fs.unlinkSync(localTarget);
      }
    }
  } catch (error) {
    console.error("[mediaDuration] Duration extraction failed:", error.message);
    return null;
  }
}

module.exports = { getVideoDuration };

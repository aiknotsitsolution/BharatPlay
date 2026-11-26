
const multer = require("multer");
const os = require("node:os");
const path = require("node:path");

const videoStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, os.tmpdir()),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `bharatplay-video-${uniqueId}${extension}`);
  },
});

// File filter — checks field name and mime type
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "video") {
    if (
      [".mp4", ".mov", ".m4v", ".webm"].includes(
        path.extname(file.originalname).toLowerCase(),
      ) &&
      [
        "video/mp4",
        "video/quicktime",
        "video/x-m4v",
        "video/m4v",
        "video/webm",
      ].includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Use an MP4, MOV, M4V, or WebM video."), false);
    }
  } else if (file.fieldname === "thumbnail") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed for thumbnail"), false);
    }
  } else {
    cb(new Error("Unexpected field name"), false);
  }
};

// Stage video files on disk before streaming them to Backblaze B2.
const videoAndThumbnailUpload = multer({
  storage: videoStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

// For channel images (avatar/banner) — memory storage
const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB for channel images/banners
});

module.exports = {
  videoAndThumbnailUpload,
  imageUpload,
};

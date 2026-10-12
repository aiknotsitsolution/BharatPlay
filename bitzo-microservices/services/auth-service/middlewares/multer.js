// // // const multer = require("multer");
// // // const { CloudinaryStorage } = require("multer-storage-cloudinary");
// // // const cloudinary = require("../config/cloudinary");

// // // const storage = new CloudinaryStorage({
// // //   cloudinary,
// // //   params: async (req, file) => {
// // //     return {
// // //       folder: "ugc_videos",
// // //       resource_type: "video",
// // //       public_id: `video_${Date.now()}`,
// // //       allowed_formats: ["mp4", "mov", "mkv"],
// // //     };
// // //   },
// // // });

// // // const upload = multer({
// // //   storage,
// // //   limits: {
// // //     fileSize: 200 * 1024 * 1024
// // //   },
// // // });

// // // module.exports = upload;

// // const multer = require("multer");
// // const path = require("path");

// // const diskStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, "uploads/");
// //   },
// //   filename: (req, file, cb) => {
// //     cb(null, Date.now() + path.extname(file.originalname));
// //   },
// // });

// // const memoryStorage = multer.memoryStorage();

// // // File filter for videos (MP4 only)
// // const videoFileFilter = (req, file, cb) => {
// //   if (file.mimetype === "video/mp4") {
// //     cb(null, true);
// //   } else {
// //     cb(new Error("Only MP4 videos allowed"), false);
// //   }
// // };

// // // File filter for images
// // const imageFileFilter = (req, file, cb) => {
// //   if (file.mimetype.startsWith("image/")) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error("Only image files allowed"), false);
// //   }
// // };

// // // Video upload middleware (disk storage)
// // const videoUpload = multer({
// //   storage: diskStorage,
// //   fileFilter: videoFileFilter,
// // });

// // // Flexible upload middleware - accepts any file (for createuploadvideo)
// // const uploadAny = multer({
// //   storage: diskStorage,
// //   // No file filter - accept any file type
// // });

// // // Image upload middleware for channel creation (memory storage for imagekit)
// // const imageUpload = multer({
// //   storage: memoryStorage,
// //   fileFilter: imageFileFilter,
// // });

// // module.exports = videoUpload;
// // module.exports.uploadAny = uploadAny;
// // module.exports.imageUpload = imageUpload;


// const multer = require("multer");
// const path = require("path");

// // ──────────────────────────────────────────────
// // Disk storage for videos & thumbnails
// // ──────────────────────────────────────────────
// const diskStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueName + path.extname(file.originalname));
//   },
// });

// // ──────────────────────────────────────────────
// // File filter – different rules per field
// // ──────────────────────────────────────────────
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "video") {
//     if (file.mimetype === "video/mp4") {
//       cb(null, true);
//     } else {
//       cb(new Error("Only MP4 videos are allowed"), false);
//     }
//   } else if (file.fieldname === "thumbnail") {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed for thumbnail"), false);
//     }
//   } else {
//     cb(new Error("Unexpected field"), false);
//   }
// };

// // ──────────────────────────────────────────────
// // Main uploader for video + optional thumbnail
// // ──────────────────────────────────────────────
// const videoAndThumbnailUpload = multer({
//   storage: diskStorage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
// });

// // ──────────────────────────────────────────────
// // For channel avatar/banner (memory storage)
// // ──────────────────────────────────────────────
// const imageUpload = multer({
//   storage: multer.memoryStorage(),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files allowed"), false);
//     }
//   },
//   limits: { fileSize: 5 * 1024 * 1024 } // 5 MB for avatars/banners
// });

// module.exports = {
//   videoAndThumbnailUpload,
//   imageUpload,
//   // you can keep old ones if needed, but better to use the new one
//   // videoUpload: videoAndThumbnailUpload,     // alias if you want
//   // uploadAny: multer({ storage: diskStorage }), // no filter
// };

// const multer = require("multer");
// const path = require("path");

// // ──────────────────────────────────────────────
// // Storage: save files to disk (uploads/ folder)
// // ──────────────────────────────────────────────
// const diskStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueName + path.extname(file.originalname));
//   },
// });

// // ──────────────────────────────────────────────
// // File filter: different rules depending on fieldname
// // ──────────────────────────────────────────────
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "video") {
//     if (file.mimetype === "video/mp4") {
//       cb(null, true);
//     } else {
//       cb(new Error("Only MP4 videos are allowed"), false);
//     }
//   } else if (file.fieldname === "thumbnail") {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed for thumbnail"), false);
//     }
//   } else {
//     cb(new Error("Unexpected field"), false);
//   }
// };

// // ──────────────────────────────────────────────
// // Uploader for video + thumbnail (used in upload route)
// // ──────────────────────────────────────────────
// const videoAndThumbnailUpload = multer({
//   storage: diskStorage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
// });

// // ──────────────────────────────────────────────
// // Uploader for channel images (avatar/banner) – keeps in memory
// // ──────────────────────────────────────────────
// const imageUpload = multer({
//   storage: multer.memoryStorage(),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files allowed"), false);
//     }
//   },
//   limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
// });

// module.exports = {
//   videoAndThumbnailUpload,
//   imageUpload
// };

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary storage (uploads videos & thumbnails to Cloudinary)
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const base = {
      folder: "ugc_videos",
      public_id: `video_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
    };
    if (file.fieldname === "video") {
      return {
        ...base,
        resource_type: "video",
        allowed_formats: ["mp4", "mov", "mkv"],
      };
    }
    return {
      ...base,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    };
  },
});

// File filter — checks field name and mime type
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "video") {
    if (file.mimetype === "video/mp4") {
      cb(null, true);
    } else {
      cb(new Error("Only MP4 videos allowed"), false);
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

// Multer instance for video + thumbnail
const videoAndThumbnailUpload = multer({
  storage: cloudinaryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = {
  videoAndThumbnailUpload,
  imageUpload
};
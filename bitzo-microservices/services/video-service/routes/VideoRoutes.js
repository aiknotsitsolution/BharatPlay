const express = require("express");
const router = express.Router();
const riskCheck = require("../middlewares/riskCheck.middleware");
const { videoAndThumbnailUpload: upload } = require("../middlewares/multer");
const isAuthenticated = require("../middlewares/isAuthenticated");
const requireAdmin = require("../middlewares/requireAdmin");
const { requirePermission } = require("../middlewares/checkAdminPermission");
const { adminUserListLimiter } = require("../middlewares/rateLimit");
const { uploadVideo, getAllVideos, deleteVideo, updateVideoupdated, getMyVideos, editMyVideo, deleteMyVideo } = require("../controller/videoController");

router.post(
  "/upload",
  isAuthenticated,
  upload.single("video"),
  uploadVideo
);
router.get("/my-videos",riskCheck, isAuthenticated, getMyVideos);

router.put(
  "/update/:id",
  isAuthenticated,
  upload.single("video"), // optional
  updateVideoupdated
);

router.delete(
  "/my-video/:id",
  isAuthenticated,
  deleteMyVideo
);

router.get("/", requireAdmin, requirePermission("content:read"), adminUserListLimiter, getAllVideos);

router.delete("/:id", isAuthenticated, deleteVideo);

module.exports = router;

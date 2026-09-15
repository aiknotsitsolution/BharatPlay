const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const {
  registrationStatus,
  registerUser,
  loginUser,
  registerEmployee,
  loginEmployee,
  getAllUsers,
  updateUser,
  deleteEmployee,
  getUserById,
  getUserOverview,
  getAdminUserChannels,
  getAdminUserVideos,
  getAdminUserShorts,
  adminRefresh,
  adminLogout,
  getUserActivity,
  getUserWatchHistory,
  getUserSubscriptions,
  getUserLikedVideos,
  getUserDislikedVideos,
  getUserWatchLater,
  getUserNotifications,
  getUserDevices,
  getUserFraudEvents,
  getUserEngagement,
  suspendUser,
  restoreUser,
  banUser,
  disableChannel,
  enableChannel,
  banChannel,
  restoreChannel,
  deleteChannel,
  disableVideo,
  enableVideo,
  deleteVideo,
  disableShort,
  enableShort,
  deleteShort,
  getEmployees,
  toggleUserStatus,
  getDeletedUsers,
  hardDeleteUser,
} = require("../../controller/AdminController/AdminController");
const requireAdmin = require("../../middlewares/requireAdmin");
const { requirePermission } = require("../../middlewares/checkAdminPermission");
const {
  adminLoginLimiter,
  adminRegisterLimiter,
  refreshLimiter,
  adminUserListLimiter,
  adminUserLimiter,
  adminDestructiveLimiter,
} = require("../../middlewares/rateLimit");
const {
  getDashboard,
} = require("../../controller/AdminController/adminDashboardController");
const {
  getAdminUploads
} = require("../../controller/AdminController/adminUploadsController");
const {
  searchVideos,
  searchUsers,
} = require("../../controller/AdminController/adminSearchController");

// ====================== PUBLIC AUTH ROUTES ======================
router.get("/registration-status", registrationStatus);
router.post("/register", adminRegisterLimiter, registerUser);
router.post("/login", adminLoginLimiter, loginUser);
router.post("/admin-login", adminLoginLimiter, loginUser);
router.post("/employee-login", adminLoginLimiter, loginEmployee);
router.post("/employee/login", adminLoginLimiter, loginEmployee);
router.post("/refresh", refreshLimiter, adminRefresh);
router.post("/logout", adminLogout);

// ====================== PROTECTED: EMPLOYEE MANAGEMENT ======================
router.post("/employee/register", fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  useTempFiles: false,
}), requireAdmin, requirePermission("employee:create"), adminRegisterLimiter, registerEmployee);
router.get("/roles", requireAdmin, requirePermission("employee:read"), getEmployees);

// ====================== PROTECTED: DASHBOARD ======================
router.get("/dashboard", requireAdmin, requirePermission("dashboard:read"), getDashboard);

// ====================== PROTECTED: USER READ ======================
router.get("/users", requireAdmin, requirePermission("users:read"), getAllUsers);
router.get("/alluser", requireAdmin, requirePermission("users:read"), adminUserListLimiter, getAllUsers);
router.get("/users/:id", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserById);
router.get("/users/:id/overview", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserOverview);
router.get("/users/:id/channels", requireAdmin, requirePermission("users:read"), adminUserLimiter, getAdminUserChannels);
router.get("/users/:id/videos", requireAdmin, requirePermission("users:read"), adminUserLimiter, getAdminUserVideos);
router.get("/users/:id/shorts", requireAdmin, requirePermission("users:read"), adminUserLimiter, getAdminUserShorts);
router.get("/users/:id/activity", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserActivity);
router.get("/users/:id/watch-history", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserWatchHistory);
router.get("/users/:id/subscriptions", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserSubscriptions);
router.get("/users/:id/liked-videos", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserLikedVideos);
router.get("/users/:id/disliked-videos", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserDislikedVideos);
router.get("/users/:id/watch-later", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserWatchLater);
router.get("/users/:id/notifications", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserNotifications);
router.get("/users/:id/devices", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserDevices);
router.get("/users/:id/fraud-events", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserFraudEvents);
router.get("/users/:id/engagement", requireAdmin, requirePermission("users:read"), adminUserLimiter, getUserEngagement);

// ====================== PROTECTED: CONTENT READ ======================
router.get("/uploads", requireAdmin, requirePermission("content:read"), adminUserListLimiter, getAdminUploads);

// ====================== PROTECTED: USER WRITE ======================
router.put("/users/:id", requireAdmin, requirePermission("users:write"), adminUserLimiter, updateUser);

// ====================== PROTECTED: USER DELETE ======================
router.delete("/users/:id/permanent", requireAdmin, requirePermission("users:delete"), adminDestructiveLimiter, hardDeleteUser);
router.delete("/employee/:id", requireAdmin, requirePermission("users:delete"), adminDestructiveLimiter, deleteEmployee);

// ====================== DELETED USERS ======================
router.get("/deleted-users", requireAdmin, requirePermission("users:read"), adminUserListLimiter, getDeletedUsers);

// ====================== PROTECTED: USER MODERATION ======================
router.post("/users/:id/suspend", requireAdmin, requirePermission("moderation:write"), adminDestructiveLimiter, suspendUser);
router.post("/users/:id/restore", requireAdmin, requirePermission("moderation:write"), adminDestructiveLimiter, restoreUser);
router.post("/users/:id/ban", requireAdmin, requirePermission("moderation:write"), adminDestructiveLimiter, banUser);

// ====================== PROTECTED: CHANNEL MODERATION ======================
router.post("/users/:id/channels/:channelId/disable", requireAdmin, requirePermission("moderation:write"), adminUserLimiter, disableChannel);
router.post("/users/:id/channels/:channelId/enable", requireAdmin, requirePermission("moderation:write"), adminUserLimiter, enableChannel);
router.post("/users/:id/channels/:channelId/ban", requireAdmin, requirePermission("moderation:write"), adminDestructiveLimiter, banChannel);
router.post("/users/:id/channels/:channelId/restore", requireAdmin, requirePermission("moderation:write"), adminUserLimiter, restoreChannel);
router.delete("/users/:id/channels/:channelId", requireAdmin, requirePermission("moderation:delete"), adminDestructiveLimiter, deleteChannel);

// ====================== PROTECTED: VIDEO MODERATION ======================
router.post("/users/:id/videos/:videoId/disable", requireAdmin, requirePermission("moderation:write"), adminUserLimiter, disableVideo);
router.post("/users/:id/videos/:videoId/enable", requireAdmin, requirePermission("moderation:write"), adminUserLimiter, enableVideo);
router.delete("/users/:id/videos/:videoId", requireAdmin, requirePermission("moderation:delete"), adminDestructiveLimiter, deleteVideo);

// ====================== PROTECTED: SHORT MODERATION ======================
router.post("/users/:id/shorts/:videoId/disable", requireAdmin, requirePermission("moderation:write"), adminUserLimiter, disableShort);
router.post("/users/:id/shorts/:videoId/enable", requireAdmin, requirePermission("moderation:write"), adminUserLimiter, enableShort);
router.delete("/users/:id/shorts/:videoId", requireAdmin, requirePermission("moderation:delete"), adminDestructiveLimiter, deleteShort);

// ====================== PROTECTED: SEARCH (for copyright form etc.) ======================
router.get("/search/videos", requireAdmin, searchVideos);
router.get("/search/users", requireAdmin, searchUsers);

router.patch("/users/:id/status", requireAdmin, toggleUserStatus);
router.get("/users/:id", requireAdmin, getUserById);
router.get("/alluser", requireAdmin, getAllUsers);
router.put("/users/:id", requireAdmin, updateUser);
router.delete("/employee/:id", requireAdmin, deleteEmployee);
module.exports = router;

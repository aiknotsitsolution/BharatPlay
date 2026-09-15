const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controller/notificationController");

router.get("/", isAuthenticated, getNotifications);
router.patch("/read-all", isAuthenticated, markAllNotificationsRead);
router.patch("/:id/read", isAuthenticated, markNotificationRead);
router.delete("/:id", isAuthenticated, deleteNotification);

module.exports = router;

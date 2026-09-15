const Notification = require("../models/NotificationModel");
const User = require("../models/usermodel");
const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const { emitNotificationRead } = require("../services/socketService");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50)
      .populate({ path: "actor", select: "name avatar", model: User })
      .populate({ path: "video", select: "title thumbnail videoType", model: Video })
      .populate({ path: "channel", select: "name channelImage", model: Channel });

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true },
    )
      .populate({ path: "actor", select: "name avatar", model: User })
      .populate({ path: "video", select: "title thumbnail videoType", model: Video })
      .populate({ path: "channel", select: "name channelImage", model: Channel });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    emitNotificationRead(userId, notification._id, unreadCount);

    res.status(200).json({ success: true, notification, unreadCount });
  } catch (error) {
    console.error("Error in markNotificationRead:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true },
    );

    emitNotificationRead(userId, null, 0, true);

    res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error("Error in markAllNotificationsRead:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};

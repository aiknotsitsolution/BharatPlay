const Notification = require("../models/NotificationModel");
const User = require("../models/usermodel");
const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const { emitNotificationCreated } = require("../services/socketService");

const populateNotification = (notificationId) =>
  Notification.findById(notificationId)
    .populate({ path: "actor", select: "name avatar", model: User })
    .populate({ path: "video", select: "title thumbnail videoType", model: Video })
    .populate({ path: "channel", select: "name channelImage", model: Channel });

const createNotification = async ({
  recipient,
  actor,
  type,
  video = null,
  channel = null,
}) => {
  try {
    if (!recipient) return null;
    if (String(recipient) === String(actor)) return null;

    const notification = await Notification.create({
      recipient,
      actor,
      type,
      video,
      channel,
    });

    const populated = await populateNotification(notification._id);
    const unreadCount = await Notification.countDocuments({
      recipient,
      isRead: false,
    });
    emitNotificationCreated(recipient, populated, unreadCount);
    return populated;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

const createBulkNotifications = async ({
  recipients,
  actor,
  type,
  video = null,
  channel = null,
}) => {
  try {
    const docs = recipients
      .filter((recipient) => recipient && String(recipient) !== String(actor))
      .map((recipient) => ({
        recipient,
        actor,
        type,
        video,
        channel,
      }));

    if (!docs.length) return [];

    const notifications = await Notification.insertMany(docs);
    const populated = await Notification.find({
      _id: { $in: notifications.map((notification) => notification._id) },
    })
      .populate({ path: "actor", select: "name avatar", model: User })
      .populate({ path: "video", select: "title thumbnail videoType", model: Video })
      .populate({ path: "channel", select: "name channelImage", model: Channel });
    const unreadCounts = await Notification.aggregate([
      { $match: { recipient: { $in: recipients }, isRead: false } },
      { $group: { _id: "$recipient", count: { $sum: 1 } } },
    ]);
    const countByRecipient = new Map(
      unreadCounts.map((entry) => [String(entry._id), entry.count]),
    );
    for (const notification of populated) {
      emitNotificationCreated(
        notification.recipient,
        notification,
        countByRecipient.get(String(notification.recipient)) || 0,
      );
    }
    return populated;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return [];
  }
};

module.exports = { createNotification, createBulkNotifications };

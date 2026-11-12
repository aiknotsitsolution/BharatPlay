const Notification = require("../models/NotificationModel");
const User = require("../models/usermodel");
const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const { createWorker } = require("../../../services/Queues");
const { emitNotificationCreated } = require("./socketService");

async function processNotificationJob(job) {
  if (job.name !== "create-notification") {
    throw new Error(`Unsupported notification job: ${job.name}`);
  }

  const { notificationId, ...notificationData } = job.data;
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId },
    { $setOnInsert: notificationData },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  const populated = await Notification.findById(notification._id)
    .populate({ path: "actor", select: "name avatar", model: User })
    .populate({
      path: "video",
      select: "title thumbnail videoType",
      model: Video,
    })
    .populate({
      path: "channel",
      select: "name channelImage",
      model: Channel,
    });

  if (!populated) {
    throw new Error(`Could not load notification ${notificationId} after save.`);
  }

  const unreadCount = await Notification.countDocuments({
    recipient: notificationData.recipient,
    isRead: false,
  });
  emitNotificationCreated(
    notificationData.recipient,
    populated,
    unreadCount,
  );

  return { notificationId };
}

function startNotificationWorker() {
  const concurrency = Number(
    process.env.NOTIFICATION_WORKER_CONCURRENCY || "5",
  );
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("NOTIFICATION_WORKER_CONCURRENCY must be a positive integer.");
  }

  const worker = createWorker(
    "notifications",
    processNotificationJob,
    { concurrency },
  );
  worker.on("completed", (job) => {
    console.log(`[notification-queue] completed job ${job.id}`);
  });
  worker.on("failed", (job, error) => {
    console.error(
      `[notification-queue] failed job ${job?.id || "unknown"}:`,
      error.message,
    );
  });
  worker.on("error", (error) => {
    console.error("[notification-queue] worker error:", error.message);
  });
  return worker;
}

module.exports = { processNotificationJob, startNotificationWorker };

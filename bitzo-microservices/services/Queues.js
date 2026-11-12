const { randomBytes } = require("node:crypto");
const { getRedisClient, getServiceDependency } = require("./redis");

const queues = new Map();
const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

function getQueueConnection() {
  const connection = getRedisClient({ forQueue: true });
  if (!connection) {
    throw new Error("REDIS_URL is required to create a background queue.");
  }
  return connection;
}

function createQueue(name, options = {}) {
  if (typeof name !== "string" || !name.trim()) {
    throw new TypeError("A queue name is required.");
  }
  const { Queue } = getServiceDependency("bullmq");
  return new Queue(name, {
    ...options,
    defaultJobOptions: {
      ...defaultJobOptions,
      ...options.defaultJobOptions,
    },
    connection: getQueueConnection(),
  });
}

function getQueue(name) {
  if (!queues.has(name)) queues.set(name, createQueue(name));
  return queues.get(name);
}

async function closeQueues() {
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  queues.clear();
}

function createWorker(name, processor, options = {}) {
  if (typeof name !== "string" || !name.trim()) {
    throw new TypeError("A queue name is required.");
  }
  if (typeof processor !== "function") {
    throw new TypeError("A queue worker processor function is required.");
  }
  const { Worker } = getServiceDependency("bullmq");
  return new Worker(name, processor, {
    ...options,
    connection: getQueueConnection(),
  });
}

function createNotificationJob(notification) {
  return {
    ...notification,
    notificationId: randomBytes(12).toString("hex"),
  };
}

async function enqueueNotification(notification) {
  if (!notification?.recipient || !notification.type) {
    throw new TypeError("Notification recipient and type are required.");
  }

  const data = createNotificationJob(notification);
  return getQueue("notifications").add("create-notification", data, {
    jobId: data.notificationId,
  });
}

async function enqueueBulkNotifications(notifications) {
  if (!Array.isArray(notifications)) {
    throw new TypeError("Notifications must be an array.");
  }
  if (notifications.length === 0) return [];
  if (notifications.some((item) => !item?.recipient || !item.type)) {
    throw new TypeError("Every notification needs a recipient and type.");
  }

  const jobs = notifications.map((notification) => {
    const data = createNotificationJob(notification);
    return {
      name: "create-notification",
      data,
      opts: { jobId: data.notificationId },
    };
  });
  return getQueue("notifications").addBulk(jobs);
}

module.exports = {
  createQueue,
  createWorker,
  closeQueues,
  enqueueBulkNotifications,
  enqueueNotification,
  getQueue,
};

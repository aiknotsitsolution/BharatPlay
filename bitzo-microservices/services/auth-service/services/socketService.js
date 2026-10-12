let io = null;

function attachSocketServer(socketServer) {
  io = socketServer;

  io.on("connection", (socket) => {
    const userId = socket.authenticatedUserId;
    if (userId) socket.join(`user:${userId}`);
  });
}

function emitTrustScoreUpdated(userId, scoreLog, trustTier, adAccess) {
  if (!io || !userId || !scoreLog) return;
  io.to(`user:${userId}`).emit("trust-score-updated", {
    userId: String(userId),
    trustScore: scoreLog.newScore,
    previousScore: scoreLog.previousScore,
    changeAmount: scoreLog.changeAmount,
    eventType: scoreLog.eventType,
    reason: scoreLog.reason,
    trustTier,
    adAccess,
    updatedAt: scoreLog.createdAt || new Date(),
  });
}

function emitNotificationCreated(userId, notification, unreadCount) {
  if (!io || !userId || !notification) return;
  io.to(`user:${userId}`).emit("notification-created", {
    notification,
    unreadCount,
  });
}

function emitNotificationRead(
  userId,
  notificationId,
  unreadCount,
  markAll = false,
) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit("notification-read", {
    notificationId: notificationId || null,
    unreadCount,
    markAll,
  });
}

module.exports = {
  attachSocketServer,
  emitTrustScoreUpdated,
  emitNotificationCreated,
  emitNotificationRead,
};

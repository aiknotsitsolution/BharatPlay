const AuditEvent = require("../models/AuditEvent");

/**
 * Fire-and-forget audit event logger.
 * Never throws — failures are silently logged to console.
 */
async function logAuditEvent({
  userId = null,
  eventType,
  ip,
  deviceId,
  userAgent,
  metadata = {},
}) {
  try {
    await AuditEvent.create({
      userId,
      eventType,
      ip,
      deviceId,
      userAgent,
      metadata,
    });
  } catch (err) {
    console.error("Failed to log audit event:", err.message);
  }
}

module.exports = { logAuditEvent };

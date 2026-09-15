const CopyrightStrike = require("../models/CopyrightStrike");
const CopyrightCase = require("../models/CopyrightCase");
const { logAuditEvent } = require("../services/auditEventService");

/**
 * Finds all active strikes whose expiresAt has passed,
 * marks them as "expired", and logs an audit event for each.
 *
 * Runs once at startup and then every 6 hours.
 */
async function expireStrikes() {
  try {
    const now = new Date();

    const expiredStrikes = await CopyrightStrike.find({
      status: "active",
      expiresAt: { $lte: now },
    }).lean();

    if (expiredStrikes.length === 0) return;

    console.log(`[StrikeExpiry] Expiring ${expiredStrikes.length} overdue strike(s)`);

    for (const strike of expiredStrikes) {
      await CopyrightStrike.findByIdAndUpdate(strike._id, {
        $set: { status: "expired" },
        $push: {
          statusHistory: {
            from: "active",
            to: "expired",
            changedBy: null,
            reason: "Strike expired automatically (90-day period elapsed)",
            timestamp: now,
          },
        },
      });

      // Log audit event (fire-and-forget)
      logAuditEvent({
        userId: strike.user,
        eventType: "COPYRIGHT_STRIKE_EXPIRED",
        metadata: {
          strikeId: strike._id,
          caseId: strike.case,
          expiresAt: strike.expiresAt,
        },
      }).catch(() => {});
    }

    console.log(`[StrikeExpiry] Successfully expired ${expiredStrikes.length} strike(s)`);
  } catch (err) {
    console.error("[StrikeExpiry] Error during strike expiry sweep:", err);
  }
}

/**
 * Start the background job.
 * Runs once immediately after a short delay (to let the server finish booting),
 * then every 6 hours.
 */
function startStrikeExpiryJob() {
  // First run after 30 seconds (let the server finish booting)
  setTimeout(expireStrikes, 30 * 1000);

  // Then every 6 hours
  setInterval(expireStrikes, 6 * 60 * 60 * 1000);

  console.log("[StrikeExpiry] Background job scheduled (every 6h)");
}

module.exports = { startStrikeExpiryJob };

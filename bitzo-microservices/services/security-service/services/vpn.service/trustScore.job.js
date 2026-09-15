const cron = require("node-cron");
const User = require("../../models/usermodel");
const FraudEvent = require("../../models/FraudEventModel");
const { TRUST_RULES, changeTrustScore } = require("../trustScoreService");

let trustScoreJobRunning = false;

function startTrustScoreJob() {
  cron.schedule(
    "5 0 * * *",
    async () => {
      if (trustScoreJobRunning) {
        console.warn("[TrustScore Job] Skipping overlapping run");
        return;
      }

      trustScoreJobRunning = true;
      const startedAt = Date.now();

      try {
        console.log("[TrustScore Job] Running...");

        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const users = await User.find({}).select("_id").lean();

        for (const user of users) {
          const events = await FraudEvent.find({
            userId: user._id,
            createdAt: { $gte: last24h },
          }).select("eventType riskScoreImpact");

          const hasRisk = events.some(
            (event) =>
              Number(event.riskScoreImpact) > 0 ||
              [
                "RAPID_ACTIONS",
                "SUSPICIOUS_BEHAVIOR",
                "HIGH_RISK_ACTION",
              ].includes(event.eventType),
          );
          if (!hasRisk) {
            await changeTrustScore({
              userId: user._id,
              changeAmount: TRUST_RULES.CLEAN_24H,
              eventType: "CLEAN_24H",
              reason: "No fraud events detected in the last 24 hours",
              eventKey: `clean-24h:${user._id}:${new Date().toISOString().slice(0, 10)}`,
            });
          }
        }

        console.log(
          `[TrustScore Job] Completed in ${Date.now() - startedAt}ms`,
        );
      } catch (err) {
        console.error("[TrustScore Job] Error:", err.message);
      } finally {
        trustScoreJobRunning = false;
      }
    },
    { timezone: "Asia/Kolkata" },
  );
}

module.exports = { startTrustScoreJob };

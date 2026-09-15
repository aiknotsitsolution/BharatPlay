const FraudEvent = require("../../models/FraudEventModel");
const { TRUST_RULES, changeTrustScore } = require("../trustScoreService");

const TRUST_EVENT_BY_FRAUD_EVENT = {
  RAPID_ACTIONS: "RAPID_CLICKS",
  SUSPICIOUS_BEHAVIOR: "ABNORMAL_BEHAVIOR",
  HIGH_RISK_ACTION: "POLICY_ABUSE",
  BOT: "BOT",
  POLICY_ABUSE: "POLICY_ABUSE",
  REPEATED_LOOPS: "REPEATED_LOOPS",
};

async function logFraudEvent({
  userId = null,
  eventType,
  severity = "medium",
  ip,
  deviceId,
  userAgent,
  isVPN = false,
  isProxy = false,
  riskScoreImpact = 0,
  metadata = {},
}) {
  try {
    const fraudEvent = await FraudEvent.create({
      userId,
      eventType,
      severity,
      ip,
      deviceId,
      userAgent,
      isVPN,
      isProxy,
      riskScoreImpact,
      metadata,
    });
    const trustEventType = TRUST_EVENT_BY_FRAUD_EVENT[eventType];
    if (userId && trustEventType) {
      await applyTrustRule(userId, trustEventType, eventType, {
        deviceId,
        ipAddress: ip,
        eventKey: `fraud:${fraudEvent._id}`,
        metadata,
      });
    }
  } catch (err) {
    console.error("Failed to log fraud event:", err.message);
  }
}

async function analyzeBehavior(userId) {
  if (!userId) return { riskPoints: 0, reasons: [] };

  const last15Min = new Date(Date.now() - 15 * 60 * 1000);
  const last1Hour = new Date(Date.now() - 60 * 60 * 1000);

  const recent = await FraudEvent.find({
    userId,
    createdAt: { $gte: last1Hour },
  }).lean();

  let riskPoints = 0;
  const reasons = [];

  const failedLogins = recent.filter(
    (e) => e.eventType === "LOGIN_FAILED",
  ).length;
  if (failedLogins >= 5) {
    riskPoints += 35;
    reasons.push("Multiple failed logins");
  }

  if (recent.length >= 25) {
    riskPoints += 25;
    reasons.push("Abnormally high activity");
  }

  const vpnEvents = recent.filter((e) => e.isVPN || e.isProxy).length;
  if (vpnEvents >= 1) {
    riskPoints += 20;
    reasons.push("VPN/Proxy detected");
  }

  const uniqueDevices = new Set(recent.map((e) => e.deviceId).filter(Boolean));
  if (uniqueDevices.size > 2) {
    riskPoints += 20;
    reasons.push("Multiple devices in short time");
  }

  return { riskPoints, reasons };
}

async function applyRiskToUser(userId, riskPoints, reasons = []) {
  if (!userId || riskPoints <= 0) return;
  const result = await changeTrustScore({
    userId,
    changeAmount: -riskPoints,
    eventType: "ABNORMAL_BEHAVIOR",
    reason: reasons.join(", ") || "Abnormal behavior detected",
    source: "automatic",
    metadata: { riskPoints, reasons },
  });

  if (riskPoints >= 20) {
    await logFraudEvent({
      userId,
      eventType: "TRUST_SCORE_DROP",
      severity: riskPoints >= 40 ? "high" : "medium",
      riskScoreImpact: riskPoints,
      metadata: { reasons, newScore: result?.newScore ?? null },
    });
  }
}

async function applyTrustRule(userId, eventType, reason, context = {}) {
  const amount = TRUST_RULES[eventType];
  if (!Number.isFinite(amount)) return null;
  return changeTrustScore({
    userId,
    changeAmount: amount,
    eventType,
    reason,
    ...context,
  });
}

module.exports = {
  logFraudEvent,
  analyzeBehavior,
  applyRiskToUser,
  applyTrustRule,
};

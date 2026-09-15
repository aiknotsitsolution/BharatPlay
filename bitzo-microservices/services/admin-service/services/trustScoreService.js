const User = require("../models/usermodel");
const TrustScoreLog = require("../models/TrustScoreLog");
const Device = require("../models/Device");
const { emitTrustScoreUpdated } = require("./socketService");

const TRUST_RULES = Object.freeze({
  SESSION_OVER_3_MIN: 1,
  VIDEO_COMPLETION_OVER_60: 2,
  REWARDED_AD: 1,
  CLEAN_24H: 1,
  RAPID_CLICKS: -5,
  ABNORMAL_BEHAVIOR: -4,
  REPEATED_LOOPS: -3,
  DEVICE_CHANGE: -3,
  BOT: -20,
  POLICY_ABUSE: -30,
});

const clampScore = (score) => Math.max(0, Math.min(100, Number(score) || 0));

function getTrustTier(score) {
  const value = clampScore(score);
  if (value >= 70) return "premium";
  if (value >= 40) return "medium";
  return "restricted";
}

function getAdAccess(score) {
  const tier = getTrustTier(score);
  return {
    tier,
    fullAds: tier === "premium",
    limitedAds: tier === "medium",
    rewardedAds: tier !== "restricted",
  };
}

async function changeTrustScore({
  userId,
  changeAmount,
  eventType,
  reason,
  deviceId = null,
  ipAddress = null,
  source = "automatic",
  eventKey = null,
  metadata = null,
}) {
  if (!userId || !eventType || !Number.isFinite(Number(changeAmount)))
    return null;
  const amount = Number(changeAmount);

  if (eventKey) {
    const existing = await TrustScoreLog.findOne({ userId, eventKey }).lean();
    if (existing) return existing;
  }

  let appliedAmount = amount;
  if (amount > 0 && eventType === "CLEAN_24H") {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const recovered = await TrustScoreLog.aggregate([
      {
        $match: {
          userId,
          eventType: "CLEAN_24H",
          createdAt: { $gte: dayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$changeAmount" } } },
    ]);
    appliedAmount = Math.min(
      amount,
      Math.max(0, 10 - (recovered[0]?.total || 0)),
    );
    if (appliedAmount <= 0) return null;
  }

  const user = await User.findById(userId).select("trustScore trustTier");
  if (!user) return null;
  const previousScore = clampScore(user.trustScore ?? 50);
  const newScore = clampScore(previousScore + appliedAmount);
  if (newScore === previousScore) return null;

  user.trustScore = newScore;
  user.trustTier = getTrustTier(newScore);
  await user.save();
  await Device.updateMany(
    { linked_user_id: userId },
    { $set: { trust_score: newScore } },
  );

  try {
    const scoreLog = await TrustScoreLog.create({
      userId,
      previousScore,
      changeAmount: newScore - previousScore,
      newScore,
      change: newScore - previousScore,
      eventType,
      reason: reason || eventType,
      deviceId,
      ipAddress,
      source,
      metadata,
      eventKey,
    });
    emitTrustScoreUpdated(
      userId,
      scoreLog,
      user.trustTier,
      getAdAccess(newScore),
    );
    return scoreLog;
  } catch (error) {
    if (error?.code === 11000 && eventKey) {
      return TrustScoreLog.findOne({ userId, eventKey }).lean();
    }
    throw error;
  }
}

module.exports = { TRUST_RULES, getTrustTier, getAdAccess, changeTrustScore };

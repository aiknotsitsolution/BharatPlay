const AdImpression = require("../models/VidooAds/AdImpression");
const AdNetwork = require("../models/VidooAds/AdNetwork");
const mongoose = require("mongoose");
const User = require("../models/usermodel");
const TrustScoreLog = require("../models/TrustScoreLog");
const {
  TRUST_RULES,
  getAdAccess,
  changeTrustScore,
} = require("./trustScoreService");

const { getAdFromWaterfall } = require("./waterfallService");

const AD_FREQUENCY_CAP_MS = 10 * 60 * 1000;

// GET /v1/player/manifest/:video_id
const getPlayerManifest = async (req, res) => {
  try {
    const { video_id } = req.params;

    if (!video_id) {
      return res.status(400).json({
        success: false,
        message: "video_id is required",
      });
    }

    const user = req.user?.id
      ? await User.findById(req.user.id).select("trustScore")
      : null;
    const adAccess = getAdAccess(user?.trustScore ?? 50);
    if (req.user?.id) {
      const recentImpression = await AdImpression.findOne({
        userId: req.user.id,
        event: "impression",
        createdAt: { $gte: new Date(Date.now() - AD_FREQUENCY_CAP_MS) },
      })
        .sort({ createdAt: -1 })
        .select("createdAt")
        .lean();
      if (recentImpression) {
        return res.status(200).json({
          success: true,
          videoId: video_id,
          adAvailable: false,
          adAccess,
          nextAdAvailableAt: new Date(
            recentImpression.createdAt.getTime() + AD_FREQUENCY_CAP_MS,
          ),
          message: "Ad frequency limit reached",
        });
      }
    }

    const result = await getAdFromWaterfall();

    if (!result) {
      return res.status(200).json({
        success: true,
        videoId: video_id,
        adAvailable: false,
        adAccess,
        message: "No advertisement available",
      });
    }

    const { network, vast } = result;

    return res.status(200).json({
      success: true,

      videoId: video_id,

      adAvailable: true,
      adAccess,

      ad: {
        networkId: network._id,
        networkName: network.name,
        provider: network.provider,

        vastUrl: vast.vastUrl,

        vastXml: vast.xml,
      },
    });
  } catch (error) {
    console.error("Manifest Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get ad manifest",
    });
  }
};

// POST /v1/player/ad-impression
const trackAdImpression = async (req, res) => {
  try {
    const {
      videoId,
      adId,
      networkId,
      event = "impression",
      sessionId,
      deviceId,
    } = req.body;

    if (!videoId || !networkId) {
      return res.status(400).json({
        success: false,
        message: "videoId and networkId are required",
      });
    }
    if (
      ![
        "impression",
        "start",
        "25%",
        "50%",
        "75%",
        "complete",
        "skip",
        "error",
      ].includes(event)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ad event.",
      });
    }
    if (event === "impression" && req.user?.id) {
      const recentImpression = await AdImpression.exists({
        userId: req.user.id,
        event: "impression",
        createdAt: { $gte: new Date(Date.now() - AD_FREQUENCY_CAP_MS) },
      });
      if (recentImpression) {
        return res.status(429).json({
          success: false,
          code: "AD_FREQUENCY_LIMIT",
          message: "Only one advertisement may be played every 10 minutes.",
        });
      }
    }

    const network = await AdNetwork.findById(networkId);

    if (!network) {
      return res.status(404).json({
        success: false,
        message: "Ad network not found",
      });
    }

    const impression = await AdImpression.create({
      videoId,
      adId: adId || null,
      networkId,
      event,
      sessionId: sessionId || null,
      deviceId: deviceId || null,
      userId: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Ad impression tracked successfully",

      data: {
        id: impression._id,
        videoId: impression.videoId,
        adId: impression.adId,
        networkId: impression.networkId,
        event: impression.event,
        createdAt: impression.createdAt,
      },
    });
  } catch (error) {
    console.error("Impression Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to track ad impression",
    });
  }
};
const completeRewardedAd = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { videoId, adId, sessionId } = req.body || {};
    if (!userId || !videoId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "videoId and sessionId are required",
      });
    }

    const user = await User.findById(userId).select("trustScore rewardFrozen");
    if (user?.rewardFrozen) {
      return res.status(403).json({
        success: false,
        code: "REWARDS_FROZEN",
        message:
          "Rewards are temporarily frozen due to suspicious device activity",
      });
    }
    const adAccess = getAdAccess(user?.trustScore ?? 50);
    if (!adAccess.rewardedAds) {
      return res
        .status(403)
        .json({ success: false, code: "REWARDED_ADS_DISABLED", adAccess });
    }

    const eventKey = `rewarded-ad:${userId}:${sessionId}`;
    const alreadyRewarded = await TrustScoreLog.findOne({
      userId,
      eventKey,
    }).lean();
    if (alreadyRewarded) {
      return res
        .status(409)
        .json({ success: false, message: "Reward already granted" });
    }

    const scoreLog = await changeTrustScore({
      userId,
      changeAmount: TRUST_RULES.REWARDED_AD,
      eventType: "REWARDED_AD",
      reason: "Completed a rewarded advertisement",
      deviceId: req.headers["x-device-id"] || null,
      ipAddress: req.ip,
      eventKey,
      metadata: { videoId, adId: adId || null, sessionId },
    });
    await User.updateOne({ _id: userId }, { $inc: { rewardPoints: 1 } });
    return res.status(200).json({
      success: true,
      rewardPointsAdded: 1,
      trustScore: scoreLog?.newScore,
    });
  } catch (error) {
    console.error("Rewarded ad error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to grant rewarded ad" });
  }
};

const deleteUserAdData = async (req, res) => {
  const { userId } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(String(userId || ""))) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required.",
    });
  }

  try {
    await AdImpression.deleteMany({ userId });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[account-deletion] Ad data cleanup failed:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete the account's ad data.",
    });
  }
};

module.exports = {
  getPlayerManifest,
  trackAdImpression,
  completeRewardedAd,
  deleteUserAdData,
};

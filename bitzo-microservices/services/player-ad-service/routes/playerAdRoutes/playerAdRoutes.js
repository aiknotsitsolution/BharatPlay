const express = require("express");

const {
  getPlayerManifest,
  trackAdImpression,
  completeRewardedAd,
} = require("../../services/playerAdController");
const isAuthenticated = require("../../middlewares/isAuthenticated");
const optionalAuth = require("../../middlewares/optionalAuth");

const router = express.Router();

router.get("/manifest/:video_id", optionalAuth, getPlayerManifest);

router.post("/ad-impression", trackAdImpression);

router.post("/rewarded-complete", isAuthenticated, completeRewardedAd);

module.exports = router;

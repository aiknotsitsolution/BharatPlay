const express = require("express");

const {
  getPlayerManifest,
  trackAdImpression,
  completeRewardedAd,
  deleteUserAdData,
} = require("../../services/playerAdController");
const isAuthenticated = require("../../middlewares/isAuthenticated");
const optionalAuth = require("../../middlewares/optionalAuth");
const internalServiceAuth = require("../../middlewares/internalServiceAuth");

const router = express.Router();

router.get("/manifest/:video_id", optionalAuth, getPlayerManifest);

router.post("/ad-impression", optionalAuth, trackAdImpression);
router.delete("/account-data", internalServiceAuth, deleteUserAdData);

router.post("/rewarded-complete", isAuthenticated, completeRewardedAd);

module.exports = router;

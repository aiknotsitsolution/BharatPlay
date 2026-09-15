const express = require("express");
const router = express.Router();
const { getLeaderboard } = require("../controller/leaderboardController");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.get("/", isAuthenticated, getLeaderboard);

module.exports = router;

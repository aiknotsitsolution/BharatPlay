const express = require("express");
const HashtagStats = require("../../models/CategoryModel/HashtagStats");
const { protect, adminOnly } = require("../middleware/auth");
const {
  graduateHashtag,
  checkAndConvertHashtags,
} = require("../../config/categoryConverter");
const router = express.Router();

// Get all flagged hashtags
router.get("/flagged-hashtags", protect, adminOnly, async (req, res) => {
  try {
    const flagged = await HashtagStats.find({
      isFlagged: true,
      isGraduated: false,
    }).sort({ last15DaysCount: -1 });
    res.json(flagged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manually trigger threshold check
router.post("/check-hashtags", protect, adminOnly, async (req, res) => {
  try {
    await checkAndConvertHashtags();
    res.json({ message: "Hashtag check completed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Graduate a hashtag to main category
router.post("/graduate/:hashtag", protect, adminOnly, async (req, res) => {
  try {
    const newCategory = await graduateHashtag(req.params.hashtag);
    res.json({
      message: `#${req.params.hashtag} successfully graduated to main category`,
      category: newCategory,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

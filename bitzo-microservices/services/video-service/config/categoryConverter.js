const HashtagStats = require("../models/CategoryModel/HashtagStats");
const Category = require("../models/CategoryModel/category.model");
const Video = require("../models/Videomodel");

const checkAndConvertHashtags = async () => {
  const threshold = parseInt(process.env.HASHTAG_THRESHOLD, 10) || 50;
  const days = parseInt(process.env.HASHTAG_DAYS) || 15;
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all non-graduated hashtags
  const stats = await HashtagStats.find({ isGraduated: false });

  for (const stat of stats) {
    // Count videos in last X days
    const recentVideos = await Video.find({
      hashtags: stat.hashtag,
      createdAt: { $gte: cutoffDate },
      isCreativeCorner: true,
    });

    stat.last15DaysCount = recentVideos.length;
    stat.videosLast15Days = recentVideos.map((v) => v._id);
    await stat.save();

    // Threshold crossed → Flag
    if (stat.last15DaysCount >= threshold && !stat.isFlagged) {
      stat.isFlagged = true;
      await stat.save();
      console.log(
        `🚩 FLAG: #${stat.hashtag} crossed ${threshold} videos in ${days} days`,
      );
    }
  }
};

// Admin can promote flagged hashtag to main category
const graduateHashtag = async (hashtag) => {
  const stat = await HashtagStats.findOne({
    hashtag: hashtag.toLowerCase(),
    isFlagged: true,
  });
  if (!stat) throw new Error("Hashtag not flagged or already graduated");

  // Create new main category
  const newCategory = await Category.create({
    name: hashtag.charAt(0).toUpperCase() + hashtag.slice(1),
    slug: hashtag.toLowerCase(),
    isMain: true,
    isCreativeCorner: false,
    createdFromHashtag: hashtag,
  });

  // Update all Creative Corner videos with this hashtag
  await Video.updateMany(
    { hashtags: hashtag.toLowerCase(), isCreativeCorner: true },
    {
      $set: {
        category: newCategory._id,
        isCreativeCorner: false,
      },
    },
  );

  // Mark as graduated
  stat.isGraduated = true;
  stat.graduatedCategory = newCategory._id;
  await stat.save();

  return newCategory;
};

module.exports = { checkAndConvertHashtags, graduateHashtag };

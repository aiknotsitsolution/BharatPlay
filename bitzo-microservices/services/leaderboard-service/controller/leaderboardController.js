const Channel = require("../models/Channel/ChannelModel");
const Video = require("../models/Videomodel");
const User = require("../models/usermodel");

// NOTE ON CROSS-SERVICE JOINS
// ----------------------------------------------------------------------
// Channel/Video live in video-service's database; User lives in
// auth-service's database (see ../config/connections.js). MongoDB's
// $lookup only works within a single database, so the original
// monolith's `$lookup: { from: "users", ... }` stages (which worked
// because everything shared one DB) are replaced here with an
// application-level join: aggregate within the video DB first, then
// fetch the matching Users separately and merge in JS.
// ----------------------------------------------------------------------

exports.getLeaderboard = async (req, res) => {
  try {
    const { videoType } = req.query;
    const videoMatch =
      videoType === "short" || videoType === "long" ? { videoType } : {};

    // ---------- Top creators (by total subscribers) ----------
    const creatorDocs = await Channel.aggregate([
      {
        $group: {
          _id: "$creator",
          totalSubscribers: {
            $sum: { $size: { $ifNull: ["$subscribedBy", []] } },
          },
          channels: {
            $push: {
              name: "$name",
              channelImage: "$channelImage",
              subs: { $size: { $ifNull: ["$subscribedBy", []] } },
            },
          },
        },
      },
      { $sort: { totalSubscribers: -1, _id: 1 } },
      { $limit: 10 },
    ]);

    const creatorIds = creatorDocs.map((doc) => doc._id).filter(Boolean);
    const creatorUsers = await User.find({ _id: { $in: creatorIds } })
      .select("name avatar rewardPoints trustScore")
      .lean();
    const creatorUserMap = new Map(
      creatorUsers.map((user) => [String(user._id), user]),
    );

    const topCreators = creatorDocs.map((doc, index) => {
      const bestChannel = (doc.channels || []).reduce(
        (best, channel) =>
          !best || channel.subs > best.subs ? channel : best,
        null,
      );
      const user = creatorUserMap.get(String(doc._id));
      return {
        id: doc._id,
        name: user?.name ?? null,
        avatar: user?.avatar ?? null,
        channelName: bestChannel?.name ?? null,
        totalSubscribers: doc.totalSubscribers || 0,
        rewardPoints: user?.rewardPoints ?? 0,
        trustScore: user?.trustScore ?? 0,
        rank: index + 1,
      };
    });

    // ---------- Top videos (by views) ----------
    // Video + Channel are both in video-service's DB, so this $lookup
    // still works fine (single-database join).
    const videoDocs = await Video.aggregate([
      { $match: videoMatch },
      { $sort: { views: -1, _id: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "channels",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
        },
      },
      { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },
    ]);

    const videoCreatorIds = videoDocs
      .map((doc) => doc.channel?.creator)
      .filter(Boolean);
    const videoCreatorUsers = await User.find({
      _id: { $in: videoCreatorIds },
    })
      .select("name")
      .lean();
    const videoCreatorMap = new Map(
      videoCreatorUsers.map((user) => [String(user._id), user]),
    );

    const topVideos = videoDocs.map((doc, index) => {
      const creator = videoCreatorMap.get(String(doc.channel?.creator));
      return {
        id: doc._id,
        title: doc.title,
        thumbnail: doc.thumbnail ?? null,
        views: doc.views || 0,
        channelName: doc.channel?.name ?? null,
        creatorName: creator?.name ?? null,
        videoType: Array.isArray(doc.videoType)
          ? (doc.videoType[0] ?? null)
          : (doc.videoType ?? null),
        rank: index + 1,
      };
    });

    res.status(200).json({
      success: true,
      data: { topCreators, topVideos },
    });
  } catch (error) {
    console.error("getLeaderboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

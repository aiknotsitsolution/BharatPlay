const Video = require("../../models/Videomodel");
const User = require("../../models/usermodel");

const MAX_SEARCH_LENGTH = 100;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.searchVideos = async (req, res) => {
  try {
    const raw = (req.query.q || "").slice(0, MAX_SEARCH_LENGTH).trim();
    if (!raw) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = { $regex: escapeRegex(raw), $options: "i" };

    const videos = await Video.find({ title: regex })
      .select("title thumbnail videoUrl videoType uploadedBy channel")
      .populate({ path: "uploadedBy", select: "name email", model: User })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const result = videos.map((v) => ({
      _id: v._id,
      title: v.title,
      thumbnail: v.thumbnail || null,
      uploaderName: v.uploadedBy?.name || "Unknown",
      uploaderId: v.uploadedBy?._id || null,
      videoType: v.videoType,
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("searchVideos error:", err.message);
    return res.status(500).json({ success: false, message: "Search failed" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const raw = (req.query.q || "").slice(0, MAX_SEARCH_LENGTH).trim();
    if (!raw) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = { $regex: escapeRegex(raw), $options: "i" };

    const users = await User.find({
      $or: [{ name: regex }, { email: regex }],
    })
      .select("name email role avatar")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error("searchUsers error:", err.message);
    return res.status(500).json({ success: false, message: "Search failed" });
  }
};

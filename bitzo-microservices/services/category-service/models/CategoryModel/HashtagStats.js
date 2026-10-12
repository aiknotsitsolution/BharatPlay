const mongoose = require("mongoose");

const hashtagStatsSchema = new mongoose.Schema({
  hashtag: { type: String, required: true, unique: true, lowercase: true },
  videoCount: { type: Number, default: 0 },
  uniqueCreators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  last15DaysCount: { type: Number, default: 0 },
  videosLast15Days: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  isFlagged: { type: Boolean, default: false },
  isGraduated: { type: Boolean, default: false },
  graduatedCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HashtagStats", hashtagStatsSchema);

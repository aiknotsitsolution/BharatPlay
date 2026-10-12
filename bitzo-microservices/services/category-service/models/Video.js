const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hashtags: [{ type: String, lowercase: true, trim: true }],
    isCreativeCorner: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "videos" },
);

module.exports = mongoose.model("Video", videoSchema);

const mongoose = require("mongoose");

const watchSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    sessionId: {
      type: String,
      required: true,
      maxlength: 64,
    },

    videoType: {
      type: String,
      enum: ["short", "long"],
      default: "long",
    },

    duration: {
      type: Number,
      min: 0,
      default: 0,
    },

    watchedSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    watchedPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

watchSessionSchema.index({ userId: 1, startedAt: -1 });
watchSessionSchema.index({ startedAt: -1 });
watchSessionSchema.index({ lastActiveAt: -1 });
watchSessionSchema.index(
  { userId: 1, videoId: 1, sessionId: 1 },
  { unique: true },
);

module.exports = mongoose.model("WatchSession", watchSessionSchema);

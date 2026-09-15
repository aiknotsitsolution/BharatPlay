const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "subscribe",
        "like",
        "comment",
        "upload",
        // Copyright notifications
        "copyright_takedown_received",
        "copyright_takedown_approved",
        "copyright_takedown_rejected",
        "copyright_strike_received",
        "copyright_dispute_filed",
        "copyright_dispute_resolved",
        "copyright_case_assigned",
        "copyright_case_resolved",
      ],
      required: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

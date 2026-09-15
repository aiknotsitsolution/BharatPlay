const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },

    videoType: [
      {
        type: String,
        enum: ["short", "long"],
      },
    ],

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    thumbnail: {
      type: String,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      min: 0,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    dislikesCount: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

   viewers: [
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    watchedPercent: {
      type: Number,
      default: 0,
    },
    counted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
],


    

    // Moderation status
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },

    disabledAt: { type: Date, default: null },
    disabledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    disableReason: { type: String, default: null },

    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    deleteReason: { type: String, default: null },

    // ✅ ANONYMOUS COMMENTS
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        userName: {
          type: String,
          default: "",
        },
        userImage: {
          type: String,
          default: null,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

videoSchema.index({ createdAt: -1 });
videoSchema.index({ videoType: 1, createdAt: -1 });
videoSchema.index({ channel: 1, createdAt: -1 });
videoSchema.index({ creator: 1, createdAt: -1 });
videoSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Video", videoSchema);

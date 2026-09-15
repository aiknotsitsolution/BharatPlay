const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    channeldescription: {
      type: String,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    channelImage: {
      type: String,
      default: "",
    },

    channelBanner: {
      type: String,
      default: "",
    },

    contactemail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    videoUrl: {
      type: String,
      default: "",
    },

    subscribe: [{ type: String }],

    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    subscribedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // creator and owner are the same — using one consistent field
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Moderation status
    status: {
      type: String,
      enum: ["active", "disabled", "banned"],
      default: "active",
      index: true,
    },

    disabledAt: { type: Date, default: null },
    disabledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    disableReason: { type: String, default: null },

    bannedAt: { type: Date, default: null },
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    banReason: { type: String, default: null },

    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    deleteReason: { type: String, default: null },
  },
  { timestamps: true },
);

channelSchema.index({ creator: 1, createdAt: -1 });

module.exports = mongoose.model("Channel", channelSchema);

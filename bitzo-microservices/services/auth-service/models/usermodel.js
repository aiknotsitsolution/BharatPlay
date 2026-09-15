const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },

    role: {
      type: String,
      enum: ["viewer", "creator", "admin"],
      default: "creator",
    },

    deviceId: {
      type: String,
      // unique: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    advertisingId: {
      type: String,
      default: null,
      index: true,
    },

    deviceFingerprint: {
      type: String,
      default: null,
      index: true,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    country: {
      type: String,
      default: null,
    },

    timezone: {
      type: String,
      default: null,
    },

    simMcc: {
      type: String,
      default: null,
    },

    deviceVerified: {
      type: Boolean,
      default: false,
    },

    vpnDetected: {
      type: Boolean,
      default: false,
    },

    proxyDetected: {
      type: Boolean,
      default: false,
    },

    trustTier: {
      type: String,
      default: "medium",
      trim: true,
    },

    googleId: String,

    // Password reset (only a hash of the single-use token is stored)
    resetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
    },

    // Forgot Password OTP (stored as SHA-256 hash)
    resetOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },

    // Avatar
    avatar: {
      type: String, // URL
      default: null,
    },

    avatarFileId: {
      type: String,
      default: null,
      select: false,
    },

    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumWithdrawal: {
      type: Number,
      default: 100,
      min: 0,
    },

    withdrawalStatus: {
      type: String,
      enum: ["none", "pending", "processing", "completed", "rejected"],
      default: "none",
    },

    // All channels created by this user
    channels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
      },
    ],

    // All videos uploaded by this user
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    likedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    dislikedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    subscribedChannels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
      },
    ],

    watchLaterVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    viewedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    rewardPoints: {
      type: Number,
      default: 10,
      min: 0,
    },

    rewardFrozen: {
      type: Boolean,
      default: false,
      index: true,
    },

    rewardFrozenAt: {
      type: Date,
      default: null,
    },

    rewardFreezeReason: {
      type: String,
      default: null,
    },

    // Account status (Phase 1 — User 360°)
    status: {
      type: String,
      enum: ["active", "suspended", "banned", "deleted"],
      default: "active",
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastActivityAt: {
      type: Date,
      default: null,
    },

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    suspendReason: {
      type: String,
      default: null,
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    banReason: {
      type: String,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    deleteReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

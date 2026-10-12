const mongoose = require("mongoose");

const userDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    advertisingId: {
      type: String,
      default: null,
    },
    deviceFingerprint: {
      type: String,
      default: null,
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
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

userDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model("UserDevice", userDeviceSchema);

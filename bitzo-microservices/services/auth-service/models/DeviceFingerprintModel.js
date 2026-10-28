const mongoose = require("mongoose");

const deviceFingerprintSchema = new mongoose.Schema(
  {
    deviceId: { type: String, unique: true, index: true }, // server-issued device id
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      index: true,
    },
    fingerprint: String, // client-side FingerprintJS visitorId (optional)
    browserDeviceFingerprint: { type: String, default: null },
    userAgent: String,
    lastIp: String,
    associatedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    riskScore: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    pendingOtp: { type: String, default: null },
    pendingOtpFingerprint: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpPurpose: {
      type: String,
      enum: ["login", "register", "device", "phone"],
      default: null,
    },
    pendingOtpEmail: { type: String, default: null },
    lastOtpSentAt: { type: Date, default: null },
    lastSeen: Date,
  },
  { timestamps: true },
);

deviceFingerprintSchema.index(
  { browserDeviceFingerprint: 1 },
  {
    unique: true,
    partialFilterExpression: { browserDeviceFingerprint: { $type: "string" } },
  },
);

module.exports = mongoose.model("DeviceFingerprint", deviceFingerprintSchema);

const mongoose = require("mongoose");

const phoneOtpSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    purpose: {
      type: String,
      enum: [
        "login",
        "signup",
        "email-binding",
        "profile-phone",
        "legacy-email",
        "legacy-phone",
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    otpHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    sendWindowStartedAt: { type: Date, default: Date.now },
    sendsInWindow: { type: Number, default: 1 },
    lastSentAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

phoneOtpSchema.index({ subject: 1, purpose: 1 }, { unique: true });
phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("PhoneOtp", phoneOtpSchema);

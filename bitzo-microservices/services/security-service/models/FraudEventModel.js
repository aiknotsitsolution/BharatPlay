const mongoose = require("mongoose");

const fraudEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "REGISTER",
        "DEVICE_CLAIM",
        "DEVICE_FINGERPRINT",
        "PASSWORD_RESET",
        "PASSWORD_CHANGE",
        "VPN_DETECTED",
        "PROXY_DETECTED",
        "RAPID_ACTIONS",
        "MULTIPLE_FAILED_LOGINS",
        "SUSPICIOUS_BEHAVIOR",
        "HIGH_RISK_ACTION",
        "TRUST_SCORE_DROP",
        "BOT",
        "POLICY_ABUSE",
        "ABNORMAL_BEHAVIOR",
        "REPEATED_LOOPS",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    ip: String,
    deviceId: String,
    userAgent: String,
    isVPN: { type: Boolean, default: false },
    isProxy: { type: Boolean, default: false },
    riskScoreImpact: { type: Number, default: 0 }, // negative impact
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

fraudEventSchema.index({ userId: 1, createdAt: -1 });
fraudEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FraudEvent", fraudEventSchema);

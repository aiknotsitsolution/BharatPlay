const mongoose = require("mongoose");

const trustScoreLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    previousScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    newScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    changeAmount: {
      type: Number,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    change: {
      type: Number,
      default: null,
    },
    reason: {
      type: String,
      default: null,
      trim: true,
    },
    source: {
      type: String,
      default: null,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    eventKey: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true, collection: "trust_score_logs" },
);

trustScoreLogSchema.index({ userId: 1, createdAt: -1 });
trustScoreLogSchema.index(
  { userId: 1, eventKey: 1 },
  { unique: true, partialFilterExpression: { eventKey: { $type: "string" } } },
);

module.exports = mongoose.model("TrustScoreLog", trustScoreLogSchema);

const mongoose = require("mongoose");

// Refresh-token sessions. Only a SHA-256 hash of the token is persisted,
// never the raw token. One session per login; rotation creates a child and
// revokes the parent.
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    kind: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    // Set on rotation: this session was replaced by another session.
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Set on rotation: this session was created from this parent session.
    rotatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL cleanup for expired sessions (MongoDB removes docs automatically).
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);

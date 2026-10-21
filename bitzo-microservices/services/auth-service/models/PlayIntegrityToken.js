const mongoose = require("mongoose");

const playIntegrityTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "play_integrity_tokens" },
);

module.exports = mongoose.model(
  "PlayIntegrityToken",
  playIntegrityTokenSchema,
);

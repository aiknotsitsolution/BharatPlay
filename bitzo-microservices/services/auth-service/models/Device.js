const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    linked_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    ssaid: { type: String, default: null, index: true, trim: true },
    device_name: { type: String, default: null, trim: true, maxlength: 200 },
    is_flagged: { type: Boolean, default: false, index: true },
    trust_score: { type: Number, default: 50, min: 0, max: 100 },
    last_login: { type: Date, default: null },
    clone_detected: { type: Boolean, default: false },
    clone_reason: { type: String, default: null },
    play_integrity_verified: { type: Boolean, default: false },
    installation_path: { type: String, default: null },
  },
  { timestamps: true, collection: "devices" },
);

deviceSchema.index(
  { linked_user_id: 1, device_id: 1 },
  { unique: true, sparse: true },
);
deviceSchema.index({ ssaid: 1, linked_user_id: 1 });

module.exports = mongoose.model("Device", deviceSchema);

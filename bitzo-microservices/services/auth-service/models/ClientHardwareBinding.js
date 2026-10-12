const mongoose = require("mongoose");

const clientHardwareBindingSchema = new mongoose.Schema(
  {
    clientHardwareUuid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "ClientHardwareBinding",
  clientHardwareBindingSchema,
);

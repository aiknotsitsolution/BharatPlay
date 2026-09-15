const mongoose = require("mongoose");

const adFillRateSchema = new mongoose.Schema(
  {
    networkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdNetwork",
      required: true,
      unique: true,
    },

    requests: {
      type: Number,
      default: 0,
    },

    filled: {
      type: Number,
      default: 0,
    },

    fillRate: {
      type: Number,
      default: 0,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model(
  "AdFillRate",
  adFillRateSchema
);
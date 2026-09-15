const mongoose = require("mongoose");

const adImpressionSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      index: true,
    },

    adId: {
      type: String,
      default: null,
    },

    networkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdNetwork",
      required: true,
    },

    event: {
      type: String,
      enum: [
        "impression",
        "start",
        "25%",
        "50%",
        "75%",
        "complete",
        "skip",
        "error",
      ],
      default: "impression",
    },

    sessionId: {
      type: String,
      default: null,
    },

    deviceId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AdImpression",
  adImpressionSchema
);
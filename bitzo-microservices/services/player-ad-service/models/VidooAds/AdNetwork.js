const mongoose = require("mongoose");

const adNetworkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    provider: {
      type: String,
      required: true,
      trim: true,
    },

    vastUrl: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: Number,
      default: 1,
    },

    timeout: {
      type: Number,
      default: 5000,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdNetwork", adNetworkSchema);
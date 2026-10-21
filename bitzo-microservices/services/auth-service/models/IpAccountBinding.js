const mongoose = require("mongoose");

const ipAccountBindingSchema = new mongoose.Schema(
  {
    ipHash: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "ip_account_bindings" },
);

ipAccountBindingSchema.index({ ipHash: 1 }, { unique: true });

module.exports = mongoose.model("IpAccountBinding", ipAccountBindingSchema);

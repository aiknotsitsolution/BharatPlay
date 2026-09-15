const mongoose = require("mongoose");

const copyrightStrikeSchema = new mongoose.Schema(
  {
    // User who received the strike
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Case that triggered this strike
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightCase",
      required: true,
    },

    // Content that was struck
    content: {
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
      },
      title: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Strike status
    status: {
      type: String,
      enum: [
        "active",     // Strike counts against user
        "expired",    // Strike has expired (e.g., after 90 days)
        "disputed",   // Strike is being disputed
        "removed",    // Strike was removed (e.g., after successful dispute)
      ],
      default: "active",
      index: true,
    },

    // Strike reason / details
    reason: {
      type: String,
      trim: true,
      default: "",
    },

    // Expiry date (configurable, default 90 days)
    expiresAt: {
      type: Date,
      required: true,
    },

    // Dispute details (if user disputes the strike)
    dispute: {
      filed: { type: Boolean, default: false },
      filedAt: { type: Date, default: null },
      reason: { type: String, trim: true, default: "" },
      additionalInfo: { type: String, trim: true, default: "" },
      resolvedAt: { type: Date, default: null },
      outcome: {
        type: String,
        enum: ["upheld", "overturned", null],
        default: null,
      },
    },

    // Admin who issued the strike
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // Admin who resolved/disputed/removed the strike
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // Status history for audit trail
    statusHistory: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          default: null,
        },
        reason: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
copyrightStrikeSchema.index({ user: 1, status: 1 });
copyrightStrikeSchema.index({ expiresAt: 1 });
copyrightStrikeSchema.index({ case: 1 });

module.exports = mongoose.model("CopyrightStrike", copyrightStrikeSchema);

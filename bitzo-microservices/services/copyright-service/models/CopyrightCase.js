const mongoose = require("mongoose");

// Embedded evidence subdocument
const copyrightEvidenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "url",
        "document",
        "screenshot",
        "legal_notice",
        "ownership_proof",
        "other",
      ],
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { _id: true, timestamps: true }
);

const copyrightCaseSchema = new mongoose.Schema(
  {
    // Case identifier (auto-generated human-readable ID)
    caseNumber: {
      type: String,
      unique: true,
      index: true,
    },

    // How this case was created
    source: {
      type: String,
      enum: ["admin_creation", "public_submission"],
      required: true,
      default: "admin_creation",
      index: true,
    },

    // Claimant information (who filed the copyright claim)
    claimant: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
      address: {
        type: String,
        trim: true,
        default: "",
      },
      organization: {
        type: String,
        trim: true,
        default: "",
      },
      relationship: {
        type: String,
        enum: ["owner", "authorized_representative", "agent", "other"],
        default: "owner",
      },
      declaration: {
        type: Boolean,
        default: false,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // Content under dispute
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
      url: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // User who uploaded the content (respondent)
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Copyright claim details
    claim: {
      type: {
        type: String,
        enum: [
          "takedown",
          "infringement",
          "counter_notification",
          "dispute",
        ],
        required: true,
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
      originalWork: {
        type: String,
        trim: true,
        default: "",
      },
      originalWorkUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Case status (lifecycle state machine)
    status: {
      type: String,
      enum: [
        "pending",                     // Initial state, awaiting review
        "under_review",                // Assigned to admin/support for review
        "more_information_required",   // Admin needs more info from claimant
        "action_pending",              // Decision made, action being executed
        "takedown_approved",           // Takedown was approved
        "takedown_rejected",           // Takedown was rejected
        "disputed",                    // User filed a counter-notification/dispute
        "dispute_under_review",        // Dispute is being reviewed
        "dispute_upheld",              // Dispute rejected, takedown stands
        "dispute_overturned",          // Dispute accepted, content restored
        "resolved",                    // Final state, case closed
        "withdrawn",                   // Claimant withdrew the claim
      ],
      default: "pending",
      index: true,
    },

    // Claimant submission metadata (for public submissions)
    claimantIP: {
      type: String,
      default: null,
    },
    claimantUserAgent: {
      type: String,
      default: null,
    },

    // Assigned reviewer (admin/support)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Evidence documents (embedded)
    evidence: [copyrightEvidenceSchema],

    // Resolution details
    resolution: {
      decision: {
        type: String,
        enum: [
          "takedown_approved",
          "takedown_rejected",
          "dispute_upheld",
          "dispute_overturned",
          "withdrawn",
          null,
        ],
        default: null,
      },
      reason: {
        type: String,
        trim: true,
        default: "",
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
    },

    // Linked strike (created when takedown is approved)
    strike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyrightStrike",
      default: null,
    },

    // Status history for audit trail
    statusHistory: [
      {
        from: { type: String, default: "" },
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

    // Notes (internal admin notes)
    notes: [
      {
        text: { type: String, required: true, trim: true },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
copyrightCaseSchema.index({ respondent: 1, createdAt: -1 });
copyrightCaseSchema.index({ status: 1, createdAt: -1 });
copyrightCaseSchema.index({ "content.video": 1 });
copyrightCaseSchema.index({ assignedTo: 1, status: 1 });
copyrightCaseSchema.index({ priority: 1, status: 1, createdAt: -1 });
copyrightCaseSchema.index({ source: 1, status: 1 });
copyrightCaseSchema.index({ "claimant.email": 1, createdAt: -1 });

module.exports = mongoose.model("CopyrightCase", copyrightCaseSchema);

const mongoose = require("mongoose");

const deletionRequestSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [200, "Email must be 200 characters or fewer"],
    },
    accountIdentifier: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Account identifier must be 200 characters or fewer"],
    },
    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Reason must be 1000 characters or fewer"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "processing", "completed", "rejected"],
      default: "pending",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    assignedTo: {
      type: String, // "assoc_1" … "assoc_5"
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    assignedBy: {
      type: String, // "system" | adminId
      default: null,
    },
  },
  { timestamps: true }
);

deletionRequestSchema.index({ email: 1 });
deletionRequestSchema.index({ status: 1 });
deletionRequestSchema.index({ createdAt: -1 });
deletionRequestSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
deletionRequestSchema.index({ inquiryType: 1, assignedTo: 1 });

module.exports = mongoose.model("DeletionRequest", deletionRequestSchema);

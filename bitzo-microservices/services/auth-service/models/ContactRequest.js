const mongoose = require("mongoose");

const contactRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name must be 100 characters or fewer"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [200, "Email must be 200 characters or fewer"],
    },
    inquiryType: {
      type: String,
      required: [true, "Inquiry type is required"],
      enum: [
        "General Inquiry",
        "Technical Support",
        "Privacy Request",
        "Data Deletion",
        "Complaint",
        "Business Inquiry",
        "Other",
        "Copyright",
        "Account",
        "Billing",
      ],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [150, "Subject must be 150 characters or fewer"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [5000, "Message must be 5000 characters or fewer"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved", "closed"],
      default: "pending",
    },
    adminReply: {
      type: String,
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
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

contactRequestSchema.index({ email: 1 });
contactRequestSchema.index({ status: 1 });
contactRequestSchema.index({ createdAt: -1 });
contactRequestSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
contactRequestSchema.index({ inquiryType: 1, assignedTo: 1 });

module.exports = mongoose.model("ContactRequest", contactRequestSchema);

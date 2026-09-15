const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "finance", "support", "read-only"],
      default: "admin",
      required: true,
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },

    countryCode: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfJoining: {
      type: Date,
      default: null,
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Admin", adminSchema);

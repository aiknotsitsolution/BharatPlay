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

    // Password reset (only a hash of the single-use token is stored)
    resetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
    },

    // Forgot Password OTP (bcrypt-hashed)
    resetOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },

    loginOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    loginOtpExpires: {
      type: Date,
      default: null,
    },
    loginOtpAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = require("../../config/connections")
  .authDB()
  .model("Admin", adminSchema);

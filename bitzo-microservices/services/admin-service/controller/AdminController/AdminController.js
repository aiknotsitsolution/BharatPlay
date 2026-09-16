const User = require("../../models/admin/AdminModel");
const AllUser = require("../../models/usermodel");
const Video = require("../../models/Videomodel");
const Channel = require("../../models/Channel/ChannelModel");
const RefreshToken = require("../../models/RefreshToken");
const imagekit = require("../../utils/imagekit.js");
const WatchSession = require("../../models/WatchSession");
const AuditEvent = require("../../models/AuditEvent");
const Notification = require("../../models/NotificationModel");
const DeviceFingerprint = require("../../models/DeviceFingerprintModel");
const FraudEvent = require("../../models/FraudEventModel");
const transporter = require("../../Email/nodemailer.js");
const getAddEmployeeMailOptions = require("../../Email/addEmployee.js");
const getRemoveEmployeeMailOptions = require("../../Email/removeEmployee.js");
const getPasswordResetMailOptions = require("../../Email/password.js");
const getPasswordChangeConfirmationMailOptions = require("../../Email/passwordReset.js");
const getLoginMailOptions = require("../../Email/login.js");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} = require("../../utils/tokenService");
const {
  ADMIN_REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../../utils/refreshCookie");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { logAuditEvent } = require("../../services/auditEventService");
const { changeTrustScore } = require("../../services/trustScoreService");

const VALID_ROLES = ["viewer", "creator", "admin"];
const MAX_SEARCH_LENGTH = 100;

// Channel state transitions
const CHANNEL_VALID_TRANSITIONS = {
  active: ["disabled", "banned"],
  disabled: ["active", "banned"],
  banned: ["active"],
};

// Video state transitions
const VIDEO_VALID_TRANSITIONS = {
  active: ["disabled"],
  disabled: ["active"],
};

function isValidObjectId(id) {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const sendMailSafely = async (mailOptions) => {
  if (!mailOptions?.to || !transporter?.sendMail) {
    return { sent: false, reason: "mailer-not-configured" };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error("Email send failed:", error.message);
    return { sent: false, reason: error.message };
  }
};

exports.registrationStatus = async (_req, res) => {
  try {
    const envKey = process.env.ADMIN_REGISTER_KEY;
    const isDev = process.env.NODE_ENV !== "production";

    const available = !!envKey || isDev;

    return res.status(200).json({
      success: true,
      registrationAvailable: available,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      registrationAvailable: false,
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, registerKey } = req.body;

    // Admin registration gate:
    // Production requires ADMIN_REGISTER_KEY to be configured in the environment.
    // The key's existence IS the gate — its value is never sent to the client.
    // Backward compatibility: if registerKey is provided, validate it against the env key.
    const envKey = process.env.ADMIN_REGISTER_KEY;
    const isDev = process.env.NODE_ENV !== "production";

    if (registerKey !== undefined && registerKey !== "") {
      // Legacy flow: client sends the key explicitly
      if (typeof registerKey !== "string" || registerKey !== envKey) {
        return res.status(403).json({
          success: false,
          message: "Admin registration requires a valid setup key",
        });
      }
    } else {
      // New flow: key existence in env is the gate
      if (!envKey && !isDev) {
        return res.status(403).json({
          success: false,
          message:
            "Admin registration is not configured. Contact your system administrator.",
        });
      }
    }

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Email check
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: signAccessToken({ userId: user._id, role: user.role }),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const rawSearch = (req.query.search || "").slice(0, MAX_SEARCH_LENGTH);
    const search = rawSearch.trim();

    const filter = {
      status: { $ne: "deleted" },
      ...(search
        ? {
            $or: [
              { name: { $regex: escapeRegex(search), $options: "i" } },
              { email: { $regex: escapeRegex(search), $options: "i" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      AllUser.find(filter)
        .select(
          "name email role avatar trustScore rewardPoints createdAt status lastLoginAt lastActivityAt channels videos",
        )
        .populate({
          path: "channels",
          select: "name handle channelImage createdAt",
          model: Channel,
          populate: {
            path: "videos",
            select: "title thumbnail likesCount views createdAt",
            options: { limit: 4, sort: { createdAt: -1 } },
          },
        })
        .populate({
          path: "videos",
          select: "title thumbnail likesCount views createdAt channel",
          options: { limit: 4, sort: { createdAt: -1 } },
          model: Video,
          populate: {
            path: "channel",
            select: "name handle",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AllUser.countDocuments(filter),
    ]);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formattedUsers = users.map((user) => {
      if (user.avatar && !user.avatar.startsWith("http")) {
        user.avatar = `${baseUrl}/${user.avatar}`;
      }

      const channels = (user.channels || []).map((ch) => {
        if (ch.channelImage && !ch.channelImage.startsWith("http")) {
          ch.channelImage = `${baseUrl}/${ch.channelImage}`;
        }

        const videos = (ch.videos || []).map((v) => {
          if (v.thumbnail && !v.thumbnail.startsWith("http")) {
            v.thumbnail = `${baseUrl}/${v.thumbnail}`;
          }
          return {
            ...v,
            channelName: ch.name || ch.handle || "ΓÇö",
          };
        });

        return {
          _id: ch._id,
          name: ch.name || "Unnamed Channel",
          handle: ch.handle || null,
          channelImage: ch.channelImage || null,
          createdAt: ch.createdAt,
          totalVideos: videos.length,
          videos,
        };
      });

      const videos = (user.videos || []).map((v) => {
        if (v.thumbnail && !v.thumbnail.startsWith("http")) {
          v.thumbnail = `${baseUrl}/${v.thumbnail}`;
        }
        return {
          ...v,
          channelName: v.channel?.name || v.channel?.handle || "ΓÇö",
        };
      });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trustScore: user.trustScore ?? 50,
        rewardPoints: user.rewardPoints ?? 0,
        createdAt: user.createdAt,
        status: user.status || "active",
        totalChannels: channels.length,
        totalVideos: videos.length,
        channels,
        videos,
      };
    });

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: formattedUsers,
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch users",
    });
  }
};

// GET single user with full details
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await AllUser.findById(id)
      .select(
        "name email role avatar trustScore rewardPoints createdAt status lastLoginAt lastActivityAt suspendedAt suspendedBy suspendReason channels videos",
      )
      .populate({
        path: "channels",
        select: "name handle channelImage createdAt",
        model: Channel,
        populate: {
          path: "videos",
          select: "title thumbnail likesCount views createdAt videoType",
          options: { sort: { createdAt: -1 } }, // full list (no limit)
        },
      })
      .populate({
        path: "videos",
        select: "title thumbnail likesCount views createdAt channel",
        options: { sort: { createdAt: -1 } },
        model: Video,
        populate: {
          path: "channel",
          select: "name handle",
        },
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Avatar
    if (user.avatar && !user.avatar.startsWith("http")) {
      user.avatar = `${baseUrl}/${user.avatar}`;
    }

    // Channels + their videos
    const channels = (user.channels || []).map((ch) => {
      if (ch.channelImage && !ch.channelImage.startsWith("http")) {
        ch.channelImage = `${baseUrl}/${ch.channelImage}`;
      }

      const videos = (ch.videos || []).map((v) => {
        if (v.thumbnail && !v.thumbnail.startsWith("http")) {
          v.thumbnail = `${baseUrl}/${v.thumbnail}`;
        }
        return {
          ...v,
          channelName: ch.name || ch.handle || "ΓÇö",
        };
      });

      return {
        _id: ch._id,
        name: ch.name || "Unnamed Channel",
        handle: ch.handle || null,
        channelImage: ch.channelImage || null,
        createdAt: ch.createdAt,
        totalVideos: videos.length,
        videos,
      };
    });

    // User's own videos
    const videos = (user.videos || []).map((v) => {
      if (v.thumbnail && !v.thumbnail.startsWith("http")) {
        v.thumbnail = `${baseUrl}/${v.thumbnail}`;
      }
      return {
        ...v,
        channelName: v.channel?.name || v.channel?.handle || "ΓÇö",
      };
    });

    const formattedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      trustScore: user.trustScore ?? 50,
      rewardPoints: user.rewardPoints ?? 0,
      createdAt: user.createdAt,
      status: user.status || "active",
      lastLoginAt: user.lastLoginAt || null,
      lastActivityAt: user.lastActivityAt || null,
      suspendedAt: user.suspendedAt || null,
      suspendedBy: user.suspendedBy || null,
      suspendReason: user.suspendReason || null,
      totalChannels: channels.length,
      totalVideos: videos.length,
      channels,
      videos,
    };

    res.status(200).json({
      success: true,
      data: formattedUser,
    });
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch user",
    });
  }
};

// ================== UPDATE USER ==================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, trustScore, rewardPoints } = req.body;
    let requestedTrustScore;

    // Validate user ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const user = await AllUser.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Name must be a non-empty string" });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must be 100 characters or less",
        });
      }
      user.name = name.trim();
    }

    // Validate email
    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email must be a non-empty string",
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format" });
      }
      // Check email uniqueness
      const emailExists = await AllUser.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email is already in use by another user",
        });
      }
      user.email = email.toLowerCase().trim();
    }

    // Validate role
    if (role !== undefined) {
      const validRoles = ["viewer", "creator", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        });
      }
      user.role = role;
    }

    // Validate trustScore (0ΓÇô100)
    if (trustScore !== undefined) {
      if (typeof trustScore !== "number" || !Number.isFinite(trustScore)) {
        return res
          .status(400)
          .json({ success: false, message: "Trust score must be a number" });
      }
      if (trustScore < 0 || trustScore > 100) {
        return res.status(400).json({
          success: false,
          message: "Trust score must be between 0 and 100",
        });
      }
      requestedTrustScore = trustScore;
    }

    // Validate rewardPoints (ΓëÑ 0)
    if (rewardPoints !== undefined) {
      if (typeof rewardPoints !== "number" || !Number.isFinite(rewardPoints)) {
        return res
          .status(400)
          .json({ success: false, message: "Reward points must be a number" });
      }
      if (rewardPoints < 0) {
        return res.status(400).json({
          success: false,
          message: "Reward points must be 0 or greater",
        });
      }
      user.rewardPoints = rewardPoints;
    }

    await user.save();

    if (
      requestedTrustScore !== undefined &&
      requestedTrustScore !== Number(user.trustScore ?? 50)
    ) {
      const scoreLog = await changeTrustScore({
        userId: user._id,
        changeAmount: requestedTrustScore - Number(user.trustScore ?? 50),
        eventType: "ADMIN_ADJUSTMENT",
        reason: "Trust score adjusted by an administrator",
        source: "admin",
        eventKey: `admin-adjustment:${user._id}:${Date.now()}`,
        metadata: { adminId: req.admin?._id || null },
      });
      if (scoreLog) user.trustScore = scoreLog.newScore;
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================== DELETE USER (soft-delete) ==================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin && req.admin._id;

    // Validate user ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    // Prevent admin from deleting themselves
    if (adminId && adminId.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await AllUser.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prevent deletion of other admins
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete admin accounts via this endpoint",
      });
    }

    // Soft-delete: mark status instead of destroying the document
    user.status = "deleted";
    user.deletedAt = new Date();
    user.deletedBy = adminId || null;
    user.deleteReason = req.body && req.body.reason ? req.body.reason : null;
    await user.save();

    logAuditEvent({
      userId: user._id,
      eventType: "ADMIN_USER_DELETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, reason: user.deleteReason },
    }).catch(() => {});

    // Notify the removed employee by email (best-effort)
    try {
      await sendMailSafely(
        getRemoveEmployeeMailOptions(
          user.email,
          user.name,
          user.role || "Employee",
          "Bharat Play",
        ),
      );
    } catch (mailError) {
      console.error("Delete user mail error:", mailError.message);
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================== GET DELETED USERS ==================
exports.getDeletedUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const rawSearch = (req.query.search || "").slice(0, MAX_SEARCH_LENGTH);
    const search = rawSearch.trim();

    const filter = {
      status: "deleted",
      ...(search
        ? {
            $or: [
              { name: { $regex: escapeRegex(search), $options: "i" } },
              { email: { $regex: escapeRegex(search), $options: "i" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      AllUser.find(filter)
        .select(
          "name email role avatar trustScore rewardPoints createdAt status deletedAt deletedBy deleteReason",
        )
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AllUser.countDocuments(filter),
    ]);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formattedUsers = users.map((user) => {
      if (user.avatar && !user.avatar.startsWith("http")) {
        user.avatar = `${baseUrl}/${user.avatar}`;
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trustScore: user.trustScore ?? 50,
        rewardPoints: user.rewardPoints ?? 0,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt || null,
        deletedBy: user.deletedBy || null,
        deleteReason: user.deleteReason || null,
      };
    });

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: formattedUsers,
    });
  } catch (err) {
    console.error("getDeletedUsers error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch deleted users",
    });
  }
};

// ================== HARD DELETE USER (permanent) ==================
exports.hardDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin && req.admin._id;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    if (adminId && adminId.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await AllUser.findOne({ _id: id, status: "deleted" });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not soft-deleted",
      });
    }

    const userSnapshot = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt,
    };

    // Clean up related references
    const channelIds = (user.channels || []).filter(Boolean);
    if (channelIds.length > 0) {
      await Channel.deleteMany({ _id: { $in: channelIds } });
    }

    const videoIds = (user.videos || []).filter(Boolean);
    if (videoIds.length > 0) {
      await Video.deleteMany({ _id: { $in: videoIds } });
      // Remove video references from channels that still exist
      await Channel.updateMany(
        { videos: { $in: videoIds } },
        { $pull: { videos: { $in: videoIds } } },
      );
    }

    // Remove user references from other users (subscriptions, likes, etc.)
    await AllUser.updateMany(
      { subscribedChannels: { $in: channelIds } },
      { $pull: { subscribedChannels: { $in: channelIds } } },
    );
    await AllUser.updateMany(
      { likedVideos: { $in: videoIds } },
      { $pull: { likedVideos: { $in: videoIds } } },
    );
    await AllUser.updateMany(
      { dislikedVideos: { $in: videoIds } },
      { $pull: { dislikedVideos: { $in: videoIds } } },
    );
    await AllUser.updateMany(
      { watchLaterVideos: { $in: videoIds } },
      { $pull: { watchLaterVideos: { $in: videoIds } } },
    );
    await AllUser.updateMany(
      { viewedVideos: { $in: videoIds } },
      { $pull: { viewedVideos: { $in: videoIds } } },
    );

    // Revoke all refresh tokens
    await RefreshToken.deleteMany({ userId: user._id });

    // Delete the user document
    await AllUser.deleteOne({ _id: id });

    // Audit log
    logAuditEvent({
      userId: user._id,
      eventType: "ADMIN_USER_HARD_DELETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        userName: userSnapshot.name,
        userEmail: userSnapshot.email,
        userRole: userSnapshot.role,
        userCreatedAt: userSnapshot.createdAt,
        userDeletedAt: userSnapshot.deletedAt,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "User permanently deleted",
    });
  } catch (err) {
    console.error("hardDeleteUser error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to permanently delete user",
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin && req.admin._id;

    // Validate user ID format
    if (!id || !isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    // Prevent admin from deleting themselves
    if (adminId && adminId.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const employee = await User.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Prevent deleting the primary owner account (role admin with lowest createdAt)
    const primaryOwner = await User.findOne({ role: "admin" }).sort({
      createdAt: 1,
    });
    if (primaryOwner && primaryOwner._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the primary owner account",
      });
    }

    // Prevent deleting the last remaining admin
    if (employee.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin account",
        });
      }
    }

    // Hard-delete the employee record
    await User.findByIdAndDelete(id);

    logAuditEvent({
      userId: id,
      eventType: "ADMIN_EMPLOYEE_DELETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, role: employee.role, email: employee.email },
    }).catch(() => {});

    // Notify the removed employee by email (best-effort)
    try {
      await sendMailSafely(
        getRemoveEmployeeMailOptions(
          employee.email,
          employee.name,
          employee.role || "Employee",
          "Bharat Play",
        ),
      );
    } catch (mailError) {
      console.error("Delete employee mail error:", mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (err) {
    console.error("deleteEmployee error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ================== USER OVERVIEW (360┬░) ==================
exports.getUserOverview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const user = await AllUser.findById(id)
      .select(
        "name email avatar role status trustScore rewardPoints createdAt updatedAt lastLoginAt lastActivityAt suspendedAt suspendedBy suspendReason googleId deviceId channels videos likedVideos dislikedVideos subscribedChannels watchLaterVideos viewedVideos",
      )
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Compute account info
    const account = {
      accountAge: Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      registrationMethod: user.googleId ? "google" : "email",
      hasGoogleAccount: !!user.googleId,
    };

    // Fetch channels with subscriber counts and video counts
    const channels = await Channel.find({ _id: { $in: user.channels || [] } })
      .select("name channelImage createdAt subscribedBy videos")
      .lean();

    const channelSummaries = channels.map((ch) => ({
      _id: ch._id,
      name: ch.name,
      channelImage: ch.channelImage || null,
      subscriberCount: (ch.subscribedBy || []).length,
      videoCount: (ch.videos || []).length,
      createdAt: ch.createdAt,
    }));

    // Fetch video metrics via aggregation + only 8 recent videos (no full fetch)
    const videoIds = user.videos || [];
    const [aggResult, recentVideos] = await Promise.all([
      videoIds.length
        ? Video.aggregate([
            { $match: { _id: { $in: videoIds } } },
            {
              $group: {
                _id: null,
                videoCount: { $sum: 1 },
                shortCount: {
                  $sum: {
                    $cond: [
                      {
                        $setIsSubset: [
                          ["short"],
                          { $ifNull: ["$videoType", []] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                totalViews: { $sum: { $ifNull: ["$views", 0] } },
                totalLikes: { $sum: { $ifNull: ["$likesCount", 0] } },
                totalComments: {
                  $sum: { $size: { $ifNull: ["$comments", []] } },
                },
              },
            },
          ]).then(
            (r) =>
              r[0] || {
                videoCount: 0,
                shortCount: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
              },
          )
        : Promise.resolve({
            videoCount: 0,
            shortCount: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
          }),
      videoIds.length
        ? Video.find({ _id: { $in: videoIds } })
            .select(
              "title thumbnail views likesCount comments channel createdAt videoType",
            )
            .sort({ createdAt: -1 })
            .limit(8)
            .lean()
        : Promise.resolve([]),
    ]);

    const { videoCount, shortCount, totalViews, totalLikes, totalComments } =
      aggResult;
    const recentVideosMapped = recentVideos.map((v) => ({
      _id: v._id,
      title: v.title,
      thumbnail: v.thumbnail || null,
      views: v.views || 0,
      likesCount: v.likesCount || 0,
      commentCount: (v.comments || []).length,
      channel: v.channel,
      videoType: v.videoType,
      createdAt: v.createdAt,
    }));

    // Engagement metrics (counts only ΓÇö no populated arrays returned)
    const engagement = {
      likedVideosCount: (user.likedVideos || []).length,
      dislikedVideosCount: (user.dislikedVideos || []).length,
      subscribedChannelsCount: (user.subscribedChannels || []).length,
      watchLaterCount: (user.watchLaterVideos || []).length,
      viewedVideosCount: (user.viewedVideos || []).length,
    };

    // Sanitized user object ΓÇö never expose internal fields
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
      status: user.status || "active",
      trustScore: user.trustScore ?? 50,
      rewardPoints: user.rewardPoints ?? 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt || null,
      lastActivityAt: user.lastActivityAt || null,
      suspendedAt: user.suspendedAt || null,
      suspendedBy: user.suspendedBy || null,
      suspendReason: user.suspendReason || null,
    };

    res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        account,
        content: {
          channelCount: channelSummaries.length,
          videoCount,
          shortCount,
          totalViews,
          totalLikes,
          totalComments,
        },
        engagement,
        channels: channelSummaries,
        recentVideos: recentVideosMapped,
      },
    });
  } catch (err) {
    console.error("getUserOverview error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch user overview",
    });
  }
};

// ================== ADMIN: USER CHANNELS ==================
exports.getAdminUserChannels = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const user = await AllUser.findById(id).select("channels").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50,
    );
    const skip = (page - 1) * limit;

    const channelIds = (user.channels || []).filter(Boolean);
    const filter = { _id: { $in: channelIds }, creator: id };

    if (req.query.search && typeof req.query.search === "string") {
      const rawSearch = req.query.search.slice(0, MAX_SEARCH_LENGTH).trim();
      if (rawSearch) {
        filter.name = { $regex: escapeRegex(rawSearch), $options: "i" };
      }
    }

    const [channels, total] = await Promise.all([
      Channel.find(filter)
        .select(
          "name channeldescription channelImage channelBanner category subscriberCount videos subscribedBy createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Channel.countDocuments(filter),
    ]);

    const channelIdsOnPage = channels.map((c) => c._id);

    const videoAgg = await Video.aggregate([
      { $match: { channel: { $in: channelIdsOnPage } } },
      {
        $group: {
          _id: "$channel",
          totalVideos: { $sum: 1 },
          totalShorts: {
            $sum: {
              $cond: [
                {
                  $setIsSubset: [
                    ["short"],
                    {
                      $cond: [
                        { $eq: [{ $type: "$videoType" }, "string"] },
                        ["$videoType"],
                        { $ifNull: ["$videoType", []] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
          totalLikes: { $sum: { $ifNull: ["$likesCount", 0] } },
          totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } },
        },
      },
    ]);

    const metricsMap = {};
    for (const agg of videoAgg) {
      metricsMap[agg._id.toString()] = {
        videoCount: agg.totalVideos,
        shortCount: agg.totalShorts,
        totalViews: agg.totalViews,
        totalLikes: agg.totalLikes,
        totalComments: agg.totalComments,
      };
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const enriched = channels.map((ch) => {
      const chImage =
        ch.channelImage && !ch.channelImage.startsWith("http")
          ? `${baseUrl}/${ch.channelImage}`
          : ch.channelImage || null;
      const banner =
        ch.channelBanner && !ch.channelBanner.startsWith("http")
          ? `${baseUrl}/${ch.channelBanner}`
          : ch.channelBanner || null;

      return {
        _id: ch._id,
        name: ch.name,
        channeldescription: ch.channeldescription || "",
        channelImage: chImage,
        channelBanner: banner,
        category: ch.category || null,
        subscriberCount: (ch.subscribedBy || []).length,
        videoCount: metricsMap[ch._id.toString()]?.videoCount || 0,
        shortCount: metricsMap[ch._id.toString()]?.shortCount || 0,
        totalViews: metricsMap[ch._id.toString()]?.totalViews || 0,
        totalLikes: metricsMap[ch._id.toString()]?.totalLikes || 0,
        totalComments: metricsMap[ch._id.toString()]?.totalComments || 0,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      items: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error("getAdminUserChannels error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch channels",
    });
  }
};

// ================== ADMIN: USER VIDEOS ==================
const VIDEO_SORT_FIELDS = { createdAt: 1, views: 1, likesCount: 1 };
const VIDEO_PAGE_SIZE = 12;
const VIDEO_MAX_PAGE_SIZE = 50;

exports.getAdminUserVideos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const user = await AllUser.findById(id).select("channels videos").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || VIDEO_PAGE_SIZE, 1),
      VIDEO_MAX_PAGE_SIZE,
    );
    const skip = (page - 1) * limit;

    const userVideoIds = (user.videos || []).filter(Boolean);
    const filter = {
      _id: { $in: userVideoIds },
      videoType: { $nin: ["short", ["short"]] },
    };

    // Channel ownership validation
    if (req.query.channelId) {
      const channelId = req.query.channelId;
      if (!/^[0-9a-fA-F]{24}$/.test(channelId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid channel ID format" });
      }
      const ownedChannelIds = (user.channels || []).map(String);
      if (!ownedChannelIds.includes(channelId)) {
        return res.status(403).json({
          success: false,
          message: "Channel does not belong to this user",
        });
      }
      filter.channel = channelId;
    }

    // Search
    if (req.query.search && typeof req.query.search === "string") {
      const rawSearch = req.query.search.slice(0, MAX_SEARCH_LENGTH).trim();
      if (rawSearch) {
        filter.title = { $regex: escapeRegex(rawSearch), $options: "i" };
      }
    }

    // Sorting
    const sortField = VIDEO_SORT_FIELDS[req.query.sortBy]
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .select(
          "title description thumbnail views likesCount dislikesCount channel duration videoType createdAt updatedAt",
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(filter),
    ]);

    const videoIds = videos.map((v) => v._id);
    const commentAgg = videoIds.length
      ? await Video.aggregate([
          { $match: { _id: { $in: videoIds } } },
          { $project: { count: { $size: { $ifNull: ["$comments", []] } } } },
        ])
      : [];
    const commentMap = {};
    for (const c of commentAgg) commentMap[c._id.toString()] = c.count;

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const items = videos.map((v) => {
      const thumb =
        v.thumbnail && !v.thumbnail.startsWith("http")
          ? `${baseUrl}/${v.thumbnail}`
          : v.thumbnail || null;
      return {
        _id: v._id,
        title: v.title,
        description: v.description || "",
        thumbnail: thumb,
        views: v.views || 0,
        likesCount: v.likesCount || 0,
        dislikesCount: v.dislikesCount || 0,
        commentCount: commentMap[v._id.toString()] || 0,
        channel: v.channel,
        duration: v.duration || 0,
        videoType: v.videoType,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error("getAdminUserVideos error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch videos",
    });
  }
};

// ================== ADMIN: USER SHORTS ==================
const SHORT_SORT_FIELDS = { createdAt: 1, views: 1, likesCount: 1 };

exports.getAdminUserShorts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const user = await AllUser.findById(id).select("channels videos").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || VIDEO_PAGE_SIZE, 1),
      VIDEO_MAX_PAGE_SIZE,
    );
    const skip = (page - 1) * limit;

    const userVideoIds = (user.videos || []).filter(Boolean);
    const filter = {
      _id: { $in: userVideoIds },
      videoType: { $in: ["short", ["short"]] },
    };

    // Channel ownership validation
    if (req.query.channelId) {
      const channelId = req.query.channelId;
      if (!/^[0-9a-fA-F]{24}$/.test(channelId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid channel ID format" });
      }
      const ownedChannelIds = (user.channels || []).map(String);
      if (!ownedChannelIds.includes(channelId)) {
        return res.status(403).json({
          success: false,
          message: "Channel does not belong to this user",
        });
      }
      filter.channel = channelId;
    }

    // Search
    if (req.query.search && typeof req.query.search === "string") {
      const rawSearch = req.query.search.slice(0, MAX_SEARCH_LENGTH).trim();
      if (rawSearch) {
        filter.title = { $regex: escapeRegex(rawSearch), $options: "i" };
      }
    }

    // Sorting
    const sortField = SHORT_SORT_FIELDS[req.query.sortBy]
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .select(
          "title description thumbnail views likesCount dislikesCount channel duration videoType createdAt updatedAt",
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(filter),
    ]);

    const videoIds = videos.map((v) => v._id);
    const commentAgg = videoIds.length
      ? await Video.aggregate([
          { $match: { _id: { $in: videoIds } } },
          { $project: { count: { $size: { $ifNull: ["$comments", []] } } } },
        ])
      : [];
    const commentMap = {};
    for (const c of commentAgg) commentMap[c._id.toString()] = c.count;

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const items = videos.map((v) => {
      const thumb =
        v.thumbnail && !v.thumbnail.startsWith("http")
          ? `${baseUrl}/${v.thumbnail}`
          : v.thumbnail || null;
      return {
        _id: v._id,
        title: v.title,
        description: v.description || "",
        thumbnail: thumb,
        views: v.views || 0,
        likesCount: v.likesCount || 0,
        dislikesCount: v.dislikesCount || 0,
        commentCount: commentMap[v._id.toString()] || 0,
        channel: v.channel,
        duration: v.duration || 0,
        videoType: v.videoType,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error("getAdminUserShorts error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch shorts",
    });
  }
};

// ================== ADMIN LOGIN ==================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "admin",
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Your account is disabled. Please contact the admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = signAccessToken({ userId: user._id, role: user.role });

    // ≡ƒöÑ COOKIE SET KARO
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Admin refresh session (rotated on refresh), stored httpOnly.
    const refreshTokenValue = signRefreshToken({
      sub: String(user._id),
      kind: "admin",
    });
    await RefreshToken.create({
      userId: user._id,
      kind: "admin",
      tokenHash: hashToken(refreshTokenValue),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    setRefreshCookie(res, refreshTokenValue, "admin");

    await sendMailSafely(getLoginMailOptions(user.email, user.name));

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================== ADMIN REFRESH ==================
exports.adminRefresh = async (req, res) => {
  try {
    const kind = "admin";
    const presented = req.cookies && req.cookies[ADMIN_REFRESH_COOKIE];

    if (!presented) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No refresh session" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(presented);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid refresh session",
      });
    }

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid refresh session",
      });
    }

    const tokenHash = hashToken(presented);
    const session = await RefreshToken.findOne({ tokenHash }).lean();

    if (!session || session.kind !== kind) {
      clearRefreshCookie(res, "admin");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session not found",
      });
    }

    // Rotated token being reused ΓåÆ revoke the whole admin session family.
    if (session.replacedBy) {
      await RefreshToken.updateMany(
        { userId: session.userId, kind },
        { $set: { revokedAt: new Date() } },
      );
      clearRefreshCookie(res, "admin");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session reused",
      });
    }

    if (session.revokedAt) {
      clearRefreshCookie(res, "admin");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session revoked",
      });
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await RefreshToken.deleteOne({ _id: session._id });
      clearRefreshCookie(res, "admin");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session expired",
      });
    }

    const admin = await User.findById(session.userId);
    if (!admin) {
      await RefreshToken.deleteOne({ _id: session._id });
      clearRefreshCookie(res, "admin");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Admin not found" });
    }

    // Rotate: revoke this session, create a child session.
    const newRefreshToken = signRefreshToken({ sub: String(admin._id), kind });
    const child = await RefreshToken.create({
      userId: admin._id,
      kind,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      rotatedFrom: session._id,
    });
    await RefreshToken.updateOne(
      { _id: session._id },
      { $set: { replacedBy: child._id, revokedAt: new Date() } },
    );

    const token = signAccessToken({ userId: admin._id, role: admin.role });
    setRefreshCookie(res, newRefreshToken, "admin");

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin refresh error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== ADMIN LOGOUT ==================
exports.adminLogout = async (req, res) => {
  try {
    const presented = req.cookies && req.cookies[ADMIN_REFRESH_COOKIE];
    if (presented) {
      await RefreshToken.updateOne(
        { tokenHash: hashToken(presented), kind: "admin", revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }

    clearRefreshCookie(res, "admin");
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res
      .status(200)
      .json({ success: true, message: "Admin logged out successfully" });
  } catch (error) {
    console.error("Admin logout error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const fs = require("fs");
const path = require("path");

// ================== USER ACTIVITY (Audit Events) ==================
exports.getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 25, eventType } = req.query;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const filter = { userId: id };
    if (eventType) filter.eventType = eventType;

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      AuditEvent.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditEvent.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getUserActivity error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER WATCH HISTORY ==================
exports.getUserWatchHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const sessions = await WatchSession.find({ userId: id })
      .populate(
        "videoId",
        "title thumbnail videoType views likesCount dislikesCount channel",
      )
      .sort({ startedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await WatchSession.countDocuments({ userId: id });

    return res.status(200).json({
      success: true,
      sessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getUserWatchHistory error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER SUBSCRIPTIONS ==================
exports.getUserSubscriptions = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await AllUser.findById(id)
      .populate({
        path: "subscribedChannels",
        select: "name channelImage subscribedBy creator",
        model: Channel,
        populate: { path: "creator", select: "name avatar", model: AllUser },
      })
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const subscriptions = (user.subscribedChannels || []).map((ch) => ({
      _id: ch._id,
      name: ch.name,
      channelImage: ch.channelImage,
      subscriberCount: (ch.subscribedBy || []).length,
      creator: ch.creator,
    }));

    return res
      .status(200)
      .json({ success: true, subscriptions, total: subscriptions.length });
  } catch (error) {
    console.error("getUserSubscriptions error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER LIKED VIDEOS ==================
exports.getUserLikedVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const likedIds = user.likedVideos || [];
    const total = likedIds.length;
    const paginatedIds = likedIds.slice(
      (Number(page) - 1) * Number(limit),
      Number(page) * Number(limit),
    );

    const videos = await Video.find({ _id: { $in: paginatedIds } })
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name avatar", model: AllUser })
      .lean();

    return res.status(200).json({
      success: true,
      videos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getUserLikedVideos error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER DISLIKED VIDEOS ==================
exports.getUserDislikedVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const dislikedIds = user.dislikedVideos || [];
    const total = dislikedIds.length;
    const paginatedIds = dislikedIds.slice(
      (Number(page) - 1) * Number(limit),
      Number(page) * Number(limit),
    );

    const videos = await Video.find({ _id: { $in: paginatedIds } })
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name avatar", model: AllUser })
      .lean();

    return res.status(200).json({
      success: true,
      videos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getUserDislikedVideos error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER WATCH LATER ==================
exports.getUserWatchLater = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const watchLaterIds = user.watchLaterVideos || user.watchLater || [];
    const total = watchLaterIds.length;
    const paginatedIds = watchLaterIds.slice(
      (Number(page) - 1) * Number(limit),
      Number(page) * Number(limit),
    );

    const videos = await Video.find({ _id: { $in: paginatedIds } })
      .populate("channel", "name channelImage")
      .populate({ path: "uploadedBy", select: "name avatar", model: AllUser })
      .lean();

    const videoMap = new Map(videos.map((v) => [v._id.toString(), v]));
    const ordered = paginatedIds
      .map((vid) => videoMap.get(vid.toString()))
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      videos: ordered,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getUserWatchLater error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER NOTIFICATIONS ==================
exports.getUserNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 25 } = req.query;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const filter = { recipient: id };
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate({ path: "actor", select: "name avatar", model: AllUser })
        .populate({ path: "video", select: "title thumbnail", model: Video })
        .populate({ path: "channel", select: "name channelImage", model: Channel })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getUserNotifications error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER DEVICES ==================
exports.getUserDevices = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const devices = await DeviceFingerprint.find({ userId: id })
      .select("-__v -pendingOtp -otpExpiresAt")
      .sort({ lastSeen: -1 })
      .lean();

    const activeSessions = await RefreshToken.countDocuments({
      userId: id,
      kind: "user",
      revokedAt: null,
    });

    return res.status(200).json({
      success: true,
      devices,
      activeSessions,
      currentDeviceId: user.deviceId || null,
    });
  } catch (error) {
    console.error("getUserDevices error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER FRAUD EVENTS ==================
exports.getUserFraudEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 25, severity } = req.query;

    const user = await AllUser.findById(id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const filter = { userId: id };
    if (severity) filter.severity = severity;

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total, severityCounts] = await Promise.all([
      FraudEvent.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      FraudEvent.countDocuments(filter),
      FraudEvent.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
    ]);

    const severityMap = {};
    severityCounts.forEach((s) => {
      severityMap[s._id] = s.count;
    });

    return res.status(200).json({
      success: true,
      events,
      severityCounts: severityMap,
      trustScore: user.trustScore,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getUserFraudEvents error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== USER ENGAGEMENT SUMMARY ==================
exports.getUserEngagement = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await AllUser.findById(id)
      .select(
        "likedVideos dislikedVideos subscribedChannels watchLaterVideos watchLater viewedVideos videos channels",
      )
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const [totalLikes, totalComments, totalViews] = await Promise.all([
      Video.countDocuments({ _id: { $in: user.likedVideos || [] } }),
      Video.countDocuments({ "comments.user": id }),
      WatchSession.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            totalSeconds: { $sum: "$watchedSeconds" },
            sessionCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const watchStats = totalViews[0] || { totalSeconds: 0, sessionCount: 0 };

    return res.status(200).json({
      success: true,
      engagement: {
        totalLikes: (user.likedVideos || []).length,
        totalDislikes: (user.dislikedVideos || []).length,
        totalSubscriptions: (user.subscribedChannels || []).length,
        totalWatchLater: (user.watchLaterVideos || user.watchLater || [])
          .length,
        totalViewedVideos: (user.viewedVideos || []).length,
        totalVideosUploaded: (user.videos || []).length,
        totalChannelsCreated: (user.channels || []).length,
        totalComments,
        totalWatchMinutes: Math.round(watchStats.totalSeconds / 60),
        totalSessions: watchStats.sessionCount,
      },
    });
  } catch (error) {
    console.error("getUserEngagement error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== MODERATION: STATE MACHINE ==================
const VALID_TRANSITIONS = {
  active: ["suspended", "banned", "deleted"],
  suspended: ["active", "banned", "deleted"],
  banned: ["active", "deleted"],
  deleted: ["active"],
};

// ================== MODERATION: SUSPEND ==================
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    if (adminId && adminId.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot suspend your own account",
      });
    }

    const user = await AllUser.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot suspend admin accounts" });
    }

    if (!VALID_TRANSITIONS[user.status]?.includes("suspended")) {
      return res.status(400).json({
        success: false,
        message: `Cannot suspend a user with status "${user.status}"`,
      });
    }

    user.status = "suspended";
    user.suspendedAt = new Date();
    user.suspendedBy = adminId || null;
    user.suspendReason = reason || null;

    // Clear ban fields if transitioning from banned
    user.bannedAt = null;
    user.bannedBy = null;
    user.banReason = null;

    await user.save();

    logAuditEvent({
      userId: user._id,
      eventType: "ADMIN_USER_SUSPEND",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, reason: reason || null },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "User suspended successfully",
      data: { status: user.status, suspendedAt: user.suspendedAt },
    });
  } catch (err) {
    console.error("suspendUser error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== MODERATION: RESTORE ==================
exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin && req.admin._id;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const user = await AllUser.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!VALID_TRANSITIONS[user.status]?.includes("active")) {
      return res.status(400).json({
        success: false,
        message: `Cannot restore a user with status "${user.status}"`,
      });
    }

    user.status = "active";

    // Clear suspension fields
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspendReason = null;

    // Clear ban fields
    user.bannedAt = null;
    user.bannedBy = null;
    user.banReason = null;

    // Clear deleted fields
    user.deletedAt = null;
    user.deletedBy = null;
    user.deleteReason = null;

    await user.save();

    logAuditEvent({
      userId: user._id,
      eventType: "ADMIN_USER_RESTORE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "User restored successfully",
      data: { status: user.status },
    });
  } catch (err) {
    console.error("restoreUser error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== MODERATION: BAN ==================
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    if (adminId && adminId.toString() === id) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot ban your own account" });
    }

    const user = await AllUser.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot ban admin accounts" });
    }

    if (!VALID_TRANSITIONS[user.status]?.includes("banned")) {
      return res.status(400).json({
        success: false,
        message: `Cannot ban a user with status "${user.status}"`,
      });
    }

    user.status = "banned";
    user.bannedAt = new Date();
    user.bannedBy = adminId || null;
    user.banReason = reason || null;

    // Clear suspension fields if transitioning from suspended
    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspendReason = null;

    await user.save();

    logAuditEvent({
      userId: user._id,
      eventType: "ADMIN_USER_BAN",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, reason: reason || null },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "User banned successfully",
      data: { status: user.status, bannedAt: user.bannedAt },
    });
  } catch (err) {
    console.error("banUser error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== CHANNEL MODERATION ==================

// Helper: validate channel ownership
async function validateChannelOwnership(userId, channelId) {
  if (!isValidObjectId(userId) || !isValidObjectId(channelId)) {
    return { error: "Invalid ID format" };
  }
  const user = await AllUser.findById(userId).select("channels").lean();
  if (!user) return { error: "User not found" };
  const ownedIds = (user.channels || []).map(String);
  if (!ownedIds.includes(channelId)) {
    return { error: "Channel does not belong to this user" };
  }
  const channel = await Channel.findById(channelId);
  if (!channel) return { error: "Channel not found" };
  return { channel, user };
}

// ================== DISABLE CHANNEL ==================
exports.disableChannel = async (req, res) => {
  try {
    const { id: userId, channelId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    const ownership = await validateChannelOwnership(userId, channelId);
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : 403,
        )
        .json({
          success: false,
          message: ownership.error,
        });
    }
    const { channel } = ownership;
    const prevStatus = channel.status || "active";

    if (!CHANNEL_VALID_TRANSITIONS[prevStatus]?.includes("disabled")) {
      return res.status(400).json({
        success: false,
        message: `Cannot disable a channel with status "${prevStatus}"`,
      });
    }

    channel.status = "disabled";
    channel.disabledAt = new Date();
    channel.disabledBy = adminId || null;
    channel.disableReason = reason || null;
    await channel.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_CHANNEL_DISABLE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        channelId,
        channelName: channel.name,
        prevStatus,
        reason: reason || null,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Channel disabled successfully",
      data: {
        channelId,
        status: channel.status,
        disabledAt: channel.disabledAt,
      },
    });
  } catch (err) {
    console.error("disableChannel error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== ENABLE CHANNEL ==================
exports.enableChannel = async (req, res) => {
  try {
    const { id: userId, channelId } = req.params;
    const adminId = req.admin && req.admin._id;

    const ownership = await validateChannelOwnership(userId, channelId);
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : 403,
        )
        .json({
          success: false,
          message: ownership.error,
        });
    }
    const { channel } = ownership;
    const prevStatus = channel.status || "active";

    if (!CHANNEL_VALID_TRANSITIONS[prevStatus]?.includes("active")) {
      return res.status(400).json({
        success: false,
        message: `Cannot enable a channel with status "${prevStatus}"`,
      });
    }

    channel.status = "active";
    channel.disabledAt = null;
    channel.disabledBy = null;
    channel.disableReason = null;
    await channel.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_CHANNEL_ENABLE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, channelId, channelName: channel.name, prevStatus },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Channel enabled successfully",
      data: { channelId, status: channel.status },
    });
  } catch (err) {
    console.error("enableChannel error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== BAN CHANNEL ==================
exports.banChannel = async (req, res) => {
  try {
    const { id: userId, channelId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    const ownership = await validateChannelOwnership(userId, channelId);
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : 403,
        )
        .json({
          success: false,
          message: ownership.error,
        });
    }
    const { channel } = ownership;
    const prevStatus = channel.status || "active";

    if (!CHANNEL_VALID_TRANSITIONS[prevStatus]?.includes("banned")) {
      return res.status(400).json({
        success: false,
        message: `Cannot ban a channel with status "${prevStatus}"`,
      });
    }

    channel.status = "banned";
    channel.bannedAt = new Date();
    channel.bannedBy = adminId || null;
    channel.banReason = reason || null;
    await channel.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_CHANNEL_BAN",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        channelId,
        channelName: channel.name,
        prevStatus,
        reason: reason || null,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Channel banned successfully",
      data: { channelId, status: channel.status, bannedAt: channel.bannedAt },
    });
  } catch (err) {
    console.error("banChannel error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== RESTORE CHANNEL ==================
exports.restoreChannel = async (req, res) => {
  try {
    const { id: userId, channelId } = req.params;
    const adminId = req.admin && req.admin._id;

    const ownership = await validateChannelOwnership(userId, channelId);
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : 403,
        )
        .json({
          success: false,
          message: ownership.error,
        });
    }
    const { channel } = ownership;
    const prevStatus = channel.status || "active";

    if (!CHANNEL_VALID_TRANSITIONS[prevStatus]?.includes("active")) {
      return res.status(400).json({
        success: false,
        message: `Cannot restore a channel with status "${prevStatus}"`,
      });
    }

    channel.status = "active";
    channel.disabledAt = null;
    channel.disabledBy = null;
    channel.disableReason = null;
    channel.bannedAt = null;
    channel.bannedBy = null;
    channel.banReason = null;
    await channel.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_CHANNEL_RESTORE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, channelId, channelName: channel.name, prevStatus },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Channel restored successfully",
      data: { channelId, status: channel.status },
    });
  } catch (err) {
    console.error("restoreChannel error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== DELETE CHANNEL ==================
exports.deleteChannel = async (req, res) => {
  try {
    const { id: userId, channelId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    const ownership = await validateChannelOwnership(userId, channelId);
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : 403,
        )
        .json({
          success: false,
          message: ownership.error,
        });
    }
    const { channel } = ownership;

    // Soft delete: mark status and record metadata
    channel.status = "disabled";
    channel.deletedAt = new Date();
    channel.deletedBy = adminId || null;
    channel.deleteReason = reason || null;
    await channel.save();

    // Remove channel reference from user
    await AllUser.updateOne(
      { _id: userId },
      { $pull: { channels: channelId } },
    );

    logAuditEvent({
      userId,
      eventType: "ADMIN_CHANNEL_DELETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        channelId,
        channelName: channel.name,
        reason: reason || null,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Channel deleted successfully",
      data: { channelId },
    });
  } catch (err) {
    console.error("deleteChannel error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== VIDEO/SHORT MODERATION ==================

// Helper: validate video ownership
async function validateVideoOwnership(userId, videoId, expectedType) {
  if (!isValidObjectId(userId) || !isValidObjectId(videoId)) {
    return { error: "Invalid ID format" };
  }
  const user = await AllUser.findById(userId).select("channels videos").lean();
  if (!user) return { error: "User not found" };

  const video = await Video.findById(videoId);
  if (!video) return { error: "Video not found" };

  // Verify video belongs to this user
  const userVideoIds = (user.videos || []).map(String);
  if (!userVideoIds.includes(videoId)) {
    return { error: "Video does not belong to this user" };
  }

  // Verify content type matches (short vs long)
  if (expectedType === "short") {
    const types = video.videoType || [];
    if (!(Array.isArray(types) ? types.includes("short") : types === "short")) {
      return { error: "Video is not a short" };
    }
  } else if (expectedType === "long") {
    const types = video.videoType || [];
    if (Array.isArray(types) ? types.includes("short") : types === "short") {
      return { error: "Video is not a long video" };
    }
  }

  return { video, user };
}

// ================== DISABLE VIDEO ==================
exports.disableVideo = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    const ownership = await validateVideoOwnership(userId, videoId, "long");
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : ownership.error === "Video not found"
                ? 404
                : ownership.error.includes("not a long")
                  ? 400
                  : 403,
        )
        .json({ success: false, message: ownership.error });
    }
    const { video } = ownership;
    const prevStatus = video.status || "active";

    if (!VIDEO_VALID_TRANSITIONS[prevStatus]?.includes("disabled")) {
      return res.status(400).json({
        success: false,
        message: `Cannot disable a video with status "${prevStatus}"`,
      });
    }

    video.status = "disabled";
    video.disabledAt = new Date();
    video.disabledBy = adminId || null;
    video.disableReason = reason || null;
    await video.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_VIDEO_DISABLE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        videoId,
        title: video.title,
        prevStatus,
        reason: reason || null,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Video disabled successfully",
      data: { videoId, status: video.status, disabledAt: video.disabledAt },
    });
  } catch (err) {
    console.error("disableVideo error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== ENABLE VIDEO ==================
exports.enableVideo = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const adminId = req.admin && req.admin._id;

    const ownership = await validateVideoOwnership(userId, videoId, "long");
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : ownership.error === "Video not found"
                ? 404
                : ownership.error.includes("not a long")
                  ? 400
                  : 403,
        )
        .json({ success: false, message: ownership.error });
    }
    const { video } = ownership;
    const prevStatus = video.status || "active";

    if (!VIDEO_VALID_TRANSITIONS[prevStatus]?.includes("active")) {
      return res.status(400).json({
        success: false,
        message: `Cannot enable a video with status "${prevStatus}"`,
      });
    }

    video.status = "active";
    video.disabledAt = null;
    video.disabledBy = null;
    video.disableReason = null;
    await video.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_VIDEO_ENABLE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, videoId, title: video.title, prevStatus },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Video enabled successfully",
      data: { videoId, status: video.status },
    });
  } catch (err) {
    console.error("enableVideo error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== DELETE VIDEO ==================
exports.deleteVideo = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    const ownership = await validateVideoOwnership(userId, videoId, "long");
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : ownership.error === "Video not found"
                ? 404
                : ownership.error.includes("not a long")
                  ? 400
                  : 403,
        )
        .json({ success: false, message: ownership.error });
    }
    const { video } = ownership;

    // Soft delete
    video.status = "disabled";
    video.deletedAt = new Date();
    video.deletedBy = adminId || null;
    video.deleteReason = reason || null;
    await video.save();

    // Remove video references from user and channel
    await AllUser.updateOne({ _id: userId }, { $pull: { videos: videoId } });
    if (video.channel) {
      await Channel.updateOne(
        { _id: video.channel },
        { $pull: { videos: videoId } },
      );
    }

    logAuditEvent({
      userId,
      eventType: "ADMIN_VIDEO_DELETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        videoId,
        title: video.title,
        channelId: video.channel,
        reason: reason || null,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
      data: { videoId },
    });
  } catch (err) {
    console.error("deleteVideo error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== DISABLE SHORT ==================
exports.disableShort = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    const ownership = await validateVideoOwnership(userId, videoId, "short");
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : ownership.error === "Video not found"
                ? 404
                : ownership.error.includes("not a short")
                  ? 400
                  : 403,
        )
        .json({ success: false, message: ownership.error });
    }
    const { video } = ownership;
    const prevStatus = video.status || "active";

    if (!VIDEO_VALID_TRANSITIONS[prevStatus]?.includes("disabled")) {
      return res.status(400).json({
        success: false,
        message: `Cannot disable a short with status "${prevStatus}"`,
      });
    }

    video.status = "disabled";
    video.disabledAt = new Date();
    video.disabledBy = adminId || null;
    video.disableReason = reason || null;
    await video.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_SHORT_DISABLE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        videoId,
        title: video.title,
        prevStatus,
        reason: reason || null,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Short disabled successfully",
      data: { videoId, status: video.status, disabledAt: video.disabledAt },
    });
  } catch (err) {
    console.error("disableShort error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== ENABLE SHORT ==================
exports.enableShort = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const adminId = req.admin && req.admin._id;

    const ownership = await validateVideoOwnership(userId, videoId, "short");
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : ownership.error === "Video not found"
                ? 404
                : ownership.error.includes("not a short")
                  ? 400
                  : 403,
        )
        .json({ success: false, message: ownership.error });
    }
    const { video } = ownership;
    const prevStatus = video.status || "active";

    if (!VIDEO_VALID_TRANSITIONS[prevStatus]?.includes("active")) {
      return res.status(400).json({
        success: false,
        message: `Cannot enable a short with status "${prevStatus}"`,
      });
    }

    video.status = "active";
    video.disabledAt = null;
    video.disabledBy = null;
    video.disableReason = null;
    await video.save();

    logAuditEvent({
      userId,
      eventType: "ADMIN_SHORT_ENABLE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { adminId, videoId, title: video.title, prevStatus },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Short enabled successfully",
      data: { videoId, status: video.status },
    });
  } catch (err) {
    console.error("enableShort error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== DELETE SHORT ==================
exports.deleteShort = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const { reason } = req.body || {};
    const adminId = req.admin && req.admin._id;

    const ownership = await validateVideoOwnership(userId, videoId, "short");
    if (ownership.error) {
      return res
        .status(
          ownership.error === "Invalid ID format"
            ? 400
            : ownership.error === "User not found"
              ? 404
              : ownership.error === "Video not found"
                ? 404
                : ownership.error.includes("not a short")
                  ? 400
                  : 403,
        )
        .json({ success: false, message: ownership.error });
    }
    const { video } = ownership;

    // Soft delete
    video.status = "disabled";
    video.deletedAt = new Date();
    video.deletedBy = adminId || null;
    video.deleteReason = reason || null;
    await video.save();

    // Remove references
    await AllUser.updateOne({ _id: userId }, { $pull: { videos: videoId } });
    if (video.channel) {
      await Channel.updateOne(
        { _id: video.channel },
        { $pull: { videos: videoId } },
      );
    }

    logAuditEvent({
      userId,
      eventType: "ADMIN_SHORT_DELETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId,
        videoId,
        title: video.title,
        channelId: video.channel,
        reason: reason || null,
      },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Short deleted successfully",
      data: { videoId },
    });
  } catch (err) {
    console.error("deleteShort error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.registerEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "admin",
      contactNumber,
      countryCode,
      dateOfJoining,
      experienceYears,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const allowedRoles = ["admin", "finance", "support", "read-only"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${allowedRoles.join(", ")}`,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedContact = (contactNumber || "").trim();

    if (!normalizedContact) {
      return res.status(400).json({
        success: false,
        message: "Contact number is required",
      });
    }

    if (!dateOfJoining) {
      return res.status(400).json({
        success: false,
        message: "Date of joining is required",
      });
    }

    const parsedExperience = Number(experienceYears ?? 0);
    if (Number.isNaN(parsedExperience) || parsedExperience < 0) {
      return res.status(400).json({
        success: false,
        message: "Experience years must be a valid number",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // ========== Profile Photo ΓåÆ ImageKit ==========
    let profilePhoto = "";

    if (req.files && req.files.profilePhoto) {
      const file = req.files.profilePhoto;

      // Validate image type
      const allowedMimes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG or WEBP images are allowed",
        });
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size should be less than 5MB",
        });
      }

      try {
        const uploadResponse = await imagekit.upload({
          file: file.data, // buffer from express-fileupload / multer
          fileName: `admin_${Date.now()}_${file.name.replace(/\s+/g, "-")}`,
          folder: "/admin-profiles",
        });

        profilePhoto = uploadResponse.url; // full ImageKit CDN URL
      } catch (uploadErr) {
        console.error("ImageKit upload error:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile photo",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      contactNumber: normalizedContact,
      countryCode: (countryCode || "").trim(),
      dateOfJoining: new Date(dateOfJoining),
      experienceYears: parsedExperience,
      profilePhoto,
    });

    await sendMailSafely(
      getAddEmployeeMailOptions(
        user.email,
        user.name,
        user.role,
        "Bharat Play",
        user.experienceYears || "N/A",
        password,
      ),
    );

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        countryCode: user.countryCode,
        dateOfJoining: user.dateOfJoining,
        experienceYears: user.experienceYears,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate role if provided
    const validRoles = ["admin", "finance", "support", "read-only"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role provided",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Your account is disabled. Please contact the admin.",
      });
    }

    // If role is specified, validate that user has this role
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `User does not have ${role} role. Actual role: ${user.role}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = signAccessToken({
      userId: user._id,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const refreshTokenValue = signRefreshToken({
      sub: String(user._id),
      kind: "admin",
    });

    await RefreshToken.create({
      userId: user._id,
      kind: "admin",
      tokenHash: hashToken(refreshTokenValue),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    setRefreshCookie(res, refreshTokenValue, "admin");

    await sendMailSafely(getLoginMailOptions(user.email, user.name));

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==================== TOGGLE USER STATUS (Enable / Disable) ====================
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean (true or false)",
      });
    }

    const user = await User.findById(id); // or Admin.findById if model name is Admin

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optional: Prevent disabling yourself
    if (
      req.user &&
      String(req.user.userId) === String(user._id) &&
      isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot disable your own account",
      });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User enabled successfully"
        : "User disabled successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// ================== GET ALLOWED ROLES ==================

exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: { $in: ["admin", "finance", "support", "read-only"] },
    })
      .select(
        "name email role contactNumber countryCode dateOfJoining experienceYears profilePhoto isActive createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    console.log("Employees fetched:", employees);

    return res.status(200).json({
      success: true,
      data: employees,
      // optional pagination if you need it later
      // pagination: { page: 1, limit: employees.length, total: employees.length, pages: 1 }
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

// ================== ADMIN PROFILE (ME / SELF UPDATE) ==================

exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const admin = await User.findById(adminId)
      .select(
        "name email role contactNumber countryCode dateOfJoining experienceYears profilePhoto isActive createdAt",
      )
      .lean();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const update = {};

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      update.name = req.body.name.trim();
    }
    if (typeof req.body.contactNumber === "string") {
      update.contactNumber = req.body.contactNumber.trim();
    }
    if (typeof req.body.countryCode === "string") {
      update.countryCode = req.body.countryCode.trim();
    }
    if (req.body.experienceYears !== undefined && req.body.experienceYears !== "") {
      const yrs = parseInt(req.body.experienceYears, 10);
      if (!Number.isNaN(yrs) && yrs >= 0) update.experienceYears = yrs;
    }
    if (req.body.dateOfJoining && req.body.dateOfJoining !== "") {
      const d = new Date(req.body.dateOfJoining);
      if (!Number.isNaN(d.getTime())) update.dateOfJoining = d;
    }

    // Profile photo → ImageKit (multipart file field "profilePhoto")
    if (req.files && req.files.profilePhoto) {
      const file = req.files.profilePhoto;

      const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG or WEBP images are allowed",
        });
      }

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size should be less than 5MB",
        });
      }

      try {
        const uploadResponse = await imagekit.upload({
          file: file.data,
          fileName: `admin_${Date.now()}_${file.name.replace(/\s+/g, "-")}`,
          folder: "/admin-profiles",
        });
        update.profilePhoto = uploadResponse.url;
      } catch (uploadErr) {
        console.error("ImageKit upload error:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile photo",
        });
      }
    } else if (req.body.removePhoto === "1") {
      update.profilePhoto = "";
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const admin = await User.findByIdAndUpdate(adminId, { $set: update }, { new: true })
      .select(
        "name email role contactNumber countryCode dateOfJoining experienceYears profilePhoto isActive createdAt",
      );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: admin,
    });
  } catch (error) {
    console.error("Update admin profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

exports.adminForgotPassword = async (req, res) => {
  try {
    const admin = req.admin;
    const normalizedEmail =
      typeof admin.email === "string" ? admin.email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "No registered email found on this account.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: admin._id },
      {
        $set: {
          resetOtpHash: otpHash,
          resetOtpExpires: expiresAt,
          resetOtpAttempts: 0,
        },
      },
    );

    logAuditEvent({
      userId: admin._id,
      eventType: "PASSWORD_RESET_REQUEST",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { email: normalizedEmail },
    }).catch(() => {});

    const mailResult = await sendMailSafely(
      getPasswordResetMailOptions(admin.email, admin.name, otp),
    );

    if (!mailResult.sent) {
      console.error("OTP email send failed:", mailResult.reason);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again.",
      });
    }

    console.log("OTP email sent successfully to:", admin.email);

    return res.status(200).json({
      success: true,
      message:
        "A 6-digit verification code has been sent to your registered email.",
    });
  } catch (error) {
    console.error("Admin forgot password error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.adminVerifyResetOtp = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { otp } = req.body || {};

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    const admin = await User.findById(adminId).select("+resetOtpHash");

    if (!admin || !admin.resetOtpHash) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired verification code. Please request a new one.",
      });
    }

    if (
      !admin.resetOtpExpires ||
      new Date(admin.resetOtpExpires).getTime() < Date.now()
    ) {
      await User.updateOne(
        { _id: adminId },
        {
          $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpAttempts: 1 },
        },
      );
      return res.status(400).json({
        success: false,
        message: "This verification code has expired. Please request a new one.",
      });
    }

    if (admin.resetOtpAttempts >= 5) {
      await User.updateOne(
        { _id: adminId },
        {
          $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpAttempts: 1 },
        },
      );
      return res.status(400).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const otpValid = await bcrypt.compare(otp, admin.resetOtpHash);

    if (!otpValid) {
      const newAttempts = (admin.resetOtpAttempts || 0) + 1;
      if (newAttempts >= 5) {
        await User.updateOne(
          { _id: adminId },
          {
            $unset: {
              resetOtpHash: 1,
              resetOtpExpires: 1,
              resetOtpAttempts: 1,
            },
          },
        );
        return res.status(400).json({
          success: false,
          message: "Too many incorrect attempts. Please request a new code.",
        });
      }
      await User.updateOne(
        { _id: adminId },
        { $set: { resetOtpAttempts: newAttempts } },
      );
      return res.status(400).json({
        success: false,
        message: "The verification code is incorrect.",
      });
    }

    // OTP verified — generate a short-lived, single-use reset token.
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHashVal = hashToken(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await User.updateOne(
      { _id: adminId },
      {
        $set: {
          resetTokenHash: resetTokenHashVal,
          resetTokenExpires: resetTokenExpiresAt,
        },
        $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpAttempts: 1 },
      },
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Admin verify reset OTP error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.adminResetPassword = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { token, newPassword } = req.body || {};

    if (typeof token !== "string" || !token) {
      return res
        .status(400)
        .json({ success: false, message: "Reset token is required" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const tokenHash = hashToken(token);
    const admin = await User.findOne({
      _id: adminId,
      resetTokenHash: tokenHash,
    }).select("+resetTokenHash");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Your password reset session has expired. Please start again.",
      });
    }

    if (
      !admin.resetTokenExpires ||
      new Date(admin.resetTokenExpires).getTime() < Date.now()
    ) {
      await User.updateOne(
        { _id: adminId },
        {
          $unset: {
            resetTokenHash: 1,
            resetTokenExpires: 1,
            resetOtpHash: 1,
            resetOtpExpires: 1,
            resetOtpAttempts: 1,
          },
        },
      );
      return res.status(400).json({
        success: false,
        message: "Your password reset session has expired. Please start again.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updateOne(
      { _id: adminId },
      {
        $set: { password: hashedPassword },
        $unset: {
          resetTokenHash: 1,
          resetTokenExpires: 1,
          resetOtpHash: 1,
          resetOtpExpires: 1,
          resetOtpAttempts: 1,
        },
      },
    );

    logAuditEvent({
      userId: adminId,
      eventType: "PASSWORD_RESET_COMPLETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
    }).catch(() => {});

    await sendMailSafely(
      getPasswordChangeConfirmationMailOptions(admin.email, admin.name),
    );

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Admin reset password error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

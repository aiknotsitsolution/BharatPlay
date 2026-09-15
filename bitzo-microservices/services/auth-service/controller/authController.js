const User = require("../models/usermodel");
const WatchSession = require("../models/WatchSession");
const RefreshToken = require("../models/RefreshToken");
const DeviceFingerprint = require("../models/DeviceFingerprintModel");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} = require("../utils/tokenService");
const bcrypt = require("bcryptjs"); // ΓåÉ make sure this is installed
const crypto = require("crypto");
const mongoose = require("mongoose");
const imagekit = require("../utils/imagekit.js");
const path = require("path");
const { resolveDeviceId } = require("../utils/deviceCookie");
const {
  REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../utils/refreshCookie");

const { detectVPN } = require("../services/vpn.service/vpn.service.js");
const {
  logFraudEvent,
  analyzeBehavior,
  applyRiskToUser,
  applyTrustRule,
} = require("../services/vpn.service/fraud.service.js");
const { logAuditEvent } = require("../services/auditEventService");
const { registerOrVerifyDevice } = require("../services/deviceSecurityService");
const transporter = require("../Email/nodemailer.js");
const getRegisterMailOptions = require("../Email/register.js");
const getLoginMailOptions = require("../Email/login.js");
const getPasswordResetMailOptions = require("../Email/password.js");
const getPasswordChangeConfirmationMailOptions = require("../Email/passwordReset.js");

const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

// Creates a refresh-token session for a user/admin and returns the raw token.
// Only the hash is persisted. The caller sets the httpOnly cookie.
const createAuthSession = async (userId, kind = "user") => {
  const refreshToken = signRefreshToken({ sub: String(userId), kind });
  await RefreshToken.create({
    userId,
    kind,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return refreshToken;
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

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

const issueOtpToDevice = async ({ deviceId, user, purpose = "login" }) => {
  if (!deviceId || !user?.email) return null;

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await DeviceFingerprint.findOneAndUpdate(
    { deviceId },
    {
      $set: {
        pendingOtp: otp,
        otpExpiresAt: expiresAt,
        otpPurpose: purpose,
        lastOtpSentAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  const mailResult = await sendMailSafely(
    getLoginMailOptions(user.email, user.name, otp),
  );
  if (!mailResult.sent) {
    await DeviceFingerprint.updateOne(
      { deviceId },
      { $unset: { pendingOtp: 1, otpExpiresAt: 1, otpPurpose: 1 } },
    );

    const error = new Error("OTP email could not be sent");
    error.statusCode = 503;
    throw error;
  }

  return otp;
};

/* ===================== REGISTER ===================== */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    let deviceId = resolveDeviceId(req, res);
    const ip = getClientIp(req);
    const ua = req.headers["user-agent"] || "unknown";

    const deviceCheck = await registerOrVerifyDevice({ req });
    if (!deviceCheck.ok) {
      return res.status(deviceCheck.status).json({
        success: false,
        code: deviceCheck.code,
        message: deviceCheck.message,
      });
    }
    if (!deviceCheck.legacy && deviceCheck.deviceId) {
      deviceId = deviceCheck.deviceId;
    }

    const deviceExists = await User.findOne({ deviceId });
    if (deviceExists) {
      return res.status(400).json({
        success: false,
        message: "This device is already registered",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const vpnInfo = await detectVPN(ip);
    if (vpnInfo.isVPN || vpnInfo.isProxy) {
      await logFraudEvent({
        userId: null,
        eventType: vpnInfo.isVPN ? "VPN_DETECTED" : "PROXY_DETECTED",
        severity: "high",
        ip,
        deviceId,
        userAgent: ua,
        isVPN: vpnInfo.isVPN,
        isProxy: vpnInfo.isProxy,
        riskScoreImpact: 25,
        metadata: {
          country: vpnInfo.country,
          action: "blocked_register",
        },
      });

      return res.status(403).json({
        success: false,
        code: "VPN_OR_PROXY_DETECTED",
        message:
          "Registration is not allowed over VPN or proxy. Please disable it and try again.",
      });
    }

    if (otp) {
      const fingerprintRecord = await DeviceFingerprint.findOne({ deviceId });
      if (
        !fingerprintRecord ||
        !fingerprintRecord.pendingOtp ||
        fingerprintRecord.otpPurpose !== "register"
      ) {
        return res.status(401).json({
          success: false,
          message: "OTP session expired. Please register again.",
        });
      }

      const otpMatches = String(fingerprintRecord.pendingOtp) === String(otp);
      const otpExpired =
        !fingerprintRecord.otpExpiresAt ||
        new Date(fingerprintRecord.otpExpiresAt).getTime() < Date.now();

      if (!otpMatches || otpExpired) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired OTP.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        deviceId,
        deviceVerified: true,
        ipAddress: ip,
      });

      await registerOrVerifyDevice({ req, userId: user._id });

      await DeviceFingerprint.updateOne(
        { deviceId },
        {
          $set: {
            userId: user._id,
            lastIp: ip,
            userAgent: ua,
            lastSeen: new Date(),
          },
          $addToSet: { associatedUsers: user._id },
          $unset: { pendingOtp: 1, otpExpiresAt: 1, otpPurpose: 1 },
        },
      );

      await logFraudEvent({
        userId: user._id,
        eventType: "REGISTER",
        severity: "low",
        ip,
        deviceId,
        userAgent: ua,
        isVPN: false,
        isProxy: false,
        riskScoreImpact: 0,
        metadata: { country: vpnInfo.country },
      });

      await sendMailSafely(getRegisterMailOptions(user.email, user.name));

      const token = signAccessToken({ userId: user._id, role: user.role });
      const refreshToken = await createAuthSession(user._id, "user");
      setRefreshCookie(res, refreshToken, "user");

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          trustScore: user.trustScore,
          avatar: user.avatar || null,
        },
      });
    }

    const otpCode = await issueOtpToDevice({
      deviceId,
      user: {
        email: normalizedEmail,
        name: String(name).trim(),
      },
      purpose: "register",
    });

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message:
        "OTP has been sent to your email. Verify it to complete registration.",
      otpCode: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

exports.saveDeviceFingerprint = async (req, res) => {
  try {
    const { fingerprint } = req.body || {};
    const deviceId = resolveDeviceId(req, res);
    const rawUserId = req.user?.id || req.user?._id || req.body?.userId || null;
    const userId = rawUserId
      ? new mongoose.Types.ObjectId(String(rawUserId))
      : null;
    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "unknown";

    if (userId) {
      const user = await User.findById(userId).select("deviceId name email");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const otherUserWithThisDevice = await User.findOne({
        deviceId,
        _id: { $ne: userId },
      }).select("_id");

      if (otherUserWithThisDevice) {
        return res.status(409).json({
          success: false,
          message:
            "This device is already linked to another user. One user can have only one active device.",
        });
      }

      if (user.deviceId && user.deviceId !== deviceId) {
        const existingOtherRecord = await DeviceFingerprint.findOne({
          userId,
        });

        if (
          existingOtherRecord &&
          String(existingOtherRecord.deviceId) !== String(deviceId)
        ) {
          existingOtherRecord.deviceId = deviceId;
          existingOtherRecord.fingerprint =
            fingerprint || existingOtherRecord.fingerprint;
          existingOtherRecord.userAgent = userAgent;
          existingOtherRecord.lastIp = ip;
          existingOtherRecord.lastSeen = new Date();
          existingOtherRecord.associatedUsers = [userId];
          existingOtherRecord.userId = userId;
          await existingOtherRecord.save();

          user.deviceId = deviceId;
          user.deviceVerified = true;
          user.deviceFingerprint = fingerprint || user.deviceFingerprint;
          user.ipAddress = ip;
          await user.save();

          return res.status(200).json({
            success: true,
            deviceId,
            fingerprint: existingOtherRecord.fingerprint,
          });
        }
      }

      if (!user.deviceId || user.deviceId === deviceId) {
        user.deviceId = deviceId;
        if (req.user?.id || req.user?._id) {
          user.deviceVerified = true;
          user.deviceFingerprint = fingerprint || user.deviceFingerprint;
          user.ipAddress = ip;
        }
        await user.save();
      }
    }

    const existingByDevice = await DeviceFingerprint.findOne({ deviceId });
    const existingByUser = userId
      ? await DeviceFingerprint.findOne({ userId })
      : null;

    if (
      existingByUser &&
      existingByDevice &&
      String(existingByUser._id) !== String(existingByDevice._id)
    ) {
      await DeviceFingerprint.deleteOne({ _id: existingByUser._id });
    }

    const existing = existingByDevice || existingByUser;
    if (existing) {
      existing.deviceId = deviceId;
      existing.userId = userId || existing.userId;
      existing.fingerprint = fingerprint || existing.fingerprint;
      existing.userAgent = userAgent;
      existing.lastIp = ip;
      existing.lastSeen = new Date();

      if (userId) {
        existing.associatedUsers = existing.associatedUsers.some(
          (id) => String(id) === String(userId),
        )
          ? existing.associatedUsers
          : [...existing.associatedUsers, userId];
      }

      await existing.save();
      if (userId && (req.user?.id || req.user?._id)) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            deviceVerified: true,
            ...(fingerprint ? { deviceFingerprint: fingerprint } : {}),
            ipAddress: ip,
          },
        });
      }
      return res.status(200).json({
        success: true,
        deviceId,
        fingerprint: existing.fingerprint,
      });
    }

    const record = await DeviceFingerprint.create({
      deviceId,
      userId,
      fingerprint: fingerprint || null,
      userAgent,
      lastIp: ip,
      lastSeen: new Date(),
      associatedUsers: userId ? [userId] : [],
    });

    if (userId) {
      const user = await User.findById(userId).select("name email");
      if (user) {
        if (req.user?.id || req.user?._id) {
          await User.updateOne(
            { _id: userId },
            {
              $set: {
                deviceVerified: true,
                ...(fingerprint ? { deviceFingerprint: fingerprint } : {}),
                ipAddress: ip,
              },
            },
          );
        }
        await sendMailSafely(getLoginMailOptions(user.email, user.name));
      }
    }

    return res.status(200).json({
      success: true,
      deviceId,
      fingerprint: record.fingerprint,
    });
  } catch (error) {
    console.error("Device fingerprint save error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save device fingerprint",
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const ip = getClientIp(req);
    const ua = req.headers["user-agent"] || "unknown";
    let deviceId = resolveDeviceId(req, res);

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      await logFraudEvent({
        userId: null,
        eventType: "LOGIN_FAILED",
        severity: "medium",
        ip,
        deviceId,
        userAgent: ua,
        riskScoreImpact: 8,
        metadata: { reason: "user_not_found" },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ========== PASSWORD STEP (no OTP yet) ==========
    if (!otp) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await logFraudEvent({
          userId: user._id,
          eventType: "LOGIN_FAILED",
          severity: "medium",
          ip,
          deviceId,
          userAgent: ua,
          riskScoreImpact: 8,
          metadata: { reason: "wrong_password" },
        });

        const { riskPoints, reasons } = await analyzeBehavior(user._id);
        if (riskPoints > 0) {
          await applyRiskToUser(user._id, riskPoints, reasons);
        }

        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const deviceCheck = await registerOrVerifyDevice({
        req,
        userId: user._id,
      });
      if (!deviceCheck.ok) {
        return res.status(deviceCheck.status).json({
          success: false,
          code: deviceCheck.code,
          message: deviceCheck.message,
        });
      }
      if (!deviceCheck.legacy && deviceCheck.deviceId) {
        deviceId = deviceCheck.deviceId;
      }

      // ---------- Safe device binding ----------
      // 1. Clear this deviceId from ANY other user
      await User.updateMany(
        { deviceId, _id: { $ne: user._id } },
        { $unset: { deviceId: 1 } },
      );

      // Keep the account binding unchanged until the OTP is verified.

      // Create / update fingerprint for current device
      const existingByDevice = await DeviceFingerprint.findOne({ deviceId });
      const existingByUser = await DeviceFingerprint.findOne({
        userId: user._id,
      });

      if (
        existingByUser &&
        String(existingByUser.deviceId) !== String(deviceId)
      ) {
        await DeviceFingerprint.deleteOne({ _id: existingByUser._id });
      }

      await DeviceFingerprint.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            userId: user._id,
            lastIp: ip,
            userAgent: ua,
            lastSeen: new Date(),
          },
          $addToSet: { associatedUsers: user._id },
        },
        { upsert: true },
      );

      // ---------- VPN / Proxy check ----------
      const vpnInfo = await detectVPN(ip);
      if (vpnInfo.isVPN || vpnInfo.isProxy) {
        await logFraudEvent({
          userId: user._id,
          eventType: vpnInfo.isVPN ? "VPN_DETECTED" : "PROXY_DETECTED",
          severity: "high",
          ip,
          deviceId,
          userAgent: ua,
          isVPN: vpnInfo.isVPN,
          isProxy: vpnInfo.isProxy,
          riskScoreImpact: 25,
          metadata: {
            country: vpnInfo.country,
            action: "blocked_login",
          },
        });

        await applyRiskToUser(user._id, 25, [
          vpnInfo.isVPN ? "VPN detected on login" : "Proxy detected on login",
        ]);

        return res.status(403).json({
          success: false,
          code: "VPN_OR_PROXY_DETECTED",
          message:
            "Login is not allowed over VPN or proxy. Please disable it and try again.",
        });
      }

      // Issue OTP
      const otpCode = await issueOtpToDevice({
        deviceId,
        user,
        purpose: "login",
      });

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        message:
          "OTP has been sent to your email. Verify it to complete login.",
        otpCode: process.env.NODE_ENV !== "production" ? otpCode : undefined,
      });
    }

    // ========== OTP VERIFICATION STEP ==========
    const otpDeviceCheck = await registerOrVerifyDevice({
      req,
      userId: user._id,
    });
    if (!otpDeviceCheck.ok) {
      return res.status(otpDeviceCheck.status).json({
        success: false,
        code: otpDeviceCheck.code,
        message: otpDeviceCheck.message,
      });
    }
    if (!otpDeviceCheck.legacy && otpDeviceCheck.deviceId) {
      deviceId = otpDeviceCheck.deviceId;
    }

    const fingerprintRecord = await DeviceFingerprint.findOne({ deviceId });
    if (!fingerprintRecord || !fingerprintRecord.pendingOtp) {
      return res.status(401).json({
        success: false,
        message: "OTP session expired. Please log in again.",
      });
    }

    const otpMatches = String(fingerprintRecord.pendingOtp) === String(otp);
    const otpExpired =
      !fingerprintRecord.otpExpiresAt ||
      new Date(fingerprintRecord.otpExpiresAt).getTime() < Date.now();

    if (!otpMatches || otpExpired) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    // Clear OTP
    await DeviceFingerprint.updateOne(
      { deviceId },
      { $unset: { pendingOtp: 1, otpExpiresAt: 1, otpPurpose: 1 } },
    );

    // Final device binding after successful OTP
    const deviceChanged = Boolean(user.deviceId && user.deviceId !== deviceId);
    await User.updateMany(
      { deviceId, _id: { $ne: user._id } },
      { $unset: { deviceId: 1 } },
    );

    if (user.deviceId !== deviceId) {
      user.deviceId = deviceId;
      await user.save();
    }

    if (deviceChanged) {
      await applyTrustRule(
        user._id,
        "DEVICE_CHANGE",
        "Verified login from a changed device",
        {
          deviceId,
          ipAddress: ip,
          eventKey: `device-change:${user._id}:${deviceId}`,
        },
      );
    }

    await DeviceFingerprint.updateOne(
      { deviceId },
      {
        $set: {
          userId: user._id,
          lastIp: ip,
          userAgent: ua,
          lastSeen: new Date(),
        },
        $addToSet: { associatedUsers: user._id },
      },
    );

    // Risk analysis
    const { riskPoints, reasons } = await analyzeBehavior(user._id);
    if (riskPoints > 0) {
      await applyRiskToUser(user._id, riskPoints, reasons);
    }

    await logFraudEvent({
      userId: user._id,
      eventType: "LOGIN_SUCCESS",
      severity: "low",
      ip,
      deviceId,
      userAgent: ua,
      isVPN: false,
      isProxy: false,
      riskScoreImpact: 0,
    });

    await logAuditEvent({
      userId: user._id,
      eventType: "USER_LOGIN",
      ip,
      deviceId,
      userAgent: ua,
      metadata: { email: user.email },
    });

    await sendMailSafely(getLoginMailOptions(user.email, user.name));

    const token = signAccessToken({ userId: user._id, role: user.role });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const refreshToken = await createAuthSession(user._id, "user");
    setRefreshCookie(res, refreshToken, "user");

    const now = new Date();
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: now, lastActivityAt: now } },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token,
        trustScore: user.trustScore,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 503
          ? "OTP could not be sent. Please try again later."
          : "Internal server error",
    });
  }
};

/* ===================== CLAIM DEVICE =====================
   Recovery path for the DEVICE_LOCKED login flow.
   After credential re-verification, this releases the account from its
   previously bound device so the current browser/device becomes the active
   device. All refresh-token sessions are revoked, matching the resetPassword
   and logout revocation patterns. No tokens are issued here. */
exports.claimDevice = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const deviceId = resolveDeviceId(req, res);

    // Nothing to claim: the account is already usable on this device.
    if (!user.deviceId || user.deviceId === deviceId) {
      return res.status(400).json({
        success: false,
        message:
          "This device is already linked to your account. You can sign in now.",
      });
    }

    // 1-device = 1-account hard limit: this device must not already be bound
    // to another account, otherwise rebinding here would violate the unique
    // deviceId constraint (E11000) and steal the device from that account.
    const deviceOwner = await User.findOne({
      deviceId,
      _id: { $ne: user._id },
    });
    if (deviceOwner) {
      return res.status(400).json({
        success: false,
        message:
          "This browser or device is already linked to a different account. Sign in with that account on this device instead.",
      });
    }

    // Revoke every refresh session for this user so old devices cannot refresh.
    await RefreshToken.updateMany(
      { userId: user._id, kind: "user" },
      { $set: { revokedAt: new Date() } },
    );

    // Clear any auth cookies on this response (same as logout).
    clearRefreshCookie(res, "user");
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Release the old binding and make this device the account's active device.
    await applyTrustRule(
      user._id,
      "DEVICE_CHANGE",
      "Account device was changed through device claim",
      {
        deviceId,
        ipAddress: getClientIp(req),
        eventKey: `device-claim:${user._id}:${deviceId}`,
      },
    );
    user.deviceId = deviceId;
    await user.save();

    await logAuditEvent({
      userId: user._id,
      eventType: "DEVICE_CLAIM",
      ip: getClientIp(req),
      deviceId,
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: { email: user.email },
    });

    return res.status(200).json({
      success: true,
      message:
        "All other sessions have been signed out. You can now sign in on this device.",
    });
  } catch (error) {
    console.error("Γ¥î Claim device error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const populatedUser = user.toObject();
    populatedUser.totalVideos = populatedUser.videos?.length || 0;
    populatedUser.totalViews = Number(populatedUser.totalViews || 0);
    populatedUser.totalEarnings = Number(populatedUser.totalEarnings || 0);
    populatedUser.avgRPM = Number(populatedUser.avgRPM || 0);
    populatedUser.subscribers = Number(populatedUser.subscribers || 0);

    const tzOffset = Math.min(
      840,
      Math.max(-840, Number(req.query.tzOffsetMinutes) || 0),
    );
    const localNow = new Date(Date.now() - tzOffset * 60000);
    const localDayStart = new Date(localNow);
    localDayStart.setUTCHours(0, 0, 0, 0);
    const dayStartUtc = new Date(localDayStart.getTime() + tzOffset * 60000);

    const [todayResult] = await WatchSession.aggregate([
      { $match: { userId: user._id, startedAt: { $gte: dayStartUtc } } },
      { $group: { _id: null, seconds: { $sum: "$watchedSeconds" } } },
    ]);
    const [totalResult] = await WatchSession.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, seconds: { $sum: "$watchedSeconds" } } },
    ]);

    populatedUser.watchTimeTodaySeconds = todayResult?.seconds || 0;
    populatedUser.watchTimeTotalSeconds = totalResult?.seconds || 0;

    res.status(200).json({
      success: true,
      user: populatedUser,
    });
  } catch (error) {
    console.error("getMyProfile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const normalizePhone = (phone) =>
  typeof phone === "string" ? phone.trim().replace(/[\s()-]/g, "") : "";

const isValidPhone = (phone) => /^\+?[1-9]\d{7,14}$/.test(phone);

exports.requestPhoneVerification = async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number with country code",
      });
    }

    const user = await User.findById(req.user.id).select("name email phone");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const deviceId = resolveDeviceId(req, res);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await DeviceFingerprint.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          userId: user._id,
          pendingOtp: otp,
          otpExpiresAt: expiresAt,
          otpPurpose: "phone",
          lastOtpSentAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    const mailResult = await sendMailSafely(
      getLoginMailOptions(user.email, user.name, otp),
    );
    if (!mailResult.sent && process.env.NODE_ENV === "production") {
      return res.status(503).json({
        success: false,
        message: "Verification service is not configured",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent. Check your account email.",
      otpCode: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    console.error("Phone verification request error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not send verification code",
    });
  }
};

exports.verifyPhone = async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const otp = String(req.body?.otp || "").trim();
    if (!isValidPhone(phone) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Phone number and six-digit verification code are required",
      });
    }

    const deviceId = resolveDeviceId(req, res);
    const fingerprintRecord = await DeviceFingerprint.findOne({
      deviceId,
      userId: req.user.id,
      otpPurpose: "phone",
    });
    const otpExpired =
      !fingerprintRecord?.otpExpiresAt ||
      new Date(fingerprintRecord.otpExpiresAt).getTime() < Date.now();

    if (
      !fingerprintRecord ||
      otpExpired ||
      String(fingerprintRecord.pendingOtp) !== otp
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { phone, phoneVerified: true } },
      { new: true, runValidators: true },
    ).select("-password");

    await DeviceFingerprint.updateOne(
      { _id: fingerprintRecord._id },
      { $unset: { pendingOtp: 1, otpExpiresAt: 1, otpPurpose: 1 } },
    );

    return res.status(200).json({
      success: true,
      message: "Phone verified successfully",
      user,
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not verify phone number",
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    // Authorization identity comes from the JWT (authMiddleware), never from
    // req.params.id. The :id URL parameter is kept for frontend compatibility.
    if (req.params.id && String(req.params.id) !== String(req.user?.id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is required" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    await logAuditEvent({
      userId,
      eventType: "PASSWORD_CHANGE",
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "Password updated",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.UserEdit = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select(
      "+avatar +avatarFileId +name +email +phone +phoneVerified",
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const updateData = {};
    const oldAvatarFileId = user.avatarFileId;

    const profileFields = [
      "advertisingId",
      "deviceFingerprint",
      "country",
      "timezone",
      "simMcc",
    ];
    for (const field of profileFields) {
      if (req.body?.[field] !== undefined) {
        const value = String(req.body[field]).trim();
        if (value.length > 120) {
          return res.status(400).json({
            success: false,
            message: `${field} is too long`,
          });
        }
        updateData[field] = value || null;
      }
    }

    if (req.body?.phone !== undefined && String(req.body.phone).trim()) {
      const phone = normalizePhone(req.body.phone);
      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid phone number with country code",
        });
      }
      if (phone !== user.phone) {
        updateData.phone = phone;
        updateData.phoneVerified = false;
      }
    }

    updateData.ipAddress = getClientIp(req);

    // ====================== AVATAR ======================
    if (req.file) {
      const file = req.file;

      if (!file.mimetype?.startsWith("image/")) {
        return res
          .status(400)
          .json({ success: false, message: "Only image files are allowed" });
      }
      if (file.size > 5 * 1024 * 1024) {
        return res
          .status(400)
          .json({ success: false, message: "Image must be less than 5MB" });
      }

      const fileExt = path.extname(file.originalname || ".jpg").toLowerCase();
      const fileName = `avatar_${user._id}_${Date.now()}${fileExt}`;

      const uploadResponse = await imagekit.upload({
        file: file.buffer,
        fileName,
        folder: "/avatars",
        useUniqueFileName: true,
      });

      updateData.avatar = uploadResponse.url;
      updateData.avatarFileId = uploadResponse.fileId; // ΓåÉ Ye important hai
    }

    // ====================== NAME ======================
    if (req.body?.name !== undefined) {
      const trimmedName = String(req.body.name).trim();

      if (!trimmedName) {
        return res
          .status(400)
          .json({ success: false, message: "Name cannot be empty" });
      }
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name must be 2-50 characters long",
        });
      }
      if (trimmedName !== user.name) {
        updateData.name = trimmedName;
      }
    }

    // ====================== EMAIL ======================
    if (req.body?.email !== undefined) {
      const newEmail = String(req.body.email).trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format" });
      }

      if (newEmail !== user.email) {
        const emailExists = await User.findOne({ email: newEmail }).lean();
        if (emailExists) {
          return res
            .status(409)
            .json({ success: false, message: "Email already in use" });
        }
        updateData.email = newEmail;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes provided",
        user: user.toObject({ versionKey: false }),
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .select(
        "-password -__v -googleId -deviceId -createdAt -updatedAt -avatarFileId",
      )
      .lean();

    // ====================== DELETE OLD AVATAR (Non-blocking) ======================
    if (updateData.avatar && oldAvatarFileId) {
      (async () => {
        try {
          await imagekit.deleteFile(oldAvatarFileId);
          console.log(`Old avatar deleted: ${oldAvatarFileId}`);
        } catch (err) {
          console.warn(
            "[Non-critical] Failed to delete old avatar:",
            err.message,
          );
        }
      })();
    }

    await logAuditEvent({
      userId,
      eventType: "PROFILE_UPDATE",
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
      metadata: { fields: Object.keys(updateData) },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UserEdit error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/* ===================== REFRESH (rotation + reuse detection) ===================== */
exports.refreshToken = async (req, res) => {
  try {
    const kind = "user";
    const presented = req.cookies && req.cookies[REFRESH_COOKIE];

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
      clearRefreshCookie(res, "user");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session not found",
      });
    }

    // Rotated token being reused ΓåÆ treat as theft: revoke the whole family.
    if (session.replacedBy) {
      await RefreshToken.updateMany(
        { userId: session.userId, kind },
        { $set: { revokedAt: new Date() } },
      );
      clearRefreshCookie(res, "user");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session reused",
      });
    }

    if (session.revokedAt) {
      clearRefreshCookie(res, "user");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session revoked",
      });
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await RefreshToken.deleteOne({ _id: session._id });
      clearRefreshCookie(res, "user");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Refresh session expired",
      });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: session._id });
      clearRefreshCookie(res, "user");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - User not found" });
    }

    // Rotate: revoke this session, create a child session.
    const newRefreshToken = await createAuthSession(user._id, "user");
    const child = await RefreshToken.findOne({
      tokenHash: hashToken(newRefreshToken),
    }).lean();
    await RefreshToken.updateOne(
      { _id: session._id },
      { $set: { replacedBy: child._id, revokedAt: new Date() } },
    );

    const token = signAccessToken({ userId: user._id, role: user.role });
    setRefreshCookie(res, newRefreshToken, "user");

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===================== LOGOUT (real server-side revocation) ===================== */
exports.logout = async (req, res) => {
  try {
    const presented = req.cookies && req.cookies[REFRESH_COOKIE];
    if (presented) {
      await RefreshToken.updateOne(
        { tokenHash: hashToken(presented), kind: "user", revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }

    await logAuditEvent({
      userId: req.user?.id || null,
      eventType: "USER_LOGOUT",
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    });

    clearRefreshCookie(res, "user");
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===================== LOGOUT ALL (revoke every user session) ===================== */
// Revokes ALL active refresh-token sessions for the authenticated user.
// The backend cannot delete cookies from other browsers/devices: their refresh
// sessions die server-side and their next refresh returns 401, at which point
// the frontend clears local auth state. Existing stateless access JWTs expire
// naturally (short-lived); no JWT blacklist is introduced.
exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await RefreshToken.updateMany(
      { userId, kind: "user", revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    await logAuditEvent({
      userId,
      eventType: "USER_LOGOUT_ALL",
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    });

    clearRefreshCookie(res, "user");
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Signed out from all browsers and devices",
    });
  } catch (error) {
    console.error("Logout all error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===================== FORGOT PASSWORD ===================== */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetOtpHash: otpHash,
            resetOtpExpires: expiresAt,
            resetOtpAttempts: 0,
          },
        },
      );

      await logAuditEvent({
        userId: user._id,
        eventType: "PASSWORD_RESET_REQUEST",
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] || "unknown",
        metadata: { email: normalizedEmail },
      });

      await sendMailSafely(
        getPasswordResetMailOptions(user.email, user.name, otp),
      );
    }

    // Generic response: never reveal whether the email exists.
    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a verification code has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===================== VERIFY RESET OTP ===================== */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+resetOtpHash",
    );

    if (!user || !user.resetOtpHash) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired verification code. Please request a new one.",
      });
    }

    if (
      !user.resetOtpExpires ||
      new Date(user.resetOtpExpires).getTime() < Date.now()
    ) {
      await User.updateOne(
        { _id: user._id },
        {
          $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpAttempts: 1 },
        },
      );
      return res.status(400).json({
        success: false,
        message:
          "This verification code has expired. Please request a new one.",
      });
    }

    if (user.resetOtpAttempts >= 5) {
      await User.updateOne(
        { _id: user._id },
        {
          $unset: { resetOtpHash: 1, resetOtpExpires: 1, resetOtpAttempts: 1 },
        },
      );
      return res.status(400).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const otpValid = await bcrypt.compare(otp, user.resetOtpHash);

    if (!otpValid) {
      const newAttempts = (user.resetOtpAttempts || 0) + 1;
      if (newAttempts >= 5) {
        await User.updateOne(
          { _id: user._id },
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
        { _id: user._id },
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
      { _id: user._id },
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
    console.error("Verify reset OTP error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===================== RESET PASSWORD ===================== */
exports.resetPassword = async (req, res) => {
  try {
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
    const user = await User.findOne({ resetTokenHash: tokenHash }).select(
      "+resetTokenHash",
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Your password reset session has expired. Please start again.",
      });
    }

    if (
      !user.resetTokenExpires ||
      new Date(user.resetTokenExpires).getTime() < Date.now()
    ) {
      // Expired token: clear it so it cannot be reused.
      await User.updateOne(
        { _id: user._id },
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { _id: user._id },
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

    // Revoke all existing refresh sessions for this user after a reset.
    await RefreshToken.updateMany(
      { userId: user._id, kind: "user", revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    await logAuditEvent({
      userId: user._id,
      eventType: "PASSWORD_RESET_COMPLETE",
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    });

    clearRefreshCookie(res, "user");

    await sendMailSafely(
      getPasswordChangeConfirmationMailOptions(user.email, user.name),
    );

    return res
      .status(200)
      .json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} = require("../utils/tokenService");
const { OAuth2Client } = require("google-auth-library");
const { resolveDeviceId } = require("../utils/deviceCookie");
const { setRefreshCookie } = require("../utils/refreshCookie");
const { registerOrVerifyDevice } = require("../services/deviceSecurityService");

const User = require("../models/usermodel");
const RefreshToken = require("../models/RefreshToken");
const authMiddleware = require("../middlewares/isAuthenticated");
const requireAdmin = require("../middlewares/requireAdmin");
const {
  loginLimiter,
  registerLimiter,
  passwordLimiter,
  googleLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyResetOtpLimiter,
} = require("../middlewares/rateLimit");
const {
  registerUser,
  loginUser,
  saveDeviceFingerprint,
  claimDevice,
  UserEdit,
  updatePassword,
  getMyProfile,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  requestPhoneVerification,
  verifyPhone,
} = require("../controller/authController");
const {
  getAllUsers,
} = require("../controller/AdminController/AdminController");
const { imageUpload } = require("../middlewares/multer");

// Google client ID must come from the environment. No hardcoded fallback.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/device-fingerprint", saveDeviceFingerprint);
router.post("/claim-device", loginLimiter, claimDevice);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-reset-otp", verifyResetOtpLimiter, verifyResetOtp);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post(
  "/phone/request-otp",
  loginLimiter,
  authMiddleware,
  requestPhoneVerification,
);
router.post("/phone/verify", loginLimiter, authMiddleware, verifyPhone);

router.post("/auth/google", googleLimiter, async (req, res) => {
  const { credential } = req.body;

  if (!GOOGLE_CLIENT_ID || !client) {
    return res
      .status(503)
      .json({ message: "Google sign-in is not configured" });
  }

  if (!credential) {
    return res.status(400).json({ message: "Google credential missing" });
  }

  try {
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error("Google token verification failed:", error.message);
      return res.status(401).json({ message: "Invalid Google token" });
    }

    // Reject unverified emails — do not create accounts for them.
    if (payload.email_verified !== true) {
      return res.status(403).json({ message: "Google email is not verified" });
    }

    const { email, name, picture, sub: googleId } = payload;

    // Device binding (server-issued device id from HttpOnly cookie).
    const deviceId = resolveDeviceId(req, res);

    let user = await User.findOne({ email });

    const deviceCheck = await registerOrVerifyDevice({
      req,
      userId: user?._id || null,
    });
    if (!deviceCheck.ok) {
      return res.status(deviceCheck.status).json({
        success: false,
        code: deviceCheck.code,
        message: deviceCheck.message,
      });
    }

    if (!user) {
      const deviceExists = await User.findOne({ deviceId });
      if (deviceExists) {
        return res
          .status(400)
          .json({ message: "This device is already registered" });
      }

      user = await User.create({
        name: name || email.split("@")[0],
        email,
        // Google-only accounts still satisfy the User schema, but this random
        // hash cannot be used as a password login credential.
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12),
        googleId,
        avatar: picture,
        deviceId,
      });
      await registerOrVerifyDevice({ req, userId: user._id });
    } else if (!user.deviceId) {
      // First binding of a legacy Google account (no prior device binding).
      user.deviceId = deviceId;
      await user.save();
    } else if (user.deviceId !== deviceId) {
      await RefreshToken.updateMany(
        { userId: user._id, kind: "user", revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      user.deviceId = deviceId;
      await user.save();
    }

    if (!user.avatar && picture) {
      user.avatar = picture;
      await user.save();
    }

    const token = signAccessToken({
      userId: user._id,
      role: user.role,
      deviceId,
    });

    // Issue a refresh session (rotated on refresh), stored httpOnly.
    const refreshTokenValue = signRefreshToken({
      sub: String(user._id),
      kind: "user",
    });
    await RefreshToken.create({
      userId: user._id,
      kind: "user",
      tokenHash: hashToken(refreshTokenValue),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    setRefreshCookie(res, refreshTokenValue, "user");

    // Update lastLoginAt and lastActivityAt on successful Google login
    const now = new Date();
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: now, lastActivityAt: now } },
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: "Google sign-in failed",
    });
  }
});
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // ya req.user._id  (jo bhi aapke authMiddleware mein hai)

    const user = await User.findById(userId)
      .select("_id name email avatar") // ← Avatar add kiya
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optional: Token return karna hai toh yeh rakh sakte ho (mostly not needed)
    const token = req.headers.authorization?.split(" ")[1];

    return res.status(200).json({
      success: true,
      token: token || null, // agar zarurat nahi toh hata sakte ho
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null, // ← Ye important hai
      },
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
});
// Deprecated: use /api/admin/alluser instead (has rate limiting + requireAdmin)
// router.get("/alluser", requireAdmin, getAllUsers);

router.put("/user/:id", authMiddleware, imageUpload.single("avatar"), UserEdit);
router.put(
  "/user/password/:id",
  passwordLimiter,
  authMiddleware,
  updatePassword,
);
router.get("/me", authMiddleware, getMyProfile);

module.exports = router;

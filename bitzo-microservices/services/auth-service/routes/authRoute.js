const express = require("express");
const router = express.Router();
const User = require("../models/usermodel");
const authMiddleware = require("../middlewares/isAuthenticated");
const {
  loginLimiter,
  registerLimiter,
  passwordLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyResetOtpLimiter,
} = require("../middlewares/rateLimit");
const {
  saveDeviceFingerprint,
  registerUser,
  loginUser,
  googleLogin,
  mapRegistrationPhone,
  UserEdit,
  updatePassword,
  getMyProfile,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
} = require("../controller/authController");
const {
  requestPhoneOtp,
  verifyPhoneOtp,
  requestEmailBindingOtp,
  verifyEmailBindingOtp,
  requestPhoneBindingOtp,
  verifyPhoneBindingOtp,
  startLegacyMigration,
  verifyLegacyMigration,
} = require("../controller/phoneAuthController");
const { imageUpload } = require("../middlewares/multer");

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/phone/map", registerLimiter, authMiddleware, mapRegistrationPhone);
router.post("/device-fingerprint", saveDeviceFingerprint);
router.post("/claim-device", loginLimiter, (_req, res) =>
  res.status(410).json({
    success: false,
    code: "PHONE_AUTH_REQUIRED",
    message: "Sign in using your Indian mobile number and OTP.",
  }),
);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-reset-otp", verifyResetOtpLimiter, verifyResetOtp);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post(
  "/phone/request-otp",
  forgotPasswordLimiter,
  authMiddleware,
  requestPhoneBindingOtp,
);
router.post(
  "/phone/verify",
  verifyResetOtpLimiter,
  authMiddleware,
  verifyPhoneBindingOtp,
);
router.post("/phone-auth/request-otp", registerLimiter, requestPhoneOtp);
router.post("/phone-auth/verify-otp", loginLimiter, verifyPhoneOtp);
router.post("/phone-auth/migrate", registerLimiter, startLegacyMigration);
router.post("/phone-auth/migrate/verify", loginLimiter, verifyLegacyMigration);
router.post(
  "/phone-auth/email/request-otp",
  forgotPasswordLimiter,
  authMiddleware,
  requestEmailBindingOtp,
);
router.post(
  "/phone-auth/email/verify-otp",
  verifyResetOtpLimiter,
  authMiddleware,
  verifyEmailBindingOtp,
);

router.post("/auth/google", loginLimiter, googleLogin);
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // ya req.user._id  (jo bhi aapke authMiddleware mein hai)

    const user = await User.findById(userId)
      .select("_id name email emailVerified phone phoneVerified avatar")
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
        email: user.emailVerified ? user.email : null,
        emailVerified: user.emailVerified === true,
        phone: user.phone || null,
        phoneVerified: user.phoneVerified === true,
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
// Deprecated: use /api/admin/alluser instead.
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

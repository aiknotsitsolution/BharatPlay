const rateLimit = require("express-rate-limit");

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const jsonMessage = (message) => ({
  success: false,
  message,
});

// Single-instance in-memory rate limiting (Phase 4 / F18).
// Upgrade path: swap the default MemoryStore for a Redis adapter when the
// service is horizontally scaled (per Phase 4 audit §8).
const loginLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many login attempts. Please try again later."),
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many login attempts. Please try again later."),
});

const registerLimiter = rateLimit({
  windowMs: 1 * HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many registration attempts. Please try again later."),
});

const adminRegisterLimiter = rateLimit({
  windowMs: 1 * HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many registration attempts. Please try again later."),
});

const passwordLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many password change attempts. Please try again later."),
});

const googleLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many sign-in attempts. Please try again later."),
});

const refreshLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many refresh attempts. Please try again later."),
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many reset attempts. Please try again later."),
});

const verifyResetOtpLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many verification attempts. Please try again later."),
});

// Generous limit: watchSession.js flushes view events periodically
// (~30s) per open session, so the limit must not break normal playback.
const viewLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many view requests. Please slow down."),
});

// Admin user list (read-only, generous — table view + search + pagination)
const adminUserListLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

// Admin user detail / 360° endpoints (read-heavy, many sub-requests per user)
const adminUserLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

// Admin destructive operations (delete, suspend)
const adminDestructiveLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many destructive operations. Please try again later."),
});

// Public copyright claim submission (unauthenticated, strict limit)
const publicClaimLimiter = rateLimit({
  windowMs: 1 * HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many copyright claim submissions. Please try again later."),
});

// Public copyright claim status lookup (unauthenticated, generous)
const claimLookupLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

module.exports = {
  loginLimiter,
  adminLoginLimiter,
  registerLimiter,
  adminRegisterLimiter,
  passwordLimiter,
  googleLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyResetOtpLimiter,
  viewLimiter,
  adminUserListLimiter,
  adminUserLimiter,
  adminDestructiveLimiter,
  publicClaimLimiter,
  claimLookupLimiter,
};

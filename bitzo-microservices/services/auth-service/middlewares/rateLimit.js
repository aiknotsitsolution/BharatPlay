// Set ENABLE_RATE_LIMITS=false to disable protected middleware limits.
const rateLimit =
  process.env.ENABLE_RATE_LIMITS === "false"
    ? () => (_req, _res, next) => next()
    : require("express-rate-limit");
const { createRateLimitStore } = require("../../../services/ratelimiting");
let limiterIndex = 0;
const createLimiter = (options) => {
  const store =
    process.env.REDIS_URL?.trim() &&
    process.env.ENABLE_RATE_LIMITS !== "false"
      ? createRateLimitStore(`auth:limit:${limiterIndex++}:`)
      : undefined;
  return rateLimit(store ? { ...options, store } : options);
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const jsonMessage = (message) => ({
  success: false,
  message,
});

const loginLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many login attempts. Please try again later."),
});

const adminLoginLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many login attempts. Please try again later."),
});

const registerLimiter = createLimiter({
  windowMs: 2 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many registration attempts. Please try again later."),
});

const passwordLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many password change attempts. Please try again later."),
});

const googleLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many sign-in attempts. Please try again later."),
});

const refreshLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many refresh attempts. Please try again later."),
});

const forgotPasswordLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

const resetPasswordLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many reset attempts. Please try again later."),
});

const verifyResetOtpLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many verification attempts. Please try again later."),
});

// Generous limit: watchSession.js flushes view events periodically
// (~30s) per open session, so the limit must not break normal playback.
const viewLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many view requests. Please slow down."),
});

// Admin user list (read-only, generous — table view + search + pagination)
const adminUserListLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

// Admin user detail / 360° endpoints (read-heavy, many sub-requests per user)
const adminUserLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

// Admin destructive operations (delete, suspend)
const adminDestructiveLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many destructive operations. Please try again later."),
});

// Public copyright claim submission (unauthenticated, strict limit)
const publicClaimLimiter = createLimiter({
  windowMs: 1 * HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many copyright claim submissions. Please try again later."),
});

// Public copyright claim status lookup (unauthenticated, generous)
const claimLookupLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please try again later."),
});

// Public contact form submission (unauthenticated, strict limit — send emails)
const contactLimiter = createLimiter({
  windowMs: 1 * HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many support requests. Please try again later."),
});

// Public account deletion request (unauthenticated, strict limit — send emails)
const deletionLimiter = createLimiter({
  windowMs: 1 * HOUR,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonMessage("Too many deletion requests. Please try again later."),
});

module.exports = {
  loginLimiter,
  adminLoginLimiter,
  registerLimiter,
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
  contactLimiter,
  deletionLimiter,
};

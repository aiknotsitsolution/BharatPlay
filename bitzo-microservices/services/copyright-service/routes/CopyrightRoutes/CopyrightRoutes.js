const express = require("express");
const router = express.Router();
const {
  getCases,
  getCaseById,
  createCase,
  updateCaseStatus,
  assignCase,
  addEvidence,
  addNote,
  getStrikes,
  getStrikeById,
  disputeStrike,
  resolveStrikeDispute,
  getUserStrikes,
  getStats,
} = require("../../controller/CopyrightController/CopyrightController");
const requireAdmin = require("../../middlewares/requireAdmin");
const { requirePermission } = require("../../middlewares/checkAdminPermission");
const {
  adminUserListLimiter,
  adminDestructiveLimiter,
} = require("../../middlewares/rateLimit");

// ====================== CASES ======================
router.get(
  "/cases",
  requireAdmin,
  requirePermission("copyright:read"),
  adminUserListLimiter,
  getCases
);

router.get(
  "/cases/:id",
  requireAdmin,
  requirePermission("copyright:read"),
  getCaseById
);

router.post(
  "/cases",
  requireAdmin,
  requirePermission("copyright:write"),
  createCase
);

router.put(
  "/cases/:id/status",
  requireAdmin,
  requirePermission("copyright:write"),
  updateCaseStatus
);

router.put(
  "/cases/:id/assign",
  requireAdmin,
  requirePermission("copyright:write"),
  assignCase
);

router.post(
  "/cases/:id/evidence",
  requireAdmin,
  requirePermission("copyright:write"),
  addEvidence
);

router.post(
  "/cases/:id/notes",
  requireAdmin,
  requirePermission("copyright:write"),
  addNote
);

// ====================== STRIKES ======================
router.get(
  "/strikes",
  requireAdmin,
  requirePermission("copyright:read"),
  adminUserListLimiter,
  getStrikes
);

router.get(
  "/strikes/:id",
  requireAdmin,
  requirePermission("copyright:read"),
  getStrikeById
);

router.post(
  "/strikes/:id/dispute",
  requireAdmin,
  requirePermission("copyright:write"),
  disputeStrike
);

router.put(
  "/strikes/:id/resolve",
  requireAdmin,
  requirePermission("copyright:write"),
  adminDestructiveLimiter,
  resolveStrikeDispute
);

router.get(
  "/strikes/user/:userId",
  requireAdmin,
  requirePermission("copyright:read"),
  getUserStrikes
);

// ====================== STATS ======================
router.get(
  "/stats",
  requireAdmin,
  requirePermission("copyright:read"),
  getStats
);

module.exports = router;

const express = require("express");
const router = express.Router();
const { submitContactRequest, getContactRequests, getMyContactRequests, getContactRequestById, updateContactStatus } = require("../controller/contactController");
const { submitDeletionRequest, getDeletionRequests, getMyDeletionRequests, getDeletionRequestById, updateDeletionStatus } = require("../controller/deletionController");
const { submitContentReport } = require("../controller/contentReportController");
const { getSupportAssociates } = require("../controller/supportAssociateController");
const requireAdmin = require("../middlewares/requireAdmin");
const optionalAuth = require("../middlewares/optionalAuth");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { requirePermission } = require("../middlewares/requirePermission");
const { contactLimiter, deletionLimiter } = require("../middlewares/rateLimit");

// Public routes (optional auth attaches the logged-in userId)
router.post("/contact", contactLimiter, optionalAuth, submitContactRequest);
router.post("/deletion-request", deletionLimiter, optionalAuth, submitDeletionRequest);
router.post("/content-report", contactLimiter, optionalAuth, submitContentReport);

// User routes (must come before admin /:id routes)
router.get("/contact/mine", isAuthenticated, getMyContactRequests);
router.get("/deletion-request/mine", isAuthenticated, getMyDeletionRequests);

// Admin routes (admin auth + permission required)
router.get("/associates", requireAdmin, requirePermission("support:read"), getSupportAssociates);
router.get("/contact", requireAdmin, requirePermission("support:read"), getContactRequests);
router.get("/contact/:id", requireAdmin, requirePermission("support:read"), getContactRequestById);
router.patch("/contact/:id", requireAdmin, requirePermission("support:write"), updateContactStatus);
router.get("/deletion-request", requireAdmin, requirePermission("support:read"), getDeletionRequests);
router.get("/deletion-request/:id", requireAdmin, requirePermission("support:read"), getDeletionRequestById);
router.patch("/deletion-request/:id", requireAdmin, requirePermission("support:write"), updateDeletionStatus);

module.exports = router;
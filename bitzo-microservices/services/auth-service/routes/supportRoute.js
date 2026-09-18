const express = require("express");
const router = express.Router();
const { submitContactRequest, getContactRequests, getMyContactRequests, getContactRequestById, updateContactStatus } = require("../controller/contactController");
const { submitDeletionRequest, getDeletionRequests, getMyDeletionRequests, getDeletionRequestById, updateDeletionStatus } = require("../controller/deletionController");
const requireAdmin = require("../middlewares/requireAdmin");
const optionalAuth = require("../middlewares/optionalAuth");
const isAuthenticated = require("../middlewares/isAuthenticated");

// Public routes (optional auth attaches the logged-in userId)
router.post("/contact", optionalAuth, submitContactRequest);
router.post("/deletion-request", optionalAuth, submitDeletionRequest);

// User routes (must come before admin /:id routes)
router.get("/contact/mine", isAuthenticated, getMyContactRequests);
router.get("/deletion-request/mine", isAuthenticated, getMyDeletionRequests);

// Admin routes (admin auth required)
router.get("/contact", requireAdmin, getContactRequests);
router.get("/contact/:id", requireAdmin, getContactRequestById);
router.patch("/contact/:id", requireAdmin, updateContactStatus);
router.get("/deletion-request", requireAdmin, getDeletionRequests);
router.get("/deletion-request/:id", requireAdmin, getDeletionRequestById);
router.patch("/deletion-request/:id", requireAdmin, updateDeletionStatus);

module.exports = router;
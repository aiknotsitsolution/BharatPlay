const express = require("express");
const router = express.Router();
const { submitContactRequest, getContactRequests, getContactRequestById, updateContactStatus } = require("../controller/contactController");
const { submitDeletionRequest, getDeletionRequests, getDeletionRequestById, updateDeletionStatus } = require("../controller/deletionController");
const authMiddleware = require("../middlewares/isAuthenticated");
const requireAdmin = require("../middlewares/requireAdmin");

// Public routes (no auth required)
router.post("/contact", submitContactRequest);
router.post("/deletion-request", submitDeletionRequest);

// Admin routes (auth + admin required)
router.get("/contact", authMiddleware, requireAdmin, getContactRequests);
router.get("/contact/:id", authMiddleware, requireAdmin, getContactRequestById);
router.patch("/contact/:id", authMiddleware, requireAdmin, updateContactStatus);
router.get("/deletion-request", authMiddleware, requireAdmin, getDeletionRequests);
router.get("/deletion-request/:id", authMiddleware, requireAdmin, getDeletionRequestById);
router.patch("/deletion-request/:id", authMiddleware, requireAdmin, updateDeletionStatus);

module.exports = router;

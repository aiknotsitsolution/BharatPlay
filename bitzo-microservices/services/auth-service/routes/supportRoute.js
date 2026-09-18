const express = require("express");
const router = express.Router();
const { submitContactRequest, getContactRequests, updateContactStatus } = require("../controller/contactController");
const { submitDeletionRequest, getDeletionRequests, updateDeletionStatus } = require("../controller/deletionController");
const authMiddleware = require("../middlewares/isAuthenticated");
const requireAdmin = require("../middlewares/requireAdmin");

// Public routes (no auth required)
router.post("/contact", submitContactRequest);
router.post("/deletion-request", submitDeletionRequest);

// Admin routes (auth + admin required)
router.get("/contact", authMiddleware, requireAdmin, getContactRequests);
router.patch("/contact/:id", authMiddleware, requireAdmin, updateContactStatus);
router.get("/deletion-request", authMiddleware, requireAdmin, getDeletionRequests);
router.patch("/deletion-request/:id", authMiddleware, requireAdmin, updateDeletionStatus);

module.exports = router;

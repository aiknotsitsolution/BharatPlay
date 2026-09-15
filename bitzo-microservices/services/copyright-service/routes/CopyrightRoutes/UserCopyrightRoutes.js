const express = require("express");
const router = express.Router();
const CopyrightCase = require("../../models/CopyrightCase");
const CopyrightStrike = require("../../models/CopyrightStrike");
const Video = require("../../models/Videomodel");
const User = require("../../models/usermodel");
const Admin = require("../../models/admin/AdminModel");
const { logAuditEvent } = require("../../services/auditEventService");
const { createNotification } = require("../../utils/notificationService");
const isAuthenticated = require("../../middlewares/isAuthenticated");
const sendMailSafely = require("../../Email/sendMailSafely");
const {
  getCopyrightCounterNotificationMailOptions,
  getCopyrightClaimReceivedMailOptions,
} = require("../../Email/copyright");
const {
  publicClaimLimiter,
  claimLookupLimiter,
} = require("../../middlewares/rateLimit");

function isValidObjectId(id) {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
}

// GET /api/copyright/my-strikes
router.get("/my-strikes", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const strikes = await CopyrightStrike.find({ user: userId })
      .sort("-createdAt")
      .populate({ path: "content.video", select: "title thumbnail videoUrl", model: Video })
      .populate({ path: "issuedBy", select: "name email", model: Admin })
      .lean();

    const activeCount = strikes.filter((s) => s.status === "active").length;

    return res.status(200).json({
      success: true,
      data: {
        strikes,
        activeCount,
        total: strikes.length,
      },
    });
  } catch (err) {
    console.error("getUserStrikes error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch strikes" });
  }
});

// GET /api/copyright/my-cases
router.get("/my-cases", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cases = await CopyrightCase.find({ respondent: userId })
      .sort("-createdAt")
      .populate({ path: "content.video", select: "title thumbnail videoUrl", model: Video })
      .populate({ path: "assignedTo", select: "name email", model: Admin })
      .lean();

    return res.status(200).json({
      success: true,
      data: cases,
    });
  } catch (err) {
    console.error("getUserCases error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch cases" });
  }
});

// POST /api/copyright/counter-notification
router.post("/counter-notification", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { strikeId, reason, additionalInfo } = req.body;

    if (!strikeId || !reason) {
      return res.status(400).json({
        success: false,
        message: "strikeId and reason are required",
      });
    }

    if (!isValidObjectId(strikeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid strike ID" });
    }

    const strike = await CopyrightStrike.findById(strikeId);
    if (!strike) {
      return res
        .status(404)
        .json({ success: false, message: "Strike not found" });
    }

    if (String(strike.user) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only dispute your own strikes",
      });
    }

    if (strike.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Cannot dispute strike with status "${strike.status}"`,
      });
    }

    strike.status = "disputed";
    strike.dispute = {
      filed: true,
      filedAt: new Date(),
      reason: reason,
      additionalInfo: additionalInfo || null,
      resolvedAt: null,
      outcome: null,
    };
    strike.statusHistory.push({
      from: "active",
      to: "disputed",
      changedBy: userId,
      reason: `Counter-notification: ${reason}${additionalInfo ? ` — ${additionalInfo}` : ""}`,
    });
    await strike.save();

    const copyrightCase = await CopyrightCase.findById(strike.case);
    if (copyrightCase) {
      const previousCaseStatus = copyrightCase.status;
      copyrightCase.status = "disputed";
      copyrightCase.statusHistory.push({
        from: previousCaseStatus,
        to: "disputed",
        changedBy: null,
        reason: `Counter-notification filed by user: ${reason}`,
      });
      await copyrightCase.save();
    }

    await logAuditEvent({
      userId,
      eventType: "COPYRIGHT_STRIKE_DISPUTED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        strikeId: strike._id,
        caseId: strike.case,
        source: "user_counter_notification",
      },
    });

    // Email: notify all admins of counter-notification
    try {
      const user = await User.findById(userId).select("name email").lean();
      const admins = await Admin.find({
        role: { $in: ["admin", "support"] },
        isActive: true,
      })
        .select("name email")
        .lean();

      if (admins.length > 0 && copyrightCase) {
        const adminEmails = admins.filter((a) => a.email).map((a) => a.email);
        for (const adminEmail of adminEmails) {
          const adminRecip = admins.find((a) => a.email === adminEmail);
          const mailOpts = getCopyrightCounterNotificationMailOptions(
            adminEmail,
            adminRecip?.name || "Admin",
            {
              caseNumber: copyrightCase.caseNumber,
              videoTitle: copyrightCase.content?.title || "",
              userName: user?.name || "User",
              reason,
            },
          );
          sendMailSafely(mailOpts);
        }
      }
    } catch (mailErr) {
      console.error(
        "Failed to send counter-notification emails:",
        mailErr.message,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Counter-notification submitted successfully",
      data: {
        strikeId: strike._id,
        status: strike.status,
      },
    });
  } catch (err) {
    console.error("counterNotification error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to submit counter-notification",
      });
  }
});

// ====================== PUBLIC CLAIM SUBMISSION ======================

// POST /api/copyright/claim — Submit a copyright claim (no auth required)
router.post("/claim", publicClaimLimiter, async (req, res) => {
  try {
    const {
      claimantName,
      claimantEmail,
      claimantPhone,
      claimantAddress,
      claimantOrganization,
      claimantRelationship,
      videoId,
      claimType,
      claimDescription,
      originalWork,
      originalWorkUrl,
      declaration,
    } = req.body;

    // --- Validation ---
    const errors = [];
    if (!claimantName || !claimantName.trim())
      errors.push("Claimant name is required");
    if (!claimantEmail || !claimantEmail.trim())
      errors.push("Claimant email is required");
    if (
      !claimantEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimantEmail.trim())
    ) {
      errors.push("A valid email address is required");
    }
    if (!videoId || !isValidObjectId(videoId))
      errors.push("A valid video ID is required");
    if (!claimType) errors.push("Claim type is required");
    if (!claimDescription || !claimDescription.trim())
      errors.push("Claim description is required");
    if (!declaration) errors.push("You must agree to the declaration");

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: errors.join("; ") });
    }

    // Verify video exists and is accessible
    const video = await Video.findById(videoId)
      .select("title videoUrl creator uploadedBy status")
      .lean();
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }
    if (video.status === "deleted") {
      return res
        .status(410)
        .json({ success: false, message: "This video has been deleted" });
    }

    // Determine respondent (the user who uploaded the video)
    const respondentId = video.creator || video.uploadedBy;
    if (!respondentId) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to determine video owner" });
    }

    // Check for duplicate claim on same video from same email (within 48 hours)
    const recentDuplicate = await CopyrightCase.findOne({
      "content.video": videoId,
      "claimant.email": claimantEmail.trim().toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      source: "public_submission",
    }).lean();

    if (recentDuplicate) {
      return res.status(409).json({
        success: false,
        message:
          "A copyright claim for this video was recently submitted with this email. Reference: " +
          recentDuplicate.caseNumber,
      });
    }

    // --- Generate case number ---
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const count = await CopyrightCase.countDocuments({
      source: "public_submission",
    });
    const seq = String(count + 1).padStart(4, "0");
    const caseNumber = `PUB-${yy}${mm}${dd}-${seq}`;

    // Resolve optional logged-in user
    let resolvedUserId = null;
    try {
      const jwt = require("jsonwebtoken");
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        resolvedUserId = decoded?.sub || decoded?.userId || decoded?.id || null;
      }
    } catch (_) {
      // Not logged in — that's fine for public submission
    }

    const copyrightCase = await CopyrightCase.create({
      caseNumber,
      source: "public_submission",
      claimant: {
        name: claimantName.trim(),
        email: claimantEmail.trim().toLowerCase(),
        phone: (claimantPhone || "").trim(),
        address: (claimantAddress || "").trim(),
        organization: (claimantOrganization || "").trim(),
        relationship: claimantRelationship || "owner",
        declaration: !!declaration,
        userId: resolvedUserId,
      },
      content: {
        video: videoId,
        title: video.title || "",
        url: video.videoUrl || "",
      },
      respondent: respondentId,
      claim: {
        type: claimType || "takedown",
        description: (claimDescription || "").trim(),
        originalWork: (originalWork || "").trim(),
        originalWorkUrl: (originalWorkUrl || "").trim(),
      },
      status: "pending",
      priority: "medium",
      claimantIP: req.ip,
      claimantUserAgent: req.get("User-Agent"),
      statusHistory: [
        {
          from: "new",
          to: "pending",
          changedBy: null,
          reason: "Public claim submitted",
        },
      ],
    });

    // Fire audit event
    await logAuditEvent({
      userId: resolvedUserId,
      eventType: "COPYRIGHT_PUBLIC_CLAIM_SUBMITTED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        caseId: copyrightCase._id,
        caseNumber,
        videoId,
        claimantEmail: claimantEmail.trim().toLowerCase(),
      },
    });

    // Notify all admins
    try {
      const admins = await User.find({ role: { $in: ["admin", "support"] } })
        .select("_id")
        .lean();
      await Promise.all(
        admins.map((admin) =>
          createNotification({
            recipient: admin._id,
            actor: resolvedUserId,
            type: "copyright_case_created",
            video: videoId,
          }),
        ),
      );

      // Email: notify all admin/support users of new public claim
      const adminDocs = await Admin.find({
        role: { $in: ["admin", "support"] },
        isActive: true,
      })
        .select("name email")
        .lean();
      for (const admin of adminDocs) {
        if (!admin.email) continue;
        const mailOpts = getCopyrightClaimReceivedMailOptions(
          admin.email,
          admin.name,
          {
            caseNumber,
            claimantName: claimantName.trim(),
            videoTitle: video.title || "Untitled",
          },
        );
        sendMailSafely(mailOpts);
      }
    } catch (notifErr) {
      console.error(
        "Failed to notify admins of public copyright claim:",
        notifErr,
      );
    }

    return res.status(201).json({
      success: true,
      message: "Copyright claim submitted successfully",
      data: {
        caseNumber: copyrightCase.caseNumber,
        reference: caseNumber,
        status: copyrightCase.status,
      },
    });
  } catch (err) {
    console.error("submitPublicClaim error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit copyright claim" });
  }
});

// GET /api/copyright/claim/:reference — Check claim status by reference number
router.get("/claim/:reference", claimLookupLimiter, async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference || !reference.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Reference number is required" });
    }

    const copyrightCase = await CopyrightCase.findOne({
      caseNumber: reference.trim(),
    })
      .select(
        "caseNumber status source createdAt claim.type claim.description resolution",
      )
      .lean();

    if (!copyrightCase) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No claim found with that reference number",
        });
    }

    return res.status(200).json({
      success: true,
      data: {
        caseNumber: copyrightCase.caseNumber,
        status: copyrightCase.status,
        source: copyrightCase.source,
        filedAt: copyrightCase.createdAt,
        claimType: copyrightCase.claim?.type,
        claimDescription: copyrightCase.claim?.description,
        resolution: copyrightCase.resolution?.decision
          ? {
              decision: copyrightCase.resolution.decision,
              reason: copyrightCase.resolution.reason,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("getPublicClaimStatus error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch claim status" });
  }
});

// GET /api/copyright/my-videos/search?q=... — search logged-in user's own videos
router.get("/my-videos/search", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const q = (req.query.q || "").trim();
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    const Channel = require("../../models/Channel/ChannelModel");
    const userChannels = await Channel.find({ creator: userId })
      .select("_id")
      .lean();
    const channelIds = userChannels.map((c) => c._id);

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const videos = await Video.find({
      $or: [
        { creator: userId },
        { uploadedBy: userId },
        ...(channelIds.length ? [{ channel: { $in: channelIds } }] : []),
      ],
      title: regex,
      status: "active",
    })
      .select("title videoUrl thumbnail")
      .sort("-createdAt")
      .limit(20)
      .lean();

    return res.status(200).json({ success: true, data: videos });
  } catch (err) {
    console.error("searchMyVideos error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to search videos" });
  }
});

// GET /api/copyright/my-claims — logged-in user's filed claims
router.get("/my-claims", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("email").lean();
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const claims = await CopyrightCase.find({
      $or: [
        { "claimant.userId": userId },
        { "claimant.email": user.email.toLowerCase() },
      ],
    })
      .select(
        "caseNumber status priority source createdAt claim.type claim.description claim.originalWork content.title claimant.name",
      )
      .sort("-createdAt")
      .lean();

    return res.status(200).json({ success: true, data: claims });
  } catch (err) {
    console.error("getMyClaims error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch your claims" });
  }
});

module.exports = router;

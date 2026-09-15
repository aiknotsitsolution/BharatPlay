const CopyrightCase = require("../../models/CopyrightCase");
const CopyrightStrike = require("../../models/CopyrightStrike");
const Video = require("../../models/Videomodel");
const User = require("../../models/usermodel");
const Admin = require("../../models/admin/AdminModel");
const { logAuditEvent } = require("../../services/auditEventService");
const { createNotification } = require("../../utils/notificationService");
const sendMailSafely = require("../../Email/sendMailSafely");
const {
  getCopyrightTakedownApprovedMailOptions,
  getCopyrightStrikeIssuedMailOptions,
  getCopyrightCaseResolvedMailOptions,
  getCopyrightMoreInfoRequiredMailOptions,
} = require("../../Email/copyright");

function isValidObjectId(id) {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
}

function generateCaseNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CR-${timestamp}-${random}`;
}

// ====================== CASES ======================

// GET /api/admin/copyright/cases
exports.getCases = async (req, res) => {
  try {
    const {
      status,
      priority,
      page = 1,
      limit = 20,
      search,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { caseNumber: { $regex: search, $options: "i" } },
        { "claimant.name": { $regex: search, $options: "i" } },
        { "claimant.email": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const cap = Math.min(100, Math.max(1, parseInt(limit)));

    const [cases, total] = await Promise.all([
      CopyrightCase.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(cap)
        .populate({ path: "respondent", select: "name email channelImage", model: User })
        .populate({ path: "assignedTo", select: "name email", model: Admin })
        .populate({ path: "content.video", select: "title videoUrl thumbnail", model: Video })
        .lean(),
      CopyrightCase.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: cases,
      pagination: {
        total,
        page: parseInt(page),
        limit: cap,
        pages: Math.ceil(total / cap),
      },
    });
  } catch (err) {
    console.error("getCases error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch cases" });
  }
};

// GET /api/admin/copyright/cases/:id
exports.getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid case ID" });
    }

    const copyrightCase = await CopyrightCase.findById(id)
      .populate({ path: "respondent", select: "name email channelImage", model: User })
      .populate({ path: "assignedTo", select: "name email", model: Admin })
      .populate({ path: "content.video", select: "title videoUrl thumbnail videoType", model: Video })
      .populate({ path: "evidence.uploadedBy", select: "name email", model: User })
      .populate({ path: "resolution.resolvedBy", select: "name email", model: Admin })
      .populate("strike")
      .lean();

    if (!copyrightCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    return res.status(200).json({ success: true, data: copyrightCase });
  } catch (err) {
    console.error("getCaseById error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch case" });
  }
};

// POST /api/admin/copyright/cases
exports.createCase = async (req, res) => {
  try {
    const {
      claimantName,
      claimantEmail,
      claimantOrganization,
      videoId,
      respondentId,
      claimType,
      claimDescription,
      originalWork,
      originalWorkUrl,
      priority,
    } = req.body;

    if (!claimantName || !claimantEmail || !videoId || !respondentId || !claimType) {
      return res.status(400).json({
        success: false,
        message: "claimantName, claimantEmail, videoId, respondentId, and claimType are required",
      });
    }

    if (!isValidObjectId(videoId) || !isValidObjectId(respondentId)) {
      return res.status(400).json({ success: false, message: "Invalid videoId or respondentId" });
    }

    const [video, user] = await Promise.all([
      Video.findById(videoId).select("title videoUrl").lean(),
      User.findById(respondentId).select("name email").lean(),
    ]);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "Respondent user not found" });
    }

    const copyrightCase = await CopyrightCase.create({
      caseNumber: generateCaseNumber(),
      claimant: {
        name: claimantName,
        email: claimantEmail,
        organization: claimantOrganization || "",
      },
      content: {
        video: videoId,
        title: video.title,
        url: video.videoUrl,
      },
      respondent: respondentId,
      claim: {
        type: claimType,
        description: claimDescription || "",
        originalWork: originalWork || "",
        originalWorkUrl: originalWorkUrl || "",
      },
      priority: priority || "medium",
      statusHistory: [
        {
          from: "",
          to: "pending",
          changedBy: req.admin?._id || null,
          reason: "Case created",
        },
      ],
    });

    await logAuditEvent({
      userId: respondentId,
      eventType: "COPYRIGHT_CASE_CREATED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: { caseId: copyrightCase._id, caseNumber: copyrightCase.caseNumber },
    });

    return res.status(201).json({ success: true, data: copyrightCase });
  } catch (err) {
    console.error("createCase error:", err);
    return res.status(500).json({ success: false, message: "Failed to create case" });
  }
};

// PUT /api/admin/copyright/cases/:id/status
exports.updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus, reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid case ID" });
    }

    const VALID_CASE_TRANSITIONS = {
      pending: ["under_review", "withdrawn"],
      under_review: ["more_information_required", "takedown_approved", "takedown_rejected", "disputed", "withdrawn"],
      more_information_required: ["under_review", "withdrawn"],
      takedown_approved: ["action_pending", "resolved"],
      action_pending: ["resolved"],
      takedown_rejected: ["resolved"],
      disputed: ["dispute_under_review"],
      dispute_under_review: ["dispute_upheld", "dispute_overturned"],
      dispute_upheld: ["resolved"],
      dispute_overturned: ["resolved"],
      resolved: [],
      withdrawn: [],
    };

    const copyrightCase = await CopyrightCase.findById(id);
    if (!copyrightCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    const currentStatus = copyrightCase.status;
    const allowed = VALID_CASE_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      });
    }

    copyrightCase.statusHistory.push({
      from: currentStatus,
      to: newStatus,
      changedBy: req.admin?._id || null,
      reason: reason || "",
    });
    copyrightCase.status = newStatus;

    // If takedown approved → create a strike + disable video
    if (newStatus === "takedown_approved") {
      const strike = await CopyrightStrike.create({
        user: copyrightCase.respondent,
        case: copyrightCase._id,
        content: {
          video: copyrightCase.content.video,
          title: copyrightCase.content.title,
        },
        reason: reason || "Copyright takedown approved",
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        issuedBy: req.admin?._id || null,
        statusHistory: [
          { from: "new", to: "active", changedBy: req.admin?._id || null, reason: "Strike issued" },
        ],
      });

      copyrightCase.strike = strike._id;

      copyrightCase.resolution = {
        decision: "takedown_approved",
        reason: reason || "",
        resolvedBy: req.admin?._id || null,
        resolvedAt: new Date(),
      };

      // Disable the infringing video
      await Video.findByIdAndUpdate(copyrightCase.content.video, {
        status: "disabled",
        disabledAt: new Date(),
        disabledBy: req.admin?._id || null,
        disableReason: reason || `Copyright takedown approved - Case ${copyrightCase.caseNumber}`,
      });

      await createNotification({
        recipient: copyrightCase.respondent,
        actor: req.admin?._id || null,
        type: "copyright_takedown_approved",
        video: copyrightCase.content.video,
      });

      await logAuditEvent({
        userId: copyrightCase.respondent,
        eventType: "COPYRIGHT_STRIKE_ISSUED",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        metadata: {
          caseId: copyrightCase._id,
          strikeId: strike._id,
          caseNumber: copyrightCase.caseNumber,
        },
      });

      // Email: notify respondent of takedown + strike
      try {
        const respondent = await User.findById(copyrightCase.respondent).select("name email").lean();
        if (respondent?.email) {
          const mailOpts = getCopyrightTakedownApprovedMailOptions(respondent.email, respondent.name, {
            caseNumber: copyrightCase.caseNumber,
            videoTitle: copyrightCase.content.title,
            reason,
          });
          sendMailSafely(mailOpts);

          const strikeMailOpts = getCopyrightStrikeIssuedMailOptions(respondent.email, respondent.name, {
            caseNumber: copyrightCase.caseNumber,
            videoTitle: copyrightCase.content.title,
            reason,
            expiresAt: strike.expiresAt,
          });
          sendMailSafely(strikeMailOpts);
        }
      } catch (mailErr) {
        console.error("Failed to send takedown email:", mailErr.message);
      }
    }

    // If takedown rejected
    if (newStatus === "takedown_rejected") {
      copyrightCase.resolution = {
        decision: "takedown_rejected",
        reason: reason || "",
        resolvedBy: req.admin?._id || null,
        resolvedAt: new Date(),
      };

      await createNotification({
        recipient: copyrightCase.respondent,
        actor: req.admin?._id || null,
        type: "copyright_takedown_rejected",
        video: copyrightCase.content.video,
      });

      // Email: notify claimant of rejection
      try {
        if (copyrightCase.claimant?.email) {
          const mailOpts = getCopyrightCaseResolvedMailOptions(
            copyrightCase.claimant.email,
            copyrightCase.claimant.name,
            {
              caseNumber: copyrightCase.caseNumber,
              decision: "takedown_rejected",
              reason: reason || "",
            },
          );
          sendMailSafely(mailOpts);
        }
      } catch (mailErr) {
        console.error("Failed to send rejection email:", mailErr.message);
      }
    }

    // If more information required → notify claimant
    if (newStatus === "more_information_required") {
      try {
        if (copyrightCase.claimant?.email) {
          const mailOpts = getCopyrightMoreInfoRequiredMailOptions(
            copyrightCase.claimant.email,
            copyrightCase.claimant.name,
            {
              caseNumber: copyrightCase.caseNumber,
              videoTitle: copyrightCase.content.title,
              adminNote: reason || "",
            },
          );
          sendMailSafely(mailOpts);
        }
      } catch (mailErr) {
        console.error("Failed to send more-info email:", mailErr.message);
      }
    }

    // If dispute filed
    if (newStatus === "disputed") {
      copyrightCase.statusHistory[copyrightCase.statusHistory.length - 1].changedBy = null;
      await createNotification({
        recipient: copyrightCase.respondent,
        actor: req.admin?._id || null,
        type: "copyright_dispute_filed",
        video: copyrightCase.content.video,
      });
    }

    // If dispute overturned → remove strike
    if (newStatus === "dispute_overturned" && copyrightCase.strike) {
      const strike = await CopyrightStrike.findById(copyrightCase.strike);
      if (strike && strike.status === "active") {
        strike.status = "removed";
        strike.resolvedBy = req.admin?._id || null;
        strike.dispute.outcome = "overturned";
        strike.dispute.resolvedAt = new Date();
        strike.statusHistory.push({
          from: "active",
          to: "removed",
          changedBy: req.admin?._id || null,
          reason: "Strike overturned by dispute resolution",
        });
        await strike.save();
      }

      // Email: notify claimant that dispute was overturned (content restored)
      try {
        if (copyrightCase.claimant?.email) {
          const mailOpts = getCopyrightCaseResolvedMailOptions(
            copyrightCase.claimant.email,
            copyrightCase.claimant.name,
            {
              caseNumber: copyrightCase.caseNumber,
              decision: "dispute_overturned",
              reason: reason || "The dispute was upheld and the content has been restored.",
            },
          );
          sendMailSafely(mailOpts);
        }
      } catch (mailErr) {
        console.error("Failed to send overturn email:", mailErr.message);
      }
    }

    // If resolved
    if (newStatus === "resolved") {
      await createNotification({
        recipient: copyrightCase.respondent,
        actor: req.admin?._id || null,
        type: "copyright_case_resolved",
        video: copyrightCase.content.video,
      });

      // Email: notify claimant of resolution
      try {
        if (copyrightCase.claimant?.email) {
          const mailOpts = getCopyrightCaseResolvedMailOptions(
            copyrightCase.claimant.email,
            copyrightCase.claimant.name,
            {
              caseNumber: copyrightCase.caseNumber,
              decision: copyrightCase.resolution?.decision || newStatus,
              reason: copyrightCase.resolution?.reason || reason || "",
            },
          );
          sendMailSafely(mailOpts);
        }
      } catch (mailErr) {
        console.error("Failed to send resolution email:", mailErr.message);
      }
    }

    await copyrightCase.save();

    await logAuditEvent({
      userId: copyrightCase.respondent,
      eventType: "COPYRIGHT_CASE_STATUS_CHANGED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        caseId: copyrightCase._id,
        from: currentStatus,
        to: newStatus,
        caseNumber: copyrightCase.caseNumber,
      },
    });

    return res.status(200).json({ success: true, data: copyrightCase });
  } catch (err) {
    console.error("updateCaseStatus error:", err);
    return res.status(500).json({ success: false, message: "Failed to update case status" });
  }
};

// PUT /api/admin/copyright/cases/:id/assign
exports.assignCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid case ID" });
    }
    if (!isValidObjectId(adminId)) {
      return res.status(400).json({ success: false, message: "Invalid admin ID" });
    }

    const [copyrightCase, admin] = await Promise.all([
      CopyrightCase.findById(id),
      Admin.findById(adminId).select("name email role").lean(),
    ]);

    if (!copyrightCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    copyrightCase.assignedTo = adminId;
    if (copyrightCase.status === "pending") {
      copyrightCase.statusHistory.push({
        from: copyrightCase.status,
        to: "under_review",
        changedBy: req.admin?._id || null,
        reason: `Assigned to ${admin.name}`,
      });
      copyrightCase.status = "under_review";
    }
    await copyrightCase.save();

    await logAuditEvent({
      userId: copyrightCase.respondent,
      eventType: "COPYRIGHT_CASE_ASSIGNED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        caseId: copyrightCase._id,
        assignedTo: adminId,
        caseNumber: copyrightCase.caseNumber,
      },
    });

    return res.status(200).json({ success: true, data: copyrightCase });
  } catch (err) {
    console.error("assignCase error:", err);
    return res.status(500).json({ success: false, message: "Failed to assign case" });
  }
};

// POST /api/admin/copyright/cases/:id/evidence
exports.addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, description, url } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid case ID" });
    }
    if (!type) {
      return res.status(400).json({ success: false, message: "Evidence type is required" });
    }

    const copyrightCase = await CopyrightCase.findById(id);
    if (!copyrightCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    copyrightCase.evidence.push({
      type,
      title: title || "",
      description: description || "",
      url: url || "",
      uploadedBy: req.admin?._id || null,
    });

    await copyrightCase.save();

    await logAuditEvent({
      userId: copyrightCase.respondent,
      eventType: "COPYRIGHT_CASE_EVIDENCE_ADDED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        caseId: copyrightCase._id,
        evidenceType: type,
        caseNumber: copyrightCase.caseNumber,
      },
    });

    return res.status(200).json({ success: true, data: copyrightCase });
  } catch (err) {
    console.error("addEvidence error:", err);
    return res.status(500).json({ success: false, message: "Failed to add evidence" });
  }
};

// POST /api/admin/copyright/cases/:id/notes
exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid case ID" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Note text is required" });
    }

    const copyrightCase = await CopyrightCase.findById(id);
    if (!copyrightCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    copyrightCase.notes.push({
      text: text.trim(),
      author: req.admin?._id || null,
    });

    await copyrightCase.save();

    await logAuditEvent({
      userId: copyrightCase.respondent,
      eventType: "COPYRIGHT_NOTE_ADDED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        caseId: copyrightCase._id,
        caseNumber: copyrightCase.caseNumber,
        noteAuthor: req.admin?._id || null,
      },
    });

    return res.status(200).json({ success: true, data: copyrightCase });
  } catch (err) {
    console.error("addNote error:", err);
    return res.status(500).json({ success: false, message: "Failed to add note" });
  }
};

// ====================== STRIKES ======================

// GET /api/admin/copyright/strikes
exports.getStrikes = async (req, res) => {
  try {
    const {
      status,
      userId,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId && isValidObjectId(userId)) filter.user = userId;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const cap = Math.min(100, Math.max(1, parseInt(limit)));

    const [strikes, total] = await Promise.all([
      CopyrightStrike.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(cap)
        .populate({ path: "user", select: "name email channelImage", model: User })
        .populate("case", "caseNumber")
        .populate({ path: "content.video", select: "title videoUrl thumbnail", model: Video })
        .populate({ path: "issuedBy", select: "name email", model: Admin })
        .lean(),
      CopyrightStrike.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: strikes,
      pagination: {
        total,
        page: parseInt(page),
        limit: cap,
        pages: Math.ceil(total / cap),
      },
    });
  } catch (err) {
    console.error("getStrikes error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch strikes" });
  }
};

// GET /api/admin/copyright/strikes/:id
exports.getStrikeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid strike ID" });
    }

    const strike = await CopyrightStrike.findById(id)
      .populate({ path: "user", select: "name email channelImage", model: User })
      .populate("case", "caseNumber status")
      .populate({ path: "content.video", select: "title videoUrl thumbnail videoType", model: Video })
      .populate({ path: "issuedBy", select: "name email", model: Admin })
      .populate({ path: "resolvedBy", select: "name email", model: Admin })
      .lean();

    if (!strike) {
      return res.status(404).json({ success: false, message: "Strike not found" });
    }

    return res.status(200).json({ success: true, data: strike });
  } catch (err) {
    console.error("getStrikeById error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch strike" });
  }
};

// POST /api/admin/copyright/strikes/:id/dispute
exports.disputeStrike = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid strike ID" });
    }

    const strike = await CopyrightStrike.findById(id);
    if (!strike) {
      return res.status(404).json({ success: false, message: "Strike not found" });
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
      reason: reason || "",
      resolvedAt: null,
      outcome: null,
    };
    strike.statusHistory.push({
      from: "active",
      to: "disputed",
      changedBy: null,
      reason: reason || "Dispute filed",
    });

    await strike.save();

    await logAuditEvent({
      userId: strike.user,
      eventType: "COPYRIGHT_STRIKE_DISPUTED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: { strikeId: strike._id, caseId: strike.case },
    });

    return res.status(200).json({ success: true, data: strike });
  } catch (err) {
    console.error("disputeStrike error:", err);
    return res.status(500).json({ success: false, message: "Failed to dispute strike" });
  }
};

// PUT /api/admin/copyright/strikes/:id/resolve
exports.resolveStrikeDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid strike ID" });
    }
    if (!["upheld", "overturned"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "outcome must be 'upheld' or 'overturned'",
      });
    }

    const strike = await CopyrightStrike.findById(id);
    if (!strike) {
      return res.status(404).json({ success: false, message: "Strike not found" });
    }

    if (strike.status !== "disputed") {
      return res.status(400).json({
        success: false,
        message: `Cannot resolve dispute for strike with status "${strike.status}"`,
      });
    }

    const newStatus = outcome === "overturned" ? "removed" : "active";
    strike.status = newStatus;
    strike.resolvedBy = req.admin?._id || null;
    strike.dispute.outcome = outcome;
    strike.dispute.resolvedAt = new Date();
    strike.statusHistory.push({
      from: "disputed",
      to: newStatus,
      changedBy: req.admin?._id || null,
      reason: reason || `Dispute ${outcome}`,
    });

    await strike.save();

    await createNotification({
      recipient: strike.user,
      actor: req.admin?._id || null,
      type: "copyright_dispute_resolved",
      video: strike.content.video,
    });

    await logAuditEvent({
      userId: strike.user,
      eventType: "COPYRIGHT_STRIKE_DISPUTE_RESOLVED",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: {
        strikeId: strike._id,
        outcome,
        caseId: strike.case,
      },
    });

    return res.status(200).json({ success: true, data: strike });
  } catch (err) {
    console.error("resolveStrikeDispute error:", err);
    return res.status(500).json({ success: false, message: "Failed to resolve strike dispute" });
  }
};

// GET /api/admin/copyright/strikes/user/:userId
exports.getUserStrikes = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const strikes = await CopyrightStrike.find({ user: userId })
      .sort("-createdAt")
      .populate({ path: "content.video", select: "title thumbnail", model: Video })
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
    return res.status(500).json({ success: false, message: "Failed to fetch user strikes" });
  }
};

// ====================== STATS ======================

// GET /api/admin/copyright/stats
exports.getStats = async (req, res) => {
  try {
    const [
      totalCases,
      pendingCases,
      resolvedCases,
      totalStrikes,
      activeStrikes,
    ] = await Promise.all([
      CopyrightCase.countDocuments(),
      CopyrightCase.countDocuments({ status: { $in: ["pending", "under_review"] } }),
      CopyrightCase.countDocuments({ status: "resolved" }),
      CopyrightStrike.countDocuments(),
      CopyrightStrike.countDocuments({ status: "active" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        cases: { total: totalCases, pending: pendingCases, resolved: resolvedCases },
        strikes: { total: totalStrikes, active: activeStrikes },
      },
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

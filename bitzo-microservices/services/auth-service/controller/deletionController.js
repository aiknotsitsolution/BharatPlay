const DeletionRequest = require("../models/DeletionRequest");
const User = require("../models/usermodel");
const transporter = require("../Email/nodemailer");
const {
  assignTicket,
  DELETION_CATEGORY,
  isAssignableEmployeeId,
} = require("../services/assignmentService");
const {
  escapeHtml,
  cleanSubjectFragment,
  notifyDeletionUser,
} = require("../utils/supportNotification");
const { ticketIdFromMongoId } = require("../utils/ticketId");

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL;

const DELETION_STATUSES = ["pending", "verified", "processing", "completed", "rejected"];

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.submitDeletionRequest = async (req, res) => {
  try {
    const { email, accountIdentifier, reason } = req.body;

    if (!email?.trim())
      return res.status(400).json({ success: false, message: "Email is required." });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()))
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });

    // Associate with logged-in user if present, otherwise find by email
    let userId = req.user?.id || null;
    if (!userId) {
      const userByEmail = await User.findOne({
        email: email.trim().toLowerCase(),
      }).lean();
      userId = userByEmail?._id || null;
    }

    const employee = await assignTicket(DELETION_CATEGORY);

    const deletionRequest = await DeletionRequest.create({
      email: email.trim().toLowerCase(),
      accountIdentifier: accountIdentifier?.trim() || "",
      reason: reason?.trim() || "",
      userId,
      assignedTo: employee ? String(employee._id) : null,
      assignedAt: employee ? new Date() : null,
      assignedBy: employee ? "system" : null,
    });

    const ticketId = ticketIdFromMongoId(deletionRequest._id);

    // Notify support team
    if (SUPPORT_EMAIL) {
      try {
        await transporter.sendMail({
          from: `"BharatPlay" <${process.env.EMAIL}>`,
          to: SUPPORT_EMAIL,
          subject: `[BharatPlay] Account Deletion Request - ${cleanSubjectFragment(email)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Account Deletion Request</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px;">${escapeHtml(email)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Account ID:</td><td style="padding: 8px;">${escapeHtml(accountIdentifier?.trim() || "N/A")}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">User Found:</td><td style="padding: 8px;">${userId ? "Yes (" + userId + ")" : "No"}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Reason:</td><td style="padding: 8px;">${escapeHtml(reason?.trim() || "Not provided")}</td></tr>
                ${
                  employee
                    ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">Assigned To:</td><td style="padding: 8px;">${escapeHtml(employee.name)}</td></tr>`
                    : ""
                }
              </table>
              <p style="margin-top: 16px; color: #999; font-size: 12px;">
                Ticket ID: ${ticketId} | Request ID: ${deletionRequest._id} | Submitted: ${new Date().toISOString()}
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[deletion] Email notification failed:", emailErr.message);
      }
    }

    // Confirmation email to user
    try {
      await transporter.sendMail({
        from: `"BharatPlay" <${process.env.EMAIL}>`,
        to: email.trim(),
        subject: "Account Deletion Request Received - BharatPlay",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Deletion Request Received</h2>
            <p>Hi,</p>
            <p>We've received your request to delete the BharatPlay account associated with <strong>${escapeHtml(email)}</strong>.</p>
            <p>Our team will verify your request and process the deletion in accordance with applicable law. This may take some time.</p>
            <div style="margin: 16px 0; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
              <p style="color: #991b1b; margin: 0;"><strong>Important:</strong> Once deletion is completed, this action cannot be undone. Your uploaded content, channel information and rewards balance will be permanently removed.</p>
            </div>
            <p style="padding: 12px; background: #f9f9f9; border-radius: 8px; color: #666;">
              <strong>Your Ticket ID:</strong> ${ticketId}<br/>
              <span style="color: #999; font-size: 12px;">Use this ID when you contact us about this request.</span><br/><br/>
              <strong>Request ID:</strong> ${deletionRequest._id}<br/>
              <strong>Status:</strong> Pending Verification
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[deletion] Confirmation email failed:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your deletion request has been submitted. Our team will verify and process it.",
      requestId: deletionRequest._id,
    });
  } catch (err) {
    console.error("[deletion] Submit error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit deletion request." });
  }
};

exports.getDeletionRequests = async (req, res) => {
  try {
    const { status, search, assignedTo, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo === "unassigned") filter.assignedTo = null;
    else if (assignedTo) filter.assignedTo = assignedTo;
    if (search?.trim()) {
      const rawSearch = search.trim();
      const searchRegex = new RegExp(escapeRegex(rawSearch), "i");
      const or = [
        { email: searchRegex },
        { accountIdentifier: searchRegex },
        { reason: searchRegex },
      ];
      const ticketSuffix = /^(?:BP-)?([0-9a-f]{8,24})$/i.exec(rawSearch);
      if (ticketSuffix) {
        or.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: `${ticketSuffix[1]}$`,
              options: "i",
            },
          },
        });
      }
      filter.$or = or;
    }

    const requests = await DeletionRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await DeletionRequest.countDocuments(filter);

    return res.status(200).json({
      success: true,
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    console.error("[deletion] Fetch error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch requests." });
  }
};

exports.getMyDeletionRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("email").lean();
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {
      $or: [
        { userId },
        ...(user?.email ? [{ email: String(user.email).toLowerCase() }] : []),
      ],
    };
    if (status) filter.status = status;

    const requests = await DeletionRequest.find(filter)
      .select("-adminNotes -assignedTo -assignedBy")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await DeletionRequest.countDocuments(filter);

    return res.status(200).json({
      success: true,
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    console.error("[deletion] My requests error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch your requests." });
  }
};

exports.getDeletionRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await DeletionRequest.findById(id).lean();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    return res.status(200).json({ success: true, request });
  } catch (err) {
    console.error("[deletion] Fetch by ID error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch request." });
  }
};

exports.updateDeletionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignedTo } = req.body;

    if (status !== undefined && status !== null && !DELETION_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }
    if (assignedTo !== undefined && !(await isAssignableEmployeeId(assignedTo))) {
      return res.status(400).json({ success: false, message: "Invalid assignee." });
    }

    const update = {};

    if (status) {
      update.status = status;
      update.processedBy = req.user?.id;
      update.processedAt = new Date();
    }
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (assignedTo !== undefined) {
      update.assignedTo = assignedTo || null;
      update.assignedAt = new Date();
      update.assignedBy = req.admin?._id ? String(req.admin._id) : "system";
    }

    const request = await DeletionRequest.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    // If completed, mark user as deleted
    if (status === "completed" && request.userId) {
      try {
        await User.findByIdAndUpdate(request.userId, { status: "deleted" });
      } catch (userErr) {
        console.error("[deletion] Failed to mark user as deleted:", userErr.message);
      }
    }

    // Notify the user when the status changes
    if (status) {
      notifyDeletionUser({ ticket: request, newStatus: status });
    }

    return res.status(200).json({ success: true, request });
  } catch (err) {
    console.error("[deletion] Update error:", err);
    return res.status(500).json({ success: false, message: "Failed to update request." });
  }
};

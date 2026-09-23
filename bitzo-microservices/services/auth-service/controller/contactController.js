const ContactRequest = require("../models/ContactRequest");
const User = require("../models/usermodel");
const transporter = require("../Email/nodemailer");
const {
  assignTicket,
  categoryOfContactRequest,
  isValidAssociateId,
} = require("../services/assignmentService");
const {
  escapeHtml,
  cleanSubjectFragment,
  notifyTicketUser,
} = require("../utils/supportNotification");

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL;

const CONTACT_STATUSES = ["pending", "in-progress", "resolved", "closed"];

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.submitContactRequest = async (req, res) => {
  try {
    const { name, email, inquiryType, subject, message } = req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, message: "Name is required." });
    if (!email?.trim())
      return res.status(400).json({ success: false, message: "Email is required." });
    if (!inquiryType?.trim())
      return res.status(400).json({ success: false, message: "Inquiry type is required." });
    if (!subject?.trim())
      return res.status(400).json({ success: false, message: "Subject is required." });
    if (!message?.trim() || message.trim().length < 10)
      return res.status(400).json({ success: false, message: "Message must be at least 10 characters." });

    const associate = await assignTicket(categoryOfContactRequest(inquiryType));

    const contactRequest = await ContactRequest.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      inquiryType: inquiryType.trim(),
      subject: subject.trim(),
      message: message.trim(),
      userId: req.user?.id || null,
      assignedTo: associate.id,
      assignedAt: new Date(),
      assignedBy: "system",
    });

    // Send notification email to support team
    if (SUPPORT_EMAIL) {
      try {
        await transporter.sendMail({
          from: `"BharatPlay" <${process.env.EMAIL}>`,
          to: SUPPORT_EMAIL,
          replyTo: email.trim(),
          subject: `[BharatPlay Support] ${cleanSubjectFragment(inquiryType)} - ${cleanSubjectFragment(subject)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">New Support Request</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px;">${escapeHtml(name)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px;">${escapeHtml(email)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Type:</td><td style="padding: 8px;">${escapeHtml(inquiryType)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Subject:</td><td style="padding: 8px;">${escapeHtml(subject)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">Assigned To:</td><td style="padding: 8px;">${escapeHtml(associate.name)}</td></tr>
              </table>
              <div style="margin-top: 16px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
                <p style="font-weight: bold; color: #555;">Message:</p>
                <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
              </div>
              <p style="margin-top: 16px; color: #999; font-size: 12px;">
                Request ID: ${contactRequest._id} | Submitted: ${new Date().toISOString()}
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[contact] Email notification failed:", emailErr.message);
      }
    }

    // Send confirmation email to user
    try {
      await transporter.sendMail({
        from: `"BharatPlay" <${process.env.EMAIL}>`,
        to: email.trim(),
        subject: `We received your request - ${cleanSubjectFragment(subject)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Request Received</h2>
            <p>Hi ${escapeHtml(name)},</p>
            <p>We've received your <strong>${escapeHtml(inquiryType)}</strong> request regarding "<strong>${escapeHtml(subject)}</strong>".</p>
            <p>Our team will review your request and get back to you as soon as possible.</p>
            <p style="margin-top: 16px; padding: 12px; background: #f9f9f9; border-radius: 8px; color: #666;">
              <strong>Request ID:</strong> ${contactRequest._id}<br/>
              <strong>Status:</strong> Pending
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[contact] Confirmation email failed:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your request has been submitted. We will get back to you soon.",
      requestId: contactRequest._id,
    });
  } catch (err) {
    console.error("[contact] Submit error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit request." });
  }
};

exports.getContactRequests = async (req, res) => {
  try {
    const { status, search, assignedTo, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo === "unassigned") filter.assignedTo = null;
    else if (assignedTo) filter.assignedTo = assignedTo;
    if (search?.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
      ];
    }

    const requests = await ContactRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await ContactRequest.countDocuments(filter);

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
    console.error("[contact] Fetch error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch requests." });
  }
};

exports.getMyContactRequests = async (req, res) => {
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

    const requests = await ContactRequest.find(filter)
      .select("-assignedTo -assignedBy")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await ContactRequest.countDocuments(filter);

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
    console.error("[contact] My requests error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch your requests." });
  }
};

exports.getContactRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ContactRequest.findById(id).lean();
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    return res.status(200).json({ success: true, request });
  } catch (err) {
    console.error("[contact] Fetch by ID error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch request." });
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply, assignedTo } = req.body;

    if (status !== undefined && status !== null && !CONTACT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }
    if (assignedTo !== undefined && !isValidAssociateId(assignedTo)) {
      return res.status(400).json({ success: false, message: "Invalid assignee." });
    }

    const update = {};
    const notify = {};

    if (status) {
      update.status = status;
      notify.status = status;
    }
    if (adminReply !== undefined) {
      update.adminReply = adminReply;
      update.repliedAt = new Date();
      notify.adminReply = adminReply;
    }
    if (assignedTo !== undefined) {
      update.assignedTo = assignedTo || null;
      update.assignedAt = new Date();
      update.assignedBy = req.admin?._id ? String(req.admin._id) : "system";
    }

    const request = await ContactRequest.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (notify.status) {
      notifyTicketUser({
        ticket: request,
        kind: "status",
        newStatus: notify.status,
      });
    }
    if (notify.adminReply) {
      notifyTicketUser({
        ticket: request,
        kind: "reply",
        replyText: notify.adminReply,
      });
    }

    return res.status(200).json({ success: true, request });
  } catch (err) {
    console.error("[contact] Update error:", err);
    return res.status(500).json({ success: false, message: "Failed to update request." });
  }
};

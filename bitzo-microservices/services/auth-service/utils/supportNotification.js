const transporter = require("../Email/nodemailer");
const Notification = require("../models/NotificationModel");

// Escape user-supplied values before interpolating them into HTML emails.
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Strip newlines from fragments interpolated into email subject lines.
const cleanSubjectFragment = (value = "") =>
  String(value).replace(/[\r\n]+/g, " ").trim();

const sendMailSafely = async (mailOptions) => {
  if (!mailOptions?.to || !transporter?.sendMail) {
    return { sent: false, reason: "mailer-not-configured" };
  }
  try {
    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error("[support] Email send failed:", error.message);
    return { sent: false, reason: error.message };
  }
};

const createNotification = async ({ userId, type, actor = null }) => {
  if (!userId) return { created: false, reason: "no-recipient" };
  try {
    await Notification.create({ recipient: userId, type, actor });
    return { created: true };
  } catch (error) {
    console.error("[support] Notification create failed:", error.message);
    return { created: false, reason: error.message };
  }
};

const buildMailWrapper = ({ title, name, bodyHtml }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bharat Play</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
    .wrapper { width: 100%; background: #f4f4f7; padding: 40px 0; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px 32px 28px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 1.5rem; margin: 0; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 32px; text-align: center; }
    .body p { color: #374151; font-size: 0.95rem; line-height: 1.6; margin: 0 0 16px; }
    .body strong { color: #1f2937; }
    .reply-box { margin: 16px 0; padding: 16px; background: #f9f9f9; border-radius: 8px; text-align: left; border-left: 3px solid #dc2626; }
    .reply-box p { color: #374151; font-size: 0.9rem; line-height: 1.6; margin: 0; white-space: pre-wrap; }
    .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { color: #9ca3af; font-size: 0.78rem; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="body">
        <p>Hi <strong>${escapeHtml(name || "there")}</strong>,</p>
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Bharat Play. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// Contact request: notify the user when an admin replies or the status changes.
const notifyTicketUser = async ({ ticket, kind, replyText = "", newStatus = "" }) => {
  try {
    if (!ticket?.email) return;

    const isReply = kind === "reply";
    const subject = isReply
      ? "[BharatPlay] A support team member replied to your request"
      : `[BharatPlay] Your support request is now "${cleanSubjectFragment(newStatus)}"`;

    const bodyHtml = isReply
      ? `<p>We replied to your request titled "<strong>${escapeHtml(ticket.subject)}</strong>".</p>
         <div class="reply-box"><p>${escapeHtml(replyText)}</p></div>`
      : `<p>Your request titled "<strong>${escapeHtml(ticket.subject)}</strong>" has been updated to status <strong>${escapeHtml(newStatus)}</strong>.</p>`;

    await sendMailSafely({
      from: `"BharatPlay Support" <${process.env.EMAIL}>`,
      to: ticket.email,
      subject,
      html: buildMailWrapper({
        title: "Bharat Play Support",
        name: ticket.name,
        bodyHtml,
      }),
    });

    await createNotification({
      userId: ticket.userId,
      type: isReply ? "support_reply" : "support_status",
    });
  } catch (error) {
    console.error("[support] notifyTicketUser error:", error.message);
  }
};

// Deletion request: notify the user when the status changes.
const notifyDeletionUser = async ({ ticket, newStatus = "" }) => {
  try {
    if (!ticket?.email) return;

    const subject = `[BharatPlay] Your account deletion request is now "${cleanSubjectFragment(newStatus)}"`;

    const bodyHtml = `<p>Your request to delete the account associated with <strong>${escapeHtml(ticket.email)}</strong> has been updated to status <strong>${escapeHtml(newStatus)}</strong>.</p>
      <p>If you have questions about this, please contact our support team.</p>`;

    await sendMailSafely({
      from: `"BharatPlay Support" <${process.env.EMAIL}>`,
      to: ticket.email,
      subject,
      html: buildMailWrapper({
        title: "Bharat Play Account Deletion",
        name: "there",
        bodyHtml,
      }),
    });

    await createNotification({
      userId: ticket.userId,
      type: "support_status",
    });
  } catch (error) {
    console.error("[support] notifyDeletionUser error:", error.message);
  }
};

module.exports = {
  escapeHtml,
  cleanSubjectFragment,
  notifyTicketUser,
  notifyDeletionUser,
};
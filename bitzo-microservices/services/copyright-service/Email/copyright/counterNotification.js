/**
 * Admin notification: a user has filed a counter-notification against a strike.
 */
function getCopyrightCounterNotificationMailOptions(adminEmail, adminName, { caseNumber, videoTitle, userName, reason }) {
  return {
    from: process.env.EMAIL,
    to: adminEmail,
    subject: `[Action Required] Counter-Notification Filed — ${caseNumber}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Counter-Notification Filed</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f8fa; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); padding: 32px; }
    .brand { font-size: 1.6rem; font-weight: 700; color: #d72638; letter-spacing: 0.04em; margin-bottom: 8px; text-align: center; }
    .badge { display: inline-block; background: #fff7ed; color: #9a3412; font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 16px; }
    .title { font-size: 1.3rem; color: #111827; margin: 8px 0; text-align: center; }
    .content { color: #374151; font-size: 0.95rem; line-height: 1.6; }
    .detail-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .detail-row { padding: 6px 0; }
    .detail-label { color: #6b7280; font-size: 0.85rem; }
    .detail-value { color: #111827; font-weight: 600; font-size: 0.85rem; margin-top: 2px; }
    .cta { display: block; text-align: center; background: #4f46e5; color: #fff; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { color: #6b7280; font-size: 0.85rem; text-align: center; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Bharat Play</div>
    <div style="text-align:center"><span class="badge">Counter-Notification</span></div>
    <div class="title">Counter-Notification Filed</div>
    <div class="content">
      <p>Hi <strong>${adminName || "Admin"}</strong>,</p>
      <p>A user has filed a counter-notification disputing a copyright strike. This requires your review.</p>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Case Number</span>
          <div class="detail-value">${caseNumber}</div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Video</span>
          <div class="detail-value">${videoTitle || "Untitled"}</div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Filed By</span>
          <div class="detail-value">${userName || "User"}</div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reason</span>
          <div class="detail-value">${reason || "Not provided"}</div>
        </div>
      </div>
      <a href="${process.env.ADMIN_URL || "https://admin.bharatplay.com"}/copyright/cases" class="cta">Review Dispute</a>
    </div>
    <div class="footer">
      &copy; 2026 Bharat Play. All rights reserved.
    </div>
  </div>
</body>
</html>`,
  };
}

module.exports = getCopyrightCounterNotificationMailOptions;

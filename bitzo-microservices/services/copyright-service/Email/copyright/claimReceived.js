/**
 * Admin notification: a new public copyright claim has been submitted.
 */
function getCopyrightClaimReceivedMailOptions(adminEmail, adminName, { caseNumber, claimantName, videoTitle }) {
  return {
    from: process.env.EMAIL,
    to: adminEmail,
    subject: `[Action Required] New Copyright Claim — ${caseNumber}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Copyright Claim</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f8fa; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); padding: 32px; }
    .brand { font-size: 1.6rem; font-weight: 700; color: #d72638; letter-spacing: 0.04em; margin-bottom: 8px; text-align: center; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 16px; }
    .title { font-size: 1.3rem; color: #111827; margin: 8px 0; text-align: center; }
    .content { color: #374151; font-size: 0.95rem; line-height: 1.6; }
    .detail-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .detail-label { color: #6b7280; font-size: 0.85rem; }
    .detail-value { color: #111827; font-weight: 600; font-size: 0.85rem; }
    .cta { display: block; text-align: center; background: #4f46e5; color: #fff; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { color: #6b7280; font-size: 0.85rem; text-align: center; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Bharat Play</div>
    <div style="text-align:center"><span class="badge">Copyright</span></div>
    <div class="title">New Copyright Claim Received</div>
    <div class="content">
      <p>Hi <strong>${adminName || "Admin"}</strong>,</p>
      <p>A new copyright claim has been submitted and requires your review.</p>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Case Number</span>
          <span class="detail-value">${caseNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Claimant</span>
          <span class="detail-value">${claimantName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Video</span>
          <span class="detail-value">${videoTitle || "Untitled"}</span>
        </div>
      </div>
      <a href="${process.env.ADMIN_URL || "https://admin.bharatplay.com"}/copyright/cases" class="cta">Review Claim</a>
    </div>
    <div class="footer">
      &copy; 2026 Bharat Play. All rights reserved.
    </div>
  </div>
</body>
</html>`,
  };
}

module.exports = getCopyrightClaimReceivedMailOptions;

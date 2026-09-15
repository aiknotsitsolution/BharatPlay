/**
 * User notification: your video was taken down due to a copyright claim.
 */
function getCopyrightTakedownApprovedMailOptions(userEmail, userName, { caseNumber, videoTitle, reason }) {
  return {
    from: process.env.EMAIL,
    to: userEmail,
    subject: `Copyright Takedown Notice — ${caseNumber}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Copyright Takedown Notice</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f8fa; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); padding: 32px; }
    .brand { font-size: 1.6rem; font-weight: 700; color: #d72638; letter-spacing: 0.04em; margin-bottom: 8px; text-align: center; }
    .badge { display: inline-block; background: #fef2f2; color: #991b1b; font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 16px; }
    .title { font-size: 1.3rem; color: #111827; margin: 8px 0; text-align: center; }
    .content { color: #374151; font-size: 0.95rem; line-height: 1.6; }
    .detail-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0; }
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
    <div style="text-align:center"><span class="badge">Copyright Takedown</span></div>
    <div class="title">Your Video Has Been Taken Down</div>
    <div class="content">
      <p>Hi <strong>${userName || "there"}</strong>,</p>
      <p>One of your videos has been removed following a valid copyright claim.</p>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Case Number</span>
          <span class="detail-value">${caseNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Video</span>
          <span class="detail-value">${videoTitle || "Untitled"}</span>
        </div>
        ${reason ? `<div class="detail-row">
          <span class="detail-label">Reason</span>
          <span class="detail-value">${reason}</span>
        </div>` : ""}
      </div>
      <p>If you believe this action was taken in error, you have the right to file a counter-notification. You can manage this from your copyright dashboard.</p>
      <a href="${process.env.WEBSITE_URL || "https://bharatplay.com"}/copyright" class="cta">View Your Copyright Dashboard</a>
    </div>
    <div class="footer">
      &copy; 2026 Bharat Play. All rights reserved.
    </div>
  </div>
</body>
</html>`,
  };
}

module.exports = getCopyrightTakedownApprovedMailOptions;

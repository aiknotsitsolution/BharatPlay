/**
 * Claimant notification: your copyright case has been resolved.
 */
function getCopyrightCaseResolvedMailOptions(claimantEmail, claimantName, { caseNumber, decision, reason }) {
  const decisionLabels = {
    takedown_approved: "Takedown Approved",
    takedown_rejected: "Takedown Rejected",
    dispute_upheld: "Dispute Upheld (Takedown Stands)",
    dispute_overturned: "Dispute Overturned (Content Restored)",
    withdrawn: "Case Withdrawn",
  };

  const decisionLabel = decisionLabels[decision] || decision?.replace(/_/g, " ") || "Resolved";
  const isPositive = ["takedown_approved", "dispute_upheld"].includes(decision);

  return {
    from: process.env.EMAIL,
    to: claimantEmail,
    subject: `Copyright Case Resolved — ${caseNumber}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Copyright Case Resolved</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f8fa; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); padding: 32px; }
    .brand { font-size: 1.6rem; font-weight: 700; color: #d72638; letter-spacing: 0.04em; margin-bottom: 8px; text-align: center; }
    .badge { display: inline-block; background: ${isPositive ? "#ecfdf5" : "#fef2f2"}; color: ${isPositive ? "#065f46" : "#991b1b"}; font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 16px; }
    .title { font-size: 1.3rem; color: #111827; margin: 8px 0; text-align: center; }
    .content { color: #374151; font-size: 0.95rem; line-height: 1.6; }
    .detail-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .detail-row { padding: 6px 0; }
    .detail-label { color: #6b7280; font-size: 0.85rem; }
    .detail-value { color: #111827; font-weight: 600; font-size: 0.85rem; margin-top: 2px; }
    .footer { color: #6b7280; font-size: 0.85rem; text-align: center; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Bharat Play</div>
    <div style="text-align:center"><span class="badge">Case Resolved</span></div>
    <div class="title">Your Copyright Case Has Been Resolved</div>
    <div class="content">
      <p>Hi <strong>${claimantName || "there"}</strong>,</p>
      <p>Your copyright case has been reviewed and a decision has been made.</p>
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Case Number</span>
          <div class="detail-value">${caseNumber}</div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Decision</span>
          <div class="detail-value">${decisionLabel}</div>
        </div>
        ${reason ? `<div class="detail-row">
          <span class="detail-label">Reason</span>
          <div class="detail-value">${reason}</div>
        </div>` : ""}
      </div>
      <p>If you have any questions about this decision, please contact our support team.</p>
    </div>
    <div class="footer">
      &copy; 2026 Bharat Play. All rights reserved.
    </div>
  </div>
</body>
</html>`,
  };
}

module.exports = getCopyrightCaseResolvedMailOptions;

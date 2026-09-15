module.exports = function getRemoveEmployeeMailOptions(
  email,
  name,
  position,
  department,
) {
  return {
    from: process.env.EMAIL,
    to: email,
    subject: "Bharat Play — Account Removal Notification",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Removal Notification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
    .wrapper { width: 100%; background: #f4f4f7; padding: 40px 0; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px 32px 28px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 1.5rem; margin: 0; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 0.9rem; margin: 6px 0 0; }
    .body { padding: 32px; text-align: center; }
    .body p { color: #374151; font-size: 0.95rem; line-height: 1.6; margin: 0 0 16px; }
    .body strong { color: #1f2937; }
    .detail-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: left; }
    .detail-row { padding: 6px 0; }
    .detail-label { color: #6b7280; font-size: 0.85rem; }
    .detail-value { color: #111827; font-weight: 600; font-size: 0.85rem; margin-top: 2px; }
    .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { color: #9ca3af; font-size: 0.78rem; margin: 0; line-height: 1.5; }
    @media only screen and (max-width: 480px) {
      .wrapper { padding: 20px 0; }
      .container { margin: 0 12px; }
      .header { padding: 24px 20px 20px; }
      .body { padding: 24px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Bharat Play</h1>
        <p>Account Removal Notice</p>
      </div>
      <div class="body">
        <p>Dear <strong>${name || "there"}</strong>,</p>
        <p>Your account on Bharat Play has been removed. Below are the details:</p>
        <div class="detail-box">
          <div class="detail-row">
            <span class="detail-label">Position</span>
            <div class="detail-value">${position}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Department</span>
            <div class="detail-value">${department}</div>
          </div>
        </div>
        <p>If you have any questions, please contact the admin team.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Bharat Play. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
};

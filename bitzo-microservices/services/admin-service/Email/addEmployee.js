module.exports = function getAddEmployeeMailOptions(
  email,
  name,
  role,
  team,
  experience,
  password,
) {
  return {
    from: process.env.EMAIL,
    to: email,
    subject: "Bharat Play — Welcome to Bharat Play",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bharat Play</title>
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
    .temp-password { color: #b91c1c; font-weight: 700; font-size: 0.95rem; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; text-align: left; margin: 16px 0 24px; }
    .warning p { color: #92400e; font-size: 0.85rem; margin: 0; line-height: 1.5; }
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
        <p>Welcome to the Team</p>
      </div>
      <div class="body">
        <p>Hi <strong>${name || "there"}</strong>,</p>
        <p>You have been added to Bharat Play. Below are your account details:</p>
        <div class="detail-box">
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <div class="detail-value">${email}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Role</span>
            <div class="detail-value">${role}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Team / Department</span>
            <div class="detail-value">${team}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Experience</span>
            <div class="detail-value">${experience} years</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Temporary Password</span>
            <div class="detail-value temp-password">${password}</div>
          </div>
        </div>
        <p>Please use these credentials to log in for the first time. You can change your password after logging in.</p>
        <div class="warning">
          <p>For your security, please change your temporary password as soon as you log in.</p>
        </div>
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

module.exports = function getPasswordChangeConfirmationMailOptions(
  email,
  name,
) {
  return {
    from: process.env.EMAIL,
    to: email,
    subject: "Bharat Play — Password Changed Successfully",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Change Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
    .wrapper { width: 100%; background: #f4f4f7; padding: 40px 0; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px 32px 28px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 1.5rem; margin: 0; font-weight: 700; }
    .body { padding: 32px; text-align: center; }
    .body p { color: #374151; font-size: 0.95rem; line-height: 1.6; margin: 0 0 16px; }
    .body strong { color: #1f2937; }
    .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { color: #9ca3af; font-size: 0.78rem; margin: 0; }
    @media only screen and (max-width: 480px) {
      .wrapper { padding: 20px 0; }
      .container { margin: 0 12px; }
      .body { padding: 24px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Bharat Play</h1>
      </div>
      <div class="body">
        <p>Hi <strong>${name || "there"}</strong>,</p>
        <p>Your password has been successfully changed. If you did not initiate this change, please contact support immediately.</p>
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

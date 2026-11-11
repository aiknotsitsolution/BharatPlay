const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

module.exports = function getLoginMailOptions(email, name, otp) {
  const recipientName = String(name || "there");
  const safeName = escapeHtml(recipientName);
  const safeOtp = escapeHtml(otp);
  const hasOtp = Boolean(otp);
  const subject = hasOtp
    ? "VidBuxApp verification code"
    : "VidBuxApp account sign-in alert";
  const text = hasOtp
    ? `Hi ${recipientName},

Your VidBuxApp verification code is: ${otp}

This code expires in 5 minutes. Do not share it with anyone.
If you did not request this code, you can safely ignore this email.`
    : `Hi ${recipientName},

Your VidBuxApp account was just accessed. If this was not you, reset your password immediately.`;
  const messageHtml = hasOtp
    ? `<p>Your VidBuxApp verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${safeOtp}</p>
      <p>This code expires in 5 minutes. Do not share it with anyone.</p>
      <p>If you did not request this code, you can safely ignore this email.</p>`
    : `<p>Your VidBuxApp account was just accessed.</p>
      <p>If this was not you, reset your password immediately.</p>`;

  return {
    from: {
      name: process.env.EMAIL_FROM_NAME?.trim() || "VidBuxApp",
      address: process.env.EMAIL?.trim(),
    },
    to: email,
    subject,
    text,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VidBuxApp verification code</title>
  </head>
  <body style="margin:0;padding:24px;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="max-width:480px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
      <p>Hi ${safeName},</p>
      ${messageHtml}
      <p style="margin-bottom:0;">VidBuxApp</p>
    </div>
  </body>
</html>`,
  };
};

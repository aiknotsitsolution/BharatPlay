module.exports = function getPasswordResetMailOptions(email, name, otp) {
  return {
    from: process.env.EMAIL,
    to: email,
    subject: "Bharat Play — Password Reset Verification Code",
    html: `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
          .wrapper { width: 100%; background: #f4f4f7; padding: 40px 0; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px 32px 28px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 1.5rem; margin: 0; font-weight: 700; letter-spacing: -0.3px; }
          .header p { color: rgba(255,255,255,0.85); font-size: 0.9rem; margin: 6px 0 0; }
          .body { padding: 32px; text-align: center; }
          .greeting { color: #1f2937; font-size: 1rem; margin: 0 0 8px; }
          .subtitle { color: #6b7280; font-size: 0.9rem; margin: 0 0 24px; }
          .otp-box { background: #f9fafb; border: 2px dashed #dc2626; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px; }
          .otp-label { color: #6b7280; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; }
          .otp-value { color: #1f2937; font-size: 2rem; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace; }
          .expiry { color: #9ca3af; font-size: 0.82rem; margin: 0 0 24px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; text-align: left; margin: 0 0 24px; }
          .warning p { color: #92400e; font-size: 0.85rem; margin: 0; line-height: 1.5; }
          .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
          .footer p { color: #9ca3af; font-size: 0.78rem; margin: 0; line-height: 1.5; }
          @media only screen and (max-width: 480px) {
            .wrapper { padding: 20px 0; }
            .container { margin: 0 12px; }
            .header { padding: 24px 20px 20px; }
            .body { padding: 24px 20px; }
            .otp-value { font-size: 1.6rem; letter-spacing: 6px; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>Bharat Play</h1>
              <p>Password Reset</p>
            </div>
            <div class="body">
              <p class="greeting">Hi <strong>${name || "there"}</strong>,</p>
              <p class="subtitle">You requested a password reset. Use the verification code below to continue:</p>
              <div class="otp-box">
                <p class="otp-label">Your verification code</p>
                <p class="otp-value">${otp}</p>
              </div>
              <p class="expiry">This code expires in <strong>10 minutes</strong>.</p>
              <div class="warning">
                <p>Do not share this code with anyone. Bharat Play will never ask for your verification code over the phone or email.</p>
              </div>
              <p class="expiry">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
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

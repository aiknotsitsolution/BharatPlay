const transporter = require("./nodemailer");

/**
 * Send an email safely — no-ops if the mailer is not configured
 * or if the recipient is missing. Never throws.
 */
const sendMailSafely = async (mailOptions) => {
  if (!mailOptions?.to || !transporter?.sendMail) {
    return { sent: false, reason: "mailer-not-configured" };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error("Email send failed:", error.message);
    return { sent: false, reason: error.message };
  }
};

module.exports = sendMailSafely;

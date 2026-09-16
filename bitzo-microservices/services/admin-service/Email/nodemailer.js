const nodemailer = require("nodemailer");

const port = Number(process.env.EMAIL_PORT) || 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtpout.secureserver.net",
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = transporter;

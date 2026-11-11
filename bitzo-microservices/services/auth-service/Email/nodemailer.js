const nodemailer = require("nodemailer");
const { brandTransporter } = require("../../../shared/emailBranding");

const port = Number(process.env.EMAIL_PORT) || 465;
const email = process.env.EMAIL?.trim();
const password = process.env.EMAIL_PASSWORD;

if (!email || !password) {
  console.error(
    "[email] SMTP credentials are missing. Configure EMAIL and EMAIL_PASSWORD.",
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: email && password ? { user: email, pass: password } : undefined,
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP ERROR:", error.message);
  } else {
    console.log("SMTP READY:", success);
  }
});

module.exports = brandTransporter(transporter);

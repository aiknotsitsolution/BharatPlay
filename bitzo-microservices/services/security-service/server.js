require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "0.0.0.0"]);

require("./config/validateEnv")();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");

const {
  startTrustScoreJob,
} = require("./services/vpn.service/trustScore.job.js");
const { startStrikeExpiryJob } = require("./jobs/strikeExpiryJob.js");
const { detectVPN } = require("./services/vpn.service/vpn.service.js");

const app = express();
const PORT = process.env.PORT || 4009;

// =====================================================
// LOGGING
// =====================================================
morgan.token("body", (req) => {
  try {
    const body = { ...(req.body || {}) };
    for (const key of [
      "password",
      "newPassword",
      "oldPassword",
      "token",
      "resetToken",
      "credential",
      "registerKey",
    ]) {
      if (body[key] !== undefined) body[key] = "[REDACTED]";
    }
    return JSON.stringify(body);
  } catch (_) {
    return "{}";
  }
});
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body"),
);

// =====================================================
// MONGODB
// =====================================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ [security-service] MongoDB Connected"))
  .catch((err) => {
    console.error("❌ [security-service] MongoDB Connection Error:", err);
    process.exit(1);
  });

// =====================================================
// MIDDLEWARES
// =====================================================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Type", "Authorization"],
  }),
);

// =====================================================
// ROUTES
// =====================================================

// Background cron jobs owned by security-service
startTrustScoreJob();
startStrikeExpiryJob();

// VPN / fraud detection endpoint (used by ops/testing or other services)
const vpnCheckHandler = async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.ip ||
      "unknown";
    const result = await detectVPN(ip);
    res.json({ ip, ...result });
  } catch (error) {
    console.error("VPN Detection Error:", error);
    res.status(500).json({ success: false, message: "VPN detection failed" });
  }
};

// Kept at both paths: "/test-vpn" matches the original monolith's route
// (and is what the gateway forwards "/test-vpn" requests to, since it
// doesn't rewrite the path), "/internal/check-vpn" is the tidier name
// for service-to-service use.
app.get("/test-vpn", vpnCheckHandler);
app.get("/internal/check-vpn", vpnCheckHandler);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "security-service",
    message: "🚀 security-service is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "security-service",
    uptime: process.uptime(),
  });
});

// =====================================================
// 404 + ERROR HANDLER
// =====================================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`🌐 security-service running on port ${PORT}`);
});

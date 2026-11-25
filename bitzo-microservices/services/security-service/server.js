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
const PORT = process.env.PORT || 5009;
const MAX_MONGO_RETRY_DELAY_MS = 30000;
const configuredOrigins = process.env.CORS_ORIGINS?.trim();
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins =
  configuredOrigins?.toLowerCase() === "true" && !isProduction
    ? true
    : configuredOrigins
      ? configuredOrigins.split(",").map((origin) => origin.trim()).filter(Boolean)
      : isProduction
        ? []
        : true;

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
function isRetryableMongoError(error) {
  const name = error?.name || "";
  return (
    /Network|Timeout|ServerSelection/.test(name) ||
    error?.errorLabelSet?.has?.("RetryableError") ||
    error?.errorLabels?.includes?.("RetryableError")
  );
}

async function connectToMongo() {
  let attempt = 0;
  while (true) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("✅ [security-service] MongoDB Connected");
      startTrustScoreJob();
      startStrikeExpiryJob();
      return;
    } catch (error) {
      if (!isRetryableMongoError(error)) {
        console.error(
          "❌ [security-service] MongoDB configuration/connection failed:",
          error.message,
        );
        process.exit(1);
      }

      attempt += 1;
      const delay = Math.min(
        MAX_MONGO_RETRY_DELAY_MS,
        1000 * 2 ** Math.min(attempt - 1, 5),
      );
      console.error(
        `[security-service] MongoDB is unreachable (attempt ${attempt}); retrying in ${delay}ms: ${error.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// =====================================================
// MIDDLEWARES
// =====================================================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
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

if (require.main === module) {
  connectToMongo();
}

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
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    service: "security-service",
    dependencies: { mongodb: connected ? "connected" : "disconnected" },
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌐 security-service running on port ${PORT}`);
  });
}

module.exports = app;

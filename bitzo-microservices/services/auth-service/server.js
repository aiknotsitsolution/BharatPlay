require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "0.0.0.0"]);

require("./config/validateEnv")();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");

const route0 = require("./routes/authRoute");

const app = express();
const PORT = process.env.PORT || 4001;

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
  .then(() => console.log("✅ [auth-service] MongoDB Connected"))
  .catch((err) => {
    console.error("❌ [auth-service] MongoDB Connection Error:", err);
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
app.use("/api", route0);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "auth-service",
    message: "🚀 auth-service is running",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service", uptime: process.uptime() });
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
  console.log(`🌐 auth-service running on port ${PORT}`);
});

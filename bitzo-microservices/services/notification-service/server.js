require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "0.0.0.0"]);

require("./config/validateEnv")();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");

const route0 = require("./routes/notificationRoute");

const app = express();
const PORT = process.env.PORT || 4006;

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
if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ [notification-service] MongoDB Connected"))
    .catch((err) => {
      console.error("❌ [notification-service] MongoDB Connection Error:", err);
      process.exit(1);
    });
}

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
app.use("/api/notifications", route0);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "notification-service",
    message: "🚀 notification-service is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "notification-service",
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

const http = require("node:http");
const { Server: SocketIOServer } = require("socket.io");
const { verifyAccessToken } = require("./utils/tokenService");
const { attachSocketServer } = require("./services/socketService");

if (require.main === module) {
  const httpServer = http.createServer(app);
  const socketServer = new SocketIOServer(httpServer, {
    cors: { origin: true, credentials: true },
  });

  socketServer.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = verifyAccessToken(token);
      socket.authenticatedUserId = decoded.sub || decoded.userId || decoded.id;
      if (!socket.authenticatedUserId) return next(new Error("Unauthorized"));
      next();
    } catch (_) {
      next(new Error("Unauthorized"));
    }
  });
  attachSocketServer(socketServer);

  httpServer.listen(PORT, () => {
    console.log(
      `🌐 notification-service (with realtime socket.io) running on port ${PORT}`,
    );
  });
}

module.exports = app;

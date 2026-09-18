require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "0.0.0.0"]);

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 4000;

morgan.token("service", (req) => {
  const path = req.originalUrl || req.url;
  if (
    path.startsWith("/api/admin/copyright") ||
    path.startsWith("/api/copyright")
  )
    return "copyright-service";
  if (path.startsWith("/api/admin")) return "admin-service";
  if (path.startsWith("/api/adminvideo") || path.startsWith("/api/uservideo"))
    return "video-service";
  if (path.startsWith("/api/category")) return "category-service";
  if (path.startsWith("/api/leaderboard")) return "leaderboard-service";
  if (path.startsWith("/api/notifications")) return "notification-service";
  if (path.startsWith("/v1/player")) return "player-ad-service";
  if (path.startsWith("/test-vpn") || path.startsWith("/internal/security"))
    return "security-service";
  if (path.startsWith("/api")) return "auth-service";
  return "gateway";
});

app.use(morgan("[gateway] HIT :method :url -> :service", { immediate: true }));
app.use(
  morgan("[gateway] DONE :method :url -> :service :status :response-time ms"),
);

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

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  admin: process.env.ADMIN_SERVICE_URL || "http://localhost:4002",
  video: process.env.VIDEO_SERVICE_URL || "http://localhost:4003",
  category: process.env.CATEGORY_SERVICE_URL || "http://localhost:4004",
  leaderboard: process.env.LEADERBOARD_SERVICE_URL || "http://localhost:4005",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4006",
  playerAd: process.env.PLAYER_AD_SERVICE_URL || "http://localhost:4007",
  copyright: process.env.COPYRIGHT_SERVICE_URL || "http://localhost:4008",
  security: process.env.SECURITY_SERVICE_URL || "http://localhost:4009",
};

function proxy(target, routePrefix = "/") {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    logger: console,
    pathRewrite: (path) => {
      const normalizedPath = path || "/";

      if (!routePrefix || routePrefix === "/") return normalizedPath;

      if (normalizedPath.startsWith(routePrefix)) {
        return normalizedPath;
      }

      return `${routePrefix}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
    },
    // http-proxy-middleware v3 requires handlers under `on` (top-level
    // `onError` is silently ignored and the default plugin would answer
    // connection failures with a misleading 504).
    on: {
      error: (err, req, res) => {
        const code = err?.code || err?.message;
        console.error(`[gateway] proxy error -> ${target}:`, code);

        if (!res || res.headersSent) return;

        // A genuine upstream timeout is a 504; a refused/reset connection
        // (service restarting, crashed or not up yet) is a 502.
        const status = code === "ETIMEDOUT" ? 504 : 502;
        if (typeof res.status === "function") {
          res.status(status).json({
            success: false,
            message:
              status === 504
                ? "Backend service timed out"
                : "Backend service unavailable",
            target,
          });
        } else if (typeof res.end === "function") {
          res.end();
        }
      },
    },
  });
}

// =====================================================
// ROUTES — ORDER MATTERS.
// More specific paths MUST be registered before the
// generic "/api" catch-all (auth-service), exactly the
// way the old monolith relied on route-matching order.
// =====================================================

// Copyright: admin-side case/strike management
app.use(
  "/api/admin/copyright",
  proxy(SERVICES.copyright, "/api/admin/copyright"),
);

// Admin: users, employees, dashboard, moderation
app.use("/api/admin", proxy(SERVICES.admin, "/api/admin"));

// Video: admin video management
app.use("/api/adminvideo", proxy(SERVICES.video, "/api/adminvideo"));

// Video: user-facing feed/channels/comments/watch-history
app.use("/api/uservideo", proxy(SERVICES.video, "/api/uservideo"));

// Categories
app.use("/api/category", proxy(SERVICES.category, "/api/category"));

// Copyright: user-side (my-strikes, my-cases, public claim submission)
app.use("/api/copyright", proxy(SERVICES.copyright, "/api/copyright"));

// Leaderboard
app.use("/api/leaderboard", proxy(SERVICES.leaderboard, "/api/leaderboard"));

// Notifications
app.use(
  "/api/notifications",
  proxy(SERVICES.notification, "/api/notifications"),
);

// Player / ad manifest (VAST, impressions, rewarded ads)
app.use("/v1/player", proxy(SERVICES.playerAd, "/v1/player"));

// Security / fraud / VPN (internal + ops testing)
app.use("/test-vpn", proxy(SERVICES.security, "/test-vpn"));
app.use("/internal/security", proxy(SERVICES.security, "/internal/security"));

// Support: contact form + deletion requests (public + admin)
app.use("/api/support", proxy(SERVICES.auth, "/api/support"));

// Auth — generic "/api" fallback, MUST stay last.
app.use("/api", proxy(SERVICES.auth, "/api"));

// =====================================================
// HEALTH CHECK
// =====================================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚪 Bitzo API Gateway is running",
    services: SERVICES,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "gateway", uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚪 Gateway running on port ${PORT}`);
  console.log("Routing table:");
  console.log("  /api/admin/copyright  ->", SERVICES.copyright);
  console.log("  /api/admin            ->", SERVICES.admin);
  console.log("  /api/adminvideo       ->", SERVICES.video);
  console.log("  /api/uservideo        ->", SERVICES.video);
  console.log("  /api/category         ->", SERVICES.category);
  console.log("  /api/copyright        ->", SERVICES.copyright);
  console.log("  /api/leaderboard      ->", SERVICES.leaderboard);
  console.log("  /api/notifications    ->", SERVICES.notification);
  console.log("  /v1/player            ->", SERVICES.playerAd);
  console.log("  /test-vpn             ->", SERVICES.security);
  console.log("  /api (fallback: auth) ->", SERVICES.auth);
});

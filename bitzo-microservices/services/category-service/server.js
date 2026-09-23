require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "0.0.0.0"]);

require("./config/validateEnv")();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const Category = require("./models/CategoryModel/category.model");
const morgan = require("morgan");

const route0 = require("./routes/categoryRoute/category.route");

const app = express();
const PORT = process.env.PORT || 4004;

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
    .then(async () => {
      console.log("✅ [category-service] MongoDB Connected");
      if ((await Category.estimatedDocumentCount()) === 0) {
        await Category.insertMany([
          { name: "Gaming" },
          { name: "Education" },
          { name: "Entertainment" },
          { name: "Music" },
          { name: "Technology" },
          { name: "Sports" },
          { name: "Cooking" },
          { name: "Travel" },
        ]);
        console.log("✅ [category-service] Default categories seeded");
      }
    })
    .catch((err) => {
      console.error("❌ [category-service] MongoDB Connection Error:", err);
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
app.use("/api/category", route0);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "category-service",
    message: "🚀 category-service is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "category-service",
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
    console.log(`🌐 category-service running on port ${PORT}`);
  });
}

module.exports = app;

#!/usr/bin/env node
/**
 * Container monolith — runs the whole BharatPlay microservice stack inside a
 * single container (one process tree, one public port).
 *
 * - Every service keeps its own folder, dependencies and entrypoint; it is
 *   started as a child process (`node server.js` in its own working dir), so
 *   nothing in the service code changes.
 * - Environment resolution per child (later wins):
 *     1. the service's own .env file, if present (each service has its OWN
 *        MONGO_URI/PORT/... — they can never be merged into one flat env)
 *     2. container env — Railway variables override the file, so production
 *        values (WEBSITE_URL, CORS_ORIGINS, ...) never fall back to localhost
 *     3. pinned overrides below (internal PORTs, gateway service URLs)
 * - The gateway is the only public entry point: it listens on the platform's
 *   $PORT (Railway injects it) or 4000, and proxies to the services on
 *   127.0.0.1:4001-4009.
 * - Crashed children are restarted with a capped backoff; SIGTERM/SIGINT
 *   gracefully stops the whole tree.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");

const root = __dirname;
let shuttingDown = false;

// [name, folder, fixed internal port]
const SERVICES = [
  ["auth-service", "services/auth-service", 4001],
  ["admin-service", "services/admin-service", 4002],
  ["video-service", "services/video-service", 4003],
  ["category-service", "services/category-service", 4004],
  ["leaderboard-service", "services/leaderboard-service", 4005],
  ["notification-service", "services/notification-service", 4006],
  ["player-ad-service", "services/player-ad-service", 4007],
  ["copyright-service", "services/copyright-service", 4008],
  ["security-service", "services/security-service", 4009],
];

// Minimal .env parser (no dependency needed; services also run their own
// dotenv, which never overrides values we already pass in).
const parseEnvFile = (file) => {
  const out = {};
  try {
    if (!fs.existsSync(file)) return out;
    for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) out[key] = value;
    }
  } catch (_) {
    // Malformed .env — fall back to container env.
  }
  return out;
};

const pipeLogs = (name, stream) => {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => console.log(`[${name}] ${line}`));
};

const children = new Map();

const startChild = (name, folder, env) => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.join(root, folder),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.set(name, child);
  pipeLogs(name, child.stdout);
  pipeLogs(name, child.stderr);

  child.on("exit", (code, signal) => {
    children.delete(name);
    if (shuttingDown) return;
    console.error(
      `[${name}] exited (code=${code}, signal=${signal}) — restarting in 3s`,
    );
    setTimeout(() => {
      if (!shuttingDown) startChild(name, folder, env);
    }, 3000);
  });

  console.log(`[${name}] started on port ${env.PORT}`);
};

// Environment for a child: its own .env file, overridden by the container
// env (Railway variables), overridden by the pinned values.
const buildChildEnv = (folder, pins = {}) => {
  const env = { ...parseEnvFile(path.join(root, folder, ".env")) };
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  if (!env.NODE_ENV) env.NODE_ENV = "production";
  return { ...env, ...pins };
};

if (!process.env.CORS_ORIGINS) {
  console.warn(
    "[monolith] WARNING: CORS_ORIGINS is not set — cross-origin browser " +
      "requests will be rejected. Set it to the comma-separated HTTPS " +
      "origins of the website + admin panel.",
  );
}

for (const [name, folder, port] of SERVICES) {
  startChild(name, folder, buildChildEnv(folder, { PORT: String(port) }));
}

// Gateway last — it is the public entry point, and it must reach every
// service over the container's loopback interface.
setTimeout(() => {
  startChild(
    "gateway",
    "gateway",
    buildChildEnv("gateway", {
      PORT: process.env.PORT || "4000",
      AUTH_SERVICE_URL: "http://127.0.0.1:4001",
      ADMIN_SERVICE_URL: "http://127.0.0.1:4002",
      VIDEO_SERVICE_URL: "http://127.0.0.1:4003",
      CATEGORY_SERVICE_URL: "http://127.0.0.1:4004",
      LEADERBOARD_SERVICE_URL: "http://127.0.0.1:4005",
      NOTIFICATION_SERVICE_URL: "http://127.0.0.1:4006",
      PLAYER_AD_SERVICE_URL: "http://127.0.0.1:4007",
      COPYRIGHT_SERVICE_URL: "http://127.0.0.1:4008",
      SECURITY_SERVICE_URL: "http://127.0.0.1:4009",
    }),
  );
}, 2000);

console.log(
  `[monolith] booting ${SERVICES.length} services + gateway — public port ${
    process.env.PORT || 4000
  }`,
);

const stopAll = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(
    `[monolith] ${signal} received — stopping ${children.size} processes...`,
  );
  for (const child of children.values()) {
    try {
      child.kill("SIGTERM");
    } catch (_) {
      /* already gone */
    }
  }
  setTimeout(() => {
    for (const child of children.values()) {
      try {
        child.kill("SIGKILL");
      } catch (_) {
        /* already gone */
      }
    }
    process.exit(0);
  }, 5000).unref();
};

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));

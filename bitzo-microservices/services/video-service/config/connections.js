const mongoose = require("mongoose");

/**
 * Secondary (cross-service) Mongo connections.
 *
 * Each microservice owns exactly one primary database (see server.js /
 * MONGO_URI). Some read/write paths in this service still need data that
 * is *owned* by another service (e.g. an admin panel needs to read Users
 * that only auth-service writes to). Rather than pointing this service's
 * primary connection at someone else's database, we open a small,
 * lazily-created secondary connection per foreign service and bind the
 * foreign model to THAT connection.
 *
 * This keeps DB ownership honest (only the owning service ever runs
 * migrations / is the source of truth) while avoiding a full rewrite of
 * every controller into internal HTTP calls in this pass. Swap a given
 * accessor below for an axios call to that service's internal API
 * whenever you want to fully decouple it.
 */

const cache = {};

function getConnection(envVarName, label) {
  const uri = process.env[envVarName];
  if (!uri) {
    throw new Error(
      `${envVarName} is not set. This service needs read/write access to the ${label} database - set ${envVarName} in your .env (see .env.example).`,
    );
  }
  if (!cache[envVarName]) {
    const conn = mongoose.createConnection(uri);
    conn.on("connected", () =>
      console.log(`✅ [secondary-db] connected -> ${label} (${envVarName})`),
    );
    conn.on("error", (err) =>
      console.error(
        `❌ [secondary-db] ${label} (${envVarName}) error:`,
        err.message,
      ),
    );
    cache[envVarName] = conn;
  }
  return cache[envVarName];
}

module.exports = {
  authDB: () => getConnection("AUTH_DB_URI", "auth-service"),
  adminDB: () => getConnection("ADMIN_DB_URI", "admin-service"),
  videoDB: () => getConnection("VIDEO_DB_URI", "video-service"),
  categoryDB: () => getConnection("CATEGORY_DB_URI", "category-service"),
  notificationDB: () =>
    getConnection("NOTIFICATION_DB_URI", "notification-service"),
  copyrightDB: () => getConnection("COPYRIGHT_DB_URI", "copyright-service"),
  playerAdDB: () => getConnection("PLAYERAD_DB_URI", "player-ad-service"),
  securityDB: () => getConnection("SECURITY_DB_URI", "security-service"),
};

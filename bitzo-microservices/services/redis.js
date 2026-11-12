const path = require("node:path");
const { createRequire } = require("node:module");

const clients = new Map();

function getServiceRequire() {
  return createRequire(path.join(process.cwd(), "package.json"));
}

function getServiceDependency(name) {
  return getServiceRequire()(name);
}

function getRedisClient({ forQueue = false } = {}) {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  const clientKey = forQueue ? "queue" : "default";
  if (!clients.has(clientKey)) {
    const Redis = getServiceDependency("ioredis");
    const client = new Redis(url, {
      connectTimeout: 5000,
      maxRetriesPerRequest: forQueue ? null : 1,
      password: process.env.REDIS_PASSWORD || undefined,
    });
    client.on("error", (error) => {
      console.error("Redis client error:", error.message);
    });
    clients.set(clientKey, client);
  }

  return clients.get(clientKey);
}

async function closeRedisConnections() {
  await Promise.all([...clients.values()].map((client) => client.quit()));
  clients.clear();
}

module.exports = {
  closeRedisConnections,
  getRedisClient,
  getServiceDependency,
};

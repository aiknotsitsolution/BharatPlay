const crypto = require("node:crypto");
const { cached } = require("../../../services/caching");
const { getRedisClient } = require("../../../services/redis");

const VIDEO_CATALOG_CACHE_VERSION_KEY = "video:catalog:version";
const VIDEO_CATALOG_CACHE_FORMAT_VERSION = 2;
const VIDEO_CATALOG_CACHE_TTL_SECONDS = 15 * 60;

async function cacheVideoCatalog(namespace, keyParts, ttlSec, fetchFn) {
  if (
    typeof namespace !== "string" ||
    namespace.length === 0 ||
    !Number.isInteger(ttlSec) ||
    ttlSec <= 0 ||
    typeof fetchFn !== "function"
  ) {
    throw new TypeError(
      "A namespace, positive TTL, and fetch function are required.",
    );
  }

  let serializedKey;
  try {
    serializedKey = JSON.stringify(keyParts);
  } catch (error) {
    throw new TypeError(`Cache key must be serializable: ${error.message}`);
  }
  if (serializedKey === undefined) {
    throw new TypeError("Cache key must be serializable.");
  }

  const redis = getRedisClient();
  if (!redis) return fetchFn();

  let version;
  try {
    version = (await redis.get(VIDEO_CATALOG_CACHE_VERSION_KEY)) || "0";
  } catch (error) {
    console.error("Video catalog cache version read failed:", error.message);
    return fetchFn();
  }

  const digest = crypto
    .createHash("sha256")
    .update(`${namespace}:${serializedKey}`)
    .digest("hex");
  return cached(
    `video:catalog:v${VIDEO_CATALOG_CACHE_FORMAT_VERSION}:${version}:${namespace}:${digest}`,
    ttlSec,
    fetchFn,
  );
}

async function invalidateVideoCatalogCache() {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.incr(VIDEO_CATALOG_CACHE_VERSION_KEY);
  } catch (error) {
    console.error("Video catalog cache invalidation failed:", error.message);
  }
}

module.exports = {
  cacheVideoCatalog,
  invalidateVideoCatalogCache,
  VIDEO_CATALOG_CACHE_TTL_SECONDS,
};

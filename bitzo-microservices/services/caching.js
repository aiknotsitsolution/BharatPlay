const { getRedisClient } = require("./redis");

async function cached(key, ttlSec, fetchFn) {
  if (
    typeof key !== "string" ||
    key.length === 0 ||
    !Number.isInteger(ttlSec) ||
    ttlSec <= 0
  ) {
    throw new TypeError("A cache key and positive integer TTL are required.");
  }
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn must be a function.");
  }

  const redis = getRedisClient();
  if (!redis) return fetchFn();

  try {
    const hit = await redis.get(key);
    if (hit !== null) {
      try {
        return JSON.parse(hit);
      } catch (error) {
        console.error(`Invalid Redis cache entry for ${key}:`, error.message);
        await redis.del(key);
      }
    }
  } catch (error) {
    console.error(`Redis cache read failed for ${key}:`, error.message);
  }

  const data = await fetchFn();
  if (data !== undefined) {
    try {
      const serialized = JSON.stringify(data);
      if (serialized !== undefined) {
        await redis.set(key, serialized, "EX", ttlSec);
      }
    } catch (error) {
      console.error(`Redis cache write failed for ${key}:`, error.message);
    }
  }
  return data;
}

async function invalidateCache(key) {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Redis cache invalidation failed for ${key}:`, error.message);
  }
}

module.exports = { cached, invalidateCache };

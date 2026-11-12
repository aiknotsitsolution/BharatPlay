const { getRedisClient, getServiceDependency } = require("./redis");

function createRateLimitStore(prefix) {
  const redis = getRedisClient();
  if (!redis) return undefined;
  if (!prefix) throw new TypeError("A Redis rate-limit prefix is required.");

  const { RedisStore } = getServiceDependency("rate-limit-redis");
  return new RedisStore({
    prefix,
    sendCommand: (...args) => redis.call(...args),
  });
}

module.exports = { createRateLimitStore };

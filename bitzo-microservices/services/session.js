const { getRedisClient, getServiceDependency } = require("./redis");

function createSessionMiddleware({
  secret = process.env.SESSION_SECRET,
  prefix = "sess:",
  cookie = {},
  ...sessionOptions
} = {}) {
  if (!secret) {
    throw new Error("SESSION_SECRET is required to create session middleware.");
  }

  const redis = getRedisClient();
  if (!redis) {
    throw new Error("REDIS_URL is required to create session middleware.");
  }

  const session = getServiceDependency("express-session");
  const { RedisStore } = getServiceDependency("connect-redis");

  return session({
    ...sessionOptions,
    store: new RedisStore({ client: redis, prefix }),
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
      ...cookie,
    },
  });
}

module.exports = createSessionMiddleware;

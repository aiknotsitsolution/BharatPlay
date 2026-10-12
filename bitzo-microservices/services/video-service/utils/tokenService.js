const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

// Refresh-token secret. Never reuse the access-token secret.
// - Production: REFRESH_TOKEN_SECRET is required (enforced here + validateEnv).
// - Development: if missing/weak, an ephemeral secret is generated so the
//   server starts, but refresh sessions do not survive a restart.
const REFRESH_TOKEN_SECRET = (() => {
  const env = process.env.REFRESH_TOKEN_SECRET;
  if (env && env.length >= 32) return env;
  if (process.env.NODE_ENV === "production") return null;
  if (env) {
    console.warn(
      "[tokenService] REFRESH_TOKEN_SECRET is weak (<32 chars). Using an ephemeral dev secret instead."
    );
  } else {
    console.warn(
      "[tokenService] REFRESH_TOKEN_SECRET not set. Using an ephemeral dev secret (refresh sessions invalidate on restart)."
    );
  }
  return crypto.randomBytes(48).toString("hex");
})();

if (!REFRESH_TOKEN_SECRET) {
  throw new Error(
    "REFRESH_TOKEN_SECRET is required in production (minimum 32 characters)"
  );
}

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const signAccessToken = (payload = {}, options = {}) => {
  const { userId, role } = payload;
  return jwt.sign(
    {
      sub: String(userId),
      role: role || undefined,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: options.expiresIn || DEFAULT_EXPIRES_IN,
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
  });
};

const signRefreshToken = (payload = {}) => {
  // jti guarantees a unique token per session even within the same second,
  // which keeps tokenHash unique (two identical tokens → E11000 duplicate).
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, REFRESH_TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: "30d",
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET, {
    algorithms: ["HS256"],
  });
};

// One-way hash for persisting refresh/reset tokens.
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
};

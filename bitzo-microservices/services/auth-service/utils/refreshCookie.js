// httpOnly cookie helpers for refresh-token sessions.
// Kept separate from deviceCookie.js so device-binding behavior is untouched.

const REFRESH_COOKIE = "refresh_token";
const ADMIN_REFRESH_COOKIE = "admin_refresh_token";
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const cookieName = (kind = "user") =>
  kind === "admin" ? ADMIN_REFRESH_COOKIE : REFRESH_COOKIE;

const setRefreshCookie = (res, token, kind = "user") => {
  res.cookie(cookieName(kind), token, { ...cookieBase, maxAge: REFRESH_MAX_AGE });
};

const clearRefreshCookie = (res, kind = "user") => {
  res.clearCookie(cookieName(kind), { ...cookieBase });
};

module.exports = {
  REFRESH_COOKIE,
  ADMIN_REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
};

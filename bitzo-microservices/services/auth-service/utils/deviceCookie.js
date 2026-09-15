const crypto = require("crypto");

const DEVICE_COOKIE = "device_id";
const MAX_AGE = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years

const resolveDeviceId = (req, res) => {
  const existing = req.cookies && req.cookies[DEVICE_COOKIE];
  if (existing) {
    return existing;
  }

  const deviceId = crypto.randomUUID();
  res.cookie(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
  });
  return deviceId;
};

module.exports = { resolveDeviceId, DEVICE_COOKIE };

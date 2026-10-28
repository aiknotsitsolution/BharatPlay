const crypto = require("node:crypto");
const DeviceFingerprint = require("../models/DeviceFingerprintModel");

const BROWSER_FINGERPRINT_PATTERN = /^web-v1:[a-f0-9]{64}$/;
const MAX_SCREEN_DIMENSION = 20_000;

const createFingerprint = (signals) => {
  if (
    !signals ||
    signals.version !== "web-v1" ||
    typeof signals.platform !== "string" ||
    !signals.platform.trim() ||
    signals.platform.length > 100 ||
    typeof signals.timeZone !== "string" ||
    !signals.timeZone.trim() ||
    signals.timeZone.length > 100
  ) {
    return null;
  }

  const numericSignals = [
    signals.screenWidth,
    signals.screenHeight,
    signals.colorDepth,
    signals.devicePixelRatio,
    signals.hardwareConcurrency,
    signals.maxTouchPoints,
  ];
  if (
    numericSignals.some(
      (value) => typeof value !== "number" || !Number.isFinite(value) || value < 0,
    ) ||
    signals.screenWidth === 0 ||
    signals.screenHeight === 0 ||
    signals.colorDepth === 0 ||
    signals.devicePixelRatio === 0 ||
    signals.screenWidth > MAX_SCREEN_DIMENSION ||
    signals.screenHeight > MAX_SCREEN_DIMENSION
  ) {
    return null;
  }

  const canonicalSignals = JSON.stringify([
    signals.version,
    signals.platform,
    signals.screenWidth,
    signals.screenHeight,
    signals.colorDepth,
    signals.devicePixelRatio,
    signals.hardwareConcurrency,
    signals.maxTouchPoints,
    signals.timeZone,
  ]);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required to hash browser device signals.");
  }

  return `web-v1:${crypto
    .createHmac("sha256", secret)
    .update(canonicalSignals)
    .digest("hex")}`;
};

const invalidFingerprint = () => ({
  ok: false,
  status: 400,
  code: "BROWSER_FINGERPRINT_REQUIRED",
  message: "Could not verify this browser device. Refresh the page and try again.",
});

const deviceAlreadyBound = (status = 409) => ({
  ok: false,
  status,
  code: "DEVICE_ALREADY_REGISTERED",
  message: "This device is already linked to an account. Use that account to sign in.",
});

const checkWebsiteDeviceBinding = async ({
  req,
  deviceId,
  userId = null,
  action,
}) => {
  const platform = String(req.headers?.["x-client-platform"] || "").toLowerCase();
  if (platform !== "website") return { ok: true, fingerprint: null };

  const fingerprint = createFingerprint(req.body?.browserDeviceSignals);
  if (!fingerprint || !BROWSER_FINGERPRINT_PATTERN.test(fingerprint)) {
    return invalidFingerprint();
  }

  const binding = await DeviceFingerprint.findOne({
    browserDeviceFingerprint: fingerprint,
  })
    .select("deviceId userId")
    .lean();
  if (!binding) return { ok: true, fingerprint };

  const sameBrowserProfile = String(binding.deviceId) === String(deviceId);
  const bindingUserId = binding.userId ? String(binding.userId) : null;
  const requestedUserId = userId ? String(userId) : null;

  if (
    !sameBrowserProfile ||
    (bindingUserId &&
      (action === "register" || bindingUserId !== requestedUserId))
  ) {
    return deviceAlreadyBound(action === "login" ? 403 : 409);
  }

  return { ok: true, fingerprint };
};

module.exports = {
  BROWSER_FINGERPRINT_PATTERN,
  checkWebsiteDeviceBinding,
  createFingerprint,
};

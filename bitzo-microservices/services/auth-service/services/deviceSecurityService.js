const crypto = require("node:crypto");
const { GoogleAuth } = require("google-auth-library");
const Device = require("../models/Device");
const User = require("../models/usermodel");
const { logFraudEvent } = require("./vpn.service/fraud.service");

const getDeviceSignals = (body = {}) => ({
  hardwareId: String(body.Hardware_ID || body.hardwareId || "").trim(),
  ssaid: String(body.SSAID || body.ssaid || "").trim(),
  deviceName: String(body.Device_Name || body.deviceName || "").trim(),
  claimedVirtual: body.Is_Virtual === true || body.isVirtual === true,
  playIntegrityToken: String(
    body.playIntegrityToken || body.Play_Integrity_Token || "",
  ).trim(),
  installationPath: String(
    body.installationPath || body.Installation_Path || "",
  ).trim(),
});

const isValidIdentifier = (value) => value.length >= 8 && value.length <= 512;

function verifyHmacRequest(req) {
  const secret = process.env.DEVICE_HMAC_SECRET;
  const signature = req.get("x-device-signature");
  const timestamp = req.get("x-device-timestamp");
  if (!secret && !signature && !timestamp)
    return { verified: false, required: false };
  if (!secret)
    return {
      verified: false,
      required: true,
      reason: "HMAC secret is not configured",
    };
  if (!signature || !timestamp || !/^\d{10,13}$/.test(timestamp)) {
    return { verified: false, required: true, reason: "Missing HMAC headers" };
  }
  const timestampMs =
    Number(timestamp) < 1e12 ? Number(timestamp) * 1000 : Number(timestamp);
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return {
      verified: false,
      required: true,
      reason: "Expired HMAC timestamp",
    };
  }
  const payload = `${timestamp}.${JSON.stringify(req.body || {})}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  return {
    verified: valid,
    required: true,
    reason: valid ? null : "Invalid HMAC signature",
  };
}

function serverVirtualCheck(req, signals) {
  const userAgent = String(req.get("user-agent") || "").toLowerCase();
  const emulatorPattern =
    /emulator|simulator|genymotion|sdk_gphone|android sdk built for x86|goldfish|ranchu/;
  const suspiciousPath =
    signals.installationPath &&
    !/^(?:\/data\/app|\/data\/user|[A-Za-z]:\\Program Files)/i.test(
      signals.installationPath,
    );
  return emulatorPattern.test(userAgent) || Boolean(suspiciousPath);
}

async function verifyPlayIntegrity(signals) {
  if (!signals.playIntegrityToken) {
    return {
      verified: false,
      checked: false,
      reason: "No Play Integrity token",
    };
  }
  const packageName = process.env.ANDROID_PACKAGE_NAME;
  const credentials = process.env.GOOGLE_PLAY_INTEGRITY_CREDENTIALS;
  if (!packageName || !credentials) {
    return {
      verified: false,
      checked: false,
      reason: "Play Integrity is not configured",
    };
  }
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ["https://www.googleapis.com/auth/playintegrity"],
    });
    const client = await auth.getClient();
    const response = await client.request({
      url: `https://playintegrity.googleapis.com/v1/${packageName}:decodeIntegrityToken`,
      method: "POST",
      data: { integrity_token: signals.playIntegrityToken },
    });
    const payload = response.data?.tokenPayloadExternal || {};
    const appRecognition = payload.appIntegrity?.appRecognitionVerdict;
    const deviceVerdict =
      payload.deviceIntegrity?.deviceRecognitionVerdict || [];
    const verified =
      appRecognition === "PLAY_RECOGNIZED" &&
      deviceVerdict.some(
        (item) =>
          item === "MEETS_DEVICE_INTEGRITY" ||
          item === "MEETS_STRONG_INTEGRITY",
      );
    return {
      verified,
      checked: true,
      reason: verified ? null : "Play Integrity verdict rejected",
    };
  } catch (error) {
    return {
      verified: false,
      checked: true,
      reason:
        error.response?.data?.error?.message ||
        "Play Integrity verification failed",
    };
  }
}

async function registerOrVerifyDevice({ req, userId = null }) {
  const signals = getDeviceSignals(req.body);
  const deviceId =
    signals.hardwareId || String(req.cookies?.device_id || "").trim();
  if (!deviceId || !isValidIdentifier(deviceId))
    return { ok: true, legacy: true, signals };

  // HMAC is for trusted mobile device payloads. Browser sessions use the
  // server-issued device cookie and must not be blocked by mobile headers.
  const isMobileDeviceRequest = Boolean(
    signals.hardwareId || signals.playIntegrityToken,
  );
  if (isMobileDeviceRequest) {
    const hmac = verifyHmacRequest(req);
    if (
      (process.env.REQUIRE_DEVICE_HMAC === "true" || hmac.required) &&
      !hmac.verified
    ) {
      return {
        ok: false,
        status: 401,
        code: "INVALID_DEVICE_SIGNATURE",
        message: hmac.reason,
      };
    }
  }
  const integrity = await verifyPlayIntegrity(signals);
  const serverVirtual = serverVirtualCheck(req, signals);
  const existing = await Device.findOne({ device_id: deviceId });

  if (
    existing?.linked_user_id &&
    String(existing.linked_user_id) !== String(userId)
  ) {
    return {
      ok: false,
      status: 403,
      code: "DEVICE_ALREADY_LINKED",
      message: "This device is already linked to another account",
    };
  }

  const sameSsaidDifferentHardware = signals.ssaid
    ? await Device.findOne({
        ssaid: signals.ssaid,
        device_id: { $ne: deviceId },
      })
    : null;
  const cloneDetected = Boolean(
    sameSsaidDifferentHardware ||
    serverVirtual ||
    (integrity.checked && !integrity.verified),
  );
  const flagged = Boolean(existing?.is_flagged || cloneDetected);
  const record = await Device.findOneAndUpdate(
    { device_id: deviceId },
    {
      $set: {
        linked_user_id: existing?.linked_user_id || userId || null,
        ...(signals.ssaid ? { ssaid: signals.ssaid } : {}),
        ...(signals.deviceName ? { device_name: signals.deviceName } : {}),
        is_flagged: flagged,
        ...(cloneDetected
          ? {
              clone_detected: true,
              clone_reason: sameSsaidDifferentHardware
                ? "SSAAD matches another hardware ID"
                : integrity.reason || "Virtual or untrusted device",
            }
          : {}),
        trust_score: existing?.trust_score ?? 50,
        last_login: new Date(),
        play_integrity_verified: integrity.verified,
        ...(signals.installationPath
          ? { installation_path: signals.installationPath }
          : {}),
      },
      $setOnInsert: { device_id: deviceId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (cloneDetected && userId) {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          rewardFrozen: true,
          rewardFrozenAt: new Date(),
          rewardFreezeReason: record.clone_reason,
        },
      },
    );
    await logFraudEvent({
      userId,
      eventType: "SUSPICIOUS_BEHAVIOR",
      severity: "high",
      deviceId,
      riskScoreImpact: 20,
      metadata: { reason: record.clone_reason, integrity },
    });
  }
  return {
    ok: true,
    legacy: false,
    deviceId,
    record,
    signals,
    integrity,
    cloneDetected,
  };
}

module.exports = {
  getDeviceSignals,
  verifyHmacRequest,
  verifyPlayIntegrity,
  registerOrVerifyDevice,
  serverVirtualCheck,
};

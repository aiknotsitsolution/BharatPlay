const crypto = require("node:crypto");
const User = require("../models/usermodel");
const {
  detectVPN,
  getClientIp,
  isLocalOrPrivateIp,
} = require("./vpn.service/vpn.service");
const { checkIpAccountBinding } = require("./ipAccountBindingService");

let signupIpIndexPromise;

const signupIpHash = (ip) =>
  crypto
    .createHmac(
      "sha256",
      process.env.SIGNUP_IP_HASH_SECRET || process.env.JWT_SECRET || "",
    )
    .update(ip)
    .digest("hex");

const ensureSignupIpIndex = async () => {
  if (!signupIpIndexPromise) {
    signupIpIndexPromise = User.collection.createIndex(
      { signupIpHash: 1 },
      {
        name: "uniq_signup_ip_hash",
        unique: true,
        partialFilterExpression: { signupIpHash: { $type: "string" } },
      },
    );
  }
  try {
    await signupIpIndexPromise;
  } catch (error) {
    signupIpIndexPromise = null;
    throw error;
  }
};

const evaluateSignupRequest = async (req) => {
  const ip = getClientIp(req);
  if (!ip || isLocalOrPrivateIp(ip)) {
    if (process.env.NODE_ENV === "development") {
      const bindingCheck = await checkIpAccountBinding(req);
      if (!bindingCheck.ok) return bindingCheck;
      return {
        ok: true,
        ip: null,
        ipHash: null,
        vpnInfo: null,
        skipped: true,
      };
    }

    return {
      ok: false,
      status: 403,
      code: "PUBLIC_IP_REQUIRED",
      message: "Registration requires a verifiable public IP address.",
    };
  }

  let vpnInfo;
  try {
    vpnInfo = await detectVPN(ip);
  } catch (error) {
    console.error("Signup VPN check failed:", error);
    return {
      ok: false,
      status: 503,
      code: "SIGNUP_RISK_CHECK_UNAVAILABLE",
      message: "Registration checks are temporarily unavailable. Try again later.",
    };
  }

  if (
    vpnInfo.message ||
    !vpnInfo.ip ||
    typeof vpnInfo.isVPN !== "boolean" ||
    typeof vpnInfo.isProxy !== "boolean" ||
    typeof vpnInfo.isHosting !== "boolean"
  ) {
    console.error("Signup VPN check returned an incomplete result:", {
      ip,
      message: vpnInfo.message || "Incomplete VPN response",
    });
    return {
      ok: false,
      status: 503,
      code: "SIGNUP_RISK_CHECK_UNAVAILABLE",
      message: "Registration checks are temporarily unavailable. Try again later.",
    };
  }

  if (vpnInfo.isVPN || vpnInfo.isProxy || vpnInfo.isHosting) {
    return {
      ok: false,
      status: 403,
      code: "VPN_OR_PROXY_DETECTED",
      message: "Registration is not allowed over VPN, proxy, or hosting networks.",
      ip,
      vpnInfo,
    };
  }

  try {
    const bindingCheck = await checkIpAccountBinding(req);
    if (!bindingCheck.ok) return bindingCheck;

    await ensureSignupIpIndex();
    const ipHash = signupIpHash(ip);
    const existingUser = await User.findOne({
      $or: [{ signupIpHash: ipHash }, { ipAddress: ip }],
    })
      .select("_id")
      .lean();

    if (existingUser) {
      return {
        ok: false,
        status: 409,
        code: "SIGNUP_IP_ALREADY_USED",
        message: "Only one account can be registered from the same public IP address.",
        ip,
      };
    }

    return { ok: true, ip, ipHash, vpnInfo };
  } catch (error) {
    console.error("Signup IP policy check failed:", error);
    return {
      ok: false,
      status: 503,
      code: "SIGNUP_PROTECTION_UNAVAILABLE",
      message: "Registration checks are temporarily unavailable. Try again later.",
    };
  }
};

const isSignupIpDuplicateError = (error) =>
  Boolean(
    error?.code === 11000 &&
      (error.keyPattern?.signupIpHash || error.keyValue?.signupIpHash),
  );

module.exports = {
  evaluateSignupRequest,
  isSignupIpDuplicateError,
};

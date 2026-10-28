const crypto = require("node:crypto");
const User = require("../models/usermodel");
const {
  detectVPN,
  getClientIp,
  isLocalOrPrivateIp,
} = require("./vpn.service/vpn.service");

let legacySignupIpIndexMigration;

const signupIpHash = (ip) =>
  crypto
    .createHmac(
      "sha256",
      process.env.SIGNUP_IP_HASH_SECRET || process.env.JWT_SECRET || "",
    )
    .update(ip)
    .digest("hex");

const removeLegacySignupIpUniqueness = async () => {
  if (!legacySignupIpIndexMigration) {
    legacySignupIpIndexMigration = (async () => {
      let indexes;
      try {
        indexes = await User.collection.indexes();
      } catch (error) {
        if (error.code === 26 || error.codeName === "NamespaceNotFound") {
          return;
        }
        throw error;
      }

      const uniqueSignupIpIndexes = indexes.filter(
        (index) => index.unique && index.key?.signupIpHash === 1,
      );

      await Promise.all(
        uniqueSignupIpIndexes.map(async (index) => {
          try {
            await User.collection.dropIndex(index.name);
          } catch (error) {
            if (error.code !== 27 && error.codeName !== "IndexNotFound") {
              throw error;
            }
          }
        }),
      );
    })();
  }
  try {
    await legacySignupIpIndexMigration;
  } catch (error) {
    legacySignupIpIndexMigration = null;
    throw error;
  }
};

const evaluateSignupRequest = async (req) => {
  const ip = getClientIp(req);
  if (!ip || isLocalOrPrivateIp(ip)) {
    if (process.env.NODE_ENV === "development") {
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
    await removeLegacySignupIpUniqueness();
    const ipHash = signupIpHash(ip);
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

module.exports = { evaluateSignupRequest };

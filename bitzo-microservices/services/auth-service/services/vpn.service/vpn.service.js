const axios = require("axios");
const net = require("node:net");

/**
 * Normalize IP address
 */
const normalizeIp = (ip) => {
  if (!ip || typeof ip !== "string") {
    return null;
  }

  let cleaned = ip.trim();

  // If multiple IPs are present, take first one
  if (cleaned.includes(",")) {
    cleaned = cleaned.split(",")[0].trim();
  }

  // Remove IPv4 mapped IPv6 prefix
  cleaned = cleaned.replace(/^::ffff:/i, "");

  // Remove zone ID from IPv6
  cleaned = cleaned.replace(/%.*$/, "");

  if (
    !cleaned ||
    cleaned.toLowerCase() === "unknown" ||
    cleaned.toLowerCase() === "null"
  ) {
    return null;
  }

  // IPv6 localhost
  if (cleaned === "::1") {
    return "127.0.0.1";
  }

  return net.isIP(cleaned) ? cleaned : null;
};

/**
 * Check Local / Private IP
 */
const isLocalOrPrivateIp = (ip) => {
  if (!ip) {
    return true;
  }

  if (net.isIPv4(ip)) {
    const [first, second, third] = ip.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 &&
        (second === 0 || second === 2 || second === 168)) ||
      (first === 198 &&
        (second === 18 || second === 19 || second === 51)) ||
      (first === 203 && second === 0 && third === 113)
    );
  }

  const normalized = ip.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/i.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
};

/**
 * Get real client IP from Express request
 */
const getClientIp = (req) => {
  if (!req) {
    return null;
  }

  // Express resolves forwarded headers according to the configured trusted proxy.
  if (req.ip) {
    return normalizeIp(req.ip);
  }

  // Socket IP
  if (req.socket?.remoteAddress) {
    return normalizeIp(req.socket.remoteAddress);
  }

  return null;
};

/**
 * Detect VPN / Proxy / Hosting
 */
const detectVPN = async (ip) => {
  const normalizedIp = normalizeIp(ip);

  console.log("====================================");
  console.log("[VPN CHECK]");
  console.log("Original IP:", ip);
  console.log("Normalized IP:", normalizedIp);
  console.log("====================================");

  /**
   * Local/private IP cannot be checked
   */
  if (!normalizedIp || isLocalOrPrivateIp(normalizedIp)) {
    console.log(
      "[VPN CHECK] Local/private IP. VPN detection skipped:",
      normalizedIp
    );

    return {
      ip: normalizedIp || null,
      isVPN: false,
      isProxy: false,
      isHosting: false,
      country: null,
      countryCode: null,
      isp: null,
      org: null,
      as: null,
      message: "Private/local IP",
    };
  }

  try {
    const url =
      `http://ip-api.com/json/${encodeURIComponent(normalizedIp)}` +
      `?fields=status,message,country,countryCode,proxy,hosting,isp,org,as,query`;

    console.log("[VPN API]", url);

    const response = await axios.get(url, {
      timeout: 5000,
    });

    const data = response.data;

    console.log("[VPN API RESPONSE]", data);

    if (!data || data.status !== "success") {
      console.warn(
        "[VPN CHECK] IP API failed:",
        data?.message || "Unknown error"
      );

      return {
        ip: normalizedIp,
        isVPN: false,
        isProxy: false,
        isHosting: false,
        country: null,
        countryCode: null,
        isp: null,
        org: null,
        as: null,
        message: data?.message || "IP API failed",
      };
    }

    const isProxy = Boolean(data.proxy);
    const isHosting = Boolean(data.hosting);

    /**
     * VPN decision
     *
     * ip-api does not have a dedicated "VPN" field.
     * Proxy + Hosting are used as VPN indicators.
     */
    const isVPN = isProxy || isHosting;

    const result = {
      ip: data.query || normalizedIp,

      isVPN,

      isProxy,

      isHosting,

      country: data.country || null,

      countryCode: data.countryCode || null,

      isp: data.isp || null,

      org: data.org || null,

      as: data.as || null,
    };

    console.log("[VPN CHECK RESULT]");
    console.log(result);

    return result;
  } catch (error) {
    console.error(
      "[VPN CHECK ERROR]:",
      error.response?.data || error.message
    );

    return {
      ip: normalizedIp,
      isVPN: false,
      isProxy: false,
      isHosting: false,
      country: null,
      countryCode: null,
      isp: null,
      org: null,
      as: null,
      message: "VPN detection API unavailable",
    };
  }
};

module.exports = {
  normalizeIp,
  isLocalOrPrivateIp,
  getClientIp,
  detectVPN,
};
const axios = require("axios");

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

  return cleaned;
};

/**
 * Check Local / Private IP
 */
const isLocalOrPrivateIp = (ip) => {
  if (!ip) {
    return true;
  }

  // IPv4 localhost
  if (ip === "127.0.0.1") {
    return true;
  }

  if (ip.startsWith("127.")) {
    return true;
  }

  // Private networks
  if (ip.startsWith("10.")) {
    return true;
  }

  if (
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return true;
  }

  // 192.168.x.x
  if (ip.startsWith("192.168.")) {
    return true;
  }

  // Link local
  if (ip.startsWith("169.254.")) {
    return true;
  }

  // CGNAT
  if (ip.startsWith("100.64.")) {
    return true;
  }

  // IPv6 localhost
  if (ip === "::1") {
    return true;
  }

  // IPv6 private/local
  if (
    ip.toLowerCase().startsWith("fc") ||
    ip.toLowerCase().startsWith("fd") ||
    ip.toLowerCase().startsWith("fe80")
  ) {
    return true;
  }

  return false;
};

/**
 * Get real client IP from Express request
 */
const getClientIp = (req) => {
  if (!req) {
    return null;
  }

  // Cloudflare
  const cfIp = req.headers["cf-connecting-ip"];

  if (cfIp) {
    return normalizeIp(cfIp);
  }

  // X-Forwarded-For
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();

    if (firstIp) {
      return normalizeIp(firstIp);
    }
  }

  // X-Real-IP
  const realIp = req.headers["x-real-ip"];

  if (realIp) {
    return normalizeIp(realIp);
  }

  // Express detected IP
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
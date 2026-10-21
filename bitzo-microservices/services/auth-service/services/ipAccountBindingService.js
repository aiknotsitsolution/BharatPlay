const crypto = require("node:crypto");
const IpAccountBinding = require("../models/IpAccountBinding");
const User = require("../models/usermodel");
const {
  getClientIp,
  isLocalOrPrivateIp,
} = require("./vpn.service/vpn.service");

const hashIp = (ip) =>
  crypto
    .createHmac(
      "sha256",
      process.env.SIGNUP_IP_HASH_SECRET || process.env.JWT_SECRET || "",
    )
    .update(ip)
    .digest("hex");

const resolveIp = (req) => {
  const ip = getClientIp(req);
  return ip && !isLocalOrPrivateIp(ip) ? ip : null;
};

const checkIpAccountBinding = async (req, userId = null) => {
  const ip = resolveIp(req);
  if (!ip) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true, skipped: true };
    }

    return {
      ok: false,
      status: 403,
      code: "PUBLIC_IP_REQUIRED",
      message: "Sign-in requires a verifiable public IP address.",
    };
  }

  try {
    const ipHash = hashIp(ip);
    const binding = await IpAccountBinding.findOne({ ipHash })
      .select("userId")
      .lean();
    if (binding && String(binding.userId) !== String(userId)) {
      return {
        ok: false,
        status: 403,
        code: "IP_ACCOUNT_BINDING_VIOLATION",
        message: "This public network is already linked to a different account.",
      };
    }

    const existingUserQuery = {
      $or: [{ ipAddress: ip }, { signupIpHash: ipHash }],
    };
    if (userId) existingUserQuery._id = { $ne: userId };
    const existingUser = await User.findOne(existingUserQuery)
      .select("_id")
      .lean();
    if (existingUser) {
      return {
        ok: false,
        status: 403,
        code: "IP_ACCOUNT_BINDING_VIOLATION",
        message: "This public network is already linked to a different account.",
      };
    }
    return { ok: true, ip, ipHash };
  } catch (error) {
    console.error("IP account binding check failed:", error);
    return {
      ok: false,
      status: 503,
      code: "IP_ACCOUNT_BINDING_UNAVAILABLE",
      message: "Could not verify this network's account binding. Try again later.",
    };
  }
};

const claimIpAccountBinding = async (req, userId) => {
  const checked = await checkIpAccountBinding(req, userId);
  if (!checked.ok || checked.skipped) return checked;

  try {
    await IpAccountBinding.create({
      ipHash: checked.ipHash,
      userId,
      lastSeen: new Date(),
    });
    return { ok: true };
  } catch (error) {
    if (error.code !== 11000) {
      console.error("IP account binding claim failed:", error);
      return {
        ok: false,
        status: 503,
        code: "IP_ACCOUNT_BINDING_UNAVAILABLE",
        message: "Could not secure this network's account binding. Try again later.",
      };
    }

    try {
      const binding = await IpAccountBinding.findOne({
        ipHash: checked.ipHash,
      })
        .select("userId")
        .lean();
      if (binding && String(binding.userId) === String(userId)) {
        await IpAccountBinding.updateOne(
          { ipHash: checked.ipHash, userId },
          { $set: { lastSeen: new Date() } },
        );
        return { ok: true };
      }
      return {
        ok: false,
        status: 403,
        code: "IP_ACCOUNT_BINDING_VIOLATION",
        message: "This public network is already linked to a different account.",
      };
    } catch (lookupError) {
      console.error("IP account binding race check failed:", lookupError);
      return {
        ok: false,
        status: 503,
        code: "IP_ACCOUNT_BINDING_UNAVAILABLE",
        message: "Could not verify this network's account binding. Try again later.",
      };
    }
  }
};

module.exports = { checkIpAccountBinding, claimIpAccountBinding };

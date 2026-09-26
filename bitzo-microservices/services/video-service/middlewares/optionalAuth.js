const { verifyAccessToken } = require("../utils/tokenService");
const User = require("../models/usermodel");

// Optional authentication: if a valid Bearer token is present, populate
// req.user (same normalization as isAuthenticated). Otherwise continue
// anonymously — never reject the request.
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);

    // Normalize to always have both .id and .userId available
    const userId = decoded.sub || decoded.userId || decoded.id || decoded._id;
    const user = userId
      ? await User.findById(userId).select("deviceId").lean()
      : null;
    if (
      !user ||
      String(decoded.deviceId || "") !== String(user.deviceId || "")
    ) {
      return next();
    }
    req.user = {
      ...decoded,
      userId,
      id: userId,
    };

    next();
  } catch (error) {
    // Invalid or expired token — treat as anonymous (Phase 4 / F13)
    next();
  }
};

module.exports = optionalAuth;

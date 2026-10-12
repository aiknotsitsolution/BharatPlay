const { verifyAccessToken } = require("../utils/tokenService");
const User = require("../models/usermodel");

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const userId = decoded.sub || decoded.userId || decoded.id || decoded._id;
      if (userId) {
        const user = await User.findById(userId).select("deviceId").lean();
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
      }
    }
  } catch (_) {
    // Invalid or expired token — treat request as anonymous
  }
  next();
};

module.exports = optionalAuth;

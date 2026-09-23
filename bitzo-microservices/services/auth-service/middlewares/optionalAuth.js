const { verifyAccessToken } = require("../utils/tokenService");

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const userId = decoded.sub || decoded.userId || decoded.id || decoded._id;
      if (userId) {
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
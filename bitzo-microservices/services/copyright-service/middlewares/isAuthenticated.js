const { verifyAccessToken } = require("../utils/tokenService");
const User = require("../models/usermodel");

const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // Normalize to always have both .id and .userId available
    const userId = decoded.sub || decoded.userId || decoded.id || decoded._id;
    req.user = {
      ...decoded,
      userId,
      id: userId,
    };

    // Check user account status — suspended, banned, or deleted users
    // must not access protected resources.
    const user = await User.findById(userId).select("status").lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Account suspended. Please contact support.",
      });
    }

    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Account has been banned.",
      });
    }

    if (user.status === "deleted") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Account no longer exists",
      });
    }

    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid or expired token",
    });
  }
};

module.exports = isAuthenticated;

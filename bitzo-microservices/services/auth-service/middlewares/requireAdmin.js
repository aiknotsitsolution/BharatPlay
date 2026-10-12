const { verifyAccessToken } = require("../utils/tokenService");
const Admin = require("../models/admin/AdminModel");

const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No authorization header found",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized - Invalid authorization format (use Bearer token)",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Token is missing",
      });
    }

    const decoded = verifyAccessToken(token);

    const admin = await Admin.findById(decoded.sub || decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Admin account not found",
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    req.admin = admin;
    req.user = admin;
    next();
  } catch (error) {
    console.error("requireAdmin error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Token has expired. Please login again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token",
    });
  }
};

module.exports = requireAdmin;

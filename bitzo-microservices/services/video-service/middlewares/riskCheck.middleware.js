const User = require("../models/usermodel");

const riskCheck = async (req, res, next) => {
  try {
    if (!req.user?.id) return next();

    const user = await User.findById(req.user.id).select("trustScore");
    if (!user) return next();

    if (user.trustScore < 25) {
      return res.status(403).json({
        success: false,
        code: "HIGH_RISK_ACCOUNT",
        message:
          "Your account is temporarily restricted due to suspicious activity. Please contact support.",
      });
    }

    // Soft warning for medium risk (frontend use kar sakta hai)
    if (user.trustScore < 45) {
      res.set("X-Risk-Level", "medium");
    }

    next();
  } catch (err) {
    next();
  }
};

module.exports = riskCheck;
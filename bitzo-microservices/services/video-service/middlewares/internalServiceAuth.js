const crypto = require("node:crypto");

const internalServiceAuth = (req, res, next) => {
  const expectedToken =
    process.env.INTERNAL_SERVICE_TOKEN || process.env.JWT_SECRET || "";
  const providedToken = req.get("x-internal-service-token") || "";

  if (!expectedToken || !providedToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  if (
    expected.length !== provided.length ||
    !crypto.timingSafeEqual(expected, provided)
  ) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  return next();
};

module.exports = internalServiceAuth;

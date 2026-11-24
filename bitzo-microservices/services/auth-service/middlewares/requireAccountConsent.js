const requireAccountConsent = (req, res, next) => {
  if (req.body?.ageConfirmed !== true) {
    return res.status(400).json({
      success: false,
      code: "AGE_CONFIRMATION_REQUIRED",
      message: "You must confirm that you are at least 18 years old.",
    });
  }
  if (req.body?.termsAccepted !== true) {
    return res.status(400).json({
      success: false,
      code: "TERMS_ACCEPTANCE_REQUIRED",
      message: "Accept the Terms of Service and Privacy Policy to continue.",
    });
  }
  return next();
};

module.exports = requireAccountConsent;

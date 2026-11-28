const REVIEW_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REVIEW_OTP_PATTERN = /^\d{6}$/;

const getPlayStoreReviewConfig = () => {
  const mode = process.env.PLAY_STORE_REVIEW_MODE?.trim().toLowerCase();
  if (!mode || mode === "false") return null;
  if (mode !== "true") {
    throw new Error("PLAY_STORE_REVIEW_MODE must be true or false.");
  }

  const email = process.env.PLAY_STORE_REVIEW_EMAIL?.trim().toLowerCase();
  const otp = process.env.PLAY_STORE_REVIEW_OTP?.trim();
  if (
    !REVIEW_EMAIL_PATTERN.test(email || "") ||
    !REVIEW_OTP_PATTERN.test(otp || "")
  ) {
    throw new Error(
      "Play Store review mode requires a valid PLAY_STORE_REVIEW_EMAIL and six-digit PLAY_STORE_REVIEW_OTP.",
    );
  }

  return { email, otp };
};

module.exports = { getPlayStoreReviewConfig };

const EMAIL_PROVIDER_LIMIT_CODE = "EMAIL_PROVIDER_LIMIT_REACHED";
const EMAIL_SEND_FAILED_CODE = "OTP_EMAIL_SEND_FAILED";

const classifySmtpError = (error) => {
  const details = [error?.message, error?.response]
    .filter((value) => typeof value === "string")
    .join(" ");
  const providerLimitReached =
    /daily user sending limit exceeded|5\.4\.5|daily.{0,40}(?:limit|quota)|(?:quota|limit).{0,40}(?:exceeded|reached)/i.test(
      details,
    );

  return {
    code: providerLimitReached
      ? EMAIL_PROVIDER_LIMIT_CODE
      : EMAIL_SEND_FAILED_CODE,
    message: providerLimitReached
      ? "The email provider has reached its sending limit. Please try again later."
      : "Verification email could not be sent. Please try again later.",
  };
};

module.exports = {
  classifySmtpError,
  EMAIL_PROVIDER_LIMIT_CODE,
  EMAIL_SEND_FAILED_CODE,
};

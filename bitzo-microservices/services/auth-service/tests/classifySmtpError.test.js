const {
  classifySmtpError,
  EMAIL_PROVIDER_LIMIT_CODE,
  EMAIL_SEND_FAILED_CODE,
} = require("../Email/classifySmtpError");

describe("classify SMTP delivery errors", () => {
  test("identifies Gmail's daily sending quota error", () => {
    expect(
      classifySmtpError({
        message:
          "Data command failed: 550-5.4.5 Daily user sending limit exceeded",
      }),
    ).toEqual({
      code: EMAIL_PROVIDER_LIMIT_CODE,
      message:
        "The email provider has reached its sending limit. Please try again later.",
    });
  });

  test("keeps other SMTP failures as generic delivery errors", () => {
    expect(classifySmtpError({ message: "Connection timed out" })).toEqual({
      code: EMAIL_SEND_FAILED_CODE,
      message: "Verification email could not be sent. Please try again later.",
    });
  });
});

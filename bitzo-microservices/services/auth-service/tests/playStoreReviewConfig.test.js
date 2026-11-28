const {
  getPlayStoreReviewConfig,
} = require("../services/playStoreReviewConfig");

const REVIEW_ENV_KEYS = [
  "PLAY_STORE_REVIEW_MODE",
  "PLAY_STORE_REVIEW_EMAIL",
  "PLAY_STORE_REVIEW_OTP",
];

describe("Play Store reviewer configuration", () => {
  const originalValues = {};

  beforeAll(() => {
    REVIEW_ENV_KEYS.forEach((key) => {
      originalValues[key] = process.env[key];
    });
  });

  beforeEach(() => {
    REVIEW_ENV_KEYS.forEach((key) => delete process.env[key]);
  });

  afterAll(() => {
    REVIEW_ENV_KEYS.forEach((key) => {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    });
  });

  test("is disabled unless explicitly enabled", () => {
    expect(getPlayStoreReviewConfig()).toBeNull();
    process.env.PLAY_STORE_REVIEW_MODE = "false";
    expect(getPlayStoreReviewConfig()).toBeNull();
  });

  test("accepts only an exact normalized email and a six-digit configured code", () => {
    process.env.PLAY_STORE_REVIEW_MODE = "true";
    process.env.PLAY_STORE_REVIEW_EMAIL = "Reviewer@Example.com";
    process.env.PLAY_STORE_REVIEW_OTP = "123456";

    expect(getPlayStoreReviewConfig()).toEqual({
      email: "reviewer@example.com",
      otp: "123456",
    });
  });

  test("fails closed when enabled without a valid allowlist and code", () => {
    process.env.PLAY_STORE_REVIEW_MODE = "true";

    expect(() => getPlayStoreReviewConfig()).toThrow(
      "Play Store review mode requires",
    );
  });
});
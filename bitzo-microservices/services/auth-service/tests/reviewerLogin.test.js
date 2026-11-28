jest.mock("../models/usermodel", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("../models/WatchSession", () => ({}));
jest.mock("../models/RefreshToken", () => ({
  create: jest.fn(),
}));
jest.mock("../models/Device", () => ({}));
jest.mock("../models/DeviceFingerprintModel", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("../utils/tokenService", () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn(),
  REFRESH_TOKEN_TTL_MS: 60_000,
}));
jest.mock("../utils/deviceCookie", () => ({
  resolveDeviceId: jest.fn(() => "review-device"),
}));
jest.mock("../utils/refreshCookie", () => ({
  REFRESH_COOKIE: "refreshToken",
  setRefreshCookie: jest.fn(),
  clearRefreshCookie: jest.fn(),
}));
jest.mock("../services/vpn.service/vpn.service.js", () => ({
  detectVPN: jest.fn(),
  getClientIp: jest.fn(() => "192.0.2.10"),
}));
jest.mock("../services/signupPolicy", () => ({
  evaluateSignupRequest: jest.fn(),
}));
jest.mock("../services/vpn.service/fraud.service.js", () => ({
  logFraudEvent: jest.fn(),
  analyzeBehavior: jest.fn(),
  applyRiskToUser: jest.fn(),
  applyTrustRule: jest.fn(),
}));
jest.mock("../services/auditEventService", () => ({
  logAuditEvent: jest.fn(),
}));
jest.mock("../services/deviceSecurityService", () => ({
  registerOrVerifyDevice: jest.fn(),
  requireAndroidSignupIntegrity: jest.fn(),
  checkDeviceRegistrationAvailability: jest.fn(),
}));
jest.mock("../services/clientHardwareBindingService", () => ({
  checkClientHardwareBinding: jest.fn(),
  bindClientHardwareUuid: jest.fn(),
}));
jest.mock("../services/browserDeviceBindingService", () => ({
  checkWebsiteDeviceBinding: jest.fn(),
  claimWebsiteDeviceBinding: jest.fn(),
}));
jest.mock("../Email/nodemailer.js", () => ({
  sendMail: jest.fn().mockResolvedValue({}),
}));
jest.mock("../Email/register.js", () => jest.fn());
jest.mock("../Email/login.js", () => jest.fn(() => ({ to: "test@example.com" })));
jest.mock("../Email/password.js", () => jest.fn());
jest.mock("../Email/passwordReset.js", () => jest.fn());
jest.mock("../utils/imagekit.js", () => ({}));
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const User = require("../models/usermodel");
const DeviceFingerprint = require("../models/DeviceFingerprintModel");
const { detectVPN } = require("../services/vpn.service/vpn.service.js");
const { analyzeBehavior } = require("../services/vpn.service/fraud.service.js");
const { registerOrVerifyDevice } = require("../services/deviceSecurityService");
const {
  checkClientHardwareBinding,
  bindClientHardwareUuid,
} = require("../services/clientHardwareBindingService");
const {
  checkWebsiteDeviceBinding,
  claimWebsiteDeviceBinding,
} = require("../services/browserDeviceBindingService");
const transporter = require("../Email/nodemailer.js");
const RefreshToken = require("../models/RefreshToken");
const { loginUser } = require("../controller/authController");

const REVIEW_EMAIL = "testingvidbuxapp@gmail.com";
const REVIEW_OTP = "123456";
const makeResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
    cookie: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

const makeRequest = (email, otp) => ({
  body: {
    email,
    password: "correct-password",
    ageConfirmed: true,
    termsAccepted: true,
    clientHardwareUuid: "review-hardware",
    ...(otp ? { otp } : {}),
  },
  cookies: { device_id: "review-device" },
  headers: { "user-agent": "review-browser" },
});

describe("Play Store reviewer login", () => {
  let user;
  const originalReviewEnv = {};

  beforeAll(() => {
    [
      "PLAY_STORE_REVIEW_MODE",
      "PLAY_STORE_REVIEW_EMAIL",
      "PLAY_STORE_REVIEW_OTP",
    ].forEach((key) => {
      originalReviewEnv[key] = process.env[key];
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PLAY_STORE_REVIEW_MODE = "true";
    process.env.PLAY_STORE_REVIEW_EMAIL = REVIEW_EMAIL;
    process.env.PLAY_STORE_REVIEW_OTP = REVIEW_OTP;

    user = {
      _id: "review-user",
      name: "Review User",
      email: REVIEW_EMAIL,
      password: bcrypt.hashSync("correct-password", 4),
      status: "active",
      role: "user",
      save: jest.fn().mockResolvedValue(undefined),
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    User.updateOne.mockResolvedValue({});
    RefreshToken.create.mockResolvedValue({});
    DeviceFingerprint.findOne.mockResolvedValue(null);
    DeviceFingerprint.findOneAndUpdate.mockResolvedValue({});
    DeviceFingerprint.updateOne.mockResolvedValue({});
    checkWebsiteDeviceBinding.mockResolvedValue({
      ok: true,
      fingerprint: "review-browser-fingerprint",
    });
    checkClientHardwareBinding.mockResolvedValue({ ok: true });
    registerOrVerifyDevice.mockResolvedValue({
      ok: true,
      deviceId: "review-device",
    });
    bindClientHardwareUuid.mockResolvedValue({ ok: true });
    claimWebsiteDeviceBinding.mockResolvedValue(null);
    analyzeBehavior.mockResolvedValue({ riskPoints: 0, reasons: [] });
  });

  afterAll(() => {
    Object.entries(originalReviewEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  test("bypasses location blocking only for the reviewer and accepts the configured OTP", async () => {
    detectVPN.mockResolvedValue({ isVPN: true, isProxy: true });
    DeviceFingerprint.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        pendingOtp: REVIEW_OTP,
        otpPurpose: "login",
        pendingOtpEmail: REVIEW_EMAIL,
        pendingOtpFingerprint: "review-browser-fingerprint",
        otpExpiresAt: new Date(Date.now() + 60_000),
      });
    const passwordResponse = makeResponse();

    await loginUser(makeRequest(REVIEW_EMAIL), passwordResponse);

    expect(detectVPN).not.toHaveBeenCalled();
    expect(passwordResponse.status).toHaveBeenCalledWith(200);
    expect(passwordResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        requiresOtp: true,
        message:
          "Enter the reviewer verification code provided in the Play Store access instructions.",
      }),
    );
    expect(passwordResponse.json.mock.calls[0][0].otpCode).toBeUndefined();
    expect(DeviceFingerprint.findOneAndUpdate.mock.calls[0][1].$set).toEqual(
      expect.objectContaining({
        pendingOtp: REVIEW_OTP,
        otpPurpose: "login",
        pendingOtpEmail: REVIEW_EMAIL,
      }),
    );
    expect(transporter.sendMail).not.toHaveBeenCalled();

    const otpResponse = makeResponse();
    await loginUser(makeRequest(REVIEW_EMAIL, REVIEW_OTP), otpResponse);

    expect(otpResponse.status).toHaveBeenCalledWith(200);
    expect(otpResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Login successful",
      }),
    );
    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
  });

  test("keeps location blocking for other accounts", async () => {
    user.email = "regular@example.com";
    detectVPN.mockResolvedValue({ isVPN: true, isProxy: false });
    const response = makeResponse();

    await loginUser(makeRequest(user.email), response);

    expect(detectVPN).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(DeviceFingerprint.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("keeps regular email OTP delivery unchanged", async () => {
    user.email = "regular@example.com";
    detectVPN.mockResolvedValue({ isVPN: false, isProxy: false });
    DeviceFingerprint.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        pendingOtp: "100000",
        otpPurpose: "login",
        pendingOtpEmail: user.email,
        pendingOtpFingerprint: "review-browser-fingerprint",
        otpExpiresAt: new Date(Date.now() + 60_000),
      });
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    const passwordResponse = makeResponse();

    try {
      await loginUser(makeRequest(user.email), passwordResponse);
    } finally {
      randomSpy.mockRestore();
    }

    expect(passwordResponse.status).toHaveBeenCalledWith(200);
    expect(DeviceFingerprint.findOneAndUpdate.mock.calls[0][1].$set.pendingOtp)
      .toBe("100000");
    expect(transporter.sendMail).toHaveBeenCalledTimes(1);

    const otpResponse = makeResponse();
    await loginUser(makeRequest(user.email, REVIEW_OTP), otpResponse);

    expect(otpResponse.status).toHaveBeenCalledWith(401);
    expect(RefreshToken.create).not.toHaveBeenCalled();
  });
});

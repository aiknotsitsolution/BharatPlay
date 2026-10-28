jest.mock("../models/usermodel", () => ({
  findOne: jest.fn(),
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
  signAccessToken: jest.fn(() => "access-token"),
  signRefreshToken: jest.fn(() => "refresh-token"),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn(() => "refresh-token-hash"),
  REFRESH_TOKEN_TTL_MS: 60_000,
}));
jest.mock("../utils/deviceCookie", () => ({
  resolveDeviceId: jest.fn(() => "browser-device-123"),
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
}));
jest.mock("../Email/nodemailer.js", () => ({
  sendMail: jest.fn().mockResolvedValue({}),
}));
jest.mock("../Email/register.js", () => jest.fn(() => ({ to: "user@example.com" })));
jest.mock("../Email/login.js", () => jest.fn(() => ({ to: "user@example.com" })));
jest.mock("../Email/password.js", () => jest.fn());
jest.mock("../Email/passwordReset.js", () => jest.fn());
jest.mock("../utils/imagekit.js", () => ({}));
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const User = require("../models/usermodel");
const DeviceFingerprint = require("../models/DeviceFingerprintModel");
const RefreshToken = require("../models/RefreshToken");
const {
  bindClientHardwareUuid,
  checkClientHardwareBinding,
} = require("../services/clientHardwareBindingService");
const { registerOrVerifyDevice } = require("../services/deviceSecurityService");
const {
  checkWebsiteDeviceBinding,
} = require("../services/browserDeviceBindingService");
const { setRefreshCookie } = require("../utils/refreshCookie");
const { registerUser } = require("../controller/authController");

const registeredUser = {
  _id: "user-123",
  name: "Test User",
  email: "user@example.com",
  password: bcrypt.hashSync("correct-password", 4),
  status: "active",
  role: "user",
  emailVerified: true,
  phone: null,
  phoneVerified: false,
};

const makeResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

const makeRequest = (otp) => ({
  body: {
    name: registeredUser.name,
    email: registeredUser.email,
    password: "correct-password",
    clientHardwareUuid: "hardware-uuid-123",
    browserDeviceSignals: {
      version: "web-v1",
      platform: "Win32",
      screenWidth: 1920,
      screenHeight: 1080,
      colorDepth: 24,
      devicePixelRatio: 1,
      hardwareConcurrency: 8,
      maxTouchPoints: 0,
      timeZone: "America/Los_Angeles",
    },
    ...(otp ? { otp } : {}),
  },
  cookies: { device_id: "browser-device-123" },
  headers: {
    "x-client-platform": "website",
    "user-agent": "test-browser",
  },
});

describe("registration retry recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(registeredUser),
    });
    checkClientHardwareBinding.mockResolvedValue({ ok: true });
    bindClientHardwareUuid.mockResolvedValue({ ok: true });
    checkWebsiteDeviceBinding.mockResolvedValue({
      ok: true,
      fingerprint: `web-v1:${"a".repeat(64)}`,
    });
    registerOrVerifyDevice.mockResolvedValue({ ok: true, deviceId: "browser-device-123" });
    DeviceFingerprint.findOneAndUpdate.mockResolvedValue({});
    DeviceFingerprint.updateOne.mockResolvedValue({});
    RefreshToken.create.mockResolvedValue({});
  });

  test("resends the registration OTP when the account was created but the response failed", async () => {
    const response = makeResponse();

    await registerUser(makeRequest(), response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        requiresOtp: true,
        otpCode: expect.stringMatching(/^\d{6}$/),
      }),
    );
    expect(checkClientHardwareBinding).toHaveBeenCalledWith({
      clientHardwareUuid: "hardware-uuid-123",
      userId: registeredUser._id,
    });
  });

  test("completes registration after verifying the retry OTP", async () => {
    const otp = "123456";
    DeviceFingerprint.findOne.mockResolvedValue({
      pendingOtp: otp,
      otpPurpose: "register",
      pendingOtpEmail: registeredUser.email,
      pendingOtpFingerprint: `web-v1:${"a".repeat(64)}`,
      otpExpiresAt: new Date(Date.now() + 60_000),
    });
    const response = makeResponse();

    await registerUser(makeRequest(otp), response);

    expect(registerOrVerifyDevice).toHaveBeenCalledWith({
      req: expect.any(Object),
      userId: registeredUser._id,
    });
    expect(DeviceFingerprint.updateOne).toHaveBeenCalledWith(
      { deviceId: "browser-device-123" },
      expect.objectContaining({
        $unset: expect.objectContaining({ pendingOtp: 1 }),
      }),
    );
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: "access-token",
        user: expect.objectContaining({ needsPhoneBinding: true }),
      }),
    );
    expect(RefreshToken.create).toHaveBeenCalledTimes(1);
    expect(setRefreshCookie).toHaveBeenCalledTimes(1);
  });

  test("does not recover registration when the password is wrong", async () => {
    const request = makeRequest();
    request.body.password = "wrong-password";
    const response = makeResponse();

    await registerUser(request, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid email or password" }),
    );
    expect(DeviceFingerprint.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

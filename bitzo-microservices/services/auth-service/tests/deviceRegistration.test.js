jest.mock("../models/Device", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock("../models/PlayIntegrityToken", () => ({}));
jest.mock("../models/usermodel", () => ({
  findOne: jest.fn(),
}));
jest.mock("../models/DeviceFingerprintModel", () => ({
  findOne: jest.fn(),
}));
jest.mock("../services/vpn.service/fraud.service", () => ({
  logFraudEvent: jest.fn(),
}));

const User = require("../models/usermodel");
const Device = require("../models/Device");
const DeviceFingerprint = require("../models/DeviceFingerprintModel");
const {
  checkDeviceRegistrationAvailability,
  registerOrVerifyDevice,
} = require("../services/deviceSecurityService");

const userQuery = (user) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(user),
});

const browserDeviceSignals = {
  version: "web-v1",
  platform: "Windows",
  screenWidth: 1920,
  screenHeight: 1080,
  colorDepth: 24,
  devicePixelRatio: 1,
  hardwareConcurrency: 8,
  maxTouchPoints: 0,
  timeZone: "America/Los_Angeles",
};

describe("device registration availability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-browser-device-binding-secret";
    delete process.env.DEVICE_HMAC_SECRET;
    delete process.env.REQUIRE_DEVICE_HMAC;
  });

  test("defers claiming a new device until authentication is complete", async () => {
    Device.findOne.mockResolvedValue(null);
    Device.findOneAndUpdate.mockResolvedValue({});

    await registerOrVerifyDevice({
      req: {
        body: {},
        cookies: { device_id: "browser-device-123" },
        get: jest.fn().mockReturnValue("test-agent"),
      },
      userId: "verified-user",
      allowAccountSwitch: true,
      deferAccountBinding: true,
    });

    expect(Device.findOneAndUpdate).toHaveBeenCalledWith(
      { device_id: "browser-device-123" },
      expect.objectContaining({
        $set: expect.objectContaining({ linked_user_id: null }),
      }),
      expect.any(Object),
    );
  });

  test("transfers an existing device only when account switching is enabled", async () => {
    Device.findOne.mockResolvedValue({ linked_user_id: "previous-user" });
    Device.findOneAndUpdate.mockResolvedValue({});

    await registerOrVerifyDevice({
      req: {
        body: {},
        cookies: { device_id: "browser-device-123" },
        get: jest.fn().mockReturnValue("test-agent"),
      },
      userId: "verified-user",
      allowAccountSwitch: true,
    });

    expect(Device.findOneAndUpdate).toHaveBeenCalledWith(
      { device_id: "browser-device-123" },
      expect.objectContaining({
        $set: expect.objectContaining({ linked_user_id: "verified-user" }),
      }),
      expect.any(Object),
    );
  });

  test("accepts a verified Play Integrity request without device HMAC headers", async () => {
    process.env.DEVICE_HMAC_SECRET = "server-only-device-hmac-secret";
    process.env.REQUIRE_DEVICE_HMAC = "true";
    Device.findOne.mockResolvedValue(null);
    Device.findOneAndUpdate.mockResolvedValue({});

    await expect(
      registerOrVerifyDevice({
        req: {
          body: {
            hardwareId: "mobile-hardware-device-123",
            playIntegrityToken: "verified-integrity-token",
          },
          cookies: {},
          playIntegrityVerified: true,
          get: jest.fn().mockReturnValue("test-agent"),
        },
        userId: "verified-user",
      }),
    ).resolves.toMatchObject({
      ok: true,
      integrity: { verified: true },
    });

    expect(Device.findOneAndUpdate).toHaveBeenCalled();
  });

  test("still requires HMAC for unverified mobile device requests when configured", async () => {
    process.env.DEVICE_HMAC_SECRET = "server-only-device-hmac-secret";
    process.env.REQUIRE_DEVICE_HMAC = "true";

    await expect(
      registerOrVerifyDevice({
        req: {
          body: { hardwareId: "mobile-hardware-device-123" },
          cookies: {},
          get: jest.fn().mockReturnValue(undefined),
        },
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
      code: "INVALID_DEVICE_SIGNATURE",
    });
  });

  test("blocks a second email account on the same website browser", async () => {
    User.findOne.mockReturnValue(userQuery({ _id: "existing-user" }));

    await expect(
      checkDeviceRegistrationAvailability({
        body: {},
        cookies: { device_id: "browser-device-123" },
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 409,
      code: "DEVICE_ALREADY_REGISTERED",
    });
    expect(User.findOne).toHaveBeenCalledWith({
      deviceId: "browser-device-123",
    });
  });

  test("treats another browser cookie as a separate website device identity", async () => {
    User.findOne.mockReturnValue(userQuery(null));

    await expect(
      checkDeviceRegistrationAvailability({
        body: {},
        cookies: { device_id: "other-browser-device-456" },
      }),
    ).resolves.toEqual({ ok: true });
    expect(User.findOne).toHaveBeenCalledWith({
      deviceId: "other-browser-device-456",
    });
  });

  test("blocks registration from another browser on the same physical device", async () => {
    const { createFingerprint } = require("../services/browserDeviceBindingService");
    const fingerprint = createFingerprint(browserDeviceSignals);
    DeviceFingerprint.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        deviceId: "original-browser-device",
        userId: "existing-user",
      }),
    });

    await expect(
      checkDeviceRegistrationAvailability({
        headers: { "x-client-platform": "website" },
        body: { browserDeviceSignals },
        cookies: { device_id: "other-browser-device" },
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 409,
      code: "DEVICE_ALREADY_REGISTERED",
    });
    expect(DeviceFingerprint.findOne).toHaveBeenCalledWith({
      browserDeviceFingerprint: fingerprint,
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test("allows registration on a device with no account", async () => {
    User.findOne.mockReturnValue(userQuery(null));

    await expect(
      checkDeviceRegistrationAvailability({
        body: {},
        cookies: { device_id: "browser-device-123" },
      }),
    ).resolves.toEqual({ ok: true });
  });

  test("uses mobile hardware ID to detect an already registered device", async () => {
    User.findOne.mockReturnValue(userQuery({ _id: "existing-user" }));

    await expect(
      checkDeviceRegistrationAvailability({
        body: { Hardware_ID: "mobile-hardware-device-123" },
        cookies: {},
      }),
    ).resolves.toMatchObject({
      ok: false,
      code: "DEVICE_ALREADY_REGISTERED",
    });
    expect(User.findOne).toHaveBeenCalledWith({
      deviceId: "mobile-hardware-device-123",
    });
  });

  test("does not block legacy clients without a recognized device ID", async () => {
    await expect(
      checkDeviceRegistrationAvailability({ body: {}, cookies: {} }),
    ).resolves.toEqual({ ok: true });
    expect(User.findOne).not.toHaveBeenCalled();
  });
});

jest.mock("../models/DeviceFingerprintModel", () => ({
  findOne: jest.fn(),
  deleteOne: jest.fn(),
  updateOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

process.env.JWT_SECRET = "test-browser-device-binding-secret";

const DeviceFingerprint = require("../models/DeviceFingerprintModel");
const {
  checkWebsiteDeviceBinding,
  claimWebsiteDeviceBinding,
  createFingerprint,
} = require("../services/browserDeviceBindingService");

const signals = {
  version: "web-v1",
  platform: "Win32",
  screenWidth: 1920,
  screenHeight: 1080,
  colorDepth: 24,
  devicePixelRatio: 1,
  hardwareConcurrency: 8,
  maxTouchPoints: 0,
  timeZone: "America/Los_Angeles",
};
const fingerprint = createFingerprint(signals);
const request = (browserDeviceSignals = signals) => ({
  headers: { "x-client-platform": "website" },
  body: { browserDeviceSignals },
});
const bindingQuery = (binding) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(binding),
});

describe("website browser device binding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("requires a well-formed browser fingerprint for website auth", async () => {
    await expect(
      checkWebsiteDeviceBinding({
        req: request({ version: "web-v1", platform: "invalid" }),
        deviceId: "browser-device-123",
        action: "register",
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 400,
      code: "BROWSER_FINGERPRINT_REQUIRED",
    });
    expect(DeviceFingerprint.findOne).not.toHaveBeenCalled();
  });

  test("allows a new device fingerprint", async () => {
    DeviceFingerprint.findOne.mockReturnValue(bindingQuery(null));

    await expect(
      checkWebsiteDeviceBinding({
        req: request(),
        deviceId: "browser-device-123",
        action: "register",
      }),
    ).resolves.toEqual({ ok: true, fingerprint });
  });

  test("blocks registration from another browser on a bound physical-device fingerprint", async () => {
    DeviceFingerprint.findOne.mockReturnValue(
      bindingQuery({ deviceId: "original-browser", userId: "user-1" }),
    );

    await expect(
      checkWebsiteDeviceBinding({
        req: request(),
        deviceId: "other-browser",
        action: "register",
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 409,
      code: "DEVICE_ALREADY_REGISTERED",
    });
  });

  test("allows authenticated login to replace the account bound to a browser", async () => {
    DeviceFingerprint.findOne.mockReturnValue(
      bindingQuery({ deviceId: "browser-device-123", userId: "user-1" }),
    );

    await expect(
      checkWebsiteDeviceBinding({
        req: request(),
        deviceId: "browser-device-123",
        userId: "user-2",
        action: "login",
      }),
    ).resolves.toEqual({ ok: true, fingerprint });
  });

  test("allows authenticated login to move a browser fingerprint to a new device ID", async () => {
    DeviceFingerprint.findOne.mockReturnValue(
      bindingQuery({ deviceId: "original-browser", userId: "user-1" }),
    );

    await expect(
      checkWebsiteDeviceBinding({
        req: request(),
        deviceId: "other-browser",
        userId: "user-1",
        action: "login",
      }),
    ).resolves.toEqual({ ok: true, fingerprint });
  });

  test("moves a verified browser binding to the current account and device", async () => {
    DeviceFingerprint.findOne.mockReturnValue(
      bindingQuery({ deviceId: "old-browser-device", userId: "user-1" }),
    );
    DeviceFingerprint.deleteOne.mockResolvedValue({});
    DeviceFingerprint.updateOne.mockResolvedValue({});
    DeviceFingerprint.findOneAndUpdate.mockResolvedValue({});

    await expect(
      claimWebsiteDeviceBinding({
        fingerprint,
        deviceId: "new-browser-device",
        userId: "user-2",
        ip: "127.0.0.1",
        userAgent: "test-agent",
      }),
    ).resolves.toEqual({
      deviceId: "old-browser-device",
      userId: "user-1",
    });

    expect(DeviceFingerprint.deleteOne).toHaveBeenCalledWith({
      userId: "user-2",
      deviceId: { $ne: "new-browser-device" },
    });
    expect(DeviceFingerprint.updateOne).toHaveBeenCalledWith(
      {
        browserDeviceFingerprint: fingerprint,
        deviceId: { $ne: "new-browser-device" },
      },
      { $unset: { browserDeviceFingerprint: 1 } },
    );
    expect(DeviceFingerprint.findOneAndUpdate).toHaveBeenCalledWith(
      { deviceId: "new-browser-device" },
      expect.objectContaining({
        $set: expect.objectContaining({
          userId: "user-2",
          browserDeviceFingerprint: fingerprint,
        }),
        $addToSet: { associatedUsers: "user-2" },
      }),
      { upsert: true, returnDocument: "after" },
    );
  });

  test("ignores browser fingerprints for Android app requests", async () => {
    await expect(
      checkWebsiteDeviceBinding({
        req: {
          headers: { "x-client-platform": "app" },
          body: {},
        },
        deviceId: "mobile-device-123",
        action: "register",
      }),
    ).resolves.toEqual({ ok: true, fingerprint: null });
    expect(DeviceFingerprint.findOne).not.toHaveBeenCalled();
  });
});

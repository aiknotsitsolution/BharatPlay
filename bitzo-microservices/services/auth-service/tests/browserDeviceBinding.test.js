jest.mock("../models/DeviceFingerprintModel", () => ({
  findOne: jest.fn(),
}));

process.env.JWT_SECRET = "test-browser-device-binding-secret";

const DeviceFingerprint = require("../models/DeviceFingerprintModel");
const {
  checkWebsiteDeviceBinding,
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

  test("blocks a different account from the already bound browser", async () => {
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
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "DEVICE_ALREADY_REGISTERED",
    });
  });

  test("blocks the same account from a different browser on the same fingerprint", async () => {
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
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "DEVICE_ALREADY_REGISTERED",
    });
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

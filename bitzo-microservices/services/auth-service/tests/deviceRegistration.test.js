jest.mock("../models/Device", () => ({}));
jest.mock("../models/PlayIntegrityToken", () => ({}));
jest.mock("../models/usermodel", () => ({
  findOne: jest.fn(),
}));
jest.mock("../services/vpn.service/fraud.service", () => ({
  logFraudEvent: jest.fn(),
}));

const User = require("../models/usermodel");
const {
  checkDeviceRegistrationAvailability,
} = require("../services/deviceSecurityService");

const userQuery = (user) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(user),
});

describe("device registration availability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

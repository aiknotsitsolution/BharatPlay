jest.mock("google-auth-library", () => ({
  GoogleAuth: jest.fn(),
}));

jest.mock("../models/PlayIntegrityToken", () => ({
  collection: { createIndex: jest.fn().mockResolvedValue("index") },
  create: jest.fn().mockResolvedValue({}),
}));

jest.mock("../models/Device", () => ({}));
jest.mock("../models/usermodel", () => ({ updateOne: jest.fn() }));
jest.mock("../services/vpn.service/fraud.service", () => ({
  logFraudEvent: jest.fn(),
}));

const { GoogleAuth } = require("google-auth-library");
const PlayIntegrityToken = require("../models/PlayIntegrityToken");
const {
  requireAndroidSignupIntegrity,
} = require("../services/deviceSecurityService");

const requestDetails = {
  requestPackageName: "com.bharatplay.app",
  nonce: "0123456789abcdef",
  timestampMillis: String(Date.now()),
};

const validPayload = {
  requestDetails,
  appIntegrity: { appRecognitionVerdict: "PLAY_RECOGNIZED" },
  deviceIntegrity: {
    deviceRecognitionVerdict: ["MEETS_DEVICE_INTEGRITY"],
  },
};

const req = (body = {}) => ({
  body: {
    integrityNonce: requestDetails.nonce,
    playIntegrityToken: "signed-integrity-token",
    ...body,
  },
});

describe("Android signup Play Integrity enforcement", () => {
  let decodedPayload;
  let requestToken;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANDROID_PACKAGE_NAME = "com.bharatplay.app";
    process.env.GOOGLE_PLAY_INTEGRITY_CREDENTIALS = "{}";
    decodedPayload = validPayload;
    requestToken = jest.fn().mockImplementation(async () => ({
      data: { tokenPayloadExternal: decodedPayload },
    }));
    GoogleAuth.mockImplementation(() => ({
      getClient: jest.fn().mockResolvedValue({ request: requestToken }),
    }));
    PlayIntegrityToken.create.mockResolvedValue({});
  });

  afterAll(() => {
    delete process.env.ANDROID_PACKAGE_NAME;
    delete process.env.GOOGLE_PLAY_INTEGRITY_CREDENTIALS;
  });

  test("requires a signed token and nonce", async () => {
    await expect(
      requireAndroidSignupIntegrity(req({ playIntegrityToken: "" })),
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "PLAY_INTEGRITY_REQUIRED",
    });
  });

  test.each([
    ["package", { requestPackageName: "com.other.app" }],
    ["nonce", { nonce: "different-nonce-1234" }],
    ["age", { timestampMillis: String(Date.now() - 3 * 60 * 1000) }],
  ])("rejects a token with an invalid %s", async (_label, requestChange) => {
    decodedPayload = {
      ...validPayload,
      requestDetails: { ...requestDetails, ...requestChange },
    };

    await expect(requireAndroidSignupIntegrity(req())).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "PLAY_INTEGRITY_REJECTED",
    });
    expect(PlayIntegrityToken.create).not.toHaveBeenCalled();
  });

  test("rejects devices without a recognized integrity verdict", async () => {
    decodedPayload = {
      ...validPayload,
      deviceIntegrity: { deviceRecognitionVerdict: [] },
    };

    await expect(requireAndroidSignupIntegrity(req())).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "PLAY_INTEGRITY_REJECTED",
    });
    expect(PlayIntegrityToken.create).not.toHaveBeenCalled();
  });

  test("accepts a fresh recognized app/device token and records it", async () => {
    await expect(requireAndroidSignupIntegrity(req())).resolves.toEqual({
      ok: true,
    });
    expect(PlayIntegrityToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      }),
    );
  });

  test("rejects replayed integrity tokens", async () => {
    PlayIntegrityToken.create.mockRejectedValue({ code: 11000 });

    await expect(requireAndroidSignupIntegrity(req())).resolves.toMatchObject({
      ok: false,
      status: 409,
      code: "PLAY_INTEGRITY_REPLAYED",
    });
  });

  test("fails closed when server verification is not configured", async () => {
    delete process.env.GOOGLE_PLAY_INTEGRITY_CREDENTIALS;

    await expect(requireAndroidSignupIntegrity(req())).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: "PLAY_INTEGRITY_UNAVAILABLE",
    });
  });
});

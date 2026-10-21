jest.mock("../models/usermodel", () => ({
  collection: { createIndex: jest.fn().mockResolvedValue("index") },
  findOne: jest.fn(),
}));

jest.mock("../services/vpn.service/vpn.service", () => ({
  detectVPN: jest.fn(),
  getClientIp: jest.fn(),
  isLocalOrPrivateIp: jest.fn(),
}));

const User = require("../models/usermodel");
const {
  detectVPN,
  getClientIp,
  isLocalOrPrivateIp,
} = require("../services/vpn.service/vpn.service");
const {
  evaluateSignupRequest,
  isSignupIpDuplicateError,
} = require("../services/signupPolicy");

const availableVpnResult = {
  ip: "8.8.8.8",
  isVPN: false,
  isProxy: false,
  isHosting: false,
};

const userQuery = (result) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

describe("strict signup IP policy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-signup-ip-secret";
    getClientIp.mockReturnValue("8.8.8.8");
    isLocalOrPrivateIp.mockReturnValue(false);
    detectVPN.mockResolvedValue(availableVpnResult);
    User.findOne.mockReturnValue(userQuery(null));
  });

  test("rejects requests without a public IP", async () => {
    getClientIp.mockReturnValue(null);

    await expect(evaluateSignupRequest({})).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "PUBLIC_IP_REQUIRED",
    });
    expect(detectVPN).not.toHaveBeenCalled();
  });

  test("fails closed when the VPN provider is unavailable", async () => {
    detectVPN.mockResolvedValue({
      ...availableVpnResult,
      message: "VPN detection API unavailable",
    });

    await expect(evaluateSignupRequest({})).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: "SIGNUP_RISK_CHECK_UNAVAILABLE",
    });
  });

  test("blocks detected VPNs, proxies, and hosting networks", async () => {
    detectVPN.mockResolvedValue({
      ...availableVpnResult,
      isHosting: true,
    });

    await expect(evaluateSignupRequest({})).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "VPN_OR_PROXY_DETECTED",
    });
  });

  test("blocks an IP already associated with an account", async () => {
    User.findOne.mockReturnValue(userQuery({ _id: "existing-user" }));

    await expect(evaluateSignupRequest({})).resolves.toMatchObject({
      ok: false,
      status: 409,
      code: "SIGNUP_IP_ALREADY_USED",
    });
  });

  test("returns a stable hash for a new, verified IP", async () => {
    await expect(evaluateSignupRequest({})).resolves.toMatchObject({
      ok: true,
      ip: "8.8.8.8",
      ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  test("identifies unique-index conflicts caused by simultaneous signups", () => {
    expect(
      isSignupIpDuplicateError({
        code: 11000,
        keyPattern: { signupIpHash: 1 },
      }),
    ).toBe(true);
    expect(isSignupIpDuplicateError({ code: 11000, keyPattern: { email: 1 } })).toBeFalsy();
  });
});

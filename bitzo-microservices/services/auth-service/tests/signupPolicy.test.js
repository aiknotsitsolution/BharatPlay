jest.mock("../models/usermodel", () => ({
  collection: {
    indexes: jest.fn().mockResolvedValue([
      {
        name: "uniq_signup_ip_hash",
        key: { signupIpHash: 1 },
        unique: true,
      },
    ]),
    dropIndex: jest.fn().mockResolvedValue("uniq_signup_ip_hash"),
  },
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
const { evaluateSignupRequest } = require("../services/signupPolicy");

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

describe("signup IP policy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
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

  test("allows localhost signup in development", async () => {
    process.env.NODE_ENV = "development";
    getClientIp.mockReturnValue("127.0.0.1");
    isLocalOrPrivateIp.mockReturnValue(true);

    await expect(evaluateSignupRequest({})).resolves.toMatchObject({
      ok: true,
      ip: null,
      ipHash: null,
      vpnInfo: null,
      skipped: true,
    });
    expect(detectVPN).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
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

  test("allows signup from an IP already used by another account", async () => {
    User.findOne.mockReturnValue(userQuery({ _id: "existing-user" }));

    const firstDevice = await evaluateSignupRequest({});
    const secondDevice = await evaluateSignupRequest({});

    expect(firstDevice).toMatchObject({ ok: true, ip: "8.8.8.8" });
    expect(secondDevice).toMatchObject({ ok: true, ip: "8.8.8.8" });
    expect(firstDevice.ipHash).toBe(secondDevice.ipHash);
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.collection.dropIndex).toHaveBeenCalledWith(
      "uniq_signup_ip_hash",
    );
  });

  test("returns a stable hash for a new, verified IP", async () => {
    await expect(evaluateSignupRequest({})).resolves.toMatchObject({
      ok: true,
      ip: "8.8.8.8",
      ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });
});

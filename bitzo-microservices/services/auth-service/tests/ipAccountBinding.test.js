jest.mock("../models/IpAccountBinding", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock("../models/usermodel", () => ({
  findOne: jest.fn(),
}));

jest.mock("../services/vpn.service/vpn.service", () => ({
  getClientIp: jest.fn(),
  isLocalOrPrivateIp: jest.fn(),
}));

const IpAccountBinding = require("../models/IpAccountBinding");
const User = require("../models/usermodel");
const {
  getClientIp,
  isLocalOrPrivateIp,
} = require("../services/vpn.service/vpn.service");
const {
  checkIpAccountBinding,
  claimIpAccountBinding,
} = require("../services/ipAccountBindingService");

const query = (result) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

describe("IP-to-account binding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    IpAccountBinding.findOne.mockReset();
    IpAccountBinding.findOne.mockReturnValue(query(null));
    IpAccountBinding.create.mockReset();
    IpAccountBinding.create.mockResolvedValue({});
    IpAccountBinding.updateOne.mockReset();
    User.findOne.mockReset();
    User.findOne.mockReturnValue(query(null));
    process.env.JWT_SECRET = "test-secret-for-ip-binding";
    process.env.NODE_ENV = "test";
    getClientIp.mockReturnValue("8.8.8.8");
    isLocalOrPrivateIp.mockReturnValue(false);
  });

  test("allows the same account on an already bound public IP", async () => {
    IpAccountBinding.findOne.mockReturnValueOnce(
      query({ userId: "user-1" }),
    );

    await expect(
      checkIpAccountBinding({}, "user-1"),
    ).resolves.toMatchObject({ ok: true, ip: "8.8.8.8" });
  });

  test("rejects another account on a bound public IP", async () => {
    IpAccountBinding.findOne.mockReturnValueOnce(
      query({ userId: "user-1" }),
    );

    await expect(
      checkIpAccountBinding({}, "user-2"),
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "IP_ACCOUNT_BINDING_VIOLATION",
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test("rejects another account when a legacy user has the public IP", async () => {
    User.findOne.mockReturnValueOnce(query({ _id: "legacy-user" }));

    await expect(
      checkIpAccountBinding({}, "new-user"),
    ).resolves.toMatchObject({
      ok: false,
      code: "IP_ACCOUNT_BINDING_VIOLATION",
    });
  });

  test("claims the public IP for the account after successful authentication", async () => {
    IpAccountBinding.create.mockResolvedValue({});

    await expect(
      claimIpAccountBinding({}, "user-1"),
    ).resolves.toEqual({ ok: true });
    expect(IpAccountBinding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        userId: "user-1",
        lastSeen: expect.any(Date),
      }),
    );
  });

  test("resolves concurrent claims without assigning the IP twice", async () => {
    IpAccountBinding.create.mockRejectedValue({ code: 11000 });
    IpAccountBinding.findOne
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query({ userId: "user-2" }));

    await expect(
      claimIpAccountBinding({}, "user-1"),
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "IP_ACCOUNT_BINDING_VIOLATION",
    });
  });

  test("binds localhost development requests to one account", async () => {
    process.env.NODE_ENV = "development";
    getClientIp.mockReturnValue("127.0.0.1");
    isLocalOrPrivateIp.mockReturnValue(true);
    const appClientRequest = {
      headers: { "x-client-platform": "app" },
    };

    await expect(
      checkIpAccountBinding(appClientRequest, "user-1"),
    ).resolves.toMatchObject({ ok: true, ip: "local-development" });
    await expect(
      claimIpAccountBinding(appClientRequest, "user-1"),
    ).resolves.toEqual({ ok: true });
    expect(IpAccountBinding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        userId: "user-1",
      }),
    );
  });

  test("blocks a second account on localhost in development", async () => {
    process.env.NODE_ENV = "development";
    getClientIp.mockReturnValue("::1");
    isLocalOrPrivateIp.mockReturnValue(true);
    IpAccountBinding.findOne.mockReturnValueOnce(
      query({ userId: "user-1" }),
    );

    await expect(
      checkIpAccountBinding({}, null),
    ).resolves.toMatchObject({
      ok: false,
      code: "IP_ACCOUNT_BINDING_VIOLATION",
    });
  });

  test("fails closed in production when a public IP cannot be verified", async () => {
    process.env.NODE_ENV = "production";
    isLocalOrPrivateIp.mockReturnValue(true);

    await expect(
      checkIpAccountBinding({}, "user-1"),
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "PUBLIC_IP_REQUIRED",
    });
    await expect(
      claimIpAccountBinding({}, "user-1"),
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "PUBLIC_IP_REQUIRED",
    });
    expect(IpAccountBinding.create).not.toHaveBeenCalled();
  });
});

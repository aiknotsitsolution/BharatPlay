jest.mock("../models/ClientHardwareBinding", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/usermodel", () => ({ findOne: jest.fn() }));

const ClientHardwareBinding = require("../models/ClientHardwareBinding");
const User = require("../models/usermodel");
const {
  checkClientHardwareBinding,
  bindClientHardwareUuid,
} = require("../services/clientHardwareBindingService");

const query = (value) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

describe("client hardware account binding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("requires a client hardware UUID", async () => {
    await expect(
      checkClientHardwareBinding({ userId: "user" }),
    ).resolves.toMatchObject({
      ok: false,
      status: 400,
      code: "INVALID_CLIENT_HARDWARE_UUID",
    });
  });

  test("rejects a UUID linked to another active account", async () => {
    ClientHardwareBinding.findOne.mockReturnValue(
      query({ userId: "active-user" }),
    );
    User.findOne.mockReturnValue(query({ _id: "active-user" }));

    await expect(
      checkClientHardwareBinding({
        clientHardwareUuid: "hardware-uuid-123",
        userId: "different-user",
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "DEVICE_BINDING_VIOLATION",
      message: "Ek phone me sirf ek hi account allowed hai",
    });
  });

  test("allows reassignment when the previous account is inactive", async () => {
    ClientHardwareBinding.findOne
      .mockReturnValueOnce(query({ userId: "inactive-user" }))
      .mockReturnValueOnce(query({ userId: "inactive-user" }));
    User.findOne.mockReturnValue(query(null));
    ClientHardwareBinding.findOneAndUpdate.mockResolvedValue({
      userId: "new-user",
    });

    await expect(
      bindClientHardwareUuid({
        clientHardwareUuid: "hardware-uuid-123",
        userId: "new-user",
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(ClientHardwareBinding.findOneAndUpdate).toHaveBeenCalledWith(
      { clientHardwareUuid: "hardware-uuid-123", userId: "inactive-user" },
      expect.objectContaining({
        $set: expect.objectContaining({ userId: "new-user" }),
      }),
      { new: true },
    );
  });

  test("fails closed when concurrent UUID claims cannot be resolved", async () => {
    ClientHardwareBinding.findOne.mockReturnValue(query(null));
    ClientHardwareBinding.create.mockRejectedValue({ code: 11000 });

    await expect(
      bindClientHardwareUuid({
        clientHardwareUuid: "hardware-uuid-123",
        userId: "new-user",
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: "DEVICE_BINDING_UNAVAILABLE",
    });
    expect(ClientHardwareBinding.create).toHaveBeenCalledTimes(3);
  });
});

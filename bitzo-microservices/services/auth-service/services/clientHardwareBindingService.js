const ClientHardwareBinding = require("../models/ClientHardwareBinding");
const User = require("../models/usermodel");

const MESSAGE = "Ek phone me sirf ek hi account allowed hai";

const invalidUuidResult = () => ({
  ok: false,
  status: 400,
  code: "INVALID_CLIENT_HARDWARE_UUID",
  message: "A valid clientHardwareUuid is required.",
});

const bindingViolation = () => ({
  ok: false,
  status: 403,
  code: "DEVICE_BINDING_VIOLATION",
  message: MESSAGE,
});

const bindingUnavailable = () => ({
  ok: false,
  status: 503,
  code: "DEVICE_BINDING_UNAVAILABLE",
  message: "Could not secure this device right now. Please try again.",
});

const normalizeUuid = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  if (normalized.length < 8 || normalized.length > 128) return undefined;
  return normalized;
};

const findActiveOwner = async (binding, userId) => {
  if (!binding?.userId || String(binding.userId) === String(userId)) {
    return null;
  }

  return User.findOne({ _id: binding.userId, status: "active" })
    .select("_id")
    .lean();
};

const checkClientHardwareBinding = async ({ clientHardwareUuid, userId }) => {
  const normalizedUuid = normalizeUuid(clientHardwareUuid);
  if (normalizedUuid === undefined) return invalidUuidResult();

  const binding = await ClientHardwareBinding.findOne({
    clientHardwareUuid: normalizedUuid,
  })
    .select("userId")
    .lean();
  const activeOwner = await findActiveOwner(binding, userId);

  if (activeOwner) return bindingViolation();
  return { ok: true, clientHardwareUuid: normalizedUuid };
};

const bindClientHardwareUuid = async ({ clientHardwareUuid, userId }) => {
  const checked = await checkClientHardwareBinding({
    clientHardwareUuid,
    userId,
  });
  if (!checked.ok || !checked.clientHardwareUuid) return checked;

  const normalizedUuid = checked.clientHardwareUuid;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const binding = await ClientHardwareBinding.findOne({
      clientHardwareUuid: normalizedUuid,
    })
      .select("userId")
      .lean();

    if (binding) {
      if (String(binding.userId) === String(userId)) {
        await ClientHardwareBinding.updateOne(
          { clientHardwareUuid: normalizedUuid, userId },
          { $set: { lastSeen: new Date() } },
        );
        return { ok: true, clientHardwareUuid: normalizedUuid };
      }

      const activeOwner = await findActiveOwner(binding, userId);
      if (activeOwner) return bindingViolation();

      const reassigned = await ClientHardwareBinding.findOneAndUpdate(
        { clientHardwareUuid: normalizedUuid, userId: binding.userId },
        { $set: { userId, lastSeen: new Date() } },
        { new: true },
      );
      if (reassigned) return { ok: true, clientHardwareUuid: normalizedUuid };
      continue;
    }

    try {
      await ClientHardwareBinding.create({
        clientHardwareUuid: normalizedUuid,
        userId,
        lastSeen: new Date(),
      });
      return { ok: true, clientHardwareUuid: normalizedUuid };
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  return bindingUnavailable();
};

module.exports = {
  checkClientHardwareBinding,
  bindClientHardwareUuid,
};

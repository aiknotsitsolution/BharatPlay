const axios = require("axios");
const User = require("../models/usermodel");
const RefreshToken = require("../models/RefreshToken");
const Device = require("../models/Device");
const ClientHardwareBinding = require("../models/ClientHardwareBinding");
const DeviceFingerprint = require("../models/DeviceFingerprintModel");
const IpAccountBinding = require("../models/IpAccountBinding");
const PhoneOtp = require("../models/PhoneOtp");
const ContactRequest = require("../models/ContactRequest");
const DeletionRequest = require("../models/DeletionRequest");
const Notification = require("../models/NotificationModel");
const AuditEvent = require("../models/AuditEvent");
const FraudEvent = require("../models/FraudEventModel");
const TrustScoreLog = require("../models/TrustScoreLog");

const deleteServiceData = async (serviceUrl, path, userId, serviceToken) => {
  const normalizedUrl = serviceUrl.replace(/\/+$/, "");
  await axios.delete(`${normalizedUrl}${path}`, {
    data: { userId: String(userId) },
    headers: { "x-internal-service-token": serviceToken },
    timeout: 120000,
  });
};

const deleteRelatedServiceData = async (userId) => {
  const serviceToken =
    process.env.INTERNAL_SERVICE_TOKEN || process.env.JWT_SECRET || "";
  if (!serviceToken) {
    throw new Error("Internal service authentication is not configured.");
  }

  await Promise.all([
    deleteServiceData(
      process.env.VIDEO_SERVICE_URL || "http://localhost:5003",
      "/api/uservideo/account-content",
      userId,
      serviceToken,
    ),
    deleteServiceData(
      process.env.PLAYER_AD_SERVICE_URL || "http://localhost:5007",
      "/v1/player/account-data",
      userId,
      serviceToken,
    ),
  ]);
};

const deleteUserAccountData = async (userId, options = {}) => {
  await deleteRelatedServiceData(userId);

  const user = await User.findById(userId).select("email phone deviceId").lean();
  const userEmail = user?.email ? String(user.email).toLowerCase() : "";
  const contactFilter = {
    $or: [
      { userId },
      ...(userEmail ? [{ email: userEmail }] : []),
    ],
  };
  const deletionFilter = {
    $or: [
      { userId },
      ...(userEmail ? [{ email: userEmail }] : []),
    ],
  };
  if (options.preserveDeletionRequestId) {
    deletionFilter._id = { $ne: options.preserveDeletionRequestId };
  }

  await Promise.all([
    RefreshToken.deleteMany({ userId }),
    Device.deleteMany({ linked_user_id: userId }),
    ClientHardwareBinding.deleteMany({ userId }),
    DeviceFingerprint.updateMany(
      { associatedUsers: userId },
      { $pull: { associatedUsers: userId } },
    ),
    DeviceFingerprint.deleteMany({ userId }),
    IpAccountBinding.deleteMany({ userId }),
    PhoneOtp.deleteMany({
      $or: [
        { userId },
        ...(userEmail ? [{ subject: userEmail }] : []),
        ...(user?.phone ? [{ subject: String(user.phone) }] : []),
      ],
    }),
    ContactRequest.deleteMany(contactFilter),
    DeletionRequest.deleteMany(deletionFilter),
    Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] }),
    AuditEvent.deleteMany({ userId }),
    FraudEvent.deleteMany({ userId }),
    TrustScoreLog.deleteMany({ userId }),
  ]);

  await User.deleteOne({ _id: userId });
};

module.exports = { deleteUserAccountData };

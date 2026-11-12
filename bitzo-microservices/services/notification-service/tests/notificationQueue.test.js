jest.mock("../models/NotificationModel", () => ({
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
}));
jest.mock("../models/usermodel", () => ({}));
jest.mock("../models/Videomodel", () => ({}));
jest.mock("../models/Channel/ChannelModel", () => ({}));
jest.mock("../services/socketService", () => ({
  emitNotificationCreated: jest.fn(),
}));
jest.mock("../../../services/Queues", () => ({
  createWorker: jest.fn(),
}));

const Notification = require("../models/NotificationModel");
const { emitNotificationCreated } = require("../services/socketService");
const { processNotificationJob } = require("../services/notificationQueue");

describe("notification BullMQ worker", () => {
  test("persists a queued notification and emits its unread count", async () => {
    const stored = { _id: "notification-id" };
    const populated = { ...stored, recipient: "recipient-id" };
    const query = {
      populate: jest.fn(),
      then: (resolve, reject) => Promise.resolve(populated).then(resolve, reject),
    };
    query.populate.mockReturnValue(query);
    Notification.findOneAndUpdate.mockResolvedValue(stored);
    Notification.findById.mockReturnValue(query);
    Notification.countDocuments.mockResolvedValue(4);

    await expect(
      processNotificationJob({
        name: "create-notification",
        data: {
          notificationId: "notification-id",
          recipient: "recipient-id",
          type: "like",
        },
      }),
    ).resolves.toEqual({ notificationId: "notification-id" });

    expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "notification-id" },
      { $setOnInsert: { recipient: "recipient-id", type: "like" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    expect(emitNotificationCreated).toHaveBeenCalledWith(
      "recipient-id",
      populated,
      4,
    );
  });
});

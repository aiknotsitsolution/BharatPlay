jest.mock("../../../services/Queues", () => ({
  enqueueNotification: jest.fn().mockResolvedValue({ id: "job-single" }),
  enqueueBulkNotifications: jest
    .fn()
    .mockResolvedValue([{ id: "job-one" }, { id: "job-two" }]),
}));

const {
  enqueueBulkNotifications,
  enqueueNotification,
} = require("../../../services/Queues");
const {
  createBulkNotifications,
  createNotification,
} = require("../utils/notificationService");

describe("notification queue producer", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    process.env.REDIS_URL = "redis://test";
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  test("queues a single notification instead of writing across services", async () => {
    await expect(
      createNotification({
        recipient: "recipient-id",
        actor: "actor-id",
        type: "like",
      }),
    ).resolves.toEqual({ queued: true, jobId: "job-single" });

    expect(enqueueNotification).toHaveBeenCalledWith({
      recipient: "recipient-id",
      actor: "actor-id",
      type: "like",
      video: null,
      channel: null,
    });
  });

  test("bulk-enqueues subscriber notifications", async () => {
    await expect(
      createBulkNotifications({
        recipients: ["first-id", "second-id"],
        actor: "actor-id",
        type: "upload",
      }),
    ).resolves.toEqual([
      { queued: true, jobId: "job-one" },
      { queued: true, jobId: "job-two" },
    ]);

    expect(enqueueBulkNotifications).toHaveBeenCalledWith([
      {
        recipient: "first-id",
        actor: "actor-id",
        type: "upload",
        video: null,
        channel: null,
      },
      {
        recipient: "second-id",
        actor: "actor-id",
        type: "upload",
        video: null,
        channel: null,
      },
    ]);
  });
});

jest.mock("./redis", () => ({
  getRedisClient: jest.fn(),
  getServiceDependency: jest.fn(),
}));

const { getRedisClient, getServiceDependency } = require("./redis");
const { enqueueNotification } = require("./Queues");

describe("BullMQ notification producer", () => {
  test("queues a notification with stable retry defaults and a Mongo-safe ID", async () => {
    const connection = { on: jest.fn() };
    const job = { id: "notification-job" };
    const queue = { add: jest.fn().mockResolvedValue(job) };
    const Queue = jest.fn(() => queue);
    getRedisClient.mockReturnValue(connection);
    getServiceDependency.mockReturnValue({ Queue });

    await expect(
      enqueueNotification({ recipient: "recipient-id", type: "like" }),
    ).resolves.toBe(job);

    const [name, data, options] = queue.add.mock.calls[0];
    expect(name).toBe("create-notification");
    expect(data.notificationId).toMatch(/^[a-f0-9]{24}$/);
    expect(options.jobId).toBe(data.notificationId);
    expect(Queue.mock.calls[0][1].connection).toBe(connection);
    expect(Queue.mock.calls[0][1].defaultJobOptions.attempts).toBe(5);
  });
});

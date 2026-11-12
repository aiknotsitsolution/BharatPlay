jest.mock("./redis", () => ({
  getRedisClient: jest.fn(),
  getServiceDependency: jest.fn(),
}));

const { getRedisClient, getServiceDependency } = require("./redis");
const { createRateLimitStore } = require("./ratelimiting");

describe("Redis rate-limit store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses Redis when configured and forwards commands", async () => {
    const redis = { call: jest.fn().mockResolvedValue("OK") };
    const RedisStore = jest.fn();
    getRedisClient.mockReturnValue(redis);
    getServiceDependency.mockReturnValue({ RedisStore });

    createRateLimitStore("auth:login:");
    const storeOptions = RedisStore.mock.calls[0][0];
    await storeOptions.sendCommand("INCR", "auth:login:client");

    expect(storeOptions.prefix).toBe("auth:login:");
    expect(redis.call).toHaveBeenCalledWith(
      "INCR",
      "auth:login:client",
    );
  });

  test("leaves the default rate-limit store when Redis is unconfigured", () => {
    getRedisClient.mockReturnValue(null);

    expect(createRateLimitStore("auth:login:")).toBeUndefined();
    expect(getServiceDependency).not.toHaveBeenCalled();
  });
});

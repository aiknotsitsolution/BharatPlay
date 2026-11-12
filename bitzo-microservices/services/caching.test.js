jest.mock("./redis", () => ({
  getRedisClient: jest.fn(),
}));

const { getRedisClient } = require("./redis");
const { cached, invalidateCache } = require("./caching");

describe("Redis cache helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns cached JSON without calling the source", async () => {
    const fetchFn = jest.fn();
    getRedisClient.mockReturnValue({
      get: jest.fn().mockResolvedValue('{"name":"Gaming"}'),
    });

    await expect(cached("categories:list", 60, fetchFn)).resolves.toEqual({
      name: "Gaming",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test("loads and stores a cache miss", async () => {
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
    };
    const value = [{ name: "Gaming" }];
    getRedisClient.mockReturnValue(redis);

    await expect(cached("categories:list", 60, async () => value)).resolves.toBe(
      value,
    );
    expect(redis.set).toHaveBeenCalledWith(
      "categories:list",
      JSON.stringify(value),
      "EX",
      60,
    );
  });

  test("bypasses Redis when no URL is configured", async () => {
    const fetchFn = jest.fn().mockResolvedValue([]);
    getRedisClient.mockReturnValue(null);

    await expect(cached("categories:list", 60, fetchFn)).resolves.toEqual([]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test("invalidates cache keys after writes", async () => {
    const redis = { del: jest.fn().mockResolvedValue(1) };
    getRedisClient.mockReturnValue(redis);

    await invalidateCache("categories:list");

    expect(redis.del).toHaveBeenCalledWith("categories:list");
  });
});

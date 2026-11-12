jest.mock("../../../services/redis", () => ({
  getRedisClient: jest.fn(),
}));

const { getRedisClient } = require("../../../services/redis");
const {
  cacheVideoCatalog,
  invalidateVideoCatalogCache,
  VIDEO_CATALOG_CACHE_TTL_SECONDS,
} = require("../utils/videoCatalogCache");

const createRedisMock = () => {
  const values = new Map();
  return {
    get: jest.fn(async (key) => values.get(key) ?? null),
    set: jest.fn(async (key, value) => {
      values.set(key, value);
      return "OK";
    }),
    incr: jest.fn(async (key) => {
      const next = Number(values.get(key) || 0) + 1;
      values.set(key, String(next));
      return next;
    }),
  };
};

describe("video catalog Redis cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("reuses query results for the same key and separates different queries", async () => {
    const redis = createRedisMock();
    getRedisClient.mockReturnValue(redis);
    const fetchVideos = jest.fn().mockResolvedValue([{ title: "Video" }]);

    await cacheVideoCatalog(
      "trending",
      { page: 1 },
      VIDEO_CATALOG_CACHE_TTL_SECONDS,
      fetchVideos,
    );
    await cacheVideoCatalog(
      "trending",
      { page: 1 },
      VIDEO_CATALOG_CACHE_TTL_SECONDS,
      fetchVideos,
    );
    await cacheVideoCatalog(
      "trending",
      { page: 2 },
      VIDEO_CATALOG_CACHE_TTL_SECONDS,
      fetchVideos,
    );

    expect(fetchVideos).toHaveBeenCalledTimes(2);
    expect(redis.set).toHaveBeenCalledTimes(2);
    const cacheKey = redis.set.mock.calls[0][0];
    expect(cacheKey).toMatch(/^video:catalog:v2:0:trending:/);
    expect(redis.set.mock.calls[0][3]).toBe(900);
  });

  test("content writes advance the cache generation", async () => {
    const redis = createRedisMock();
    getRedisClient.mockReturnValue(redis);
    const fetchVideos = jest
      .fn()
      .mockResolvedValueOnce([{ title: "Old" }])
      .mockResolvedValueOnce([{ title: "New" }]);

    await cacheVideoCatalog("latest", {}, 15, fetchVideos);
    await invalidateVideoCatalogCache();
    await expect(
      cacheVideoCatalog("latest", {}, 15, fetchVideos),
    ).resolves.toEqual([{ title: "New" }]);

    expect(fetchVideos).toHaveBeenCalledTimes(2);
    expect(redis.incr).toHaveBeenCalledWith("video:catalog:version");
  });

  test("uses the source directly when Redis is unavailable", async () => {
    getRedisClient.mockReturnValue(null);
    const fetchVideos = jest.fn().mockResolvedValue([]);

    await expect(
      cacheVideoCatalog("latest", {}, 15, fetchVideos),
    ).resolves.toEqual([]);

    expect(fetchVideos).toHaveBeenCalledTimes(1);
  });

  test("falls back to the source when Redis cannot read the cache version", async () => {
    const redis = {
      get: jest.fn().mockRejectedValue(new Error("Redis unavailable")),
    };
    getRedisClient.mockReturnValue(redis);
    const fetchVideos = jest.fn().mockResolvedValue([]);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      await expect(
        cacheVideoCatalog("latest", {}, 15, fetchVideos),
      ).resolves.toEqual([]);
      expect(fetchVideos).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});

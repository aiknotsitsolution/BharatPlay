jest.mock("../models/Videomodel", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("../models/Channel/ChannelModel", () => ({
  distinct: jest.fn(),
}));
jest.mock("../models/usermodel", () => ({
  distinct: jest.fn(),
}));
jest.mock("../models/WatchSession", () => ({}));
jest.mock("../models/CategoryModel/category.model", () => ({}));
jest.mock("../models/CategoryModel/HashtagStats", () => ({}));
jest.mock("../utils/imagekit", () => ({}));
jest.mock("../utils/mediaDuration", () => ({
  getVideoDuration: jest.fn(),
}));
jest.mock("../utils/notificationService", () => ({
  createNotification: jest.fn(),
  createBulkNotifications: jest.fn(),
}));
jest.mock("../services/auditEventService", () => ({
  logAuditEvent: jest.fn(),
}));
jest.mock("../services/trustScoreService", () => ({
  TRUST_RULES: {},
  changeTrustScore: jest.fn(),
}));
jest.mock("../services/socketService", () => ({
  emitHistoryUpdated: jest.fn(),
  emitViewCountUpdated: jest.fn(),
}));
jest.mock("../utils/videoVisibility", () => ({
  getRestrictedContentIds: jest.fn().mockResolvedValue({
    userIds: [],
    channelIds: [],
  }),
  withVisibleVideoFilter: jest.fn(async (filter = {}) => filter),
}));
jest.mock("../utils/videoCatalogCache", () => ({
  cacheVideoCatalog: jest.fn((_namespace, _key, _ttl, fetch) => fetch()),
  invalidateVideoCatalogCache: jest.fn(),
  VIDEO_CATALOG_CACHE_TTL_SECONDS: 900,
}));

const Video = require("../models/Videomodel");
const { getRestrictedContentIds } = require("../utils/videoVisibility");
const { getRelatedVideos } = require("../controller/userVideoController");

describe("related videos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads visible related videos and navigation without a server error", async () => {
    const videoId = "64b000000000000000000001";
    const currentVideo = {
      _id: videoId,
      category: null,
      channel: null,
      videoType: ["long"],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const navigationQuery = {
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    };
    Video.findOne
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(currentVideo),
      })
      .mockReturnValue(navigationQuery);
    Video.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([]),
    });

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getRelatedVideos({ params: { id: videoId } }, response);

    expect(getRestrictedContentIds).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        videos: [],
        previousVideo: null,
        nextVideo: null,
      }),
    );
  });
});

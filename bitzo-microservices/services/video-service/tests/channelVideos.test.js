jest.mock("../models/Videomodel", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));
jest.mock("../models/Channel/ChannelModel", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  distinct: jest.fn(),
}));
jest.mock("../models/usermodel", () => ({
  distinct: jest.fn(),
  findById: jest.fn(),
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
  withVisibleVideoFilter: jest.fn(async (filter) => filter),
}));
jest.mock("../utils/videoCatalogCache", () => ({
  cacheVideoCatalog: jest.fn((namespace, key, ttl, fetchFn) => fetchFn()),
  invalidateVideoCatalogCache: jest.fn(),
  VIDEO_CATALOG_CACHE_TTL_SECONDS: 900,
}));
jest.mock("../../../services/caching", () => ({
  cached: jest.fn((key, ttl, fetchFn) => fetchFn()),
  invalidateCache: jest.fn(),
}));

const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const { cacheVideoCatalog } = require("../utils/videoCatalogCache");
const {
  getChannelById,
  getvideosByChannel,
} = require("../controller/userVideoController");

describe("channel video pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns only the requested page with the total and hasMore flag", async () => {
    const channelId = "64b000000000000000000001";
    const channelQuery = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: channelId }),
    };
    const videoQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: "video-6" }]),
    };
    Channel.findOne.mockReturnValue(channelQuery);
    Video.find.mockReturnValue(videoQuery);
    Video.countDocuments.mockResolvedValue(12);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getvideosByChannel(
      { params: { id: channelId }, query: { page: "2", limit: "5" } },
      response,
    );

    expect(Video.find).toHaveBeenCalledWith({ channel: channelId });
    expect(videoQuery.skip).toHaveBeenCalledWith(5);
    expect(videoQuery.limit).toHaveBeenCalledWith(5);
    expect(cacheVideoCatalog).toHaveBeenCalledWith(
      "channel-videos",
      { channelId, page: 2, limit: 5 },
      60,
      expect.any(Function),
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        videos: [{ _id: "video-6" }],
        page: 2,
        limit: 5,
        total: 12,
        hasMore: true,
      }),
    );
  });

  test("includes processing videos in the owner's channel list only", async () => {
    const channelId = "64b000000000000000000001";
    const creatorId = "64b000000000000000000002";
    const publishedQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: "published-video" }]),
    };
    const pendingQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: "pending-video", processingStatus: "processing" },
      ]),
    };
    Channel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: channelId,
        creator: creatorId,
      }),
    });
    Video.find
      .mockReturnValueOnce(publishedQuery)
      .mockReturnValueOnce(pendingQuery);
    Video.countDocuments.mockResolvedValue(1);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getvideosByChannel(
      {
        params: { id: channelId },
        query: {},
        user: { id: creatorId },
      },
      response,
    );

    expect(Video.find).toHaveBeenNthCalledWith(2, {
      channel: channelId,
      uploadedBy: creatorId,
      processingStatus: {
        $in: ["uploading", "queued", "processing", "failed"],
      },
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        videos: [
          { _id: "pending-video", processingStatus: "processing" },
          { _id: "published-video" },
        ],
        total: 2,
      }),
    );
  });

  test("returns only active channels owned by the public channel's creator", async () => {
    const channelId = "64b000000000000000000001";
    const creatorId = "64b000000000000000000002";
    const channelQuery = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: channelId,
        creator: { _id: creatorId },
        status: "active",
      }),
    };
    const ownerChannelsQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: channelId,
          name: "Creator channel",
          subscribedBy: ["subscriber-1", "subscriber-2"],
        },
      ]),
    };
    const videosQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    Channel.findOne.mockReturnValue(channelQuery);
    Channel.find.mockReturnValue(ownerChannelsQuery);
    Video.find.mockReturnValue(videosQuery);
    Video.countDocuments.mockResolvedValue(0);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getChannelById(
      { params: { id: channelId }, query: { page: "1", limit: "20" } },
      response,
    );

    expect(Channel.find).toHaveBeenCalledWith({
      creator: creatorId,
      status: "active",
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerChannels: [
          expect.objectContaining({
            _id: channelId,
            name: "Creator channel",
            subscribersCount: 2,
          }),
        ],
      }),
    );
  });
});

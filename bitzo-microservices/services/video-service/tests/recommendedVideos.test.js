jest.mock("../models/Videomodel", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
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

const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const User = require("../models/usermodel");
const { recommendedVideos } = require("../controller/userVideoController");

describe("recommendedVideos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.distinct.mockResolvedValue([]);
    Channel.distinct.mockResolvedValue([]);
    Video.countDocuments.mockResolvedValue(25);
  });

  test.each([
    ["1", true],
    ["2", false],
  ])("returns correct pagination for page %s (hasMore: %s)", async (
    page,
    expectedHasMore,
  ) => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      then: (resolve, reject) =>
        Promise.resolve([{ _id: "video-1" }]).then(resolve, reject),
    };
    Video.find.mockReturnValue(query);

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await recommendedVideos(
      { query: { page, limit: "20" } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        page: Number(page),
        limit: 20,
        total: 25,
        hasMore: expectedHasMore,
      }),
    );
  });
});

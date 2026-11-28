jest.mock("../models/Videomodel", () => ({
  findOne: jest.fn(),
}));
jest.mock("../models/Channel/ChannelModel", () => ({}));
jest.mock("../models/CategoryModel/category.model", () => ({}));
jest.mock("../models/CategoryModel/HashtagStats", () => ({}));
jest.mock("../models/usermodel", () => ({
  findById: jest.fn(),
}));
jest.mock("../models/WatchSession", () => ({}));
jest.mock("../utils/imagekit", () => ({}));
jest.mock("../utils/mediaDuration", () => ({
  getVideoDuration: jest.fn(),
}));
jest.mock("../utils/videoCatalogCache", () => ({
  cacheVideoCatalog: jest.fn(),
  invalidateVideoCatalogCache: jest.fn(),
  VIDEO_CATALOG_CACHE_TTL_SECONDS: 900,
}));
jest.mock("../../../services/caching", () => ({
  cached: jest.fn(),
  invalidateCache: jest.fn(),
}));
jest.mock("../utils/videoVisibility", () => ({
  getRestrictedContentIds: jest.fn(),
  withVisibleVideoFilter: jest.fn(async (filter) => filter),
}));
jest.mock("../utils/notificationService", () => ({
  createNotification: jest.fn(),
  createBulkNotifications: jest.fn(),
}));
jest.mock("../services/auditEventService", () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../services/trustScoreService", () => ({
  TRUST_RULES: {},
  changeTrustScore: jest.fn(),
}));
jest.mock("../services/socketService", () => ({
  emitHistoryUpdated: jest.fn(),
  emitViewCountUpdated: jest.fn(),
}));
jest.mock("../middlewares/blazerMiddlware", () => ({
  deleteFilesFromB2: jest.fn(),
}));
jest.mock("../../../services/Queues", () => ({
  getQueue: jest.fn(),
}));

const Video = require("../models/Videomodel");
const User = require("../models/usermodel");
const { invalidateCache } = require("../../../services/caching");
const { invalidateVideoCatalogCache } = require("../utils/videoCatalogCache");
const { logAuditEvent } = require("../services/auditEventService");
const { createNotification } = require("../utils/notificationService");
const {
  addComment,
  editComment,
} = require("../controller/userVideoController");

const videoId = "64b000000000000000000001";
const commentId = "64b000000000000000000002";
const ownerId = "64b000000000000000000003";

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

describe("comment editing", () => {
  let comment;
  let video;

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ name: "Test User" }),
      }),
    });
    comment = {
      _id: commentId,
      user: ownerId,
      text: "Original text",
    };
    video = {
      comments: [comment],
      save: jest.fn().mockResolvedValue(undefined),
    };
    Video.findOne.mockResolvedValue(video);
  });

  test("returns the persisted comment ID after posting", async () => {
    const persistedComment = {
      _id: commentId,
      text: "A new comment",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      user: ownerId,
      userName: "Test User",
      userImage: null,
    };
    video.comments = [];
    video.comments.push = jest.fn((newComment) => {
      Array.prototype.push.call(video.comments, {
        ...newComment,
        _id: commentId,
        toObject: () => persistedComment,
      });
    });
    const req = {
      params: { videoId },
      user: { id: ownerId },
      body: { commentText: "A new comment" },
      headers: { "user-agent": "test-browser" },
      ip: "192.0.2.1",
    };
    const res = createResponse();

    await addComment(req, res);

    expect(video.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        comment: expect.objectContaining({
          _id: commentId,
          text: "A new comment",
        }),
      }),
    );
    expect(createNotification).toHaveBeenCalledTimes(1);
  });

  test("trims and saves an edit by the comment owner", async () => {
    const req = {
      params: { videoId, commentId },
      user: { id: ownerId },
      body: { commentText: "  Updated text  " },
      headers: { "user-agent": "test-browser" },
      ip: "192.0.2.1",
    };
    const res = createResponse();

    await editComment(req, res);

    expect(comment.text).toBe("Updated text");
    expect(video.save).toHaveBeenCalledTimes(1);
    expect(invalidateCache).toHaveBeenCalledWith(
      `video-comments:${videoId}`,
    );
    expect(invalidateVideoCatalogCache).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: ownerId,
        eventType: "COMMENT_EDIT",
        metadata: { videoId, commentId, commentLength: 12 },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        comment: expect.objectContaining({ text: "Updated text" }),
      }),
    );
  });

  test("rejects edits by a different user", async () => {
    const req = {
      params: { videoId, commentId },
      user: { id: "64b000000000000000000004" },
      body: { commentText: "Unauthorized edit" },
      headers: {},
    };
    const res = createResponse();

    await editComment(req, res);

    expect(video.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("rejects an empty edit", async () => {
    const req = {
      params: { videoId, commentId },
      user: { id: ownerId },
      body: { commentText: "   " },
      headers: {},
    };
    const res = createResponse();

    await editComment(req, res);

    expect(Video.findOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

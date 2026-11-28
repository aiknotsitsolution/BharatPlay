jest.mock("../models/Videomodel", () => ({
  findById: jest.fn(),
}));
jest.mock("../services/auditEventService", () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../../services/caching", () => ({
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  invalidateVideoCatalogCache: jest.fn().mockResolvedValue(undefined),
}));

const Video = require("../models/Videomodel");
const { logAuditEvent } = require("../services/auditEventService");
const {
  invalidateCache,
  invalidateVideoCatalogCache,
} = require("../../../services/caching");
const {
  editVideoComment,
  deleteVideoComment,
} = require("../controller/AdminController/adminCommentController");

const videoId = "64b000000000000000000001";
const commentId = "64b000000000000000000002";
const adminId = "64b000000000000000000003";
const userId = "64b000000000000000000004";

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

describe("admin comment moderation", () => {
  let comment;
  let video;

  beforeEach(() => {
    jest.clearAllMocks();
    comment = {
      _id: commentId,
      user: userId,
      text: "Original text",
    };
    video = {
      comments: [comment],
      save: jest.fn().mockResolvedValue(undefined),
    };
    Video.findById.mockResolvedValue(video);
  });

  test("allows an authorized admin to edit and invalidates comment caches", async () => {
    const req = {
      params: { videoId, commentId },
      admin: { _id: adminId },
      body: { commentText: "  Updated text  " },
      ip: "192.0.2.1",
      get: jest.fn().mockReturnValue("test-browser"),
    };
    const res = createResponse();

    await editVideoComment(req, res);

    expect(comment.text).toBe("Updated text");
    expect(video.save).toHaveBeenCalledTimes(1);
    expect(invalidateCache).toHaveBeenCalledWith(
      `video-comments:${videoId}`,
    );
    expect(invalidateVideoCatalogCache).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ADMIN_COMMENT_EDIT",
        userId,
        metadata: expect.objectContaining({ adminId, videoId, commentId }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("deletes an existing comment and invalidates comment caches", async () => {
    const req = {
      params: { videoId, commentId },
      admin: { _id: adminId },
      ip: "192.0.2.1",
      get: jest.fn().mockReturnValue("test-browser"),
    };
    const res = createResponse();

    await deleteVideoComment(req, res);

    expect(video.comments).toHaveLength(0);
    expect(video.save).toHaveBeenCalledTimes(1);
    expect(invalidateCache).toHaveBeenCalledWith(
      `video-comments:${videoId}`,
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ADMIN_COMMENT_DELETE",
        metadata: expect.objectContaining({ adminId, videoId, commentId }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("rejects blank comment edits without saving", async () => {
    const req = {
      params: { videoId, commentId },
      body: { commentText: "   " },
    };
    const res = createResponse();

    await editVideoComment(req, res);

    expect(Video.findById).not.toHaveBeenCalled();
    expect(video.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

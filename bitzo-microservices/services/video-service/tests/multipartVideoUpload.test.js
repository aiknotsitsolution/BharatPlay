const mockDeliveryClient = { send: jest.fn() };
const mockSourceClient = { send: jest.fn() };
const mockQueue = { add: jest.fn() };

jest.mock("../models/Videomodel", () => ({
  create: jest.fn(),
  deleteOne: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("../models/Channel/ChannelModel", () => ({
  findById: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("../controller/userVideoController", () => ({
  resolveCategory: jest.fn(),
}));
jest.mock("../utils/b2Storage", () => ({
  getB2Client: jest.fn(() => mockDeliveryClient),
  getB2SourceClient: jest.fn(() => mockSourceClient),
  getB2Config: jest.fn(() => ({
    bucket: "delivery-bucket",
    sourceBucket: "source-bucket",
  })),
  getPublicUrl: jest.fn((key) => `https://cdn.example/${key}`),
  getVideoSourceBucket: jest.fn(
    (video, config) => video.sourceBucket || config.bucket,
  ),
  getVideoSourceClient: jest.fn(() => mockSourceClient),
}));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));
jest.mock("../../../services/Queues", () => ({
  getQueue: jest.fn(() => mockQueue),
}));
jest.mock("../utils/videoCatalogCache", () => ({
  invalidateVideoCatalogCache: jest.fn(),
}));

const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const { getQueue } = require("../../../services/Queues");
const { resolveCategory } = require("../controller/userVideoController");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  completeMultipartUpload,
  getPartUploadUrl,
  initiateMultipartUpload,
  resumeMultipartUpload,
} = require("../controller/multipartVideoUploadController");

const userId = "64b000000000000000000001";
const channelId = "64b000000000000000000002";
const categoryId = "64b000000000000000000003";
const videoId = "64b000000000000000000004";
const replacementTargetId = "64b000000000000000000005";

function createResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe("secure B2 multipart video uploads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    process.env.REDIS_URL = "redis://127.0.0.1:6379/0";
    Channel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ creator: userId }),
    });
    resolveCategory.mockResolvedValue({
      _id: categoryId,
      isCreativeCorner: false,
    });
    Video.create.mockResolvedValue({ _id: videoId });
    Video.deleteOne.mockResolvedValue({ deletedCount: 1 });
    Channel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    mockQueue.add.mockResolvedValue({});
    mockSourceClient.send.mockResolvedValue({ UploadId: "multipart-session" });
    getSignedUrl.mockResolvedValue("https://signed.example/part");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates a private processing record and returns multipart details", async () => {
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "Test upload",
        description: "",
        category: categoryId,
        videoType: "short",
        duration: 10,
        fileName: "clip.mp4",
        contentType: "video/mp4",
        fileSize: 20 * 1024 * 1024,
        thumbnailName: "cover.jpg",
        thumbnailContentType: "image/jpeg",
        thumbnailSize: 1024,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        videoId,
        uploadId: "multipart-session",
        partSize: 16 * 1024 * 1024,
        partsCount: 2,
        thumbnailUploadUrl: "https://signed.example/part",
      }),
    );
    expect(mockSourceClient.send.mock.calls[0][0].input.Bucket).toBe(
      "source-bucket",
    );
    expect(getSignedUrl).toHaveBeenCalledWith(
      mockDeliveryClient,
      expect.objectContaining({
        input: expect.objectContaining({ Bucket: "delivery-bucket" }),
      }),
      { expiresIn: 900 },
    );
    expect(Video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "disabled",
        processingStatus: "uploading",
        sourceSize: 20 * 1024 * 1024,
        sourceBucket: "source-bucket",
      }),
    );
  });

  test("rejects files that are not in the supported video formats", async () => {
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "Unsupported",
        category: categoryId,
        videoType: "short",
        duration: 10,
        fileName: "clip.avi",
        contentType: "video/x-msvideo",
        fileSize: 1024,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSourceClient.send).not.toHaveBeenCalled();
    expect(Video.create).not.toHaveBeenCalled();
  });

  test("rejects Shorts longer than 60 seconds", async () => {
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "Too long for a Short",
        category: categoryId,
        videoType: "short",
        duration: 61,
        fileName: "clip.mp4",
        contentType: "video/mp4",
        fileSize: 1024,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSourceClient.send).not.toHaveBeenCalled();
  });

  test("allows Shorts at the 60-second limit", async () => {
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "One-minute Short",
        category: categoryId,
        videoType: "short",
        duration: 60,
        fileName: "clip.mp4",
        contentType: "video/mp4",
        fileSize: 1024,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Video.create).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 60, videoType: ["short"] }),
    );
  });

  test("allows Long videos at the five-minute limit", async () => {
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "Five-minute Long video",
        category: categoryId,
        videoType: "long",
        duration: 300,
        fileName: "clip.mp4",
        contentType: "video/mp4",
        fileSize: 1024,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockSourceClient.send).toHaveBeenCalled();
    expect(Video.create).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 300, videoType: ["long"] }),
    );
  });

  test("rejects Long videos longer than five minutes", async () => {
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "Too long",
        category: categoryId,
        videoType: "long",
        duration: 301,
        fileName: "clip.mp4",
        contentType: "video/mp4",
        fileSize: 1024,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSourceClient.send).not.toHaveBeenCalled();
  });

  test("rejects Long videos shorter than 60 seconds", async () => {
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "Too short for a Long video",
        category: categoryId,
        videoType: "long",
        duration: 59,
        fileName: "clip.mp4",
        contentType: "video/mp4",
        fileSize: 1024,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSourceClient.send).not.toHaveBeenCalled();
  });

  test("creates a replacement upload session only for the owner's existing video", async () => {
    Video.findOne.mockResolvedValue({
      _id: replacementTargetId,
      uploadedBy: userId,
      channel: channelId,
      processingStatus: "ready",
      status: "active",
    });
    const req = {
      params: { channelId },
      user: { id: userId },
      body: {
        name: "Replacement",
        description: "Updated details",
        category: categoryId,
        videoType: "short",
        duration: 10,
        fileName: "replacement.mp4",
        contentType: "video/mp4",
        fileSize: 20 * 1024 * 1024,
        replaceVideoId: replacementTargetId,
      },
    };
    const res = createResponse();

    await initiateMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        replacementFor: replacementTargetId,
        sourceKey: expect.stringMatching(
          new RegExp(
            `^Video/${userId}/${replacementTargetId}/source-[0-9a-f]{24}\\.mp4$`,
          ),
        ),
        processingStatus: "uploading",
      }),
    );
    expect(getQueue).not.toHaveBeenCalled();
  });

  test("replaces the existing video record and queues a revision-specific transcode", async () => {
    const sourceSize = 20 * 1024 * 1024;
    const replacementKey =
      `Video/${userId}/${replacementTargetId}/source-${videoId}.mp4`;
    const stagingVideo = {
      _id: videoId,
      channel: channelId,
      uploadedBy: userId,
      processingStatus: "uploading",
      sourceSize,
      sourceKey: replacementKey,
      sourceBucket: "source-bucket",
      b2UploadId: "multipart-session",
      sourceContentType: "video/mp4",
      sourceFileName: "replacement.mp4",
      replacementFor: replacementTargetId,
      thumbnailKey: null,
      thumbnailContentType: null,
      title: "Replacement title",
      description: "Replacement description",
      category: categoryId,
      videoType: ["short"],
      hashtags: ["new"],
      isCreativeCorner: false,
      duration: 12,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const targetVideo = {
      _id: replacementTargetId,
      channel: channelId,
      uploadedBy: userId,
      processingStatus: "ready",
      mediaRevision: 1,
      replacementUploadId: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    Video.findOne
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(stagingVideo),
      })
      .mockResolvedValueOnce(targetVideo);
    mockSourceClient.send.mockImplementation(async (command) => {
      if (command.constructor.name === "ListPartsCommand") {
        return {
          Parts: [
            { PartNumber: 1, ETag: '"part-1"' },
            { PartNumber: 2, ETag: '"part-2"' },
          ],
        };
      }
      if (command.constructor.name === "HeadObjectCommand") {
        return { ContentLength: sourceSize };
      }
      return {};
    });

    const req = {
      params: { channelId, videoId },
      user: { id: userId },
    };
    const res = createResponse();

    await completeMultipartUpload(req, res);

    expect(targetVideo).toMatchObject({
      processingStatus: "queued",
      mediaRevision: 2,
      replacementUploadId: videoId,
      title: "Replacement title",
      description: "Replacement description",
      sourceKey: replacementKey,
      videoType: ["short"],
    });
    expect(getQueue("video-processing").add).toHaveBeenCalledWith(
      "process-video",
      { videoId: replacementTargetId },
      { jobId: `${replacementTargetId}-revision-2` },
    );
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: replacementTargetId,
        processingStatus: "queued",
      }),
    );
  });

  test("only signs part URLs for an upload owned by the authenticated user", async () => {
    Video.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        sourceSize: 20 * 1024 * 1024,
        sourceKey: "Video/user/video/source.mp4",
        sourceBucket: "source-bucket",
        b2UploadId: "multipart-session",
      }),
    });
    const req = {
      params: { channelId, videoId },
      user: { id: userId },
      body: { partNumber: 2 },
    };
    const res = createResponse();

    await getPartUploadUrl(req, res);

    expect(Video.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadedBy: userId,
        processingStatus: "uploading",
      }),
    );
    expect(getSignedUrl).toHaveBeenCalledWith(
      mockSourceClient,
      expect.objectContaining({
        input: expect.objectContaining({ Bucket: "source-bucket" }),
      }),
      { expiresIn: 900 },
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("does not issue a part URL when the upload is not owned by the user", async () => {
    Video.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    const req = {
      params: { channelId, videoId },
      user: { id: userId },
      body: { partNumber: 1 },
    };
    const res = createResponse();

    await getPartUploadUrl(req, res);

    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns the video ID and processing state for a completed session", async () => {
    Video.findOne
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          _id: videoId,
          processingStatus: "ready",
          processingError: null,
        }),
      });
    const req = {
      params: { channelId, videoId },
      user: { id: userId },
    };
    const res = createResponse();

    await resumeMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        videoId,
        processingStatus: "ready",
        parts: [],
      }),
    );
  });

  test("reports a missing upload session as a normal resume state", async () => {
    Video.findOne
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      });
    const req = {
      params: { channelId, videoId },
      user: { id: userId },
    };
    const res = createResponse();

    await resumeMultipartUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      found: false,
      processingStatus: "missing",
      parts: [],
    });
  });
});

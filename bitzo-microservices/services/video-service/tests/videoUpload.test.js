const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const mockSourceClient = { send: jest.fn() };
const mockQueue = { add: jest.fn() };

jest.mock("../models/Videomodel", () => ({
  create: jest.fn(),
  deleteOne: jest.fn(),
}));
jest.mock("../models/usermodel", () => ({}));
jest.mock("../models/Channel/ChannelModel", () => ({
  findById: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("../models/CategoryModel/category.model", () => ({}));
jest.mock("../utils/mediaDuration", () => ({
  getVideoDuration: jest.fn(),
}));
jest.mock("../utils/b2Storage", () => ({
  getB2Client: jest.fn(() => mockSourceClient),
  getB2SourceClient: jest.fn(() => mockSourceClient),
  getB2Config: jest.fn(() => ({
    bucket: "delivery-bucket",
    sourceBucket: "source-bucket",
  })),
  getPublicUrl: jest.fn((key) => `https://cdn.example/${key}`),
  getVideoSourceBucket: jest.fn((video, config) =>
    video.sourceBucket || config.bucket,
  ),
}));
jest.mock("../../../services/Queues", () => ({
  getQueue: jest.fn(() => mockQueue),
}));
jest.mock("../controller/userVideoController", () => ({
  resolveCategory: jest.fn(),
}));
jest.mock("../utils/videoCatalogCache", () => ({
  cacheVideoCatalog: jest.fn(),
  invalidateVideoCatalogCache: jest.fn(),
  VIDEO_CATALOG_CACHE_TTL_SECONDS: 900,
}));
jest.mock("../../../services/caching", () => ({
  invalidateCache: jest.fn(),
}));

const Video = require("../models/Videomodel");
const { getVideoDuration } = require("../utils/mediaDuration");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getQueue } = require("../../../services/Queues");
const { uploadVideo } = require("../controller/videoController");

const userId = "64b000000000000000000001";
const videoId = "64b000000000000000000002";
const originalRedisUrl = process.env.REDIS_URL;

function createResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe("B2 uploads through the direct video endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REDIS_URL = "redis://127.0.0.1:6379/0";
    mockSourceClient.send.mockResolvedValue({});
    mockQueue.add.mockResolvedValue({});
    getVideoDuration.mockResolvedValue(120);
    Video.create.mockImplementation(async (data) => ({
      ...data,
      _id: videoId,
      toObject: () => ({ ...data, _id: videoId }),
    }));
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
  });

  test.each([
    ["short", 30],
    ["long", 120],
  ])("uploads %s videos to the configured B2 source bucket", async (type, duration) => {
    getVideoDuration.mockResolvedValue(duration);
    const filePath = path.join(os.tmpdir(), `bharatplay-test-${Date.now()}.mp4`);
    await fs.writeFile(filePath, "test video");
    const res = createResponse();

    await uploadVideo(
      {
        file: {
          path: filePath,
          originalname: "clip.mp4",
          size: 10,
          mimetype: "video/mp4",
        },
        body: { title: "Test video", type },
        user: { id: userId },
      },
      res,
    );

    const command = mockSourceClient.send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: "source-bucket",
      ContentLength: 10,
      ContentType: "video/mp4",
    });
    expect(Video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        videoType: [type],
        sourceBucket: "source-bucket",
        processingStatus: "queued",
        status: "disabled",
      }),
    );
    expect(getQueue).toHaveBeenCalledWith("video-processing");
    expect(mockQueue.add).toHaveBeenCalledWith(
      "process-video",
      { videoId },
      { jobId: videoId },
    );
    expect(res.status).toHaveBeenCalledWith(202);
    await expect(fs.stat(filePath)).rejects.toMatchObject({ code: "ENOENT" });
  });
});

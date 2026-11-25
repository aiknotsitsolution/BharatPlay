const mockB2Client = { send: jest.fn() };

jest.mock("../models/Videomodel", () => ({
  create: jest.fn(),
  deleteOne: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("../models/Channel/ChannelModel", () => ({
  findById: jest.fn(),
}));
jest.mock("../controller/userVideoController", () => ({
  resolveCategory: jest.fn(),
}));
jest.mock("../utils/b2Storage", () => ({
  getB2Client: jest.fn(() => mockB2Client),
  getB2Config: jest.fn(() => ({ bucket: "test-bucket" })),
  getPublicUrl: jest.fn((key) => `https://cdn.example/${key}`),
}));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));
jest.mock("../../../services/Queues", () => ({
  getQueue: jest.fn(),
}));

const Video = require("../models/Videomodel");
const Channel = require("../models/Channel/ChannelModel");
const { resolveCategory } = require("../controller/userVideoController");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  getPartUploadUrl,
  initiateMultipartUpload,
} = require("../controller/multipartVideoUploadController");

const userId = "64b000000000000000000001";
const channelId = "64b000000000000000000002";
const categoryId = "64b000000000000000000003";
const videoId = "64b000000000000000000004";

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
    mockB2Client.send.mockResolvedValue({ UploadId: "multipart-session" });
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
      }),
    );
    expect(Video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "disabled",
        processingStatus: "uploading",
        sourceSize: 20 * 1024 * 1024,
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
    expect(mockB2Client.send).not.toHaveBeenCalled();
    expect(Video.create).not.toHaveBeenCalled();
  });

  test("only signs part URLs for an upload owned by the authenticated user", async () => {
    Video.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        sourceSize: 20 * 1024 * 1024,
        sourceKey: "Video/user/video/source.mp4",
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
    expect(getSignedUrl).toHaveBeenCalled();
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
});

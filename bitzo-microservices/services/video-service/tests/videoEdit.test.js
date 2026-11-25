const mockB2Client = { send: jest.fn() };

jest.mock("../models/Videomodel", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
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
  getB2Client: jest.fn(() => mockB2Client),
  getB2Config: jest.fn(() => ({ bucket: "delivery-bucket" })),
  getPublicUrl: jest.fn((key) => `https://cdn.example/${key}`),
}));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
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
const Channel = require("../models/Channel/ChannelModel");
const { resolveCategory } = require("../controller/userVideoController");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  createVideoThumbnailUploadUrl,
  updateVideoupdated,
} = require("../controller/videoController");

const userId = "64b000000000000000000001";
const videoId = "64b000000000000000000002";
const categoryId = "64b000000000000000000003";
const nextChannelId = "64b000000000000000000004";

function createResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe("owner video editing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates all editable metadata and moves the video only to the owner's channel", async () => {
    const video = {
      _id: videoId,
      uploadedBy: userId,
      channel: "64b000000000000000000005",
      title: "Old title",
      description: "Old description",
      videoType: ["long"],
      duration: 120,
      category: "64b000000000000000000006",
      hashtags: [],
      isCreativeCorner: false,
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(() => ({ _id: videoId, title: video.title })),
    };
    Video.findById.mockResolvedValue(video);
    resolveCategory.mockResolvedValue({
      _id: categoryId,
      isCreativeCorner: false,
    });
    Channel.findById.mockReturnValue({
      select: jest
        .fn()
        .mockResolvedValue({ _id: nextChannelId, creator: userId }),
    });
    Channel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    const req = {
      params: { id: videoId },
      user: { id: userId },
      body: {
        title: "New title",
        description: "New description",
        videoType: "long",
        duration: 120,
        category: categoryId,
        hashtags: "#travel, #nature",
        isCreativeCorner: false,
        channelId: nextChannelId,
      },
      protocol: "http",
      get: () => "localhost:5003",
    };
    const res = createResponse();

    await updateVideoupdated(req, res);

    expect(video).toMatchObject({
      title: "New title",
      description: "New description",
      videoType: ["long"],
      category: categoryId,
      hashtags: ["travel", "nature"],
      channel: nextChannelId,
    });
    expect(video.save).toHaveBeenCalledTimes(1);
    expect(Channel.updateOne).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("does not issue thumbnail upload URLs for another user's video", async () => {
    Video.findOne.mockResolvedValue(null);
    const req = {
      params: { id: videoId },
      user: { id: userId },
      body: {
        contentType: "image/png",
        fileSize: 1024,
      },
    };
    const res = createResponse();

    await createVideoThumbnailUploadUrl(req, res);

    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

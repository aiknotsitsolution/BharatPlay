jest.mock("../../../services/caching", () => ({
  cached: jest.fn((key, ttl, fetchFn) => fetchFn()),
}));
jest.mock("../models/usermodel", () => ({
  distinct: jest.fn(),
}));
jest.mock("../models/Channel/ChannelModel", () => ({
  distinct: jest.fn(),
}));

const mongoose = require("mongoose");
const User = require("../models/usermodel");
const Channel = require("../models/Channel/ChannelModel");
const {
  getRestrictedContentIds,
  withVisibleVideoFilter,
} = require("../utils/videoVisibility");
const { cached } = require("../../../services/caching");

describe("public video visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("excludes disabled and banned channels from public video filters", async () => {
    User.distinct.mockResolvedValue(["64b000000000000000000001"]);
    Channel.distinct
      .mockResolvedValueOnce(["64b000000000000000000002"])
      .mockResolvedValueOnce([
        "64b000000000000000000003",
        "64b000000000000000000004",
      ]);

    await expect(
      withVisibleVideoFilter({ videoType: "short" }),
    ).resolves.toEqual({
      $and: [
        { videoType: "short" },
        { status: "active" },
        {
          uploadedBy: {
            $nin: [new mongoose.Types.ObjectId("64b000000000000000000001")],
          },
        },
        {
          creator: {
            $nin: [new mongoose.Types.ObjectId("64b000000000000000000001")],
          },
        },
        {
          channel: {
            $nin: [
              new mongoose.Types.ObjectId("64b000000000000000000002"),
              new mongoose.Types.ObjectId("64b000000000000000000003"),
              new mongoose.Types.ObjectId("64b000000000000000000004"),
            ],
          },
        },
      ],
    });

    expect(cached).toHaveBeenCalledWith(
      "video:restricted-content-ids",
      3,
      expect.any(Function),
    );
    expect(Channel.distinct).toHaveBeenNthCalledWith(2, "_id", {
      status: { $ne: "active" },
    });
  });
});

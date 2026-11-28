jest.mock("../models/Channel/ChannelModel", () => ({
  aggregate: jest.fn(),
}));
jest.mock("../models/Videomodel", () => ({
  aggregate: jest.fn(),
}));
jest.mock("../models/usermodel", () => ({
  find: jest.fn(),
}));
jest.mock("../../../services/caching", () => ({
  cached: jest.fn((_key, _ttl, fetchData) => fetchData()),
}));

const Channel = require("../models/Channel/ChannelModel");
const Video = require("../models/Videomodel");
const User = require("../models/usermodel");
const { cached } = require("../../../services/caching");
const { getLeaderboard } = require("../controller/leaderboardController");

const creatorId = "64b000000000000000000001";
const videoId = "64b000000000000000000002";
const channelId = "64b000000000000000000003";

const createUserQuery = (users) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(users),
  }),
});

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

describe("leaderboard controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns ranked creators and videos using the selected type", async () => {
    Channel.aggregate.mockResolvedValue([
      {
        _id: creatorId,
        totalSubscribers: 12,
        channels: [{ name: "Creator Channel", subs: 12 }],
      },
    ]);
    Video.aggregate.mockResolvedValue([
      {
        _id: videoId,
        title: "Short video",
        thumbnail: "uploads/thumb.jpg",
        views: 240,
        videoType: ["short"],
        channel: { _id: channelId, name: "Creator Channel", creator: creatorId },
      },
    ]);
    User.find
      .mockReturnValueOnce(
        createUserQuery([
          {
            _id: creatorId,
            name: "Creator",
            avatar: "uploads/avatar.jpg",
            rewardPoints: 35,
          },
        ]),
      )
      .mockReturnValueOnce(
        createUserQuery([{ _id: creatorId, name: "Creator" }]),
      );

    const req = { query: { videoType: "short" } };
    const res = createResponse();

    await getLeaderboard(req, res);

    expect(cached).toHaveBeenCalledWith(
      "leaderboard:short",
      60,
      expect.any(Function),
    );
    expect(Video.aggregate.mock.calls[0][0][0]).toEqual({
      $match: { videoType: "short", status: "active" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        topCreators: [
          expect.objectContaining({
            id: creatorId,
            name: "Creator",
            channelName: "Creator Channel",
            totalSubscribers: 12,
            rewardPoints: 35,
            rank: 1,
          }),
        ],
        topVideos: [
          expect.objectContaining({
            id: videoId,
            title: "Short video",
            views: 240,
            creatorName: "Creator",
            videoType: "short",
            rank: 1,
          }),
        ],
      },
    });
  });
});

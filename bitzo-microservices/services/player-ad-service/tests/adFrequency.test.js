jest.mock("../models/VidooAds/AdImpression", () => ({
  findOne: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/VidooAds/AdNetwork", () => ({
  findById: jest.fn(),
}));
jest.mock("../models/usermodel", () => ({
  findById: jest.fn(),
}));
jest.mock("../models/TrustScoreLog", () => ({}));
jest.mock("../services/trustScoreService", () => ({
  TRUST_RULES: {},
  getAdAccess: jest.fn(() => ({ ads: true })),
  changeTrustScore: jest.fn(),
}));
jest.mock("../services/waterfallService", () => ({
  getAdFromWaterfall: jest.fn(),
}));

const AdImpression = require("../models/VidooAds/AdImpression");
const User = require("../models/usermodel");
const { getAdFromWaterfall } = require("../services/waterfallService");
const { getPlayerManifest } = require("../services/playerAdController");

describe("player ad frequency cap", () => {
  test("does not return an ad when the user has played one in the last ten minutes", async () => {
    const recentImpression = { createdAt: new Date() };
    const query = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(recentImpression),
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ trustScore: 50 }),
    });
    AdImpression.findOne.mockReturnValue(query);

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await getPlayerManifest(
      { params: { video_id: "video-1" }, user: { id: "user-1" } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        adAvailable: false,
        message: "Ad frequency limit reached",
      }),
    );
    expect(getAdFromWaterfall).not.toHaveBeenCalled();
  });
});

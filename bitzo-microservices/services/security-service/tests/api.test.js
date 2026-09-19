const request = require("supertest");

jest.mock("../jobs/strikeExpiryJob.js", () => ({
  startStrikeExpiryJob: jest.fn(),
}));
jest.mock("../services/vpn.service/trustScore.job.js", () => ({
  startTrustScoreJob: jest.fn(),
}));
jest.mock("../services/vpn.service/vpn.service.js", () => ({
  detectVPN: jest.fn(),
}));

process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1/test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-secret-with-at-least-32-characters";
process.env.IMAGEKIT_PUBLIC_KEY =
  process.env.IMAGEKIT_PUBLIC_KEY || "test-public-key";
process.env.IMAGEKIT_PRIVATE_KEY =
  process.env.IMAGEKIT_PRIVATE_KEY || "test-private-key";
process.env.IMAGEKIT_URL_ENDPOINT =
  process.env.IMAGEKIT_URL_ENDPOINT || "https://example.com";

const app = require("../server");

describe("security-service API", () => {
  test("GET /health returns service health", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "security-service",
    });
  });

  test("GET / returns service metadata", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      service: "security-service",
    });
  });

  test("unknown routes return 404", async () => {
    const response = await request(app).get("/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Route not found",
    });
  });
});

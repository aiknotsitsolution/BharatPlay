const request = require("supertest");
const app = require("../server");

describe("gateway API", () => {
  test("GET /health returns gateway health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok", service: "gateway" });
  });

  test("GET / returns gateway metadata and service URLs", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true });
    expect(response.body.services).toMatchObject({
      auth: expect.any(String),
      video: expect.any(String),
      security: expect.any(String),
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

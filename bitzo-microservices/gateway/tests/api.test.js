const request = require("supertest");
process.env.CORS_ORIGINS = "https://app.example.com,https://admin.example.com";
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

  test("CORS allows configured origins and omits headers for other origins", async () => {
    const allowed = await request(app)
      .get("/health")
      .set("Origin", "https://app.example.com");
    const blocked = await request(app)
      .get("/health")
      .set("Origin", "https://untrusted.example");

    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://app.example.com",
    );
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("CORS permits credentialed JSON login preflight for configured origins", async () => {
    const response = await request(app)
      .options("/api/login")
      .set("Origin", "https://app.example.com")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://app.example.com",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
  });
});

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-secret-with-at-least-32-characters";

jest.mock("../controller/categorycontroller/catgeory.controller", () => ({
  getAllCategorys: (_req, res) => res.status(200).json([]),
  getCategoryById: (_req, res) => res.status(200).json({}),
  createCategory: (_req, res) => res.status(201).json({}),
  updateCategory: (_req, res) => res.status(200).json({}),
  deleteCategory: (_req, res) => res.status(200).json({}),
}));
jest.mock("../models/admin/AdminModel", () => ({
  findById: jest.fn().mockResolvedValue(null),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const requireAdmin = require("../middlewares/requireAdmin");
const { hasPermission } = require("../utils/adminPermissions");
const categoryRoutes = require("../routes/categoryRoute/category.route");

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res;
};

describe("category admin access", () => {
  test("allows users and admins to read categories", async () => {
    const app = express();
    app.use("/api/category", categoryRoutes);

    const userToken = jwt.sign(
      { sub: "user-123", role: "viewer" },
      process.env.JWT_SECRET,
    );
    const adminToken = jwt.sign(
      { sub: "admin-123", role: "admin" },
      process.env.JWT_SECRET,
    );

    await request(app).get("/api/category").expect(200).expect([]);
    await request(app)
      .get("/api/category")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200)
      .expect([]);
    await request(app)
      .get("/api/category")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200)
      .expect([]);
  });

  test("keeps category changes restricted to authorized admins", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/category", categoryRoutes);

    await request(app)
      .post("/api/category")
      .send({ name: "Movies" })
      .expect(401);
  });

  test("admin middleware rejects requests without an authorization header", async () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("admin middleware rejects a regular user token", async () => {
    const token = jwt.sign(
      { sub: "user-123", role: "viewer" },
      process.env.JWT_SECRET,
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("admin middleware accepts an admin token with category read permission", async () => {
    const token = jwt.sign(
      { sub: "admin-123", role: "admin" },
      process.env.JWT_SECRET,
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(req.admin).toMatchObject({ _id: "admin-123", role: "admin" });
    expect(hasPermission(req.admin.role, "settings:read")).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-secret-with-at-least-32-characters";

jest.mock("../models/admin/AdminModel", () => ({
  findById: jest.fn().mockResolvedValue(null),
}));

const jwt = require("jsonwebtoken");
const requireAdmin = require("../middlewares/requireAdmin");
const { hasPermission } = require("../utils/adminPermissions");

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
  test("requires an admin token to view category data", async () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects a regular user token", async () => {
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

  test("allows an admin token with category read permission", async () => {
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

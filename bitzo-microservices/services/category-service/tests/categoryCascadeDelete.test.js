jest.mock("../models/CategoryModel/category.model", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));
jest.mock("../models/Video", () => ({
  deleteMany: jest.fn(),
  distinct: jest.fn(),
}));
jest.mock("../../../services/caching", () => ({
  cached: jest.fn(),
  invalidateCache: jest.fn().mockResolvedValue(),
  invalidateVideoCatalogCache: jest.fn().mockResolvedValue(),
}));

const Category = require("../models/CategoryModel/category.model");
const Video = require("../models/Video");
const {
  invalidateCache,
  invalidateVideoCatalogCache,
} = require("../../../services/caching");
const { deleteCategory } = require("../controller/categorycontroller/catgeory.controller");

const createResponse = () => ({
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
});

describe("category cascade deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deletes all category videos and invalidates affected channel caches", async () => {
    const category = { _id: "category-1" };
    const req = { params: { id: category._id } };
    const res = createResponse();
    Category.findById.mockResolvedValue(category);
    Category.findByIdAndDelete.mockResolvedValue(category);
    Category.find.mockResolvedValue([]);
    Video.distinct.mockResolvedValue(["channel-1", "channel-2"]);
    Video.deleteMany.mockResolvedValue({ deletedCount: 3 });

    await deleteCategory(req, res);

    expect(Video.distinct).toHaveBeenCalledWith("channel", {
      category: category._id,
    });
    expect(Video.deleteMany).toHaveBeenCalledWith({ category: category._id });
    expect(
      Video.deleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(Category.findByIdAndDelete.mock.invocationCallOrder[0]);
    expect(invalidateVideoCatalogCache).toHaveBeenCalledTimes(1);
    expect(invalidateCache).toHaveBeenCalledWith("channel-page:channel-1");
    expect(invalidateCache).toHaveBeenCalledWith("channel-videos:channel-2");
    expect(res.statusCode).toBe(200);
    expect(res.body.deletedVideoCount).toBe(3);
  });

  test("does not delete videos when the category does not exist", async () => {
    const res = createResponse();
    Category.findById.mockResolvedValue(null);

    await deleteCategory({ params: { id: "missing-category" } }, res);

    expect(res.statusCode).toBe(404);
    expect(Video.deleteMany).not.toHaveBeenCalled();
    expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
  });

  test("does not remove the category if deleting its videos fails", async () => {
    const res = createResponse();
    Category.findById.mockResolvedValue({ _id: "category-1" });
    Video.distinct.mockResolvedValue([]);
    Video.deleteMany.mockRejectedValue(new Error("Database unavailable"));

    await deleteCategory({ params: { id: "category-1" } }, res);

    expect(res.statusCode).toBe(500);
    expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
  });
});

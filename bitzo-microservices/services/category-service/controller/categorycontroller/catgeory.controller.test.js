jest.mock("../../models/CategoryModel/category.model", () =>
  jest.fn().mockImplementation(function (values) {
    Object.assign(this, values);
    this.save = jest.fn().mockResolvedValue(this);
  }),
);

const Category = require("../../models/CategoryModel/category.model");
const { createCategory } = require("./catgeory.controller");

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("createCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a category and derives its slug from the name", async () => {
    const response = createResponse();

    await createCategory({ body: { name: "  Tech & Design  " } }, response);

    expect(Category).toHaveBeenCalledWith({
      name: "Tech & Design",
      slug: "tech-design",
    });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  test("rejects a missing category name", async () => {
    const response = createResponse();

    await createCategory({ body: {} }, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(Category).not.toHaveBeenCalled();
  });

  test("returns conflict when category name already exists", async () => {
    Category.mockImplementationOnce(function () {
      this.save = jest.fn().mockRejectedValue({ code: 11000 });
    });
    const response = createResponse();

    await createCategory({ body: { name: "Gaming" } }, response);

    expect(response.status).toHaveBeenCalledWith(409);
  });
});

const Category = require("../../models/CategoryModel/category.model");
// Get all Categorys
const getAllCategorys = async (req, res) => {
  try {
    const Categorys = await Category.find();
    res.status(200).json(Categorys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single Category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new Category
const createCategory = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const slug = name
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");

    if (!name || !slug) {
      return res
        .status(400)
        .json({ error: "A valid category name is required" });
    }

    const newCategory = new Category({ name, slug });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "A category with this name already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update a Category
const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true },
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    const Categorys = await Category.find();
    res
      .status(200)
      .json({ message: "Category deleted successfully", data: Categorys });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Category
const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    const Categorys = await Category.find();
    res
      .status(200)
      .json({ message: "Category deleted successfully", data: Categorys });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCategorys,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

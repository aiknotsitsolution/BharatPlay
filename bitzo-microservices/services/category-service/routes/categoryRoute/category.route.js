const express = require("express");
const {
  getAllCategorys,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../../controller/categorycontroller/catgeory.controller");
const requireAdmin = require("../../middlewares/requireAdmin");
const { requirePermission } = require("../../middlewares/checkAdminPermission");

const router = express.Router();

router.get("/", getAllCategorys);
router.get("/:id", getCategoryById);
router.post("/", requireAdmin, requirePermission("settings:write"), createCategory);
router.put("/:id", requireAdmin, requirePermission("settings:write"), updateCategory);
router.delete("/:id", requireAdmin, requirePermission("settings:write"), deleteCategory);

module.exports = router;

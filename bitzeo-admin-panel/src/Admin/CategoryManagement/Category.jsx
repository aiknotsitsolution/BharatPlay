

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FolderTree,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  addCategory,
  deleteCategory,
  fetchcategory,
  updateCategory,
  fetchCreativeCornerHashtagStats,
} from "../../api.js";
import PageHeader from "../../components/layout/PageHeader";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hashtagStats, setHashtagStats] = useState([]);
  const [hashtagLoading, setHashtagLoading] = useState(true);

  const toastStyle = {
    style: {
      background: "#fff",
      color: "#1e293b",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
      fontSize: "13px",
    },
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await fetchcategory();
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.categories)
            ? response.data.categories
            : [];
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        toast.error("Failed to load categories", toastStyle);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const loadHashtagStats = async () => {
    setHashtagLoading(true);
    try {
      const response = await fetchCreativeCornerHashtagStats();
      setHashtagStats(response?.data?.data || []);
    } catch (err) {
      console.error("Error fetching hashtag stats:", err);
      toast.error("Failed to load hashtag statistics", toastStyle);
    } finally {
      setHashtagLoading(false);
    }
  };

  useEffect(() => {
    loadHashtagStats();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name", toastStyle);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await addCategory(newCategory.trim());
      const created = response?.data;
      if (created) {
        setCategories((prev) => [...prev, created]);
        setNewCategory("");
        toast.success("Category added successfully!", toastStyle);
      }
    } catch (err) {
      console.error("Error adding category:", err);
      toast.error(
        err?.response?.data?.message || "Failed to add category",
        toastStyle
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category._id);
    setEditName(category.name);
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      toast.error("Category name cannot be empty", toastStyle);
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCategory(id, editName.trim());
      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === id ? { ...cat, name: editName.trim() } : cat
        )
      );
      setEditingCategory(null);
      setEditName("");
      toast.success("Category updated successfully!", toastStyle);
    } catch (err) {
      console.error("Error updating category:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update category",
        toastStyle
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      toast.success("Category deleted successfully!", toastStyle);
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error(
        err?.response?.data?.message || "Failed to delete category",
        toastStyle
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        subtitle="Manage all your product categories"
      />

      {/* Add New Category */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-[16px] font-semibold text-slate-800 mb-4">
          Add New Category
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="Enter category name..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                     focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                     text-slate-800 text-sm placeholder:text-slate-400 transition-all"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim() || isSubmitting}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl
                     flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-[16px] font-semibold text-slate-800 mb-5">
          All Categories
          <span className="ml-2 text-[13px] font-medium text-slate-400">
            ({categories.length})
          </span>
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
            <p className="text-[13px] text-slate-500">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <FolderTree size={28} className="text-slate-300" />
            </div>
            <p className="text-[15px] font-medium text-slate-600">No categories found</p>
            <p className="text-[13px] text-slate-400 mt-1">
              Start by adding a new category above
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categories.map((category) => (
                  <tr
                    key={category._id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      {editingCategory === category._id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveEdit(category._id)
                          }
                          autoFocus
                          className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl
                                   focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                                   text-slate-800 text-sm transition-all"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FolderTree size={16} />
                          </div>
                          <span className="text-[14px] font-medium text-slate-800">
                            {category.name}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {editingCategory === category._id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(category._id)}
                              disabled={isSubmitting}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save size={17} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCategory(null);
                                setEditName("");
                              }}
                              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={17} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={17} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creative Corner Hashtags */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-800">
              Creative Corner Hashtags
            </h2>
            <p className="text-[13px] text-slate-400 mt-0.5">
              Track hashtag usage and progress toward category graduation.
            </p>
          </div>
          <button
            onClick={loadHashtagStats}
            disabled={hashtagLoading}
            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-50 transition-colors"
            title="Refresh hashtag statistics"
          >
            <RefreshCw
              size={18}
              className={hashtagLoading ? "animate-spin" : ""}
            />
          </button>
        </div>

        {hashtagLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : hashtagStats.length === 0 ? (
          <p className="text-[13px] text-slate-400 py-10 text-center">
            No Creative Corner hashtags found yet.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Hashtag
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Last 15 Days
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Threshold
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {hashtagStats.map((stat) => (
                  <tr
                    key={stat._id || stat.hashtag}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      #{stat.hashtag}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-700">
                      {stat.videoCount || 0}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-700">
                      {stat.last15DaysCount || 0}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500">
                      {stat.threshold}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500">
                      {stat.remaining}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          stat.isFlagged
                            ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {stat.isFlagged ? "Flagged" : "Tracking"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
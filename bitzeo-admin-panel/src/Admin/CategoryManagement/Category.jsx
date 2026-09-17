import { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FolderTree,
  Loader2,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  addCategory,
  deleteCategory,
  fetchcategory,
  updateCategory,
} from "../../api.js"

const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState("")
  const [editingCategory, setEditingCategory] = useState(null)
  const [editName, setEditName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toast style (theme-aware)
  const toastStyle = {
    style: {
      background: "var(--bp-card)",
      color: "var(--bp-text)",
      border: "1px solid var(--bp-border)",
      borderRadius: "12px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
      fontSize: "13px",
    },
  }

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const response = await fetchcategory()
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.categories)
          ? response.data.categories
          : []

        setCategories(data)
      } catch (err) {
        console.error("Error fetching categories:", err)
        toast.error("Failed to load categories", toastStyle)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name", toastStyle)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await addCategory(newCategory.trim())
      const created = response?.data

      if (created) {
        setCategories((prev) => [...prev, created])
        setNewCategory("")
        toast.success("Category added successfully!", toastStyle)
      }
    } catch (err) {
      console.error("Error adding category:", err)
      toast.error(err?.response?.data?.message || "Failed to add category", toastStyle)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Start editing
  const handleEditCategory = (category) => {
    setEditingCategory(category._id)
    setEditName(category.name)
  }

  // Save edited category
  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      toast.error("Category name cannot be empty", toastStyle)
      return
    }

    setIsSubmitting(true)
    try {
      await updateCategory(id, editName.trim())

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === id ? { ...cat, name: editName.trim() } : cat
        )
      )

      setEditingCategory(null)
      setEditName("")
      toast.success("Category updated successfully!", toastStyle)
    } catch (err) {
      console.error("Error updating category:", err)
      toast.error(err?.response?.data?.message || "Failed to update category", toastStyle)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return

    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((cat) => cat._id !== id))
      toast.success("Category deleted successfully!", toastStyle)
    } catch (err) {
      console.error("Error deleting category:", err)
      toast.error(err?.response?.data?.message || "Failed to delete category", toastStyle)
    }
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-bp-text">
              Category Management
            </h1>
            <p className="text-[13px] text-bp-text-secondary mt-1">
              Manage all your product categories
            </p>
          </div>
        </div>

        {/* Add New Category */}
        <div className="bp-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-bp-text">
            Add New Category
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Enter category name..."
              className="flex-1 px-4 py-3 bg-bp-surface/60 border border-bp-border/50 rounded-xl
                       focus:outline-none focus:border-bp-blue/40 focus:ring-2 focus:ring-bp-blue/30 hover:border-bp-border
                       text-bp-text text-sm placeholder:text-bp-text-muted transition-colors duration-200"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || isSubmitting}
              className="px-6 py-3 bg-bp-blue hover:bg-bp-blue/90 text-white text-sm font-semibold rounded-xl flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
        <div className="bp-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-bp-text">
            All Categories ({categories.length})
          </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={36} className="animate-spin text-bp-blue mb-4" />
                <p className="text-bp-text-secondary">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 text-bp-text-muted">
                <FolderTree size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-lg text-bp-text-secondary">No categories found</p>
                <p className="text-sm mt-2">Start by adding a new category above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="bg-bp-surface/70 border-b border-bp-border">
                      <th className="px-5 py-3 text-left text-xs font-medium text-bp-text-muted uppercase tracking-wider">
                        Category Name
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-bp-text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bp-border/60">
                    {categories.map((category) => (
                      <tr
                        key={category._id}
                        className="hover:bg-bp-surface/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          {editingCategory === category._id ? (
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleSaveEdit(category._id)
                              }
                              autoFocus
                              className="w-full px-3 py-2 bg-bp-surface/60 border border-bp-border/50 rounded-xl
                                       focus:outline-none focus:border-bp-blue/40 focus:ring-2 focus:ring-bp-blue/30 hover:border-bp-border
                                       text-bp-text text-sm transition-colors duration-200"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-bp-blue/10 text-bp-blue flex items-center justify-center shrink-0">
                                <FolderTree size={16} />
                              </div>
                              <span className="text-bp-text font-medium">
                                {category.name}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {editingCategory === category._id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(category._id)}
                                  disabled={isSubmitting}
                                  className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  title="Save"
                                >
                                  <Save size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCategory(null)
                                    setEditName("")
                                  }}
                                  className="p-2 text-bp-text-secondary hover:bg-bp-border rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="p-2 text-bp-blue hover:bg-bp-blue/10 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
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
      </div>
    </div>
  )
}

export default CategoryManagement
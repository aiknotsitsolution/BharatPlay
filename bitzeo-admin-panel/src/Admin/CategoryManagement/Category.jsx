

// "use client"

// import { useState, useEffect } from "react"
// import { 
//   Plus, 
//   Edit, 
//   Trash2, 
//   Save, 
//   X, 
//   FolderTree, 
//   Loader2 
// } from "lucide-react"
// import {
//   addCategory,
//   deleteCategory,
//   fetchcategory,
//   updateCategory,
// } from "../../api.js"

// const CategoryManagement = () => {
//   const [categories, setCategories] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)
//   const [newCategory, setNewCategory] = useState("")
//   const [editingCategory, setEditingCategory] = useState(null)
//   const [editName, setEditName] = useState("")

//   // Fetch all categories
//   useEffect(() => {
//     const fetchCategories = async () => {
//       setLoading(true)
//       try {
//         const response = await fetchcategory()
//         const data = Array.isArray(response?.data)
//           ? response.data
//           : Array.isArray(response?.data?.categories)
//           ? response.data.categories
//           : []
        
//         setCategories(data)
//       } catch (err) {
//         console.error("Error fetching categories:", err)
//         setError("Failed to load categories")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchCategories()
//   }, [])

//   // Add new category
//   const handleAddCategory = async () => {
//     if (!newCategory.trim()) return

//     try {
//       const response = await addCategory(newCategory.trim())
//       const created = response?.data

//       if (created) {
//         setCategories(prev => [...prev, created])
//         setNewCategory("")
//       }
//     } catch (err) {
//       console.error("Error adding category:", err)
//       setError("Failed to add category")
//     }
//   }

//   // Start editing
//   const handleEditCategory = (category) => {
//     setEditingCategory(category._id)
//     setEditName(category.name)
//   }

//   // Save edited category
//   const handleSaveEdit = async (id) => {
//     if (!editName.trim()) return

//     try {
//       await updateCategory(id, editName.trim())

//       setCategories(prev =>
//         prev.map(cat =>
//           cat._id === id ? { ...cat, name: editName.trim() } : cat
//         )
//       )

//       setEditingCategory(null)
//       setEditName("")
//     } catch (err) {
//       console.error("Error updating category:", err)
//       setError("Failed to update category")
//     }
//   }

//   // Delete category
//   const handleDeleteCategory = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this category?")) return

//     try {
//       await deleteCategory(id)
//       setCategories(prev => prev.filter(cat => cat._id !== id))
//     } catch (err) {
//       console.error("Error deleting category:", err)
//       setError("Failed to delete category")
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center gap-3">
//             <div className="p-3 bg-indigo-100 rounded-xl">
//               <FolderTree className="text-indigo-600" size={28} />
//             </div>
//             <h1 className="text-2xl font-bold tracking-tight text-gray-900">
//               Category Management
//             </h1>
//           </div>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
//             <span className="font-medium">{error}</span>
//           </div>
//         )}

//         <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

//           {/* Add New Category Section */}
//           <div className="p-6 border-b border-gray-200">
//             <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Category</h2>
            
//             <div className="flex gap-3">
//               <input
//                 type="text"
//                 value={newCategory}
//                 onChange={(e) => setNewCategory(e.target.value)}
//                 placeholder="Enter category name..."
//                 className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl 
//                          focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50
//                          text-gray-900 placeholder-gray-500 transition-all"
//               />
//               <button
//                 onClick={handleAddCategory}
//                 disabled={!newCategory.trim() || loading}
//                 className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 
//                          text-white font-medium rounded-xl flex items-center gap-2 
//                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
//               >
//                 {loading ? (
//                   <Loader2 size={18} className="animate-spin" />
//                 ) : (
//                   <Plus size={18} />
//                 )}
//                 Add Category
//               </button>
//             </div>
//           </div>

//           {/* Categories List */}
//           <div className="p-6">
//             <h2 className="text-lg font-semibold mb-4 text-gray-800">All Categories</h2>

//             {loading ? (
//               <div className="flex flex-col items-center justify-center py-12">
//                 <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
//                 <p className="text-gray-600">Loading categories...</p>
//               </div>
//             ) : categories.length === 0 ? (
//               <div className="text-center py-12 text-gray-500">
//                 <p className="text-lg">No categories found</p>
//                 <p className="text-sm mt-2">Start by adding a new category above</p>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 {categories.map((category) => (
//                   <div
//                     key={category._id}
//                     className="flex items-center justify-between px-5 py-4 
//                              bg-white hover:bg-gray-50 border border-gray-200 
//                              rounded-xl transition-all duration-200 shadow-sm hover:shadow"
//                   >
//                     {editingCategory === category._id ? (
//                       <input
//                         value={editName}
//                         onChange={(e) => setEditName(e.target.value)}
//                         autoFocus
//                         className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg
//                                  focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50
//                                  text-gray-900"
//                       />
//                     ) : (
//                       <div className="text-gray-800 font-medium">{category.name}</div>
//                     )}

//                     <div className="flex items-center gap-2">
//                       {editingCategory === category._id ? (
//                         <>
//                           <button
//                             onClick={() => handleSaveEdit(category._id)}
//                             className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                             title="Save"
//                           >
//                             <Save size={18} />
//                           </button>
//                           <button
//                             onClick={() => {
//                               setEditingCategory(null)
//                               setEditName("")
//                             }}
//                             className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
//                             title="Cancel"
//                           >
//                             <X size={18} />
//                           </button>
//                         </>
//                       ) : (
//                         <>
//                           <button
//                             onClick={() => handleEditCategory(category)}
//                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                             title="Edit"
//                           >
//                             <Edit size={18} />
//                           </button>
//                           <button
//                             onClick={() => handleDeleteCategory(category._id)}
//                             className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                             title="Delete"
//                           >
//                             <Trash2 size={18} />
//                           </button>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default CategoryManagement

"use client"

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

  // Toast style (dark)
  const toastStyle = {
    style: {
      background: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #374151",
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/15 rounded-xl border border-indigo-500/20">
              <FolderTree className="text-indigo-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Category Management
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Manage all your product categories
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Add New Category Section */}
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              Add New Category
            </h2>

            <div className="flex gap-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="Enter category name..."
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl 
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                         text-gray-100 placeholder-gray-500 transition-all"
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.trim() || isSubmitting}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 
                         text-white font-medium rounded-xl flex items-center gap-2 
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

          {/* Categories List */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              All Categories ({categories.length})
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={36} className="animate-spin text-indigo-400 mb-4" />
                <p className="text-gray-400">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FolderTree size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-lg text-gray-400">No categories found</p>
                <p className="text-sm mt-2">Start by adding a new category above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="flex items-center justify-between px-5 py-4 
                             bg-gray-800/50 hover:bg-gray-800 border border-gray-700/70 
                             rounded-xl transition-all duration-200"
                  >
                    {editingCategory === category._id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveEdit(category._id)
                        }
                        autoFocus
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg
                                 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                                 text-gray-100"
                      />
                    ) : (
                      <div className="text-gray-200 font-medium">{category.name}</div>
                    )}

                    <div className="flex items-center gap-1.5 ml-4">
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
                            className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryManagement
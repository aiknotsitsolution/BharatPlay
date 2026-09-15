import { Search, Plus, Edit, Trash2, MoreVertical } from 'lucide-react'
import { hasFeature } from "../../config/roleConfig";

const fakeProducts = [
  { id: 1, name: "Wireless Earbuds Pro", category: "Electronics", price: "₹2,499", stock: 84, status: "Active" },
  { id: 2, name: "Cotton Oversized T-Shirt", category: "Clothing", price: "₹799", stock: 42, status: "Active" },
  { id: 3, name: "Smart Watch Series 8", category: "Wearables", price: "₹12,999", stock: 19, status: "Low Stock" },
  { id: 4, name: "Stainless Steel Water Bottle", category: "Accessories", price: "₹649", stock: 0, status: "Out of Stock" },
  { id: 5, name: "Yoga Mat Premium", category: "Fitness", price: "₹1,299", stock: 67, status: "Active" },
]

export default function Products() {
  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          
          {hasFeature("canManageProducts") && (
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fakeProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
            <div className="h-48 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
              <span className="text-6xl opacity-30">📦</span>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{product.category}</p>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-indigo-700">{product.price}</span>
                <span className={`text-sm px-2.5 py-1 rounded-full ${
                  product.status === 'Active' ? 'bg-green-100 text-green-800' :
                  product.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.status} • {product.stock}
                </span>
              </div>

              <div className="flex gap-2">
                {hasFeature("canManageProducts") && (
                  <button className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">
                    Edit
                  </button>
                )}
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
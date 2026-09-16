import { Search, Plus, Edit, Trash2, MoreVertical } from 'lucide-react'
import { hasFeature } from "../../config/roleConfig";

const fakeProducts = [
  { id: 1, name: "Wireless Earbuds Pro", category: "Electronics", price: "₹2,499", stock: 84, status: "Active" },
  { id: 2, name: "Cotton Oversized T-Shirt", category: "Clothing", price: "₹799", stock: 42, status: "Active" },
  { id: 3, name: "Smart Watch Series 8", category: "Wearables", price: "₹12,999", stock: 19, status: "Low Stock" },
  { id: 4, name: "Stainless Steel Water Bottle", category: "Accessories", price: "₹649", stock: 0, status: "Out of Stock" },
  { id: 5, name: "Yoga Mat Premium", category: "Fitness", price: "₹1,299", stock: 67, status: "Active" },
]

const statusStyles = {
  Active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Low Stock": "bg-bp-yellow/15 text-bp-yellow border border-bp-yellow/20",
  "Out of Stock": "bg-red-500/15 text-red-400 border border-red-500/20",
}

export default function Products() {
  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-bp-text">Products</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="pl-9 pr-4 py-2 bg-bp-surface/60 border border-bp-border/50 rounded-xl text-sm text-bp-text placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border transition-colors duration-200 w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bp-text-muted pointer-events-none" />
          </div>
          
          {hasFeature("canManageProducts") && (
            <button className="flex items-center gap-2 px-4 py-2 bg-bp-blue text-white rounded-lg hover:bg-bp-blue/90 transition-colors">
              <Plus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fakeProducts.map(product => (
          <div key={product.id} className="bg-bp-card rounded-xl border border-bp-border overflow-hidden hover:border-bp-elevated transition-all">
            <div className="h-48 bg-gradient-to-br from-bp-elevated to-bp-surface flex items-center justify-center">
              <span className="text-6xl opacity-30">📦</span>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-bp-text">{product.name}</h3>
              <p className="text-sm text-bp-text-muted mb-3">{product.category}</p>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-bp-blue">{product.price}</span>
                <span className={`text-sm px-2.5 py-1 rounded-full ${statusStyles[product.status] || statusStyles.Active}`}>
                  {product.status} • {product.stock}
                </span>
              </div>

              <div className="flex gap-2">
                {hasFeature("canManageProducts") && (
                  <button className="flex-1 py-2 bg-bp-elevated text-bp-text-secondary rounded-lg hover:bg-bp-border transition-colors">
                    Edit
                  </button>
                )}
                <button className="p-2 text-bp-text-muted hover:text-bp-text rounded-lg hover:bg-bp-elevated transition-colors">
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

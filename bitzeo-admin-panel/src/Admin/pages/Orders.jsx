import { Search, Eye, MoreVertical } from 'lucide-react'

const fakeOrders = [
  { id: "ORD-7842", customer: "Aarav Sharma", date: "Jul 10, 2025", status: "Delivered", total: "₹2,899" },
  { id: "ORD-7841", customer: "Priya Patel", date: "Jul 9, 2025", status: "Processing", total: "₹1,499" },
  { id: "ORD-7840", customer: "Rahul Verma", date: "Jul 8, 2025", status: "Pending", total: "₹4,299" },
  { id: "ORD-7839", customer: "Sneha Gupta", date: "Jul 7, 2025", status: "Cancelled", total: "₹799" },
  { id: "ORD-7838", customer: "Vikram Singh", date: "Jul 6, 2025", status: "Shipped", total: "₹3,199" },
]

const statusStyles = {
  Delivered: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  Shipped: "bg-bp-blue/15 text-bp-blue border border-bp-blue/20",
  Processing: "bg-bp-yellow/15 text-bp-yellow border border-bp-yellow/20",
  Pending: "bg-bp-orange/15 text-bp-orange border border-bp-orange/20",
  Cancelled: "bg-red-500/15 text-red-400 border border-red-500/20",
}

export default function Orders() {
  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-bp-text">Orders</h1>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search orders..."
            className="pl-9 pr-4 py-2 bg-bp-surface/60 border border-bp-border/50 rounded-xl text-sm text-bp-text placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border transition-colors duration-200 w-full"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bp-text-muted pointer-events-none" />
        </div>
      </div>

      <div className="bg-bp-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-bp-border">
            <thead className="bg-bp-surface">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-muted uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-muted uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-muted uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-muted uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-bp-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bp-border">
              {fakeOrders.map(order => (
                <tr key={order.id} className="hover:bg-bp-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-bp-blue">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-bp-text">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-bp-text-muted">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[order.status] || statusStyles.Pending}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-bp-text">{order.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-bp-blue hover:text-bp-cyan transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-1 text-bp-text-muted hover:text-bp-text transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

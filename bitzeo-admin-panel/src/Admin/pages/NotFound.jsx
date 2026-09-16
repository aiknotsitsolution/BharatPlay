import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="w-20 h-20 text-bp-orange mb-6" />
      
      <h1 className="text-7xl font-bold text-bp-text-muted mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-white mb-4">Page Not Found</h2>
      
      <p className="text-bp-text-secondary max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-bp-blue to-bp-cyan text-white rounded-lg hover:from-bp-cyan hover:to-bp-blue transition-all"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-bp-elevated border border-bp-border flex items-center justify-center mb-6">
        <AlertTriangle className="w-9 h-9 text-bp-text-muted" />
      </div>

      <h1 className="text-6xl font-bold text-bp-text-muted mb-3 tracking-tight">404</h1>
      <h2 className="text-2xl font-semibold text-bp-text mb-4">Page Not Found</h2>

      <p className="text-bp-text-secondary max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-bp-blue text-white rounded-lg hover:bg-bp-blue/90 transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
    </div>
  )
}
export default function LoadingSpinner({ className = "", label = "Loading" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${className}`}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/90" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function PageHeader({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-bp-border/60 bg-bp-card/40 px-5 py-5 ${className}`}
    >
      <div className="pointer-events-none absolute -top-20 -left-16 h-44 w-72 rounded-full bg-bp-blue/10 blur-3xl transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-40 w-56 rounded-full bg-bp-cyan/10 blur-3xl transition-opacity duration-500 opacity-30 group-hover:opacity-70" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-bp-text transition-transform duration-300 group-hover:-translate-y-0.5">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-bp-text-secondary mt-2 transition-colors duration-300">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="relative flex flex-wrap items-center gap-3 shrink-0">{children}</div>
        )}
      </div>
    </div>
  );
}
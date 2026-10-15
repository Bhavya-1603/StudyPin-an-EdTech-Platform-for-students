export function Card({ title, value, description, icon, trend, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200/85 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        {title && <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>}
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      {value && <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>}
      {trend && <p className="mt-1 text-xs font-medium text-emerald-600">{trend}</p>}
      {description && <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{description}</p>}
      {children}
    </div>
  )
}

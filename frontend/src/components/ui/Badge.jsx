export function Badge({ label, variant = 'neutral', className = '' }) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    primary: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${variants[variant] || variants.neutral} ${className}`}>
      {label}
    </span>
  )
}

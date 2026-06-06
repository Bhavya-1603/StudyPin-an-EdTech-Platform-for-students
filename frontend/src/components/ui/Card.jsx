export function Card({ title, value, description, children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-glow ${className}`}>
      {title && <p className="text-sm uppercase tracking-[0.26em] text-sky-300">{title}</p>}
      {value && <p className="mt-3 text-3xl font-semibold text-white">{value}</p>}
      {description && <p className="mt-2 text-slate-400">{description}</p>}
      {children}
    </div>
  )
}

export function Badge({ label, className = '' }) {
  return (
    <span className={`inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300 ${className}`}>
      {label}
    </span>
  )
}

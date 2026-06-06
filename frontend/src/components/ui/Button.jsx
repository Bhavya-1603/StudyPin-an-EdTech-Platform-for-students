import { Link } from 'react-router-dom'

export function Button({ children, to, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-3xl px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-400/50'
  const variants = {
    primary: 'bg-sky-500 text-white hover:bg-sky-400',
    secondary: 'border border-slate-700 bg-slate-950/90 text-slate-100 hover:border-sky-400 hover:bg-slate-900',
    ghost: 'bg-transparent text-white hover:bg-white/5',
  }
  const classes = `${base} ${variants[variant] || variants.primary} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

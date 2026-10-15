import { Link } from 'react-router-dom'

export function Button({ children, to, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap shrink-0'
  
  const sizes = {
    sm: 'rounded-lg px-3 py-1.5 text-xs',
    md: 'rounded-xl px-4 py-2 text-sm',
    lg: 'rounded-xl px-5 py-2.5 text-sm',
  }

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  }

  const classes = `${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`

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

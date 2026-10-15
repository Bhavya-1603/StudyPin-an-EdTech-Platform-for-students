import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, PlusCircle, User, LogOut } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/useStore'

function StudyPinLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 shadow-sm shadow-blue-500/20">
        <svg
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Refined pin & book mark */}
          <path d="M12 2v6" />
          <path d="M5 8h14l-2 10H7L5 8z" />
          <path d="M9 12h6" />
          <circle cx="12" cy="2" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <div className="flex items-baseline">
        <span className="text-xl font-bold tracking-tight text-slate-900">Study</span>
        <span className="text-xl font-bold tracking-tight text-blue-600">Pin</span>
        <span className="ml-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span>
      </div>
    </div>
  )
}

function Header() {
  const token = useAuthStore((state) => state.auth?.token)
  const user = useAuthStore((state) => state.auth?.user)
  const logout = useAuthStore((state) => state.logout)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Explore Notes', path: ROUTES.EXPLORE },
    { label: 'Upload Studio', path: ROUTES.UPLOAD },
    { label: 'Saved Library', path: ROUTES.SAVED },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <Link to={ROUTES.HOME} className="shrink-0 transition-opacity hover:opacity-95">
          <StudyPinLogo />
        </Link>

        {/* Zone 2: Clean Single-line Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to={ROUTES.UPLOAD}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <PlusCircle size={15} className="text-blue-600" />
            <span>Upload Note</span>
          </Link>

          {token ? (
            <div className="flex items-center gap-2">
              <Link
                to={ROUTES.PROFILE}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {(user?.name || user?.email || 'S').charAt(0).toUpperCase()}
                </div>
                <span>{user?.name || 'My Profile'}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to={ROUTES.AUTH}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 md:hidden shadow-lg">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded-lg px-3 py-2.5 font-medium ${
                  isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
            <Link
              to={ROUTES.UPLOAD}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2.5 font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              <PlusCircle size={16} className="text-blue-600" />
              <span>Upload Note</span>
            </Link>

            {token ? (
              <div className="flex gap-2">
                <Link
                  to={ROUTES.PROFILE}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-center font-medium text-white"
                  onClick={() => setOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-600 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.AUTH}
                className="block rounded-lg bg-blue-600 py-2.5 text-center font-medium text-white hover:bg-blue-700"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

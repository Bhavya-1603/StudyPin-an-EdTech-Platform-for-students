import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Search } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/useStore'

function Header() {
  const token = useAuthStore((state) => state.auth.token)
  const logout = useAuthStore((state) => state.logout)
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-shadow duration-300 shadow-sm">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 text-lg font-semibold tracking-[0.14em] text-white">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">S</span>
          <span>StudyPin</span>
        </Link>

        <div className="hidden items-center gap-3 md:flex md:flex-1 md:justify-center lg:gap-6">
          <Link to={ROUTES.EXPLORE} className="transition text-sm font-medium text-slate-300 hover:text-white">Explore</Link>
          <Link to={ROUTES.UPLOAD} className="transition text-sm font-medium text-slate-300 hover:text-white">Upload</Link>
          <Link to={ROUTES.DASHBOARD} className="transition text-sm font-medium text-slate-300 hover:text-white">Dashboard</Link>
          <Link to={ROUTES.SAVED} className="transition text-sm font-medium text-slate-300 hover:text-white">Saved</Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {token ? (
            <>
              <Link to={ROUTES.PROFILE} className="rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400 hover:bg-slate-900">
                My profile
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400 hover:bg-slate-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to={ROUTES.AUTH} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/85 text-slate-300 transition hover:border-sky-400 md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-800/80 bg-slate-950/95 px-4 py-5 text-sm text-slate-300 md:hidden">
          <div className="space-y-3">
            <Link to={ROUTES.EXPLORE} className="block rounded-3xl px-4 py-3 hover:bg-slate-900/80 hover:text-white" onClick={() => setOpen(false)}>
              Explore
            </Link>
            <Link to={ROUTES.UPLOAD} className="block rounded-3xl px-4 py-3 hover:bg-slate-900/80 hover:text-white" onClick={() => setOpen(false)}>
              Upload
            </Link>
            <Link to={ROUTES.DASHBOARD} className="block rounded-3xl px-4 py-3 hover:bg-slate-900/80 hover:text-white" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link to={ROUTES.SAVED} className="block rounded-3xl px-4 py-3 hover:bg-slate-900/80 hover:text-white" onClick={() => setOpen(false)}>
              Saved
            </Link>
          </div>

          <div className="mt-5 border-t border-slate-800/80 pt-5">
            {token ? (
              <Link to={ROUTES.PROFILE} className="block rounded-3xl bg-sky-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-sky-400" onClick={() => setOpen(false)}>
                My profile
              </Link>
            ) : (
              <Link to={ROUTES.AUTH} className="block rounded-3xl bg-sky-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-sky-400" onClick={() => setOpen(false)}>
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

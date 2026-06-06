import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/95 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">StudyPin</p>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
            Build your study library with AI-guided notes, smart recommendations, and community resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <Link to={ROUTES.HOME} className="transition hover:text-white">Home</Link>
          <Link to={ROUTES.EXPLORE} className="transition hover:text-white">Explore</Link>
          <Link to={ROUTES.UPLOAD} className="transition hover:text-white">Upload</Link>
          <Link to={ROUTES.DASHBOARD} className="transition hover:text-white">Dashboard</Link>
        </div>
      </div>
      <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} StudyPin. Designed for intelligent learning.
      </div>
    </footer>
  )
}

export default Footer

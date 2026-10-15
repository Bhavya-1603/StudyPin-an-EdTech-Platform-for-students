import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8 mt-12">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">StudyPin</span>
          <span aria-hidden="true">·</span>
          <span>Intelligent Student Knowledge & Study Hub</span>
        </div>

        <nav className="flex flex-wrap items-center gap-6 font-medium text-slate-600">
          <Link to={ROUTES.HOME} className="hover:text-blue-600 transition-colors">Home</Link>
          <Link to={ROUTES.DASHBOARD} className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <Link to={ROUTES.EXPLORE} className="hover:text-blue-600 transition-colors">Explore</Link>
          <Link to={ROUTES.UPLOAD} className="hover:text-blue-600 transition-colors">Upload</Link>
          <Link to={ROUTES.SAVED} className="hover:text-blue-600 transition-colors">Saved Library</Link>
        </nav>

        <p className="tabular-nums">
          © {new Date().getFullYear()} StudyPin. Built for structured learning.
        </p>
      </div>
    </footer>
  )
}

export default Footer

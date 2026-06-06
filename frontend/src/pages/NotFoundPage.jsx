import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="space-y-8 rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 text-center shadow-glow backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.3em] text-sky-300">404</p>
      <h1 className="text-4xl font-semibold text-white">Page not found</h1>
      <p className="max-w-xl mx-auto text-slate-400">The page you were looking for does not exist, or it has moved. Return to the dashboard or home page.</p>
      <Link to="/" className="inline-flex rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
        Back to Home
      </Link>
    </div>
  )
}

export default NotFoundPage

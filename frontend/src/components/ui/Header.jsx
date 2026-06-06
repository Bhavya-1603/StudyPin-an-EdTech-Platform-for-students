import { Link } from 'react-router-dom'
import { Button } from './Button'

export function Header() {
  return (
    <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-glow backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300">StudyPin</p>
        <p className="mt-3 max-w-xl text-3xl font-semibold text-white sm:text-4xl">AI-powered learning journeys for every student.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button to="/dashboard">Dashboard</Button>
        <Button to="/explore" variant="secondary">Explore</Button>
      </div>
    </header>
  )
}

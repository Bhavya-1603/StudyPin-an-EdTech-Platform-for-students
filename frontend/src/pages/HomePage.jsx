import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Sparkles, UploadCloud, Compass, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import NoteCard from '../components/NoteCard'
import { useNotesStore } from '../store/useStore'
import { ROUTES } from '../constants/routes'

const categories = [
  { name: 'Physics', count: '142 notes', color: 'from-blue-500/10 to-sky-500/10 text-blue-700' },
  { name: 'Chemistry', count: '118 notes', color: 'from-amber-500/10 to-orange-500/10 text-amber-800' },
  { name: 'Mathematics', count: '196 notes', color: 'from-indigo-500/10 to-purple-500/10 text-indigo-700' },
  { name: 'Computer Science', count: '230 notes', color: 'from-emerald-500/10 to-teal-500/10 text-emerald-800' },
  { name: 'Biology', count: '94 notes', color: 'from-rose-500/10 to-pink-500/10 text-rose-700' },
  { name: 'Engineering', count: '160 notes', color: 'from-cyan-500/10 to-blue-500/10 text-cyan-800' },
]

function HomePage() {
  const notes = useNotesStore((state) => state.notes)
  const loadNotes = useNotesStore((state) => state.loadNotes)
  const featured = useMemo(() => notes.slice(0, 3), [notes])

  useEffect(() => {
    if (!notes.length) {
      loadNotes()
    }
  }, [loadNotes, notes.length])

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/50 to-blue-50/20 p-8 sm:p-12 shadow-sm">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles size={13} className="text-blue-600" />
              <span>Smart Student Knowledge Platform</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-[1.15]">
              Upload notes, discover smarter study guides, and accelerate your learning.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              StudyPin unifies personalized note discovery, automated flashcards, and student study workflows into a luminous, distraction-free workspace.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button to={ROUTES.DASHBOARD} variant="primary" size="lg" className="gap-2">
                <span>Open Student Dashboard</span>
                <ArrowRight size={16} />
              </Button>
              <Button to={ROUTES.EXPLORE} variant="secondary" size="lg">
                Explore Notes
              </Button>
              <Button to={ROUTES.UPLOAD} variant="ghost" size="lg" className="gap-1.5">
                <UploadCloud size={16} />
                <span>Upload Material</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
            <Card title="Active Learners" value="12,400+" description="Students sharing verified exam notes" />
            <Card title="Study Resources" value="8,900+" description="Structured notes, cheat sheets & guides" />
            <Card title="AI Summaries" value="4,600+" description="Instant key concepts extracted" />
            <Card title="Study Streak Avg" value="14 Days" description="High daily consistency benchmark" />
          </div>
        </div>
      </section>

      {/* Popular Subjects */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Curated Library</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Explore by Subject</h2>
          </div>
          <Link to={ROUTES.EXPLORE} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            View All Subjects →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`${ROUTES.EXPLORE}?subject=${encodeURIComponent(cat.name)}`}
              className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500">{cat.count}</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Resources */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Featured Study Materials</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Recommended for Your Exams</h2>
          </div>
          <Link to={ROUTES.EXPLORE} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            See all resources →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.length > 0 ? (
            featured.map((note) => <NoteCard key={note.id} note={note} />)
          ) : (
            <div className="col-span-full rounded-2xl border border-slate-200/90 bg-white p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UploadCloud size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Your study library is ready for notes</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload your lecture notes, summaries, or formula sheets to start building your personalized study library.
              </p>
              <div className="pt-2">
                <Button to={ROUTES.UPLOAD} variant="primary" size="md">
                  Upload First Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage

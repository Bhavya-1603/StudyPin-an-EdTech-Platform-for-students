import { useEffect, useMemo } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import NoteCard from '../components/NoteCard'
import { useNotesStore } from '../store/useStore'

const categories = ['Physics', 'Chemistry', 'Mathematics', 'Computer Science', 'Biology', 'Engineering']

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
    <div className="space-y-10">
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge label="AI-powered EdTech" />
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Upload notes, discover smarter learning, and build your study library faster.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              StudyPin combines powerful AI recommendations with a premium discovery experience designed for modern learners who want structure, speed, and confidence.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button to="/upload">Upload Study Material</Button>
              <Button variant="secondary" to="/explore">Explore Resources</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Active students" value="12.4K+" />
            <Card title="Resources uploaded" value="8.9K+" />
            <Card title="AI recommendations" value="4.6K+" />
            <Card title="Trusted study partner" value="94% satisfaction" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Popular subjects</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Choose your next learning path</h2>
            </div>
            <span className="inline-flex rounded-full bg-slate-800/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              Explore subjects
            </span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <button key={category} className="rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-left transition hover:border-sky-400/60 hover:bg-slate-900/90">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Subject</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{category}</h3>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.26em] text-sky-300">AI recommendations preview</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Recommended based on your learning style</h2>
          <p className="mt-4 text-slate-300">StudyPin’s AI surfaces the most relevant resources, personalized to your interests and uploads.</p>
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-slate-950/80 p-5 shadow-inner shadow-slate-950/10">
              <p className="text-sm text-sky-300">Because you uploaded Physics notes</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Modern Physics & Wave Optics</h3>
              <p className="mt-2 text-slate-400">High-impact notes matched with your learning history and study goals.</p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 p-5 shadow-inner shadow-slate-950/10">
              <p className="text-sm text-sky-300">AI confidence</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-3/4 rounded-full bg-sky-500" />
                </div>
                <span className="text-sm font-semibold text-white">82%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {featured.length ? (
          featured.map((note) => <NoteCard key={note.id} note={note} />)
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 text-center text-slate-300">
            <p className="text-lg font-semibold text-white">No resources available yet</p>
            <p className="mt-3 text-sm leading-6">Upload notes or explore the library, and your personalized recommendations will appear here.</p>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.26em] text-sky-300">How StudyPin works</p>
            <h2 className="text-3xl font-semibold text-white">A smarter workflow for note-driven learning</h2>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6">
            <h3 className="text-xl font-semibold text-white">1. Upload</h3>
            <p className="text-slate-400">Add notes, PDFs, mind maps and study guides in seconds.</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6">
            <h3 className="text-xl font-semibold text-white">2. Analyze</h3>
            <p className="text-slate-400">AI extracts key topics, tags and recommendation signals.</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6">
            <h3 className="text-xl font-semibold text-white">3. Discover</h3>
            <p className="text-slate-400">Learn from curated resources tailored to your study goals.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage

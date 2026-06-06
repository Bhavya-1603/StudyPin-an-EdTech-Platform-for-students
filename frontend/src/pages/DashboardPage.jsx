import { Card } from '../components/ui/Card'
import NoteCard from '../components/NoteCard'
import { useNotesStore } from '../store/useStore'

function DashboardPage() {
  const notes = useNotesStore((state) => state.notes)

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-sky-300">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Study analytics and recommendations</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Notes uploaded" value="24" />
          <Card title="Saved resources" value="12" />
          <Card title="Views" value="18.4K" />
          <Card title="Study streak" value="6 days" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.26em] text-sky-300">Recent activity</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Your latest study actions</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
              <p className="text-sm font-semibold text-white">You uploaded "Calculus Notes"</p>
              <p className="mt-1 text-slate-400">2 hours ago</p>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
              <p className="text-sm font-semibold text-white">AI suggested "Wave Optics Review"</p>
              <p className="mt-1 text-slate-400">Yesterday</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.26em] text-sky-300">Saved resources</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Keep your best notes close</h2>
          <div className="mt-6 grid gap-4">
            {notes.slice(0, 3).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

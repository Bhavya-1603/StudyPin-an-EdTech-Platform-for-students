import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookOpen, ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import NoteCard from '../components/NoteCard'
import { ROUTES } from '../constants/routes'

function SavedResourcesPage() {
  const savedNotes = useStore((state) => state.savedNotes)
  const loadSavedNotes = useStore((state) => state.loadSavedNotes)
  const saveNote = useStore((state) => state.saveNote)

  useEffect(() => {
    loadSavedNotes()
  }, [loadSavedNotes])

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Personal Library</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Saved Study Resources
            </h1>
            <p className="text-sm text-slate-500">
              Your bookmarked notes, formula guides, and revision sheets.
            </p>
          </div>
          <Link
            to={ROUTES.EXPLORE}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <BookOpen size={15} className="text-blue-600" />
            <span>Discover More Notes</span>
          </Link>
        </div>
      </section>

      {savedNotes && savedNotes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSaved={true}
              onSave={(n, saved) => saveNote(n, saved)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Bookmark size={32} className="mx-auto text-slate-300" />
          <h3 className="mt-3 font-semibold text-slate-900">Your saved library is empty</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You haven't saved any notes yet. Browse the explore repository and tap the bookmark icon on any note to save it here for fast revision.
          </p>
          <Link
            to={ROUTES.EXPLORE}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <span>Explore Notes</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}

export default SavedResourcesPage

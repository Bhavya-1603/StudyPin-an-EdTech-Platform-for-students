import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, BookOpen } from 'lucide-react'
import NoteCard from '../components/NoteCard'
import { useNotesStore } from '../store/useStore'

const subjects = ['All', 'Physics', 'Mathematics', 'Computer Science', 'Chemistry', 'Biology']

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') || 'All'
  const [selectedSubject, setSelectedSubject] = useState(initialSubject)
  const [searchQuery, setSearchQuery] = useState('')

  const notes = useNotesStore((state) => state.notes)
  const loadNotes = useNotesStore((state) => state.loadNotes)
  const loading = useNotesStore((state) => state.resources.loading)

  useEffect(() => {
    loadNotes(selectedSubject === 'All' ? '' : selectedSubject, searchQuery)
  }, [selectedSubject, loadNotes])

  const handleSearch = (e) => {
    e.preventDefault()
    loadNotes(selectedSubject === 'All' ? '' : selectedSubject, searchQuery)
  }

  const handleSubjectChange = (subj) => {
    setSelectedSubject(subj)
    if (subj === 'All') {
      searchParams.delete('subject')
    } else {
      searchParams.set('subject', subj)
    }
    setSearchParams(searchParams)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Knowledge Repository</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Explore Study Notes & Summaries
          </h1>
          <p className="text-sm text-slate-500">
            Browse verified community notes, formula cheat sheets, and AI-generated conceptual outlines across core subjects.
          </p>
        </div>

        {/* Search & Subject Filters */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes by title, topic, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </form>

          {/* Interactive Subject Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {subjects.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => handleSubjectChange(subj)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  selectedSubject === subj
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notes Grid */}
      <section>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading resources...
          </div>
        ) : notes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <BookOpen size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-900">No notes found for this filter</p>
            <p className="mt-1 text-xs text-slate-500">Try choosing another subject or search term</p>
            <button
              onClick={() => handleSubjectChange('All')}
              className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default ExplorePage

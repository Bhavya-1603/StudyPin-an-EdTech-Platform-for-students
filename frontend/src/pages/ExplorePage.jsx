import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, BookOpen, Atom, Landmark, Calculator, Code2, Library, Cpu } from 'lucide-react'
import NoteCard from '../components/NoteCard'
import { useNotesStore } from '../store/useStore'

const categories = [
  { id: 'All', label: 'All Categories' },
  { id: 'Science', label: 'Science', icon: Atom },
  { id: 'History', label: 'History', icon: Landmark },
  { id: 'Math', label: 'Math', icon: Calculator },
  { id: 'Computer Science', label: 'Computer Science', icon: Code2 },
  { id: 'Literature', label: 'Literature', icon: Library },
  { id: 'Engineering', label: 'Engineering', icon: Cpu },
]

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject') || 'All'
  const initialCategory = searchParams.get('category') || 'All'

  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedSubject, setSelectedSubject] = useState(initialSubject)
  const [searchQuery, setSearchQuery] = useState('')

  const notes = useNotesStore((state) => state.notes)
  const loadNotes = useNotesStore((state) => state.loadNotes)
  const loading = useNotesStore((state) => state.resources.loading)

  useEffect(() => {
    const cat = selectedCategory === 'All' ? '' : selectedCategory
    const subj = selectedSubject === 'All' ? '' : selectedSubject
    loadNotes(subj, searchQuery, cat)
  }, [selectedCategory, selectedSubject, loadNotes])

  const handleSearch = (e) => {
    e.preventDefault()
    const cat = selectedCategory === 'All' ? '' : selectedCategory
    const subj = selectedSubject === 'All' ? '' : selectedSubject
    loadNotes(subj, searchQuery, cat)
  }

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId)
    if (catId === 'All') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', catId)
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
            Browse verified community notes, formula cheat sheets, and conceptual outlines across Science, History, Math, and Computer Science.
          </p>
        </div>

        {/* Search Input & Category Filters */}
        <div className="mt-6 space-y-4">
          <form onSubmit={handleSearch} className="relative max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes by title, topic, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </form>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1">Category:</span>
            {categories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase()
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {Icon && <Icon size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />}
                  <span>{cat.label}</span>
                </button>
              )
            })}
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
            <p className="mt-3 font-semibold text-slate-900">No notes found for this category</p>
            <p className="mt-1 text-xs text-slate-500">
              Try choosing another category, clearing your search, or uploading study notes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All')
                setSelectedSubject('All')
                setSearchQuery('')
                searchParams.delete('category')
                searchParams.delete('subject')
                setSearchParams(searchParams)
              }}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default ExplorePage

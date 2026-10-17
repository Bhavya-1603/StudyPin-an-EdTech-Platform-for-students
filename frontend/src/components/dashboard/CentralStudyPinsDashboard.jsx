import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  BookOpen,
  Atom,
  Landmark,
  Calculator,
  Code2,
  Library,
  Cpu,
  Search,
  Sparkles,
  Layers,
  Heart,
  Eye,
  Download,
  Plus,
  Filter,
  CheckCircle2,
  RefreshCw,
  FolderPlus,
  Share2,
  Database,
  ArrowUpRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore, useStore } from '../../store/useStore'
import { auth } from '../../firebase/firebase'
import {
  fetchCategorizedNotesFromFirestore,
  subscribeCategorizedNotesFromFirestore,
  fetchUserSavedPinsFromFirestore,
  subscribeUserSavedPins,
  toggleSavePinInFirestore,
  fetchUserBoardsFromFirestore,
  createBoardInFirestore,
} from '../../firebase/firestoreService'
import { ROUTES } from '../../constants/routes'

export const CATEGORY_CONFIG = {
  All: {
    label: 'All Notes',
    icon: BookOpen,
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    color: 'from-slate-500 to-slate-700',
  },
  Science: {
    label: 'Science',
    icon: Atom,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    color: 'from-emerald-500 to-teal-700',
  },
  History: {
    label: 'History',
    icon: Landmark,
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    color: 'from-amber-500 to-orange-700',
  },
  Math: {
    label: 'Mathematics',
    icon: Calculator,
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    color: 'from-blue-500 to-indigo-700',
  },
  'Computer Science': {
    label: 'Computer Science',
    icon: Code2,
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    color: 'from-purple-500 to-violet-700',
  },
  Literature: {
    label: 'Literature',
    icon: Library,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    color: 'from-rose-500 to-pink-700',
  },
  Engineering: {
    label: 'Engineering',
    icon: Cpu,
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    color: 'from-indigo-500 to-cyan-700',
  },
}

export default function CentralStudyPinsDashboard({ initialTab = 'all' }) {
  const user = useAuthStore((state) => state.auth?.user)
  const [activeTab, setActiveTab] = useState(initialTab) // 'all' | 'saved' | 'my-pins' | 'boards'
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('trending') // 'trending' | 'saves' | 'newest'

  // Firestore live state
  const [firestoreNotes, setFirestoreNotes] = useState([])
  const [savedPinIds, setSavedPinIds] = useState([])
  const [savedNotes, setSavedNotes] = useState([])
  const [userBoards, setUserBoards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pinActionInProgress, setPinActionInProgress] = useState({})

  // Board creation modal
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardCategory, setNewBoardCategory] = useState('General')

  const currentUserId = auth?.currentUser?.uid || user?.id || user?.uid || null
  const currentUserEmail = auth?.currentUser?.email || user?.email || ''

  // 1. Initial and Realtime Subscriptions to Firestore Notes & Saved Pins
  useEffect(() => {
    let unsubscribeNotes = () => {}
    let unsubscribeSaved = () => {}

    const initData = async () => {
      setIsLoading(true)
      try {
        // Fetch notes from Firestore
        const notes = await fetchCategorizedNotesFromFirestore('All')
        if (notes && notes.length > 0) {
          setFirestoreNotes(notes)
        }

        // Realtime listener for notes collection
        unsubscribeNotes = subscribeCategorizedNotesFromFirestore(
          'All',
          (liveNotes) => {
            if (liveNotes && liveNotes.length > 0) {
              setFirestoreNotes(liveNotes)
            }
            setIsLoading(false)
          },
          (err) => {
            console.warn('Realtime notes error:', err?.message)
            setIsLoading(false)
          }
        )

        // If user is identified, fetch saved pins and boards from Firestore
        if (currentUserId) {
          const userSavedData = await fetchUserSavedPinsFromFirestore(currentUserId)
          setSavedPinIds(userSavedData.savedNoteIds || [])
          setSavedNotes(userSavedData.savedNotes || [])

          // Subscribe to user saved pin changes
          unsubscribeSaved = subscribeUserSavedPins(currentUserId, async (liveIds) => {
            setSavedPinIds(liveIds)
            // Fetch updated notes corresponding to new IDs
            if (liveIds && liveIds.length > 0) {
              const res = await fetchUserSavedPinsFromFirestore(currentUserId)
              setSavedNotes(res.savedNotes || [])
            } else {
              setSavedNotes([])
            }
          })

          // Fetch boards
          const boards = await fetchUserBoardsFromFirestore(currentUserId)
          setUserBoards(boards || [])
        }
      } catch (err) {
        console.warn('Dashboard Firestore init notice:', err?.message)
      } finally {
        setIsLoading(false)
      }
    }

    initData()

    return () => {
      unsubscribeNotes()
      unsubscribeSaved()
    }
  }, [currentUserId])

  // 2. Manual refresh action to re-sync with Firestore
  const handleRefresh = async () => {
    setIsSyncing(true)
    try {
      const notes = await fetchCategorizedNotesFromFirestore(selectedCategory)
      setFirestoreNotes(notes)
      if (currentUserId) {
        const userSavedData = await fetchUserSavedPinsFromFirestore(currentUserId)
        setSavedPinIds(userSavedData.savedNoteIds || [])
        setSavedNotes(userSavedData.savedNotes || [])
        const boards = await fetchUserBoardsFromFirestore(currentUserId)
        setUserBoards(boards || [])
      }
      toast.success('Synced latest pins from Cloud Firestore')
    } catch {
      toast.error('Failed to refresh data from Firestore')
    } finally {
      setIsSyncing(false)
    }
  }

  // 3. Pin / Save note toggle in Firestore
  const handleTogglePin = async (note) => {
    if (!currentUserId) {
      toast('Please sign in to pin and save study materials', { icon: '🔐' })
      return
    }

    const isCurrentlySaved = savedPinIds.includes(note.id)
    const nextSavedState = !isCurrentlySaved

    setPinActionInProgress((prev) => ({ ...prev, [note.id]: true }))

    // Optimistic UI update
    setSavedPinIds((prev) =>
      nextSavedState ? [...prev, note.id] : prev.filter((id) => id !== note.id)
    )
    if (nextSavedState) {
      setSavedNotes((prev) => [note, ...prev.filter((n) => n.id !== note.id)])
    } else {
      setSavedNotes((prev) => prev.filter((n) => n.id !== note.id))
    }

    try {
      await toggleSavePinInFirestore(currentUserId, note, nextSavedState, currentUserEmail)
      if (nextSavedState) {
        toast.success(`Pinned "${note.title.slice(0, 32)}..." to your Firestore collection`, {
          icon: '📌',
        })
      } else {
        toast('Pin removed from your saved collection', { icon: '🗑️' })
      }
    } catch (err) {
      // Revert optimistic update on failure
      setSavedPinIds((prev) =>
        isCurrentlySaved ? [...prev, note.id] : prev.filter((id) => id !== note.id)
      )
      toast.error('Could not update pin in Firestore: ' + (err?.message || 'Error'))
    } finally {
      setPinActionInProgress((prev) => ({ ...prev, [note.id]: false }))
    }
  }

  // 4. Create new board in Firestore
  const handleCreateBoard = async (e) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) {
      toast.error('Please enter a board name')
      return
    }
    if (!currentUserId) {
      toast.error('Please sign in to create study boards')
      return
    }

    try {
      const created = await createBoardInFirestore(currentUserId, {
        title: newBoardTitle.trim(),
        category: newBoardCategory,
        noteIds: [],
      })
      if (created) {
        setUserBoards((prev) => [created, ...prev])
        setNewBoardTitle('')
        setShowCreateBoardModal(false)
        toast.success(`Board "${created.title}" created in Firestore!`)
      }
    } catch {
      toast.error('Failed to create board')
    }
  }

  // 5. Category Counts calculation
  const categoryCounts = useMemo(() => {
    const counts = {
      All: firestoreNotes.length,
      Science: 0,
      History: 0,
      Math: 0,
      'Computer Science': 0,
      Literature: 0,
      Engineering: 0,
    }
    firestoreNotes.forEach((n) => {
      const cat = n.category
      if (counts[cat] !== undefined) {
        counts[cat] += 1
      }
    })
    return counts
  }, [firestoreNotes])

  // 6. Filter & Sort Logic
  const filteredNotes = useMemo(() => {
    let list = []
    if (activeTab === 'saved') {
      list = savedNotes
    } else if (activeTab === 'my-pins') {
      list = firestoreNotes.filter(
        (n) => n.uploaderId === currentUserId || n.uploaderEmail === currentUserEmail
      )
    } else {
      list = firestoreNotes
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter(
        (n) => n.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      list = list.filter(
        (n) => n.difficulty?.toLowerCase() === difficultyFilter.toLowerCase()
      )
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((n) => {
        const titleMatch = n.title?.toLowerCase().includes(q)
        const descMatch = n.description?.toLowerCase().includes(q)
        const subjectMatch = n.subject?.toLowerCase().includes(q)
        const tagMatch = Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase().includes(q))
        return titleMatch || descMatch || subjectMatch || tagMatch
      })
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'saves') return (b.saves || 0) - (a.saves || 0)
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt || a.uploaded_at || 0).getTime()
        const dateB = new Date(b.createdAt || b.uploaded_at || 0).getTime()
        return dateB - dateA
      }
      // default: trending / likes + saves + views
      const scoreA = (a.likes || 0) * 2 + (a.saves || 0) * 3 + (a.views || 0) / 10
      const scoreB = (b.likes || 0) * 2 + (b.saves || 0) * 3 + (b.views || 0) / 10
      return scoreB - scoreA
    })
  }, [
    activeTab,
    firestoreNotes,
    savedNotes,
    selectedCategory,
    difficultyFilter,
    searchQuery,
    sortBy,
    currentUserId,
    currentUserEmail,
  ])

  return (
    <div className="space-y-6">
      {/* HEADER BAR: Title, Live Sync Status, and Quick Upload */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 border border-blue-200/70">
                <Database size={12} className="text-blue-600 animate-pulse" />
                <span>Cloud Firestore Synced</span>
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-medium text-slate-500">Pinterest-Style Academic Pins</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Study Pins & Knowledge Hub
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">
              Discover, organize, and pin high-yield lecture notes and flashcards across science, math, history, and engineering directly stored in your personal Cloud Firestore database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              title="Refresh and sync from Cloud Firestore"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Firestore'}</span>
            </button>

            <Link
              to={ROUTES.UPLOAD}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <Plus size={16} />
              <span>Upload New Pin</span>
            </Link>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-5">
          <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Saved Study Pins</p>
            <p className="mt-1 text-xl font-extrabold text-blue-700">{savedPinIds.length}</p>
            <p className="text-[11px] text-slate-400">In personal collection</p>
          </div>

          <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Categorized Notes</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-700">{firestoreNotes.length}</p>
            <p className="text-[11px] text-slate-400">Available across catalog</p>
          </div>

          <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Boards</p>
            <p className="mt-1 text-xl font-extrabold text-purple-700">{userBoards.length}</p>
            <p className="text-[11px] text-slate-400">Study goal groups</p>
          </div>

          <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Categories</p>
            <p className="mt-1 text-xl font-extrabold text-amber-700">6 Fields</p>
            <p className="text-[11px] text-slate-400">Science, Math, CS & more</p>
          </div>
        </div>
      </section>

      {/* CENTRAL NAVIGATION TABS: All Notes, My Saved Pins, My Uploads, Study Boards */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={14} className={activeTab === 'all' ? 'text-blue-600' : 'text-slate-400'} />
            <span>All Categorized Notes</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {firestoreNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'saved'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark size={14} className={activeTab === 'saved' ? 'text-amber-600 fill-amber-500' : 'text-slate-400'} />
            <span>My Saved Pins</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === 'saved' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {savedPinIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('boards')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'boards'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} className={activeTab === 'boards' ? 'text-purple-600' : 'text-slate-400'} />
            <span>Study Boards</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === 'boards' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {userBoards.length}
            </span>
          </button>
        </div>

        {/* Quick Search & Sort dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, topic, tag..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="trending">🔥 Trending</option>
            <option value="saves">📌 Most Pinned</option>
            <option value="newest">🕒 Newest Uploads</option>
          </select>
        </div>
      </div>

      {/* CATEGORY FILTER PILLS */}
      {activeTab !== 'boards' && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 px-2">
            <Filter size={13} />
            <span>Category:</span>
          </span>

          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            const isSelected = selectedCategory.toLowerCase() === key.toLowerCase()
            const count = categoryCounts[key] ?? 0

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Icon size={13} className={isSelected ? 'text-white' : 'text-slate-500'} />
                <span>{config.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected ? 'bg-blue-700/80 text-white' : 'bg-slate-200/90 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* TAB 1 & 2: CATEGORIZED STUDY PIN CARDS (Pinterest-Inspired Grid) */}
      {activeTab !== 'boards' && (
        <div>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="h-36 rounded-xl bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                  <div className="h-8 rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredNotes.map((note) => {
                const isPinned = savedPinIds.includes(note.id)
                const config = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.All
                const CategoryIcon = config.icon
                const isPinning = pinActionInProgress[note.id]

                return (
                  <div
                    key={note.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
                  >
                    {/* Visual Pin Card Header (Image or Category Art) */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      {note.thumbnail && note.thumbnail !== '#' ? (
                        <img
                          src={note.thumbnail}
                          alt={note.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${config.color} p-4 text-white`}
                        >
                          <CategoryIcon size={48} className="opacity-40" />
                        </div>
                      )}

                      {/* Top Action Overlay: Category Badge & Direct Pin Button */}
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/40 via-transparent to-transparent">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold backdrop-blur-md bg-white/90 text-slate-800 shadow-sm`}
                        >
                          <CategoryIcon size={11} className="text-blue-600" />
                          <span>{note.category}</span>
                        </span>

                        {/* PIN BUTTON (Instant Firestore update) */}
                        <button
                          type="button"
                          onClick={() => handleTogglePin(note)}
                          disabled={isPinning}
                          aria-label={isPinned ? 'Unpin note' : 'Save pin'}
                          className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition shadow-md active:scale-90 ${
                            isPinned
                              ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-white'
                              : 'bg-white/90 text-slate-700 hover:bg-white hover:text-amber-600'
                          }`}
                          title={isPinned ? 'Remove pin' : 'Pin to your Firestore workspace'}
                        >
                          <Bookmark
                            size={16}
                            className={isPinned ? 'fill-current' : isPinning ? 'animate-pulse' : ''}
                          />
                        </button>
                      </div>

                      {/* Bottom Image Overlay: Subject & Difficulty */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                        <p className="text-xs font-bold text-white drop-shadow-sm">{note.subject}</p>
                        <span className="text-[10px] font-medium text-slate-200">
                          {note.difficulty || 'Medium'} difficulty
                        </span>
                      </div>
                    </div>

                    {/* Pin Details */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition">
                          {note.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {note.description}
                        </p>

                        {/* Tags */}
                        {Array.isArray(note.tags) && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {note.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pin Footer & Academic Metadata */}
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">By {note.uploader || 'Student'}</span>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart size={12} className="text-rose-500 fill-rose-500" />
                              <span>{note.likes || 12}</span>
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-amber-700">
                              <Bookmark size={12} className="fill-amber-600 text-amber-600" />
                              <span>{note.saves || (isPinned ? 1 : 0)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Direct Study / Download link */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {note.file_url && note.file_url !== '#' ? (
                            <a
                              href={note.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 active:scale-98"
                            >
                              <Download size={13} />
                              <span>Download PDF</span>
                            </a>
                          ) : (
                            <Link
                              to={`${ROUTES.EXPLORE}?category=${encodeURIComponent(note.category || 'Science')}&subject=${encodeURIComponent(note.subject || '')}`}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-98"
                            >
                              <span>Study Material</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                {activeTab === 'saved' ? <Bookmark size={26} /> : <BookOpen size={26} />}
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                {activeTab === 'saved' ? 'No Saved Pins Yet' : 'No Study Notes Found'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500 leading-relaxed">
                {activeTab === 'saved'
                  ? 'Browse the notes catalog and tap the bookmark icon on any card to pin it into your personal Cloud Firestore collection.'
                  : 'No notes match your current category and search filter. Try clearing filters or uploading new study pins.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {activeTab === 'saved' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('all')
                      setSelectedCategory('All')
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    <BookOpen size={14} />
                    <span>Browse All Notes</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All')
                      setSearchQuery('')
                      setDifficultyFilter('all')
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <span>Clear Filters</span>
                  </button>
                )}
                <Link
                  to={ROUTES.UPLOAD}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  <Plus size={14} />
                  <span>Upload Study Material</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDY BOARDS (Pinterest Boards organized in Firestore) */}
      {activeTab === 'boards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Firestore Study Boards</h2>
              <p className="text-xs text-slate-500">Group your saved study pins into dedicated revision goals</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateBoardModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 active:scale-95"
            >
              <FolderPlus size={15} />
              <span>Create New Board</span>
            </button>
          </div>

          {userBoards.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userBoards.map((board) => (
                <div
                  key={board.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                      <Layers size={22} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {(board.noteIds || []).length} pins
                    </span>
                  </div>

                  <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-purple-700 transition">
                    {board.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {board.description || `Collection for ${board.category || 'General'} studies`}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="font-medium text-slate-400">{board.category || 'General'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('saved')
                      }}
                      className="font-bold text-purple-600 hover:text-purple-800"
                    >
                      View Pins →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <Layers size={26} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No Study Boards Created Yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
                Organize your pinned study resources into custom curriculum boards like "JEE Physics Formulae", "NEET Mind Maps", or "Semester Finals".
              </p>
              <button
                type="button"
                onClick={() => setShowCreateBoardModal(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
              >
                <FolderPlus size={15} />
                <span>Create Your First Board</span>
              </button>
            </div>
          )}

          {/* CREATE BOARD MODAL */}
          {showCreateBoardModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Create Study Board</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateBoardModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateBoard} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Board Name</label>
                    <input
                      type="text"
                      required
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      placeholder="e.g., Organic Chemistry Reagents"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">Category</label>
                    <select
                      value={newBoardCategory}
                      onChange={(e) => setNewBoardCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="General">General</option>
                      <option value="Science">Science</option>
                      <option value="Math">Mathematics</option>
                      <option value="History">History</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Literature">Literature</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateBoardModal(false)}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                    >
                      Save Board to Firestore
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

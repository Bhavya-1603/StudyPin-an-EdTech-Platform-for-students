import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Plus,
  Check,
  Award,
  ChevronRight,
  FileText,
  UploadCloud,
  Bookmark
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ROUTES } from '../../constants/routes'
import { useAuthStore, useStore } from '../../store/useStore'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const user = useAuthStore((state) => state.auth?.user)
  const notes = useStore((state) => state.notes)
  const savedNotes = useStore((state) => state.savedNotes)
  const dashboard = useStore((state) => state.dashboard)
  const loadDashboardData = useStore((state) => state.loadDashboardData)
  const addDeadline = useStore((state) => state.addDeadline)
  const toggleDeadline = useStore((state) => state.toggleDeadline)
  const addGoal = useStore((state) => state.addGoal)
  const updateGoalProgress = useStore((state) => state.updateGoalProgress)
  const loadNotes = useStore((state) => state.loadNotes)
  const loadSavedNotes = useStore((state) => state.loadSavedNotes)

  const [activityFilter, setActivityFilter] = useState('all')

  // Forms
  const [showDeadlineForm, setShowDeadlineForm] = useState(false)
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    course: '',
    date: 'Oct 24, 2026',
    urgency: 'normal',
  })

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    subject: 'Mathematics',
    target: 10,
    unit: 'topics',
  })

  useEffect(() => {
    loadDashboardData()
    loadNotes()
    loadSavedNotes()
  }, [loadDashboardData, loadNotes, loadSavedNotes])

  // Handlers for Deadlines
  const handleToggleDeadline = (id, currentCompleted) => {
    toggleDeadline(id, !currentCompleted)
    toast.success('Deadline status updated')
  }

  const handleAddDeadline = async (e) => {
    e.preventDefault()
    if (!newDeadline.title.trim()) {
      toast.error('Please enter a deadline title')
      return
    }
    await addDeadline({
      title: newDeadline.title,
      course: newDeadline.course || 'Independent Study',
      date: newDeadline.date,
      urgency: newDeadline.urgency,
    })
    setNewDeadline({ title: '', course: '', date: 'Oct 24, 2026', urgency: 'normal' })
    setShowDeadlineForm(false)
    toast.success('Deadline saved!')
  }

  // Handlers for Study Goals
  const handleIncrementGoal = (id, currentVal) => {
    updateGoalProgress(id, currentVal + 1)
    toast.success('Goal progress updated!')
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()
    if (!newGoal.title.trim()) {
      toast.error('Please enter a goal title')
      return
    }
    await addGoal({
      title: newGoal.title,
      subject: newGoal.subject,
      target: Number(newGoal.target) || 5,
      unit: newGoal.unit || 'modules',
    })
    setNewGoal({ title: '', subject: 'Mathematics', target: 10, unit: 'topics' })
    setShowGoalForm(false)
    toast.success('Study goal added!')
  }

  const deadlines = dashboard.deadlines || []
  const goals = dashboard.goals || []
  const activities = dashboard.activities || []
  const stats = dashboard.stats || {}

  const filteredActivities = activities.filter((act) => {
    if (activityFilter === 'all') return true
    return act.type === activityFilter
  })

  const studentName = user?.name || user?.email?.split('@')[0] || 'Learner'
  const activeDeadlinesCount = deadlines.filter((d) => !d.completed).length
  const completedGoalsCount = goals.filter((g) => g.current >= g.target).length

  return (
    <div className="space-y-8 pb-12">
      {/* 1. WELCOME HEADER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <span>Academic Workspace</span>
              <span aria-hidden="true">·</span>
              <span>Personalized Study Hub</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {studentName}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              You have <span className="font-semibold text-amber-700">{activeDeadlinesCount} pending deadlines</span>,{' '}
              <span className="font-semibold text-blue-700">{goals.length} active study goals</span>, and{' '}
              <span className="font-semibold text-slate-800">{notes.length} notes</span> available in your workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setShowGoalForm(true)} className="gap-1.5">
              <Plus size={15} className="text-slate-500" />
              <span>Add Goal</span>
            </Button>
            <Button variant="secondary" onClick={() => setShowDeadlineForm(true)} className="gap-1.5">
              <Calendar size={15} className="text-slate-500" />
              <span>New Deadline</span>
            </Button>
            <Button to={ROUTES.UPLOAD} variant="primary" className="gap-1.5">
              <Plus size={15} />
              <span>Upload Notes</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. OVERVIEW STATISTICS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Current Streak"
          value={stats.streak || '1 Day'}
          trend={stats.streakTrend || 'Active study consistency'}
          description="Daily study activity tracked"
          icon={<Flame size={20} className="text-amber-500" />}
        />
        <Card
          title="Study Time Logged"
          value={stats.studyHours || '0.0 hrs'}
          trend={stats.studyHoursTrend || 'Revision time'}
          description="Hours invested in notes and practice"
          icon={<Clock size={20} className="text-blue-600" />}
        />
        <Card
          title="Library Resources"
          value={`${notes.length} Notes`}
          trend={`${savedNotes.length} saved bookmarks`}
          description="Your active study material"
          icon={<BookOpen size={20} className="text-indigo-600" />}
        />
        <Card
          title="Goal Completion"
          value={goals.length > 0 ? `${Math.round((completedGoalsCount / goals.length) * 100)}%` : '0%'}
          trend={`${completedGoalsCount} of ${goals.length} completed`}
          description="Target milestones achieved"
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
        />
      </section>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: RECENT ACTIVITY & RESUME STUDY (7 COLS) */}
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500">Real-time log of your study uploads, notes, and saves</p>
              </div>

              {activities.length > 0 && (
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActivityFilter('all')}
                    className={`rounded-md px-2.5 py-1 transition ${
                      activityFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('upload')}
                    className={`rounded-md px-2.5 py-1 transition ${
                      activityFilter === 'upload'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Uploads
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('save')}
                    className={`rounded-md px-2.5 py-1 transition ${
                      activityFilter === 'save'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bookmarks
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => (
                  <div key={act.id} className="py-4 first:pt-2 last:pb-0 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        {act.type === 'upload' ? (
                          <UploadCloud size={16} />
                        ) : act.type === 'save' ? (
                          <Bookmark size={16} />
                        ) : (
                          <BookOpen size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{act.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-blue-700">{act.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span>{act.time}</span>
                          {act.score && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-slate-700">{act.score}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {act.link && (
                      <Link
                        to={act.link}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                      >
                        <span>{act.actionText || 'View'}</span>
                        <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-slate-500 space-y-3">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">No recent activity recorded yet</p>
                    <p className="text-slate-400 max-w-xs mx-auto mt-1">
                      Upload your first study document or bookmark notes in Explore to see your activity timeline here.
                    </p>
                  </div>
                  <Button to={ROUTES.UPLOAD} variant="primary" size="sm" className="gap-1.5">
                    <UploadCloud size={14} />
                    <span>Upload First Note</span>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ACTIVE LIBRARY NOTES */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Study Resources</h2>
                <p className="text-xs text-slate-500">Access your uploaded notes and saved guides</p>
              </div>
              <Link to={ROUTES.EXPLORE} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Explore All Notes →
              </Link>
            </div>

            <div className="mt-4">
              {notes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {notes.slice(0, 4).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-50 hover:border-slate-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-blue-700">{note.subject}</span>
                          <span>{note.difficulty || 'Medium'}</span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900 line-clamp-1">{note.title}</h3>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">{note.description}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
                        <span className="text-slate-500">By {note.uploader}</span>
                        {note.file_url && note.file_url !== '#' ? (
                          <a
                            href={note.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Download File →
                          </a>
                        ) : (
                          <Link
                            to={`${ROUTES.EXPLORE}?subject=${encodeURIComponent(note.subject)}`}
                            className="font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Study Note →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <p className="font-medium text-slate-700">No notes in your workspace yet.</p>
                  <p className="mt-1">Upload a PDF or lecture notes to get started.</p>
                  <Link
                    to={ROUTES.UPLOAD}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <span>Upload Notes</span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: DEADLINES & GOALS (5 COLS) */}
        <div className="space-y-6 lg:col-span-5">
          {/* UPCOMING DEADLINES WIDGET */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
                <p className="text-xs text-slate-500">Exams, assignments, and submission targets</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeadlineForm(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                title="Add deadline"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {deadlines.length > 0 ? (
                deadlines.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${
                      item.completed
                        ? 'border-slate-200/60 bg-slate-50/60 opacity-60'
                        : item.urgency === 'urgent'
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleDeadline(item.id, item.completed)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                        item.completed
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white hover:border-blue-500'
                      }`}
                    >
                      {item.completed && <Check size={12} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-semibold truncate ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.urgency === 'urgent' && !item.completed && (
                          <span className="shrink-0 text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{item.course}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {item.date}
                        </span>
                        <span className="font-medium text-slate-700">
                          {item.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  <p>No deadlines scheduled yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowDeadlineForm(true)}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    + Add your first deadline
                  </button>
                </div>
              )}
            </div>

            {/* Inline Deadline Form */}
            {showDeadlineForm && (
              <form onSubmit={handleAddDeadline} className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-900">Add New Deadline</p>
                <input
                  type="text"
                  placeholder="e.g. Physics Midterm Exam"
                  value={newDeadline.title}
                  onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Course / Topic name"
                  value={newDeadline.course}
                  onChange={(e) => setNewDeadline({ ...newDeadline, course: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Date (e.g. Oct 24, 2026)"
                    value={newDeadline.date}
                    onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                  <select
                    value={newDeadline.urgency}
                    onChange={(e) => setNewDeadline({ ...newDeadline, urgency: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeadlineForm(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                  >
                    Save Deadline
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* CURRENT STUDY GOALS WIDGET */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Current Study Goals</h2>
                <p className="text-xs text-slate-500">Track target topics and module milestones</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalForm(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                title="Add goal"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {goals.length > 0 ? (
                goals.map((g) => {
                  const percent = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0
                  const isComplete = g.current >= g.target

                  return (
                    <div key={g.id} className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-blue-700">{g.subject}</span>
                          <h4 className="text-sm font-semibold text-slate-900 truncate">{g.title}</h4>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-slate-900 tabular-nums">
                          {percent}%
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isComplete ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                        <span className="tabular-nums">
                          {g.current} of {g.target} {g.unit || 'modules'} completed
                        </span>
                        {!isComplete ? (
                          <button
                            type="button"
                            onClick={() => handleIncrementGoal(g.id, g.current)}
                            className="font-semibold text-blue-600 hover:text-blue-800 transition"
                          >
                            +1 Step
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <Check size={13} /> Mastered
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  <p>No study goals created yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(true)}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    + Set your first study goal
                  </button>
                </div>
              )}
            </div>

            {/* Inline Goal Form */}
            {showGoalForm && (
              <form onSubmit={handleAddGoal} className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-900">Add Study Goal</p>
                <input
                  type="text"
                  placeholder="e.g. Complete Mechanics Problem Sets"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newGoal.subject}
                    onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Target count"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

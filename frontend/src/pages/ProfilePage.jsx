import { useState } from 'react'
import { User, Flame, BookOpen, ShieldCheck, Check } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import toast from 'react-hot-toast'

function ProfilePage() {
  const user = useAuthStore((state) => state.auth?.user)
  const [subjects, setSubjects] = useState(
    user?.followedSubjects || ['Physics', 'Mathematics', 'Computer Science']
  )
  const [name, setName] = useState(user?.name || 'StudyPin Student')

  const toggleSubject = (s) => {
    if (subjects.includes(s)) {
      setSubjects(subjects.filter((item) => item !== s))
    } else {
      setSubjects([...subjects, s])
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    toast.success('Study preferences saved!')
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-sm">
            {(name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{name}</h1>
            <p className="text-xs text-slate-500">{user?.email || 'student@studypin.edu'}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                <Flame size={14} className="text-amber-500" />
                <span>14 Day Streak</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Verified Student Account</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || 'student@studypin.edu'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500 outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Followed Academic Subjects</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Personalizes your dashboard deadlines, AI recommendations, and study guides.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {['Physics', 'Mathematics', 'Computer Science', 'Chemistry', 'Biology', 'Engineering', 'AI & ML'].map(
              (subject) => {
                const isSelected = subjects.includes(subject)
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check size={13} />}
                    <span>{subject}</span>
                  </button>
                )
              }
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfilePage

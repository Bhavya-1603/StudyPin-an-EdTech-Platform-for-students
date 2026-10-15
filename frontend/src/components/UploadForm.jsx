import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../utils/api'
import { useAuthStore } from '../store/useStore'
import {
  UploadCloud,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowRight,
  BookOpen,
  Atom,
  Landmark,
  Calculator,
  Code2,
  Library,
  Cpu,
  FolderPlus,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  {
    id: 'Science',
    label: 'Science',
    icon: Atom,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    subjects: ['Physics', 'Chemistry', 'Biology', 'Organic Chemistry', 'Wave Optics', 'Genetics', 'Astronomy'],
  },
  {
    id: 'History',
    label: 'History',
    icon: Landmark,
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    subjects: ['World History', 'Modern History', 'Ancient Civilizations', 'European History', 'Civics & Politics', 'Revolutions'],
  },
  {
    id: 'Math',
    label: 'Math',
    icon: Calculator,
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    subjects: ['Calculus', 'Linear Algebra', 'Statistics & Probability', 'Trigonometry', 'Geometry', 'Differential Equations'],
  },
  {
    id: 'Computer Science',
    label: 'Computer Science',
    icon: Code2,
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    subjects: ['Data Structures & Algorithms', 'AI & Machine Learning', 'Operating Systems', 'Web Development', 'Computer Networks'],
  },
  {
    id: 'Literature',
    label: 'Literature',
    icon: Library,
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    subjects: ['English Literature', 'World Literature', 'Rhetoric & Composition', 'Poetics & Drama', 'Linguistics'],
  },
  {
    id: 'Engineering',
    label: 'Engineering',
    icon: Cpu,
    color: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    subjects: ['Mechanical Engineering', 'Circuits & Electronics', 'GATE Preparation', 'Civil Engineering', 'Thermodynamics'],
  },
  {
    id: 'Other',
    label: 'Other',
    icon: FolderPlus,
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    subjects: ['Economics', 'Psychology', 'Business Studies', 'General Studies', 'Philosophy'],
  },
]

function UploadForm({ onUpload, initialCategory = 'Science' }) {
  const token = useAuthStore((state) => state.auth?.token)
  const fileInputRef = useRef(null)

  const activeInitial = CATEGORIES.find(
    (c) => c.id.toLowerCase() === (initialCategory || '').toLowerCase()
  )?.id || 'Science'

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: activeInitial,
    subject: CATEGORIES.find((c) => c.id === activeInitial)?.subjects[0] || 'Physics',
    customSubject: '',
    tags: '',
    file: null,
  })

  useEffect(() => {
    if (initialCategory) {
      const match = CATEGORIES.find((c) => c.id.toLowerCase() === initialCategory.toLowerCase())
      if (match) {
        setForm((prev) => ({
          ...prev,
          category: match.id,
          subject: match.subjects[0] || 'General',
        }))
      }
    }
  }, [initialCategory])

  const [status, setStatus] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const currentCategoryObj = CATEGORIES.find((c) => c.id === form.category) || CATEGORIES[0]

  const handleCategorySelect = (categoryId) => {
    const catObj = CATEGORIES.find((c) => c.id === categoryId)
    setForm((prev) => ({
      ...prev,
      category: categoryId,
      subject: catObj ? catObj.subjects[0] : 'General',
      customSubject: '',
    }))
  }

  const handleChange = (field) => (event) => {
    const value = field === 'file' ? event.target.files[0] : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const dropped = event.dataTransfer.files[0]
    if (dropped) {
      setForm((current) => ({ ...current, file: dropped }))
      setStatus(`Selected file: ${dropped.name}`)
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    const finalSubject = form.customSubject.trim() || form.subject || 'General'

    if (!form.title || !form.description || !form.file) {
      setStatus('Please provide a title, description, and upload a study file.')
      toast.error('Missing required fields')
      return
    }

    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('description', form.description)
    payload.append('category', form.category)
    payload.append('subject', finalSubject)
    payload.append('tags', form.tags)
    payload.append('file', form.file)

    setStatus(`Uploading and categorizing note under ${form.category}...`)
    setProgress(20)
    setAnalysis(null)

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          setStatus(`Upload complete! Categorized under ${form.category}.`)
          setAnalysis(result.analysis)
          onUpload?.(result.note)
          setForm({
            title: '',
            description: '',
            category: form.category,
            subject: currentCategoryObj.subjects[0] || 'General',
            customSubject: '',
            tags: '',
            file: null,
          })
          toast.success(`Note saved to ${result.note?.category || form.category} library!`)
        } catch {
          setStatus('Upload complete.')
        }
      } else {
        try {
          const result = JSON.parse(xhr.responseText || '{}')
          setStatus(result.error || 'Upload error. Try again.')
          toast.error(result.error || 'Upload error')
        } catch {
          setStatus('Upload failed.')
        }
      }
      setProgress(0)
    }

    xhr.onerror = () => {
      setStatus('Unable to connect to server.')
      toast.error('Network error while uploading')
      setProgress(0)
    }

    xhr.open('POST', apiUrl('/api/notes/upload'))
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    } else {
      xhr.setRequestHeader('Authorization', `Bearer demo-user-token`)
    }
    xhr.send(payload)
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Upload & Categorize Study Resource</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a primary academic category, specify the subject topic, and attach your notes.
          </p>
        </div>
        <span className="self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Selected: {form.category}
        </span>
      </div>

      <form className="mt-6 space-y-6" onSubmit={handleUpload}>
        {/* 1. Primary Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Resource Category * <span className="font-normal text-slate-400">(Choose primary field)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isSelected = form.category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-100 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          className={`rounded-xl border-2 border-dashed p-7 text-center transition ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
          }`}
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UploadCloud size={20} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            {form.file ? form.file.name : 'Drag & drop your study file here'}
          </p>
          <p className="mt-1 text-xs text-slate-500">PDF, DOCX, PPTX, PNG or JPG up to 15MB</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {form.file ? 'Change File' : 'Browse Local Files'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleChange('file')}
        />

        {/* 3. Title & Subject */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Title *</label>
            <input
              value={form.title}
              onChange={handleChange('title')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={
                form.category === 'History'
                  ? 'e.g. World War II Timeline & Treaties'
                  : form.category === 'Math'
                  ? 'e.g. Multivariable Calculus Formulas'
                  : 'e.g. Wave Optics Chapter Summary'
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Topic * <span className="font-normal text-slate-400">({form.category})</span>
            </label>
            <div className="space-y-2">
              <select
                value={form.subject}
                onChange={handleChange('subject')}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {currentCategoryObj.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
                <option value="Custom">Custom Topic...</option>
              </select>

              {form.subject === 'Custom' && (
                <input
                  value={form.customSubject}
                  onChange={handleChange('customSubject')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Type specific course or subject name..."
                />
              )}
            </div>
          </div>
        </div>

        {/* 4. Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Overview Description *</label>
          <textarea
            value={form.description}
            onChange={handleChange('description')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            rows="3"
            placeholder="Highlight core concepts, key equations, timeline dates, or exam context..."
          />
        </div>

        {/* 5. Study Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Study Tags (optional)</label>
          <input
            value={form.tags}
            onChange={handleChange('tags')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder={
              form.category === 'History'
                ? 'e.g. Modern, Revolutions, Cold War, NCERT'
                : form.category === 'Math'
                ? 'e.g. JEE, Integrals, Formulas, Proofs'
                : 'e.g. Formulas, Revision, CheatSheet'
            }
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <UploadCloud size={17} />
          <span>Save & Categorize Resource</span>
        </button>
      </form>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Uploading to {form.category}...</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status && <p className="mt-3 text-xs text-slate-500">{status}</p>}

      {/* AI Extraction Analysis */}
      {analysis && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
              <Sparkles size={14} className="text-blue-600" />
              <span>AI Categorization & Extraction</span>
            </div>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
              {form.category}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">{analysis.summary}</p>
          <div className="grid gap-2 sm:grid-cols-2 pt-2 text-xs">
            <div className="rounded-lg bg-white p-3 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Key Topics:</span>
              <p className="mt-1 text-slate-600">{analysis.keyTopics?.join(', ') || 'Concepts, Review points'}</p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Difficulty Score:</span>
              <p className="mt-1 text-slate-600">{analysis.difficultyScore || 45} / 100</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-200/60">
            <Link
              to={`/dashboard`}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <span>View on Dashboard</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              to={`/explore?category=${encodeURIComponent(form.category)}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>Explore {form.category} Notes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadForm

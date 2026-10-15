import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../utils/api'
import { useAuthStore } from '../store/useStore'
import { UploadCloud, CheckCircle2, FileText, Sparkles, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

function UploadForm({ onUpload }) {
  const token = useAuthStore((state) => state.auth?.token)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({ title: '', description: '', subject: 'Mathematics', tags: '', file: null })
  const [status, setStatus] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

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

    if (!form.title || !form.description || !form.file) {
      setStatus('Please provide a title, description, and upload file.')
      toast.error('Missing required fields')
      return
    }

    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('description', form.description)
    payload.append('subject', form.subject)
    payload.append('tags', form.tags)
    payload.append('file', form.file)

    setStatus('Uploading and analyzing material...')
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
          setStatus('Upload complete! AI insights generated.')
          setAnalysis(result.analysis)
          onUpload?.(result.note)
          setForm({ title: '', description: '', subject: 'Mathematics', tags: '', file: null })
          toast.success('Study material uploaded successfully!')
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
      // Demo upload fallback token
      xhr.setRequestHeader('Authorization', `Bearer demo-user-token`)
    }
    xhr.send(payload)
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Add Study Resource</h2>
      <p className="mt-1 text-xs text-slate-500">
        Upload your PDF, DOCX, slides, or diagrams to index topics and create summaries.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleUpload}>
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
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
            className="mt-4 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Title *</label>
            <input
              value={form.title}
              onChange={handleChange('title')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Wave Optics Chapter Summary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Subject *</label>
            <select
              value={form.subject}
              onChange={handleChange('subject')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'AI & ML', 'GATE', 'NEET'].map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Overview Description *</label>
          <textarea
            value={form.description}
            onChange={handleChange('description')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            rows="3"
            placeholder="Key concepts, formula highlights, or exam context..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Study Tags (optional)</label>
          <input
            value={form.tags}
            onChange={handleChange('tags')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. NCERT, JEE, Formulas, Revision"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Upload and Generate Insights
        </button>
      </form>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Uploading...</span>
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
            <Sparkles size={14} className="text-blue-600" />
            <span>AI Knowledge Extraction</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">{analysis.summary}</p>
          <div className="grid gap-2 sm:grid-cols-2 pt-2 text-xs">
            <div className="rounded-lg bg-white p-3 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Key Topics:</span>
              <p className="mt-1 text-slate-600">{analysis.keyTopics?.join(', ') || 'Concepts, Formulas'}</p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200/80">
              <span className="font-semibold text-slate-800">Difficulty Score:</span>
              <p className="mt-1 text-slate-600">{analysis.difficultyScore || 45} / 100</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-200/60">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <span>View on Dashboard</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>Explore All Notes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadForm

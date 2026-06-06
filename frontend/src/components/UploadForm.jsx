import { useRef, useState } from 'react'
import { apiUrl } from '../utils/api'
import { useAuthStore } from '../store/useStore'

function UploadForm({ onUpload }) {
  const token = useAuthStore((state) => state.auth.token)
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
      setStatus(`Ready to upload ${dropped.name}`)
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!token) {
      setStatus('Sign in to upload study materials.')
      return
    }

    if (!form.title || !form.description || !form.file) {
      setStatus('Complete the title, description, and file fields.')
      return
    }

    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('description', form.description)
    payload.append('subject', form.subject)
    payload.append('tags', form.tags)
    payload.append('file', form.file)

    setStatus('Uploading your resource...')
    setProgress(0)
    setAnalysis(null)

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText)
        setStatus('Upload complete. AI insights generated.')
        setAnalysis(result.analysis)
        onUpload?.(result.note)
        setForm({ title: '', description: '', subject: 'Mathematics', tags: '', file: null })
      } else {
        const result = JSON.parse(xhr.responseText || '{}')
        setStatus(result.error || 'Upload failed. Try again.')
      }
      setProgress(0)
    }

    xhr.onerror = () => {
      setStatus('Unable to upload file. Please try again.')
      setProgress(0)
    }

    xhr.open('POST', apiUrl('/api/notes/upload'))
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(payload)
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
      <h3 className="text-xl font-semibold text-white">Upload study material</h3>
      <p className="mt-2 text-sm text-slate-400">Drop your PDF, DOCX, PPTX, or image here and let StudyPin create AI summaries and metadata.</p>

      <form className="mt-6 space-y-5" onSubmit={handleUpload}>
        <div
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          className={`rounded-3xl border-2 ${dragActive ? 'border-sky-400 bg-slate-950/90' : 'border-dashed border-slate-700 bg-slate-950/80'} p-8 text-center transition`}
        >
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Drag & drop file</p>
          <p className="mt-4 text-lg font-semibold text-white">Drop notes, slides, or mind maps here</p>
          <p className="mt-2 text-sm text-slate-400">or tap to choose a file</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Browse files
          </button>
          {form.file && <p className="mt-4 text-sm text-slate-200">Selected file: {form.file.name}</p>}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleChange('file')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={form.title}
            onChange={handleChange('title')}
            className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-sky-400"
            placeholder="Resource title"
          />
          <select
            value={form.subject}
            onChange={handleChange('subject')}
            className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-sky-400"
          >
            {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'AI & ML', 'JEE', 'NEET', 'UPSC', 'GATE'].map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={form.description}
          onChange={handleChange('description')}
          className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none focus:border-sky-400"
          rows="4"
          placeholder="Resource description"
        />

        <input
          value={form.tags}
          onChange={handleChange('tags')}
          className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-sky-400"
          placeholder="Tags (comma-separated)"
        />

        <button type="submit" className="w-full rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
          Upload and generate insights
        </button>
      </form>

      {progress > 0 && (
        <div className="mt-5 rounded-3xl bg-slate-950/90 p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Upload progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-sky-500 transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}

      {analysis && (
        <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/90 p-4">
          <p className="text-sm uppercase tracking-[0.26em] text-sky-300">AI insights</p>
          <p className="mt-3 text-sm text-slate-200">{analysis.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Keywords</p>
              <p className="mt-2">{analysis.keyTopics.join(', ')}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Difficulty score</p>
              <p className="mt-2">{analysis.difficultyScore}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadForm

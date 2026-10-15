import { useSearchParams } from 'react-router-dom'
import UploadForm from '../components/UploadForm'
import { Card } from '../components/ui/Card'
import { useAuthStore, useStore } from '../store/useStore'
import { Sparkles, FileText, CheckCircle2, Layers } from 'lucide-react'

function UploadPage() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'Science'
  const token = useAuthStore((state) => state.auth?.token)
  const addNote = useStore((state) => state.addNote)

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Upload Studio</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Upload Notes & Categorize Resources
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Upload study materials across Science, History, Math, Computer Science, and Engineering. StudyPin classifies your document, generates conceptual outlines, and indexes it directly to your student dashboard.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <UploadForm initialCategory={initialCategory} onUpload={(note) => addNote(note)} />
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Layers size={17} className="text-blue-600" />
              <span>Categorization System</span>
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Assigned categories automatically index your study resources into filtered views on your Dashboard and Explore catalog.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-700">🔬 Science</span>
                <span className="text-slate-400">Physics, Chem, Bio</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-700">📜 History</span>
                <span className="text-slate-400">World, Civics, Ancient</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-700">📐 Math</span>
                <span className="text-slate-400">Calculus, Linear Alg</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-700">💻 CS</span>
                <span className="text-slate-400">DSA, AI & ML, Systems</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900">Supported Formats</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>PDF Documents (scanned or digital)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Word (.docx) & PowerPoint (.pptx)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>PNG & JPEG lecture photos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage

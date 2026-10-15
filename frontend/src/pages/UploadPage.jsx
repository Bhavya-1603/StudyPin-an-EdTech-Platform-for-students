import UploadForm from '../components/UploadForm'
import { Card } from '../components/ui/Card'
import { useAuthStore, useStore } from '../store/useStore'
import { Sparkles, FileText, CheckCircle2 } from 'lucide-react'

function UploadPage() {
  const token = useAuthStore((state) => state.auth?.token)
  const addNote = useStore((state) => state.addNote)

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Upload Studio</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Upload Notes & Generate AI Summaries
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Drag and drop study materials (PDF, DOCX, slides, or images). StudyPin extracts key concepts, generates flashcard prompts, and organizes your materials automatically.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <UploadForm onUpload={(note) => addNote(note)} />
        </div>

        <div className="space-y-4 lg:col-span-4">
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

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-2">
            <h3 className="font-semibold text-slate-900">Automatic Extraction</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Every document is scanned for core formulas, definitions, and high-frequency exam topics to generate quick revision summaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage

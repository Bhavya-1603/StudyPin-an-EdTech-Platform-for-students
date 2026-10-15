import { useState, useEffect } from 'react'
import { BookOpen, Bookmark, Eye, Check, Download, FileText } from 'lucide-react'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'

function NoteCard({ note, onSave, isSaved = false }) {
  const storeSaveNote = useStore((state) => state.saveNote)
  const savedNotes = useStore((state) => state.savedNotes)

  const isActuallySaved = isSaved || savedNotes.some((n) => n.id === note.id)
  const [saved, setSaved] = useState(isActuallySaved)

  useEffect(() => {
    setSaved(isSaved || savedNotes.some((n) => n.id === note.id))
  }, [isSaved, savedNotes, note.id])

  const handleSaveToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const nextSaved = !saved
    setSaved(nextSaved)
    if (onSave) {
      onSave(note, nextSaved)
    } else {
      await storeSaveNote(note, nextSaved)
    }
    toast.success(nextSaved ? 'Note saved to library' : 'Removed from saved notes')
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md hover:border-slate-300">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {note.thumbnail ? (
          <img
            src={note.thumbnail}
            alt={note.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600">
            <FileText size={36} className="text-blue-500/70" />
            <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
              {note.subject}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={handleSaveToggle}
            className={`flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-md transition ${
              saved
                ? 'bg-blue-600 text-white'
                : 'bg-white/90 text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm'
            }`}
            title={saved ? 'Remove from saved' : 'Save note'}
          >
            {saved ? <Check size={14} /> : <Bookmark size={14} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="text-blue-700 font-semibold">{note.subject}</span>
          <span aria-hidden="true">·</span>
          <span>{note.difficulty || 'Medium'}</span>
          {note.views !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Eye size={12} /> {note.views}
              </span>
            </>
          )}
        </div>

        <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {note.title}
        </h3>

        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600 line-clamp-2">
          {note.description}
        </p>

        {note.tags && note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700">By {note.uploader || 'Student'}</span>
          {note.file_url && note.file_url !== '#' ? (
            <a
              href={note.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
            >
              <Download size={13} />
              <span>Download</span>
            </a>
          ) : (
            <span>{note.uploaded_at ? new Date(note.uploaded_at).toLocaleDateString() : 'Recent'}</span>
          )}
        </div>
      </div>
    </article>
  )
}

export default NoteCard

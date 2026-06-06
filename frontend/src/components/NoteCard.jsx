function NoteCard({ note }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 hover:border-sky-400/50">
      <div className="relative overflow-hidden bg-slate-800">
        <img src={note.thumbnail} alt={note.title} className="h-52 w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-sky-300">
          <span>{note.subject}</span>
          <span>{note.difficulty}</span>
        </div>
        <h3 className="text-lg font-semibold text-white">{note.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{note.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span>{note.uploader}</span>
          <span>{new Date(note.uploaded_at).toLocaleDateString()}</span>
        </div>
      </div>
    </article>
  )
}

export default NoteCard

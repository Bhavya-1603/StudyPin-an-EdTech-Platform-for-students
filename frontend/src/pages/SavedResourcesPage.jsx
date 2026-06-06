function SavedResourcesPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.26em] text-sky-300">Saved resources</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Your learning library</h1>
        <p className="mt-3 text-slate-400">Access the notes and resources you've saved for future study sessions.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6">
          <p className="text-lg font-semibold text-white">Physics Summary Pack</p>
          <p className="mt-2 text-slate-400">Mechanics, optics, and revision notes.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6">
          <p className="text-lg font-semibold text-white">AI Learning Guide</p>
          <p className="mt-2 text-slate-400">Suggested study workflow for smarter revision.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6">
          <p className="text-lg font-semibold text-white">Chemistry Formula Sheet</p>
          <p className="mt-2 text-slate-400">Essential equations and exam-ready notes.</p>
        </div>
      </div>
    </div>
  )
}

export default SavedResourcesPage

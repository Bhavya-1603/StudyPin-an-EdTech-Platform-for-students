function ProfilePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.26em] text-sky-300">Profile</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Your StudyPin account</h1>
        <p className="mt-3 text-slate-400">Manage your preferences, saved subjects, and AI recommendation settings.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.65fr_0.35fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">Account details</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Name</p>
              <p className="mt-2 text-white">StudyPin Learner</p>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Email</p>
              <p className="mt-2 text-white">student@example.com</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">Study preferences</h2>
          <div className="mt-6 space-y-4">
            <p className="text-slate-300">Keep your followed subjects updated so AI suggestions stay relevant.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

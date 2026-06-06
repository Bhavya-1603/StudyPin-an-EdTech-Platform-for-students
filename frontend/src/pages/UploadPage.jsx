import UploadForm from '../components/UploadForm'
import { Card } from '../components/ui/Card'
import { useAuthStore, useStore } from '../store/useStore'

function UploadPage() {
  const token = useAuthStore((state) => state.auth.token)
  const addNote = useStore((state) => state.addNote)

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.26em] text-sky-300">Upload Studio</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Upload files and get instant AI summaries.</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Drag and drop study material to create intelligent resources with tags, analysis, and learning recommendations.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.65fr_0.35fr]">
        <UploadForm onUpload={(note) => addNote(note)} />

        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow">
          <Card title={token ? 'Ready to upload' : 'Sign in required'} description={token ? 'Start uploading your notes with AI-powered extraction.' : 'Sign in to unlock upload, recommendations, and saved resources.'} />
          <Card title="AI analysis" description="Every upload is analyzed to produce summaries, tags, and topic recommendations." />
          <Card title="Smart suggestions" description="Saved uploads help personalize future notes and discover related resources." />
        </div>
      </div>
    </div>
  )
}

export default UploadPage

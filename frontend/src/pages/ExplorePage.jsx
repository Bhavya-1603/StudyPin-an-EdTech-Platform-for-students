import { Card } from '../components/ui/Card'

function ExplorePage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.26em] text-sky-300">Explore</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Find the best notes and study guides.</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Browse curated resources by subject, popularity, and AI relevance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Physics" description="Mechanics, optics, thermodynamics, and modern physics." />
        <Card title="Chemistry" description="Organic, inorganic, physical, and reaction guides." />
        <Card title="Mathematics" description="Calculus, algebra, statistics, and formula sheets." />
        <Card title="Computer Science" description="DSA, systems, AI, and programming notes." />
        <Card title="Biology" description="NEET guides, diagrams, and concept summaries." />
        <Card title="Engineering" description="Exam-ready diagrams, formulas, and workflows." />
      </div>
    </div>
  )
}

export default ExplorePage

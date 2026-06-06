function SearchBar({ value, onChange }) {
  return (
    <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-3 shadow-inner shadow-slate-950/20">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-none bg-transparent px-4 py-4 text-white outline-none placeholder:text-slate-500"
        placeholder="Search notes, formulas, PDFs, topics..."
        aria-label="Search study notes"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
    </div>
  )
}

export default SearchBar

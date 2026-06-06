function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}

export default AuthLayout

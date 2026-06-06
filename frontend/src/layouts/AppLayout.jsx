import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/navigation/Header'
import Footer from '../components/navigation/Footer'
import { useAuthStore } from '../store/useStore'

function AppLayout() {
  const initializeSession = useAuthStore((state) => state.initializeSession)

  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ProtectedRoute from './ProtectedRoute'

const HomePage = lazy(() => import('../pages/HomePage'))
const ExplorePage = lazy(() => import('../pages/ExplorePage'))
const UploadPage = lazy(() => import('../pages/UploadPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const SavedResourcesPage = lazy(() => import('../pages/SavedResourcesPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const AuthPage = lazy(() => import('../pages/AuthPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-slate-950 px-4 py-24 text-center text-white">Loading StudyPin...</div>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/saved" element={<SavedResourcesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRoutes

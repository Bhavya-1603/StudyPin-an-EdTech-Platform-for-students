import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'

function ProtectedRoute() {
  const token = useAuthStore((state) => state.auth?.token || state.token) || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null)

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

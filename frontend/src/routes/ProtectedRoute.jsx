import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

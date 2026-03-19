import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // 未登入時強制導向登入頁，並帶上原本想去的路由，以便登入後自動轉跳
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

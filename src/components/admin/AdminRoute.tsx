import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function AdminRoute() {
  const { user, isAdmin, isInitialized } = useAuthStore()

  if (!isInitialized) return null

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

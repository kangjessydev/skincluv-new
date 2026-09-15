import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function AdminRoute() {
  const { user, isAdmin, isInitialized } = useAuthStore()

  if (!isInitialized) return null

  if (!user || !isAdmin) {
    if (import.meta.env.DEV) {
      console.warn('[AdminRoute] Akses ditolak, diarahkan ke /:', {
        isLoggedIn: !!user,
        email: user?.email ?? null,
        isAdmin,
      })
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

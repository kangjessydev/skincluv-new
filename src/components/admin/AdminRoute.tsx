import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

import LoadingScreen from '@/components/ui/LoadingScreen'

export default function AdminRoute() {
  const { user, isAdmin, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return <LoadingScreen />
  }

  if (!user) {
    if (import.meta.env.DEV) {
      console.warn('[AdminRoute] Belum login. Mengarahkan ke /login')
    }
    return <Navigate to="/login" state={{ from: '/admin' }} replace />
  }

  if (!isAdmin) {
    if (import.meta.env.DEV) {
      console.warn('[AdminRoute] Akses ditolak (bukan admin). Mengarahkan ke /:', {
        email: user.email,
        isAdmin,
      })
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

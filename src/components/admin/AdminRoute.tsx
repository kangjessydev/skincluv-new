import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

import LoadingScreen from '@/components/ui/LoadingScreen'

export default function AdminRoute() {
  const { user, isAdmin, userRoles, isInitialized, isLoading } = useAuthStore()

  if (!isInitialized || isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    if (import.meta.env.DEV) {
      console.warn('[AdminRoute] Belum login. Mengarahkan ke /login')
    }
    return <Navigate to="/login" state={{ from: '/admin' }} replace />
  }

  const isStaffAuthorized =
    isAdmin ||
    userRoles.some((r) =>
      ['super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer', 'admin'].includes(r)
    )

  if (!isStaffAuthorized) {
    if (import.meta.env.DEV) {
      console.warn('[AdminRoute] Akses ditolak (bukan staf admin). Mengarahkan ke /:', {
        email: user.email,
        isAdmin,
        userRoles,
      })
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

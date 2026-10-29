// src/components/profile/ProfileSubnav.tsx
// Sub-navigasi Mobile untuk Halaman-Halaman Profil & Pengaturan (RFC 020)
// Otomatis disembunyikan di layar desktop (.cluv-hide-desktop).
// Memungkinkan navigasi cepat 1-tap antar sub-halaman di layar mobile tanpa harus bolak-balik ke menu profil utama.

import { Link, useLocation } from 'react-router-dom'
import { Activity, ShieldCheck, Receipt, History, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface ProfileSubnavProps {
  className?: string
}

export function ProfileSubnav({ className = '' }: ProfileSubnavProps) {
  const location = useLocation()
  const { isAdmin, userRoles } = useAuthStore()

  const canAccessAdmin =
    isAdmin ||
    userRoles.some((r) =>
      ['super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer', 'admin'].includes(r)
    )

  const items = [
    {
      to: '/profile/skin',
      label: 'Profil Kulit',
      icon: Activity,
    },
    {
      to: '/privacy-center',
      label: 'Privasi Data',
      icon: ShieldCheck,
    },
    {
      to: '/transactions',
      label: 'Faktur Tagihan',
      icon: Receipt,
    },
    {
      to: '/coin-history',
      label: 'Mutasi Credits',
      icon: History,
    },
    ...(canAccessAdmin
      ? [
          {
            to: '/admin',
            label: 'Admin Panel',
            icon: Lock,
          },
        ]
      : []),
  ]

  return (
    <nav
      className={`cluv-hide-desktop cluv-profile-subnav-bar ${className}`.trim()}
      aria-label="Sub-navigasi Profil & Pengaturan"
    >
      <div className="cluv-profile-subnav-scroll">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`cluv-profile-subnav-pill ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={14} className="cluv-profile-subnav-icon" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default ProfileSubnav

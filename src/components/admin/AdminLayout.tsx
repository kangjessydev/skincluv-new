import { Outlet, NavLink, Link } from 'react-router-dom'
import { FileText, Cpu, LayoutDashboard, ArrowLeft, Target, CreditCard, Package } from 'lucide-react'

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/prompts', icon: FileText, label: 'Prompt & AI Features' },
  { to: '/admin/models', icon: Cpu, label: 'Model & API Key' },
  { to: '/admin/missions', icon: Target, label: 'Misi Glow' },
  { to: '/admin/pricing', icon: CreditCard, label: 'Paket & Kuota' },
  { to: '/admin/products', icon: Package, label: 'Produk Rekomendasi' },
]

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: 'inherit' }}>
      <aside
        style={{
          width: 250,
          borderRight: '1px solid #e5e7eb',
          background: '#ffffff',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 24, paddingLeft: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#6366f1',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Skincluv Admin
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
            Control Center
          </div>
        </div>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
            color: '#4b5563',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            background: '#f3f4f6',
            transition: 'background 0.15s ease',
          }}
        >
          <ArrowLeft size={15} /> Kembali ke App
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#374151',
                background: isActive ? '#111827' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
        <Outlet />
      </main>
    </div>
  )
}

import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  FileText,
  Cpu,
  LayoutDashboard,
  ArrowLeft,
  Target,
  CreditCard,
  Package,
  ScanFace,
  FlaskConical,
  MessageSquare,
  Activity,
} from 'lucide-react'

const configNavItems = [
  { to: '/admin/prompts', icon: FileText, label: 'Prompt & Fitur AI' },
  { to: '/admin/models', icon: Cpu, label: 'Model & API Key' },
  { to: '/admin/missions', icon: Target, label: 'Misi Glow' },
  { to: '/admin/pricing', icon: CreditCard, label: 'Paket & Kuota' },
  { to: '/admin/products', icon: Package, label: 'Produk Rekomendasi' },
]

const memoryNavItems = [
  { to: '/admin/memory/face-scans', icon: ScanFace, label: 'Scan Wajah' },
  { to: '/admin/memory/ingredient-scans', icon: FlaskConical, label: 'Scan Ingredient' },
  { to: '/admin/memory/chats', icon: MessageSquare, label: 'Chatbot Skinsistant' },
  { to: '/admin/memory/logs', icon: Activity, label: 'Log & Metrik AI' },
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
        <div style={{ marginBottom: 20, paddingLeft: 4 }}>
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

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
          <NavLink
            to="/admin"
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : '#374151',
              background: isActive ? '#111827' : 'transparent',
              transition: 'all 0.15s ease',
              marginBottom: 10,
            })}
          >
            <LayoutDashboard size={17} />
            Overview
          </NavLink>

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '6px 12px 2px 12px',
            }}
          >
            Konfigurasi Sistem
          </div>

          {configNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#374151',
                background: isActive ? '#111827' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '14px 12px 2px 12px',
            }}
          >
            Database & Memori AI
          </div>

          {memoryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#374151',
                background: isActive ? '#111827' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <item.icon size={17} />
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

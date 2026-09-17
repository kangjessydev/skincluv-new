import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  FileText,
  Cpu,
  LayoutDashboard,
  ArrowLeft,
  Target,
  CreditCard,
  Package,
  BookOpen,
  FileCode,
  Activity,
  TrendingUp,
  Users,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react'

const businessNavItems = [
  { to: '/admin/market-intelligence', icon: BarChart3, label: 'Tren & Riset Pasar' },
  { to: '/admin/transactions', icon: CreditCard, label: 'Riwayat Transaksi' },
  { to: '/admin/financials', icon: TrendingUp, label: 'Unit Economics AI' },
  { to: '/admin/pricing', icon: Layers, label: 'Paket & Biaya Kredit' },
]

const userNavItems = [
  { to: '/admin/users', icon: Users, label: 'Manajemen Pengguna' },
]

const configNavItems = [
  { to: '/admin/missions', icon: Target, label: 'Misi Glow' },
  { to: '/admin/products', icon: Package, label: 'Produk Rekomendasi' },
  { to: '/admin/prompts', icon: FileText, label: 'Prompt & Fitur AI' },
  { to: '/admin/models', icon: Cpu, label: 'Model & API Key' },
]

const aiHubNavItems = [
  { to: '/admin/knowledge/ingredients', icon: BookOpen, label: 'Kamus Bahan AI' },
  { to: '/admin/knowledge/formulas', icon: Sparkles, label: 'Formula & Cache' },
  { to: '/admin/training/datasets', icon: FileCode, label: 'Dataset & Fine-Tuning' },
  { to: '/admin/memory/logs', icon: Activity, label: 'Log & Metrik AI' },
]

function renderNavGroup(items: { to: string; icon: any; label: string }[]) {
  return items.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#ffffff' : '#374151',
        background: isActive ? '#111827' : 'transparent',
        transition: 'all 0.15s ease',
      })}
    >
      <item.icon size={16} />
      {item.label}
    </NavLink>
  ))
}

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: 'inherit' }}>
      <aside
        style={{
          width: 255,
          borderRight: '1px solid #e5e7eb',
          background: '#ffffff',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 16, paddingLeft: 4 }}>
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
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
            color: '#4b5563',
            textDecoration: 'none',
            padding: '7px 12px',
            borderRadius: 8,
            background: '#f3f4f6',
            transition: 'background 0.15s ease',
          }}
        >
          <ArrowLeft size={15} /> Kembali ke App
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          <NavLink
            to="/admin"
            end
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
              marginBottom: 8,
            })}
          >
            <LayoutDashboard size={17} />
            Overview
          </NavLink>

          {/* Bisnis & Keuangan */}
          <div style={groupHeaderStyle}>Bisnis & Keuangan</div>
          {renderNavGroup(businessNavItems)}

          {/* Pengguna & CRM */}
          <div style={groupHeaderStyle}>Pengguna & CRM</div>
          {renderNavGroup(userNavItems)}

          {/* Konfigurasi Sistem */}
          <div style={groupHeaderStyle}>Konfigurasi Sistem</div>
          {renderNavGroup(configNavItems)}

          {/* AI Knowledge & Training Hub */}
          <div style={groupHeaderStyle}>AI Brain & Training Hub</div>
          {renderNavGroup(aiHubNavItems)}
        </nav>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
        <Outlet />
      </main>
    </div>
  )
}

const groupHeaderStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '12px 12px 3px 12px',
}

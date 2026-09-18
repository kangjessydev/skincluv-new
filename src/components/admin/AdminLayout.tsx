import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
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
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react'
import './admin-responsive.css'

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

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Close drawer on resize to desktop (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const renderNavGroup = (items: { to: string; icon: any; label: string }[]) => {
    return items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={() => setIsMobileOpen(false)}
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
        <item.icon size={16} />
        {item.label}
      </NavLink>
    ))
  }

  return (
    <div className="admin-layout-root">
      {/* Top Bar for Mobile & Tablet (< 1024px) */}
      <header className="admin-top-bar">
        <div className="admin-top-bar-left">
          <button
            type="button"
            className="admin-hamburger-btn"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-label={isMobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="admin-top-bar-brand">
            <span className="admin-top-bar-sub">Skincluv</span>
            <span className="admin-top-bar-title">Control Center</span>
          </div>
        </div>

        <div className="admin-top-bar-right">
          <Link to="/" className="admin-back-app-pill" title="Kembali ke App Pengguna">
            <ArrowLeft size={14} />
            <span>Ke App</span>
          </Link>
        </div>
      </header>

      {/* Backdrop for Mobile Drawer */}
      <div
        className={`admin-sidebar-backdrop ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar (Permanent on Desktop, Drawer on Tablet/Mobile) */}
      <aside className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#6366f1',
                textTransform: 'uppercase',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ShieldCheck size={13} />
              Skincluv Admin
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Control Center
            </div>
          </div>

          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        <Link
          to="/"
          onClick={() => setIsMobileOpen(false)}
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
            onClick={() => setIsMobileOpen(false)}
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

      {/* Main Content Area */}
      <main className="admin-main-content">
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

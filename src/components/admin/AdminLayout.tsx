import { useState, useEffect, useMemo } from 'react'
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
  // FileCode,
  Activity,
  TrendingUp,
  Users,
  Layers,
  Sparkles,
  BarChart3,
  Menu,
  X,
  ShieldCheck,
  BookMarked,
  Server,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
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
  { to: '/admin/knowledge/handbook', icon: BookMarked, label: 'Buku Panduan Fitur' },
  { to: '/admin/knowledge/ingredients', icon: BookOpen, label: 'Kamus Bahan AI' },
  { to: '/admin/knowledge/formulas', icon: Sparkles, label: 'Formula & Cache' },
  // Deactivated for production readiness until human review & de-identification pipeline is established
  // { to: '/admin/training/datasets', icon: FileCode, label: 'Dataset & Fine-Tuning' },
  { to: '/admin/logs', icon: Activity, label: 'Log & Metrik AI' },
]

const governanceNavItems = [
  { to: '/admin/audit-logs', icon: ShieldCheck, label: 'Audit Log Tata Kelola' },
  { to: '/admin/system-health', icon: Server, label: 'Status & Kesehatan Sistem' },
]

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const { userRoles, isAdmin } = useAuthStore()

  const isSuper = useMemo(() => {
    return userRoles.includes('super_admin') || userRoles.includes('admin') || (!userRoles.length && isAdmin)
  }, [userRoles, isAdmin])

  const canSeeBusiness = useMemo(() => {
    return isSuper || userRoles.includes('business_lead')
  }, [isSuper, userRoles])

  const canSeeUsers = useMemo(() => {
    return isSuper || userRoles.includes('business_lead') || userRoles.includes('support_agent')
  }, [isSuper, userRoles])

  const canSeeConfig = useMemo(() => {
    return isSuper || userRoles.includes('tech_lead')
  }, [isSuper, userRoles])

  const canSeeAiBrain = useMemo(() => {
    return isSuper || userRoles.includes('tech_lead') || userRoles.includes('clinical_reviewer')
  }, [isSuper, userRoles])

  const roleBadgeInfo = useMemo(() => {
    if (userRoles.includes('super_admin')) return { label: 'Super Admin', className: 'is-purple' }
    if (userRoles.includes('tech_lead')) return { label: 'Tech Lead', className: 'is-teal' }
    if (userRoles.includes('business_lead')) return { label: 'Business Lead', className: 'is-gold' }
    if (userRoles.includes('support_agent')) return { label: 'Customer Support', className: 'is-blue' }
    if (userRoles.includes('clinical_reviewer')) return { label: 'Clinical Reviewer', className: 'is-teal' }
    if (userRoles.includes('admin') || isAdmin) return { label: 'Administrator', className: 'is-purple' }
    return { label: 'Staff', className: 'is-neutral' }
  }, [userRoles, isAdmin])

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
        className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
      >
        <item.icon size={16} strokeWidth={2} />
        <span>{item.label}</span>
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
            <span className="admin-top-bar-sub">skincluv.</span>
            <div className="admin-top-bar-title-wrap">
              <span className="admin-top-bar-title">Control Center</span>
              <span className={`cluv-badge is-sm ${roleBadgeInfo.className}`}>
                {roleBadgeInfo.label}
              </span>
            </div>
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
            <div className="admin-sidebar-brand-eyebrow">
              <ShieldCheck size={13} />
              Skincluv Admin
            </div>
            <div className="admin-sidebar-brand-title">
              Control Center
              <span className={`cluv-badge is-sm ${roleBadgeInfo.className}`}>
                {roleBadgeInfo.label}
              </span>
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
          className="admin-back-app-pill"
          style={{ marginBottom: '16px', width: 'fit-content' }}
        >
          <ArrowLeft size={14} />
          <span>Kembali ke App</span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingBottom: '28px' }}>
          <NavLink
            to="/admin"
            end
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
            style={{ marginBottom: '6px' }}
          >
            <LayoutDashboard size={17} strokeWidth={2} />
            <span>Overview</span>
          </NavLink>

          {/* Bisnis & Keuangan (Person B) */}
          {canSeeBusiness && (
            <>
              <div className="admin-nav-section-title">Bisnis & Keuangan</div>
              {renderNavGroup(businessNavItems)}
            </>
          )}

          {/* Pengguna & CRM */}
          {canSeeUsers && (
            <>
              <div className="admin-nav-section-title">Pengguna & CRM</div>
              {renderNavGroup(userNavItems)}
            </>
          )}

          {/* Konfigurasi Sistem (Person A) */}
          {canSeeConfig && (
            <>
              <div className="admin-nav-section-title">Konfigurasi Sistem</div>
              {renderNavGroup(configNavItems)}
            </>
          )}

          {/* AI Knowledge & Training Hub (Person A & Clinical) */}
          {canSeeAiBrain && (
            <>
              <div className="admin-nav-section-title">AI Brain & Training Hub</div>
              {renderNavGroup(aiHubNavItems)}
            </>
          )}

          {/* Tata Kelola & Audit (Super Admin & Tech Lead) */}
          {isSuper && (
            <>
              <div className="admin-nav-section-title">Tata Kelola & Audit</div>
              {renderNavGroup(governanceNavItems)}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  )
}


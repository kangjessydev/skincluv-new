// src/components/layout/AppLayout.tsx
// Skincluv Fresh Tech App Shell (100% v0.dev Human Proportions & Plus Jakarta Sans)
// Responsive Desktop Sidebar (264px) + Top Navbar (78px) + Mobile Drawer + Bottom Bar

import { useState } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  FlaskConical,
  MessageCircle,
  ShieldCheck,
  UserRound,
  MoreHorizontal,
  Search,
  Bell,
  Zap,
  Menu,
  X,
  HeartPulse,
  CircleHelp,
  Home,
  ScanFace,
  CalendarDays,
  Receipt,
  LogOut,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'
import '@/styles/app-layout.css'

const navMainItems = [
  { to: '/', icon: Home, label: 'Beranda' },
  { to: '/face-scan', icon: ScanFace, label: 'Scan Wajah' },
  { to: '/ingredient-scan', icon: FlaskConical, label: 'Scan Komposisi' },
  { to: '/scan-history', icon: CalendarDays, label: 'Riwayat Scan' },
]

const navOtherItems = [
  { to: '/chatbot', icon: MessageCircle, label: 'Skinsistant AI', badge: 'AI' },
  { to: '/missions', icon: HeartPulse, label: 'Misi Glow' },
  { to: '/pricing', icon: ShieldCheck, label: 'Paket & Langganan' },
  { to: '/faq', icon: CircleHelp, label: 'Bantuan & FAQ' },
]

export default function AppLayout() {
  const { coinBalance, profile, subscription, isAdmin, userRoles, reset } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const canAccessAdmin =
    isAdmin ||
    userRoles.some((r) =>
      ['super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer', 'admin'].includes(r)
    )

  const isPro = isActivePremium(subscription)
  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const fullUserName = profile?.full_name || 'Pengguna Skincluv'
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'PE'

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      reset()
      navigate('/login')
    } catch (err) {
      console.error('Signout error:', err)
    }
  }

  return (
    <div className="v0-app-shell">
      <div className={`v0-shell-inner ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* ===================== SIDEBAR ===================== */}
        <aside className={`v0-shell-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>

          {/* Brand Header */}
          <div className="v0-sidebar-brand-row">
            <Link to="/" className="v0-brand-link" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="v0-brand-icon-box">
                <Sparkles size={20} strokeWidth={2.5} />
              </span>
              {!isSidebarCollapsed && (
                <span className="v0-brand-text">
                  skincluv<span className="v0-brand-dot">.</span>
                </span>
              )}
            </Link>
            {/* Desktop collapse toggle */}
            <button
              className="v0-sidebar-collapse-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              title={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              <Menu size={18} />
            </button>
            {/* Mobile close button */}
            <button
              className="v0-sidebar-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* ---- SCROLLABLE NAV AREA ---- */}
          <div className="v0-sidebar-scroll-area">
            {/* Section: Menu Utama */}
            {!isSidebarCollapsed && <p className="v0-nav-section-title">MENU UTAMA</p>}
            <nav className="v0-nav-group">
              {navMainItems.map(({ to, icon: Icon, label }) => {
                const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`v0-sidebar-item ${isActive ? 'active' : ''}`}
                    end={to === '/'}
                    title={isSidebarCollapsed ? label : ''}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {!isSidebarCollapsed && <span>{label}</span>}
                  </NavLink>
                )
              })}
            </nav>

            {/* Section: Lainnya */}
            {!isSidebarCollapsed && <p className="v0-nav-section-title v0-mt-section">LAINNYA</p>}
            {isSidebarCollapsed && <div className="v0-collapsed-section-divider" />}
            <nav className="v0-nav-group">
              {navOtherItems.map(({ to, icon: Icon, label, badge }) => {
                const isActive = location.pathname.startsWith(to)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`v0-sidebar-item ${isActive ? 'active' : ''}`}
                    title={isSidebarCollapsed ? label : ''}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {!isSidebarCollapsed && <span>{label}</span>}
                    {badge && !isSidebarCollapsed && <span className="v0-sidebar-badge">{badge}</span>}
                  </NavLink>
                )
              })}
            </nav>
          </div>
          {/* ---- END SCROLLABLE NAV AREA ---- */}

          {/* ---- PINNED BOTTOM: Trust + Profile ---- */}
          <div className="v0-sidebar-pinned-bottom">
            {/* Trust Strip — slim one-line, always visible */}
            {!isSidebarCollapsed ? (
              <div className="v0-trust-strip" title="Privasi biometrik & data klinis selalu terlindungi sesuai UU PDP">
                <ShieldCheck size={14} strokeWidth={2.2} className="v0-trust-strip-icon" />
                <span className="v0-trust-strip-text">Data & privasi terlindungi · UU PDP</span>
              </div>
            ) : (
              <div className="v0-sidebar-trust-icon-only" title="Data kamu aman — Privasi terlindungi sesuai UU PDP">
                <ShieldCheck size={16} strokeWidth={2.2} />
              </div>
            )}

            {/* Profile Strip */}
            <div className="v0-sidebar-profile-wrapper">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="v0-sidebar-profile-btn"
                title={isSidebarCollapsed ? fullUserName : ''}
              >
                <span className="v0-sidebar-avatar-circle">
                  <UserRound size={19} />
                </span>
                {!isSidebarCollapsed && (
                  <>
                    <span className="v0-sidebar-profile-meta">
                      <span className="v0-profile-name-text">{fullUserName}</span>
                      <span className="v0-profile-role-text">{isPro ? '⭐️ PRO Member' : 'Free Member'}</span>
                    </span>
                    <MoreHorizontal size={18} className="v0-profile-more-icon" />
                  </>
                )}
              </button>

              {/* Dropdown Popover */}
              {isUserDropdownOpen && (
                <div className="v0-dropdown-popover">
                  <div className="v0-popover-header">
                    <span className="v0-popover-name">{fullUserName}</span>
                    <span className="v0-popover-plan">{isPro ? '⭐️ PRO Subscriber' : 'Free Member'}</span>
                  </div>
                  <div className="v0-popover-sep" />
                  <Link
                    to="/profile"
                    className="v0-popover-item"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <User size={16} />
                    <span>Profil Saya</span>
                  </Link>
                  <Link
                    to="/transactions"
                    className="v0-popover-item"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Receipt size={16} />
                    <span>Riwayat Tagihan</span>
                  </Link>
                  {canAccessAdmin && (
                    <Link
                      to="/admin"
                      className="v0-popover-item v0-admin-item"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <ShieldCheck size={16} />
                      <span>Admin Control Center</span>
                    </Link>
                  )}
                  <div className="v0-popover-sep" />
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      handleSignOut()
                    }}
                    className="v0-popover-item v0-logout-item"
                  >
                    <LogOut size={16} />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* ---- END PINNED BOTTOM ---- */}

        </aside>

        {/* ===================== MAIN CONTENT COLUMN ===================== */}
        <section className="v0-shell-main">
          {/* Top Navbar Header (78px) */}
          <header className="v0-shell-header">
            <button
              className="v0-header-burger-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu size={22} />
            </button>

            {/* Search Box */}
            <div className="v0-header-search-wrap">
              <Search size={18} className="v0-header-search-icon" />
              <input
                className="v0-header-search-field"
                placeholder="Cari fitur, produk, atau jurnal..."
                aria-label="Cari"
              />
            </div>

            {/* Right Header Cluster */}
            <div className="v0-header-right-cluster">
              {/* Credits Pill */}
              <button
                onClick={() => navigate('/pricing')}
                className="v0-header-credits-pill"
                title="Kelola AI Credits"
              >
                <Zap size={14} className="v0-header-zap-icon" />
                <span>{coinBalance?.balance ?? 0} Credits</span>
              </button>

              {/* Notification Bell */}
              <button className="v0-header-bell-btn" aria-label="Notifikasi">
                <Bell size={20} />
                <span className="v0-header-bell-dot" />
              </button>

              <div className="v0-header-divider" />

              {/* Profile Topbar Pill */}
              <button onClick={() => navigate('/profile')} className="v0-header-profile-btn">
                <span className="v0-header-profile-avatar">{userInitials}</span>
                <span className="v0-header-profile-name">{userName}</span>
              </button>
            </div>
          </header>

          {/* Page Body Router Outlet */}
          <main className="v0-shell-page-content">
            <Outlet />
          </main>
        </section>
      </div>
    </div>
  )
}

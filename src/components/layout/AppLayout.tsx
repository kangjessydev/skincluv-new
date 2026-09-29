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

      {/* ===================== SCOPED APP LAYOUT CSS ===================== */}
      <style>{`
        .v0-app-shell {
          height: 100dvh;
          width: 100%;
          background: #f7faff !important;
          color: #13243c !important;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        .v0-app-shell * {
          box-sizing: border-box !important;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        /* RFC 019: CSS Grid Opsi C — kolom scroll independen */
        .v0-shell-inner {
          display: grid;
          grid-template-columns: 264px minmax(0, 1fr);
          height: 100dvh;
          overflow: hidden;
          transition: grid-template-columns 0.25s ease;
        }
        /* Collapsed: sidebar 72px */
        .v0-shell-inner.sidebar-collapsed {
          grid-template-columns: 72px minmax(0, 1fr);
        }

        /* SIDEBAR — scroll independen, tidak ikut scroll konten */
        .v0-shell-sidebar {
          width: 264px;
          height: 100dvh;
          overflow: hidden;       /* overflow dikelola oleh child scroll-area */
          overscroll-behavior: contain;
          background: #ffffff;
          border-right: 1px solid #dce8f1;
          padding: 26px 16px 20px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width 0.25s ease, padding 0.25s ease;
        }
        /* Collapsed sidebar: 72px, icon centered */
        .v0-shell-sidebar.collapsed {
          width: 72px;
          padding: 26px 10px 20px;
          overflow: hidden;
        }

        .v0-sidebar-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          margin-bottom: 8px;
          gap: 8px;
          flex-shrink: 0;
        }
        /* Collapsed: brand row center */
        .v0-shell-sidebar.collapsed .v0-sidebar-brand-row {
          justify-content: center;
          padding: 0;
        }
        .v0-brand-link {
          display: flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
        }
        .v0-brand-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #dff4f2;
          color: #1d9b93;
        }
        .v0-brand-text {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #13243c;
        }
        .v0-brand-dot {
          color: #21a19b;
        }
        .v0-sidebar-close-btn {
          display: none;
          background: none;
          border: none;
          color: #8291a3;
          cursor: pointer;
          padding: 6px;
        }
        /* Desktop collapse toggle button */
        .v0-sidebar-collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #8291a3;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .v0-sidebar-collapse-btn:hover {
          background: #f0f5f8;
          color: #13243c;
        }

        .v0-nav-section-title {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #98a7b7;
          margin: 38px 0 12px 14px;
        }
        .v0-mt-section {
          margin-top: 32px !important;
        }

        /* Scrollable nav area — grows, scrolls jika menu banyak */
        .v0-sidebar-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          min-height: 0;
          padding-bottom: 8px;
        }

        .v0-nav-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        /* Collapsed: divider antar section sebagai pengganti label */
        .v0-collapsed-section-divider {
          height: 1px;
          background: #e8f0f5;
          margin: 16px 8px;
        }
        .v0-sidebar-item {
          display: flex;
          align-items: center;
          gap: 13px;
          width: 100%;
          padding: 13px 15px;
          border-radius: 14px;
          background: transparent;
          border: none;
          font-size: 14.5px;
          font-weight: 500;
          color: #5d7085;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
        }
        /* Collapsed: icon centered */
        .v0-shell-sidebar.collapsed .v0-sidebar-item {
          justify-content: center;
          padding: 13px 0;
          gap: 0;
        }
        .v0-sidebar-item:hover {
          background: #f4f8fb;
          color: #13243c;
        }
        .v0-sidebar-item.active {
          background: #eaf8f7;
          color: #167f7b;
          font-weight: 600;
        }
        .v0-sidebar-badge {
          margin-left: auto;
          background: #e4f2ff;
          color: #4288c5;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        /* Pinned bottom — trust card + profile, selalu terlihat */
        .v0-sidebar-pinned-bottom {
          flex-shrink: 0;
          padding-top: 12px;
          border-top: 1px solid #eef3f7;
        }

        /* Trust Strip — slim one-liner (Opsi A) */
        .v0-trust-strip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 10px;
          margin-bottom: 4px;
          border-radius: 8px;
          cursor: default;
        }
        .v0-trust-strip:hover {
          background: #f0f8f7;
        }
        .v0-trust-strip-icon {
          color: #28a19b;
          flex-shrink: 0;
        }
        .v0-trust-strip-text {
          font-size: 11px;
          font-weight: 600;
          color: #7a98a5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Trust icon-only (collapsed) */
        .v0-sidebar-trust-icon-only {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          color: #28a19b;
          margin-bottom: 4px;
          cursor: default;
          border-radius: 8px;
        }
        .v0-sidebar-trust-icon-only:hover {
          background: #f0f8f7;
        }

        /* Profile strip */
        .v0-sidebar-profile-wrapper {
          position: relative;
          margin-top: 18px;
        }
        .v0-sidebar-profile-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 12px;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.15s ease;
        }
        .v0-sidebar-profile-btn:hover {
          background: #f4f8fb;
        }
        .v0-sidebar-avatar-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #dce9f2;
          color: #607d91;
          flex-shrink: 0;
        }
        .v0-sidebar-profile-meta {
          flex: 1;
          min-width: 0;
        }
        .v0-profile-name-text {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #13243c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v0-profile-role-text {
          display: block;
          font-size: 11.5px;
          color: #92a0ae;
          margin-top: 1px;
        }
        .v0-profile-more-icon {
          color: #99a7b5;
          flex-shrink: 0;
        }

        /* Dropdown Popover */
        .v0-dropdown-popover {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(19, 36, 60, 0.12);
          padding: 8px;
          z-index: 60;
        }
        .v0-popover-header {
          padding: 10px 12px;
        }
        .v0-popover-name {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #13243c;
        }
        .v0-popover-plan {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #1f9d97;
          margin-top: 2px;
        }
        .v0-popover-sep {
          height: 1px;
          background: #edf2f7;
          margin: 4px 0;
        }
        .v0-popover-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #4a5568;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }
        .v0-popover-item:hover {
          background: #f7fafc;
          color: #1a202c;
        }
        .v0-admin-item {
          color: #2b6cb0;
          font-weight: 600;
        }
        .v0-logout-item {
          color: #e53e3e;
        }

        /* MAIN CONTENT — scroll independen */
        .v0-shell-main {
          min-width: 0;
          min-height: 0;  /* RFC 019: wajib agar grid child tidak override overflow */
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        /* Top Navbar — 64px (RFC 019 final: ChatGPT verdict) */
        .v0-shell-header {
          height: 64px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e3edf4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 44px;
          position: sticky;
          top: 0;
          z-index: 30;
          flex-shrink: 0;
        }
        .v0-header-burger-btn {
          display: none;
          background: none;
          border: none;
          color: #6d8296;
          cursor: pointer;
        }

        .v0-header-search-wrap {
          position: relative;
          max-width: 360px;
          width: 100%;
        }
        .v0-header-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9babb9;
          pointer-events: none;
        }
        .v0-header-search-field {
          height: 44px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e4edf3;
          background: #f8fbfd;
          padding: 0 16px 0 44px;
          font-size: 13.5px;
          color: #13243c;
          outline: none;
          transition: all 0.15s ease;
        }
        .v0-header-search-field:focus {
          border-color: #9cdad5;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(31, 157, 151, 0.1);
        }
        .v0-header-search-field::placeholder {
          color: #9babb9;
        }

        .v0-header-right-cluster {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: auto;
        }
        .v0-header-credits-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f0f7ff;
          border: 1px solid #d5e7f7;
          border-radius: 10px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #2b6cb0;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .v0-header-credits-pill:hover {
          background: #e2f0fe;
        }
        .v0-header-zap-icon {
          color: #d97706;
          fill: #d97706;
        }

        .v0-header-bell-btn {
          position: relative;
          background: none;
          border: none;
          color: #708397;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }
        .v0-header-bell-dot {
          position: absolute;
          right: 3px;
          top: 3px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef8f74;
        }
        .v0-header-divider {
          width: 1px;
          height: 26px;
          background: #e4edf3;
        }
        .v0-header-profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .v0-header-profile-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #d9eff0;
          color: #258e8b;
          font-size: 13px;
          font-weight: 700;
        }
        .v0-header-profile-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #425b70;
        }

        .v0-shell-page-content {
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        /* Tablet: navbar 60px */
        @media (max-width: 1279px) {
          .v0-shell-header {
            height: 60px;
          }
        }

        @media (max-width: 1024px) {
          /* Mobile: shell jadi single column */
          .v0-shell-inner {
            display: block;
            height: 100dvh;
            overflow: hidden;
          }
          .v0-shell-main {
            height: 100dvh;
            overflow-y: auto;
          }
          .v0-shell-sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease-in-out;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
          }
          .v0-shell-sidebar.mobile-open {
            transform: translateX(0);
          }
          .v0-sidebar-close-btn {
            display: block;
          }
          .v0-header-burger-btn {
            display: block;
          }
        }

        @media (max-width: 768px) {
          .v0-shell-header {
            padding: 0 20px;
          }
          .v0-header-search-wrap {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

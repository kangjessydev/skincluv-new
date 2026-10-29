// src/components/layout/AppLayout.tsx
// Skincluv Universal App Shell (100% Cluv Micro-Framework)
// Desktop Responsive Sidebar (260px / 72px) + Sticky Topbar (64px) + Mobile Drawer Backdrop + Thumb-Friendly Mobile Bottom Bar

import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  FlaskConical,
  MessageCircle,
  ShieldCheck,
  Bell,
  Zap,
  HeartPulse,
  CircleHelp,
  Home,
  ScanFace,
  CalendarDays,
  Receipt,
  LogOut,
  User,
  ArrowLeft,
  History,
  Brain,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'

const navMainItems = [
  { to: '/dashboard', icon: Home, label: 'Beranda' },
  { to: '/face-scan', icon: ScanFace, label: 'Scan Wajah' },
  { to: '/ingredient-scan', icon: FlaskConical, label: 'Scan Komposisi' },
  { to: '/scan-history', icon: CalendarDays, label: 'Riwayat Scan' },
]

const navOtherItems = [
  { to: '/chatbot', icon: MessageCircle, label: 'Skinsistant AI', badge: 'AI' },
  { to: '/missions', icon: HeartPulse, label: 'Misi Glow' },
  { to: '/paket', icon: ShieldCheck, label: 'Paket Akses' },
  { to: '/faq', icon: CircleHelp, label: 'Bantuan & FAQ' },
]

const mobileBottomNavItems = [
  { to: '/dashboard', icon: Home, label: 'Beranda' },
  { to: '/ingredient-scan', icon: FlaskConical, label: 'Komposisi' },
  { to: '/face-scan', icon: ScanFace, label: 'Scan Wajah', isCenterFab: true },
  { to: '/chatbot', icon: MessageCircle, label: 'Skinsistant' },
  { to: '/profile', icon: User, label: 'Profil' },
]

function getPageContextTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Beranda'
  if (pathname.startsWith('/face-scan')) return 'Face Scanner'
  if (pathname.startsWith('/ingredient-scan')) return 'Ingredient Scanner'
  if (pathname.startsWith('/scan-history')) return 'Riwayat Scan'
  if (pathname.startsWith('/chatbot')) return 'Skinsistant AI'
  if (pathname.startsWith('/missions')) return 'Misi Glow'
  if (pathname.startsWith('/paket') || pathname.startsWith('/pricing')) return 'Paket Akses'
  if (pathname.startsWith('/transactions')) return 'Riwayat Tagihan'
  if (pathname.startsWith('/coin-history')) return 'Riwayat AI Credits'
  if (pathname.startsWith('/profile/skin')) return 'Profil Kondisi Kulit'
  if (pathname.startsWith('/profile/billing')) return 'Paket & Langganan'
  if (pathname.startsWith('/profile')) return 'Profil Saya'
  if (pathname.startsWith('/privacy-center')) return 'Pusat Privasi & Data'
  if (pathname.startsWith('/faq')) return 'Pusat Bantuan'
  return 'Beranda'
}

export default function AppLayout() {
  const { coinBalance, profile, subscription, isAdmin, userRoles, reset } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const canAccessAdmin =
    isAdmin ||
    userRoles.some((r) =>
      ['super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer', 'admin'].includes(r)
    )

  const isPro = isActivePremium(subscription)
  const fullUserName = profile?.full_name || 'Pengguna Skincluv'
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'SC'

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setIsUserDropdownOpen(false)
  }, [location.pathname])

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
    <div className="cluv-app-shell cluv-surface-app">
      <div className="cluv-shell-grid">
        {/* ===================== DESKTOP SIDEBAR (Permanent 250px) ===================== */}
        <aside className="cluv-sidebar">

          {/* Brand Header */}
          <div className="cluv-sidebar-brand-row">
            <Link to="/dashboard" className="cluv-sidebar-brand-link">
              <span className="cluv-sidebar-brand-icon">
                <Sparkles size={20} strokeWidth={2.5} />
              </span>
              <span className="cluv-sidebar-brand-text">
                skincluv<span>.</span>
              </span>
            </Link>
          </div>

          {/* Scrollable Nav Area */}
          <div className="cluv-sidebar-nav-scroll">
            {/* Menu Utama (Humanist Sentence Case) */}
            <p className="cluv-sidebar-section-title">Menu Utama</p>
            {navMainItems.map(({ to, icon: Icon, label }) => {
              const isActive = to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`cluv-sidebar-item ${isActive ? 'is-active' : ''}`}
                  end={to === '/dashboard'}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </NavLink>
              )
            })}

            {/* Eksplorasi Lainnya */}
            <p className="cluv-sidebar-section-title">Eksplorasi Lainnya</p>
            {navOtherItems.map(({ to, icon: Icon, label, badge }) => {
              const isActive = location.pathname.startsWith(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`cluv-sidebar-item ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                  {badge && <span className="cluv-sidebar-badge">{badge}</span>}
                </NavLink>
              )
            })}
          </div>

          {/* Pinned Bottom: Sweet Trust Strip (Clean Single Icon) */}
          <div className="cluv-sidebar-pinned">
            <div className="cluv-sidebar-trust" title="Privasi biometrik & data klinis terlindungi sesuai UU PDP No. 27/2022">
              <ShieldCheck size={16} strokeWidth={2.2} className="cluv-sidebar-trust-icon" />
              <span>Privasi terlindungi · UU PDP</span>
            </div>
          </div>

        </aside>

        {/* ===================== MAIN CONTENT & TOPBAR ===================== */}
        <section className="cluv-shell-main">
          {/* Topbar Header (68px Desktop, 58px Mobile, Airy Glass Blur) */}
          <header className="cluv-topbar">
            <div className="cluv-topbar-left">
              {/* Mobile: If Dashboard, show Brand Logo. If NOT Dashboard, show Back Button + Page Title */}
              {location.pathname === '/dashboard' || location.pathname === '/' ? (
                <Link to="/dashboard" className="cluv-topbar-mobile-brand" title="Skincluv Beranda">
                  <span className="cluv-topbar-mobile-brand-icon">
                    <Sparkles size={18} strokeWidth={2.5} />
                  </span>
                  <span className="cluv-topbar-mobile-brand-text">
                    skincluv<span>.</span>
                  </span>
                </Link>
              ) : (
                <div className="cluv-topbar-mobile-subpage cluv-hide-desktop">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="cluv-topbar-back-btn"
                    aria-label="Kembali ke halaman sebelumnya"
                  >
                    <ArrowLeft size={19} />
                  </button>
                  <span className="cluv-topbar-mobile-title">{getPageContextTitle(location.pathname)}</span>
                </div>
              )}

              {/* Desktop Breadcrumb / Page Context Title */}
              <div className="cluv-topbar-page-context">
                <span>{getPageContextTitle(location.pathname)}</span>
              </div>
            </div>

            {/* Topbar Right Cluster (All 38px Unified Height) */}
            <div className="cluv-topbar-right">
              {/* Universal AI Credits Clean Cloud Pill (38px) */}
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="cluv-topbar-credits-btn"
                title="Kelola AI Credits Anda"
              >
                <Zap size={14} className="cluv-credits-icon" fill="currentColor" />
                <span className="cluv-credits-num">{coinBalance?.balance ?? 0}</span>
                <span className="cluv-credits-label">Credits</span>
              </button>

              {/* Mobile: Bell on Dashboard, History icon on face-scan/ingredient-scan, Chat Actions on /chatbot */}
              {(location.pathname === '/dashboard' || location.pathname === '/') ? (
                <button type="button" className="cluv-topbar-bell-btn" aria-label="Notifikasi">
                  <Bell size={18} />
                  <span className="cluv-topbar-bell-dot" />
                </button>
              ) : (location.pathname.startsWith('/face-scan') || location.pathname.startsWith('/ingredient-scan')) ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/scan-history')}
                    className="cluv-topbar-history-btn cluv-hide-desktop"
                    aria-label="Riwayat Scan"
                    title="Riwayat Scan"
                  >
                    <History size={18} />
                  </button>
                  <button type="button" className="cluv-topbar-bell-btn cluv-hide-mobile" aria-label="Notifikasi">
                    <Bell size={18} />
                    <span className="cluv-topbar-bell-dot" />
                  </button>
                </>
              ) : location.pathname.startsWith('/chatbot') ? (
                <div className="cluv-flex-row cluv-items-center cluv-gap-1.5 cluv-hide-desktop">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('cluv:chatbot-history'))}
                    className="cluv-topbar-action-btn"
                    aria-label="Riwayat Percakapan"
                    title="Riwayat Percakapan"
                  >
                    <History size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('cluv:chatbot-memory'))}
                    className="cluv-topbar-action-btn"
                    aria-label="Memori Percakapan"
                    title="Memori Percakapan"
                  >
                    <Brain size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('cluv:chatbot-new'))}
                    className="cluv-topbar-action-btn"
                    aria-label="Percakapan Baru"
                    title="Percakapan Baru"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : null}

              <div className="cluv-topbar-divider" />

              {/* Desktop Profile Avatar Trigger (Option A: Clean 38px Circle with Gemini Gradient for PRO) */}
              <div className="cluv-topbar-profile-wrap" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`cluv-topbar-profile-avatar-btn ${isPro ? 'is-pro' : 'is-free'}`}
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="true"
                  title={`${fullUserName} (${isPro ? 'PRO Member' : 'Free Member'})`}
                  aria-label={`Menu Akun: ${fullUserName}`}
                >
                  <span className="cluv-topbar-avatar">{userInitials}</span>
                </button>

                {/* Popover Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="cluv-topbar-dropdown" role="menu">
                    <div className="cluv-dropdown-user-info">
                      <span className="cluv-dropdown-name">{fullUserName}</span>
                      <span className={`cluv-dropdown-badge ${isPro ? 'is-pro' : 'is-free'}`}>
                        {isPro ? '⭐️ PRO Member' : 'Free Member'}
                      </span>
                    </div>

                    <div className="cluv-dropdown-sep" />

                    <Link
                      to="/profile"
                      className="cluv-dropdown-item"
                      role="menuitem"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <User size={15} />
                      <span>Profil Saya</span>
                    </Link>

                    <Link
                      to="/transactions"
                      className="cluv-dropdown-item"
                      role="menuitem"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <Receipt size={15} />
                      <span>Riwayat Tagihan</span>
                    </Link>

                    {canAccessAdmin && (
                      <Link
                        to="/admin"
                        className="cluv-dropdown-item is-admin"
                        role="menuitem"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <ShieldCheck size={15} />
                        <span>Admin Control Center</span>
                      </Link>
                    )}

                    <div className="cluv-dropdown-sep" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        handleSignOut()
                      }}
                      className="cluv-dropdown-item is-danger"
                      role="menuitem"
                    >
                      <LogOut size={15} />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Body Router Outlet */}
          <main className="cluv-shell-page-content">
            <Outlet />
          </main>
        </section>
      </div>

      {/* ===================== MOBILE BOTTOM NAVIGATION BAR ===================== */}
      {/* Thumb-friendly ergonomics on phone screens with Center FAB; Hidden on /chatbot for full input experience */}
      {!location.pathname.startsWith('/chatbot') && (
        <nav className="cluv-mobile-bottom-bar" aria-label="Navigasi Bawah">
          {mobileBottomNavItems.map(({ to, icon: Icon, label, isCenterFab }) => {
            const isActive = to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(to)
            
            if (isCenterFab) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`cluv-bottom-nav-item is-center-fab ${isActive ? 'is-active' : ''}`}
                >
                  <div className="cluv-bottom-nav-fab-icon">
                    <Icon size={22} strokeWidth={2.4} />
                  </div>
                  <span>{label}</span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={to}
                to={to}
                className={`cluv-bottom-nav-item ${isActive ? 'is-active' : ''}`}
                end={to === '/dashboard'}
              >
                <Icon size={20} className="cluv-bottom-nav-icon" strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>
      )}
    </div>
  )
}

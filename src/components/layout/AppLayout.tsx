// src/components/layout/AppLayout.tsx
// 100% Original skincluv App Shell Layout (Desktop Collapsible Sidebar, Top Header, Mobile Floating FAB BottomNav)

import { useState } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Scan,
  FlaskConical,
  MessageCircle,
  Target,
  User,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
  Coins,
  Store,
  Receipt,
  LogOut,
  ArrowLeft,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'

const navItems = [
  { to: '/', icon: Sparkles, label: 'Beranda' },
  { to: '/face-scan', icon: Scan, label: 'Scan Wajah' },
  { to: '/ingredient-scan', icon: FlaskConical, label: 'Scan Ingredient' },
  { to: '/chatbot', icon: MessageCircle, label: 'Skinsistant AI' },
  { to: '/missions', icon: Target, label: 'Misi Glow' },
  { to: '/pricing', icon: Store, label: 'Toko Koin' },
  { to: '/profile', icon: User, label: 'Profil Saya' },
]

export default function AppLayout() {
  const { coinBalance, profile, subscription, reset } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  const isPro = isActivePremium(subscription)
  const isChatbotPage = location.pathname.startsWith('/chatbot')
  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const fullUserName = profile?.full_name || 'Pengguna Skincluv'
  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'PE'

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Beranda'
    if (path.startsWith('/face-scan')) return 'Scan Wajah AI'
    if (path.startsWith('/ingredient-scan')) return 'Scan Ingredient'
    if (path.startsWith('/chatbot')) return 'Skinsistant AI'
    if (path.startsWith('/missions')) return 'Misi Glow'
    if (path.startsWith('/profile')) return 'Profil Saya'
    if (path.startsWith('/pricing')) return 'Toko Koin & Langganan'
    if (path.startsWith('/coin-history')) return 'Riwayat Koin'
    if (path.startsWith('/transactions')) return 'Riwayat Tagihan'
    if (path.startsWith('/checkout')) return 'Pembayaran'
    return 'Skincluv'
  }

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
    <div className={`skincluv-app-shell ${isCollapsed ? 'sidebar-is-collapsed' : 'sidebar-is-expanded'}`}>
      {/* Ambient Background Orbs */}
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />

      {/* 1. DESKTOP COLLAPSIBLE LEFT SIDEBAR */}
      <aside className="stich-sidebar-desktop">
        <div className="sidebar-header-clean">
          <NavLink to="/" className="sidebar-brand-left">
            <span className="brand-star">✦</span>
            {!isCollapsed && <span className="brand-title-text">Skincluv</span>}
          </NavLink>
        </div>

        <nav className="sidebar-menu">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                end={to === '/'}
              >
                <Icon size={20} className="link-icon" />
                {!isCollapsed && <span className="link-label">{label}</span>}

                {isCollapsed && (
                  <div className="collapsed-tooltip">
                    {label}
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        {!isCollapsed && (
          <div className="sidebar-footer">
            <div className="sf-user-box">
              <div className="sf-avatar">{userInitials}</div>
              <div className="sf-meta">
                <span className="sf-name">{userName}</span>
                <span className="sf-badge">{isPro ? 'Pro Member' : 'Free Plan'}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="stich-content-area">
        {/* Sticky Top Bar */}
        <header className="stich-top-header">
          <div className="header-inner">
            <div className="page-title-group">
              {isChatbotPage ? (
                <>
                  <button
                    className="topbar-toggle-btn mobile-only-back-btn"
                    onClick={() => navigate('/')}
                    title="Kembali ke Beranda"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    className="topbar-toggle-btn desktop-only-toggle-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                  >
                    {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                  </button>
                </>
              ) : (
                <button
                  className="topbar-toggle-btn"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                >
                  {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
              )}
              <h1 className="header-active-page-title">{getPageTitle()}</h1>
            </div>

            <div className="header-actions">
              {/* AI Luxury "Upgrade PRO" Badge */}
              {!isPro && (
                <button
                  className="topbar-pro-badge"
                  onClick={() => navigate('/pricing')}
                  title="Upgrade ke Skincluv PRO"
                >
                  <Sparkles size={14} className="pro-sparkle-icon" />
                  <Crown size={14} className="pro-crown-icon" />
                  <span>Upgrade PRO</span>
                </button>
              )}

              {/* Coin Balance Badge */}
              <NavLink to="/coin-history" className="header-coin-badge" title="Riwayat Koin">
                <Coins size={15} className="text-amber-500" />
                <span className="coin-val">{coinBalance?.balance ?? 100}</span>
              </NavLink>

              {/* User Dropdown */}
              <div className="profile-dropdown-wrapper">
                <button
                  className="header-profile-pill"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="profile-avatar">{userInitials}</div>
                  <span className="profile-name-desktop">{userName}</span>
                </button>

                {isUserDropdownOpen && (
                  <div className="dropdown-menu-popover">
                    <div className="popover-user-info">
                      <span className="pui-name">{fullUserName}</span>
                      <span className="pui-plan">{isPro ? '⭐️ PRO Subscriber' : 'Free Member'}</span>
                    </div>
                    <div className="popover-divider" />
                    <Link to="/profile" className="popover-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <User size={16} />
                      <span>Profil Saya</span>
                    </Link>
                    <Link to="/transactions" className="popover-item" onClick={() => setIsUserDropdownOpen(false)}>
                      <Receipt size={16} />
                      <span>Riwayat Tagihan</span>
                    </Link>
                    <div className="popover-divider" />
                    <button className="popover-item text-red-600" onClick={handleSignOut}>
                      <LogOut size={16} />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport Canvas */}
        <main className={`stich-main-canvas ${isChatbotPage ? 'is-chatbot-canvas' : ''}`}>
          <div className="main-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. FLOATING BOTTOM NAVBAR (Mobile <= 768px) - Hidden on Chatbot Page */}
      {!isChatbotPage && (
        <nav className="stich-floating-bottom-nav">
          <div className="floating-nav-inner">
            <NavLink to="/" className={({ isActive }) => `floating-nav-item ${isActive ? 'active' : ''}`} end>
              <Sparkles size={20} />
              <span>Beranda</span>
            </NavLink>
            <NavLink to="/ingredient-scan" className={({ isActive }) => `floating-nav-item ${isActive ? 'active' : ''}`}>
              <FlaskConical size={20} />
              <span>Ingredient</span>
            </NavLink>

            <div className="floating-center-action">
              <button className="center-camera-btn" onClick={() => navigate('/face-scan')} title="Scan Wajah">
                <Scan size={26} />
              </button>
            </div>

            <NavLink to="/chatbot" className={({ isActive }) => `floating-nav-item ${isActive ? 'active' : ''}`}>
              <MessageCircle size={20} />
              <span>Chatbot</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `floating-nav-item ${isActive ? 'active' : ''}`}>
              <User size={20} />
              <span>Profil</span>
            </NavLink>
          </div>
        </nav>
      )}

      {/* ORIGINAL SKINCLUV APP LAYOUT PURE CSS */}
      <style>{`
        :root {
          --sidebar-expanded-width: 240px;
          --sidebar-collapsed-width: 72px;
          --nav-height: 64px;
          --color-primary: #0f6784;
          --color-primary-dark: #0b4f5c;
          --color-primary-container: #eaf4fa;
          --color-on-primary-container: #0f6784;
          --color-secondary: #64748b;
          --color-secondary-container: #f1f5f9;
          --color-surface-bg: #f8fafc;
          --color-text-main: #0f172a;
          --radius-full: 9999px;
          --radius-2xl: 16px;
          --radius-xl: 12px;
          --radius-md: 8px;
          --space-xs: 8px;
          --space-md: 16px;
          --space-lg: 24px;
        }

        .skincluv-app-shell {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          max-width: 100vw;
          overflow-x: hidden;
          background: var(--color-surface-bg);
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        /* Ambient Glow Orbs */
        .ambient-orb-1 {
          position: fixed;
          top: -120px;
          left: -120px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(15, 103, 132, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .ambient-orb-2 {
          position: fixed;
          bottom: -150px;
          right: -150px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* DESKTOP SIDEBAR */
        .stich-sidebar-desktop {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 40;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 1px 0 10px rgba(0,0,0,0.02);
        }

        .sidebar-is-expanded .stich-sidebar-desktop {
          width: var(--sidebar-expanded-width);
        }
        .sidebar-is-collapsed .stich-sidebar-desktop {
          width: var(--sidebar-collapsed-width);
        }

        @media (max-width: 768px) {
          .stich-sidebar-desktop {
            display: none !important;
          }
        }

        .sidebar-header-clean {
          height: var(--nav-height);
          display: flex;
          align-items: center;
          padding: 0 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .sidebar-brand-left {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--color-primary);
        }

        .brand-star {
          font-size: 1.4rem;
          color: var(--color-primary);
        }

        .brand-title-text {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--color-primary);
        }

        .sidebar-menu {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-xl);
          color: var(--color-secondary);
          text-decoration: none;
          font-size: 0.9375rem;
          font-weight: 500;
          position: relative;
          transition: all 0.2s ease;
        }

        .sidebar-link:hover {
          background: var(--color-primary-container);
          color: var(--color-primary);
        }

        .sidebar-link.active {
          background: var(--color-primary);
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(15, 103, 132, 0.25);
        }

        .sidebar-link.active .link-icon {
          color: #ffffff;
        }

        .sidebar-is-collapsed .sidebar-link {
          justify-content: center;
          padding: 10px 0;
        }

        .collapsed-tooltip {
          position: absolute;
          left: 100%;
          margin-left: 12px;
          background: #0f172a;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8125rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          z-index: 50;
        }
        .sidebar-link:hover .collapsed-tooltip {
          opacity: 1;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .sf-user-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #f8fafc;
          border-radius: var(--radius-xl);
        }

        .sf-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--color-primary-container);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
        }

        .sf-meta {
          display: flex;
          flex-direction: column;
        }

        .sf-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-main);
        }

        .sf-badge {
          font-size: 0.75rem;
          color: var(--color-secondary);
        }

        /* CONTENT AREA */
        .stich-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-is-expanded .stich-content-area {
          margin-left: var(--sidebar-expanded-width);
        }
        .sidebar-is-collapsed .stich-content-area {
          margin-left: var(--sidebar-collapsed-width);
        }

        @media (max-width: 768px) {
          .stich-content-area {
            margin-left: 0 !important;
          }
        }

        /* STICKY TOP HEADER */
        .stich-top-header {
          height: var(--nav-height);
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 24px;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .page-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar-toggle-btn {
          background: transparent;
          border: none;
          color: var(--color-secondary);
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .topbar-toggle-btn:hover {
          color: var(--color-primary);
          background: var(--color-primary-container);
        }

        @media (min-width: 769px) {
          .mobile-only-back-btn {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .desktop-only-toggle-btn {
            display: none !important;
          }
        }

        .header-active-page-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-main);
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-pro-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.14), rgba(245, 158, 11, 0.08));
          border: 1px solid rgba(245, 158, 11, 0.38);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 700;
          color: #b45309;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .topbar-pro-badge:hover {
          transform: translateY(-1px);
        }

        .header-coin-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: #f1f5f9;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-main);
          text-decoration: none;
        }

        .profile-dropdown-wrapper {
          position: relative;
        }

        .header-profile-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .profile-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
        }

        .profile-name-desktop {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-main);
        }

        @media (max-width: 768px) {
          .profile-name-desktop {
            display: none;
          }
        }

        .dropdown-menu-popover {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 8px;
          width: 200px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-xl);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          padding: 8px;
          z-index: 50;
        }

        .popover-user-info {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
        }

        .pui-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text-main);
        }

        .pui-plan {
          font-size: 0.75rem;
          color: var(--color-secondary);
        }

        .popover-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 6px 0;
        }

        .popover-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          color: var(--color-text-main);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          background: transparent;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: background 0.2s;
        }

        .popover-item:hover {
          background: #f1f5f9;
        }

        /* MAIN CANVAS & CHATBOT NO-OUTER-SCROLL STYLING */
        .stich-main-canvas {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          width: 100%;
          box-sizing: border-box;
        }

        .stich-main-canvas.is-chatbot-canvas {
          padding: 0 !important;
          overflow: hidden !important;
          height: calc(100vh - var(--nav-height)) !important;
          display: flex;
          flex-direction: column;
        }

        .is-chatbot-canvas .main-container {
          height: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          overflow: hidden !important;
        }

        @media (max-width: 768px) {
          .stich-main-canvas {
            padding: 16px 16px 90px;
          }
          .stich-main-canvas.is-chatbot-canvas {
            padding: 0 !important;
          }
        }

        .main-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* FLOATING BOTTOM NAVBAR (MOBILE <= 768px) */
        @media (min-width: 769px) {
          .stich-floating-bottom-nav {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .stich-floating-bottom-nav {
            position: fixed;
            bottom: 16px;
            left: 16px;
            right: 16px;
            z-index: 999;
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            box-shadow: 0 10px 25px -5px rgba(15, 103, 132, 0.2);
            height: 68px;
          }

          .floating-nav-inner {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 100%;
            padding: 0 8px;
            position: relative;
          }

          .floating-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            color: var(--color-secondary);
            text-decoration: none;
            flex: 1;
            padding: 4px;
            font-size: 0.6875rem;
            font-weight: 600;
          }

          .floating-nav-item.active {
            color: var(--color-primary);
            font-weight: 700;
          }

          .floating-center-action {
            position: relative;
            width: 60px;
            display: flex;
            justify-content: center;
          }

          .center-camera-btn {
            position: absolute;
            top: -28px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--color-primary);
            color: white;
            border: 4px solid #ffffff;
            box-shadow: 0 8px 20px rgba(15, 103, 132, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
          }

          .center-camera-btn:active {
            transform: scale(0.92);
          }
        }
      `}</style>
    </div>
  )
}

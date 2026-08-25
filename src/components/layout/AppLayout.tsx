import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, ScanFace, FlaskConical, MessageCircle, Target, User, Bell, Camera, PanelLeftClose, PanelLeftOpen, Crown, LogOut, ChevronDown, Receipt, History, X, Coins } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'

const navItems = [
  { to: '/',                icon: Sparkles,       label: 'Beranda' },
  { to: '/face-scan',       icon: ScanFace,       label: 'Scan Wajah' },
  { to: '/ingredient-scan', icon: FlaskConical,   label: 'Scan Ingredient' },
  { to: '/chatbot',         icon: MessageCircle,  label: 'Chatbot' },
  { to: '/missions',        icon: Target,         label: 'Missions' },
  { to: '/profile',         icon: User,           label: 'Profile' },
]

export default function AppLayout() {
  const { coinBalance, profile, subscription, reset } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobileScanModalOpen, setIsMobileScanModalOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const isPro = isActivePremium(subscription)
  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const fullUserName = profile?.full_name || 'Pengguna Skincluv'
  const userEmail = profile?.username ? `@${profile.username}` : 'User'

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsUserDropdownOpen(false)
    await supabase.auth.signOut()
    reset()
    navigate('/login')
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Beranda'
    if (path.startsWith('/face-scan')) return 'Scan Wajah'
    if (path.startsWith('/ingredient-scan')) return 'Scan Ingredient'
    if (path.startsWith('/chatbot')) return 'Chatbot'
    if (path.startsWith('/missions')) return 'Missions'
    if (path.startsWith('/profile')) return 'Profile'
    if (path.startsWith('/pricing')) return 'Toko Langganan'
    if (path.startsWith('/coin-history')) return 'Riwayat Koin'
    if (path.startsWith('/transactions')) return 'Riwayat Tagihan'
    if (path.startsWith('/checkout')) return 'Pembayaran'
    return 'Skincluv'
  }

  return (
    <div className={`app-shell-stich ${isCollapsed ? 'sidebar-is-collapsed' : 'sidebar-is-expanded'}`}>
      {/* Ambient Atmospheric Glow Orbs */}
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />

      {/* ============================================================ */}
      {/* 1. DESKTOP COLLAPSIBLE LEFT SIDEBAR (COLUMN 1)               */}
      {/* ============================================================ */}
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
      </aside>

      {/* ============================================================ */}
      {/* 2. CONTENT AREA (COLUMN 2: TOP BAR + MAIN CANVAS)            */}
      {/* ============================================================ */}
      <div className="stich-content-area">
        {/* Sticky Top Bar (Pinned 100%, never scrolls out of view!) */}
        <header className="stich-top-header">
          <div className="header-inner">
            <div className="page-title-group">
              <button
                className="topbar-toggle-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
              >
                {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
              <h1 className="header-active-page-title">{getPageTitle()}</h1>
            </div>

            <div className="header-actions">
              {/* AI Luxury "Upgrade PRO" Badge (Only visible when user is NOT PRO) */}
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
                <Coins size={16} className="text-amber-500" />
                <span className="coin-val">{coinBalance?.balance ?? 0}</span>
              </NavLink>

              <button className="header-icon-btn" title="Notifikasi">
                <Bell size={18} />
              </button>

              {/* Profile Pill with Dropdown */}
              <div className="header-profile-wrap" ref={dropdownRef}>
                <button
                  className="header-profile-pill"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="profile-avatar">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="profile-name-desktop">{userName}</span>
                  <ChevronDown size={14} className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`} />
                </button>

                {isUserDropdownOpen && (
                  <div className="user-dropdown-menu animate-fade-in">
                    <div className="dropdown-user-info">
                      <span className="info-name">{fullUserName}</span>
                      <span className="info-role">{isPro ? 'Skincluv PRO Member' : 'Free Explorer'}</span>
                    </div>

                    <div className="dropdown-divider" />

                    <button className="dropdown-item" onClick={() => { setIsUserDropdownOpen(false); navigate('/profile') }}>
                      <User size={16} /> Profil Saya
                    </button>
                    <button className="dropdown-item" onClick={() => { setIsUserDropdownOpen(false); navigate('/transactions') }}>
                      <Receipt size={16} /> Riwayat Tagihan
                    </button>
                    <button className="dropdown-item" onClick={() => { setIsUserDropdownOpen(false); navigate('/coin-history') }}>
                      <History size={16} /> Riwayat Mutasi Koin
                    </button>

                    <div className="dropdown-divider" />

                    <button className="dropdown-item text-error-item" onClick={handleLogout}>
                      <LogOut size={16} /> Keluar Akun
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport Canvas (Scrolls internally ONLY if content overflows) */}
        <main className={`stich-main-canvas ${location.pathname.startsWith('/chatbot') ? 'is-chatbot-canvas' : ''}`}>
          <div className="main-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ============================================================ */}
      {/* 3. FLOATING BOTTOM NAVBAR (Mobile <= 768px)                   */}
      {/* ============================================================ */}
      <nav className="stich-floating-bottom-nav">
        <div className="floating-nav-inner">
          <NavLink to="/" className={`floating-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Sparkles size={20} />
            <span className="nav-text">Beranda</span>
          </NavLink>

          <NavLink to="/chatbot" className={`floating-nav-item ${location.pathname.startsWith('/chatbot') ? 'active' : ''}`}>
            <MessageCircle size={20} />
            <span className="nav-text">Chatbot</span>
          </NavLink>

          <div className="floating-center-action">
            <button
              className="center-camera-btn"
              onClick={() => setIsMobileScanModalOpen(true)}
              title="Pilih Fitur Scan"
            >
              <Camera size={26} />
            </button>
          </div>

          <NavLink to="/missions" className={`floating-nav-item ${location.pathname.startsWith('/missions') ? 'active' : ''}`}>
            <Target size={20} />
            <span className="nav-text">Missions</span>
          </NavLink>

          <NavLink to="/profile" className={`floating-nav-item ${location.pathname.startsWith('/profile') ? 'active' : ''}`}>
            <User size={20} />
            <span className="nav-text">Profile</span>
          </NavLink>
        </div>
      </nav>

      {/* Mobile Scan Quick Action Sheet */}
      {isMobileScanModalOpen && (
        <div className="mobile-scan-overlay" onClick={() => setIsMobileScanModalOpen(false)}>
          <div className="mobile-scan-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>Pilih Analisis AI</h3>
              <button className="sheet-close-btn" onClick={() => setIsMobileScanModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="sheet-actions">
              <button
                className="sheet-action-card"
                onClick={() => {
                  setIsMobileScanModalOpen(false)
                  navigate('/face-scan')
                }}
              >
                <div className="action-icon-wrap icon-sky">
                  <ScanFace size={24} />
                </div>
                <div className="action-text">
                  <span className="action-title">Scan Wajah</span>
                  <span className="action-desc">Analisis pori, hidrasi, & masalah kulit dari foto</span>
                </div>
              </button>

              <button
                className="sheet-action-card"
                onClick={() => {
                  setIsMobileScanModalOpen(false)
                  navigate('/ingredient-scan')
                }}
              >
                <div className="action-icon-wrap icon-purple">
                  <FlaskConical size={24} />
                </div>
                <div className="action-text">
                  <span className="action-title">Scan Ingredient</span>
                  <span className="action-desc">Cek keamanan bahan produk skincare</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .app-shell-stich {
          height: 100dvh;
          width: 100vw;
          display: flex;
          background: var(--color-surface-bg);
          font-family: var(--font-body);
          position: relative;
          overflow: hidden; /* Prevents phantom body scrolling! */
        }

        /* -------------------------------------------------------------
           1. DESKTOP SIDEBAR STYLES (COLUMN 1)
           ------------------------------------------------------------- */
        @media (min-width: 769px) {
          .stich-sidebar-desktop {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            background: var(--color-surface-container-lowest);
            border-right: 1px solid var(--color-secondary-container);
            display: flex;
            flex-direction: column;
            padding: var(--space-md) var(--space-xs);
            z-index: 40;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--shadow-sm);
          }
          .sidebar-is-expanded .stich-sidebar-desktop {
            width: var(--sidebar-width);
          }
          .sidebar-is-collapsed .stich-sidebar-desktop {
            width: var(--sidebar-collapsed-width);
            align-items: center;
          }
        }
        @media (max-width: 768px) {
          .stich-sidebar-desktop { display: none !important; }
        }

        .sidebar-header-clean {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 var(--space-xs) var(--space-md) var(--space-xs);
          border-bottom: 1px solid var(--color-secondary-container);
          margin-bottom: var(--space-md);
          height: 48px;
          width: 100%;
        }
        .sidebar-brand-left {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .brand-star {
          font-size: 24px;
          color: var(--color-primary);
          line-height: 1;
        }
        .brand-title-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-primary);
          font-family: var(--font-heading);
          letter-spacing: -0.02em;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          width: 100%;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-secondary);
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }
        .sidebar-is-collapsed .sidebar-link {
          justify-content: center;
          padding: 12px 0;
        }
        .sidebar-link:hover {
          background: var(--color-surface-container-low);
          color: var(--color-primary);
        }
        .sidebar-link.active {
          background: var(--color-primary);
          color: var(--color-on-primary);
          box-shadow: var(--shadow-sm);
        }

        .collapsed-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: var(--color-text-main);
          color: white;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: var(--shadow-lg);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 100;
        }
        .sidebar-link:hover .collapsed-tooltip {
          opacity: 1;
        }

        /* -------------------------------------------------------------
           2. CONTENT AREA STYLES (COLUMN 2: TOP BAR + CANVAS)
           ------------------------------------------------------------- */
        .stich-content-area {
          flex: 1;
          min-width: 0;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
          overflow: hidden; /* TopBar never scrolls offscreen! */
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 769px) {
          .sidebar-is-expanded .stich-content-area {
            margin-left: var(--sidebar-width);
          }
          .sidebar-is-collapsed .stich-content-area {
            margin-left: var(--sidebar-collapsed-width);
          }
        }

        .stich-top-header {
          flex-shrink: 0;
          height: var(--nav-height);
          z-index: 30;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-secondary-container);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 var(--space-lg);
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
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
          background: var(--color-surface-container-low);
        }

        .header-active-page-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--color-primary);
          font-family: var(--font-heading);
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* AI Luxury Upgrade PRO Badge */
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
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
        }
        .topbar-pro-badge:hover {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.24), rgba(245, 158, 11, 0.16));
          border-color: rgba(245, 158, 11, 0.65);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.22);
        }
        .pro-sparkle-icon {
          color: #f59e0b;
          animation: sparkleSpin 3.5s linear infinite;
        }
        .pro-crown-icon {
          color: #d97706;
        }
        @keyframes sparkleSpin {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }

        .header-coin-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(212, 229, 241, 0.5);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-main);
          text-decoration: none;
        }

        .header-icon-btn {
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
        .header-icon-btn:hover { color: var(--color-primary); }

        .header-profile-wrap {
          position: relative;
        }

        .header-profile-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          padding: 4px 8px;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: background 0.15s;
        }
        .header-profile-pill:hover {
          background: var(--color-surface-container-low);
        }

        .dropdown-arrow {
          color: var(--color-secondary);
          transition: transform 0.2s ease;
        }
        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .user-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          box-shadow: 0 12px 32px rgba(0, 101, 145, 0.12);
          padding: var(--space-xs);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-user-info {
          padding: var(--space-xs) var(--space-sm);
          display: flex;
          flex-direction: column;
        }
        .info-name {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--color-text-main);
        }
        .info-role {
          font-size: 0.75rem;
          color: var(--color-primary);
          font-weight: 600;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--color-secondary-container);
          margin: 4px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-main);
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }
        .dropdown-item:hover {
          background: var(--color-surface-container-low);
          color: var(--color-primary);
        }
        .text-error-item {
          color: var(--color-error);
        }
        .text-error-item:hover {
          background: #fef2f2;
          color: var(--color-error);
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary-container);
          color: var(--color-on-primary-container);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .profile-name-desktop {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-main);
        }
        @media (max-width: 768px) {
          .profile-name-desktop { display: none; }
        }

        /* Main Viewport Canvas (Scrolls internally ONLY when content overflows!) */
        .stich-main-canvas {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding-top: var(--space-md);
          padding-bottom: var(--space-md);
          width: 100%;
        }
        .stich-main-canvas.is-chatbot-canvas {
          overflow: hidden !important;
          padding-top: var(--space-xs) !important;
          padding-bottom: 0 !important;
        }
        .is-chatbot-canvas .main-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding-bottom: 0 !important;
        }
        @media (max-width: 768px) {
          .stich-main-canvas {
            padding-bottom: 90px;
          }
        }
        .main-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 var(--space-lg);
          flex: 1;
          display: flex;
          flex-direction: column;
          transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* -------------------------------------------------------------
           3. FLOATING BOTTOM NAVBAR (Mobile <= 768px)
           ------------------------------------------------------------- */
        @media (min-width: 769px) {
          .stich-floating-bottom-nav { display: none !important; }
        }
        @media (max-width: 768px) {
          .stich-floating-bottom-nav {
            position: fixed;
            bottom: 16px;
            left: 16px;
            right: 16px;
            z-index: 50;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--color-secondary-container);
            border-radius: var(--radius-2xl);
            box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.15);
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
            border: 4px solid var(--color-surface-bg);
            box-shadow: 0 8px 20px rgba(0, 101, 145, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .center-camera-btn:active {
            transform: scale(0.92);
          }

          /* Mobile Scan Action Sheet */
          .mobile-scan-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            align-items: flex-end;
            animation: fadeIn 0.15s ease;
          }
          .mobile-scan-sheet {
            width: 100%;
            background: var(--color-surface-container-lowest);
            border-top-left-radius: var(--radius-2xl);
            border-top-right-radius: var(--radius-2xl);
            padding: var(--space-lg);
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
            animation: slideUp 0.2s ease;
          }
          .sheet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .sheet-header h3 {
            font-size: 1.125rem;
            font-family: var(--font-heading);
            margin: 0;
          }
          .sheet-close-btn {
            background: transparent;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
          }
          .sheet-actions {
            display: flex;
            flex-direction: column;
            gap: var(--space-sm);
          }
          .sheet-action-card {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            padding: var(--space-md);
            background: var(--color-surface-container-low);
            border: 1px solid var(--color-secondary-container);
            border-radius: var(--radius-xl);
            border: none;
            text-align: left;
            cursor: pointer;
            width: 100%;
          }
          .action-icon-wrap {
            width: 44px;
            height: 44px;
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .icon-sky { background: var(--color-primary-fixed); color: var(--color-primary); }
          .icon-purple { background: #f3e8ff; color: #9333ea; }
          .action-text { display: flex; flex-direction: column; }
          .action-title { font-weight: 700; font-size: 0.9375rem; color: var(--color-text-main); }
          .action-desc { font-size: 0.75rem; color: var(--color-text-muted); }
        }
      `}</style>
    </div>
  )
}

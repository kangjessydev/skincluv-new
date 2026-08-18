import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Sparkles, Scan, MessageCircle, Target, User, Coins } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/',                icon: Sparkles,       label: 'Home' },
  { to: '/face-scan',       icon: Scan,           label: 'Analisis Wajah' },
  { to: '/ingredient-scan', icon: Scan,           label: 'Cek Komposisi' },
  { to: '/chatbot',         icon: MessageCircle,  label: 'Konsultasi Chat' },
  { to: '/missions',        icon: Target,         label: 'Misi & Hadiah' },
  { to: '/profile',         icon: User,           label: 'Profil Saya' },
]

export default function AppLayout() {
  const { coinBalance, profile } = useAuthStore()
  const location = useLocation()

  return (
    <div className="app-shell">
      {/* ============================================================ */}
      {/* 1. DESKTOP LEFT SIDEBAR NAVIGATION (>= 769px)               */}
      {/* ============================================================ */}
      <aside className="desktop-sidebar">
        {/* Brand Header */}
        <NavLink to="/" className="sidebar-brand">
          <span className="brand-icon">✦</span>
          <span className="brand-name">Skincluv</span>
        </NavLink>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav-title">Menu Utama</span>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="sidebar-item-icon" />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer — User & Coins */}
        <div className="sidebar-footer">
          <NavLink to="/coin-history" className="sidebar-coin-card">
            <Coins size={20} className="icon-gold" />
            <div className="coin-meta">
              <span className="label">Koin Darurat</span>
              <strong className="amount">{coinBalance?.balance ?? 0} Koin</strong>
            </div>
          </NavLink>

          <NavLink to="/profile" className="sidebar-user-card">
            <div className="avatar-circle">
              <User size={16} />
            </div>
            <div className="user-meta">
              <span className="name">{profile?.full_name || 'Pelanggan Skincluv'}</span>
              <span className="role">Akun Saya</span>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE TOP HEADER (<= 768px)                               */}
      {/* ============================================================ */}
      <header className="mobile-header">
        <div className="mobile-header-inner container">
          <NavLink to="/" className="mobile-brand">
            <span className="brand-icon">✦</span>
            <span className="brand-name">Skincluv</span>
          </NavLink>

          <div className="mobile-actions">
            <NavLink to="/coin-history" className="mobile-coin-badge">
              <span className="coin-icon">🪙</span>
              <span className="coin-amount">{coinBalance?.balance ?? 0}</span>
            </NavLink>

            <NavLink to="/profile" className="mobile-profile-btn">
              <User size={18} />
            </NavLink>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. MAIN CONTENT VIEWPORT AREA                                */}
      {/* ============================================================ */}
      <main className="app-main-viewport">
        <div className="main-content-container container">
          <Outlet />
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. MOBILE BOTTOM NAVIGATION BAR (<= 768px)                    */}
      {/* ============================================================ */}
      <nav className="mobile-bottom-nav">
        <div className="bottom-nav-inner">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="mobile-nav-icon">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && <div className="active-dot" />}
                </div>
                <span className="mobile-nav-label">
                  {label === 'Analisis Wajah' ? 'Wajah' : label === 'Cek Komposisi' ? 'Bahan' : label === 'Konsultasi Chat' ? 'Chat' : label === 'Misi & Hadiah' ? 'Misi' : label === 'Profil Saya' ? 'Profil' : 'Home'}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      <style>{`
        .app-shell {
          min-height: 100dvh;
          display: flex;
          width: 100%;
          background: var(--color-surface-1);
        }

        /* -------------------------------------------------------------
           DESKTOP SIDEBAR STYLES (>= 769px)
           ------------------------------------------------------------- */
        @media (min-width: 769px) {
          .desktop-sidebar {
            width: var(--sidebar-width);
            height: 100vh;
            position: sticky;
            top: 0;
            background: var(--color-surface-2);
            border-right: 1px solid var(--color-border);
            display: flex;
            flex-direction: column;
            padding: var(--space-xl) var(--space-md) var(--space-lg) var(--space-md);
            z-index: 100;
            flex-shrink: 0;
          }
          .mobile-header, .mobile-bottom-nav {
            display: none !important;
          }
          .app-main-viewport {
            flex: 1;
            min-width: 0;
            padding-top: var(--space-xl);
            padding-bottom: 60px;
          }
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          padding: 0 var(--space-sm) var(--space-lg) var(--space-sm);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-lg);
        }
        .brand-icon { font-size: 22px; color: var(--color-brand-600); }
        .brand-name { font-size: 1.35rem; font-weight: 800; color: var(--color-text-primary); letter-spacing: -0.5px; }

        .sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .sidebar-nav-title { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; padding: 0 12px 6px 12px; letter-spacing: 0.5px; }

        .sidebar-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: var(--radius-md);
          color: var(--color-text-secondary); text-decoration: none;
          font-size: 0.875rem; font-weight: 500; transition: all 0.2s ease;
        }
        .sidebar-nav-item:hover {
          background: var(--color-brand-50); color: var(--color-brand-600);
        }
        .sidebar-nav-item.active {
          background: var(--color-brand-100); color: var(--color-brand-600);
          font-weight: 700; border: 1px solid var(--color-border-sky);
        }
        .sidebar-item-icon { color: inherit; }

        .sidebar-footer { display: flex; flex-direction: column; gap: 10px; margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--color-border); }
        .sidebar-coin-card {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: #fef3c7; border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-md); text-decoration: none; transition: all 0.2s;
        }
        .sidebar-coin-card:hover { transform: translateY(-1px); }
        .icon-gold { color: #d97706; }
        .coin-meta { display: flex; flex-direction: column; }
        .coin-meta .label { font-size: 0.6875rem; color: #92400e; }
        .coin-meta .amount { font-size: 0.875rem; color: #78350f; font-weight: 800; }

        .sidebar-user-card {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: var(--color-surface-1); border: 1px solid var(--color-border);
          border-radius: var(--radius-md); text-decoration: none; color: var(--color-text-primary);
        }
        .avatar-circle {
          width: 32px; height: 32px; border-radius: 50%; background: var(--color-brand-100);
          color: var(--color-brand-600); display: flex; align-items: center; justify-content: center;
        }
        .user-meta { display: flex; flex-direction: column; font-size: 0.75rem; overflow: hidden; }
        .user-meta .name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-meta .role { color: var(--color-text-muted); font-size: 0.6875rem; }

        /* -------------------------------------------------------------
           MOBILE STYLES (<= 768px)
           ------------------------------------------------------------- */
        @media (max-width: 768px) {
          .app-shell {
            flex-direction: column;
          }
          .desktop-sidebar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
          }
          .app-main-viewport {
            flex: 1;
            width: 100%;
            padding-top: var(--space-md);
            padding-bottom: 90px;
          }

          .mobile-header {
            position: sticky; top: 0; z-index: 100;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--color-border);
            padding: calc(var(--safe-top) + 10px) 0 10px;
            width: 100%;
          }
          .mobile-header-inner { display: flex; align-items: center; justify-content: space-between; }
          .mobile-brand { display: flex; align-items: center; gap: 6px; text-decoration: none; }

          .mobile-actions { display: flex; align-items: center; gap: var(--space-sm); }
          .mobile-coin-badge {
            display: flex; align-items: center; gap: 4px; padding: 5px 10px;
            background: #fef3c7; border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: var(--radius-full); text-decoration: none; font-size: 0.8125rem;
            font-weight: 700; color: #d97706;
          }
          .mobile-profile-btn {
            width: 34px; height: 34px; border-radius: 50%; background: var(--color-surface-2);
            border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center;
            color: var(--color-brand-600);
          }

          .mobile-bottom-nav {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid var(--color-border);
            box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.05);
            padding-bottom: var(--safe-bottom);
            width: 100%;
          }
          .bottom-nav-inner {
            display: flex; align-items: center; justify-content: space-around;
            height: var(--nav-height); padding: 0 var(--space-xs); max-width: 600px; margin: 0 auto;
          }
          .mobile-nav-item {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 2px; text-decoration: none; color: var(--color-text-muted); padding: 4px;
          }
          .mobile-nav-item.active { color: var(--color-brand-600); font-weight: 700; }
          .mobile-nav-icon { position: relative; display: flex; align-items: center; justify-content: center; }
          .active-dot { position: absolute; bottom: -4px; width: 4px; height: 4px; border-radius: 50%; background: var(--color-brand-600); }
          .mobile-nav-label { font-size: 0.6875rem; font-weight: 600; }
        }
      `}</style>
    </div>
  )
}

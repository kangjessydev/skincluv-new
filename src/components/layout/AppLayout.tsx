// src/components/layout/AppLayout.tsx
// 100% Faithful Port of Claude's Dashboard App Shell — Pure Vanilla CSS

import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Home,
  ScanFace,
  MessageSquare,
  BarChart2,
  Package,
  User,
  Coins,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium } from '@/utils/subscriptionHelpers'

export default function AppLayout() {
  const { coinBalance, profile, subscription } = useAuthStore()
  const navigate = useNavigate()

  const isPro = isActivePremium(subscription)
  const userCoins = coinBalance?.balance ?? 100
  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'PE'

  // Dynamic Time Greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 11) return 'Selamat pagi'
    if (hour >= 11 && hour < 15) return 'Selamat siang'
    if (hour >= 15 && hour < 18) return 'Selamat sore'
    return 'Selamat malam'
  }

  const menuItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Face Scan', path: '/face-scan', icon: ScanFace },
    { label: 'Skinsistant', path: '/chatbot', icon: MessageSquare },
    { label: 'Skin Insight', path: '/profile', icon: BarChart2 },
    { label: 'Rak Virtual', path: '/ingredient-scan', icon: Package },
    { label: 'Profil', path: '/profile', icon: User },
  ]

  return (
    <div className="claude-app-shell">
      {/* SIDEBAR: DESKTOP ONLY (>= 900px) */}
      <aside className="sidebar">
        <div className="sb-brand">
          <b>Skincluv</b>
        </div>
        {menuItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <div>
            <div className="greet-label">{getGreeting()}</div>
            <div className="greet-name">Halo, {userName} 👋</div>
          </div>
          <div className="top-right">
            <Link to="/pricing" className="coin-pill">
              <Coins size={14} />
              <span>{isPro ? 'Pro' : userCoins}</span>
            </Link>
            <Link to="/profile" className="avatar">
              {userInitials}
            </Link>
          </div>
        </div>

        {/* PAGE CONTENT OUTLET */}
        <Outlet />
      </div>

      {/* BOTTOM NAV: MOBILE ONLY (< 900px) */}
      <nav className="bottomnav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home size={21} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={21} />
          <span>Insight</span>
        </NavLink>
        <button onClick={() => navigate('/face-scan')} className="fab" title="Face Scan">
          <ScanFace size={24} className="text-white" />
        </button>
        <NavLink to="/ingredient-scan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={21} />
          <span>Rak</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={21} />
          <span>Profil</span>
        </NavLink>
      </nav>

      {/* PURE VANILLA CSS STYLING FROM CLAUDE */}
      <style>{`
        :root {
          --teal-900: #0A3E48;
          --teal-800: #0B4F5C;
          --teal-700: #126575;
          --teal-100: #DCEEEA;
          --cream: #FAF7F1;
          --peach: #E8A87C;
          --peach-dark: #B96A3D;
          --ink: #1A2B2B;
          --ink-soft: #5C6B6B;
          --line: rgba(10, 62, 72, 0.10);
        }

        .claude-app-shell {
          font-family: 'Inter', sans-serif;
          background: var(--cream);
          color: var(--ink);
          display: flex;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
        }

        /* SIDEBAR: DESKTOP ONLY */
        .sidebar {
          display: none;
          width: 224px;
          flex-shrink: 0;
          background: #ffffff;
          border-right: 1px solid var(--line);
          padding: 24px 16px;
          flex-direction: column;
          gap: 2px;
        }

        .sb-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 24px;
        }

        .sb-brand b {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          color: var(--ink);
        }

        .sb-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--ink-soft);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .sb-item:hover {
          color: var(--teal-800);
          background: rgba(220, 238, 234, 0.5);
        }

        .sb-item.active {
          background: var(--teal-100);
          color: var(--teal-800);
          font-weight: 600;
        }

        /* MAIN CONTAINER */
        .main {
          flex: 1;
          min-width: 0;
          padding: 24px 20px 100px;
          box-sizing: border-box;
        }

        /* TOPBAR */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .greet-label {
          font-size: 12px;
          color: var(--ink-soft);
          font-weight: 500;
        }

        .greet-name {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--ink);
        }

        .top-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .coin-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #ffffff;
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--peach-dark);
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--teal-100);
          color: var(--teal-800);
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
        }

        /* BOTTOM NAV: MOBILE ONLY */
        .bottomnav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 78px;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding-bottom: 14px;
          z-index: 50;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          color: var(--ink-soft);
          font-size: 10.5px;
          font-weight: 500;
          text-decoration: none;
        }

        .nav-item.active {
          color: var(--teal-800);
          font-weight: 600;
        }

        .fab {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: var(--teal-800);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -30px;
          box-shadow: 0 8px 18px rgba(11, 79, 92, 0.35);
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .fab:hover {
          transform: scale(1.05);
        }

        /* DESKTOP BREAKPOINT (>= 900px) */
        @media (min-width: 900px) {
          .sidebar {
            display: flex;
          }
          .avatar {
            display: flex;
          }
          .main {
            padding: 28px 32px 32px;
            max-width: 1180px;
          }
          .bottomnav {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

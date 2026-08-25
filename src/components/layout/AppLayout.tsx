// src/components/layout/AppLayout.tsx
// 100% Faithful Port of scan-2 Navigation Shell (Desktop Sidebar rounded pills, TopHeader glass, Mobile BottomNav + Drag BottomSheet)

import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ScanFace,
  FlaskConical,
  MessageCircle,
  Target,
  User,
  Bell,
  Coins,
  ChevronRight,
  ChevronDown,
  LogOut,
  Receipt,
  History,
  Store,
  BarChart3,
  Lightbulb,
  ArrowLeft,
  X,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'

interface MenuItem {
  id: string
  label: string
  desc: string
  icon: any
  route: string
  color: string
  bg: string
  showInPopular?: boolean
  showInSidebar?: boolean
}

export default function AppLayout() {
  const { coinBalance, profile, subscription, reset } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Dropdown States
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isCoinDropdownOpen, setIsCoinDropdownOpen] = useState(false)
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false)

  // Mobile BottomSheet Drawer States
  const [isBottomMenuOpen, setIsBottomMenuOpen] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const isPro = isActivePremium(subscription)
  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const fullUserName = profile?.full_name || 'Pengguna Skincluv'
  const userEmail = profile?.username ? `@${profile.username}` : 'User'
  const userCoins = coinBalance?.balance ?? 100

  // Navigation Menus Registry
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      desc: 'Beranda utama SkinCluv',
      icon: Sparkles,
      route: '/',
      color: 'text-[#0f6784]',
      bg: 'bg-[#eaf4fa]',
      showInSidebar: true,
    },
    {
      id: 'scan-face',
      label: 'Face Scan',
      desc: 'Analisis kondisi kulit wajahmu dengan AI',
      icon: ScanFace,
      route: '/face-scan',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      showInPopular: true,
      showInSidebar: true,
    },
    {
      id: 'scan-ingredient',
      label: 'Ingredients',
      desc: 'Cek keamanan bahan produk skincare',
      icon: FlaskConical,
      route: '/ingredient-scan',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      showInPopular: true,
      showInSidebar: true,
    },
    {
      id: 'chat',
      label: 'Skinsistant',
      desc: 'Konsultasi masalah kulit dengan AI',
      icon: MessageCircle,
      route: '/chatbot',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      showInPopular: true,
      showInSidebar: true,
    },
    {
      id: 'insight',
      label: 'Skin Insight',
      desc: 'Lihat ringkasan progres kulit Anda',
      icon: BarChart3,
      route: '/profile',
      color: 'text-[#0f6784]',
      bg: 'bg-[#eaf4fa]',
      showInPopular: true,
      showInSidebar: true,
    },
    {
      id: 'missions',
      label: 'Misi Glow',
      desc: 'Kumpulkan koin & hadiah menarik',
      icon: Target,
      route: '/missions',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      showInSidebar: true,
    },
    {
      id: 'shop',
      label: 'Toko Koin',
      desc: 'Tukar koin atau beli paket langganan PRO',
      icon: Store,
      route: '/pricing',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      showInSidebar: true,
    },
    {
      id: 'profile',
      label: 'Profil Akun',
      desc: 'Pengaturan profil & riwayat transaksi',
      icon: User,
      route: '/profile',
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      showInSidebar: true,
    },
  ]

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsUserDropdownOpen(false)
      }
      if (coinRef.current && !coinRef.current.contains(target)) {
        setIsCoinDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifDropdownOpen(false)
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
    if (path === '/') return 'SkinCluv Dashboard'
    if (path.startsWith('/face-scan')) return 'Scan Wajah AI'
    if (path.startsWith('/ingredient-scan')) return 'Scan Ingredient'
    if (path.startsWith('/chatbot')) return 'Skinsistant AI Chat'
    if (path.startsWith('/missions')) return 'Misi & Hadiah'
    if (path.startsWith('/profile')) return 'Profil Akun'
    if (path.startsWith('/pricing')) return 'Toko Koin & PRO'
    if (path.startsWith('/coin-history')) return 'Mutasi Koin'
    if (path.startsWith('/transactions')) return 'Riwayat Tagihan'
    if (path.startsWith('/checkout')) return 'Pembayaran'
    return 'SkinCluv'
  }

  // Pointer/Touch Drag handlers for Mobile BottomSheet
  const touchStart = (e: React.PointerEvent<HTMLDivElement>) => {
    setStartY(e.clientY)
    setIsDragging(true)
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const touchMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const delta = e.clientY - startY
    if (isBottomMenuOpen) {
      setCurrentY(Math.max(0, delta))
    } else {
      setCurrentY(Math.min(0, delta))
    }
  }

  const touchEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setIsDragging(false)
    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
    }

    const dragged = currentY
    setCurrentY(0)

    if (Math.abs(dragged) < 10) {
      setIsBottomMenuOpen(!isBottomMenuOpen)
      return
    }

    if (!isBottomMenuOpen && dragged < -25) {
      setIsBottomMenuOpen(true)
    } else if (isBottomMenuOpen && dragged > 25) {
      setIsBottomMenuOpen(false)
    }
  }

  const navigateMobile = (route: string) => {
    setIsBottomMenuOpen(false)
    navigate(route)
  }

  const popularMenuItems = menuItems.filter((m) => m.showInPopular)

  return (
    <div className="scan2-app-shell">
      {/* Ambient Atmospheric Glow Orbs */}
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />

      {/* ============================================================ */}
      {/* 🖥️ DESKTOP SIDEBAR NAVIGATION (hidden md:flex w-64)         */}
      {/* ============================================================ */}
      <aside className="scan2-desktop-sidebar">
        {/* Logo & Brand Header */}
        <div className="sidebar-brand-box">
          <div className="brand-icon-avatar">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="brand-name-text">
              Skin<span className="text-[#0f6784]">Cluv</span>
            </h1>
            <p className="brand-tagline">YOUR RADIANT JOURNEY</p>
          </div>
        </div>

        {/* Rounded Pill Navigation Menu */}
        <nav className="sidebar-menu-list">
          {menuItems.filter((m) => m.showInSidebar).map((item) => {
            const Icon = item.icon
            const active = item.route === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.route)

            return (
              <NavLink
                key={item.id}
                to={item.route}
                className={`sidebar-pill-link ${active ? 'active-pill' : ''}`}
              >
                <Icon size={18} className="link-icon" />
                <span className="link-text">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* ============================================================ */}
      {/* 🖥️ MAIN CONTENT AREA & STICKY TOP HEADER                    */}
      {/* ============================================================ */}
      <div className="scan2-content-area">
        {/* Sticky Glass Top Header */}
        <header className="scan2-top-header">
          {/* Left Context: Back Button & Page Title */}
          <div className="header-left-group">
            {location.pathname !== '/' && (
              <button onClick={() => navigate(-1)} className="mobile-back-btn">
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 className="header-page-title">{getPageTitle()}</h1>
          </div>

          {/* Right Context: Balance, Notifications & Profile */}
          <div className="header-right-actions">
            {/* Coin Balance Pill & Popover Dropdown */}
            <div className="relative-popover-wrap" ref={coinRef}>
              <button
                className="coin-balance-pill"
                onClick={() => {
                  setIsCoinDropdownOpen(!isCoinDropdownOpen)
                  setIsUserDropdownOpen(false)
                  setIsNotifDropdownOpen(false)
                }}
              >
                <Coins size={16} className="text-amber-500" />
                <span className="coin-amount-text">{userCoins.toLocaleString()}</span>
                <Plus size={12} className="text-amber-600" />
              </button>

              {isCoinDropdownOpen && (
                <div className="header-popover-menu animate-fade-in">
                  <div className="popover-header">
                    <span className="popover-title">Saldo Skin Coin</span>
                    <span className="popover-val">{userCoins.toLocaleString()} Koin</span>
                  </div>
                  <p className="popover-desc">
                    Gunakan koin untuk mengakses analisis AI saat kuota gratis habis.
                  </p>
                  <div className="popover-actions">
                    <button
                      className="btn-popover-primary"
                      onClick={() => {
                        setIsCoinDropdownOpen(false)
                        navigate('/pricing')
                      }}
                    >
                      + Topup / Beli Koin
                    </button>
                    <button
                      className="btn-popover-secondary"
                      onClick={() => {
                        setIsCoinDropdownOpen(false)
                        navigate('/coin-history')
                      }}
                    >
                      Riwayat Mutasi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative-popover-wrap" ref={notifRef}>
              <button
                className="header-icon-btn"
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen)
                  setIsUserDropdownOpen(false)
                  setIsCoinDropdownOpen(false)
                }}
                title="Notifikasi"
              >
                <Bell size={18} />
                <span className="notif-dot" />
              </button>

              {isNotifDropdownOpen && (
                <div className="header-popover-menu notif-popover animate-fade-in">
                  <div className="popover-header">
                    <span className="popover-title">Notifikasi</span>
                  </div>
                  <div className="notif-list">
                    <div className="notif-item">
                      <Sparkles size={16} className="text-teal-600 shrink-0" />
                      <div>
                        <p className="notif-text">Selamat datang di SkinCluv AI!</p>
                        <span className="notif-time">Baru saja</span>
                      </div>
                    </div>
                    <div className="notif-item">
                      <Coins size={16} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="notif-text">Bonus +50 Welcome Coins telah dikreditkan.</p>
                        <span className="notif-time">Hari ini</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill & Dropdown */}
            <div className="relative-popover-wrap" ref={dropdownRef}>
              <button
                className="header-user-avatar-pill"
                onClick={() => {
                  if (window.innerWidth < 768) {
                    navigate('/profile')
                  } else {
                    setIsUserDropdownOpen(!isUserDropdownOpen)
                    setIsCoinDropdownOpen(false)
                    setIsNotifDropdownOpen(false)
                  }
                }}
              >
                <div className="avatar-circle">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="avatar-name-desktop">{userName}</span>
                <ChevronDown size={14} className={`dropdown-chevron ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserDropdownOpen && (
                <div className="header-popover-menu profile-popover animate-fade-in">
                  <div className="profile-user-summary">
                    <p className="summary-name">{fullUserName}</p>
                    <span className={`summary-status ${isPro ? 'status-pro' : 'status-free'}`}>
                      {isPro ? 'Skincluv PRO Member' : 'Free Explorer'}
                    </span>
                  </div>

                  <div className="menu-divider" />

                  <button
                    className="menu-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      navigate('/profile')
                    }}
                  >
                    <User size={16} /> Profil Akun
                  </button>
                  <button
                    className="menu-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      navigate('/transactions')
                    }}
                  >
                    <Receipt size={16} /> Riwayat Tagihan
                  </button>
                  <button
                    className="menu-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      navigate('/coin-history')
                    }}
                  >
                    <History size={16} /> Riwayat Mutasi Koin
                  </button>

                  <div className="menu-divider" />

                  <button className="menu-dropdown-item text-red-600" onClick={handleLogout}>
                    <LogOut size={16} /> Keluar Akun
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Canvas Area */}
        <main className={`scan2-main-canvas ${location.pathname.startsWith('/chatbot') ? 'is-chatbot' : ''}`}>
          <div className="canvas-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ============================================================ */}
      {/* 📱 MOBILE BOTTOM NAV & PULL-UP BOTTOMSHEET DRAWER (md:hidden) */}
      {/* ============================================================ */}
      {isBottomMenuOpen && (
        <div
          className="mobile-backdrop-overlay"
          onClick={() => setIsBottomMenuOpen(false)}
        />
      )}

      <div className="mobile-bottomnav-wrapper">
        <nav
          className={`mobile-bottomsheet-card ${isBottomMenuOpen ? 'sheet-expanded' : 'sheet-collapsed'}`}
          style={{
            transform: isDragging ? `translateY(${currentY}px)` : 'translateY(0)',
          }}
        >
          {/* Pointer Drag Handle Header */}
          <div
            className="sheet-drag-handle-bar"
            onPointerDown={touchStart}
            onPointerMove={touchMove}
            onPointerUp={touchEnd}
            onPointerCancel={touchEnd}
          >
            <div className="drag-pill-indicator" />
          </div>

          {/* EXPANDED BOTTOMSHEET CONTENT */}
          <div className={`bottomsheet-scroll-body ${isBottomMenuOpen ? 'show-body' : 'hide-body'}`}>
            {/* Segmen 1: Menu Populer (Grid) */}
            <div className="sheet-section px-4">
              <p className="sheet-section-title">MENU POPULER</p>
              <div className="popular-menu-grid">
                {popularMenuItems.map((item) => {
                  const Icon = item.icon
                  const active = location.pathname.startsWith(item.route)
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigateMobile(item.route)}
                      className="popular-grid-item"
                    >
                      <div className={`popular-icon-box ${item.bg} ${item.color} ${active ? 'ring-2 ring-current' : ''}`}>
                        <Icon size={22} />
                      </div>
                      <span className="popular-label">{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="sheet-divider" />

            {/* Segmen 2: Semua Menu (List) */}
            <div className="sheet-section px-4 pb-20">
              <p className="sheet-section-title">SEMUA MENU</p>
              <div className="all-menu-stack">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigateMobile(item.route)}
                      className="menu-list-row"
                    >
                      <div className={`menu-row-avatar ${item.bg} ${item.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="menu-row-text">
                        <p className="row-title">{item.label}</p>
                        <p className="row-desc">{item.desc}</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* COLLAPSED 5-TAB FLOATING BOTTOM BAR */}
          <div className={`bottomnav-tabs-row ${isBottomMenuOpen ? 'hide-tabs' : 'show-tabs'}`}>
            <div onClick={() => navigateMobile('/')} className={`tab-item ${location.pathname === '/' ? 'active-tab' : ''}`}>
              <Sparkles size={20} />
              {location.pathname === '/' && <span className="tab-label">Home</span>}
            </div>

            <div onClick={() => navigateMobile('/profile')} className={`tab-item ${location.pathname.startsWith('/daily-tips') ? 'active-tab' : ''}`}>
              <Lightbulb size={20} />
              {location.pathname.startsWith('/daily-tips') && <span className="tab-label">Tips</span>}
            </div>

            <div onClick={() => navigateMobile('/face-scan')} className={`tab-item ${location.pathname.startsWith('/face-scan') ? 'active-tab' : ''}`}>
              <ScanFace size={22} />
              {location.pathname.startsWith('/face-scan') && <span className="tab-label">Scan</span>}
            </div>

            <div onClick={() => navigateMobile('/pricing')} className={`tab-item ${location.pathname.startsWith('/pricing') ? 'active-tab' : ''}`}>
              <Store size={20} />
              {location.pathname.startsWith('/pricing') && <span className="tab-label">Toko</span>}
            </div>

            <div onClick={() => navigateMobile('/profile')} className={`tab-item ${location.pathname.startsWith('/profile') ? 'active-tab' : ''}`}>
              <User size={20} />
              {location.pathname.startsWith('/profile') && <span className="tab-label">Profil</span>}
            </div>
          </div>
        </nav>
      </div>

      {/* VANILLA CSS NAVIGATION STYLING */}
      <style>{`
        .scan2-app-shell {
          height: 100dvh;
          width: 100vw;
          display: flex;
          background: #f8fafc;
          font-family: var(--font-body, system-ui, sans-serif);
          position: relative;
          overflow: hidden;
        }

        /* 🖥️ DESKTOP SIDEBAR STYLING */
        .scan2-desktop-sidebar {
          width: 256px;
          height: 100dvh;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          padding: 32px 16px;
          flex-shrink: 0;
          z-index: 40;
          box-shadow: 0 10px 40px rgba(15, 103, 132, 0.04);
        }

        @media (max-width: 768px) {
          .scan2-desktop-sidebar { display: none !important; }
        }

        .sidebar-brand-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          margin-bottom: 36px;
        }

        .brand-icon-avatar {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0f6784 0%, #38bdf8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(15, 103, 132, 0.2);
        }

        .brand-name-text {
          font-size: 1.25rem;
          font-weight: 900;
          color: #075985;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.1;
        }

        .brand-tagline {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #94a3b8;
          margin: 2px 0 0 0;
        }

        .sidebar-menu-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          overflow-y: auto;
        }

        .sidebar-pill-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          font-size: 0.875rem;
          font-weight: 800;
          color: #94a3b8;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .sidebar-pill-link:hover {
          background: rgba(234, 244, 250, 0.6);
          color: #0f6784;
          transform: translateX(4px);
        }

        .sidebar-pill-link.active-pill {
          background: rgba(234, 244, 250, 0.9);
          color: #0f6784;
        }

        /* 🖥️ CONTENT AREA & TOP HEADER */
        .scan2-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100dvh;
          min-width: 0;
          position: relative;
        }

        .scan2-top-header {
          position: sticky;
          top: 0;
          z-index: 30;
          height: 72px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(241, 245, 249, 0.8);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
        }

        @media (max-width: 768px) {
          .scan2-top-header {
            height: 60px;
            padding: 0 16px;
          }
        }

        .header-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-back-btn {
          display: none;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .mobile-back-btn { display: flex; }
        }

        .header-page-title {
          font-size: 1.15rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .header-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .relative-popover-wrap {
          position: relative;
        }

        .coin-balance-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 6px 14px;
          border-radius: 9999px;
          cursor: pointer;
          font-weight: 900;
          font-size: 0.825rem;
          color: #b45309;
        }

        .header-icon-btn {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
        }

        .notif-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
        }

        .header-user-avatar-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 4px 12px 4px 4px;
          border-radius: 9999px;
          cursor: pointer;
        }

        .avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0f6784;
          color: #ffffff;
          font-weight: 900;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-name-desktop {
          font-size: 0.825rem;
          font-weight: 800;
          color: #1e293b;
        }

        @media (max-width: 768px) {
          .avatar-name-desktop, .dropdown-chevron { display: none; }
          .header-user-avatar-pill { padding: 4px; border: none; background: transparent; }
        }

        /* POPOVER MENUS */
        .header-popover-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 240px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          z-index: 50;
        }

        .popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .popover-title { font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; }
        .popover-val { font-size: 0.85rem; font-weight: 900; color: #d97706; }
        .popover-desc { font-size: 0.725rem; color: #64748b; margin: 0 0 12px 0; }

        .popover-actions { display: flex; flex-direction: column; gap: 6px; }
        .btn-popover-primary { background: #0f6784; color: #fff; border: none; padding: 8px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer; }
        .btn-popover-secondary { background: #f1f5f9; color: #334155; border: none; padding: 8px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer; }

        .profile-user-summary { margin-bottom: 8px; }
        .summary-name { font-size: 0.875rem; font-weight: 900; color: #0f172a; margin: 0 0 4px 0; }
        .summary-status { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
        .status-pro { background: #dbeafe; color: #1e40af; }
        .status-free { background: #ecfdf5; color: #047857; }

        .menu-divider { height: 1px; background: #f1f5f9; margin: 8px 0; }
        .menu-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: transparent;
          border: none;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
          text-align: left;
        }

        .menu-dropdown-item:hover { background: #f8fafc; }

        /* CANVAS AREA */
        .scan2-main-canvas {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px 96px 32px;
        }

        @media (max-width: 768px) {
          .scan2-main-canvas { padding: 16px 16px 120px 16px; }
        }

        .canvas-container { max-width: 1280px; margin: 0 auto; }

        /* 📱 MOBILE BOTTOMNAV & PULL-UP BOTTOMSHEET DRAWER */
        .mobile-backdrop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          z-index: 40;
        }

        @media (min-width: 769px) {
          .mobile-backdrop-overlay, .mobile-bottomnav-wrapper { display: none !important; }
        }

        .mobile-bottomnav-wrapper {
          position: fixed;
          inset-x: 0;
          bottom: 16px;
          display: flex;
          justify-content: center;
          pointer-events: none;
          z-index: 50;
        }

        .mobile-bottomsheet-card {
          width: calc(100% - 24px);
          max-width: 480px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 40px;
          box-shadow: 0 -15px 50px rgba(0, 0, 0, 0.12);
          pointer-events: auto;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }

        .sheet-collapsed { height: 72px; }
        .sheet-expanded { height: calc(100dvh - 80px); }

        .sheet-drag-handle-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 28px;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: ns-resize;
          touch-action: none;
        }

        .drag-pill-indicator {
          width: 40px;
          height: 4px;
          background: #cbd5e1;
          border-radius: 9999px;
        }

        .bottomsheet-scroll-body {
          position: absolute;
          inset: 0;
          padding-top: 32px;
          overflow-y: auto;
          transition: opacity 0.3s ease;
        }

        .show-body { opacity: 1; pointer-events: auto; }
        .hide-body { opacity: 0; pointer-events: none; }

        .sheet-section-title {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .popular-menu-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .popular-grid-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .popular-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popular-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #475569;
          text-align: center;
        }

        .sheet-divider { height: 1px; background: #f1f5f9; margin: 16px 20px; }

        .all-menu-stack { display: flex; flex-direction: column; gap: 8px; }
        .menu-list-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 16px;
          cursor: pointer;
        }

        .menu-list-row:hover { background: #f8fafc; }

        .menu-row-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          shrink: 0;
        }

        .menu-row-text { flex: 1; min-width: 0; }
        .row-title { font-size: 0.85rem; font-weight: 800; color: #0f172a; margin: 0; }
        .row-desc { font-size: 0.725rem; color: #94a3b8; margin: 2px 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* COLLAPSED 5-TAB BAR */
        .bottomnav-tabs-row {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
          transition: all 0.3s ease;
        }

        .show-tabs { opacity: 1; pointer-events: auto; }
        .hide-tabs { opacity: 0; pointer-events: none; }

        .tab-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 9999px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-item.active-tab {
          background: #eaf4fa;
          color: #0f6784;
          font-weight: 900;
        }

        .tab-label { font-size: 0.725rem; font-weight: 900; }
      `}</style>
    </div>
  )
}

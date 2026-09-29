// src/pages/app/DashboardV2Page.tsx
// 100% Faithful Port of v0.dev Skincare Assistant Dashboard
// Complete Self-Contained Shell: v0 Sidebar (264px) + v0 Navbar (78px) + v0 Main Content

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Droplets,
  HeartPulse,
  Home,
  Leaf,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserRound,
  X,
  FlaskConical,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'

const navItems = [
  { label: 'Ringkasan', icon: Home, route: '/beranda-2' },
  { label: 'Perawatan wajah', icon: Sparkles, route: '/face-scan' },
  { label: 'Scan Komposisi', icon: FlaskConical, route: '/ingredient-scan' },
  { label: 'Jurnal harian', icon: CalendarDays, route: '/scan-history' },
]

const weekData = [
  { day: 'Sen', date: '21', score: 76 },
  { day: 'Sel', date: '22', score: 84 },
  { day: 'Rab', date: '23', score: 68 },
  { day: 'Kam', date: '24', score: 91 },
  { day: 'Jum', date: '25', score: 88 },
  { day: 'Sab', date: '26', score: 94 },
  { day: 'Min', date: '27', score: 82 },
]

const initialRoutine = [
  { title: 'Cleanser lembut', type: 'Pagi · 2 menit', done: true },
  { title: 'Serum niacinamide', type: 'Pagi · 1 menit', done: true },
  { title: 'Moisturizer + SPF 30', type: 'Pagi · 1 menit', done: false },
]

export default function DashboardV2Page() {
  const navigate = useNavigate()
  const { profile, coinBalance } = useAuthStore()
  const { data } = useDashboardData()

  const [activeNav, setActiveNav] = useState('Ringkasan')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [checked, setChecked] = useState(initialRoutine.map((item) => item.done))

  const toggleRoutine = (index: number) => {
    setChecked((items) => items.map((item, itemIndex) => (itemIndex === index ? !item : item)))
  }

  const skinAssessment = data?.skin_assessment
  const productSummary = data?.product_summary ?? { total_products_scanned: 0, safe_products_count: 0 }
  const missions = data?.missions ?? { completed: 0, total: 1 }

  const userName = profile?.full_name || 'Jessy'
  const firstName = userName.split(' ')[0]
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const userCredits = coinBalance?.balance ?? 1395

  return (
    <div className="v0-shell">
      {/* 1. TOP PREVIEW SWITCHER BANNER */}
      <aside className="v0-switch-topbar">
        <span>
          Preview: <strong>Versi 2 (100% Desain v0.dev: Sidebar + Navbar + Konten)</strong>
        </span>
        <button onClick={() => navigate('/')} className="btn-switch-original">
          Kembali ke Beranda Asli
        </button>
      </aside>

      <div className="v0-layout-frame">
        {/* 2. THE V0 SIDEBAR (264px) */}
        <aside className={`v0-sidebar ${isMenuOpen ? 'mobile-open' : ''}`}>
          {/* Logo Section */}
          <div className="v0-brand-row">
            <div className="v0-brand-group">
              <span className="v0-brand-icon">
                <Leaf size={19} strokeWidth={2.5} />
              </span>
              <span className="v0-brand-name">
                skincluv<span className="v0-brand-dot">.</span>
              </span>
            </div>
            <button
              className="v0-mobile-close-btn"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Section: Menu Utama */}
          <p className="v0-nav-label">Menu utama</p>
          <nav className="v0-nav-stack">
            {navItems.map(({ label, icon: Icon, route }) => {
              const isActive = activeNav === label
              return (
                <button
                  key={label}
                  onClick={() => {
                    setActiveNav(label)
                    setIsMenuOpen(false)
                    if (route !== '/beranda-2') navigate(route)
                  }}
                  className={`v0-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>

          {/* Section: Lainnya */}
          <p className="v0-nav-label mt-section">Lainnya</p>
          <nav className="v0-nav-stack">
            <button
              onClick={() => {
                setIsMenuOpen(false)
                navigate('/chatbot')
              }}
              className="v0-nav-item"
            >
              <MessageCircle size={18} />
              <span>Tanya Skinsistant</span>
              <span className="v0-chat-badge">AI</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false)
                navigate('/missions')
              }}
              className="v0-nav-item"
            >
              <HeartPulse size={18} />
              <span>Misi Glow</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false)
                navigate('/faq')
              }}
              className="v0-nav-item"
            >
              <CircleHelp size={18} />
              <span>Bantuan & FAQ</span>
            </button>
          </nav>

          {/* Bottom Security Card */}
          <div className="v0-trust-box">
            <div className="v0-trust-icon-wrap">
              <ShieldCheck size={17} />
            </div>
            <p className="v0-trust-title">Data kamu aman</p>
            <p className="v0-trust-sub">
              Privasi biometrik & data klinis selalu terlindungi sesuai UU PDP.
            </p>
          </div>

          {/* User Profile Pill at Bottom */}
          <button
            onClick={() => navigate('/profile')}
            className="v0-user-profile-btn"
          >
            <span className="v0-avatar-circle">
              <UserRound size={17} />
            </span>
            <span className="v0-user-info">
              <span className="v0-user-name">{userName}</span>
              <span className="v0-user-role">Profil saya</span>
            </span>
            <MoreHorizontal size={16} className="v0-more-dots" />
          </button>
        </aside>

        {/* 3. MAIN SECTION WITH NAVBAR & CONTENT */}
        <div className="v0-main-content">
          {/* Top Navbar Header (78px) */}
          <header className="v0-navbar">
            <button
              className="v0-burger-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </button>

            {/* Search Input Box */}
            <div className="v0-search-container">
              <Search size={17} className="v0-search-icon" />
              <input
                className="v0-search-input"
                placeholder="Cari di skincluv..."
                aria-label="Cari"
              />
            </div>

            {/* Right Topbar Icons */}
            <div className="v0-topbar-right">
              {/* Credits Pill */}
              <div className="v0-credits-badge" onClick={() => navigate('/pricing')}>
                <Zap size={14} className="text-amber-500 fill-amber-500" />
                <span>{userCredits} Credits</span>
              </div>

              {/* Notification Bell */}
              <button className="v0-bell-btn" aria-label="Notifikasi">
                <Bell size={19} />
                <span className="v0-bell-dot" />
              </button>

              <div className="v0-topbar-divider" />

              {/* Profile Pill */}
              <button onClick={() => navigate('/profile')} className="v0-user-topbar-btn">
                <span className="v0-topbar-avatar">{userInitials}</span>
                <span className="v0-topbar-name">{firstName}</span>
              </button>
            </div>
          </header>

          {/* 4. DASHBOARD CONTENT GRID */}
          <main className="v0-body-padding">
            {/* GREETING HERO BAR */}
            <div className="v0-greeting-row">
              <div>
                <p className="v0-greeting-date">Sabtu, 26 Oktober 2024</p>
                <h1 className="v0-greeting-title">Selamat pagi, {firstName}</h1>
                <p className="v0-greeting-sub">Jaga ritmemu hari ini, satu langkah kecil sudah berarti.</p>
              </div>
              <button
                onClick={() => navigate('/face-scan')}
                className="v0-btn-checkin"
              >
                <Sparkles size={15} />
                <span>Mulai check-in</span>
              </button>
            </div>

            {/* 3 STAT CARDS */}
            <div className="v0-stats-row">
              <div className="v0-stat-card">
                <div className="v0-stat-head">
                  <span className="v0-stat-icon-wrap bg-teal text-teal">
                    <HeartPulse size={18} />
                  </span>
                  <span className="v0-stat-head-label">Kesehatan hari ini</span>
                </div>
                <div className="v0-stat-num-group">
                  <span className="v0-stat-number">{skinAssessment?.latest_score || 82}</span>
                  <span className="v0-stat-denom">/100</span>
                </div>
                <p className="v0-stat-sub-note">+6 dari kemarin</p>
              </div>

              <div className="v0-stat-card">
                <div className="v0-stat-head">
                  <span className="v0-stat-icon-wrap bg-blue text-blue">
                    <Droplets size={18} />
                  </span>
                  <span className="v0-stat-head-label">Hidrasi</span>
                </div>
                <div className="v0-stat-num-group">
                  <span className="v0-stat-number">1.4</span>
                  <span className="v0-stat-denom">L / 2L</span>
                </div>
                <p className="v0-stat-sub-note">60% target harian</p>
              </div>

              <div className="v0-stat-card">
                <div className="v0-stat-head">
                  <span className="v0-stat-icon-wrap bg-coral text-coral">
                    <SunMedium size={18} />
                  </span>
                  <span className="v0-stat-head-label">Paparan UV</span>
                </div>
                <div className="v0-stat-num-group">
                  <span className="v0-stat-number">Rendah</span>
                </div>
                <p className="v0-stat-sub-note">Waktu aman hingga 10.30</p>
              </div>
            </div>

            {/* MIDDLE ROW: WEEKLY CHART (1.55fr) + INSIGHT (1fr) */}
            <div className="v0-middle-row">
              {/* Weekly Chart */}
              <section className="v0-panel v0-chart-panel">
                <div className="v0-panel-header">
                  <div>
                    <h2 className="v0-panel-title">Keseimbangan mingguan</h2>
                    <p className="v0-panel-subtitle">Ringkasan dari check-in dan jurnal harianmu</p>
                  </div>
                  <button onClick={() => navigate('/scan-history')} className="v0-link-btn">
                    Lihat detail <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="v0-bars-wrapper">
                  {weekData.map((item, index) => {
                    const isHighlight = index === 5
                    return (
                      <div key={item.day} className="v0-bar-column">
                        <div className="v0-bar-pillar-slot">
                          <div
                            className={`v0-bar-pillar ${isHighlight ? 'active' : ''}`}
                            style={{ height: `${item.score}%` }}
                          />
                          {isHighlight && (
                            <span className="v0-highlight-tooltip">{item.score}</span>
                          )}
                        </div>
                        <span className={`v0-bar-day-name ${isHighlight ? 'active' : ''}`}>
                          {item.day}
                        </span>
                        <span className="v0-bar-date-num">{item.date}</span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Insight Card */}
              <section className="v0-panel v0-insight-box">
                <div className="v0-insight-header">
                  <div>
                    <p className="v0-insight-tag">INSIGHT UNTUKMU</p>
                    <h2 className="v0-insight-headline">Kulitmu butuh jeda</h2>
                  </div>
                  <span className="v0-insight-icon-pill">
                    <Leaf size={18} />
                  </span>
                </div>

                <p className="v0-insight-paragraph">
                  Dari catatanmu minggu ini, kulit terlihat lebih sensitif setelah hari yang panjang. Coba sederhanakan rutinitas malam ini.
                </p>

                <div className="v0-insight-bottom">
                  <span className="v0-insight-source">Berdasarkan 4 catatan</span>
                  <button onClick={() => navigate('/chatbot')} className="v0-insight-link">
                    Buka jurnal <ChevronRight size={14} />
                  </button>
                </div>
              </section>
            </div>

            {/* BOTTOM ROW: ROUTINE (1fr) + RECENT ACTIVITIES (1.55fr) */}
            <div className="v0-bottom-row">
              {/* Routine Checklist */}
              <section className="v0-panel">
                <div className="v0-panel-header">
                  <div>
                    <h2 className="v0-panel-title">Rutinitas pagi</h2>
                    <p className="v0-panel-subtitle">3 langkah · sekitar 4 menit</p>
                  </div>
                  <button className="v0-subtle-options-btn" aria-label="Opsi">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="v0-routine-stack">
                  {initialRoutine.map((item, index) => (
                    <button
                      key={item.title}
                      onClick={() => toggleRoutine(index)}
                      className="v0-routine-row-btn"
                    >
                      <span className={`v0-square-checkbox ${checked[index] ? 'checked' : ''}`}>
                        <Check size={15} strokeWidth={3} />
                      </span>
                      <div className="v0-routine-text-block">
                        <span className={`v0-routine-title-text ${checked[index] ? 'strikethrough' : ''}`}>
                          {item.title}
                        </span>
                        <span className="v0-routine-duration">{item.type}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/missions')}
                  className="v0-outline-wide-btn"
                >
                  Lihat rutinitas lengkap <ChevronRight size={14} />
                </button>
              </section>

              {/* Recent Activity */}
              <section className="v0-panel">
                <div className="v0-panel-header">
                  <div>
                    <h2 className="v0-panel-title">Aktivitas terakhir</h2>
                    <p className="v0-panel-subtitle">Catatan kesehatan dan perawatanmu</p>
                  </div>
                  <button onClick={() => navigate('/scan-history')} className="v0-link-btn">
                    Lihat semua
                  </button>
                </div>

                <div className="v0-activities-tiles">
                  <div className="v0-act-tile">
                    <span className="v0-act-tile-icon bg-blue text-blue">
                      <Droplets size={17} />
                    </span>
                    <p className="v0-act-tile-title">Minum air</p>
                    <p className="v0-act-tile-time">Hari ini, 08.12</p>
                    <p className="v0-act-tile-val">+250 ml</p>
                  </div>

                  <div className="v0-act-tile">
                    <span className="v0-act-tile-icon bg-teal text-teal">
                      <Sparkles size={17} />
                    </span>
                    <p className="v0-act-tile-title">Rutinitas wajah</p>
                    <p className="v0-act-tile-time">Hari ini, 07.40</p>
                    <p className="v0-act-tile-val">Selesai</p>
                  </div>

                  <div className="v0-act-tile">
                    <span className="v0-act-tile-icon bg-lavender text-lavender">
                      <Activity size={17} />
                    </span>
                    <p className="v0-act-tile-title">Mood check-in</p>
                    <p className="v0-act-tile-time">Kemarin, 21.05</p>
                    <p className="v0-act-tile-val">Tenang</p>
                  </div>
                </div>

                {/* Sunscreen Reminder Strip */}
                <div className="v0-sunscreen-reminder">
                  <span className="v0-sun-circle">
                    <SunMedium size={16} />
                  </span>
                  <p className="v0-sun-message">
                    Jangan lupa re-apply sunscreen sebelum keluar siang nanti.
                  </p>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* PURE SCOPED VANILLA CSS — 100% REPRODUCING V0 DESIGN TOKENS */}
      <style>{`
        .v0-shell {
          min-height: 100vh;
          width: 100vw;
          background: #f7faff;
          color: #13243c;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .v0-switch-topbar {
          background: #1f9d97;
          color: #ffffff;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          font-weight: 500;
          z-index: 50;
          position: sticky;
          top: 0;
        }
        .btn-switch-original {
          background: #ffffff;
          color: #167f7b;
          border: none;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .v0-layout-frame {
          max-width: 1500px;
          margin: 0 auto;
          display: flex;
          min-height: calc(100vh - 40px);
        }

        /* ----------------- SIDEBAR (264px) ----------------- */
        .v0-sidebar {
          width: 264px;
          background: #ffffff;
          border-right: 1px solid #dce8f1;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-sizing: border-box;
          min-height: calc(100vh - 40px);
        }

        .v0-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
        }
        .v0-brand-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .v0-brand-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #dff4f2;
          color: #1d9b93;
        }
        .v0-brand-name {
          font-size: 21px;
          font-weight: 600;
          letter-spacing: -0.04em;
          color: #13243c;
        }
        .v0-brand-dot {
          color: #21a19b;
        }
        .v0-mobile-close-btn {
          display: none;
          background: none;
          border: none;
          color: #8291a3;
          cursor: pointer;
        }

        .v0-nav-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #98a7b7;
          margin: 36px 0 10px 12px;
        }
        .v0-nav-label.mt-section {
          margin-top: 28px;
        }

        .v0-nav-stack {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .v0-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 12px;
          border-radius: 12px;
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 500;
          color: #708095;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          text-align: left;
        }
        .v0-nav-item:hover {
          background: #f4f8fb;
          color: #3b5064;
        }
        .v0-nav-item.active {
          background: #eaf8f7;
          color: #167f7b;
          font-weight: 600;
        }
        .v0-chat-badge {
          margin-left: auto;
          background: #e4f2ff;
          color: #4288c5;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .v0-trust-box {
          margin-top: auto;
          background: #f2fafb;
          border-radius: 16px;
          padding: 16px;
          box-sizing: border-box;
        }
        .v0-trust-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          color: #28a19b;
          margin-bottom: 12px;
        }
        .v0-trust-title {
          font-size: 12px;
          font-weight: 600;
          color: #315467;
          margin: 0;
        }
        .v0-trust-sub {
          font-size: 11px;
          line-height: 1.5;
          color: #7a98a5;
          margin: 4px 0 0;
        }

        .v0-user-profile-btn {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .v0-avatar-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #dce9f2;
          color: #607d91;
          flex-shrink: 0;
        }
        .v0-user-info {
          flex: 1;
          min-width: 0;
        }
        .v0-user-name {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #13243c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v0-user-role {
          display: block;
          font-size: 11px;
          color: #92a0ae;
        }
        .v0-more-dots {
          color: #99a7b5;
          flex-shrink: 0;
        }

        /* ----------------- MAIN AREA ----------------- */
        .v0-main-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        /* ----------------- TOP NAVBAR (78px) ----------------- */
        .v0-navbar {
          height: 78px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e3edf4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 36px;
          box-sizing: border-box;
          position: sticky;
          top: 36px;
          z-index: 30;
        }
        .v0-burger-btn {
          display: none;
          background: none;
          border: none;
          color: #6d8296;
          cursor: pointer;
        }

        .v0-search-container {
          position: relative;
          max-width: 340px;
          width: 100%;
        }
        .v0-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9babb9;
          pointer-events: none;
        }
        .v0-search-input {
          height: 40px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e4edf3;
          background: #f8fbfd;
          padding: 0 16px 0 40px;
          font-size: 12.5px;
          color: #13243c;
          outline: none;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }
        .v0-search-input:focus {
          border-color: #9cdad5;
          background: #ffffff;
        }
        .v0-search-input::placeholder {
          color: #9babb9;
        }

        .v0-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: auto;
        }
        .v0-credits-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f0f7ff;
          border: 1px solid #d5e7f7;
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #2b6cb0;
          cursor: pointer;
        }
        .v0-bell-btn {
          position: relative;
          background: none;
          border: none;
          color: #708397;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .v0-bell-dot {
          position: absolute;
          right: -2px;
          top: -2px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef8f74;
        }
        .v0-topbar-divider {
          width: 1px;
          height: 24px;
          background: #e4edf3;
        }
        .v0-user-topbar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .v0-topbar-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #d9eff0;
          color: #258e8b;
          font-size: 12px;
          font-weight: 700;
        }
        .v0-topbar-name {
          font-size: 12.5px;
          font-weight: 500;
          color: #425b70;
        }

        /* ----------------- BODY PADDING ----------------- */
        .v0-body-padding {
          padding: 32px 36px 60px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* GREETING ROW */
        .v0-greeting-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .v0-greeting-date {
          font-size: 12px;
          font-weight: 500;
          color: #7990a3;
          margin-bottom: 6px;
        }
        .v0-greeting-title {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.045em;
          color: #1b3048;
          margin: 0;
          line-height: 1.2;
        }
        .v0-greeting-sub {
          font-size: 13px;
          color: #72879a;
          margin: 6px 0 0;
        }
        .v0-btn-checkin {
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          background: #1f9d97;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          border: none;
          cursor: pointer;
          box-shadow: 0 7px 18px rgba(31, 157, 151, 0.18);
          transition: background 0.15s ease;
        }
        .v0-btn-checkin:hover {
          background: #188b86;
        }

        /* STATS CARDS */
        .v0-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .v0-stat-card {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }
        .v0-stat-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v0-stat-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
        }
        .bg-teal { background: #e5f7f4; }
        .text-teal { color: #299d96; }
        .bg-blue { background: #e6f2ff; }
        .text-blue { color: #4b91c6; }
        .bg-coral { background: #fff0e9; }
        .text-coral { color: #e28b65; }
        .bg-lavender { background: #f1edff; }
        .text-lavender { color: #896bc2; }

        .v0-stat-head-label {
          font-size: 12px;
          font-weight: 500;
          color: #7d91a2;
        }
        .v0-stat-num-group {
          margin-top: 18px;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .v0-stat-number {
          font-size: 27px;
          font-weight: 600;
          letter-spacing: -0.04em;
          color: #1c3449;
          line-height: 1;
        }
        .v0-stat-denom {
          font-size: 12px;
          color: #93a2af;
        }
        .v0-stat-sub-note {
          margin: 6px 0 0;
          font-size: 11px;
          color: #86a0ae;
        }

        /* SHARED PANEL STYLES */
        .v0-panel {
          border-radius: 16px;
          border: 1px solid #dfeaf2;
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
          box-sizing: border-box;
        }
        .v0-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .v0-panel-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #13243c;
          margin: 0;
        }
        .v0-panel-subtitle {
          font-size: 12px;
          color: #8496a6;
          margin: 4px 0 0;
        }
        .v0-link-btn {
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 600;
          color: #258e8b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .v0-link-btn:hover { opacity: 0.8; }

        /* MIDDLE ROW: 1.55fr 1fr */
        .v0-middle-row {
          display: grid;
          grid-template-columns: 1.55fr 1fr;
          gap: 20px;
        }

        /* WEEKLY BARS */
        .v0-bars-wrapper {
          height: 190px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          padding: 0 4px;
        }
        .v0-bar-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex: 1;
          height: 100%;
        }
        .v0-bar-pillar-slot {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 155px;
          width: 100%;
        }
        .v0-bar-pillar {
          width: 100%;
          max-width: 28px;
          border-radius: 8px 8px 0 0;
          background: #d9f0ef;
          transition: height 0.3s ease;
        }
        .v0-bar-pillar.active {
          background: #2aa6a0;
        }
        .v0-highlight-tooltip {
          position: absolute;
          top: -26px;
          border-radius: 6px;
          background: #19364a;
          padding: 3px 7px;
          font-size: 10px;
          font-weight: 600;
          color: #ffffff;
        }
        .v0-bar-day-name {
          font-size: 11px;
          color: #94a3b0;
        }
        .v0-bar-day-name.active {
          color: #1e9892;
          font-weight: 600;
        }
        .v0-bar-date-num {
          font-size: 11px;
          font-weight: 500;
          color: #647e91;
        }

        /* INSIGHT PANEL */
        .v0-insight-box {
          background: #eef9f8;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .v0-insight-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .v0-insight-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #5d9896;
          margin: 0;
        }
        .v0-insight-headline {
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #20485a;
          margin: 6px 0 0;
        }
        .v0-insight-icon-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #ffffff;
          color: #2aa39c;
        }
        .v0-insight-paragraph {
          font-size: 13px;
          line-height: 1.6;
          color: #557985;
          margin: 16px 0;
        }
        .v0-insight-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #d5eeeb;
          padding-top: 16px;
        }
        .v0-insight-source {
          font-size: 11px;
          font-weight: 500;
          color: #6b9295;
        }
        .v0-insight-link {
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 600;
          color: #208c87;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        /* BOTTOM ROW: 1fr 1.55fr */
        .v0-bottom-row {
          display: grid;
          grid-template-columns: 1fr 1.55fr;
          gap: 20px;
        }

        .v0-subtle-options-btn {
          background: none;
          border: none;
          color: #91a1af;
          cursor: pointer;
        }
        .v0-routine-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .v0-routine-row-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          padding: 2px 0;
        }
        .v0-square-checkbox {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid #d4e1e9;
          background: #ffffff;
          color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .v0-square-checkbox.checked {
          background: #2ca59e;
          border-color: #2ca59e;
          color: #ffffff;
        }
        .v0-routine-text-block {
          flex: 1;
        }
        .v0-routine-title-text {
          display: block;
          font-size: 12.5px;
          font-weight: 500;
          color: #3c566a;
        }
        .v0-routine-title-text.strikethrough {
          color: #8296a5;
          text-decoration: line-through;
        }
        .v0-routine-duration {
          display: block;
          font-size: 10.5px;
          color: #9aabb8;
          margin-top: 2px;
        }
        .v0-outline-wide-btn {
          margin-top: 24px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #d9e8ef;
          background: #ffffff;
          padding: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #4b7488;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .v0-outline-wide-btn:hover {
          background: #f7fbfc;
        }

        /* RECENT ACTIVITY TILES */
        .v0-activities-tiles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .v0-act-tile {
          border-radius: 12px;
          border: 1px solid #e5eef3;
          padding: 16px;
          box-sizing: border-box;
          background: #ffffff;
        }
        .v0-act-tile-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }
        .v0-act-tile-title {
          font-size: 12px;
          font-weight: 600;
          color: #3d576a;
          margin: 12px 0 2px;
        }
        .v0-act-tile-time {
          font-size: 10px;
          color: #9aaab6;
          margin: 0;
        }
        .v0-act-tile-val {
          font-size: 11px;
          font-weight: 600;
          color: #5b7a8d;
          margin: 12px 0 0;
        }

        .v0-sunscreen-reminder {
          margin-top: 20px;
          border-radius: 12px;
          background: #f7fafc;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v0-sun-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          color: #e0a264;
          flex-shrink: 0;
        }
        .v0-sun-message {
          font-size: 11px;
          line-height: 1.5;
          color: #71899a;
          margin: 0;
        }

        /* ----------------- RESPONSIVE BREAKPOINTS ----------------- */
        @media (max-width: 1024px) {
          .v0-sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease-in-out;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
          }
          .v0-sidebar.mobile-open {
            transform: translateX(0);
          }
          .v0-mobile-close-btn {
            display: block;
          }
          .v0-burger-btn {
            display: block;
          }
          .v0-middle-row,
          .v0-bottom-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .v0-navbar {
            padding: 0 16px;
          }
          .v0-search-container {
            display: none;
          }
          .v0-body-padding {
            padding: 20px 16px 40px;
          }
          .v0-stats-row {
            grid-template-columns: 1fr;
          }
          .v0-activities-tiles {
            grid-template-columns: 1fr;
          }
          .v0-greeting-title {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  )
}

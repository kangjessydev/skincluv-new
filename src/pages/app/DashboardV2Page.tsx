// src/pages/app/DashboardV2Page.tsx
// Skincluv Fresh Tech Dashboard (100% v0.dev Human Proportions & Plus Jakarta Sans)
// Real Skincluv Navigation Menus + Real User Data + Spacious Human UI

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
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserRound,
  X,
  ScanFace,
  FlaskConical,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'

// Skincluv Real Menus
const navMainItems = [
  { label: 'Beranda', icon: Home, route: '/beranda-2' },
  { label: 'Scan Wajah', icon: ScanFace, route: '/face-scan' },
  { label: 'Scan Komposisi', icon: FlaskConical, route: '/ingredient-scan' },
  { label: 'Riwayat Scan', icon: CalendarDays, route: '/scan-history' },
]

const navOtherItems = [
  { label: 'Skinsistant AI', icon: MessageCircle, route: '/chatbot', badge: 'AI' },
  { label: 'Misi Glow', icon: HeartPulse, route: '/missions' },
  { label: 'Paket & Langganan', icon: ShieldCheck, route: '/pricing' },
  { label: 'Bantuan & FAQ', icon: CircleHelp, route: '/faq' },
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
  { title: 'Cleanser Lembut (pH Balance)', type: 'Pagi · 2 menit', done: true },
  { title: 'Serum Niacinamide / Hidrasi', type: 'Pagi · 1 menit', done: true },
  { title: 'Moisturizer + Sunscreen SPF 50', type: 'Pagi · 2 menit', done: false },
]

export default function DashboardV2Page() {
  const navigate = useNavigate()
  const { profile, coinBalance } = useAuthStore()
  const { data } = useDashboardData()

  const [activeNav, setActiveNav] = useState('Beranda')
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
    <div className="v0-root">
      {/* FLOATING TOGGLE BUTTON AT BOTTOM RIGHT (Out of the way) */}
      <button
        onClick={() => navigate('/')}
        className="v0-floating-toggle"
        title="Kembali ke Beranda Asli"
      >
        <span>← Kembali ke Versi 1</span>
      </button>

      <div className="v0-wrapper">
        {/* ===================== SIDEBAR (264px) ===================== */}
        <aside className={`v0-aside ${isMenuOpen ? 'open' : ''}`}>
          {/* Brand Logo */}
          <div className="v0-aside-brand">
            <div className="v0-brand-flex">
              <span className="v0-logo-icon">
                <Sparkles size={20} strokeWidth={2.5} />
              </span>
              <span className="v0-brand-text">
                skincluv<span className="v0-brand-teal-dot">.</span>
              </span>
            </div>
            <button
              className="v0-close-menu-btn"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Nav Section: Menu Utama */}
          <p className="v0-section-heading">MENU UTAMA</p>
          <nav className="v0-nav-list">
            {navMainItems.map(({ label, icon: Icon, route }) => {
              const isActive = activeNav === label
              return (
                <button
                  key={label}
                  onClick={() => {
                    setActiveNav(label)
                    setIsMenuOpen(false)
                    if (route !== '/beranda-2') navigate(route)
                  }}
                  className={`v0-menu-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>

          {/* Nav Section: Lainnya */}
          <p className="v0-section-heading v0-mt-10">LAINNYA</p>
          <nav className="v0-nav-list">
            {navOtherItems.map(({ label, icon: Icon, route, badge }) => (
              <button
                key={label}
                onClick={() => {
                  setActiveNav(label)
                  setIsMenuOpen(false)
                  navigate(route)
                }}
                className="v0-menu-btn"
              >
                <Icon size={20} strokeWidth={2} />
                <span>{label}</span>
                {badge && <span className="v0-badge-num">{badge}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom Security Card */}
          <div className="v0-security-card">
            <div className="v0-security-icon-circle">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <p className="v0-security-title">Data kamu aman</p>
            <p className="v0-security-desc">
              Privasi biometrik & data klinis selalu terlindungi sesuai UU PDP.
            </p>
          </div>

          {/* Profile Strip at Bottom */}
          <button
            onClick={() => navigate('/profile')}
            className="v0-profile-strip"
          >
            <span className="v0-profile-avatar-circle">
              <UserRound size={19} />
            </span>
            <span className="v0-profile-text-wrap">
              <span className="v0-profile-name">{userName}</span>
              <span className="v0-profile-sub">Profil saya</span>
            </span>
            <MoreHorizontal size={18} className="v0-profile-dots" />
          </button>
        </aside>

        {/* ===================== MAIN CONTENT COLUMN ===================== */}
        <section className="v0-content-col">
          {/* Top Navbar Header (78px) */}
          <header className="v0-header">
            <button
              className="v0-burger-mobile-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>

            {/* Search Box */}
            <div className="v0-search-box">
              <Search size={18} className="v0-search-ico" />
              <input
                className="v0-search-input-field"
                placeholder="Cari fitur, produk, atau jurnal..."
                aria-label="Cari"
              />
            </div>

            {/* Right Topbar Cluster */}
            <div className="v0-header-right">
              {/* Credits Pill Badge */}
              <div
                className="v0-credits-pill"
                onClick={() => navigate('/pricing')}
                title="Kelola AI Credits"
              >
                <Zap size={14} className="v0-credits-zap" />
                <span>{userCredits} Credits</span>
              </div>

              {/* Notification Bell */}
              <button className="v0-notif-btn" aria-label="Notifikasi">
                <Bell size={20} />
                <span className="v0-notif-dot" />
              </button>

              <div className="v0-header-vdivider" />

              {/* User Profile Pill */}
              <button onClick={() => navigate('/profile')} className="v0-header-profile-btn">
                <span className="v0-header-avatar">{userInitials}</span>
                <span className="v0-header-profile-name">{firstName}</span>
              </button>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <div className="v0-page-body">
            {/* Top Greeting Row */}
            <div className="v0-greeting-header-row">
              <div>
                <p className="v0-greeting-date-text">Sabtu, 26 Oktober 2024</p>
                <h1 className="v0-greeting-h1">Selamat pagi, {firstName}</h1>
                <p className="v0-greeting-lead">Jaga ritmemu hari ini, satu langkah kecil sudah berarti.</p>
              </div>
              <button
                onClick={() => navigate('/face-scan')}
                className="v0-checkin-btn"
              >
                <Sparkles size={16} strokeWidth={2.2} />
                <span>Mulai check-in</span>
              </button>
            </div>

            {/* 3 Top Stat Cards */}
            <div className="v0-stats-trio">
              {/* Card 1: Kesehatan hari ini */}
              <div className="v0-stat-box">
                <div className="v0-stat-head-flex">
                  <span className="v0-stat-ico-container bg-teal text-teal">
                    <HeartPulse size={20} strokeWidth={2.2} />
                  </span>
                  <span className="v0-stat-label-text">Kesehatan hari ini</span>
                </div>
                <div className="v0-stat-number-row">
                  <span className="v0-stat-big-num">{skinAssessment?.latest_score || 82}</span>
                  <span className="v0-stat-sub-denom">/100</span>
                </div>
                <p className="v0-stat-delta-note">
                  {skinAssessment?.trend_label ? `+6 dari kemarin` : '+6 dari kemarin'}
                </p>
              </div>

              {/* Card 2: Hidrasi */}
              <div className="v0-stat-box">
                <div className="v0-stat-head-flex">
                  <span className="v0-stat-ico-container bg-blue text-blue">
                    <Droplets size={20} strokeWidth={2.2} />
                  </span>
                  <span className="v0-stat-label-text">Hidrasi</span>
                </div>
                <div className="v0-stat-number-row">
                  <span className="v0-stat-big-num">1.4</span>
                  <span className="v0-stat-sub-denom">L / 2L</span>
                </div>
                <p className="v0-stat-delta-note">60% target harian</p>
              </div>

              {/* Card 3: Paparan UV */}
              <div className="v0-stat-box">
                <div className="v0-stat-head-flex">
                  <span className="v0-stat-ico-container bg-coral text-coral">
                    <SunMedium size={20} strokeWidth={2.2} />
                  </span>
                  <span className="v0-stat-label-text">Paparan UV</span>
                </div>
                <div className="v0-stat-number-row">
                  <span className="v0-stat-big-num">Rendah</span>
                </div>
                <p className="v0-stat-delta-note">Waktu aman hingga 10.30</p>
              </div>
            </div>

            {/* Middle Grid: Chart (1.55fr) + Insight (1fr) */}
            <div className="v0-middle-split-grid">
              {/* Weekly Balance Chart */}
              <section className="v0-card-panel">
                <div className="v0-panel-title-row">
                  <div>
                    <h2 className="v0-h2-title">Keseimbangan mingguan</h2>
                    <p className="v0-p-sub">Ringkasan dari check-in dan jurnal harianmu</p>
                  </div>
                  <button onClick={() => navigate('/scan-history')} className="v0-action-link-btn">
                    Lihat detail <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="v0-bars-chart-row">
                  {weekData.map((item, index) => {
                    const isHighlight = index === 5
                    return (
                      <div key={item.day} className="v0-bar-item-col">
                        <div className="v0-bar-track-box">
                          <div
                            className={`v0-bar-colored-pillar ${isHighlight ? 'active' : ''}`}
                            style={{ height: `${item.score}%` }}
                          />
                          {isHighlight && (
                            <span className="v0-bar-badge-tooltip">{item.score}</span>
                          )}
                        </div>
                        <span className={`v0-bar-day-title ${isHighlight ? 'active' : ''}`}>
                          {item.day}
                        </span>
                        <span className="v0-bar-date-label">{item.date}</span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Insight Card */}
              <section className="v0-card-panel v0-insight-colored-panel">
                <div className="v0-panel-title-row">
                  <div>
                    <p className="v0-insight-micro-tag">INSIGHT UNTUKMU</p>
                    <h2 className="v0-insight-main-h2">Kulitmu butuh jeda</h2>
                  </div>
                  <span className="v0-insight-top-icon">
                    <Sparkles size={20} />
                  </span>
                </div>

                <p className="v0-insight-body-text">
                  {skinAssessment?.analysis_notes ||
                    'Dari catatanmu minggu ini, kulit terlihat lebih sensitif setelah hari yang panjang. Coba sederhanakan rutinitas malam ini.'}
                </p>

                <div className="v0-insight-footer-row">
                  <span className="v0-insight-source-label">Berdasarkan 4 catatan</span>
                  <button onClick={() => navigate('/chatbot')} className="v0-insight-btn-action">
                    Buka jurnal <ChevronRight size={15} />
                  </button>
                </div>
              </section>
            </div>

            {/* Bottom Grid: Routine (1fr) + Activity (1.55fr) */}
            <div className="v0-bottom-split-grid">
              {/* Rutinitas Pagi */}
              <section className="v0-card-panel">
                <div className="v0-panel-title-row">
                  <div>
                    <h2 className="v0-h2-title">Rutinitas pagi</h2>
                    <p className="v0-p-sub">3 langkah · sekitar 4 menit</p>
                  </div>
                  <button className="v0-more-options-btn" aria-label="Opsi rutinitas">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <div className="v0-routine-items-list">
                  {initialRoutine.map((item, index) => (
                    <button
                      key={item.title}
                      onClick={() => toggleRoutine(index)}
                      className="v0-routine-entry-btn"
                    >
                      <span className={`v0-routine-checkbox ${checked[index] ? 'checked' : ''}`}>
                        <Check size={16} strokeWidth={3} />
                      </span>
                      <div className="v0-routine-entry-info">
                        <span className={`v0-routine-task-name ${checked[index] ? 'checked-text' : ''}`}>
                          {item.title}
                        </span>
                        <span className="v0-routine-task-meta">{item.type}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/missions')}
                  className="v0-see-all-routine-btn"
                >
                  Lihat rutinitas lengkap <ChevronRight size={15} />
                </button>
              </section>

              {/* Aktivitas Terakhir */}
              <section className="v0-card-panel">
                <div className="v0-panel-title-row">
                  <div>
                    <h2 className="v0-h2-title">Aktivitas terakhir</h2>
                    <p className="v0-p-sub">Catatan kesehatan dan perawatanmu</p>
                  </div>
                  <button onClick={() => navigate('/scan-history')} className="v0-action-link-btn">
                    Lihat semua
                  </button>
                </div>

                <div className="v0-activities-3cols">
                  <div className="v0-single-activity-card">
                    <span className="v0-activity-icon-badge bg-blue text-blue">
                      <Droplets size={19} />
                    </span>
                    <p className="v0-act-title-text">Minum air</p>
                    <p className="v0-act-time-text">Hari ini, 08.12</p>
                    <p className="v0-act-val-text">+250 ml</p>
                  </div>

                  <div className="v0-single-activity-card">
                    <span className="v0-activity-icon-badge bg-teal text-teal">
                      <Sparkles size={19} />
                    </span>
                    <p className="v0-act-title-text">Rutinitas wajah</p>
                    <p className="v0-act-time-text">Hari ini, 07.40</p>
                    <p className="v0-act-val-text">Selesai</p>
                  </div>

                  <div className="v0-single-activity-card">
                    <span className="v0-activity-icon-badge bg-lavender text-lavender">
                      <Activity size={19} />
                    </span>
                    <p className="v0-act-title-text">Mood check-in</p>
                    <p className="v0-act-time-text">Kemarin, 21.05</p>
                    <p className="v0-act-val-text">Tenang</p>
                  </div>
                </div>

                {/* Sunscreen Reminder Strip */}
                <div className="v0-sunscreen-reminder-strip">
                  <span className="v0-sun-round-icon">
                    <SunMedium size={18} />
                  </span>
                  <p className="v0-sun-text-content">
                    Jangan lupa re-apply sunscreen sebelum keluar siang nanti untuk proteksi maksimal.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      {/* ===================== EXACT SCOPED CSS (PLUS JAKARTA SANS + HUMAN SIZING) ===================== */}
      <style>{`
        /* Universal reset specifically scoped to v0 root */
        .v0-root {
          min-height: 100vh;
          width: 100%;
          background: #f7faff !important;
          color: #13243c !important;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          -webkit-font-smoothing: antialiased;
        }

        .v0-root * {
          box-sizing: border-box !important;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        /* Floating toggle button (subtle in corner) */
        .v0-floating-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999;
          background: #13243c;
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.22);
          opacity: 0.9;
          transition: all 0.15s ease;
        }
        .v0-floating-toggle:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        /* Layout frame */
        .v0-wrapper {
          display: flex;
          min-height: 100vh;
          max-width: 1520px;
          margin: 0 auto;
        }

        /* ===================== SIDEBAR (264px) ===================== */
        .v0-aside {
          width: 264px;
          flex-shrink: 0;
          background: #ffffff;
          border-right: 1px solid #dce8f1;
          padding: 26px 20px 24px;
          display: flex;
          flex-direction: column;
        }

        .v0-aside-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          margin-bottom: 8px;
        }
        .v0-brand-flex {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .v0-logo-icon {
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
        .v0-brand-teal-dot {
          color: #21a19b;
        }
        .v0-close-menu-btn {
          display: none;
          background: none;
          border: none;
          color: #8291a3;
          cursor: pointer;
        }

        /* Section Headings in Sidebar */
        .v0-section-heading {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #98a7b7;
          margin: 38px 0 12px 14px;
        }
        .v0-mt-10 {
          margin-top: 32px !important;
        }

        .v0-nav-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        /* Menu Button: Generous Human Proportions */
        .v0-menu-btn {
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
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        .v0-menu-btn:hover {
          background: #f4f8fb;
          color: #13243c;
        }
        .v0-menu-btn.active {
          background: #eaf8f7;
          color: #167f7b;
          font-weight: 600;
        }
        .v0-badge-num {
          margin-left: auto;
          background: #e4f2ff;
          color: #4288c5;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        /* Trust Card at Sidebar Bottom */
        .v0-security-card {
          margin-top: auto;
          background: #f2fafb;
          border-radius: 16px;
          padding: 18px;
        }
        .v0-security-icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #ffffff;
          color: #28a19b;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .v0-security-title {
          font-size: 13px;
          font-weight: 700;
          color: #315467;
          margin: 0;
        }
        .v0-security-desc {
          font-size: 11.5px;
          line-height: 1.6;
          color: #7a98a5;
          margin: 5px 0 0;
        }

        /* Profile Strip */
        .v0-profile-strip {
          margin-top: 18px;
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
        .v0-profile-strip:hover {
          background: #f4f8fb;
        }
        .v0-profile-avatar-circle {
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
        .v0-profile-text-wrap {
          flex: 1;
          min-width: 0;
        }
        .v0-profile-name {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #13243c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v0-profile-sub {
          display: block;
          font-size: 11.5px;
          color: #92a0ae;
          margin-top: 1px;
        }
        .v0-profile-dots {
          color: #99a7b5;
          flex-shrink: 0;
        }

        /* ===================== MAIN CONTENT COLUMN ===================== */
        .v0-content-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        /* Top Navbar (78px) */
        .v0-header {
          height: 78px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e3edf4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 44px;
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .v0-burger-mobile-btn {
          display: none;
          background: none;
          border: none;
          color: #6d8296;
          cursor: pointer;
        }

        .v0-search-box {
          position: relative;
          max-width: 360px;
          width: 100%;
        }
        .v0-search-ico {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9babb9;
          pointer-events: none;
        }
        .v0-search-input-field {
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
        .v0-search-input-field:focus {
          border-color: #9cdad5;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(31, 157, 151, 0.1);
        }
        .v0-search-input-field::placeholder {
          color: #9babb9;
        }

        .v0-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: auto;
        }
        .v0-credits-pill {
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
        .v0-credits-pill:hover {
          background: #e2f0fe;
        }
        .v0-credits-zap {
          color: #d97706;
          fill: #d97706;
        }

        .v0-notif-btn {
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
        .v0-notif-dot {
          position: absolute;
          right: 3px;
          top: 3px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef8f74;
        }
        .v0-header-vdivider {
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
        .v0-header-avatar {
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

        /* Page Content Body */
        .v0-page-body {
          padding: 38px 44px 70px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Greeting Header Row */
        .v0-greeting-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .v0-greeting-date-text {
          font-size: 13px;
          font-weight: 600;
          color: #7990a3;
          margin: 0 0 8px;
        }
        .v0-greeting-h1 {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.045em;
          color: #1b3048;
          margin: 0;
          line-height: 1.2;
        }
        .v0-greeting-lead {
          font-size: 14.5px;
          color: #72879a;
          margin: 9px 0 0;
        }

        /* Button "Mulai check-in" (v0 Human Proportions: 46px tall, generous pill) */
        .v0-checkin-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          height: 46px;
          border-radius: 14px;
          background: #1f9d97;
          padding: 0 22px;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(31, 157, 151, 0.24);
          transition: all 0.15s ease;
        }
        .v0-checkin-btn:hover {
          background: #188b86;
          transform: translateY(-1px);
        }

        /* 3 Stat Cards Grid */
        .v0-stats-trio {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .v0-stat-box {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 18px;
          padding: 22px 24px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }
        .v0-stat-head-flex {
          display: flex;
          align-items: center;
          gap: 13px;
        }
        .v0-stat-ico-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 13px;
        }
        .bg-teal { background: #e5f7f4; }
        .text-teal { color: #299d96; }
        .bg-blue { background: #e6f2ff; }
        .text-blue { color: #4b91c6; }
        .bg-coral { background: #fff0e9; }
        .text-coral { color: #e28b65; }
        .bg-lavender { background: #f1edff; }
        .text-lavender { color: #896bc2; }

        .v0-stat-label-text {
          font-size: 13px;
          font-weight: 600;
          color: #7d91a2;
        }
        .v0-stat-number-row {
          margin-top: 22px;
          display: flex;
          align-items: baseline;
          gap: 5px;
        }
        .v0-stat-big-num {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #1c3449;
          line-height: 1;
        }
        .v0-stat-sub-denom {
          font-size: 13.5px;
          font-weight: 600;
          color: #93a2af;
        }
        .v0-stat-delta-note {
          margin: 6px 0 0;
          font-size: 12px;
          font-weight: 500;
          color: #86a0ae;
        }

        /* Generic Panels */
        .v0-card-panel {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }
        .v0-panel-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .v0-h2-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #13243c;
          margin: 0;
        }
        .v0-p-sub {
          font-size: 13px;
          color: #8496a6;
          margin: 4px 0 0;
        }
        .v0-action-link-btn {
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          color: #258e8b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .v0-action-link-btn:hover {
          opacity: 0.8;
        }

        /* Middle Grid (1.55fr 1fr) */
        .v0-middle-split-grid {
          display: grid;
          grid-template-columns: 1.55fr 1fr;
          gap: 22px;
        }

        /* Weekly Bars Chart */
        .v0-bars-chart-row {
          height: 200px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          padding: 0 4px;
        }
        .v0-bar-item-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex: 1;
          height: 100%;
        }
        .v0-bar-track-box {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 160px;
          width: 100%;
        }
        .v0-bar-colored-pillar {
          width: 100%;
          max-width: 30px;
          border-radius: 8px 8px 0 0;
          background: #d9f0ef;
          transition: height 0.3s ease;
        }
        .v0-bar-colored-pillar.active {
          background: #2aa6a0;
        }
        .v0-bar-badge-tooltip {
          position: absolute;
          top: -30px;
          border-radius: 6px;
          background: #19364a;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
        }
        .v0-bar-day-title {
          font-size: 12px;
          font-weight: 500;
          color: #94a3b0;
        }
        .v0-bar-day-title.active {
          color: #1e9892;
          font-weight: 700;
        }
        .v0-bar-date-label {
          font-size: 12px;
          font-weight: 600;
          color: #647e91;
        }

        /* Insight Panel */
        .v0-insight-colored-panel {
          background: #eef9f8 !important;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .v0-insight-micro-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #5d9896;
          margin: 0;
        }
        .v0-insight-main-h2 {
          font-size: 21px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #20485a;
          margin: 8px 0 0;
        }
        .v0-insight-top-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          background: #ffffff;
          color: #2aa39c;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .v0-insight-body-text {
          font-size: 14px;
          line-height: 1.65;
          color: #557985;
          margin: 18px 0;
        }
        .v0-insight-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #d5eeeb;
          padding-top: 18px;
        }
        .v0-insight-source-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b9295;
        }
        .v0-insight-btn-action {
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          color: #208c87;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Bottom Grid (1fr 1.55fr) */
        .v0-bottom-split-grid {
          display: grid;
          grid-template-columns: 1fr 1.55fr;
          gap: 22px;
        }

        .v0-more-options-btn {
          background: none;
          border: none;
          color: #91a1af;
          cursor: pointer;
          padding: 4px;
        }
        .v0-routine-items-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .v0-routine-entry-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          padding: 2px 0;
        }
        .v0-routine-checkbox {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          border: 1.5px solid #d4e1e9;
          background: #ffffff;
          color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .v0-routine-checkbox.checked {
          background: #2ca59e;
          border-color: #2ca59e;
          color: #ffffff;
        }
        .v0-routine-entry-info {
          flex: 1;
        }
        .v0-routine-task-name {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: #3c566a;
        }
        .v0-routine-task-name.checked-text {
          color: #8296a5;
          text-decoration: line-through;
        }
        .v0-routine-task-meta {
          display: block;
          font-size: 11.5px;
          color: #9aabb8;
          margin-top: 3px;
        }
        .v0-see-all-routine-btn {
          margin-top: 26px;
          width: 100%;
          height: 44px;
          border-radius: 13px;
          border: 1px solid #d9e8ef;
          background: #ffffff;
          font-size: 12.5px;
          font-weight: 700;
          color: #4b7488;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s ease;
        }
        .v0-see-all-routine-btn:hover {
          background: #f7fbfc;
        }

        /* Activity 3 Cols */
        .v0-activities-3cols {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .v0-single-activity-card {
          border-radius: 14px;
          border: 1px solid #e5eef3;
          padding: 18px;
          background: #ffffff;
        }
        .v0-activity-icon-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
        }
        .v0-act-title-text {
          font-size: 13px;
          font-weight: 700;
          color: #3d576a;
          margin: 14px 0 4px;
        }
        .v0-act-time-text {
          font-size: 11px;
          color: #9aaab6;
          margin: 0;
        }
        .v0-act-val-text {
          font-size: 12.5px;
          font-weight: 700;
          color: #5b7a8d;
          margin: 14px 0 0;
        }

        .v0-sunscreen-reminder-strip {
          margin-top: 22px;
          border-radius: 14px;
          background: #f7fafc;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .v0-sun-round-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ffffff;
          color: #e0a264;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }
        .v0-sun-text-content {
          font-size: 12px;
          line-height: 1.6;
          color: #71899a;
          margin: 0;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .v0-aside {
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease-in-out;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
          }
          .v0-aside.open {
            transform: translateX(0);
          }
          .v0-close-menu-btn {
            display: block;
          }
          .v0-burger-mobile-btn {
            display: block;
          }
          .v0-middle-split-grid,
          .v0-bottom-split-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .v0-header {
            padding: 0 20px;
          }
          .v0-search-box {
            display: none;
          }
          .v0-page-body {
            padding: 24px 20px 48px;
          }
          .v0-stats-trio {
            grid-template-columns: 1fr;
          }
          .v0-activities-3cols {
            grid-template-columns: 1fr;
          }
          .v0-greeting-h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  )
}

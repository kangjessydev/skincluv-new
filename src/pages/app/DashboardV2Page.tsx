// src/pages/app/DashboardV2Page.tsx
// 100% Pixel-Perfect Reproduction of v0.dev Skincare Assistant Dashboard
// Complete Isolated Shell: Plus Jakarta Sans display + Inter body + Exact v0.dev CSS & Layout

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
} from 'lucide-react'

const navItems = [
  { label: 'Ringkasan', icon: Home },
  { label: 'Perawatan wajah', icon: Sparkles },
  { label: 'Kesehatan', icon: HeartPulse },
  { label: 'Jurnal harian', icon: CalendarDays },
]

const week = [
  { day: 'Sen', date: '21', score: 76 },
  { day: 'Sel', date: '22', score: 84 },
  { day: 'Rab', date: '23', score: 68 },
  { day: 'Kam', date: '24', score: 91 },
  { day: 'Jum', date: '25', score: 88 },
  { day: 'Sab', date: '26', score: 94 },
  { day: 'Min', date: '27', score: 82 },
]

const routine = [
  { title: 'Cleanser lembut', type: 'Pagi · 2 menit', done: true },
  { title: 'Serum niacinamide', type: 'Pagi · 1 menit', done: true },
  { title: 'Moisturizer + SPF 30', type: 'Pagi · 1 menit', done: false },
]

export default function DashboardV2Page() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('Ringkasan')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [checked, setChecked] = useState(routine.map((item) => item.done))

  const toggleRoutine = (index: number) => {
    setChecked((items) => items.map((item, itemIndex) => (itemIndex === index ? !item : item)))
  }

  return (
    <div className="v0-root">
      {/* FLOATING SWITCH BUTTON AT BOTTOM RIGHT (Zero impact on layout) */}
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
                <Leaf size={19} strokeWidth={2.5} />
              </span>
              <span className="v0-brand-text">
                nurture<span className="v0-brand-teal-dot">.</span>
              </span>
            </div>
            <button
              className="v0-close-menu-btn"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Section: Menu Utama */}
          <p className="v0-section-heading">Menu utama</p>
          <nav className="v0-nav-list">
            {navItems.map(({ label, icon: Icon }) => {
              const isActive = activeNav === label
              return (
                <button
                  key={label}
                  onClick={() => {
                    setActiveNav(label)
                    setIsMenuOpen(false)
                  }}
                  className={`v0-menu-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>

          {/* Nav Section: Lainnya */}
          <p className="v0-section-heading v0-mt-10">Lainnya</p>
          <nav className="v0-nav-list">
            <button
              onClick={() => {
                setActiveNav('Tanya Nuri')
                setIsMenuOpen(false)
                navigate('/chatbot')
              }}
              className="v0-menu-btn"
            >
              <MessageCircle size={18} />
              <span>Tanya Nuri</span>
              <span className="v0-badge-num">2</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false)
                navigate('/faq')
              }}
              className="v0-menu-btn"
            >
              <CircleHelp size={18} />
              <span>Bantuan</span>
            </button>
          </nav>

          {/* Bottom Security Box */}
          <div className="v0-security-card">
            <div className="v0-security-icon-circle">
              <ShieldCheck size={17} />
            </div>
            <p className="v0-security-title">Data kamu aman</p>
            <p className="v0-security-desc">
              Privasi dan keamanan selalu jadi prioritas kami.
            </p>
          </div>

          {/* Profile Button at Bottom */}
          <button
            onClick={() => navigate('/profile')}
            className="v0-profile-strip"
          >
            <span className="v0-profile-avatar-circle">
              <UserRound size={17} />
            </span>
            <span className="v0-profile-text-wrap">
              <span className="v0-profile-name">Alya Putri</span>
              <span className="v0-profile-sub">Profil saya</span>
            </span>
            <MoreHorizontal size={16} className="v0-profile-dots" />
          </button>
        </aside>

        {/* ===================== MAIN CONTENT ===================== */}
        <section className="v0-content-col">
          {/* Top Navbar Header (78px) */}
          <header className="v0-header">
            <button
              className="v0-burger-mobile-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </button>

            {/* Search Box */}
            <div className="v0-search-box">
              <Search size={17} className="v0-search-ico" />
              <input
                className="v0-search-input-field"
                placeholder="Cari di nurture..."
                aria-label="Cari"
              />
            </div>

            {/* Right Topbar Icons */}
            <div className="v0-header-right">
              <button className="v0-notif-btn" aria-label="Notifikasi">
                <Bell size={19} />
                <span className="v0-notif-dot" />
              </button>

              <div className="v0-header-vdivider" />

              <button onClick={() => navigate('/profile')} className="v0-header-profile-btn">
                <span className="v0-header-avatar">AP</span>
                <span className="v0-header-profile-name">Alya Putri</span>
              </button>
            </div>
          </header>

          {/* Main Dashboard Grid */}
          <div className="v0-page-body">
            {/* Top Greeting Row */}
            <div className="v0-greeting-header-row">
              <div>
                <p className="v0-greeting-date-text">Sabtu, 26 Oktober 2024</p>
                <h1 className="v0-greeting-h1">Selamat pagi, Alya</h1>
                <p className="v0-greeting-lead">Jaga ritmemu hari ini, satu langkah kecil sudah berarti.</p>
              </div>
              <button
                onClick={() => navigate('/face-scan')}
                className="v0-checkin-btn"
              >
                <Sparkles size={15} />
                <span>Mulai check-in</span>
              </button>
            </div>

            {/* 3 Top Stat Cards */}
            <div className="v0-stats-trio">
              {/* Card 1: Kesehatan hari ini */}
              <div className="v0-stat-box">
                <div className="v0-stat-head-flex">
                  <span className="v0-stat-ico-container bg-teal text-teal">
                    <HeartPulse size={18} />
                  </span>
                  <span className="v0-stat-label-text">Kesehatan hari ini</span>
                </div>
                <div className="v0-stat-number-row">
                  <span className="v0-stat-big-num">82</span>
                  <span className="v0-stat-sub-denom">/100</span>
                </div>
                <p className="v0-stat-delta-note">+6 dari kemarin</p>
              </div>

              {/* Card 2: Hidrasi */}
              <div className="v0-stat-box">
                <div className="v0-stat-head-flex">
                  <span className="v0-stat-ico-container bg-blue text-blue">
                    <Droplets size={18} />
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
                    <SunMedium size={18} />
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
                    Lihat detail <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="v0-bars-chart-row">
                  {week.map((item, index) => {
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
                    <Leaf size={18} />
                  </span>
                </div>

                <p className="v0-insight-body-text">
                  Dari catatanmu minggu ini, kulit terlihat lebih sensitif setelah hari yang panjang. Coba sederhanakan rutinitas malam ini.
                </p>

                <div className="v0-insight-footer-row">
                  <span className="v0-insight-source-label">Berdasarkan 4 catatan</span>
                  <button onClick={() => navigate('/chatbot')} className="v0-insight-btn-action">
                    Buka jurnal <ChevronRight size={14} />
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
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="v0-routine-items-list">
                  {routine.map((item, index) => (
                    <button
                      key={item.title}
                      onClick={() => toggleRoutine(index)}
                      className="v0-routine-entry-btn"
                    >
                      <span className={`v0-routine-checkbox ${checked[index] ? 'checked' : ''}`}>
                        <Check size={15} strokeWidth={3} />
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
                  Lihat rutinitas lengkap <ChevronRight size={14} />
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
                      <Droplets size={17} />
                    </span>
                    <p className="v0-act-title-text">Minum air</p>
                    <p className="v0-act-time-text">Hari ini, 08.12</p>
                    <p className="v0-act-val-text">+250 ml</p>
                  </div>

                  <div className="v0-single-activity-card">
                    <span className="v0-activity-icon-badge bg-teal text-teal">
                      <Sparkles size={17} />
                    </span>
                    <p className="v0-act-title-text">Rutinitas wajah</p>
                    <p className="v0-act-time-text">Hari ini, 07.40</p>
                    <p className="v0-act-val-text">Selesai</p>
                  </div>

                  <div className="v0-single-activity-card">
                    <span className="v0-activity-icon-badge bg-lavender text-lavender">
                      <Activity size={17} />
                    </span>
                    <p className="v0-act-title-text">Mood check-in</p>
                    <p className="v0-act-time-text">Kemarin, 21.05</p>
                    <p className="v0-act-val-text">Tenang</p>
                  </div>
                </div>

                {/* Sunscreen Reminder Strip */}
                <div className="v0-sunscreen-reminder-strip">
                  <span className="v0-sun-round-icon">
                    <SunMedium size={16} />
                  </span>
                  <p className="v0-sun-text-content">
                    Jangan lupa re-apply sunscreen sebelum keluar siang nanti.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      {/* ===================== EXACT SCOPED CSS ===================== */}
      <style>{`
        /* Reset and font assignment exclusively for v0.dev dashboard */
        .v0-root {
          min-height: 100vh;
          width: 100%;
          background: #f7faff !important;
          color: #13243c !important;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          -webkit-font-smoothing: antialiased;
        }

        .v0-root * {
          box-sizing: border-box !important;
        }

        /* Typography overrides */
        .v0-root .font-display,
        .v0-brand-text,
        .v0-greeting-h1,
        .v0-stat-big-num,
        .v0-h2-title,
        .v0-insight-main-h2 {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
        }

        /* Floating switcher button (out of the way) */
        .v0-floating-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999;
          background: #13243c;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          opacity: 0.85;
          transition: opacity 0.15s ease;
        }
        .v0-floating-toggle:hover {
          opacity: 1;
        }

        /* Layout wrapper */
        .v0-wrapper {
          display: flex;
          min-height: 100vh;
          max-width: 1500px;
          margin: 0 auto;
        }

        /* ===================== SIDEBAR ===================== */
        .v0-aside {
          width: 264px;
          flex-shrink: 0;
          background: #ffffff;
          border-right: 1px solid #dce8f1;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
        }

        .v0-aside-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
        }
        .v0-brand-flex {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .v0-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #dff4f2;
          color: #1d9b93;
        }
        .v0-brand-text {
          font-size: 21px;
          font-weight: 600;
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

        .v0-section-heading {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #98a7b7;
          margin: 48px 0 12px 12px;
        }
        .v0-mt-10 {
          margin-top: 40px !important;
        }

        .v0-nav-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .v0-menu-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
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
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 9999px;
        }

        .v0-security-card {
          margin-top: auto;
          background: #f2fafb;
          border-radius: 16px;
          padding: 16px;
        }
        .v0-security-icon-circle {
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
        .v0-security-title {
          font-size: 12px;
          font-weight: 600;
          color: #315467;
          margin: 0;
        }
        .v0-security-desc {
          font-size: 11px;
          line-height: 1.6;
          color: #7a98a5;
          margin: 4px 0 0;
        }

        .v0-profile-strip {
          margin-top: 20px;
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
        .v0-profile-avatar-circle {
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
        .v0-profile-text-wrap {
          flex: 1;
          min-width: 0;
        }
        .v0-profile-name {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #13243c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v0-profile-sub {
          display: block;
          font-size: 11px;
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

        /* Top Navbar Header */
        .v0-header {
          height: 78px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e3edf4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
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
          max-width: 340px;
          width: 100%;
        }
        .v0-search-ico {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9babb9;
          pointer-events: none;
        }
        .v0-search-input-field {
          height: 40px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e4edf3;
          background: #f8fbfd;
          padding: 0 16px 0 40px;
          font-size: 12px;
          color: #13243c;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .v0-search-input-field:focus {
          border-color: #9cdad5;
          background: #ffffff;
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
        .v0-notif-btn {
          position: relative;
          background: none;
          border: none;
          color: #708397;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .v0-notif-dot {
          position: absolute;
          right: -1px;
          top: -1px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef8f74;
        }
        .v0-header-vdivider {
          width: 1px;
          height: 24px;
          background: #e4edf3;
        }
        .v0-header-profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .v0-header-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #d9eff0;
          color: #258e8b;
          font-size: 12px;
          font-weight: 600;
        }
        .v0-header-profile-name {
          font-size: 12px;
          font-weight: 500;
          color: #425b70;
        }

        /* Page Content Padding */
        .v0-page-body {
          padding: 36px 40px 60px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Greeting Row */
        .v0-greeting-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .v0-greeting-date-text {
          font-size: 12px;
          font-weight: 500;
          color: #7990a3;
          margin: 0 0 8px;
        }
        .v0-greeting-h1 {
          font-size: 34px;
          font-weight: 600;
          letter-spacing: -0.045em;
          color: #1b3048;
          margin: 0;
          line-height: 1.2;
        }
        .v0-greeting-lead {
          font-size: 13px;
          color: #72879a;
          margin: 8px 0 0;
        }
        .v0-checkin-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          background: #1f9d97;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          border: none;
          cursor: pointer;
          box-shadow: 0 7px 18px rgba(31, 157, 151, 0.18);
          transition: background 0.15s ease;
        }
        .v0-checkin-btn:hover {
          background: #188b86;
        }

        /* 3 Stat Cards */
        .v0-stats-trio {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .v0-stat-box {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }
        .v0-stat-head-flex {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v0-stat-ico-container {
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

        .v0-stat-label-text {
          font-size: 12px;
          font-weight: 500;
          color: #7d91a2;
        }
        .v0-stat-number-row {
          margin-top: 20px;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .v0-stat-big-num {
          font-size: 27px;
          font-weight: 600;
          letter-spacing: -0.04em;
          color: #1c3449;
          line-height: 1;
        }
        .v0-stat-sub-denom {
          font-size: 12px;
          color: #93a2af;
        }
        .v0-stat-delta-note {
          margin: 4px 0 0;
          font-size: 11px;
          color: #86a0ae;
        }

        /* Generic Panel */
        .v0-card-panel {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }
        .v0-panel-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .v0-h2-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #13243c;
          margin: 0;
        }
        .v0-p-sub {
          font-size: 12px;
          color: #8496a6;
          margin: 4px 0 0;
        }
        .v0-action-link-btn {
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
        .v0-action-link-btn:hover {
          opacity: 0.8;
        }

        /* Middle Row (1.55fr 1fr) */
        .v0-middle-split-grid {
          display: grid;
          grid-template-columns: 1.55fr 1fr;
          gap: 20px;
        }

        /* Weekly Bars Chart */
        .v0-bars-chart-row {
          height: 190px;
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
          gap: 8px;
          flex: 1;
          height: 100%;
        }
        .v0-bar-track-box {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 155px;
          width: 100%;
        }
        .v0-bar-colored-pillar {
          width: 100%;
          max-width: 28px;
          border-radius: 8px 8px 0 0;
          background: #d9f0ef;
          transition: height 0.3s ease;
        }
        .v0-bar-colored-pillar.active {
          background: #2aa6a0;
        }
        .v0-bar-badge-tooltip {
          position: absolute;
          top: -28px;
          border-radius: 6px;
          background: #19364a;
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 600;
          color: #ffffff;
        }
        .v0-bar-day-title {
          font-size: 11px;
          color: #94a3b0;
        }
        .v0-bar-day-title.active {
          color: #1e9892;
          font-weight: 600;
        }
        .v0-bar-date-label {
          font-size: 11px;
          font-weight: 500;
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
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #5d9896;
          margin: 0;
        }
        .v0-insight-main-h2 {
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #20485a;
          margin: 8px 0 0;
        }
        .v0-insight-top-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #ffffff;
          color: #2aa39c;
        }
        .v0-insight-body-text {
          font-size: 13px;
          line-height: 1.6;
          color: #557985;
          margin: 16px 0;
        }
        .v0-insight-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #d5eeeb;
          padding-top: 16px;
        }
        .v0-insight-source-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b9295;
        }
        .v0-insight-btn-action {
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 600;
          color: #208c87;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Bottom Row (1fr 1.55fr) */
        .v0-bottom-split-grid {
          display: grid;
          grid-template-columns: 1fr 1.55fr;
          gap: 20px;
        }

        .v0-more-options-btn {
          background: none;
          border: none;
          color: #91a1af;
          cursor: pointer;
        }
        .v0-routine-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .v0-routine-entry-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          padding: 0;
        }
        .v0-routine-checkbox {
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
          font-size: 12px;
          font-weight: 500;
          color: #3c566a;
        }
        .v0-routine-task-name.checked-text {
          color: #8296a5;
          text-decoration: line-through;
        }
        .v0-routine-task-meta {
          display: block;
          font-size: 10px;
          color: #9aabb8;
          margin-top: 2px;
        }
        .v0-see-all-routine-btn {
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
        .v0-see-all-routine-btn:hover {
          background: #f7fbfc;
        }

        /* Activity 3 Cols */
        .v0-activities-3cols {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .v0-single-activity-card {
          border-radius: 12px;
          border: 1px solid #e5eef3;
          padding: 16px;
          background: #ffffff;
        }
        .v0-activity-icon-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }
        .v0-act-title-text {
          font-size: 12px;
          font-weight: 600;
          color: #3d576a;
          margin: 12px 0 4px;
        }
        .v0-act-time-text {
          font-size: 10px;
          color: #9aaab6;
          margin: 0;
        }
        .v0-act-val-text {
          font-size: 11px;
          font-weight: 600;
          color: #5b7a8d;
          margin: 12px 0 0;
        }

        .v0-sunscreen-reminder-strip {
          margin-top: 20px;
          border-radius: 12px;
          background: #f7fafc;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v0-sun-round-icon {
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
        .v0-sun-text-content {
          font-size: 11px;
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

// src/pages/app/DashboardPage.tsx
// Skincluv Fresh Tech Dashboard (100% v0.dev Human Proportions & Plus Jakarta Sans)
// Real Skincluv Navigation + Real User Data + Live Subscriptions & Scans

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Droplets,
  HeartPulse,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  SunMedium,
  ScanFace,
  FlaskConical,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'

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

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 11) return 'pagi'
  if (hour >= 11 && hour < 15) return 'siang'
  if (hour >= 15 && hour < 18) return 'sore'
  return 'malam'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile, subscription } = useAuthStore()
  const { data } = useDashboardData()

  const [checked, setChecked] = useState(initialRoutine.map((item) => item.done))
  const [showExpiryBanner, setShowExpiryBanner] = useState(true)

  const toggleRoutine = (index: number) => {
    setChecked((items) => items.map((item, itemIndex) => (itemIndex === index ? !item : item)))
  }

  const skinAssessment = data?.skin_assessment
  const productSummary = data?.product_summary ?? { total_products_scanned: 0, safe_products_count: 0 }
  const missions = data?.missions ?? { completed: 0, total: 1 }

  const userName = profile?.full_name || 'Pengguna'
  const firstName = userName.split(' ')[0]
  const timeOfDay = getTimeOfDayGreeting()
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Subscription Expiry Check
  let daysRemaining: number | null = null
  if (subscription?.expires_at) {
    const diffTime = new Date(subscription.expires_at).getTime() - new Date().getTime()
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }
  const showExpiryAlert = showExpiryBanner && daysRemaining !== null && daysRemaining <= 3

  return (
    <div className="v0-page-body">
      {/* SUBSCRIPTION EXPIRY REMINDER (Quiet & Sleek) */}
      {showExpiryAlert && (
        <div className="v0-expiry-banner">
          <div className="v0-expiry-left">
            {daysRemaining === 1 ? <AlertTriangle size={18} /> : <Clock size={18} />}
            <span>
              Paket Akses kamu tersisa <strong>{daysRemaining} hari</strong> ({subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'segera'}).
            </span>
          </div>
          <div className="v0-expiry-actions">
            <button onClick={() => navigate('/pricing')} className="v0-expiry-link">
              Perpanjang Akses
            </button>
            <button onClick={() => setShowExpiryBanner(false)} className="v0-expiry-close" aria-label="Tutup">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TOP GREETING ROW */}
      <div className="v0-greeting-header-row">
        <div>
          <p className="v0-greeting-date-text">{todayFormatted}</p>
          <h1 className="v0-greeting-h1">Selamat {timeOfDay}, {firstName}</h1>
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

      {/* 3 TOP STAT CARDS */}
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
            {skinAssessment?.trend_label || '+6 dari kemarin'}
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

      {/* MIDDLE GRID: CHART (1.55fr) + INSIGHT (1fr) */}
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

      {/* BOTTOM GRID: ROUTINE (1fr) + ACTIVITY (1.55fr) */}
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

      {/* SCOPED COMPONENT STYLES */}
      <style>{`
        .v0-page-body {
          padding: 38px 44px 70px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        .v0-page-body * {
          box-sizing: border-box !important;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        .v0-expiry-banner {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 14px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13.5px;
          color: #1e40af;
          flex-wrap: wrap;
          gap: 12px;
        }
        .v0-expiry-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .v0-expiry-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v0-expiry-link {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .v0-expiry-close {
          background: none;
          border: none;
          color: #60a5fa;
          cursor: pointer;
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

        /* Button "Mulai check-in" */
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
          align-items: start; /* RFC 019 T3: kartu stat tidak stretch */
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
          align-items: start; /* RFC 019 T3: Keseimbangan & Insight ikuti tinggi konten masing2 */
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
          /* justify-content removed: align-items:start pada parent grid sudah
             membuat tinggi auto. Footer didorong ke bawah via margin-top:auto */
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
          margin-top: auto; /* dorong footer ke bawah meski konten insight pendek */
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
          align-items: start; /* RFC 019 T3: Rutinitas & Aktivitas ikuti tinggi konten masing2 */
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
          .v0-middle-split-grid,
          .v0-bottom-split-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
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

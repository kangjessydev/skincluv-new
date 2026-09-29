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
  Coins,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Badge, Skeleton, SkeletonText, EmptyFaceScan } from '@/components/ui'

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
  const { profile, subscription, coinBalance } = useAuthStore()
  const { data, loading } = useDashboardData()

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

  // AI Credits Status
  const credits = coinBalance?.balance ?? 0
  const creditStatus = credits === 0 ? 'empty' : credits <= 5 ? 'low' : 'normal'

  // Last Scan Date
  const lastScanDate = skinAssessment?.latest_scanned_at
    ? new Date(skinAssessment.latest_scanned_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const getStatusVariant = (status?: string): 'optimal' | 'attention' | 'alert' | 'neutral' => {
    if (!status) return 'neutral'
    const s = status.toLowerCase()
    if (s.includes('optimal') || s.includes('baik') || s.includes('sehat')) return 'optimal'
    if (s.includes('perhatian') || s.includes('waspada')) return 'attention'
    if (s.includes('kritis') || s.includes('bahaya') || s.includes('peringatan')) return 'alert'
    return 'neutral'
  }

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
          <p className="v0-greeting-lead">Ringkasan kondisi kulit dan akses cepat perawatan harianmu.</p>
        </div>

        {/* AI Credits Status Pill */}
        <div className="v0-header-actions">
          <button
            onClick={() => navigate('/pricing')}
            className={`v0-credits-pill v0-credits-${creditStatus}`}
            title="Kelola AI Credits Anda"
          >
            <Coins size={16} />
            <span className="v0-credits-amount">{credits} AI Credits</span>
            {credits <= 5 && (
              <span className="v0-credits-action-tag">
                {credits === 0 ? 'Habis · Isi Ulang' : 'Sisa Sedikit'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* QUICK SCAN SHORTCUTS (2 Primary Action Buttons) */}
      <div className="v0-quick-scan-grid">
        <button
          onClick={() => navigate('/face-scan')}
          className="v0-quick-scan-btn v0-quick-scan-face"
        >
          <div className="v0-quick-scan-icon bg-teal text-teal">
            <ScanFace size={22} strokeWidth={2.2} />
          </div>
          <div className="v0-quick-scan-info">
            <span className="v0-quick-scan-title">Scan Wajah AI</span>
            <span className="v0-quick-scan-sub">Analisis kondisi kulit & skor visual</span>
          </div>
          <ChevronRight size={18} className="v0-quick-scan-arrow" />
        </button>

        <button
          onClick={() => navigate('/ingredient-scan')}
          className="v0-quick-scan-btn v0-quick-scan-ingredient"
        >
          <div className="v0-quick-scan-icon bg-blue text-blue">
            <FlaskConical size={22} strokeWidth={2.2} />
          </div>
          <div className="v0-quick-scan-info">
            <span className="v0-quick-scan-title">Scan Komposisi</span>
            <span className="v0-quick-scan-sub">Analisis keamanan bahan skincare</span>
          </div>
          <ChevronRight size={18} className="v0-quick-scan-arrow" />
        </button>
      </div>

      {/* LATEST SKIN ASSESSMENT (Primary Value Proposition) */}
      {loading ? (
        <div className="v0-assessment-loading-card">
          <Skeleton height={24} width={180} />
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 14 }}>
            <Skeleton height={80} width={80} radius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton height={18} width="40%" />
              <div style={{ height: 8 }} />
              <SkeletonText lines={2} />
            </div>
          </div>
        </div>
      ) : skinAssessment?.has_face_scan ? (
        <section className="v0-card-panel v0-assessment-hero-card">
          <div className="v0-panel-title-row">
            <div>
              <div className="v0-assessment-badge-row">
                <span className="v0-assessment-tag">SKIN ASSESSMENT TERAKHIR</span>
                {skinAssessment.latest_status && (
                  <Badge variant={getStatusVariant(skinAssessment.latest_status)} dot size="sm">
                    {skinAssessment.latest_status}
                  </Badge>
                )}
              </div>
              <h2 className="v0-h2-title" style={{ marginTop: 6 }}>
                Observasi Kulit {skinAssessment.skin_type ? `· ${skinAssessment.skin_type}` : ''}
              </h2>
              {lastScanDate && (
                <p className="v0-p-sub">Dipindai pada {lastScanDate}</p>
              )}
            </div>
            <button onClick={() => navigate('/scan-history')} className="v0-action-link-btn">
              Riwayat lengkap <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="v0-assessment-body-flex">
            {/* Circular Score Ring */}
            <div className="v0-score-ring-container">
              <svg className="v0-score-svg" viewBox="0 0 80 80">
                <circle
                  className="v0-score-bg-circle"
                  cx="40"
                  cy="40"
                  r="34"
                  strokeWidth="6"
                />
                <circle
                  className="v0-score-fg-circle"
                  cx="40"
                  cy="40"
                  r="34"
                  strokeWidth="6"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * Math.min(Math.max(skinAssessment.latest_score || 0, 0), 100)) / 100}
                  style={{
                    stroke: (skinAssessment.latest_score || 0) >= 80 ? '#1f9d97' : (skinAssessment.latest_score || 0) >= 60 ? '#3b82f6' : '#f59e0b'
                  }}
                />
              </svg>
              <div className="v0-score-center-text">
                <span className="v0-score-big">{skinAssessment.latest_score ?? '-'}</span>
                <span className="v0-score-max">/100</span>
              </div>
            </div>

            {/* Assessment Notes & Meta */}
            <div className="v0-assessment-notes-col">
              <p className="v0-assessment-notes-p">
                {skinAssessment.analysis_notes || 'Kondisi kulit terjaga dengan baik. Lanjutkan hidrasi dan proteksi UV harian.'}
              </p>
              <div className="v0-assessment-meta-tags">
                {skinAssessment.trend_label && (
                  <span className="v0-assessment-trend-chip">
                    {skinAssessment.trend_label}
                  </span>
                )}
                {skinAssessment.skin_type && (
                  <span className="v0-assessment-type-chip">
                    Tipe: {skinAssessment.skin_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="v0-card-panel v0-empty-assessment-panel">
          <EmptyFaceScan onScan={() => navigate('/face-scan')} />
        </section>
      )}

      {/* COMPACT MISSION STRIP (1-line, no bulky card) */}
      <div className="v0-mission-strip">
        <div className="v0-mission-left">
          <span className="v0-mission-spark-icon">
            <Sparkles size={16} />
          </span>
          <span className="v0-mission-title">Misi Hari Ini:</span>
          <span className="v0-mission-counter">
            <strong>{missions.completed}</strong> dari <strong>{missions.total}</strong> selesai
          </span>
          <div className="v0-mission-track">
            <div
              className="v0-mission-bar"
              style={{
                width: `${Math.min(100, Math.round((missions.completed / Math.max(missions.total, 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
        <button onClick={() => navigate('/missions')} className="v0-mission-link-btn">
          Buka Misi <ChevronRight size={14} />
        </button>
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

        /* ── T5: Header Actions (Credits Pill) ── */
        .v0-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .v0-credits-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 40px;
          padding: 0 16px;
          border-radius: 100px;
          border: 1.5px solid #d0e7e5;
          background: #f4fbfa;
          color: #2aa59e;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .v0-credits-pill:hover {
          background: #e9f7f5;
        }
        .v0-credits-pill.v0-credits-low {
          border-color: #fed7aa;
          background: #fff7ed;
          color: #c2410c;
        }
        .v0-credits-pill.v0-credits-empty {
          border-color: #fca5a5;
          background: #fef2f2;
          color: #dc2626;
          animation: v0-pulse-warning 2s infinite;
        }
        @keyframes v0-pulse-warning {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.15); }
          50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
        }
        .v0-credits-amount { font-variant-numeric: tabular-nums; }
        .v0-credits-action-tag {
          background: #dc2626;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 100px;
          letter-spacing: 0.01em;
        }
        .v0-credits-pill.v0-credits-low .v0-credits-action-tag {
          background: #ea580c;
        }

        /* ── T5: Quick Scan Shortcuts Grid ── */
        .v0-quick-scan-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          align-items: start;
        }
        .v0-quick-scan-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          border-radius: 18px;
          border: 1.5px solid #dfeaf2;
          background: #ffffff;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 4px 16px rgba(43, 84, 116, 0.04);
          transition: all 0.18s ease;
        }
        .v0-quick-scan-btn:hover {
          border-color: #b5dbd8;
          box-shadow: 0 8px 24px rgba(31, 157, 151, 0.12);
          transform: translateY(-1px);
        }
        .v0-quick-scan-face:hover { border-color: #b5dbd8; }
        .v0-quick-scan-ingredient:hover { border-color: #b3d4f5; }
        .v0-quick-scan-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          flex-shrink: 0;
        }
        .v0-quick-scan-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .v0-quick-scan-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #1c3449;
          line-height: 1.2;
        }
        .v0-quick-scan-sub {
          font-size: 12px;
          color: #8496a6;
          line-height: 1.4;
        }
        .v0-quick-scan-arrow {
          color: #b0bec9;
          flex-shrink: 0;
        }

        /* ── T5: Assessment Loading Card ── */
        .v0-assessment-loading-card {
          background: #ffffff;
          border: 1px solid #dfeaf2;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 12px 35px rgba(43, 84, 116, 0.04);
        }

        /* ── T5: Assessment Hero Card ── */
        .v0-assessment-hero-card {
          background: #ffffff;
        }
        .v0-assessment-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .v0-assessment-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #7d96a5;
        }
        .v0-assessment-body-flex {
          display: flex;
          align-items: flex-start;
          gap: 28px;
          margin-top: 4px;
        }
        /* SVG Score Ring */
        .v0-score-ring-container {
          position: relative;
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }
        .v0-score-svg {
          width: 120px;
          height: 120px;
          transform: rotate(-90deg);
        }
        .v0-score-bg-circle {
          fill: none;
          stroke: #e8f3f8;
        }
        .v0-score-fg-circle {
          fill: none;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v0-score-center-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .v0-score-big {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #1b3048;
        }
        .v0-score-max {
          font-size: 12px;
          font-weight: 600;
          color: #93a2af;
          margin-top: 2px;
        }
        /* Assessment Notes Column */
        .v0-assessment-notes-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .v0-assessment-notes-p {
          font-size: 14px;
          line-height: 1.65;
          color: #4e6679;
          margin: 0;
        }
        .v0-assessment-meta-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .v0-assessment-trend-chip,
        .v0-assessment-type-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
        }
        .v0-assessment-trend-chip {
          background: #e9f7f6;
          color: #1f9d97;
        }
        .v0-assessment-type-chip {
          background: #f1f5f9;
          color: #475569;
        }
        .v0-empty-assessment-panel {
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── T5: Mission Strip ── */
        .v0-mission-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 18px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2ecf2;
        }
        .v0-mission-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .v0-mission-spark-icon {
          display: flex;
          align-items: center;
          color: #f59e0b;
        }
        .v0-mission-title {
          font-size: 13px;
          font-weight: 700;
          color: #3b4f61;
        }
        .v0-mission-counter {
          font-size: 13px;
          color: #5d7a8c;
        }
        .v0-mission-counter strong {
          color: #2aa59e;
        }
        .v0-mission-track {
          width: 100px;
          height: 5px;
          border-radius: 100px;
          background: #dde8ef;
          overflow: hidden;
        }
        .v0-mission-bar {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, #1f9d97, #2bc5bc);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 5px;
        }
        .v0-mission-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          color: #258e8b;
          cursor: pointer;
          white-space: nowrap;
        }
        .v0-mission-link-btn:hover { opacity: 0.75; }

        .bg-teal { background: #e5f7f4; }
        .text-teal { color: #299d96; }
        .bg-blue { background: #e6f2ff; }
        .text-blue { color: #4b91c6; }
        .bg-coral { background: #fff0e9; }
        .text-coral { color: #e28b65; }
        .bg-lavender { background: #f1edff; }
        .text-lavender { color: #896bc2; }



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
          .v0-quick-scan-grid {
            grid-template-columns: 1fr;
          }
          .v0-activities-3cols {
            grid-template-columns: 1fr;
          }
          .v0-greeting-h1 {
            font-size: 28px;
          }
          .v0-assessment-body-flex {
            flex-direction: column;
            align-items: center;
          }
          .v0-mission-track {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

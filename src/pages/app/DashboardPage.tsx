// src/pages/app/DashboardPage.tsx
// Skincluv Fresh Tech Dashboard (100% v0.dev Human Proportions & Plus Jakarta Sans)
// Real Skincluv Navigation + Real User Data + Live Subscriptions & Scans

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
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
import '@/styles/dashboard.css'

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
  const recentScans = data?.recent_scans ?? []
  const scanCounts = data?.scan_counts ?? { face_total: 0, ingredient_total: 0, total: 0 }
  // face_trend: 7 titik scan wajah non-repeat (dari RPC migration 082)
  // Dibalik ke ASC agar chart berjalan kiri→kanan (terlama ke terbaru)
  const faceTrend = [...(data?.face_trend ?? [])].reverse()
  // Guardrail RFC 019: chart hanya ditampilkan bila ≥3 scan wajah unik tersedia
  const hasEnoughTrendData = scanCounts.face_total >= 3

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
    <div className="v0-page-container v0-dashboard-container animate-fade-in">
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

      {/* MIDDLE GRID: SCAN TREND CHART (1.55fr) + INSIGHT (1fr) */}
      <div className="v0-middle-split-grid">
        {/* Scan Score Trend Chart — RFC 019 guardrail: ≥3 titik data */}
        <section className="v0-card-panel">
          <div className="v0-panel-title-row">
            <div>
              <h2 className="v0-h2-title">Tren Analisis Kulit</h2>
              <p className="v0-p-sub">
                {hasEnoughTrendData
                  ? `${recentScans.length} scan terakhir · skor wajah`
                  : `${recentScans.length} scan — butuh minimal 3 untuk melihat tren`}
              </p>
            </div>
            <button onClick={() => navigate('/scan-history')} className="v0-action-link-btn">
              Lihat riwayat <ArrowUpRight size={15} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', height: 160 }}>
              {[60,80,45,95,70,88,75].map((h, i) => (
                <Skeleton key={i} height={`${h}%`} width="100%" radius="8px 8px 0 0" />
              ))}
            </div>
          ) : hasEnoughTrendData ? (
            <div className="v0-bars-chart-row">
              {faceTrend.map((point, index, arr) => {
                const isLatest = index === arr.length - 1
                const scoreVal = point.score ?? 0
                const dateLabel = new Date(point.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                return (
                  <div key={point.id} className="v0-bar-item-col">
                    <div className="v0-bar-track-box">
                      <div
                        className={`v0-bar-colored-pillar ${isLatest ? 'active' : ''}`}
                        style={{ height: `${scoreVal}%` }}
                      />
                      {isLatest && (
                        <span className="v0-bar-badge-tooltip">{scoreVal}</span>
                      )}
                    </div>
                    <span className={`v0-bar-day-title ${isLatest ? 'active' : ''}`}>
                      {dateLabel.split(' ')[0]}
                    </span>
                    <span className="v0-bar-date-label">{dateLabel.split(' ')[1] ?? ''}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="v0-chart-empty-state">
              <CalendarDays size={32} strokeWidth={1.5} />
              <p className="v0-chart-empty-title">Belum cukup data tren</p>
              <p className="v0-chart-empty-sub">
                Lakukan setidaknya 3 Analisis Kulit AI untuk melihat grafik perkembangan kulitmu.
              </p>
              <button onClick={() => navigate('/face-scan')} className="v0-chart-empty-cta">
                <ScanFace size={15} /> Mulai Analisis
              </button>
            </div>
          )}

          {/* Scan count summary pills */}
          <div className="v0-scan-summary-pills">
            <span className="v0-scan-pill v0-scan-pill-face">
              <ScanFace size={14} /> {scanCounts.face_total} Wajah
            </span>
            <span className="v0-scan-pill v0-scan-pill-ingredient">
              <FlaskConical size={14} /> {scanCounts.ingredient_total} Komposisi
            </span>
            {productSummary.total_products_scanned > 0 && (
              <span className="v0-scan-pill v0-scan-pill-safe">
                <ShieldCheck size={14} /> {productSummary.safe_products_count}/{productSummary.total_products_scanned} Aman
              </span>
            )}
          </div>
        </section>

        {/* Insight / Analysis Notes Card */}
        <section className="v0-card-panel v0-insight-colored-panel">
          <div className="v0-panel-title-row">
            <div>
              <p className="v0-insight-micro-tag">INSIGHT KULITMU</p>
              <h2 className="v0-insight-main-h2">
                {skinAssessment?.has_face_scan ? 'Catatan AI' : 'Mulai dari sini'}
              </h2>
            </div>
            <span className="v0-insight-top-icon">
              <Sparkles size={20} />
            </span>
          </div>

          <p className="v0-insight-body-text">
            {skinAssessment?.analysis_notes
              ? skinAssessment.analysis_notes
              : 'Lakukan Analisis Kulit AI pertamamu. Skinsistant AI akan menyediakan insight mendalam tentang kondisi kulitmu berdasarkan foto wajah.'}
          </p>

          <div className="v0-insight-footer-row">
            <span className="v0-insight-source-label">
              {skinAssessment?.has_face_scan ? `Total ${scanCounts.total} scan` : 'Belum ada scan'}
            </span>
            <button
              onClick={() => navigate(skinAssessment?.has_face_scan ? '/chatbot' : '/face-scan')}
              className="v0-insight-btn-action"
            >
              {skinAssessment?.has_face_scan ? 'Tanya Skinsistant' : 'Mulai Scan'} <ChevronRight size={15} />
            </button>
          </div>
        </section>
      </div>

      {/* BOTTOM GRID: ROUTINE (1fr) + RECENT SCANS (1.55fr) */}
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

        {/* Riwayat Scan Terakhir — real data */}
        <section className="v0-card-panel">
          <div className="v0-panel-title-row">
            <div>
              <h2 className="v0-h2-title">Riwayat scan terakhir</h2>
              <p className="v0-p-sub">Analisis terbaru dari akun kamu</p>
            </div>
            <button onClick={() => navigate('/scan-history')} className="v0-action-link-btn">
              Lihat semua <ArrowUpRight size={15} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Skeleton height={44} width={44} radius="12px" />
                  <div style={{ flex: 1 }}><SkeletonText lines={2} /></div>
                  <Skeleton height={20} width={40} radius="100px" />
                </div>
              ))}
            </div>
          ) : recentScans.length > 0 ? (
            <div className="v0-recent-scan-list">
              {recentScans.slice(0, 5).map(scan => (
                <button
                  key={scan.id}
                  onClick={() => navigate('/scan-history')}
                  className="v0-recent-scan-row"
                >
                  <span className={`v0-recent-scan-icon ${scan.type === 'face' ? 'bg-teal text-teal' : 'bg-blue text-blue'}`}>
                    {scan.type === 'face' ? <ScanFace size={18} /> : <FlaskConical size={18} />}
                  </span>
                  <div className="v0-recent-scan-info">
                    <span className="v0-recent-scan-title">{scan.title}</span>
                    <span className="v0-recent-scan-time">
                      {new Date(scan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {scan.score !== null && (
                    <span className="v0-recent-scan-score">{scan.score}</span>
                  )}
                  <ChevronRight size={14} className="v0-recent-scan-arrow" />
                </button>
              ))}
            </div>
          ) : (
            <div className="v0-recent-empty">
              <HeartPulse size={28} strokeWidth={1.5} style={{ color: '#b0c4d0' }} />
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#8496a6' }}>Riwayat scan belum ada</p>
            </div>
          )}

          {/* Sunscreen Reminder Strip */}
          <div className="v0-sunscreen-reminder-strip">
            <span className="v0-sun-round-icon">
              <SunMedium size={18} />
            </span>
            <p className="v0-sun-text-content">
              Jangan lupa re-apply sunscreen siang hari untuk proteksi maksimal.
            </p>
          </div>
        </section>
      </div>

    </div>
  )
}

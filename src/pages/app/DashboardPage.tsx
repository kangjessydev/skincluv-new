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
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Badge, Skeleton, SkeletonText, EmptyFaceScan } from '@/components/ui'
import '@/styles/cluv/app/dashboard.css'

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
    <div className="cluv-dashboard-view cluv-animate-fade">
      {/* SUBSCRIPTION EXPIRY REMINDER (Quiet & Sleek) */}
      {showExpiryAlert && (
        <div className="cluv-alert is-warning">
          <div className="cluv-alert-icon">
            {daysRemaining === 1 ? <AlertTriangle size={18} /> : <Clock size={18} />}
          </div>
          <div className="cluv-alert-content">
            <div className="cluv-alert-title">Masa Aktif Paket Segera Berakhir</div>
            <p className="cluv-alert-message">
              Paket Akses kamu tersisa <strong>{daysRemaining} hari</strong> ({subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'segera'}).
            </p>
          </div>
          <div className="cluv-flex-row cluv-gap-2">
            <button onClick={() => navigate('/pricing')} className="cluv-btn is-primary is-sm">
              Perpanjang
            </button>
            <button onClick={() => setShowExpiryBanner(false)} className="cluv-btn is-ghost is-sm" aria-label="Tutup">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TOP GREETING ROW */}
      <div className="cluv-dashboard-header">
        <div>
          <p className="cluv-caption cluv-text-muted">{todayFormatted}</p>
          <h1 className="cluv-title-section cluv-mt-1">Selamat {timeOfDay}, {firstName}</h1>
          <p className="cluv-body cluv-text-muted cluv-mt-1">Ringkasan kondisi kulit dan akses cepat perawatan harianmu.</p>
        </div>
      </div>

      {/* QUICK SCAN SHORTCUTS (2 Primary Action Buttons) */}
      <div className="cluv-quick-scan-grid">
        <button
          onClick={() => navigate('/face-scan')}
          className="cluv-quick-tile is-face"
        >
          <div className="cluv-quick-tile-icon is-teal">
            <ScanFace size={22} strokeWidth={2.2} />
          </div>
          <div className="cluv-quick-tile-info">
            <h3 className="cluv-quick-tile-title">Scan Wajah AI</h3>
            <p className="cluv-quick-tile-sub">Analisis kondisi kulit & skor visual</p>
          </div>
          <ChevronRight size={18} className="cluv-quick-tile-arrow" />
        </button>

        <button
          onClick={() => navigate('/ingredient-scan')}
          className="cluv-quick-tile is-ingredient"
        >
          <div className="cluv-quick-tile-icon is-blue">
            <FlaskConical size={22} strokeWidth={2.2} />
          </div>
          <div className="cluv-quick-tile-info">
            <h3 className="cluv-quick-tile-title">Scan Komposisi</h3>
            <p className="cluv-quick-tile-sub">Analisis keamanan bahan skincare</p>
          </div>
          <ChevronRight size={18} className="cluv-quick-tile-arrow" />
        </button>
      </div>

      {/* LATEST SKIN ASSESSMENT (Primary Value Proposition) */}
      {loading ? (
        <div className="cluv-card">
          <Skeleton height={24} width={180} />
          <div className="cluv-flex-row cluv-gap-4 cluv-items-center cluv-mt-3">
            <Skeleton height={80} width={80} radius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton height={18} width="40%" />
              <div style={{ height: 8 }} />
              <SkeletonText lines={2} />
            </div>
          </div>
        </div>
      ) : skinAssessment?.has_face_scan ? (
        <section className="cluv-card">
          <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
            <div>
              <div className="cluv-flex-row cluv-gap-2 cluv-items-center">
                <span className="cluv-caption cluv-text-muted cluv-font-bold">OBSERVASI KULIT TERAKHIR</span>
                {skinAssessment.latest_status && (
                  <Badge variant={getStatusVariant(skinAssessment.latest_status)} dot size="sm">
                    {skinAssessment.latest_status}
                  </Badge>
                )}
              </div>
              <h2 className="cluv-title-card cluv-mt-1">
                Observasi Visual {skinAssessment.skin_type ? `· ${skinAssessment.skin_type}` : ''}
              </h2>
              {lastScanDate && (
                <p className="cluv-caption cluv-text-muted cluv-mt-1">Dipindai pada {lastScanDate}</p>
              )}
            </div>
            <button onClick={() => navigate('/scan-history')} className="cluv-btn is-outline is-sm">
              <span>Riwayat</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="cluv-assessment-body">
            {/* Circular Score Ring */}
            <div className="cluv-score-ring is-md">
              <svg className="cluv-score-svg" viewBox="0 0 80 80">
                <circle
                  className="cluv-score-bg-circle"
                  cx="40"
                  cy="40"
                  r="34"
                  strokeWidth="6"
                />
                <circle
                  className={`cluv-score-fg-circle is-${getStatusVariant(skinAssessment.latest_status)}`}
                  cx="40"
                  cy="40"
                  r="34"
                  strokeWidth="6"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * Math.min(Math.max(skinAssessment.latest_score || 0, 0), 100)) / 100}
                />
              </svg>
              <div className="cluv-score-center">
                <span className="cluv-score-val">{skinAssessment.latest_score ?? '-'}</span>
                <span className="cluv-score-max">/100</span>
              </div>
            </div>

            {/* Assessment Notes & Meta */}
            <div className="cluv-assessment-notes">
              <p className="cluv-body cluv-m-0">
                {skinAssessment.analysis_notes || 'Kondisi kulit terjaga dengan baik. Lanjutkan hidrasi dan proteksi UV harian.'}
              </p>
              <div className="cluv-assessment-chips">
                {skinAssessment.trend_label && (
                  <span className="cluv-badge is-teal is-sm">
                    {skinAssessment.trend_label}
                  </span>
                )}
                {skinAssessment.skin_type && (
                  <span className="cluv-badge is-slate is-sm">
                    Tipe: {skinAssessment.skin_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="cluv-card cluv-text-center cluv-py-6">
          <EmptyFaceScan onScan={() => navigate('/face-scan')} />
        </section>
      )}

      {/* COMPACT MISSION STRIP */}
      <div className="cluv-mission-strip">
        <div className="cluv-mission-left">
          <span className="cluv-stat-icon is-teal" style={{ width: 32, height: 32 }}>
            <Sparkles size={16} />
          </span>
          <span className="cluv-caption cluv-font-bold">Misi Hari Ini:</span>
          <span className="cluv-caption">
            <strong>{missions.completed}</strong> dari <strong>{missions.total}</strong> selesai
          </span>
          <div className="cluv-mission-track">
            <div
              className="cluv-mission-bar"
              style={{
                width: `${Math.min(100, Math.round((missions.completed / Math.max(missions.total, 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
        <button onClick={() => navigate('/missions')} className="cluv-btn is-ghost is-sm">
          <span>Buka Misi</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* MIDDLE GRID: SCAN TREND CHART (1.55fr) + INSIGHT (1fr) */}
      <div className="cluv-middle-grid">
        {/* Scan Score Trend Chart — RFC 019 guardrail: ≥3 titik data */}
        <section className="cluv-card">
          <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
            <div>
              <h2 className="cluv-title-card">Tren Analisis Kulit</h2>
              <p className="cluv-caption cluv-text-muted cluv-mt-1">
                {hasEnoughTrendData
                  ? `${recentScans.length} scan terakhir · skor wajah`
                  : `${recentScans.length} scan — butuh minimal 3 untuk melihat tren`}
              </p>
            </div>
            <button onClick={() => navigate('/scan-history')} className="cluv-btn is-outline is-sm">
              <span>Riwayat</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="cluv-flex-row cluv-gap-3 cluv-items-end" style={{ height: 160, padding: '16px 0 0' }}>
              {[60, 80, 45, 95, 70, 88, 75].map((h, i) => (
                <Skeleton key={i} height={`${h}%`} width="100%" radius="8px 8px 0 0" />
              ))}
            </div>
          ) : hasEnoughTrendData ? (
            <div className="cluv-bars-row">
              {faceTrend.map((point, index, arr) => {
                const isLatest = index === arr.length - 1
                const scoreVal = point.score ?? 0
                const dateLabel = new Date(point.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                return (
                  <div key={point.id} className="cluv-bar-col">
                    <div className="cluv-bar-track">
                      <div
                        className={`cluv-bar-pillar ${isLatest ? 'is-latest' : ''}`}
                        style={{ height: `${scoreVal}%` }}
                      />
                      {isLatest && (
                        <span className="cluv-bar-tooltip">{scoreVal}</span>
                      )}
                    </div>
                    <span className="cluv-bar-label">
                      {dateLabel.split(' ')[0]} {dateLabel.split(' ')[1] ?? ''}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="cluv-text-center cluv-py-6">
              <CalendarDays size={32} strokeWidth={1.5} className="cluv-text-muted cluv-mx-auto" />
              <h4 className="cluv-title-card cluv-mt-2">Belum cukup data tren</h4>
              <p className="cluv-caption cluv-text-muted cluv-mt-1" style={{ maxWidth: 360, margin: '6px auto 0' }}>
                Lakukan setidaknya 3 Analisis Kulit AI untuk melihat grafik perkembangan kulitmu.
              </p>
              <button onClick={() => navigate('/face-scan')} className="cluv-btn is-primary is-sm cluv-mt-4">
                <ScanFace size={15} />
                <span>Mulai Analisis</span>
              </button>
            </div>
          )}

          {/* Scan count summary pills */}
          <div className="cluv-flex-row cluv-gap-2 cluv-mt-4 cluv-border-t cluv-pt-3 cluv-flex-wrap">
            <span className="cluv-badge is-teal is-sm">
              <ScanFace size={13} /> <span>{scanCounts.face_total} Wajah</span>
            </span>
            <span className="cluv-badge is-slate is-sm">
              <FlaskConical size={13} /> <span>{scanCounts.ingredient_total} Komposisi</span>
            </span>
            {productSummary.total_products_scanned > 0 && (
              <span className="cluv-badge is-teal is-sm">
                <ShieldCheck size={13} /> <span>{productSummary.safe_products_count}/{productSummary.total_products_scanned} Aman</span>
              </span>
            )}
          </div>
        </section>

        {/* Insight / Analysis Notes Card */}
        <section className="cluv-card cluv-flex-col cluv-justify-between">
          <div>
            <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
              <div>
                <span className="cluv-caption cluv-text-muted cluv-font-bold">INSIGHT KULITMU</span>
                <h2 className="cluv-title-card cluv-mt-1">
                  {skinAssessment?.has_face_scan ? 'Catatan Observasi AI' : 'Mulai dari sini'}
                </h2>
              </div>
              <div className="cluv-stat-icon is-teal">
                <Sparkles size={18} />
              </div>
            </div>

            <p className="cluv-body cluv-mt-3 cluv-line-relaxed">
              {skinAssessment?.analysis_notes
                ? skinAssessment.analysis_notes
                : 'Lakukan Analisis Kulit AI pertamamu. Skinsistant AI akan menyediakan observasi kondisi kulitmu secara ramah berdasarkan foto wajah.'}
            </p>
          </div>

          <div className="cluv-flex-between cluv-items-center cluv-border-t cluv-pt-3 cluv-mt-4">
            <span className="cluv-caption cluv-text-muted">
              {skinAssessment?.has_face_scan ? `Total ${scanCounts.total} scan` : 'Belum ada scan'}
            </span>
            <button
              onClick={() => navigate(skinAssessment?.has_face_scan ? '/chatbot' : '/face-scan')}
              className="cluv-btn is-ghost is-sm"
            >
              <span>{skinAssessment?.has_face_scan ? 'Tanya Skinsistant' : 'Mulai Scan'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>

      {/* BOTTOM GRID: ROUTINE (1fr) + RECENT SCANS (1.55fr) */}
      <div className="cluv-bottom-grid">
        {/* Rutinitas Pagi */}
        <section className="cluv-card cluv-flex-col cluv-justify-between">
          <div>
            <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
              <div>
                <h2 className="cluv-title-card">Rutinitas Pagi</h2>
                <p className="cluv-caption cluv-text-muted cluv-mt-1">3 langkah · sekitar 4 menit</p>
              </div>
              <button className="cluv-btn is-ghost is-sm" aria-label="Opsi rutinitas">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="cluv-checklist-group cluv-mt-3">
              {initialRoutine.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => toggleRoutine(index)}
                  className={`cluv-check-item ${checked[index] ? 'is-checked' : ''}`}
                >
                  <span className="cluv-check-box">
                    {checked[index] && <Check size={14} strokeWidth={3} />}
                  </span>
                  <div className="cluv-check-info">
                    <p className="cluv-check-title">{item.title}</p>
                    <span className="cluv-check-meta">{item.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/missions')}
            className="cluv-btn is-ghost is-sm cluv-mt-3 cluv-justify-center"
          >
            <span>Lihat rutinitas lengkap</span>
            <ChevronRight size={14} />
          </button>
        </section>

        {/* Riwayat Scan Terakhir — real data */}
        <section className="cluv-card cluv-flex-col cluv-justify-between">
          <div>
            <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
              <div>
                <h2 className="cluv-title-card">Riwayat Scan Terakhir</h2>
                <p className="cluv-caption cluv-text-muted cluv-mt-1">Analisis terbaru dari akun kamu</p>
              </div>
              <button onClick={() => navigate('/scan-history')} className="cluv-btn is-outline is-sm">
                <span>Lihat semua</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="cluv-flex-col cluv-gap-3 cluv-mt-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="cluv-flex-row cluv-gap-3 cluv-items-center">
                    <Skeleton height={40} width={40} radius="10px" />
                    <div style={{ flex: 1 }}><SkeletonText lines={2} /></div>
                    <Skeleton height={20} width={40} radius="100px" />
                  </div>
                ))}
              </div>
            ) : recentScans.length > 0 ? (
              <div className="cluv-recent-scan-list cluv-mt-3">
                {recentScans.slice(0, 5).map(scan => (
                  <button
                    key={scan.id}
                    onClick={() => navigate('/scan-history')}
                    className="cluv-recent-scan-item"
                  >
                    <span className={`cluv-recent-scan-icon ${scan.type === 'face' ? 'is-teal' : 'is-blue'}`}>
                      {scan.type === 'face' ? <ScanFace size={18} /> : <FlaskConical size={18} />}
                    </span>
                    <div className="cluv-recent-scan-info">
                      <span className="cluv-recent-scan-title">{scan.title}</span>
                      <span className="cluv-recent-scan-time">
                        {new Date(scan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {scan.score !== null && (
                      <span className="cluv-badge is-teal is-sm">{scan.score}</span>
                    )}
                    <ChevronRight size={14} className="cluv-quick-tile-arrow" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="cluv-text-center cluv-py-6">
                <HeartPulse size={28} strokeWidth={1.5} className="cluv-text-muted cluv-mx-auto" />
                <p className="cluv-caption cluv-text-muted cluv-mt-2">Riwayat scan belum ada</p>
              </div>
            )}
          </div>

          {/* Sunscreen Reminder Strip */}
          <div className="cluv-card-strip cluv-mt-4" style={{ background: 'var(--cluv-neutral-50)' }}>
            <div className="cluv-card-icon-wrap is-gold is-sm">
              <SunMedium size={16} />
            </div>
            <p className="cluv-caption cluv-m-0">
              Jangan lupa re-apply sunscreen siang hari untuk proteksi kulit maksimal.
            </p>
          </div>
        </section>
      </div>

    </div>
  )
}

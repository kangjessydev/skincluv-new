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
  Bot,
  Zap,
  MessageCircle,
  Moon,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Badge, Skeleton, SkeletonText, EmptyFaceScan } from '@/components/ui'
import { isActivePremium } from '@/utils/subscriptionHelpers'
import '@/styles/cluv/app/dashboard.css'

const morningRoutine = [
  { title: 'Cleanser Lembut (pH Balance)', type: 'Pagi · 2 menit', done: true },
  { title: 'Serum Niacinamide / Hidrasi', type: 'Pagi · 1 menit', done: true },
  { title: 'Moisturizer + Sunscreen SPF 50', type: 'Pagi · 2 menit', done: false },
]

const eveningRoutine = [
  { title: 'Double Cleansing (Micellar / Oil)', type: 'Malam · 3 menit', done: true },
  { title: 'Active / Barrier Serum', type: 'Malam · 2 menit', done: false },
  { title: 'Night Repair Moisturizer', type: 'Malam · 2 menit', done: false },
]

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 11) return 'pagi'
  if (hour >= 11 && hour < 15) return 'siang'
  if (hour >= 15 && hour < 18) return 'sore'
  return 'malam'
}

function getEnvironmentalWeather() {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 11) {
    return {
      temp: '26°C',
      uvIndex: 'UV 3.2 (Sedang)',
      timeLabel: 'Pagi Hari',
      tip: 'Pagi yang cerah bestie! Sebelum keluar, aplikasikan sunscreen SPF 50 ya :)',
    }
  }
  if (hour >= 11 && hour < 15) {
    return {
      temp: '31°C',
      uvIndex: 'UV 7.8 (Tinggi)',
      timeLabel: 'Siang Hari',
      tip: 'Siang ini terik banget loh bestie! Sampai 31 derajat. Jangan lupa re-apply sunscreen ya! :)',
    }
  }
  if (hour >= 15 && hour < 18) {
    return {
      temp: '29°C',
      uvIndex: 'UV 2.0 (Teduh)',
      timeLabel: 'Sore Hari',
      tip: 'Matahari mulai teduh bestie. Tetap hidrasi kulit setelah seharian beraktivitas!',
    }
  }
  return {
    temp: '25°C',
    uvIndex: 'UV 0.0 (Malam)',
    timeLabel: 'Malam Hari',
    tip: 'Malam ini sejuk bestie. Waktunya regenerasi sel kulit dengan double cleansing & moisturizer!',
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile, subscription, coinBalance } = useAuthStore()
  const { data, loading } = useDashboardData()

  const currentHour = new Date().getHours()
  const isNight = currentHour >= 17 || currentHour < 4
  const activeRoutine = isNight ? eveningRoutine : morningRoutine

  const [checked, setChecked] = useState(activeRoutine.map((item) => item.done))
  const [showExpiryBanner, setShowExpiryBanner] = useState(true)

  const weather = getEnvironmentalWeather()

  const toggleRoutine = (index: number) => {
    setChecked((items) => items.map((item, itemIndex) => (itemIndex === index ? !item : item)))
  }

  const skinAssessment = data?.skin_assessment
  const productSummary = data?.product_summary ?? { total_products_scanned: 0, safe_products_count: 0, avg_safety_score: null }
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
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'SC'

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

  const isPro = isActivePremium(subscription)
  const availableCredits = (coinBalance?.balance ?? 0).toLocaleString()

  const cleanStatusLabel = (status?: string): string => {
    if (!status) return 'Optimal'
    const s = status.toLowerCase()
    if (s.includes('optimal') || s.includes('sehat')) return 'Optimal'
    if (s.includes('baik')) return 'Baik'
    if (s.includes('perhatian') || s.includes('waspada')) return 'Perhatian'
    if (s.includes('kritis') || s.includes('bahaya') || s.includes('peringatan')) return 'Waspada'
    return 'Normal'
  }

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

      {/* =====================================================================
          1. DESKTOP VIEW (> 640px): Greeting Header + Weather Banner + Hero Grid
          ===================================================================== */}
      <header className="cluv-dashboard-header">
        <div>
          <h1 className="cluv-title-section">Selamat {timeOfDay}, {firstName} ✨</h1>
          <p className="cluv-subtitle cluv-mt-1">{todayFormatted}</p>
        </div>

        {/* Skinsistant AI Companion Weather Banner (Full Width under date) */}
        <div className="cluv-weather-bubble" aria-label="Saran Cuaca & Proteksi Kulit">
          <div className="cluv-weather-bubble-icon">
            <Bot size={18} />
          </div>
          <div className="cluv-weather-bubble-content">
            <div className="cluv-weather-bubble-header">
              <span className="cluv-weather-bubble-title">Skinsistant AI · Cuaca &amp; Proteksi Kulit</span>
              <span className="cluv-weather-bubble-tag">
                <SunMedium size={12} />
                <span>{weather.temp} · {weather.uvIndex}</span>
              </span>
            </div>
            <p className="cluv-weather-bubble-text">"{weather.tip}"</p>
          </div>
        </div>
      </header>

      {/* Desktop Hero Grid (2-Column 1.55fr : 1fr) */}
      <div className="cluv-desktop-hero-grid">
        {/* Observasi Kulit Terkini */}
        <section className="cluv-card cluv-hero-face-card cluv-flex-col cluv-gap-4">
          <div>
            <div className="cluv-flex-between cluv-items-center">
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Observasi Visual</span>
                <h2 className="cluv-title-card cluv-mt-1">Kondisi Kulit Terkini</h2>
              </div>
              {skinAssessment?.has_face_scan && (
                <button onClick={() => navigate('/face-scan')} className="cluv-btn is-outline is-sm">
                  <ScanFace size={14} />
                  <span>Pindai Ulang</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="cluv-flex-row cluv-gap-4 cluv-items-center cluv-py-4">
                <Skeleton height={80} width={80} radius="50%" />
                <div className="cluv-flex-1">
                  <Skeleton height={18} width={160} />
                  <div className="cluv-mb-2" />
                  <SkeletonText lines={2} />
                </div>
              </div>
            ) : skinAssessment?.has_face_scan ? (
              <div className="cluv-flex-row cluv-gap-4 cluv-items-start cluv-mt-4">
                {/* Biometric Circular Score Ring (Top Anchored) */}
                <div className="cluv-score-ring is-md cluv-flex-shrink-0">
                  <svg className="cluv-score-svg" viewBox="0 0 80 80">
                    <circle className="cluv-score-bg-circle" cx="40" cy="40" r="34" strokeWidth="6" />
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

                {/* Qualitative Badges & AI Observation */}
                <div className="cluv-flex-1">
                  <div className="cluv-flex-row cluv-gap-2 cluv-items-center cluv-flex-wrap">
                    <Badge variant={getStatusVariant(skinAssessment.latest_status)} dot size="sm">
                      {cleanStatusLabel(skinAssessment.latest_status)}
                    </Badge>
                    {skinAssessment.skin_type && (
                      <span className="cluv-badge is-slate is-sm">
                        Tipe: {skinAssessment.skin_type}
                      </span>
                    )}
                    {skinAssessment.trend_label && (
                      <span className="cluv-badge is-teal is-sm">
                        {skinAssessment.trend_label}
                      </span>
                    )}
                  </div>

                  <p className="cluv-body cluv-mt-2 cluv-line-relaxed cluv-text-muted cluv-desktop-note-clamp">
                    "{skinAssessment.analysis_notes || 'Kondisi skin barrier terpantau terjaga. Pertahankan hidrasi harian dan proteksi UV.'}"
                  </p>

                  {lastScanDate && (
                    <span className="cluv-caption cluv-text-muted cluv-mt-1 cluv-block">
                      Analisis terakhir · {lastScanDate}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="cluv-py-4">
                <EmptyFaceScan onScan={() => navigate('/face-scan')} />
              </div>
            )}
          </div>

          {skinAssessment?.has_face_scan && (
            <div className="cluv-flex-between cluv-items-center cluv-pt-3 cluv-border-t">
              <span className="cluv-caption cluv-text-muted">Konsultasikan perkembangan ini</span>
              <button onClick={() => navigate('/chatbot')} className="cluv-btn is-ghost is-sm">
                <MessageCircle size={14} />
                <span>Tanya Skinsistant</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </section>

        {/* Keamanan Komposisi Skincare (Lab) */}
        <section className="cluv-card cluv-hero-lab-card cluv-flex-col cluv-gap-4">
          <div>
            <div className="cluv-flex-between cluv-items-center">
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Keamanan Skincare</span>
                <h2 className="cluv-title-card cluv-mt-1">Pemeriksaan Bahan</h2>
              </div>
              <div className="cluv-stat-icon is-blue">
                <FlaskConical size={18} />
              </div>
            </div>

            {/* Lab Metrics Badges (Compact Inline Badges) */}
            <div className="cluv-lab-metrics-strip">
              <span className="cluv-lab-metric-badge">
                Produk Diuji: <strong>{productSummary.total_products_scanned}</strong>
              </span>
              <span className="cluv-lab-metric-badge is-teal">
                Formula Aman: <strong>{productSummary.safe_products_count}</strong>
              </span>
              <span className="cluv-lab-metric-badge is-blue">
                Skor Keamanan: <strong>{productSummary.avg_safety_score !== null ? `${productSummary.avg_safety_score}/100` : '-'}</strong>
              </span>
            </div>

            <p className="cluv-body cluv-mt-3 cluv-line-relaxed">
              {productSummary.total_products_scanned > 0
                ? 'Produk skincare yang kamu gunakan terpantau ramah bagi skin barrier. Pastikan urutan pemakaian dan layering bahan aktif tidak bertabrakan.'
                : 'Pindai label komposisi produk (serum, toner, sunscreen) untuk mendeteksi bahan komedogenik atau iritan berbahaya.'}
            </p>
          </div>

          <div className="cluv-flex-between cluv-items-center cluv-pt-3 cluv-border-t">
            <span className="cluv-caption cluv-text-muted">
              {productSummary.total_products_scanned > 0 ? `${productSummary.total_products_scanned} produk terdaftar` : 'Belum ada produk'}
            </span>
            <button
              onClick={() => navigate('/ingredient-scan')}
              className="cluv-btn is-ghost is-sm"
            >
              <span>{productSummary.total_products_scanned > 0 ? 'Pindai Produk Baru' : 'Mulai Pindai'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>



      {/* =====================================================================
          2. MOBILE VIEW (<= 640px): AI Weather Companion + Unified Skin Bento
          ===================================================================== */}
      <div className="cluv-mobile-dashboard">
        {/* SKINSISTANT AI WEATHER COMPANION BUBBLE (Konsep 2) */}
        <div className="cluv-weather-bubble">
          <div className="cluv-weather-bubble-icon">
            <Bot size={16} />
          </div>
          <div className="cluv-weather-bubble-content">
            <div className="cluv-weather-bubble-header">
              <span className="cluv-weather-bubble-title">Skinsistant AI · Cuaca Hari Ini</span>
              <span className="cluv-weather-bubble-tag">
                <SunMedium size={11} />
                <span>{weather.temp} · {weather.uvIndex}</span>
              </span>
            </div>
            <p className="cluv-weather-bubble-text">"{weather.tip}"</p>
          </div>
        </div>

        {/* UNIFIED BENTO SKIN CARD (Opsi A: Sapaan + Dompet + Observasi Kulit) */}
        <div className="cluv-mobile-unified-card">
          {/* Header Menyatu: Avatar Ring + Sapaan Bersih + Kapsul Kredit */}
          <div className="cluv-mobile-unified-header">
            <div className="cluv-flex-row cluv-gap-2 cluv-items-center">
              <div className={`cluv-avatar-ring ${isPro ? 'is-pro' : 'is-free'}`}>
                <div className="cluv-avatar-ring-inner">{userInitials}</div>
              </div>
              <span className="cluv-mobile-name">Halo, {firstName}</span>
            </div>

            <div
              className="cluv-credit-capsule"
              onClick={() => navigate('/pricing')}
              title="Isi ulang credits"
            >
              <span className="cluv-credit-capsule-val">
                <Zap size={12} />
                <span>{availableCredits}</span>
              </span>
              <span className="cluv-credit-capsule-divider" />
              <span className="cluv-credit-capsule-add">+</span>
            </div>
          </div>

          {/* Body: Score Ring + Details + Mini Action Pills */}
          {loading ? (
            <div className="cluv-mobile-unified-body">
              <Skeleton height={56} width={56} radius="50%" />
              <div className="cluv-flex-1">
                <Skeleton height={14} width={120} />
                <div className="cluv-mb-1" />
                <SkeletonText lines={2} />
              </div>
            </div>
          ) : skinAssessment?.has_face_scan ? (
            <div className="cluv-mobile-unified-body">
              <div className="cluv-score-ring is-sm">
                <svg className="cluv-score-svg" viewBox="0 0 80 80">
                  <circle className="cluv-score-bg-circle" cx="40" cy="40" r="34" strokeWidth="7" />
                  <circle
                    className={`cluv-score-fg-circle is-${getStatusVariant(skinAssessment.latest_status)}`}
                    cx="40"
                    cy="40"
                    r="34"
                    strokeWidth="7"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 - (213.6 * Math.min(Math.max(skinAssessment.latest_score || 0, 0), 100)) / 100}
                  />
                </svg>
                <div className="cluv-score-center">
                  <span className="cluv-score-val">{skinAssessment.latest_score ?? '-'}</span>
                  <span className="cluv-score-max">/100</span>
                </div>
              </div>

              <div className="cluv-mobile-skin-details">
                <div className="cluv-mobile-skin-chips">
                  <Badge variant={getStatusVariant(skinAssessment.latest_status)} dot size="sm">
                    {cleanStatusLabel(skinAssessment.latest_status)}
                  </Badge>
                  {skinAssessment.skin_type && (
                    <span className="cluv-badge is-slate is-sm">
                      {skinAssessment.skin_type}
                    </span>
                  )}
                  <span className="cluv-badge is-teal is-sm">
                    {isNight ? 'Fokus: Barrier' : 'Fokus: Proteksi UV'}
                  </span>
                </div>

                <p className="cluv-mobile-skin-punchline">
                  "{skinAssessment.analysis_notes || 'Kondisi kulit terjaga optimal. Tetap terhidrasi dan gunakan sunscreen harian.'}"
                </p>

                <div className="cluv-mobile-skin-actions">
                  <button
                    onClick={() => navigate('/face-scan')}
                    className="cluv-mobile-action-pill is-primary"
                  >
                    <ScanFace size={12} />
                    <span>Pindai Ulang</span>
                  </button>
                  <button
                    onClick={() => navigate('/chatbot')}
                    className="cluv-mobile-action-pill is-subtle"
                  >
                    <MessageCircle size={12} />
                    <span>Tanya AI</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="cluv-flex-col cluv-gap-2 cluv-w-full">
              <div className="cluv-flex-between cluv-items-center">
                <span className="cluv-title-card">Observasi Kulit AI</span>
                <span className="cluv-badge is-slate is-sm">Belum ada scan</span>
              </div>
              <p className="cluv-caption cluv-text-muted cluv-m-0">
                Pindai wajah untuk memetakan kondisi skin barrier kamu.
              </p>
              <button onClick={() => navigate('/face-scan')} className="cluv-btn is-primary is-sm cluv-mt-1 cluv-w-full">
                <ScanFace size={14} />
                <span>Mulai Scan Wajah</span>
              </button>
            </div>
          )}
        </div>

        {/* 4-Item Squircle Shortcuts (Posisi DI BAWAH Bento Skin) */}
        <div className="cluv-mobile-shortcuts" aria-label="Akses Cepat Mobile">
          <button onClick={() => navigate('/face-scan')} className="cluv-mobile-shortcut-btn">
            <div className="cluv-mobile-shortcut-icon is-teal">
              <ScanFace size={22} strokeWidth={2.2} />
            </div>
            <span className="cluv-mobile-shortcut-label">Scan Wajah</span>
          </button>

          <button onClick={() => navigate('/ingredient-scan')} className="cluv-mobile-shortcut-btn">
            <div className="cluv-mobile-shortcut-icon is-blue">
              <FlaskConical size={22} strokeWidth={2.2} />
            </div>
            <span className="cluv-mobile-shortcut-label">Scan Bahan</span>
          </button>

          <button onClick={() => navigate('/missions')} className="cluv-mobile-shortcut-btn">
            <div className="cluv-mobile-shortcut-icon is-amber">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>
            <span className="cluv-mobile-shortcut-label">Misi Glow</span>
          </button>

          <button onClick={() => navigate('/chatbot')} className="cluv-mobile-shortcut-btn">
            <div className="cluv-mobile-shortcut-icon is-purple">
              <Bot size={22} strokeWidth={2.2} />
            </div>
            <span className="cluv-mobile-shortcut-label">Tanya AI</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. SHARED SECTIONS: Trend & Rutinitas + Riwayat Scan & Sirkadian
          ===================================================================== */}
      {/* MIDDLE GRID: TREN KULIT (1.55fr) + RUTINITAS AM/PM (1fr) */}
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
            <div className="cluv-flex-row cluv-gap-3 cluv-items-end cluv-bars-skeleton">
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
              <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-empty-desc">
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

        {/* Dynamic Rutinitas Harian dengan Embedded Progress Bar */}
        <section className="cluv-card cluv-flex-col cluv-justify-between">
          <div>
            <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
              <div>
                <h2 className="cluv-title-card">{isNight ? 'Rutinitas Malam 🌙' : 'Rutinitas Pagi ☀️'}</h2>
                <p className="cluv-caption cluv-text-muted cluv-mt-1">
                  {isNight ? '3 langkah · regenerasi barrier' : '3 langkah · proteksi harian'}
                </p>
              </div>
              <div className="cluv-flex-col cluv-items-end">
                <span className="cluv-badge is-teal is-sm">
                  {checked.filter(Boolean).length}/{activeRoutine.length} Selesai
                </span>
                <div className="cluv-routine-progress-track">
                  <div
                    className="cluv-routine-progress-bar"
                    style={{
                      width: `${Math.round((checked.filter(Boolean).length / Math.max(activeRoutine.length, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="cluv-checklist-group cluv-mt-3">
              {activeRoutine.map((item, index) => (
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
            <span>Buka detail misi lengkap</span>
            <ChevronRight size={14} />
          </button>
        </section>
      </div>

      {/* 4. BOTTOM BENTO GRID: Riwayat Scan (1.55fr) + Ritme Sirkadian & AI Prompts (1fr) */}
      <div className="cluv-bottom-bento-grid">
        {/* Kolom Kiri: Riwayat Scan Terakhir */}
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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="cluv-flex-row cluv-gap-3 cluv-items-center">
                    <Skeleton height={40} width={40} radius="10px" />
                    <div className="cluv-flex-1"><SkeletonText lines={2} /></div>
                    <Skeleton height={20} width={40} radius="100px" />
                  </div>
                ))}
              </div>
            ) : recentScans.length > 0 ? (
              <div className="cluv-recent-scan-list cluv-mt-3">
                {recentScans.slice(0, 5).map((scan) => (
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

          <div className="cluv-flex-between cluv-items-center cluv-pt-3 cluv-border-t cluv-mt-3">
            <span className="cluv-caption cluv-text-muted">
              {recentScans.length > 0 ? `${recentScans.length} scan tercatat` : 'Belum ada aktivitas'}
            </span>
            <button onClick={() => navigate('/scan-history')} className="cluv-btn is-ghost is-sm">
              <span>Buka Log Lengkap</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* Kolom Kanan: Ritme Sirkadian & 1-Tap AI Prompt Chips */}
        <section className="cluv-card cluv-circadian-card">
          <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
            <div>
              <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Ritme Biologis Kulit</span>
              <h2 className="cluv-title-card cluv-mt-1">Fokus Sirkadian</h2>
            </div>
            <div className="cluv-stat-icon is-teal">
              <Sparkles size={18} />
            </div>
          </div>

          {/* Sirkadian Phase Box */}
          <div className={`cluv-circadian-phase ${isNight ? 'is-night' : 'is-day'}`}>
            <div className="cluv-circadian-phase-icon">
              {isNight ? <Moon size={18} /> : <SunMedium size={18} />}
            </div>
            <div>
              <h3 className="cluv-circadian-phase-title">
                {isNight ? 'Fase Regenerasi Seluler (Malam)' : 'Fase Pertahanan Aktif (Siang)'}
              </h3>
              <p className="cluv-circadian-phase-desc">
                {isNight
                  ? 'Sintesis kolagen dan perbaikan mikrolesi kulit memuncak saat tidur. Nutrisi skin barrier dengan hidrasi kaya lipid.'
                  : 'Kulit aktif memblokir radikal bebas dan radiasi UV. Pastikan re-apply sunscreen dan hindari iritasi aktif berlebih.'}
              </p>
            </div>
          </div>

          {/* 1-Tap AI Prompt Chips */}
          <div>
            <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Konsultasi AI Instan</span>
            <div className="cluv-flex-col cluv-gap-2 cluv-mt-2">
              {isNight ? (
                <>
                  <button
                    onClick={() => navigate('/chatbot?q=' + encodeURIComponent('Bagaimana urutan layering skincare malam yang aman untuk skin barrier?'))}
                    className="cluv-prompt-chip"
                  >
                    <span>🌙 Urutan layering produk malam ini?</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/chatbot?q=' + encodeURIComponent('Apakah aman menggunakan bahan aktif seperti retinol malam ini?'))}
                    className="cluv-prompt-chip"
                  >
                    <span>💧 Aturan pakai bahan aktif malam?</span>
                    <ChevronRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/chatbot?q=' + encodeURIComponent('Bagaimana cara re-apply sunscreen yang tepat di siang hari?'))}
                    className="cluv-prompt-chip"
                  >
                    <span>☀️ Cara re-apply sunscreen siang ini?</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/chatbot?q=' + encodeURIComponent('Bahan skincare apa yang melindungi kulit dari polusi dan radiasi UV?'))}
                    className="cluv-prompt-chip"
                  >
                    <span>🛡️ Proteksi antioksidan di siang hari?</span>
                    <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}

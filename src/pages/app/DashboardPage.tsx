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
          1. DESKTOP VIEW (> 640px): Greeting Header + 2-Column Hero Grid
          ===================================================================== */}
      <header className="cluv-dashboard-header">
        <div>
          <span className="cluv-caption cluv-text-muted cluv-font-bold cluv-uppercase">Ringkasan Hari Ini</span>
          <h1 className="cluv-title-page cluv-dashboard-title">Selamat {timeOfDay}, {firstName} ✨</h1>
          <p className="cluv-caption cluv-text-muted cluv-dashboard-subtitle">{todayFormatted}</p>
        </div>

        {/* Desktop Skinsistant AI Weather Companion */}
        <div className="cluv-desktop-weather-card">
          <div className="cluv-desktop-weather-avatar">
            <Bot size={18} />
          </div>
          <div className="cluv-desktop-weather-content">
            <div className="cluv-desktop-weather-header">
              <span className="cluv-desktop-weather-brand">Skinsistant AI · Rekomendasi Cuaca</span>
              <span className="cluv-badge is-gold is-sm">
                <SunMedium size={12} />
                <span>{weather.temp} · {weather.uvIndex}</span>
              </span>
            </div>
            <p className="cluv-desktop-weather-tip">"{weather.tip}"</p>
          </div>
        </div>
      </header>

      {/* Desktop Hero 2-Column Grid (Observasi Wajah 1.55fr + Lab Skincare 1fr) */}
      <div className="cluv-desktop-hero-grid">
        {/* Observasi Kulit Terkini */}
        <section className="cluv-card cluv-hero-face-card cluv-flex-col cluv-justify-between">
          <div>
            <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
              <div>
                <span className="cluv-caption cluv-text-muted cluv-font-bold cluv-uppercase">Observasi Visual</span>
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
            <div className="cluv-flex-between cluv-items-center cluv-border-t cluv-pt-3 cluv-mt-4">
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
        <section className="cluv-card cluv-hero-lab-card cluv-flex-col cluv-justify-between">
          <div>
            <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
              <div>
                <span className="cluv-caption cluv-text-muted cluv-font-bold cluv-uppercase">Keamanan Skincare</span>
                <h2 className="cluv-title-card cluv-mt-1">Pemeriksaan Bahan</h2>
              </div>
              <div className="cluv-stat-icon is-blue">
                <FlaskConical size={18} />
              </div>
            </div>

            {/* Lab Metrics Micro-Cards */}
            <div className="cluv-lab-metrics-strip">
              <div className="cluv-lab-metric-box">
                <span className="cluv-caption cluv-text-muted">Produk Diuji</span>
                <span className="cluv-lab-metric-num">{productSummary.total_products_scanned}</span>
              </div>
              <div className="cluv-lab-metric-box is-teal">
                <span className="cluv-caption cluv-text-muted">Formula Aman</span>
                <span className="cluv-lab-metric-num is-teal">{productSummary.safe_products_count}</span>
              </div>
              <div className="cluv-lab-metric-box is-blue">
                <span className="cluv-caption cluv-text-muted">Skor Keamanan</span>
                <span className="cluv-lab-metric-num is-blue">
                  {productSummary.avg_safety_score !== null ? `${productSummary.avg_safety_score}/100` : '-'}
                </span>
              </div>
            </div>

            <p className="cluv-body cluv-mt-3 cluv-line-relaxed">
              {productSummary.total_products_scanned > 0
                ? 'Produk skincare yang kamu gunakan terpantau ramah bagi skin barrier. Pastikan urutan pemakaian dan layering bahan aktif tidak bertabrakan.'
                : 'Pindai label komposisi produk (serum, toner, sunscreen) untuk mendeteksi bahan komedogenik atau iritan berbahaya.'}
            </p>
          </div>

          <div className="cluv-flex-between cluv-items-center cluv-border-t cluv-pt-3 cluv-mt-4">
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

      {/* Desktop 4-Column Bento Action Tiles */}
      <div className="cluv-quick-scan-grid">
        <button onClick={() => navigate('/face-scan')} className="cluv-quick-tile is-face">
          <div className="cluv-quick-tile-icon is-teal">
            <ScanFace size={22} strokeWidth={2.2} />
          </div>
          <div className="cluv-quick-tile-info">
            <h3 className="cluv-quick-tile-title">Scan Wajah AI</h3>
            <p className="cluv-quick-tile-sub">Analisis visual & skor barrier</p>
          </div>
          <ChevronRight size={18} className="cluv-quick-tile-arrow" />
        </button>

        <button onClick={() => navigate('/ingredient-scan')} className="cluv-quick-tile is-ingredient">
          <div className="cluv-quick-tile-icon is-blue">
            <FlaskConical size={22} strokeWidth={2.2} />
          </div>
          <div className="cluv-quick-tile-info">
            <h3 className="cluv-quick-tile-title">Scan Komposisi</h3>
            <p className="cluv-quick-tile-sub">Uji bahan komedogenik & iritan</p>
          </div>
          <ChevronRight size={18} className="cluv-quick-tile-arrow" />
        </button>

        <button onClick={() => navigate('/missions')} className="cluv-quick-tile is-mission">
          <div className="cluv-quick-tile-icon is-gold">
            <Sparkles size={22} strokeWidth={2.2} />
          </div>
          <div className="cluv-quick-tile-info">
            <h3 className="cluv-quick-tile-title">Misi Glow Harian</h3>
            <p className="cluv-quick-tile-sub">{missions.completed} dari {missions.total} rutinitas selesai</p>
          </div>
          <ChevronRight size={18} className="cluv-quick-tile-arrow" />
        </button>

        <button onClick={() => navigate('/chatbot')} className="cluv-quick-tile is-chat">
          <div className="cluv-quick-tile-icon is-purple">
            <MessageCircle size={22} strokeWidth={2.2} />
          </div>
          <div className="cluv-quick-tile-info">
            <h3 className="cluv-quick-tile-title">Tanya Skinsistant</h3>
            <p className="cluv-quick-tile-sub">Konsultasi AI cerdas 24/7</p>
          </div>
          <ChevronRight size={18} className="cluv-quick-tile-arrow" />
        </button>
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
          3. SHARED SECTIONS: Misi Hari Ini + Trend & Rutinitas + Riwayat Scan
          ===================================================================== */}
      {/* COMPACT MISSION STRIP */}
      <div className="cluv-mission-strip">
        <div className="cluv-mission-left">
          <span className="cluv-stat-icon is-teal cluv-mission-icon">
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

        {/* Dynamic Rutinitas Harian (Pagi vs Malam) */}
        <section className="cluv-card cluv-flex-col cluv-justify-between">
          <div>
            <div className="cluv-flex-between cluv-items-center cluv-border-b cluv-pb-3">
              <div>
                <h2 className="cluv-title-card">{isNight ? 'Rutinitas Malam 🌙' : 'Rutinitas Pagi ☀️'}</h2>
                <p className="cluv-caption cluv-text-muted cluv-mt-1">
                  {isNight ? '3 langkah · sekitar 7 menit' : '3 langkah · sekitar 5 menit'}
                </p>
              </div>
              <button className="cluv-btn is-ghost is-sm" aria-label="Opsi rutinitas">
                <MoreHorizontal size={18} />
              </button>
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
            <span>Lihat rutinitas lengkap</span>
            <ChevronRight size={14} />
          </button>
        </section>
      </div>

      {/* BOTTOM SECTION: RIWAYAT SCAN TERAKHIR */}
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

        {/* Adaptive Reminder Strip (Sunscreen during daytime, Barrier recovery at night) */}
        {isNight ? (
          <div className="cluv-card-strip is-neutral cluv-mt-4">
            <div className="cluv-card-icon-wrap is-teal is-sm">
              <Sparkles size={16} />
            </div>
            <p className="cluv-caption cluv-m-0">
              Kulit memasuki fase regenerasi sel saat tidur. Pastikan skin barrier terhidrasi optimal semalaman.
            </p>
          </div>
        ) : (
          <div className="cluv-card-strip is-gold cluv-mt-4">
            <div className="cluv-card-icon-wrap is-gold is-sm">
              <SunMedium size={16} />
            </div>
            <p className="cluv-caption cluv-m-0">
              Jangan lupa re-apply sunscreen siang hari untuk proteksi kulit maksimal.
            </p>
          </div>
        )}
      </section>

    </div>
  )
}

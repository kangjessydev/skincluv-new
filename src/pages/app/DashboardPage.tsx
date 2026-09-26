// src/pages/app/DashboardPage.tsx
// Skincluv Unified Data-Driven Dashboard (RFC 008 AI Council Consensus)
// Integrated with get_user_dashboard_summary RPC, Zero-IDOR, Cold Start 3-State UX

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScanFace,
  MessageSquare,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium, isActiveGlow, getDaysRemaining, isSubscriptionExpired } from '@/utils/subscriptionHelpers'
import { useDashboardData } from '@/hooks/useDashboardData'

function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hari ini'
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`

    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { coinBalance, subscription } = useAuthStore()
  const { data, loading, error } = useDashboardData()

  const [expiryBannerDismissed, setExpiryBannerDismissed] = useState(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('skincluv_dismiss_expiry_banner') === 'true'
  })

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const userCredits = coinBalance?.balance ?? 0

  const isPaidActive = (isPro || isGlow) && !isSubscriptionExpired(subscription)
  const daysRemaining = isPaidActive ? getDaysRemaining(subscription) : 0
  const showExpiryAlert = isPaidActive && daysRemaining <= 3 && daysRemaining > 0 && !expiryBannerDismissed

  const handleDismissExpiryBanner = () => {
    setExpiryBannerDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('skincluv_dismiss_expiry_banner', 'true')
    }
  }

  const skinAssessment = data?.skin_assessment
  const scanCounts = data?.scan_counts ?? { face_total: 0, ingredient_total: 0, total: 0 }
  const productSummary = data?.product_summary ?? { total_products_scanned: 0, safe_products_count: 0, avg_safety_score: null }
  const missions = data?.missions ?? { completed: 0, total: 1, active_list: [] }
  const recentScans = data?.recent_scans ?? []

  const hasFaceScan = skinAssessment?.has_face_scan ?? false
  const latestScore = skinAssessment?.latest_score ?? null
  const latestStatus = skinAssessment?.latest_status || 'Kondisi Kulit Terpantau'
  const canShowDelta = skinAssessment?.can_show_delta ?? false
  const deltaScore = skinAssessment?.delta_score ?? 0
  const trendDir = skinAssessment?.trend_direction ?? 'none'
  const trendLabel = skinAssessment?.trend_label || 'Scan berkala untuk melihat tren'

  return (
    <div className="skincluv-dashboard-grid">
      {/* 0. PASS EXPIRY REMINDER BANNER (RFC 010 H-3 / H-1) */}
      {showExpiryAlert && (
        <div className={`expiry-alert-banner ${daysRemaining === 1 ? 'alert-urgent' : 'alert-warning'}`}>
          <div className="expiry-alert-icon">
            {daysRemaining === 1 ? <AlertTriangle size={18} /> : <Clock size={18} />}
          </div>
          <div className="expiry-alert-body">
            <strong className="expiry-alert-title">
              {daysRemaining === 1 ? 'Hari Terakhir Paket Akses Kamu!' : `Paket Akses Tersisa ${daysRemaining} Hari`}
            </strong>
            <p className="expiry-alert-msg">
              {daysRemaining === 1
                ? 'Besok akun kembali ke versi gratis dan kuota yang belum terpakai akan hangus. Perpanjang kapan saja — tanpa auto-debit.'
                : `Paket Akses kamu berakhir ${subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'segera'}. Ingin lanjut tanpa putus? Perpanjang kapan saja — tanpa auto-debit.`}
            </p>
          </div>
          <div className="expiry-alert-actions">
            <button onClick={() => navigate('/pricing')} className="btn-renew-banner">
              {daysRemaining === 1 ? 'Perpanjang Sekarang' : 'Perpanjang Akses'}
            </button>
            <button onClick={handleDismissExpiryBanner} className="btn-dismiss-banner" aria-label="Tutup pemberitahuan">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 1. STATUS HERO BANNER (3-STATE COLD START UX) */}
      <div className={`status-hero ${!hasFaceScan ? 'hero-cold-start' : ''}`}>
        <div className="hero-pattern-dots" />

        {hasFaceScan ? (
          // STATE C: User sudah memiliki Face Scan
          <>
            <div className="hero-top-row">
              <div className="hero-label">SKOR KESEHATAN KULIT WAJAH</div>
              <div className={`hero-trend-badge trend-${trendDir}`}>
                {trendDir === 'improving' && <TrendingUp size={13} />}
                {trendDir === 'attention' && <TrendingDown size={13} />}
                {trendDir === 'stable' && <Minus size={13} />}
                {trendDir === 'none' && <Sparkles size={13} />}
                <span>
                  {canShowDelta && deltaScore !== 0
                    ? `${deltaScore > 0 ? `+${deltaScore}` : deltaScore} poin (${trendLabel})`
                    : trendLabel}
                </span>
              </div>
            </div>

            <div className="hero-score-group">
              <span className="hero-score-num">{latestScore}</span>
              <span className="hero-score-sub">/ 100 — {latestStatus}</span>
            </div>

            <p className="hero-description">
              {skinAssessment?.analysis_notes
                ? skinAssessment.analysis_notes
                : `Diagnosis dermatologis AI menunjukkan tipe kulit ${skinAssessment?.skin_type || 'normal'}. Lanjutkan perawatan rutin harianmu.`}
            </p>

            <div className="hero-footer-row">
              <span className="hero-date-badge">
                <Calendar size={12} /> Terakhir diperiksa: {formatRelativeDate(skinAssessment?.latest_scanned_at)}
              </span>
              <button onClick={() => navigate('/scan-history')} className="hero-action-link">
                Lihat Detail Diagnosis <ArrowRight size={13} />
              </button>
            </div>
          </>
        ) : (
          // STATE A & B: User belum pernah Face Scan
          <div className="hero-onboarding-content">
            <div className="hero-onboarding-badge">
              <Sparkles size={14} className="text-amber-300" />
              <span>
                {scanCounts.ingredient_total > 0
                  ? `Kamu sudah menganalisis ${scanCounts.ingredient_total} produk skincare`
                  : 'Mulai Perjalanan Kulit Sehatmu'}
              </span>
            </div>
            <h2 className="hero-onboarding-title">Kenali Kondisi & Kebutuhan Kulit Wajahmu</h2>
            <p className="hero-onboarding-sub">
              Dapatkan diagnosis 16 parameter klinis, rekomendasi bahan aktif terverifikasi dermatologi, dan skor kesehatan kulit dalam 10 detik.
            </p>
            <div className="hero-onboarding-actions">
              <button onClick={() => navigate('/face-scan')} className="btn-hero-primary">
                <ScanFace size={18} />
                <span>Mulai Face Scan Pertama</span>
              </button>
              {scanCounts.ingredient_total === 0 && (
                <button onClick={() => navigate('/ingredient-scan')} className="btn-hero-secondary">
                  <FlaskConical size={16} />
                  <span>Scan Komposisi Produk</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. QUICK ACTIONS ROW (UPGRADED TO 3 COLS: FACE + INGREDIENT + CHATBOT) */}
      <div className="actions-row">
        <div className="action-card card-face-scan" onClick={() => navigate('/face-scan')}>
          <div className="action-icon-box purple">
            <ScanFace size={22} />
          </div>
          <div className="action-meta">
            <h3 className="action-title">Face Scan AI</h3>
            <p className="action-sub">Analisis 16 parameter klinis wajah</p>
          </div>
        </div>

        <div className="action-card card-ingredient-scan" onClick={() => navigate('/ingredient-scan')}>
          <div className="action-icon-box emerald">
            <FlaskConical size={22} />
          </div>
          <div className="action-meta">
            <h3 className="action-title">Scan Komposisi</h3>
            <p className="action-sub">Cek keamanan formula & red flags</p>
          </div>
        </div>

        <div className="action-card card-skinsistant" onClick={() => navigate('/chatbot')}>
          <div className="action-icon-box teal">
            <MessageSquare size={22} />
          </div>
          <div className="action-meta">
            <h3 className="action-title">Skinsistant AI</h3>
            <p className="action-sub">Konsultasi interaktif & rekomendasi</p>
          </div>
        </div>
      </div>

      {/* 3. RETENTION / PROGRESS STRIP (DATA-DRIVEN) */}
      <div className="retention-section">
        <div className="section-header-title">PROGRES & AKTIVITAS KAMU</div>
        <div className="retention-strip">
          <div className="retention-card">
            <div className="r-num">{scanCounts.total}</div>
            <div className="r-cap">Total Scan ({scanCounts.face_total} Wajah · {scanCounts.ingredient_total} Produk)</div>
          </div>
          <div className="retention-card">
            <div className="r-num">{productSummary.total_products_scanned}</div>
            <div className="r-cap">Produk di Rak ({productSummary.safe_products_count} Formula Aman)</div>
          </div>
          <div className="retention-card">
            <div className="r-num">{missions.completed} / {missions.total}</div>
            <div className="r-cap">Misi Aktif Selesai</div>
          </div>
          <div className="retention-card">
            <div className="r-num">{userCredits}</div>
            <div className="r-cap streak">Saldo AI Credits ⚡</div>
          </div>
        </div>
      </div>

      {/* 4. SIDE RAIL CARDS (Desktop side column) */}
      <div className="side-rail-section">
        <div className="side-card">
          <div className="side-card-header">
            <span className="side-title">SALDO AI CREDITS</span>
            <span className={`side-badge ${isPro ? 'badge-pro' : isGlow ? 'badge-amber' : 'badge-free'}`}>
              {isPro ? 'Pro Member' : isGlow ? 'Glow Member' : 'Free Account'}
            </span>
          </div>
          <div className="side-stat-value">{userCredits} Credits</div>
          <div className="side-action-sub">
            <button onClick={() => navigate('/pricing')} className="side-topup-btn">
              Isi Ulang / Upgrade Paket →
            </button>
          </div>
        </div>

        <div className="side-card">
          <div className="side-card-header">
            <span className="side-title">RAK VIRTUAL PRODUK</span>
            <span className="side-badge badge-neutral">
              {productSummary.total_products_scanned} Produk
            </span>
          </div>
          <p className="side-text">
            {productSummary.total_products_scanned > 0
              ? `Rata-rata skor keamanan produk kamu adalah ${productSummary.avg_safety_score ?? 80}/100.`
              : 'Belum ada produk yang kamu periksa. Scan komposisi krim, toner, atau serum harianmu!'}
          </p>
          <button onClick={() => navigate('/ingredient-scan')} className="side-inline-link">
            + Tambah Scan Produk
          </button>
        </div>

        <div className="side-card">
          <div className="side-card-header">
            <span className="side-title">DAILY CLINICAL INSIGHT</span>
            <span className="side-badge badge-teal">Dermatology Tip</span>
          </div>
          <p className="side-text">
            Siklus pergantian sel kulit (epidermis) membutuhkan waktu ~28 hari. Pertahankan rutinitas pembersihan lembut dan hidrasi untuk hasil optimal.
          </p>
        </div>
      </div>

      {/* 5. PROMO UPGRADE CARD */}
      {!isPro && (
        <div className="promo-banner-card">
          <div className="promo-meta">
            <div className="promo-title-row">
              <Sparkles size={16} className="text-amber-300" />
              <b className="promo-title">Tingkatkan ke Skincluv PRO</b>
            </div>
            <p className="promo-sub">Buka kuota AI melimpah, audit formula tanpa batas, dan histori komprehensif</p>
          </div>
          <button onClick={() => navigate('/pricing')} className="promo-action-btn">
            Upgrade Sekarang
          </button>
        </div>
      )}

      {/* 6. RECENT HISTORY SECTION (UNIFIED FACE + INGREDIENT SCANS) */}
      <div className="history-section">
        <div className="history-header-row">
          <div className="section-header-title" style={{ margin: 0 }}>RIWAYAT SCAN TERBARU</div>
          <button onClick={() => navigate('/scan-history')} className="btn-view-all-history">
            Buka Riwayat Lengkap <ArrowRight size={13} />
          </button>
        </div>

        <div className="history-card-container">
          {loading ? (
            <div className="history-empty-box">
              <p>Memuat ringkasan riwayat terbaru...</p>
            </div>
          ) : recentScans.length === 0 ? (
            <div className="history-empty-box">
              <p>Belum ada riwayat pemindaian tersimpan.</p>
              <div className="history-empty-actions">
                <button onClick={() => navigate('/face-scan')} className="btn-empty-action">
                  <ScanFace size={14} /> Scan Wajah
                </button>
                <button onClick={() => navigate('/ingredient-scan')} className="btn-empty-action">
                  <FlaskConical size={14} /> Scan Produk
                </button>
              </div>
            </div>
          ) : (
            recentScans.map((item) => {
              const isFace = item.type === 'face'
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="history-item-row"
                  onClick={() => navigate('/scan-history')}
                >
                  <div className="h-date">{formatRelativeDate(item.created_at)}</div>
                  <div className="h-type-badge-col">
                    <span className={`h-type-pill ${isFace ? 'pill-purple' : 'pill-emerald'}`}>
                      {isFace ? <ScanFace size={12} /> : <FlaskConical size={12} />}
                      <span>{isFace ? 'Face Scan' : 'Ingredient'}</span>
                    </span>
                  </div>
                  <div className="h-detail-result">{item.title}</div>
                  <span className={`h-status-badge ${isFace ? 'badge-optimal' : 'badge-healthy'}`}>
                    {item.score !== null ? `Skor ${item.score}` : 'Terpantau'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* SCOPED VANILLA CSS STYLING MATCHING SKINCLUV MASTER TOKENS */}
      <style>{`
        .expiry-alert-banner {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: var(--radius-xl);
          box-sizing: border-box;
          animation: fadeIn 0.3s ease-out;
        }

        .alert-urgent {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .alert-urgent .expiry-alert-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .alert-urgent .expiry-alert-title {
          color: #991b1b;
        }

        .alert-urgent .expiry-alert-msg {
          color: #7f1d1d;
        }

        .alert-urgent .btn-renew-banner {
          background: #dc2626;
          color: #ffffff;
        }

        .alert-urgent .btn-renew-banner:hover {
          background: #b91c1c;
        }

        .alert-warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
        }

        .alert-warning .expiry-alert-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .alert-warning .expiry-alert-title {
          color: #92400e;
        }

        .alert-warning .expiry-alert-msg {
          color: #78350f;
        }

        .alert-warning .btn-renew-banner {
          background: #d97706;
          color: #ffffff;
        }

        .alert-warning .btn-renew-banner:hover {
          background: #b45309;
        }

        .expiry-alert-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
        }

        .expiry-alert-body {
          flex: 1;
          min-width: 0;
        }

        .expiry-alert-title {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 2px;
          font-family: var(--font-heading);
        }

        .expiry-alert-msg {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.4;
        }

        .expiry-alert-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-renew-banner {
          border: none;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .btn-renew-banner:hover {
          transform: translateY(-1px);
        }

        .btn-dismiss-banner {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-dismiss-banner:hover {
          color: var(--color-text-main);
          background: rgba(0, 0, 0, 0.05);
        }

        .skincluv-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-areas:
            "hero"
            "actions"
            "retention"
            "side"
            "promo"
            "history";
          gap: 16px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          font-family: var(--font-body, 'Quicksand', sans-serif);
        }

        .section-header-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        /* 1. STATUS HERO BANNER */
        .status-hero {
          grid-area: hero;
          background: linear-gradient(135deg, var(--skincluv-teal, #0f6784) 0%, var(--skincluv-teal-hover, #0b4f5c) 100%);
          border-radius: 20px;
          padding: 24px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px -6px rgba(15, 103, 132, 0.3);
          box-sizing: border-box;
          min-width: 0;
          width: 100%;
        }

        .hero-cold-start {
          background: linear-gradient(135deg, #0b4f5c 0%, #006591 100%);
        }

        .hero-pattern-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px);
          background-size: 16px 16px;
          pointer-events: none;
        }

        .hero-top-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          flex-wrap: wrap;
          gap: 8px;
        }

        .hero-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #e0f2fe;
        }

        .hero-trend-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .trend-improving {
          color: #86efac;
          background: rgba(34, 197, 94, 0.25);
        }

        .trend-attention {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.25);
        }

        .trend-stable, .trend-none {
          color: #bae6fd;
          background: rgba(255, 255, 255, 0.15);
        }

        .hero-score-group {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin: 14px 0 6px;
        }

        .hero-score-num {
          font-size: 3.25rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .hero-score-sub {
          font-size: 0.9375rem;
          color: #bae6fd;
          font-weight: 600;
        }

        .hero-description {
          position: relative;
          z-index: 1;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #e0f2fe;
          margin: 0;
          word-break: break-word;
        }

        .hero-footer-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          flex-wrap: wrap;
          gap: 8px;
        }

        .hero-date-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #bae6fd;
        }

        .hero-action-link {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 0.8125rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s;
        }

        .hero-action-link:hover {
          opacity: 0.85;
          text-decoration: underline;
        }

        /* Hero Onboarding State */
        .hero-onboarding-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hero-onboarding-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.16);
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fef08a;
          width: fit-content;
        }

        .hero-onboarding-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          line-height: 1.25;
        }

        .hero-onboarding-sub {
          font-size: 0.875rem;
          line-height: 1.5;
          color: #e0f2fe;
          margin: 0;
          max-width: 600px;
        }

        .hero-onboarding-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #0b4f5c;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-hero-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-hero-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }

        /* 2. ACTIONS ROW (3-COLUMNS) */
        .actions-row {
          grid-area: actions;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .actions-row {
            grid-template-columns: 1fr;
          }
        }

        .action-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          box-sizing: border-box;
          min-width: 0;
        }

        .action-card:hover {
          transform: translateY(-2px);
          border-color: #0f6784;
          box-shadow: 0 8px 20px -4px rgba(15, 103, 132, 0.12);
        }

        .action-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-icon-box.purple {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .action-icon-box.emerald {
          background: #dcfce7;
          color: #15803d;
        }

        .action-icon-box.teal {
          background: #e0f2fe;
          color: #0369a1;
        }

        .action-meta {
          min-width: 0;
        }

        .action-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px 0;
        }

        .action-sub {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-face-scan:hover { border-color: #a855f7; }
        .card-ingredient-scan:hover { border-color: #10b981; }
        .card-skinsistant:hover { border-color: #0ea5e9; }
        .promo-meta { display: flex; flex-direction: column; gap: 4px; }
        .side-action-sub { margin-top: 6px; }

        /* 3. RETENTION / PROGRESS STRIP */
        .retention-section {
          grid-area: retention;
        }

        .retention-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 640px) {
          .retention-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .retention-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          box-sizing: border-box;
        }

        .r-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .r-cap {
          font-size: 0.6875rem;
          color: #64748b;
          font-weight: 600;
          line-height: 1.3;
        }

        .r-cap.streak {
          color: #0f6784;
          font-weight: 700;
        }

        /* 4. SIDE RAIL */
        .side-rail-section {
          grid-area: side;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .side-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
        }

        .side-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .side-title {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748b;
          text-transform: uppercase;
        }

        .side-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .side-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .badge-pro {
          background: #e0e7ff;
          color: #4338ca;
        }

        .badge-amber {
          background: #fef3c7;
          color: #b45309;
        }

        .badge-free {
          background: #f1f5f9;
          color: #64748b;
        }

        .badge-teal {
          background: #ccfbf1;
          color: #0f766e;
        }

        .badge-neutral {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
        }

        .side-text {
          font-size: 0.8125rem;
          line-height: 1.45;
          color: #475569;
          margin: 0;
        }

        .side-topup-btn {
          background: none;
          border: none;
          color: #0f6784;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-top: 4px;
        }

        .side-topup-btn:hover {
          text-decoration: underline;
        }

        .side-inline-link {
          background: none;
          border: none;
          color: #0f6784;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-top: 8px;
          display: block;
        }

        .side-inline-link:hover {
          text-decoration: underline;
        }

        /* 5. PROMO BANNER */
        .promo-banner-card {
          grid-area: promo;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 18px 20px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .promo-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .promo-title {
          font-size: 0.9375rem;
          font-weight: 700;
        }

        .promo-sub {
          font-size: 0.75rem;
          color: #94a3b8;
          margin: 0;
        }

        .promo-action-btn {
          background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
          border: none;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.8125rem;
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
        }

        /* 6. RECENT HISTORY */
        .history-section {
          grid-area: history;
        }

        .history-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .btn-view-all-history {
          background: none;
          border: none;
          color: #0f6784;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 0;
        }

        .btn-view-all-history:hover {
          text-decoration: underline;
        }

        .history-card-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .history-item-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          gap: 12px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .history-item-row:last-child {
          border-bottom: none;
        }

        .history-item-row:hover {
          background: #f8fafc;
        }

        .h-date {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          min-width: 60px;
        }

        .h-type-badge-col {
          display: flex;
          align-items: center;
        }

        .h-type-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.6875rem;
          font-weight: 700;
        }

        .pill-purple {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .pill-emerald {
          background: #dcfce7;
          color: #15803d;
        }

        .h-detail-result {
          flex: 1;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .h-status-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .badge-optimal {
          background: #f0fdf4;
          color: #16a34a;
        }

        .badge-healthy {
          background: #ecfdf5;
          color: #059669;
        }

        .history-empty-box {
          padding: 24px;
          text-align: center;
          color: #64748b;
          font-size: 0.8125rem;
        }

        .history-empty-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 12px;
        }

        .btn-empty-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
        }

        .btn-empty-action:hover {
          background: #e2e8f0;
        }

        /* Desktop Layout Responsive Grid */
        @media (min-width: 1024px) {
          .skincluv-dashboard-grid {
            grid-template-columns: 2fr 1fr;
            grid-template-areas:
              "hero side"
              "actions side"
              "retention side"
              "promo promo"
              "history history";
            gap: 20px;
          }
        }
      `}</style>
    </div>
  )
}

// src/pages/app/DashboardPage.tsx
// Skincluv Personal Skin Journal (Anti-AI-Slop Editorial Design)
// Master Reference Implementation: Content > Containers, Whitespace > Borders

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScanFace,
  FlaskConical,
  MessageSquare,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  X,
  CheckCircle2,
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

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 11) return 'pagi'
  if (hour >= 11 && hour < 15) return 'siang'
  if (hour >= 15 && hour < 18) return 'sore'
  return 'malam'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile, coinBalance, subscription } = useAuthStore()
  const { data, loading } = useDashboardData()

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
  const latestStatus = skinAssessment?.latest_status || 'Kondisi Terpantau'
  const trendDir = skinAssessment?.trend_direction ?? 'none'
  const trendLabel = skinAssessment?.trend_label || 'Kondisi stabil'

  const userName = profile?.full_name?.split(' ')[0] || 'kamu'
  const timeOfDay = getTimeOfDayGreeting()
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="journal-page">
      <div className="journal-container">
        {/* PREVIEW BANNER: Switch to v2 */}
        <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#0369a1', flexWrap: 'wrap', gap: '8px' }}>
          <span>Versi 1 (Asli). Ingin melihat tampilan baru dari <strong>v0.dev</strong>?</span>
          <button onClick={() => navigate('/beranda-2')} style={{ background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Lihat Versi 2 (Fresh Blue) →
          </button>
        </div>

        {/* EXPIRY REMINDER (Quiet & Non-Intrusive) */}
        {showExpiryAlert && (
          <div className="journal-alert">
            <div className="alert-content">
              {daysRemaining === 1 ? <AlertTriangle size={16} /> : <Clock size={16} />}
              <span>
                Paket Akses kamu tersisa {daysRemaining} hari ({subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'segera'}).
              </span>
            </div>
            <div className="alert-actions">
              <button onClick={() => navigate('/pricing')} className="btn-alert-link">
                Perpanjang Akses
              </button>
              <button onClick={handleDismissExpiryBanner} className="btn-alert-close" aria-label="Tutup">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 1. EDITORIAL HEADER / GREETING */}
        <header className="journal-header">
          <div className="journal-date">{todayFormatted}</div>
          <h1 className="journal-greeting">Selamat {timeOfDay}, {userName}.</h1>
          <p className="journal-sub">
            {hasFaceScan
              ? 'Berikut ringkasan kondisi dan perkembangan kulit wajahmu.'
              : 'Selamat datang di ruang pemantauan dan konsultasi kulit personalmu.'}
          </p>
        </header>

        {/* 2. THE HERO ASSESSMENT (One Clear Visual Focal Point) */}
        <section className="journal-hero-surface">
          {hasFaceScan ? (
            <div className="assessment-card">
              <div className="assessment-top">
                <span className="eyebrow-label">SKIN ASSESSMENT TERKINI</span>
                <span className={`status-pill status-${trendDir}`}>
                  {trendLabel}
                </span>
              </div>

              <div className="assessment-score-row">
                <span className="score-number">{latestScore}</span>
                <span className="score-denom">/ 100</span>
                <span className="score-caption">{latestStatus}</span>
              </div>

              <p className="assessment-notes">
                {skinAssessment?.analysis_notes
                  ? skinAssessment.analysis_notes
                  : `Analisis AI menunjukkan tipe kulit ${skinAssessment?.skin_type || 'normal'}. Lanjutkan hidrasi dan perlindungan harian.`}
              </p>

              <div className="assessment-footer">
                <span className="footer-meta">
                  Terakhir diperiksa {formatRelativeDate(skinAssessment?.latest_scanned_at)}
                </span>
                <button onClick={() => navigate('/scan-history')} className="text-action-link">
                  Buka riwayat lengkap <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="cold-start-card">
              <span className="eyebrow-label">MEMULAI JURNAL</span>
              <h2 className="cold-title">Kenali kondisi kulit wajahmu</h2>
              <p className="cold-desc">
                Ambil satu foto wajah dalam pencahayaan alami untuk pemetaan 16 parameter kondisi kulit, analisis toleransi bahan aktif, dan rekomendasi personal.
              </p>
              <div className="cold-actions">
                <button onClick={() => navigate('/face-scan')} className="btn btn-primary">
                  <ScanFace size={16} />
                  <span>Mulai Face Scan Pertama</span>
                </button>
                <button onClick={() => navigate('/ingredient-scan')} className="btn btn-outline">
                  <FlaskConical size={16} />
                  <span>Periksa Komposisi Produk</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. PRIMARY ACTIONS (Clean & Uncluttered) */}
        {hasFaceScan && (
          <section className="journal-quick-actions">
            <button onClick={() => navigate('/face-scan')} className="action-pill-btn primary">
              <ScanFace size={16} />
              <span>Ambil Scan Wajah Baru</span>
            </button>
            <button onClick={() => navigate('/ingredient-scan')} className="action-pill-btn secondary">
              <FlaskConical size={16} />
              <span>Periksa Komposisi Skincare</span>
            </button>
            <button onClick={() => navigate('/chatbot')} className="action-pill-btn ghost">
              <MessageSquare size={16} />
              <span>Tanya Skinsistant</span>
            </button>
          </section>
        )}

        {/* 4. RECENT OBSERVATIONS (List with Hairline Dividers, NOT Nested Cards) */}
        <section className="journal-observations">
          <h2 className="section-title">Observasi Kulit & Produk</h2>
          
          <div className="observation-list">
            <div className="observation-item">
              <span className="obs-label">Tipe Kulit</span>
              <span className="obs-value">
                {skinAssessment?.skin_type ? skinAssessment.skin_type.charAt(0).toUpperCase() + skinAssessment.skin_type.slice(1) : 'Perlu scan awal'}
              </span>
            </div>

            <div className="observation-item">
              <span className="obs-label">Koleksi Produk Terverifikasi</span>
              <span className="obs-value">
                {productSummary.total_products_scanned > 0
                  ? `${productSummary.safe_products_count} dari ${productSummary.total_products_scanned} produk berstatus aman`
                  : 'Belum ada produk tersimpan'}
              </span>
            </div>

            <div className="observation-item">
              <span className="obs-label">Misi Perawatan Aktif</span>
              <span className="obs-value">
                {missions.completed} dari {missions.total} misi selesai
              </span>
            </div>

            <div className="observation-item">
              <span className="obs-label">Tren Observasi</span>
              <span className="obs-value">
                {hasFaceScan ? trendLabel : 'Menunggu pemindaian perdana'}
              </span>
            </div>
          </div>
        </section>

        {/* 5. RECENT ACTIVITY (Chronological Log) */}
        <section className="journal-activity">
          <div className="section-header-row">
            <h2 className="section-title">Aktivitas Terkini</h2>
            {recentScans.length > 0 && (
              <button onClick={() => navigate('/scan-history')} className="section-link">
                Semua catatan <ArrowRight size={13} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="empty-log-state">
              <p>Memuat catatan terbaru...</p>
            </div>
          ) : recentScans.length === 0 ? (
            <div className="empty-log-state">
              <p>Belum ada riwayat aktivitas tersimpan.</p>
              <p className="empty-hint">Aktivitas pemindaian wajah dan analisis komposisi produk akan muncul di sini secara kronologis.</p>
            </div>
          ) : (
            <div className="activity-list">
              {recentScans.slice(0, 4).map((scan) => {
                const isFace = scan.type === 'face'
                return (
                  <div
                    key={`${scan.type}-${scan.id}`}
                    className="activity-row"
                    onClick={() => navigate('/scan-history')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="activity-date">
                      {formatRelativeDate(scan.created_at)}
                    </div>
                    <div className="activity-main">
                      <div className="activity-title">{scan.title}</div>
                      <div className="activity-kind">
                        {isFace ? 'Pemetaan Kondisi Wajah' : 'Analisis Komposisi'}
                      </div>
                    </div>
                    <div className="activity-badge">
                      {scan.score !== null ? `Skor ${scan.score}` : 'Terpantau'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 6. UPGRADE ACCENT (Only shown for non-Pro, subtle and polite) */}
        {!isPro && (
          <section className="journal-upgrade-notice">
            <div className="notice-icon">
              <Sparkles size={16} />
            </div>
            <div className="notice-body">
              <p className="notice-title">Tingkatkan Akses ke Skincluv PRO</p>
              <p className="notice-desc">
                Dapatkan kuota AI harian tanpa batas, audit bahan kosmetik tak terbatas, dan perbandingan tren siklus 28 hari.
              </p>
            </div>
            <button onClick={() => navigate('/pricing')} className="btn-notice-action">
              Pelajari Paket
            </button>
          </section>
        )}

        {/* 7. ACCOUNT STATUS FOOTNOTE */}
        <footer className="journal-footer">
          <div className="footer-credits">
            <span>Saldo AI Credits: <strong>{userCredits}</strong></span>
            <span className="dot-divider">·</span>
            <span>Paket: <strong>{isPro ? 'Pro Member' : isGlow ? 'Glow Member' : 'Akun Standar'}</strong></span>
          </div>
          <button onClick={() => navigate('/pricing')} className="footer-link">
            Kelola paket langganan
          </button>
        </footer>
      </div>

      {/* SCOPED STYLES: Anti-AI-Slop Editorial Aesthetics */}
      <style>{`
        .journal-page {
          width: 100%;
          min-height: calc(100vh - var(--nav-height, 64px));
          background: var(--color-canvas);
          color: var(--color-ink);
        }

        .journal-container {
          max-width: 740px;
          margin: 0 auto;
          padding: var(--space-xl) var(--space-md) var(--space-3xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        /* ALERT BANNER */
        .journal-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-status-attention-soft);
          border: 1px solid rgba(184, 135, 79, 0.25);
          border-radius: var(--radius);
          font-size: 13.5px;
          color: var(--color-status-attention);
        }
        .alert-content {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }
        .alert-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        .btn-alert-link {
          background: none;
          border: none;
          font-weight: 600;
          font-size: 13px;
          color: var(--color-status-attention);
          cursor: pointer;
          text-decoration: underline;
        }
        .btn-alert-close {
          background: none;
          border: none;
          color: var(--color-status-attention);
          cursor: pointer;
          opacity: 0.7;
          display: flex;
        }
        .btn-alert-close:hover { opacity: 1; }

        /* HEADER */
        .journal-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .journal-date {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-ink-muted);
          letter-spacing: 0.02em;
        }
        .journal-greeting {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 500;
          color: var(--color-ink);
          line-height: 1.25;
          margin: 0;
        }
        .journal-sub {
          font-size: 15px;
          color: var(--color-ink-soft);
          margin: 0;
          line-height: 1.5;
        }

        /* HERO ASSESSMENT SURFACE */
        .journal-hero-surface {
          background: var(--color-surface);
          border: var(--hairline);
          border-radius: var(--radius-lg);
          padding: 28px;
          box-shadow: var(--shadow-card);
        }

        .assessment-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .eyebrow-label {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--color-ink-muted);
          text-transform: uppercase;
        }

        .assessment-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .status-pill {
          font-size: 12.5px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          background: var(--color-surface-muted);
          color: var(--color-ink-soft);
        }
        .status-pill.status-improving {
          background: var(--color-status-optimal-soft);
          color: var(--color-status-optimal);
        }
        .status-pill.status-attention {
          background: var(--color-status-attention-soft);
          color: var(--color-status-attention);
        }

        .assessment-score-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .score-number {
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 500;
          color: var(--color-ink);
          line-height: 1;
        }
        .score-denom {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--color-ink-muted);
        }
        .score-caption {
          margin-left: 8px;
          font-size: 16px;
          font-weight: 500;
          color: var(--color-teal);
        }

        .assessment-notes {
          font-size: 15px;
          color: var(--color-ink-soft);
          line-height: 1.6;
          margin: 0;
        }

        .assessment-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: var(--hairline);
        }
        .footer-meta {
          font-size: 13px;
          color: var(--color-ink-muted);
        }
        .text-action-link {
          background: none;
          border: none;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-teal);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0;
        }
        .text-action-link:hover {
          opacity: 0.8;
        }

        /* COLD START HERO */
        .cold-start-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cold-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 500;
          color: var(--color-ink);
          margin: 0;
        }
        .cold-desc {
          font-size: 15px;
          color: var(--color-ink-soft);
          line-height: 1.6;
          margin: 0 0 8px;
        }
        .cold-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        /* QUICK ACTIONS */
        .journal-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }
        .action-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }
        .action-pill-btn.primary {
          background: var(--color-teal);
          color: #ffffff;
        }
        .action-pill-btn.primary:hover {
          background: var(--color-teal-hover);
        }
        .action-pill-btn.secondary {
          background: var(--color-surface);
          border: var(--hairline);
          color: var(--color-ink);
        }
        .action-pill-btn.secondary:hover {
          background: var(--color-surface-muted);
        }
        .action-pill-btn.ghost {
          background: transparent;
          color: var(--color-ink-soft);
        }
        .action-pill-btn.ghost:hover {
          background: var(--color-surface-muted);
          color: var(--color-ink);
        }

        /* OBSERVATIONS SECTION */
        .journal-observations {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 500;
          color: var(--color-ink);
          margin: 0;
        }
        .observation-list {
          display: flex;
          flex-direction: column;
          background: var(--color-surface);
          border: var(--hairline);
          border-radius: var(--radius-lg);
          padding: 4px 20px;
        }
        .observation-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          font-size: 14.5px;
        }
        .observation-item:not(:last-child) {
          border-bottom: var(--hairline);
        }
        .obs-label {
          color: var(--color-ink-muted);
        }
        .obs-value {
          color: var(--color-ink);
          font-weight: 500;
        }

        /* RECENT ACTIVITY */
        .journal-activity {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-link {
          background: none;
          border: none;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--color-teal);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .section-link:hover { opacity: 0.8; }

        .activity-list {
          display: flex;
          flex-direction: column;
          background: var(--color-surface);
          border: var(--hairline);
          border-radius: var(--radius-lg);
          padding: 4px 20px;
        }
        .activity-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 14px 0;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .activity-row:hover { opacity: 0.8; }
        .activity-row:not(:last-child) {
          border-bottom: var(--hairline);
        }
        .activity-date {
          width: 90px;
          font-size: 13px;
          color: var(--color-ink-muted);
          flex-shrink: 0;
        }
        .activity-main {
          flex: 1;
          min-width: 0;
        }
        .activity-title {
          font-size: 14.5px;
          font-weight: 500;
          color: var(--color-ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .activity-kind {
          font-size: 12.5px;
          color: var(--color-ink-muted);
        }
        .activity-badge {
          font-size: 12.5px;
          font-weight: 500;
          color: var(--color-status-optimal);
          background: var(--color-status-optimal-soft);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .empty-log-state {
          padding: 24px;
          text-align: center;
          background: var(--color-surface);
          border: var(--hairline);
          border-radius: var(--radius-lg);
          color: var(--color-ink-muted);
          font-size: 14px;
        }
        .empty-hint {
          font-size: 13px;
          margin-top: 4px;
        }

        /* UPGRADE NOTICE */
        .journal-upgrade-notice {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 18px 20px;
          background: var(--color-peach-soft);
          border: 1px solid rgba(232, 168, 124, 0.35);
          border-radius: var(--radius-lg);
        }
        .notice-icon {
          color: var(--color-peach);
          flex-shrink: 0;
        }
        .notice-body {
          flex: 1;
          min-width: 0;
        }
        .notice-title {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0 0 2px;
        }
        .notice-desc {
          font-size: 13px;
          color: var(--color-ink-soft);
          margin: 0;
          line-height: 1.4;
        }
        .btn-notice-action {
          padding: 8px 14px;
          background: var(--color-teal);
          color: #ffffff;
          border: none;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
        }
        .btn-notice-action:hover {
          background: var(--color-teal-hover);
        }

        /* FOOTNOTE */
        .journal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: var(--space-lg);
          border-top: var(--hairline);
          font-size: 13.5px;
          color: var(--color-ink-muted);
        }
        .dot-divider {
          margin: 0 8px;
        }
        .footer-link {
          background: none;
          border: none;
          color: var(--color-teal);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
        }
        .footer-link:hover { opacity: 0.8; }

        @media (max-width: 640px) {
          .journal-container {
            padding: var(--space-lg) var(--space-sm) var(--space-2xl);
            gap: var(--space-lg);
          }
          .assessment-score-row {
            flex-wrap: wrap;
          }
          .score-number {
            font-size: 44px;
          }
          .journal-greeting {
            font-size: 26px;
          }
          .cold-actions, .journal-quick-actions {
            flex-direction: column;
            width: 100%;
          }
          .action-pill-btn {
            width: 100%;
            justify-content: center;
          }
          .journal-upgrade-notice {
            flex-direction: column;
            align-items: flex-start;
          }
          .journal-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}

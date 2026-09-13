// src/pages/app/DashboardPage.tsx
// Skincluv Design System Harmonized Dashboard (Clean Inter Typography, #0f6784 Brand Palette & Responsive Layout)

import { useNavigate } from 'react-router-dom'
import {
  ScanFace,
  MessageSquare,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { coinBalance, subscription } = useAuthStore()

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const userCredits = coinBalance?.balance ?? 0

  return (
    <div className="skincluv-dashboard-grid">
      {/* 1. STATUS HERO BANNER */}
      <div className="status-hero">
        <div className="hero-pattern-dots" />
        <div className="hero-top-row">
          <div className="hero-label">SKOR KULIT KAMU</div>
          <div className="hero-trend-badge">
            <TrendingUp size={13} />
            <span>+4 minggu ini</span>
          </div>
        </div>
        <div className="hero-score-group">
          <span className="hero-score-num">82</span>
          <span className="hero-score-sub">/ 100 — Sangat Sehat</span>
        </div>
        <p className="hero-description">
          Kelembaban kulit Anda stabil. Tekstur T-zone masih perlu perhatian ekstra minggu ini.
        </p>
      </div>

      {/* 2. QUICK ACTIONS ROW */}
      <div className="actions-row">
        <div className="action-card card-face-scan" onClick={() => navigate('/face-scan')}>
          <div className="action-icon-box purple">
            <ScanFace size={22} />
          </div>
          <div className="action-meta">
            <h3 className="action-title">Face Scan AI</h3>
            <p className="action-sub">Analisis kondisi kulit wajah terbaru</p>
          </div>
        </div>

        <div className="action-card card-skinsistant" onClick={() => navigate('/chatbot')}>
          <div className="action-icon-box teal">
            <MessageSquare size={22} />
          </div>
          <div className="action-meta">
            <h3 className="action-title">Skinsistant AI</h3>
            <p className="action-sub">Konsultasi bahan & keluhan kulit</p>
          </div>
        </div>
      </div>

      {/* 3. RETENTION / PROGRESS STRIP */}
      <div className="retention-section">
        <div className="section-header-title">PROGRES KULIT KAMU</div>
        <div className="retention-strip">
          <div className="retention-card">
            <div className="r-num">7 Hari</div>
            <div className="r-cap streak">Streak Aktif 🔥</div>
          </div>
          <div className="retention-card">
            <div className="r-num">14</div>
            <div className="r-cap">Total Scan</div>
          </div>
          <div className="retention-card">
            <div className="r-num">2 / 5</div>
            <div className="r-cap">Misi Glow Minggu Ini</div>
          </div>
          <div className="retention-card">
            <div className="r-num">8</div>
            <div className="r-cap">Produk di Rak Virtual</div>
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
        </div>

        <div className="side-card">
          <div className="side-title mb-2">DAILY INSIGHT</div>
          <p className="side-text">
            Pastikan selalu memakai sunscreen SPF 30 setiap 3 jam saat beraktivitas di luar ruangan.
          </p>
        </div>

        <div className="side-card">
          <div className="side-card-header">
            <span className="side-title">INDEKS UV HARI INI</span>
            <span className="side-badge badge-warning">Sedang (UV 4)</span>
          </div>
          <p className="side-text">Disarankan memakai pelembab ber-SPF saat keluar rumah.</p>
        </div>
      </div>

      {/* 5. PROMO UPGRADE CARD */}
      <div className="promo-banner-card">
        <div className="promo-meta">
          <div className="promo-title-row">
            <Sparkles size={16} className="text-amber-300" />
            <b className="promo-title">Langganan Skincluv PRO</b>
          </div>
          <p className="promo-sub">Buka akses AI melimpah & konsultasi Dermatologist tanpa batas</p>
        </div>
        <button onClick={() => navigate('/pricing')} className="promo-action-btn">
          Upgrade Sekarang
        </button>
      </div>

      {/* 6. RECENT HISTORY SECTION */}
      <div className="history-section">
        <div className="section-header-title">RIWAYAT SCAN TERBARU</div>
        <div className="history-card-container">
          <div className="history-item-row">
            <div className="h-date">8 Agu</div>
            <div className="h-type-title">Scan Wajah AI</div>
            <div className="h-detail-result">Kombinasi (T-Zone berminyak)</div>
            <span className="h-status-badge badge-optimal">Optimal</span>
          </div>

          <div className="history-item-row">
            <div className="h-date">5 Agu</div>
            <div className="h-type-title">Scan Ingredient</div>
            <div className="h-detail-result">Brightening Serum (aman)</div>
            <span className="h-status-badge badge-healthy">Sehat</span>
          </div>

          <div className="history-item-row">
            <div className="h-date">1 Agu</div>
            <div className="h-type-title">Scan Wajah AI</div>
            <div className="h-detail-result">Kemerahan pipi ringan</div>
            <span className="h-status-badge badge-attention">Perlu Perhatian</span>
          </div>
        </div>
      </div>

      {/* PURE VANILLA CSS STYLING MATCHING SKINCLUV DESIGN SYSTEM */}
      <style>{`
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
          font-family: 'Inter', sans-serif;
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
          background: linear-gradient(135deg, #0f6784 0%, #0b4f5c 100%);
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

        .hero-pattern-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px);
          background-size: 16px 16px;
        }

        .hero-top-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
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
          gap: 4px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #86efac;
        }

        .hero-score-group {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin: 12px 0 6px;
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

        /* 2. ACTIONS ROW */
        .actions-row {
          grid-area: actions;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .action-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
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
          width: 40px;
          height: 40px;
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

        .action-icon-box.teal {
          background: #eaf4fa;
          color: #0f6784;
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
          line-height: 1.4;
          margin: 0;
          word-break: break-word;
        }

        /* 3. RETENTION SECTION */
        .retention-section {
          grid-area: retention;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .retention-strip {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
          width: 100%;
          box-sizing: border-box;
        }

        .retention-strip::-webkit-scrollbar {
          display: none;
        }

        .retention-card {
          flex: 0 0 auto;
          min-width: 120px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 16px;
          box-sizing: border-box;
        }

        .r-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }

        .r-cap {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
        }

        .r-cap.streak {
          color: #15803d;
          font-weight: 700;
        }

        /* 4. SIDE RAIL SECTION */
        .side-rail-section {
          grid-area: side;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        @media (max-width: 899px) {
          .side-rail-section {
            display: none !important;
          }
        }

        .side-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-sizing: border-box;
        }

        .side-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .side-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .side-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
        }

        .side-badge.badge-free {
          background: #eaf4fa;
          color: #0f6784;
        }

        .side-badge.badge-pro {
          background: #fef3c7;
          color: #b45309;
        }

        .side-badge.badge-warning {
          background: #ffedd5;
          color: #c2410c;
        }

        .side-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }

        .side-text {
          font-size: 0.8125rem;
          line-height: 1.5;
          color: #475569;
          margin: 0;
        }

        /* 5. PROMO BANNER CARD */
        .promo-banner-card {
          grid-area: promo;
          background: linear-gradient(135deg, #0f6784 0%, #0369a1 100%);
          border-radius: 16px;
          padding: 18px 20px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
          box-shadow: 0 4px 14px rgba(15, 103, 132, 0.2);
        }

        .promo-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .promo-title {
          font-size: 0.9375rem;
          color: #ffffff;
        }

        .promo-sub {
          font-size: 0.75rem;
          color: #e0f2fe;
          margin: 0;
        }

        .promo-action-btn {
          background: #ffffff;
          color: #0f6784;
          font-size: 0.8125rem;
          font-weight: 700;
          border: none;
          border-radius: 9999px;
          padding: 8px 18px;
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .promo-action-btn:hover {
          transform: scale(1.04);
        }

        /* 6. RECENT HISTORY SECTION */
        .history-section {
          grid-area: history;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .history-card-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .history-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 16px;
          width: 100%;
          box-sizing: border-box;
        }

        .h-date {
          font-size: 0.75rem;
          color: #64748b;
          width: 50px;
          flex-shrink: 0;
        }

        .h-type-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }

        .h-detail-result {
          font-size: 0.8125rem;
          color: #64748b;
          display: none;
        }

        .h-status-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          flex-shrink: 0;
        }

        .h-status-badge.badge-optimal {
          background: #dcfce7;
          color: #15803d;
        }

        .h-status-badge.badge-healthy {
          background: #e0f2fe;
          color: #0369a1;
        }

        .h-status-badge.badge-attention {
          background: #ffedd5;
          color: #c2410c;
        }

        /* DESKTOP BREAKPOINT (>= 900px) */
        @media (min-width: 900px) {
          .skincluv-dashboard-grid {
            grid-template-columns: 1fr 1fr 320px;
            grid-template-areas:
              "hero    hero    side"
              "actions actions side"
              "retention retention side"
              "promo   history history";
            gap: 20px;
          }

          .status-hero {
            padding: 32px;
          }

          .hero-score-num {
            font-size: 3.75rem;
          }

          .actions-row {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .action-card {
            padding: 20px;
            gap: 12px;
          }

          .history-card-container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 8px 16px;
            gap: 0;
          }

          .history-item-row {
            border: none;
            border-bottom: 1px solid #f1f5f9;
            border-radius: 0;
            padding: 14px 0;
          }

          .history-item-row:last-child {
            border-bottom: none;
          }

          .h-detail-result {
            display: block;
            flex: 1;
            margin: 0 16px;
          }

          .promo-banner-card {
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
          }

          .promo-action-btn {
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  )
}

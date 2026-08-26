// src/pages/app/DashboardPage.tsx
// 100% Faithful Port of Claude's Dashboard Page — Pure Vanilla CSS & Mobile Optimized Cards

import { useNavigate } from 'react-router-dom'
import {
  ScanFace,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium } from '@/utils/subscriptionHelpers'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { coinBalance, subscription } = useAuthStore()

  const isPro = isActivePremium(subscription)
  const userCoins = coinBalance?.balance ?? 100

  return (
    <div className="content">
      {/* 1. STATUS HERO CARD */}
      <div className="status-hero">
        <div className="dots" />
        <div className="status-top">
          <div className="status-label">SKOR KULIT KAMU</div>
          <div className="trend-chip">
            <TrendingUp size={12} />
            <span>↑ +4 minggu ini</span>
          </div>
        </div>
        <div className="status-score">
          <b>82</b>
          <span>/ 100 — Sangat Sehat</span>
        </div>
        <p className="status-note">
          Kelembaban stabil. Tekstur T-zone masih perlu perhatian ekstra minggu ini.
        </p>
      </div>

      {/* 2. ACTIONS ROW */}
      <div className="actions-row">
        <div className="card action-card" onClick={() => navigate('/face-scan')}>
          <div className="action-icon purple">
            <ScanFace size={20} />
          </div>
          <div className="action-title">Face Scan</div>
          <div className="action-sub">Analisis kondisi kulit terbaru</div>
        </div>
        <div className="card action-card" onClick={() => navigate('/chatbot')}>
          <div className="action-icon teal">
            <MessageSquare size={20} />
          </div>
          <div className="action-title">Skinsistant</div>
          <div className="action-sub">Tanya AI soal bahan & keluhan</div>
        </div>
      </div>

      {/* 3. RETENTION STRIP */}
      <div className="retention">
        <div className="section-label">PROGRES KAMU</div>
        <div className="retention-strip">
          <div className="card r-card">
            <div className="r-num">7 hari</div>
            <div className="r-cap up">Streak aktif 🔥</div>
          </div>
          <div className="card r-card">
            <div className="r-num">14</div>
            <div className="r-cap">Total scan</div>
          </div>
          <div className="card r-card">
            <div className="r-num">2/5</div>
            <div className="r-cap">Misi Glow minggu ini</div>
          </div>
          <div className="card r-card">
            <div className="r-num">8</div>
            <div className="r-cap">Produk di rak</div>
          </div>
        </div>
      </div>

      {/* 4. SIDE RAIL CARDS */}
      <div className="side">
        <div className="card">
          <div className="side-row">
            <span className="side-title">SALDO SKIN COIN</span>
            <span className="badge free">
              {isPro ? 'Pro Member' : 'Free Account'}
            </span>
          </div>
          <div className="wallet-num">{isPro ? 'Pro' : userCoins}</div>
        </div>
        <div className="card">
          <div className="side-title" style={{ marginBottom: '8px' }}>
            DAILY INSIGHT
          </div>
          <p className="insight-text">
            Pastikan selalu memakai sunscreen SPF 30 setiap 3 jam saat beraktivitas di luar ruangan.
          </p>
        </div>
        <div className="card">
          <div className="side-row">
            <span className="side-title">INDEKS UV HARI INI</span>
            <span className="badge uv">Sedang (UV 4)</span>
          </div>
          <p className="insight-text">Disarankan pakai pelembab ber-SPF saat keluar rumah.</p>
        </div>
      </div>

      {/* 5. PROMO BANNER CARD */}
      <div className="card promo">
        <div className="promo-text">
          <b>Langganan Premium Rp30.000</b>
          <span>Dapat +10.000 koin instan & akses AI tanpa batas</span>
        </div>
        <button onClick={() => navigate('/pricing')} className="promo-btn">
          Upgrade
        </button>
      </div>

      {/* 6. RECENT HISTORY CARD */}
      <div className="history-wrapper">
        <div className="section-label">RIWAYAT TERBARU</div>
        <div className="history-list">
          <div className="history-row-card">
            <div className="h-left">
              <span className="h-date">8 Agu</span>
              <span className="h-type">Scan Wajah AI</span>
            </div>
            <span className="h-result">Kombinasi (T-Zone berminyak)</span>
            <span className="h-badge ok">Optimal</span>
          </div>
          <div className="history-row-card">
            <div className="h-left">
              <span className="h-date">5 Agu</span>
              <span className="h-type">Scan Ingredient</span>
            </div>
            <span className="h-result">Brightening Serum (aman)</span>
            <span className="h-badge ok">Sehat</span>
          </div>
          <div className="history-row-card">
            <div className="h-left">
              <span className="h-date">1 Agu</span>
              <span className="h-type">Scan Wajah AI</span>
            </div>
            <span className="h-result">Kemerahan pipi ringan</span>
            <span className="h-badge warn">Perlu perhatian</span>
          </div>
        </div>
      </div>

      {/* PURE VANILLA CSS STYLING FROM CLAUDE */}
      <style>{`
        .content {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-areas:
            "hero"
            "actions"
            "retention"
            "side"
            "promo"
            "history";
          gap: 14px;
        }

        .card {
          background: #ffffff;
          border: 1px solid var(--line, rgba(10,62,72,0.10));
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-soft, #5C6B6B);
          letter-spacing: 0.04em;
          margin-bottom: 10px;
        }

        /* STATUS HERO */
        .status-hero {
          grid-area: hero;
          background: var(--teal-800, #0B4F5C);
          border-radius: 20px;
          padding: 22px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .status-hero .dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 14px 14px;
        }

        .status-top {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .status-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--teal-100, #DCEEEA);
        }

        .trend-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.14);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #8CF0C7;
        }

        .status-score {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 10px 0 6px;
        }

        .status-score b {
          font-family: 'Fraunces', serif;
          font-size: 44px;
          font-weight: 600;
        }

        .status-score span {
          font-size: 15px;
          color: var(--teal-100, #DCEEEA);
        }

        .status-note {
          position: relative;
          z-index: 1;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--teal-100, #DCEEEA);
          max-width: 420px;
          margin: 0;
        }

        /* ACTIONS */
        .actions-row {
          grid-area: actions;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .action-card:hover {
          transform: translateY(-2px);
          border-color: var(--teal-700, #126575);
        }

        .action-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-icon.purple {
          background: #EEEDFE;
          color: #534AB7;
        }

        .action-icon.teal {
          background: var(--teal-100, #DCEEEA);
          color: var(--teal-800, #0B4F5C);
        }

        .action-title {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--ink, #1A2B2B);
        }

        .action-sub {
          font-size: 12px;
          color: var(--ink-soft, #5C6B6B);
          line-height: 1.4;
        }

        /* RETENTION STRIP */
        .retention {
          grid-area: retention;
        }

        .retention-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .r-card {
          flex: 0 0 auto;
          min-width: 118px;
        }

        .r-num {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--ink, #1A2B2B);
        }

        .r-cap {
          font-size: 11.5px;
          color: var(--ink-soft, #5C6B6B);
          margin-top: 2px;
        }

        .r-cap.up {
          color: #3B6D11;
          font-weight: 600;
        }

        /* SIDE RAIL */
        .side {
          grid-area: side;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .side-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .side-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--ink-soft, #5C6B6B);
        }

        .badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
        }

        .badge.free {
          background: var(--teal-100, #DCEEEA);
          color: var(--teal-800, #0B4F5C);
        }

        .badge.uv {
          background: #FAEEDA;
          color: #854F0B;
        }

        .wallet-num {
          font-family: 'Fraunces', serif;
          font-size: 24px;
          font-weight: 600;
          color: var(--ink, #1A2B2B);
        }

        .insight-text {
          font-size: 13px;
          line-height: 1.55;
          color: var(--ink-soft, #5C6B6B);
          margin: 0;
        }

        /* PROMO BANNER */
        .promo {
          grid-area: promo;
          background: linear-gradient(120deg, #E8A87C, #D4813F);
          border-radius: 16px;
          padding: 16px 18px;
          color: #4A1B0C;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: none;
        }

        .promo-text b {
          display: block;
          font-size: 14.5px;
          margin-bottom: 2px;
        }

        .promo-text span {
          font-size: 12px;
          opacity: 0.85;
        }

        .promo-btn {
          background: #ffffff;
          color: var(--peach-dark, #B96A3D);
          font-size: 12.5px;
          font-weight: 700;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .promo-btn:hover {
          transform: scale(1.05);
        }

        /* HISTORY WRAPPER & MOBILE CARDS */
        .history-wrapper {
          grid-area: history;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-row-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid var(--line, rgba(10,62,72,0.10));
          border-radius: 14px;
          padding: 12px 14px;
        }

        .h-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .h-date {
          font-size: 11.5px;
          color: var(--ink-soft, #5C6B6B);
          width: 52px;
        }

        .h-type {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink, #1A2B2B);
        }

        .h-result {
          font-size: 12.5px;
          color: var(--ink-soft, #5C6B6B);
          display: none;
        }

        .h-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: 20px;
        }

        .h-badge.ok {
          background: #EAF3DE;
          color: #3B6D11;
        }

        .h-badge.warn {
          background: #FAEEDA;
          color: #854F0B;
        }

        /* DESKTOP BREAKPOINT (>= 900px) */
        @media (min-width: 900px) {
          .content {
            grid-template-columns: 1fr 1fr 320px;
            grid-template-areas:
              "hero    hero    side"
              "actions actions side"
              "retention retention side"
              "promo   history history";
            gap: 18px;
          }
          .status-hero {
            padding: 32px;
          }
          .status-score b {
            font-size: 56px;
          }
          .actions-row {
            grid-template-columns: 1fr 1fr;
          }
          .action-card {
            padding: 20px;
          }
          .side {
            align-content: start;
          }
          .history-list {
            background: #ffffff;
            border: 1px solid var(--line, rgba(10,62,72,0.10));
            border-radius: 16px;
            padding: 8px 16px;
            gap: 0;
          }
          .history-row-card {
            border: none;
            border-bottom: 1px solid var(--line, rgba(10,62,72,0.10));
            border-radius: 0;
            padding: 14px 0;
          }
          .history-row-card:last-child {
            border-bottom: none;
          }
          .h-result {
            display: block;
            flex: 1;
            margin: 0 16px;
          }
          .promo {
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
          }
          .promo-btn {
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  )
}

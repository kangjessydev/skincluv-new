// src/pages/app/DashboardPage.tsx
// 100% Faithful Port of scan-2 Dashboard UI for Skincluv — Vanilla CSS Design System

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ScanFace,
  FlaskConical,
  MessageCircle,
  BarChart3,
  Package,
  Calendar,
  Sparkles,
  Store,
  Coins,
  TrendingUp,
  ArrowRight,
  History,
  Lightbulb,
  Sun,
  Flame,
  Camera,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'

interface RecentScanItem {
  id: string
  date: string
  type: string
  result: string
  status: string
  badgeClass: string
}

export default function DashboardPage() {
  const { profile, activeSkinProfile, coinBalance, subscription } = useAuthStore()
  const navigate = useNavigate()

  const [totalAnalysesCount, setTotalAnalysesCount] = useState<number>(14)
  const isPro = isActivePremium(subscription)
  const userCoins = coinBalance?.balance ?? 100

  // Calculate dynamic skin score or fallback to 82
  const skinScore = activeSkinProfile
    ? Math.min(100, Math.max(50, 100 - (activeSkinProfile.concerns?.length || 0) * 6))
    : 82

  // Query actual total analysis count from Supabase
  useEffect(() => {
    if (!profile?.id) return

    const fetchAnalysisCount = async () => {
      try {
        const { data } = await supabase
          .from('quota_usage')
          .select('used_count')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (data && typeof data.used_count === 'number') {
          setTotalAnalysesCount(Math.max(14, data.used_count))
        }
      } catch (err) {
        console.error('[DashboardPage] Error fetching analysis count:', err)
      }
    }

    fetchAnalysisCount()
  }, [profile?.id])

  const recentScans: RecentScanItem[] = [
    {
      id: '1',
      date: '8 Agu 2026',
      type: 'Scan Wajah AI',
      result: activeSkinProfile ? `${activeSkinProfile.skin_type || 'Kombinasi'} (T-Zone Berminyak)` : 'Kombinasi (T-Zone Berminyak)',
      status: 'Optimal',
      badgeClass: 'badge-optimal',
    },
    {
      id: '2',
      date: '5 Agu 2026',
      type: 'Scan Ingredient',
      result: 'Brightening Serum (Aman)',
      status: 'Sehat',
      badgeClass: 'badge-sehat',
    },
    {
      id: '3',
      date: '1 Agu 2026',
      type: 'Scan Wajah AI',
      result: 'Kemerahan Pipi Ringan',
      status: 'Perlu Perhatian',
      badgeClass: 'badge-perhatian',
    },
  ]

  return (
    <div className="dashboard-scan2-root">
      {/* ============================================================ */}
      {/* 📱 MOBILE ONLY VIEW (md:hidden)                             */}
      {/* ============================================================ */}
      <div className="mobile-dashboard-layout">
        {/* Banner Notice Claim Coin */}
        <div className="mobile-claim-banner">
          <div className="banner-left-content">
            <div className="coin-glow-box">
              <Coins size={22} className="text-amber-300" />
            </div>
            <div>
              <p className="banner-title">Bonus 100 Skin Coin Gratis!</p>
              <p className="banner-subtitle">Klaim hadiah koin pengguna baru Anda.</p>
            </div>
          </div>
          <Link to="/missions" className="btn-claim-pill">
            Klaim
          </Link>
        </div>

        {/* Unified SkinScore & Coin Card Mobile */}
        <div className="mobile-unified-card">
          <div className="card-score-box">
            <span className="card-kicker-sm">Skor Kulit Kamu</span>
            <div className="score-number-row">
              <span className="score-num-big">{skinScore}</span>
              <span className="score-num-denom">/ 100</span>
            </div>
            <p className="score-trend-text">
              <TrendingUp size={12} /> +4 Poin Minggu Ini
            </p>
          </div>

          <div className="card-vertical-divider" />

          <div className="card-coin-box">
            <span className="card-kicker-sm">Saldo Skin Coin</span>
            <div className="coin-number-row">
              <Coins size={18} className="text-amber-500" />
              <span>{userCoins.toLocaleString()}</span>
            </div>
            <Link to="/pricing" className="topup-link">
              + Topup Koin
            </Link>
          </div>
        </div>

        {/* Gojek-Style 4-Column Feature Grid (Mobile) */}
        <div className="mobile-services-section">
          <h2 className="services-kicker">Layanan & Analisis AI</h2>
          <div className="gojek-services-grid">
            <Link to="/face-scan" className="service-tile tile-violet">
              <div className="tile-icon-avatar bg-violet-50 text-violet-600">
                <ScanFace size={24} />
              </div>
              <span className="tile-title">Scan Wajah</span>
            </Link>

            <Link to="/ingredient-scan" className="service-tile tile-amber">
              <div className="tile-icon-avatar bg-amber-50 text-amber-600">
                <FlaskConical size={24} />
              </div>
              <span className="tile-title">Ingredient</span>
            </Link>

            <Link to="/chatbot" className="service-tile tile-indigo">
              <div className="tile-icon-avatar bg-indigo-50 text-indigo-600">
                <MessageCircle size={24} />
              </div>
              <span className="tile-title">Skinsistant</span>
            </Link>

            <Link to="/profile" className="service-tile tile-sky">
              <div className="tile-icon-avatar bg-sky-50 text-sky-700">
                <BarChart3 size={24} />
              </div>
              <span className="tile-title">Insight</span>
            </Link>

            <div className="service-tile tile-teal">
              <div className="tile-icon-avatar bg-teal-50 text-teal-600">
                <Package size={24} />
              </div>
              <span className="tile-title">Rak Skincare</span>
            </div>

            <div className="service-tile tile-blue">
              <div className="tile-icon-avatar bg-blue-50 text-blue-600">
                <Calendar size={24} />
              </div>
              <span className="tile-title">Rutinitas</span>
            </div>

            <Link to="/missions" className="service-tile tile-orange">
              <div className="tile-icon-avatar bg-orange-50 text-orange-600">
                <Sparkles size={24} />
              </div>
              <span className="tile-title">Misi Glow</span>
            </Link>

            <Link to="/pricing" className="service-tile tile-rose">
              <div className="tile-icon-avatar bg-rose-50 text-rose-600">
                <Store size={24} />
              </div>
              <span className="tile-title">SkinShop</span>
            </Link>
          </div>
        </div>

        {/* Promo Horizontal Banner Mobile */}
        <div className="mobile-promo-banner">
          <div>
            <span className="promo-tag font-extrabold">PROMO SPESIAL</span>
            <p className="promo-title">Langganan Premium Rp 30.000</p>
            <p className="promo-desc">Dapatkan +10.000 Koin FUP Jumbo instan!</p>
          </div>
          <Link to="/pricing" className="btn-promo-upgrade">
            Upgrade
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🖥️ DESKTOP ONLY VIEW (hidden md:grid - 12 Columns Grid)     */}
      {/* ============================================================ */}
      <div className="desktop-dashboard-layout">
        {/* TOP HERO & SIDEBAR ROW */}
        <div className="desktop-top-row">
          {/* Science Lab Hero Banner (8 Columns) */}
          <div className="science-hero-banner">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"
              alt="Science Lab"
              className="hero-bg-img"
            />
            <div className="hero-gradient-overlay" />

            <div className="hero-content">
              <span className="lab-pill-badge">
                <FlaskConical size={14} />
                Laboratorium AI SkinCluv
              </span>

              <h1 className="hero-main-title">
                Analisis Kulit Presisi Berbasis Kecerdasan Buatan
              </h1>

              <p className="hero-subtext">
                Skinsistant menganalisis faktor kelembaban, tekstur, hingga kompatibilitas bahan kosmetik Anda dengan akurasi klinis tinggi.
              </p>

              <div className="hero-cta-buttons">
                <button onClick={() => navigate('/face-scan')} className="btn-hero-primary">
                  <Camera size={18} />
                  <span>Mulai Scan Wajah AI</span>
                </button>
                <button onClick={() => navigate('/ingredient-scan')} className="btn-hero-secondary">
                  <FlaskConical size={18} />
                  <span>Scan Ingredient</span>
                </button>
              </div>
            </div>

            {/* Score Gauge Circle Badge Floating Top Right */}
            <div className="score-gauge-badge">
              <div className="gauge-ring-box">
                <svg className="gauge-svg">
                  <circle cx="50%" cy="50%" r="42%" className="stroke-white-20" strokeWidth="6" fill="none" />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    className="stroke-emerald-400"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="150"
                    strokeDashoffset="28"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="gauge-score-num">{skinScore}</span>
              </div>
              <div>
                <p className="gauge-label">Skor Kulit</p>
                <p className="gauge-status">Sangat Sehat</p>
              </div>
            </div>
          </div>

          {/* Sidebar Desktop Stats & Quick Action (4 Columns) */}
          <div className="desktop-sidebar-col">
            {/* Wallet Card */}
            <div className="desktop-wallet-card">
              <div className="wallet-header">
                <span className="wallet-title">Saldo Dompet Saya</span>
                <span className={`wallet-status-tag ${isPro ? 'status-pro' : 'status-free'}`}>
                  {isPro ? 'Premium (Pro)' : 'Free Account'}
                </span>
              </div>

              <div className="wallet-balance-row">
                <Coins size={28} className="text-amber-500" />
                <span className="balance-big-num">{userCoins.toLocaleString()}</span>
                <span className="balance-unit">Skin Coin</span>
              </div>

              <Link to="/pricing" className="btn-topup-block">
                + Topup & Langganan Premium
              </Link>
            </div>

            {/* Asisten Virtual Skinsistant Card */}
            <div className="desktop-assistant-card">
              <div className="assistant-header">
                <MessageCircle size={16} className="text-teal-200" />
                <span>Asisten Virtual Skinsistant</span>
              </div>
              <p className="assistant-desc">
                Punya pertanyaan mengenai bahan aktif skincare Anda? Konsultasikan langsung dengan AI kami.
              </p>
              <Link to="/chatbot" className="btn-assistant-chat">
                <span>Buka Chat AI</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* KPI STATS ROW DESKTOP (3 Cards) */}
        <div className="kpi-stats-grid">
          <div className="kpi-card">
            <div>
              <p className="kpi-label">Total Analisis Selesai</p>
              <p className="kpi-value">{totalAnalysesCount} Scan</p>
              <p className="kpi-subtext text-emerald-600">↑ +3 Scan Minggu Ini</p>
            </div>
            <div className="kpi-icon-avatar bg-violet-50 text-violet-600">
              <FlaskConical size={24} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <p className="kpi-label">Streak Perawatan Harian</p>
              <p className="kpi-value">7 Hari</p>
              <p className="kpi-subtext text-amber-600">Pertahankan konsistensi!</p>
            </div>
            <div className="kpi-icon-avatar bg-amber-50 text-amber-600">
              <Flame size={24} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <p className="kpi-label">Koleksi Rak Skincare</p>
              <p className="kpi-value">8 Produk</p>
              <p className="kpi-subtext text-sky-600">1 Produk mendekati kedaluwarsa</p>
            </div>
            <div className="kpi-icon-avatar bg-teal-50 text-teal-600">
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* LOWER ROW: RECENT SCANS TABLE & SIDEBAR INSIGHT */}
        <div className="desktop-lower-row">
          {/* Tabel Riwayat Analisis Terbaru (8 Columns) */}
          <div className="table-bento-card">
            <div className="table-header-row">
              <h2 className="table-card-title">
                <History size={20} className="text-[#0f6784]" />
                Riwayat Analisis Terbaru
              </h2>
              <Link to="/profile" className="table-see-all">
                Lihat Semua Insight <ArrowRight size={14} className="inline" />
              </Link>
            </div>

            <div className="table-scroll-wrapper">
              <table className="scan2-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jenis Analisis</th>
                    <th>Hasil AI</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan) => (
                    <tr key={scan.id}>
                      <td className="font-mono text-date">{scan.date}</td>
                      <td className="font-type">{scan.type}</td>
                      <td className="text-result">{scan.result}</td>
                      <td className="text-right">
                        <span className={`table-status-badge ${scan.badgeClass}`}>
                          {scan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Right: Daily Insight & UV Index (4 Columns) */}
          <div className="desktop-insight-sidebar">
            <div className="insight-card">
              <h3 className="insight-title">
                <Lightbulb size={16} className="text-amber-500" />
                Daily Insight Hari Ini
              </h3>
              <p className="insight-quote">
                &quot;Pastikan selalu mengaplikasikan Sunscreen minimal SPF 30 setiap 3 jam sekali saat beraktivitas di luar ruangan untuk mencegah hiperpigmentasi.&quot;
              </p>
            </div>

            <div className="uv-card">
              <div className="uv-header-row">
                <span className="uv-title">Indeks UV Hari Ini</span>
                <span className="uv-pill-badge">Sedang (UV 4)</span>
              </div>
              <p className="uv-desc">
                Paparan sinar UV berada pada tingkat sedang. Disarankan memakai pelembab ber-SPF saat keluar rumah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STYLING CSS SCAN-2 DEDICATED */}
      <style>{`
        .dashboard-scan2-root {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding-bottom: 32px;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        /* 📱 MOBILE VIEW STYLING */
        .mobile-dashboard-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (min-width: 769px) {
          .mobile-dashboard-layout { display: none !important; }
        }

        .mobile-claim-banner {
          background: linear-gradient(90deg, #0f6784 0%, #0f766e 100%);
          color: #ffffff;
          padding: 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(15, 103, 132, 0.15);
        }

        .banner-left-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .coin-glow-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          shrink: 0;
        }

        .banner-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .banner-subtitle {
          font-size: 0.725rem;
          color: #ccfbf1;
          margin: 2px 0 0 0;
        }

        .btn-claim-pill {
          background: #fbbf24;
          color: #0f172a;
          font-weight: 900;
          font-size: 0.75rem;
          padding: 8px 16px;
          border-radius: 12px;
          text-decoration: none;
          white-space: nowrap;
        }

        .mobile-unified-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 24px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .card-kicker-sm {
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          display: block;
        }

        .score-number-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin: 2px 0;
        }

        .score-num-big {
          font-size: 2rem;
          font-weight: 900;
          color: #1e293b;
        }

        .score-num-denom {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .score-trend-text {
          font-size: 0.725rem;
          font-weight: 800;
          color: #059669;
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0;
        }

        .card-vertical-divider {
          width: 1px;
          height: 48px;
          background: #f1f5f9;
        }

        .card-coin-box {
          text-align: right;
        }

        .coin-number-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          font-size: 1.35rem;
          font-weight: 900;
          color: #d97706;
          margin: 2px 0;
        }

        .topup-link {
          font-size: 0.725rem;
          font-weight: 800;
          color: #0f6784;
          text-decoration: none;
        }

        .mobile-services-section {
          margin-top: 4px;
        }

        .services-kicker {
          font-size: 0.725rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin: 0 0 12px 4px;
        }

        .gojek-services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .service-tile {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 14px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .tile-icon-avatar {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }

        .tile-title {
          font-size: 0.725rem;
          font-weight: 800;
          color: #334155;
          line-height: 1.2;
        }

        .mobile-promo-banner {
          background: linear-gradient(90deg, #f59e0b 0%, #ea580c 100%);
          color: #ffffff;
          padding: 16px 20px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .promo-tag {
          font-size: 0.625rem;
          letter-spacing: 0.1em;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .promo-title {
          font-size: 0.9rem;
          font-weight: 900;
          margin: 4px 0 2px 0;
        }

        .promo-desc {
          font-size: 0.725rem;
          color: #fef3c7;
          margin: 0;
        }

        .btn-promo-upgrade {
          background: #ffffff;
          color: #0f172a;
          font-size: 0.75rem;
          font-weight: 900;
          padding: 8px 16px;
          border-radius: 12px;
          text-decoration: none;
          white-space: nowrap;
        }

        /* 🖥️ DESKTOP VIEW STYLING */
        .desktop-dashboard-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .desktop-dashboard-layout { display: none !important; }
        }

        .desktop-top-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        /* SCIENCE HERO BANNER */
        .science-hero-banner {
          position: relative;
          border-radius: 32px;
          background: #090d16;
          color: #ffffff;
          padding: 40px;
          min-height: 320px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.3);
        }

        .hero-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.25;
          transition: transform 0.7s ease;
        }

        .science-hero-banner:hover .hero-bg-img {
          transform: scale(1.05);
        }

        .hero-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #020617 0%, rgba(15, 23, 42, 0.8) 60%, transparent 100%);
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 540px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .lab-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.725rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5eead4;
          background: rgba(45, 212, 191, 0.15);
          border: 1px solid rgba(45, 212, 191, 0.3);
          backdrop-filter: blur(12px);
          padding: 6px 14px;
          border-radius: 9999px;
          width: fit-content;
        }

        .hero-main-title {
          font-size: 2rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .hero-subtext {
          font-size: 0.875rem;
          color: #cbd5e1;
          line-height: 1.5;
          margin: 0;
        }

        .hero-cta-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 6px;
        }

        .btn-hero-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #0d9488 0%, #0f6784 100%);
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 0.825rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 8px 16px rgba(13, 148, 136, 0.25);
        }

        .btn-hero-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px rgba(13, 148, 136, 0.35);
        }

        .btn-hero-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(12px);
          padding: 12px 20px;
          border-radius: 14px;
          font-size: 0.825rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-hero-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Gauge Floating Circle Badge */
        .score-gauge-badge {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .gauge-ring-box {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gauge-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .stroke-white-20 { stroke: rgba(255, 255, 255, 0.2); }
        .stroke-emerald-400 { stroke: #34d399; }

        .gauge-score-num {
          position: absolute;
          font-size: 1.15rem;
          font-weight: 900;
          color: #ffffff;
        }

        .gauge-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          font-weight: 800;
          margin: 0;
        }

        .gauge-status {
          font-size: 0.85rem;
          font-weight: 900;
          color: #34d399;
          margin: 0;
        }

        /* DESKTOP SIDEBAR COL */
        .desktop-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: space-between;
        }

        .desktop-wallet-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .wallet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .wallet-title {
          font-size: 0.725rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        .wallet-status-tag {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 10px;
          border-radius: 9999px;
        }

        .status-pro { background: #dbeafe; color: #1e40af; }
        .status-free { background: #ecfdf5; color: #047857; }

        .wallet-balance-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .balance-big-num {
          font-size: 2.25rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .balance-unit {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 700;
        }

        .btn-topup-block {
          width: 100%;
          padding: 12px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .btn-topup-block:hover {
          background: #0f6784;
          color: #ffffff;
          border-color: #0f6784;
        }

        .desktop-assistant-card {
          background: linear-gradient(135deg, #0f6784 0%, #0f766e 100%);
          color: #ffffff;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 8px 20px -5px rgba(15, 103, 132, 0.2);
        }

        .assistant-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.775rem;
          font-weight: 800;
          color: #ccfbf1;
        }

        .assistant-desc {
          font-size: 0.8rem;
          color: #e0f2fe;
          line-height: 1.45;
          margin: 0;
        }

        .btn-assistant-chat {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          color: #0f6784;
          font-size: 0.775rem;
          font-weight: 900;
          padding: 8px 16px;
          border-radius: 12px;
          text-decoration: none;
          width: fit-content;
          margin-top: 4px;
        }

        .btn-assistant-chat:hover {
          background: #f0f9ff;
        }

        /* KPI STATS GRID */
        .kpi-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: all 0.2s ease;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .kpi-label {
          font-size: 0.725rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin: 0;
        }

        .kpi-value {
          font-size: 1.65rem;
          font-weight: 900;
          color: #0f172a;
          margin: 4px 0 2px 0;
        }

        .kpi-subtext {
          font-size: 0.725rem;
          font-weight: 800;
          margin: 0;
        }

        .kpi-icon-avatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          shrink: 0;
        }

        /* DESKTOP LOWER ROW */
        .desktop-lower-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .table-bento-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .table-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .table-card-title {
          font-size: 1.05rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .table-see-all {
          font-size: 0.775rem;
          font-weight: 800;
          color: #0f6784;
          text-decoration: none;
        }

        .table-scroll-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .scan2-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .scan2-table th {
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .scan2-table td {
          padding: 14px 4px;
          border-bottom: 1px solid #f8fafc;
          font-size: 0.825rem;
        }

        .scan2-table tr:last-child td {
          border-bottom: none;
        }

        .text-date { color: #94a3b8; font-size: 0.75rem; }
        .font-type { font-weight: 800; color: #0f172a; }
        .text-result { color: #475569; }

        .table-status-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 8px;
          border: 1px solid transparent;
        }

        .badge-optimal { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .badge-sehat { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .badge-perhatian { background: #fffbeb; color: #b45309; border-color: #fde68a; }

        /* DESKTOP INSIGHT SIDEBAR */
        .desktop-insight-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .insight-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insight-title {
          font-size: 0.725rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .insight-quote {
          font-size: 0.825rem;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        .uv-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
          border: 1px solid #bae6fd;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .uv-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .uv-title {
          font-size: 0.825rem;
          font-weight: 900;
          color: #0c4a6e;
        }

        .uv-pill-badge {
          font-size: 0.675rem;
          font-weight: 900;
          background: #fbbf24;
          color: #0f172a;
          padding: 2px 10px;
          border-radius: 9999px;
        }

        .uv-desc {
          font-size: 0.775rem;
          color: #075985;
          line-height: 1.45;
          margin: 0;
        }

        .text-right { text-align: right; }
      `}</style>
    </div>
  )
}

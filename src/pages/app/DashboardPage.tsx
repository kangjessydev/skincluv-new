// src/pages/app/DashboardPage.tsx
// Ported scan-2 Bento Grid UI for Skincluv — Connected to activeSkinProfile, coin_balances, quota_usage & missions DB

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ScanFace,
  FlaskConical,
  MessageCircle,
  Gift,
  Sparkles,
  TrendingUp,
  Coins,
  ChevronRight,
  ShieldCheck,
  Award,
  Zap,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium } from '@/utils/subscriptionHelpers'

interface ActiveMission {
  id: string
  name: string
  target_count: number
  current_count: number
  coin_reward: number
}

const SKIN_TYPE_LABELS: Record<string, string> = {
  normal: 'Normal',
  oily: 'Berminyak',
  dry: 'Kering',
  combination: 'Kombinasi',
  sensitive: 'Sensitif',
}

const CONCERN_LABELS: Record<string, string> = {
  acne: 'Jerawat',
  hyperpigmentation: 'Flek Hitam',
  wrinkles: 'Kerutan',
  dryness: 'Kulit Kering',
  oiliness: 'Minyak Berlebih',
  sensitivity: 'Sensitif',
  redness: 'Kemerahan',
  dark_circles: 'Mata Panda',
  pores: 'Pori Besar',
}

export default function DashboardPage() {
  const { profile, activeSkinProfile, coinBalance, subscription } = useAuthStore()
  const navigate = useNavigate()

  const [greeting, setGreeting] = useState('Selamat Pagi')
  const [usageCount, setUsageCount] = useState<number>(0)
  const [monthlyLimit, setMonthlyLimit] = useState<number>(10)
  const [topMissions, setTopMissions] = useState<ActiveMission[]>([])
  const [loadingData, setLoadingData] = useState<boolean>(true)

  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const isPro = isActivePremium(subscription)
  const userCoins = coinBalance?.balance ?? 50

  // Dynamic Greeting Based on Local Time
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 11) setGreeting('Selamat Pagi')
    else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang')
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')
  }, [])

  // Fetch Quota Usage & Active Missions from Supabase
  useEffect(() => {
    if (!profile?.id) return

    const fetchDashboardData = async () => {
      setLoadingData(true)
      try {
        // 1. Fetch Quota Usage & Limit
        const { data: usageData } = await supabase
          .from('quota_usage')
          .select('used_count')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (usageData) setUsageCount(usageData.used_count || 0)

        const subTierSlug = (subscription as any)?.subscription_tiers?.slug
        if (subTierSlug === 'premium' || subTierSlug === 'pro') {
          setMonthlyLimit(9999) // Unlimited / FUP
        } else {
          setMonthlyLimit(10)
        }

        // 2. Fetch Active Missions from DB
        const { data: missionsData } = await supabase
          .from('missions')
          .select('id, name, target_count, coin_reward')
          .eq('is_active', true)
          .limit(2)

        if (missionsData && missionsData.length > 0) {
          const { data: userMissions } = await supabase
            .from('user_missions')
            .select('mission_id, current_count')
            .eq('user_id', profile.id)

          const mappedMissions: ActiveMission[] = missionsData.map((m) => {
            const userProg = userMissions?.find((um) => um.mission_id === m.id)
            return {
              id: m.id,
              name: m.name,
              target_count: m.target_count,
              current_count: userProg?.current_count || 0,
              coin_reward: m.coin_reward,
            }
          })
          setTopMissions(mappedMissions)
        }
      } catch (err) {
        console.error('[DashboardPage] Error fetching dashboard data:', err)
      } finally {
        setLoadingData(false)
      }
    }

    fetchDashboardData()
  }, [profile?.id, subscription])

  // Calculate dynamic skin score or fallback to 85
  const skinScore = activeSkinProfile
    ? Math.min(100, Math.max(50, 100 - (activeSkinProfile.concerns?.length || 0) * 6))
    : 85

  const skinTypeDisplay = activeSkinProfile?.skin_type
    ? SKIN_TYPE_LABELS[activeSkinProfile.skin_type] || activeSkinProfile.skin_type
    : 'Belum Diisi'

  const concernsList = activeSkinProfile?.concerns || ['acne', 'pores']

  return (
    <div className="dashboard-grid-container">
      {/* 1. WELCOME GREETING BANNER */}
      <div className="dashboard-header-banner">
        <div className="banner-left">
          <span className="banner-badge">
            <Sparkles size={14} /> {isPro ? 'Skincluv PRO Member' : 'Free Explorer'}
          </span>
          <h1 className="banner-greeting">
            {greeting}, <span className="highlight-name">{userName}</span>
          </h1>
          <p className="banner-subtext">
            Kondisi kulitmu hari ini terpantau <strong className="text-emerald-300">Sehat & Optimal</strong>. Mari pantau perkembangannya!
          </p>
        </div>
        <div className="banner-right">
          <button onClick={() => navigate('/face-scan')} className="banner-scan-btn">
            <ScanFace size={18} />
            <span>Mulai Scan Sekarang</span>
          </button>
        </div>
      </div>

      {/* 2. BONUS COIN CLAIM BANNER (PORTED FROM SCAN-2) */}
      <div className="coin-bonus-banner">
        <div className="coin-bonus-info">
          <div className="coin-icon-box">
            <Coins size={24} className="text-amber-300 animate-bounce" />
          </div>
          <div>
            <h3 className="coin-bonus-title">Bonus Koin Pengguna Baru</h3>
            <p className="coin-bonus-desc">Klaim +50 Koin gratis dengan menyelesaikan misi pertama kamu hari ini.</p>
          </div>
        </div>
        <Link to="/missions" className="coin-bonus-btn">
          Buka Misi
        </Link>
      </div>

      {/* 3. UNIFIED SKINSCORE & COINS CARD (PORTED FROM SCAN-2 BENTO) */}
      <div className="dashboard-top-row">
        {/* SKINSCORE CARD */}
        <div className="bento-card score-bento-card">
          <div className="card-header-row">
            <span className="card-kicker">Skor Kesehatan Kulit</span>
            <span className="trend-badge">
              <TrendingUp size={12} /> +4 Poin Minggu Ini
            </span>
          </div>
          <div className="score-display">
            <span className="score-big">{skinScore}</span>
            <span className="score-max">/ 100</span>
          </div>
          <p className="score-note">
            Dianalisis dari hasil scan ke-3 kamu. Pertahankan penggunaan sunscreen harian!
          </p>
        </div>

        {/* SKIN COINS CARD */}
        <div className="bento-card coins-bento-card">
          <div className="card-header-row">
            <span className="card-kicker">Saldo Skin Coin</span>
            <Link to="/coin-history" className="history-link">
              Mutasi <ChevronRight size={14} />
            </Link>
          </div>
          <div className="coins-display">
            <Coins size={28} className="text-amber-500" />
            <span className="coins-amount">{userCoins.toLocaleString()}</span>
            <span className="coins-label">Koin</span>
          </div>
          <div className="coins-action-row">
            <Link to="/pricing" className="topup-btn">
              + Top Up / Upgrade PRO
            </Link>
          </div>
        </div>
      </div>

      {/* 4. GOJEK-STYLE 4-COLUMN FEATURE GRID (PORTED FROM SCAN-2) */}
      <div className="features-grid-section">
        <h2 className="section-title">Layanan & Analisis AI</h2>
        <div className="gojek-grid">
          {/* SCAN WAJAH */}
          <Link to="/face-scan" className="feature-tile feature-violet">
            <div className="tile-icon-box bg-violet-100 text-violet-700">
              <ScanFace size={26} />
            </div>
            <span className="tile-label">AI Scan Wajah</span>
            <span className="tile-sublabel">Deteksi Pori & Minyak</span>
          </Link>

          {/* SCAN INGREDIENT */}
          <Link to="/ingredient-scan" className="feature-tile feature-amber">
            <div className="tile-icon-box bg-amber-100 text-amber-700">
              <FlaskConical size={26} />
            </div>
            <span className="tile-label">Scan Ingredient</span>
            <span className="tile-sublabel">Cek Keamanan Bahan</span>
          </Link>

          {/* SKINSISTANT CHATBOT */}
          <Link to="/chatbot" className="feature-tile feature-emerald">
            <div className="tile-icon-box bg-emerald-100 text-emerald-700">
              <MessageCircle size={26} />
            </div>
            <span className="tile-label">Skinsistant AI</span>
            <span className="tile-sublabel">Tanya Jawab Skincare</span>
          </Link>

          {/* MISI & HADIAH */}
          <Link to="/missions" className="feature-tile feature-teal">
            <div className="tile-icon-box bg-teal-100 text-teal-700">
              <Gift size={26} />
            </div>
            <span className="tile-label">Misi & Koin</span>
            <span className="tile-sublabel">Klaim Koin Gratis</span>
          </Link>
        </div>
      </div>

      {/* 5. MAIN CONTENT BENTO GRID (2-COLUMNS DESKTOP) */}
      <div className="dashboard-main-bento">
        {/* LEFT COLUMN: ACTIVE SKIN PROFILE & RECENT SCANS */}
        <div className="bento-col-left">
          {/* PROFILE SUMMARY BENTO */}
          <div className="bento-card profile-summary-card">
            <div className="card-title-row">
              <h3 className="bento-title">Profil & Masalah Kulit Utama</h3>
              <Link to="/profile" className="edit-link">Edit Profil</Link>
            </div>

            <div className="profile-details-grid">
              <div className="detail-item">
                <span className="detail-label">Tipe Kulit</span>
                <span className="detail-val text-primary-gradient">{skinTypeDisplay}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tingkat Sensitivitas</span>
                <span className="detail-val">Sedang (Sensitif Ringan)</span>
              </div>
            </div>

            <div className="concerns-tags-box">
              <span className="detail-label">Fokus Perhatian Kamu:</span>
              <div className="tags-flex">
                {concernsList.map((c) => (
                  <span key={c} className="concern-pill">
                    {CONCERN_LABELS[c] || c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RECENT SCAN TIMELINE (PORTED FROM SCAN-2) */}
          <div className="bento-card timeline-card">
            <div className="card-title-row">
              <h3 className="bento-title">Aktivitas & Riwayat Scan Terbaru</h3>
              <Link to="/face-scan" className="edit-link">Lihat Semua</Link>
            </div>

            <div className="timeline-stack">
              <div className="timeline-item">
                <div className="timeline-icon bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <div className="timeline-body">
                  <div className="timeline-title-row">
                    <span className="timeline-title">Scan Wajah AI</span>
                    <span className="timeline-date">Hari Ini, 09:30</span>
                  </div>
                  <p className="timeline-desc">Kombinasi (T-Zone Berminyak) — Skor 85/100</p>
                  <span className="status-badge status-optimal">Optimal</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon bg-amber-100 text-amber-600">
                  <FlaskConical size={18} />
                </div>
                <div className="timeline-body">
                  <div className="timeline-title-row">
                    <span className="timeline-title">Scan Ingredient Skincare</span>
                    <span className="timeline-date">2 Hari Lalu</span>
                  </div>
                  <p className="timeline-desc">Niacinamide 5% Serum — Komposisi Aman</p>
                  <span className="status-badge status-safe">Sehat</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI QUOTA METER & DAILY MISSIONS */}
        <div className="bento-col-right">
          {/* QUOTA METER CARD */}
          <div className="bento-card quota-card">
            <div className="card-title-row">
              <h3 className="bento-title">Pemakaian Kuota AI Bulanan</h3>
              <span className="quota-pill">{isPro ? 'PRO Unlimited' : 'Gratis'}</span>
            </div>

            <div className="quota-meter-body">
              <div className="meter-numbers">
                <span className="meter-used">{usageCount}</span>
                <span className="meter-total">/ {monthlyLimit === 9999 ? '∞' : monthlyLimit} Fitur AI Digunakan</span>
              </div>
              <div className="meter-bar-track">
                <div
                  className="meter-bar-fill"
                  style={{
                    width: `${Math.min(100, (usageCount / (monthlyLimit === 9999 ? 100 : monthlyLimit)) * 100)}%`,
                  }}
                />
              </div>
              <p className="meter-note">
                {isPro
                  ? 'Kamu memiliki akses tak terbatas ke seluruh analisis AI Skincluv.'
                  : `Sisa kuota gratis bulan ini. Setiap scan tambahan akan menggunakan 5 koin.`}
              </p>
            </div>
          </div>

          {/* DAILY MISSIONS WIDGET */}
          <div className="bento-card missions-widget-card">
            <div className="card-title-row">
              <h3 className="bento-title">Misi Harian Kamu</h3>
              <Link to="/missions" className="edit-link">Buka Misi</Link>
            </div>

            <div className="missions-list-mini">
              {topMissions.map((m) => (
                <div key={m.id} className="mini-mission-item">
                  <div className="mini-mission-info">
                    <span className="mini-mission-name">{m.name}</span>
                    <span className="mini-mission-reward">+{m.coin_reward} Koin</span>
                  </div>
                  <div className="mini-mission-progress-bar">
                    <div
                      className="mini-mission-fill"
                      style={{ width: `${Math.min(100, (m.current_count / m.target_count) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-grid-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 40px;
        }

        .dashboard-header-banner {
          background: linear-gradient(135deg, #0f6784 0%, #083344 100%);
          border-radius: 28px;
          padding: 28px 32px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-shadow: 0 12px 30px -10px rgba(15, 103, 132, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.725rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 10px;
        }

        .banner-greeting {
          font-size: 1.75rem;
          font-weight: 900;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .highlight-name {
          color: #38bdf8;
        }

        .banner-subtext {
          font-size: 0.875rem;
          color: #cbd5e1;
          margin: 0;
        }

        .banner-scan-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #0f6784;
          border: none;
          padding: 12px 22px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
        }

        .banner-scan-btn:hover {
          background: #f0f9ff;
          transform: translateY(-2px);
        }

        /* COIN BONUS BANNER */
        .coin-bonus-banner {
          background: linear-gradient(90deg, #0f6784 0%, #0d9488 50%, #0f766e 100%);
          border-radius: 24px;
          padding: 18px 24px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 8px 20px -5px rgba(13, 148, 136, 0.3);
        }

        .coin-bonus-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .coin-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          shrink: 0;
        }

        .coin-bonus-title {
          font-size: 0.95rem;
          font-weight: 900;
          margin: 0 0 2px 0;
        }

        .coin-bonus-desc {
          font-size: 0.8rem;
          color: #ccfbf1;
          margin: 0;
        }

        .coin-bonus-btn {
          background: #fbbf24;
          color: #0f172a;
          font-weight: 900;
          font-size: 0.8rem;
          padding: 8px 18px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          shrink: 0;
        }

        .coin-bonus-btn:hover {
          background: #f59e0b;
          transform: scale(1.03);
        }

        /* TOP ROW BENTO */
        .dashboard-top-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
        }

        .bento-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.04);
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .card-kicker {
          font-size: 0.725rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        .trend-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #059669;
          background: #ecfdf5;
          padding: 3px 10px;
          border-radius: 9999px;
        }

        .score-display {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: 8px;
        }

        .score-big {
          font-size: 2.75rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .score-max {
          font-size: 1rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .score-note {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .history-link {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #0f6784;
          text-decoration: none;
        }

        .coins-display {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .coins-amount {
          font-size: 2.25rem;
          font-weight: 900;
          color: #d97706;
        }

        .coins-unit {
          font-size: 1.25rem;
        }

        .topup-btn {
          font-size: 0.775rem;
          font-weight: 800;
          color: #0f6784;
          text-decoration: none;
        }

        .topup-btn:hover {
          text-decoration: underline;
        }

        /* 4-COLUMN GOJEK GRID */
        .features-grid-section {
          margin-top: 4px;
        }

        .section-title {
          font-size: 0.775rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin: 0 0 12px 4px;
        }

        .gojek-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .feature-tile {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .feature-tile:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1;
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.08);
        }

        .tile-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          transition: transform 0.2s ease;
        }

        .feature-tile:hover .tile-icon-box {
          transform: scale(1.08);
        }

        .tile-label {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .tile-sublabel {
          font-size: 0.725rem;
          color: #64748b;
        }

        /* MAIN BENTO 2-COLS */
        .dashboard-main-bento {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
        }

        .bento-col-left, .bento-col-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .bento-title {
          font-size: 0.95rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }

        .edit-link {
          font-size: 0.75rem;
          font-weight: 800;
          color: #0f6784;
          text-decoration: none;
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .detail-item {
          background: #f8fafc;
          padding: 12px 14px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 0.725rem;
          color: #64748b;
          font-weight: 600;
        }

        .detail-val {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0f172a;
        }

        .concerns-tags-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tags-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .concern-pill {
          font-size: 0.75rem;
          font-weight: 700;
          background: #f1f5f9;
          color: #334155;
          padding: 4px 12px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
        }

        /* TIMELINE STACK */
        .timeline-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
        }

        .timeline-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          shrink: 0;
        }

        .timeline-body {
          flex: 1;
        }

        .timeline-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .timeline-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: #0f172a;
        }

        .timeline-date {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .timeline-desc {
          font-size: 0.775rem;
          color: #64748b;
          margin: 0 0 6px 0;
        }

        .status-badge {
          display: inline-block;
          font-size: 0.675rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .status-optimal {
          background: #ecfdf5;
          color: #047857;
        }

        .status-safe {
          background: #f0fdf4;
          color: #15803d;
        }

        /* QUOTA CARD */
        .quota-pill {
          font-size: 0.7rem;
          font-weight: 800;
          background: #f0f9ff;
          color: #0369a1;
          padding: 3px 10px;
          border-radius: 9999px;
        }

        .quota-meter-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meter-numbers {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .meter-used {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0f172a;
        }

        .meter-total {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
        }

        .meter-bar-track {
          width: 100%;
          height: 10px;
          background: #f1f5f9;
          border-radius: 9999px;
          overflow: hidden;
        }

        .meter-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #0f6784 0%, #38bdf8 100%);
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        .meter-note {
          font-size: 0.75rem;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }

        /* MISSIONS MINI */
        .missions-list-mini {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mini-mission-item {
          background: #f8fafc;
          padding: 10px 14px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mini-mission-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 700;
          color: #1e293b;
        }

        .mini-mission-reward {
          color: #d97706;
          font-size: 0.75rem;
        }

        .mini-mission-progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .mini-mission-fill {
          height: 100%;
          background: #0f6784;
          border-radius: 9999px;
        }

        @media (max-width: 900px) {
          .dashboard-top-row, .dashboard-main-bento {
            grid-template-columns: 1fr;
          }
          .gojek-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-header-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

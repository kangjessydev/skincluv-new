// src/pages/app/DashboardPage.tsx
// Real Data-bound Dashboard for Skincluv — Bound to activeSkinProfile, quota_usage & missions DB

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ScanFace,
  FlaskConical,
  ChevronRight,
  Sparkles,
  Star,
  Target,
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
  const { profile, activeSkinProfile, subscription } = useAuthStore()
  const navigate = useNavigate()

  const [greeting, setGreeting] = useState('Selamat Pagi')
  const [usageCount, setUsageCount] = useState<number>(0)
  const [monthlyLimit, setMonthlyLimit] = useState<number>(10)
  const [topMissions, setTopMissions] = useState<ActiveMission[]>([])
  const [loadingData, setLoadingData] = useState<boolean>(true)

  const userName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const isPro = isActivePremium(subscription)

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
          // Fetch user mission progress
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

  // Calculate Real Skin Score from activeSkinProfile
  const concernsCount = activeSkinProfile?.skin_concerns?.length ?? 0
  const skinScore = activeSkinProfile
    ? Math.max(60, 100 - concernsCount * 8)
    : null

  const getScoreBadge = (score: number) => {
    if (score >= 88) return { label: 'Sangat Baik', class: 'badge-success' }
    if (score >= 75) return { label: 'Kondisi Baik', class: 'badge-info' }
    return { label: 'Perlu Perawatan', class: 'badge-warning' }
  }

  const scoreBadge = skinScore ? getScoreBadge(skinScore) : null

  return (
    <div className="dashboard-stich animate-fade-in">
      {/* 1. Header Greeting Section */}
      <section className="dashboard-greeting-sec">
        <h1 className="greeting-title">
          {greeting}, {userName}!
        </h1>
        <p className="greeting-sub">
          {activeSkinProfile
            ? `Tipe kulit kamu terdeteksi ${SKIN_TYPE_LABELS[activeSkinProfile.skin_type] || activeSkinProfile.skin_type}. Mari konsisten merawatnya!`
            : 'Mulai perjalanan kulit sehatmu dengan melakukan Scan Wajah AI pertama.'}
        </p>
      </section>

      {/* 2. Top Bento Grid: Skin Score Card + Quick Actions */}
      <section className="bento-grid-top">
        {/* Skin Score Summary Card */}
        <div className="bento-card skin-score-card">
          {activeSkinProfile ? (
            <>
              <div className="card-top-row">
                <div>
                  <span className="meta-label">Skor Kesehatan Kulit Real-Time</span>
                  <div className="score-flex">
                    <span className="score-val">{skinScore}</span>
                    {scoreBadge && (
                      <span className={`score-badge ${scoreBadge.class}`}>
                        {scoreBadge.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="gauge-wrapper">
                  <svg className="gauge-svg" viewBox="0 0 36 36">
                    <path
                      className="gauge-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="3"
                    />
                    <path
                      className="gauge-fill"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeDasharray={`${skinScore}, 100`}
                      strokeWidth="3"
                    />
                  </svg>
                  <Star size={18} className="gauge-icon" />
                </div>
              </div>

              {/* Real Concerns Pills */}
              <div className="concerns-summary">
                <span className="concerns-title">Fokus Masalah Kulit Terdeteksi:</span>
                <div className="concerns-pills-wrap">
                  {activeSkinProfile.skin_concerns && activeSkinProfile.skin_concerns.length > 0 ? (
                    activeSkinProfile.skin_concerns.map((c) => (
                      <span key={c} className="concern-pill">
                        {CONCERN_LABELS[c] || c}
                      </span>
                    ))
                  ) : (
                    <span className="concern-pill pill-none">Tidak ada masalah serius</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-skin-state">
              <div className="empty-icon-wrap">
                <ScanFace size={32} />
              </div>
              <div className="empty-text">
                <h3>Belum Ada Data Scan Wajah</h3>
                <p>Lakukan analisis foto wajah untuk mendapatkan skor kesehatan kulit dan rekomendasi personal.</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/face-scan')}>
                <Sparkles size={16} /> Scan Wajah Sekarang
              </button>
            </div>
          )}
        </div>

        {/* Quick Scan Action Cards (Stack) */}
        <div className="quick-scan-stack">
          <button className="bento-card scan-btn-card" onClick={() => navigate('/face-scan')}>
            <div className="scan-icon-circle icon-bg-sky">
              <ScanFace size={24} />
            </div>
            <div className="scan-text">
              <h3>AI Scan Wajah</h3>
              <p>Analisis kondisi kulit & pori</p>
            </div>
            <ChevronRight className="scan-arrow" size={20} />
          </button>

          <button className="bento-card scan-btn-card" onClick={() => navigate('/ingredient-scan')}>
            <div className="scan-icon-circle icon-bg-purple">
              <FlaskConical size={24} />
            </div>
            <div className="scan-text">
              <h3>Scan Ingredient</h3>
              <p>Cek keamanan bahan produk</p>
            </div>
            <ChevronRight className="scan-arrow" size={20} />
          </button>
        </div>
      </section>

      {/* 3. Bottom Bento Grid: Quota Meter & Daily Missions */}
      <section className="bento-grid-bottom">
        {/* Quota Usage Meter Card */}
        <div className="bento-card usage-meter-card">
          <div className="card-header">
            <h2>Penggunaan AI Bulanan</h2>
            <span className="badge-tier">{isPro ? '✨ Skincluv PRO' : 'Free Tier'}</span>
          </div>

          <div className="meter-content">
            <div className="meter-row">
              <span>Kuota Terpakai</span>
              <span className="meter-val font-heading font-extrabold text-primary">
                {usageCount} / {isPro ? 'Tanpa Batas' : monthlyLimit} Analisis
              </span>
            </div>

            <div className="quota-bar-bg">
              <div
                className="quota-bar-fill"
                style={{
                  width: isPro ? '100%' : `${Math.min(100, (usageCount / monthlyLimit) * 100)}%`,
                }}
              />
            </div>

            <p className="meter-info">
              {isPro
                ? 'Kamu memiliki akses prioritas tanpa batas untuk semua fitur analisis AI.'
                : `Sisa kuota gratis kamu reset setiap bulan. Koin Darurat dapat dipakai jika kuota habis.`}
            </p>
          </div>
        </div>

        {/* Daily Missions Quick View */}
        <div className="bento-card missions-card">
          <div className="card-header">
            <h2>Misi Harian Kamu</h2>
            <Link to="/missions" className="view-all-link">
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          <div className="missions-stack">
            {topMissions.length > 0 ? (
              topMissions.map((m) => (
                <div key={m.id} className="mission-row">
                  <div className="mission-icon-box">
                    <Target size={18} />
                  </div>
                  <div className="mission-meta">
                    <div className="mission-top">
                      <h4>{m.name}</h4>
                      <span className="reward-tag">+{m.coin_reward} 🪙</span>
                    </div>
                    <div className="mission-progress-bar">
                      <div
                        className="fill-bar"
                        style={{
                          width: `${Math.min(100, (m.current_count / m.target_count) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="mission-count">
                      {m.current_count}/{m.target_count} Selesai
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="mission-row default-mission">
                <div className="mission-icon-box">
                  <Sparkles size={18} />
                </div>
                <div className="mission-meta">
                  <div className="mission-top">
                    <h4>Scan Wajah Pertama Hari Ini</h4>
                    <span className="reward-tag">+50 🪙</span>
                  </div>
                  <div className="mission-progress-bar">
                    <div className="fill-bar" style={{ width: '0%' }} />
                  </div>
                  <span className="mission-count">0/1 Selesai</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DASHBOARD STYLES — Pure Vanilla CSS using Skincluv tokens */}
      <style>{`
        .dashboard-stich { width: 100%; padding-bottom: 40px; }

        .dashboard-greeting-sec { margin-bottom: var(--space-xl); }
        .greeting-title { font-size: 1.875rem; font-weight: 800; color: var(--color-primary); margin: 0 0 4px 0; font-family: var(--font-heading); }
        .greeting-sub { font-size: 0.9375rem; color: var(--color-text-muted); margin: 0; }

        /* Bento Grid Top */
        .bento-grid-top {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }
        @media (min-width: 900px) {
          .bento-grid-top {
            grid-template-columns: 8fr 4fr;
          }
        }

        .bento-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-sm);
        }

        /* Skin Score Card */
        .skin-score-card { display: flex; flex-direction: column; justify-content: space-between; gap: var(--space-md); }
        .card-top-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .meta-label { font-size: 0.8125rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .score-flex { display: flex; align-items: baseline; gap: 12px; }
        .score-val { font-size: 3.25rem; font-weight: 800; color: var(--color-primary); line-height: 1; font-family: var(--font-heading); }
        
        .score-badge {
          font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-full);
        }
        .badge-success { background: var(--color-success-soft); color: var(--color-success); border: 1px solid #bbf7d0; }
        .badge-info { background: var(--color-primary-fixed); color: var(--color-primary); border: 1px solid #c9e6ff; }
        .badge-warning { background: var(--color-tertiary-fixed); color: var(--color-tertiary); border: 1px solid #fde68a; }

        .gauge-wrapper { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
        .gauge-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .gauge-bg { stroke: var(--color-secondary-container); }
        .gauge-fill { stroke: var(--color-primary); stroke-linecap: round; }
        .gauge-icon { position: absolute; color: var(--color-primary); }

        .concerns-summary { display: flex; flex-direction: column; gap: 8px; }
        .concerns-title { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); }
        .concerns-pills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .concern-pill {
          background: var(--color-surface-container-low); color: var(--color-primary);
          border: 1px solid var(--color-secondary-container); font-size: 0.75rem; font-weight: 700;
          padding: 4px 12px; border-radius: var(--radius-full);
        }
        .pill-none { color: var(--color-success); background: var(--color-success-soft); }

        /* Empty Skin State */
        .empty-skin-state {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          gap: var(--space-md); padding: var(--space-md) 0;
        }
        .empty-icon-wrap {
          width: 56px; height: 56px; border-radius: 50%; background: var(--color-primary-fixed);
          color: var(--color-primary); display: flex; align-items: center; justify-content: center;
        }
        .empty-text h3 { font-size: 1.125rem; font-family: var(--font-heading); margin: 0 0 4px 0; }
        .empty-text p { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; max-width: 400px; }

        /* Quick Scan Stack */
        .quick-scan-stack { display: flex; flex-direction: column; gap: var(--space-md); }
        .scan-btn-card {
          display: flex; align-items: center; gap: 16px; padding: var(--space-lg);
          cursor: pointer; text-align: left; transition: all 0.2s ease; width: 100%;
        }
        .scan-btn-card:hover { transform: translateY(-2px); border-color: var(--color-primary-container); }
        .scan-icon-circle {
          width: 48px; height: 48px; border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .icon-bg-sky { background: var(--color-primary-fixed); color: var(--color-primary); }
        .icon-bg-purple { background: #f3e8ff; color: #9333ea; }
        .scan-text { flex: 1; }
        .scan-text h3 { font-size: 1rem; font-family: var(--font-heading); font-weight: 700; margin: 0 0 2px 0; }
        .scan-text p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
        .scan-arrow { color: var(--color-secondary); transition: color 0.2s; }
        .scan-btn-card:hover .scan-arrow { color: var(--color-primary); }

        /* Bento Grid Bottom */
        .bento-grid-bottom {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }
        @media (min-width: 900px) {
          .bento-grid-bottom {
            grid-template-columns: 6fr 6fr;
          }
        }

        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
        .card-header h2 { font-size: 1.125rem; font-family: var(--font-heading); font-weight: 700; margin: 0; }
        .badge-tier {
          background: var(--color-secondary-container); color: var(--color-primary); font-size: 0.75rem;
          font-weight: 700; padding: 4px 10px; border-radius: var(--radius-full);
        }
        .view-all-link { font-size: 0.8125rem; font-weight: 700; color: var(--color-primary); text-decoration: none; display: flex; align-items: center; gap: 2px; }

        .usage-meter-card { display: flex; flex-direction: column; justify-content: space-between; }
        .meter-content { display: flex; flex-direction: column; gap: var(--space-md); }
        .meter-row { display: flex; justify-content: space-between; font-size: 0.875rem; font-weight: 600; color: var(--color-text-main); }
        .quota-bar-bg { width: 100%; height: 8px; background: var(--color-surface-container-high); border-radius: 4px; overflow: hidden; }
        .quota-bar-fill { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.3s ease; }
        .meter-info { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; line-height: 1.5; }

        .missions-stack { display: flex; flex-direction: column; gap: 12px; }
        .mission-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-surface-container-low); border: 1px solid var(--color-secondary-container); border-radius: var(--radius-xl); }
        .mission-icon-box {
          width: 40px; height: 40px; border-radius: var(--radius-lg); background: var(--color-primary-fixed); color: var(--color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .mission-meta { flex: 1; }
        .mission-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .mission-top h4 { font-size: 0.875rem; margin: 0; font-weight: 700; }
        .reward-tag { font-size: 0.75rem; font-weight: 800; color: var(--color-tertiary-container); font-family: var(--font-heading); }
        .mission-progress-bar { width: 100%; height: 6px; background: var(--color-surface-container-high); border-radius: 3px; overflow: hidden; }
        .fill-bar { height: 100%; background: var(--color-primary); border-radius: 3px; }
        .mission-count { font-size: 0.6875rem; color: var(--color-text-muted); text-align: right; display: block; margin-top: 2px; }
      `}</style>
    </div>
  )
}

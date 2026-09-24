// src/pages/app/MissionsPage.tsx
// Data-bound Missions & Rewards Page — Connected to missions, user_missions & coin_transactions

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Gift,
  Coins,
  Sparkles,
  Trophy,
  Calendar,
  Loader2,
  ScanFace,
  FlaskConical,
  MessageSquare,
  User,
  ArrowRight,
  Flame,
  Award,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

type MissionCategory = 'all' | 'daily' | 'weekly' | 'one_time'

interface MissionView {
  id: string
  slug: string
  title: string
  description: string | null
  reward_coins: number
  progress: number
  target: number
  type: 'daily' | 'weekly' | 'one_time' | 'streak' | 'social'
  action?: string
  is_claimed: boolean
}

// Fallback initial missions matching DB schema
const DEFAULT_MISSIONS: MissionView[] = [
  {
    id: 'm_login',
    slug: 'daily_login',
    title: 'Login Harian',
    description: 'Buka dan gunakan aplikasi Skincluv hari ini.',
    reward_coins: 2,
    progress: 1,
    target: 1,
    type: 'daily',
    action: 'login',
    is_claimed: false,
  },
  {
    id: 'm_face',
    slug: 'daily_face_scan',
    title: 'Scan Wajah Harian',
    description: 'Lakukan analisis kondisi kulit dengan kamera untuk memantau progres harian.',
    reward_coins: 3,
    progress: 0,
    target: 1,
    type: 'daily',
    action: 'face_scan',
    is_claimed: false,
  },
  {
    id: 'm_chat',
    slug: 'daily_chatbot',
    title: 'Konsultasi Chatbot Harian',
    description: 'Tanyakan saran perawatan atau konsultasi seputar kulit ke Skinsistant AI hari ini.',
    reward_coins: 2,
    progress: 0,
    target: 1,
    type: 'daily',
    action: 'chatbot',
    is_claimed: false,
  },
  {
    id: 'm_w_face',
    slug: 'weekly_3_scans',
    title: '3 Scan Minggu Ini',
    description: 'Lakukan 3 kali face scan dalam seminggu untuk memantau skin journey berkala.',
    reward_coins: 10,
    progress: 1,
    target: 3,
    type: 'weekly',
    action: 'face_scan',
    is_claimed: false,
  },
  {
    id: 'm_w_ing',
    slug: 'weekly_ingredient',
    title: 'Cek Ingredient 3x',
    description: 'Pindai 3 label komposisi produk skincare dalam seminggu.',
    reward_coins: 8,
    progress: 0,
    target: 3,
    type: 'weekly',
    action: 'ingredient_scan',
    is_claimed: false,
  },
  {
    id: 'm_first_scan',
    slug: 'first_scan',
    title: 'Scan Pertama!',
    description: 'Lakukan face scan untuk pertama kali.',
    reward_coins: 15,
    progress: 1,
    target: 1,
    type: 'one_time',
    action: 'face_scan',
    is_claimed: true,
  },
]

export default function MissionsPage() {
  const { user, coinBalance, setCoinBalance } = useAuthStore()
  const [missions, setMissions] = useState<MissionView[]>(DEFAULT_MISSIONS)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<MissionCategory>('all')
  const [claimingSlug, setClaimingSlug] = useState<string | null>(null)
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Missions & User Progress from Database
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchMissionsData = async () => {
      setLoading(true)
      try {
        // 1. Query active missions from DB ordered by type and reward
        const { data: dbMissions, error: mErr } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)
          .order('type', { ascending: true })

        if (mErr) {
          console.error('[MissionsPage] Error fetching missions:', mErr)
        }

        // 2. Query user's mission progress from user_missions
        const { data: userMissions, error: umErr } = await supabase
          .from('user_missions')
          .select('*')
          .eq('user_id', user.id)

        if (umErr) {
          console.error('[MissionsPage] Error fetching user_missions:', umErr)
        }

        if (dbMissions && dbMissions.length > 0) {
          const isSameDay = (dateStr?: string | null) => {
            if (!dateStr) return false
            const d = new Date(dateStr)
            const now = new Date()
            return d.toDateString() === now.toDateString()
          }

          const getIsoWeek = (date: Date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
            const dayNum = d.getUTCDay() || 7
            d.setUTCDate(d.getUTCDate() + 4 - dayNum)
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
            return `${d.getUTCFullYear()}-W${Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)}`
          }

          const isSameWeek = (dateStr?: string | null) => {
            if (!dateStr) return false
            return getIsoWeek(new Date(dateStr)) === getIsoWeek(new Date())
          }

          const mapped: MissionView[] = dbMissions.map((m) => {
            const userProg = userMissions?.find((um) => um.mission_id === m.id)
            let progress = userProg?.current_count ?? 0
            let isClaimed = userProg?.is_completed ?? false

            if (m.type === 'daily') {
              if (!isSameDay(userProg?.completed_at)) isClaimed = false
              if (!isSameDay(userProg?.last_activity)) progress = 0
            } else if (m.type === 'weekly') {
              if (!isSameWeek(userProg?.completed_at)) isClaimed = false
              if (!isSameWeek(userProg?.last_activity)) progress = 0
            }

            return {
              id: m.id,
              slug: m.slug,
              title: m.name,
              description: m.description,
              reward_coins: m.coin_reward,
              progress,
              target: m.target_count ?? 1,
              type: m.type as any,
              action: (m.metadata as Record<string, any> | null)?.action,
              is_claimed: isClaimed,
            }
          })
          setMissions(mapped)
        }
      } catch (err) {
        console.error('[MissionsPage] Unexpected fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMissionsData()
  }, [user?.id])

  // Handle Mission Claim Functionality via Secure Server-Validated RPC
  const handleClaim = async (mission: MissionView) => {
    if (!user?.id || claimingSlug) return
    setClaimingSlug(mission.slug)
    setClaimFeedback(null)

    // Optimistic UI update
    setMissions((prev) =>
      prev.map((m) => (m.id === mission.id ? { ...m, is_claimed: true } : m))
    )

    try {
      const { data, error } = await supabase.rpc('claim_mission', {
        p_mission_slug: mission.slug,
      })

      const claimResult = data as {
        success?: boolean
        message?: string
        new_balance?: number
        coins_awarded?: number
      } | null

      if (error || !claimResult?.success) {
        const errMsg = claimResult?.message || error?.message || 'Gagal mengklaim misi'
        console.warn('[MissionsPage] claim_mission failed:', errMsg)
        setClaimFeedback({ type: 'error', message: errMsg })
        // Rollback optimistic update
        setMissions((prev) =>
          prev.map((m) => (m.id === mission.id ? { ...m, is_claimed: false } : m))
        )
        return
      }

      // Success: update balance from server returned new_balance
      if (claimResult.new_balance !== undefined) {
        setCoinBalance({
          id: user.id,
          user_id: user.id,
          balance: claimResult.new_balance,
          updated_at: new Date().toISOString(),
        })
      }
      setClaimFeedback({
        type: 'success',
        message: claimResult.message || `Selamat! Kamu mendapatkan +${mission.reward_coins} Credits.`,
      })
    } catch (err: any) {
      console.error('[MissionsPage] Unexpected claim error:', err)
      setClaimFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' })
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, is_claimed: false } : m))
      )
    } finally {
      setClaimingSlug(null)
    }
  }

  // Filtered Missions by Tab
  const filteredMissions = useMemo(() => {
    if (activeTab === 'all') return missions
    if (activeTab === 'daily') return missions.filter((m) => m.type === 'daily')
    if (activeTab === 'weekly') return missions.filter((m) => m.type === 'weekly')
    if (activeTab === 'one_time') return missions.filter((m) => m.type === 'one_time' || m.type === 'streak' || m.type === 'social')
    return missions
  }, [missions, activeTab])

  // Ready-to-claim count
  const readyCount = useMemo(() => {
    return missions.filter((m) => !m.is_claimed && m.progress >= m.target).length
  }, [missions])

  const currentBalanceDisplay = coinBalance?.balance ?? 0

  return (
    <div className="missions-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Misi & Hadiah Credits</h1>
        <p className="page-subtitle">
          Selesaikan aktivitas harian dan tantangan mingguan untuk mengumpulkan AI Credits gratis di Skincluv!
        </p>
      </div>

      {/* Full-Width 2-Column Grid Layout */}
      <div className="missions-grid">
        {/* Left Column: Credit Summary & Info Card */}
        <div className="missions-left-col">
          {/* Credit Balance Banner Card */}
          <div className="coin-banner-card stich-bento-card">
            <div className="banner-top">
              <div className="coin-icon-wrapper">
                <Coins size={32} className="text-amber-coin" />
              </div>
              <div>
                <span className="banner-meta">Saldo Credits Saat Ini</span>
                <div className="banner-amount">
                  {currentBalanceDisplay} <span className="denom">Credits</span>
                </div>
              </div>
            </div>

            <div className="banner-bottom mt-md">
              {readyCount > 0 ? (
                <span className="badge-ready-claim">
                  <Zap size={14} /> Ada {readyCount} Misi Siap Diklaim!
                </span>
              ) : (
                <span className="badge-amber">
                  <Sparkles size={14} /> Akses Gratis ke Fitur AI
                </span>
              )}
            </div>
          </div>

          <div className="stich-bento-card reward-info-card">
            <h3>
              <Gift size={18} className="text-amber" /> Manfaat AI Credits
            </h3>
            <p>Credits yang kamu kumpulkan dapat digunakan langsung untuk seluruh fitur cerdas:</p>
            <ul className="reward-info-list">
              <li>
                <div className="ril-icon"><ScanFace size={15} /></div>
                <span><strong>Scan Wajah AI</strong> (5 Credits / scan)</span>
              </li>
              <li>
                <div className="ril-icon"><FlaskConical size={15} /></div>
                <span><strong>Analisis Komposisi Skincare</strong> (3 Credits / scan)</span>
              </li>
              <li>
                <div className="ril-icon"><MessageSquare size={15} /></div>
                <span><strong>Konsultasi Skinsistant AI</strong> (1 Credit / pesan)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Mission Tasks List */}
        <div className="missions-right-col">
          <div className="missions-list-card stich-bento-card">
            <div className="card-title-row">
              <div className="ctr-left">
                <h3>
                  <Trophy size={18} className="text-amber" /> Daftar Misi & Tantangan
                </h3>
              </div>
              <span className="reset-tag">
                <Calendar size={13} /> Reset 00:00 WIB
              </span>
            </div>

            {/* Mission Category Tabs */}
            <div className="mission-tabs-bar">
              <button
                className={`mission-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Semua ({missions.length})
              </button>
              <button
                className={`mission-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                onClick={() => setActiveTab('daily')}
              >
                Harian ({missions.filter((m) => m.type === 'daily').length})
              </button>
              <button
                className={`mission-tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveTab('weekly')}
              >
                Mingguan ({missions.filter((m) => m.type === 'weekly').length})
              </button>
              <button
                className={`mission-tab-btn ${activeTab === 'one_time' ? 'active' : ''}`}
                onClick={() => setActiveTab('one_time')}
              >
                Prestasi ({missions.filter((m) => m.type === 'one_time' || m.type === 'streak' || m.type === 'social').length})
              </button>
            </div>

            {claimFeedback && (
              <div className={`claim-feedback-alert ${
                claimFeedback.type === 'success' ? 'success' : 'error'
              }`}>
                {claimFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                <span>{claimFeedback.message}</span>
              </div>
            )}

            {loading ? (
              <div className="loading-state">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span>Memuat data progres misi...</span>
              </div>
            ) : filteredMissions.length === 0 ? (
              <div className="empty-tab-state">
                <Trophy size={36} className="text-muted" />
                <p>Tidak ada misi dalam kategori ini.</p>
              </div>
            ) : (
              <div className="missions-stack">
                {filteredMissions.map((m) => {
                  const isCompleted = m.progress >= m.target
                  const percent = Math.min((m.progress / m.target) * 100, 100)
                  const isDaily = m.type === 'daily'
                  const isWeekly = m.type === 'weekly'

                  return (
                    <div
                      key={m.id}
                      className={`mission-card ${
                        m.is_claimed ? 'claimed' : isCompleted ? 'ready' : 'in-progress'
                      }`}
                    >
                      <div className="mission-info">
                        <div className="mission-badge-row">
                          <span className={`mission-type-pill ${isDaily ? 'daily' : isWeekly ? 'weekly' : 'milestone'}`}>
                            {isDaily ? 'Harian' : isWeekly ? 'Mingguan' : 'Milestone'}
                          </span>
                          <h4>{m.title}</h4>
                        </div>
                        {m.description && <p className="mission-desc">{m.description}</p>}
                        
                        <div className="progress-section">
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="progress-count">
                            {m.progress} / {m.target} Selesai ({Math.round(percent)}%)
                          </span>
                        </div>
                      </div>

                      <div className="mission-action">
                        <span className="reward-tag">+{m.reward_coins} Credits</span>
                        {m.is_claimed ? (
                          <span className="btn-claimed">
                            <CheckCircle2 size={15} /> Diklaim
                          </span>
                        ) : isCompleted ? (
                          <button
                            className="btn-claim-ready"
                            disabled={claimingSlug === m.slug}
                            onClick={() => handleClaim(m)}
                          >
                            {claimingSlug === m.slug ? (
                              <>
                                <Loader2 size={13} className="animate-spin" /> Mengklaim...
                              </>
                            ) : (
                              'Klaim Hadiah'
                            )}
                          </button>
                        ) : (
                          // Shortcut link to do the task directly
                          m.action === 'face_scan' ? (
                            <Link to="/app/face-scan" className="btn-do-task">
                              <span>Mulai Scan</span> <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'ingredient_scan' ? (
                            <Link to="/app/ingredient-scan" className="btn-do-task">
                              <span>Pindai Produk</span> <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'chatbot' ? (
                            <Link to="/chatbot" className="btn-do-task">
                              <span>Tanya AI</span> <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'complete_profile' ? (
                            <Link to="/profile" className="btn-do-task">
                              <span>Isi Profil</span> <ArrowRight size={12} />
                            </Link>
                          ) : (
                            <span className="btn-in-progress">
                              Belum Selesai
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .missions-page {
          padding-bottom: 60px;
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 1.85rem;
          font-weight: 800;
          margin: 0 0 4px 0;
          color: #0f6784;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 0.9375rem;
          margin: 0;
          line-height: 1.5;
        }

        /* 2-Column Grid Layout */
        .missions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          width: 100%;
        }

        @media (min-width: 900px) {
          .missions-grid {
            grid-template-columns: 360px 1fr;
            gap: 24px;
          }
        }

        .stich-bento-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          margin-bottom: 20px;
        }

        .coin-banner-card {
          background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
          border-color: #fde68a;
        }

        .banner-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .coin-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .text-amber-coin {
          color: #d97706;
        }

        .banner-meta {
          font-size: 0.75rem;
          font-weight: 700;
          color: #92400e;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .banner-amount {
          font-size: 2.25rem;
          font-weight: 800;
          color: #b45309;
          line-height: 1;
          margin-top: 2px;
        }

        .denom {
          font-size: 0.9375rem;
          color: #78350f;
          font-weight: 600;
        }

        .badge-ready-claim {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          animation: pulseGlow 1.5s infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 10px 2px rgba(16, 185, 129, 0.4); }
        }

        .badge-amber {
          background: #fef3c7;
          color: #92400e;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #fde68a;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .reward-info-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .reward-info-card p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0 0 14px 0;
          line-height: 1.45;
        }

        .reward-info-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .reward-info-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8125rem;
          color: #334155;
        }

        .ril-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #eaf4fa;
          color: #0f6784;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }

        .ctr-left h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .text-amber {
          color: #d97706;
        }

        .reset-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 5px;
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 12px;
        }

        /* MISSION TABS */
        .mission-tabs-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
        }

        .mission-tab-btn {
          background: none;
          border: none;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .mission-tab-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .mission-tab-btn.active {
          background: #0f6784;
          color: #ffffff;
        }

        .claim-feedback-alert {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .claim-feedback-alert.success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .claim-feedback-alert.error {
          background: #fff1f2;
          color: #9f1239;
          border: 1px solid #fecdd3;
        }

        .loading-state, .empty-tab-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 0;
          font-size: 0.875rem;
          color: #64748b;
        }

        .missions-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mission-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .mission-card.claimed {
          opacity: 0.6;
          background: #ffffff;
        }

        .mission-card.ready {
          border-color: #10b981;
          background: #f0fdf4;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
        }

        .mission-info {
          flex: 1;
          min-width: 0;
        }

        .mission-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .mission-type-pill {
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 2px 7px;
          border-radius: 8px;
        }

        .mission-type-pill.daily {
          background: #e0f2fe;
          color: #0369a1;
        }

        .mission-type-pill.weekly {
          background: #fef3c7;
          color: #b45309;
        }

        .mission-type-pill.milestone {
          background: #ede9fe;
          color: #6d28d9;
        }

        .mission-info h4 {
          font-size: 0.9375rem;
          margin: 0;
          color: #0f172a;
          font-weight: 700;
        }

        .mission-desc {
          font-size: 0.78125rem;
          color: #64748b;
          margin: 4px 0 10px 0;
          line-height: 1.45;
        }

        .progress-section {
          max-width: 280px;
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: #0f6784;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .mission-card.ready .progress-bar-fill {
          background: #10b981;
        }

        .progress-count {
          font-size: 0.6875rem;
          color: #64748b;
          font-weight: 600;
          display: block;
          margin-top: 4px;
        }

        .mission-action {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .reward-tag {
          font-size: 0.875rem;
          font-weight: 800;
          color: #d97706;
        }

        .btn-claimed {
          font-size: 0.75rem;
          font-weight: 700;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #ecfdf5;
          border-radius: 8px;
        }

        .btn-claim-ready {
          background: #10b981;
          color: #ffffff;
          border: none;
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-claim-ready:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .btn-do-task {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #0f6784;
          color: #0f6784;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-do-task:hover {
          background: #0f6784;
          color: #ffffff;
        }

        .btn-in-progress {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
          padding: 5px 10px;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .mt-md {
          margin-top: 14px;
        }
      `}</style>
    </div>
  )
}

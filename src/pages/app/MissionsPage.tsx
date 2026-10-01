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
  ArrowRight,
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
    <div className="v0-page-container animate-fade-in">
      <div className="v0-profile-form-header" style={{ marginBottom: '24px', textAlign: 'left' }}>
        <h1 className="v0-profile-form-main-title">Misi &amp; Hadiah Credits</h1>
        <p className="v0-profile-form-main-sub">
          Selesaikan aktivitas harian dan tantangan mingguan untuk mengumpulkan AI Credits gratis di Skincluv!
        </p>
      </div>

      {/* Full-Width 2-Column Grid Layout */}
      <div className="v0-missions-grid">
        {/* Left Column: Credit Summary & Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Credit Balance Banner Card */}
          <div className="v0-credit-banner">
            <div className="v0-credit-banner-top">
              <div className="v0-credit-icon-box">
                <Coins size={30} />
              </div>
              <div>
                <span className="v0-credit-banner-meta">Saldo Credits Saat Ini</span>
                <div className="v0-credit-banner-amount">
                  {currentBalanceDisplay} <span className="v0-credit-banner-denom">Credits</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
              {readyCount > 0 ? (
                <span className="v0-badge optimal v0-pulse-claim">
                  <Zap size={13} /> Ada {readyCount} Misi Siap Diklaim!
                </span>
              ) : (
                <span className="v0-badge attention">
                  <Sparkles size={13} /> Akses Gratis ke Fitur AI
                </span>
              )}
            </div>
          </div>

          <div className="v0-profile-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gift size={18} style={{ color: 'var(--color-status-attention)' }} /> Manfaat AI Credits
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-soft)', margin: '0 0 14px', lineHeight: 1.45 }}>
              Credits yang kamu kumpulkan dapat digunakan langsung untuk seluruh fitur cerdas:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--color-ink)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--color-teal-soft)', color: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ScanFace size={15} />
                </div>
                <span><strong>Scan Wajah AI</strong> (5 Credits / scan)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--color-ink)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--color-teal-soft)', color: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FlaskConical size={15} />
                </div>
                <span><strong>Analisis Komposisi Skincare</strong> (3 Credits / scan)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--color-ink)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--color-teal-soft)', color: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageSquare size={15} />
                </div>
                <span><strong>Konsultasi Skinsistant AI</strong> (1 Credit / pesan)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Mission Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="v0-profile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} style={{ color: 'var(--color-status-attention)' }} /> Daftar Misi &amp; Tantangan
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-soft)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                <Calendar size={13} /> Reset 00:00 WIB
              </span>
            </div>

            {/* Mission Category Tabs */}
            <div className="v0-tab-bar">
              <button
                type="button"
                className={`v0-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Semua ({missions.length})
              </button>
              <button
                type="button"
                className={`v0-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                onClick={() => setActiveTab('daily')}
              >
                Harian ({missions.filter((m) => m.type === 'daily').length})
              </button>
              <button
                type="button"
                className={`v0-tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveTab('weekly')}
              >
                Mingguan ({missions.filter((m) => m.type === 'weekly').length})
              </button>
              <button
                type="button"
                className={`v0-tab-btn ${activeTab === 'one_time' ? 'active' : ''}`}
                onClick={() => setActiveTab('one_time')}
              >
                Prestasi ({missions.filter((m) => m.type === 'one_time' || m.type === 'streak' || m.type === 'social').length})
              </button>
            </div>

            {claimFeedback && (
              <div className={`v0-profile-message ${claimFeedback.type === 'success' ? 'success' : 'error'} animate-fade-in`} style={{ marginBottom: '16px' }}>
                {claimFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                <span>{claimFeedback.message}</span>
              </div>
            )}

            {loading ? (
              <div className="v0-loading-state">
                <Loader2 size={24} className="animate-spin text-brand" />
                <span>Memuat data progres misi...</span>
              </div>
            ) : filteredMissions.length === 0 ? (
              <div className="v0-empty-state">
                <Trophy size={36} className="v0-empty-icon" />
                <p>Tidak ada misi dalam kategori ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredMissions.map((m) => {
                  const isCompleted = m.progress >= m.target
                  const percent = Math.min((m.progress / m.target) * 100, 100)
                  const isDaily = m.type === 'daily'
                  const isWeekly = m.type === 'weekly'

                  return (
                    <div
                      key={m.id}
                      className={`v0-mission-card ${
                        m.is_claimed ? 'claimed' : isCompleted ? 'ready' : 'in-progress'
                      }`}
                    >
                      <div className="v0-mission-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span className={`v0-badge ${isDaily ? 'optimal' : isWeekly ? 'warning' : 'neutral'}`}>
                            {isDaily ? 'Harian' : isWeekly ? 'Mingguan' : 'Milestone'}
                          </span>
                          <h4 className="v0-mission-title">{m.title}</h4>
                        </div>
                        {m.description && <p className="v0-mission-desc">{m.description}</p>}

                        <div style={{ maxWidth: '280px' }}>
                          <div className="v0-progress-bar-bg">
                            <div
                              className="v0-progress-bar-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="v0-progress-count">
                            {m.progress} / {m.target} Selesai ({Math.round(percent)}%)
                          </span>
                        </div>
                      </div>

                      <div className="v0-mission-action">
                        <span className="v0-reward-tag">+{m.reward_coins} Credits</span>
                        {m.is_claimed ? (
                          <span className="v0-btn-claimed">
                            <CheckCircle2 size={14} /> Diklaim
                          </span>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            className="v0-btn-claim-ready"
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
                          m.action === 'face_scan' ? (
                            <Link to="/app/face-scan" className="v0-btn-do-task">
                              <span>Mulai Scan</span> <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'ingredient_scan' ? (
                            <Link to="/app/ingredient-scan" className="v0-btn-do-task">
                              <span>Pindai Produk</span> <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'chatbot' ? (
                            <Link to="/chatbot" className="v0-btn-do-task">
                              <span>Tanya AI</span> <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'complete_profile' ? (
                            <Link to="/profile" className="v0-btn-do-task">
                              <span>Isi Profil</span> <ArrowRight size={12} />
                            </Link>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 600, padding: '5px 10px', background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
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
    </div>
  )
}

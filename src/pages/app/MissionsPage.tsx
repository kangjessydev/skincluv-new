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
    <div className="cluv-page">
      <div className="cluv-mb-6">
        <h1 className="cluv-title-page">Misi &amp; Hadiah Credits</h1>
        <p className="cluv-caption cluv-text-muted">
          Selesaikan aktivitas harian dan tantangan mingguan untuk mengumpulkan AI Credits gratis di Skincluv!
        </p>
      </div>

      {/* Full-Width 2-Column Grid Layout */}
      <div className="cluv-missions-layout">
        {/* Left Column: Credit Summary & Info Card */}
        <div className="cluv-flex-col cluv-gap-4">
          {/* Credit Balance Banner Card */}
          <div className="cluv-card is-highlight">
            <div className="cluv-flex-row cluv-items-center cluv-gap-4">
              <div className="cluv-card-icon-wrap is-lg is-gold">
                <Coins size={30} />
              </div>
              <div>
                <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Saldo Credits Saat Ini</span>
                <div className="cluv-title-hero cluv-text-dark cluv-m-0">
                  {currentBalanceDisplay} <span className="cluv-body cluv-font-bold cluv-text-muted">Credits</span>
                </div>
              </div>
            </div>

            <div className="cluv-mt-4">
              {readyCount > 0 ? (
                <span className="cluv-badge is-teal cluv-animate-pulse">
                  <Zap size={13} /> Ada {readyCount} Misi Siap Diklaim!
                </span>
              ) : (
                <span className="cluv-badge is-gold">
                  <Sparkles size={13} /> Akses Gratis ke Fitur AI
                </span>
              )}
            </div>
          </div>

          <div className="cluv-card">
            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-2">
              <Gift size={18} className="cluv-text-gold" />
              <h3 className="cluv-title-card cluv-m-0">Manfaat AI Credits</h3>
            </div>
            <p className="cluv-caption cluv-text-muted cluv-mb-4">
              Credits yang kamu kumpulkan dapat digunakan langsung untuk seluruh fitur cerdas:
            </p>
            <ul className="cluv-flex-col cluv-gap-3 cluv-p-0 cluv-m-0 cluv-list-none">
              <li className="cluv-flex-row cluv-items-center cluv-gap-3 cluv-caption cluv-text-dark">
                <div className="cluv-card-icon-wrap is-sm is-teal">
                  <ScanFace size={15} />
                </div>
                <span><strong>Observasi Visual Wajah</strong> (5 Credits / scan)</span>
              </li>
              <li className="cluv-flex-row cluv-items-center cluv-gap-3 cluv-caption cluv-text-dark">
                <div className="cluv-card-icon-wrap is-sm is-teal">
                  <FlaskConical size={15} />
                </div>
                <span><strong>Analisis Komposisi Skincare</strong> (3 Credits / scan)</span>
              </li>
              <li className="cluv-flex-row cluv-items-center cluv-gap-3 cluv-caption cluv-text-dark">
                <div className="cluv-card-icon-wrap is-sm is-teal">
                  <MessageSquare size={15} />
                </div>
                <span><strong>Konsultasi Skinsistant AI</strong> (1 Credit / pesan)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Mission Tasks List */}
        <div className="cluv-flex-col">
          <div className="cluv-card">
            <div className="cluv-flex-between cluv-items-center cluv-flex-wrap cluv-gap-2 cluv-mb-4">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <Trophy size={18} className="cluv-text-gold" />
                <h3 className="cluv-title-card cluv-m-0">Daftar Misi &amp; Tantangan</h3>
              </div>
              <span className="cluv-badge is-slate is-sm">
                <Calendar size={13} /> Reset 00:00 WIB
              </span>
            </div>

            {/* Mission Category Tabs */}
            <div className="cluv-tabs cluv-mb-5">
              <button
                type="button"
                className={`cluv-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Semua ({missions.length})
              </button>
              <button
                type="button"
                className={`cluv-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                onClick={() => setActiveTab('daily')}
              >
                Harian ({missions.filter((m) => m.type === 'daily').length})
              </button>
              <button
                type="button"
                className={`cluv-tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveTab('weekly')}
              >
                Mingguan ({missions.filter((m) => m.type === 'weekly').length})
              </button>
              <button
                type="button"
                className={`cluv-tab-btn ${activeTab === 'one_time' ? 'active' : ''}`}
                onClick={() => setActiveTab('one_time')}
              >
                Prestasi ({missions.filter((m) => m.type === 'one_time' || m.type === 'streak' || m.type === 'social').length})
              </button>
            </div>

            {claimFeedback && (
              <div className={`cluv-card cluv-mb-4 ${claimFeedback.type === 'success' ? 'is-highlight' : 'is-danger'}`}>
                <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                  {claimFeedback.type === 'success' ? <CheckCircle2 size={16} className="cluv-text-teal" /> : <Sparkles size={16} className="cluv-text-rose" />}
                  <span className="cluv-caption cluv-font-bold">{claimFeedback.message}</span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
                <Loader2 size={24} className="animate-spin cluv-text-teal cluv-mx-auto cluv-mb-2" />
                <span className="cluv-caption cluv-text-muted">Memuat data progres misi...</span>
              </div>
            ) : filteredMissions.length === 0 ? (
              <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
                <Trophy size={36} className="cluv-text-muted cluv-mx-auto cluv-mb-2" />
                <p className="cluv-body cluv-text-muted cluv-m-0">Tidak ada misi dalam kategori ini.</p>
              </div>
            ) : (
              <div className="cluv-flex-col cluv-gap-3">
                {filteredMissions.map((m) => {
                  const isCompleted = m.progress >= m.target
                  const percent = Math.min((m.progress / m.target) * 100, 100)
                  const isDaily = m.type === 'daily'
                  const isWeekly = m.type === 'weekly'

                  return (
                    <div
                      key={m.id}
                      className={`cluv-mission-item ${
                        m.is_claimed ? 'is-claimed' : isCompleted ? 'is-ready' : ''
                      }`}
                    >
                      <div className="cluv-mission-item-main">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-1 cluv-flex-wrap">
                          <span className={`cluv-badge is-sm ${isDaily ? 'is-teal' : isWeekly ? 'is-gold' : 'is-slate'}`}>
                            {isDaily ? 'Harian' : isWeekly ? 'Mingguan' : 'Milestone'}
                          </span>
                          <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">{m.title}</h4>
                        </div>
                        {m.description && <p className="cluv-micro cluv-text-muted cluv-mb-2 cluv-mt-1">{m.description}</p>}

                        <div className="cluv-max-w-xs">
                          <div className="cluv-progress-track">
                            <div
                              className={`cluv-progress-bar ${isCompleted ? 'is-optimal' : ''}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="cluv-micro cluv-text-muted cluv-mt-1 cluv-block">
                            {m.progress} / {m.target} Selesai ({Math.round(percent)}%)
                          </span>
                        </div>
                      </div>

                      <div className="cluv-mission-item-action">
                        <span className="cluv-font-bold cluv-text-gold">+{m.reward_coins} Credits</span>
                        {m.is_claimed ? (
                          <span className="cluv-badge is-teal is-sm">
                            <CheckCircle2 size={13} /> Diklaim
                          </span>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            className="cluv-btn is-primary is-sm"
                            disabled={claimingSlug === m.slug}
                            onClick={() => handleClaim(m)}
                          >
                            {claimingSlug === m.slug ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Mengklaim...</span>
                              </>
                            ) : (
                              'Klaim Hadiah'
                            )}
                          </button>
                        ) : (
                          m.action === 'face_scan' ? (
                            <Link to="/face-scan" className="cluv-btn is-outline is-sm">
                              <span>Mulai Scan</span>
                              <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'ingredient_scan' ? (
                            <Link to="/ingredient-scan" className="cluv-btn is-outline is-sm">
                              <span>Pindai Produk</span>
                              <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'chatbot' ? (
                            <Link to="/chatbot" className="cluv-btn is-outline is-sm">
                              <span>Tanya AI</span>
                              <ArrowRight size={12} />
                            </Link>
                          ) : m.action === 'complete_profile' ? (
                            <Link to="/profile" className="cluv-btn is-outline is-sm">
                              <span>Isi Profil</span>
                              <ArrowRight size={12} />
                            </Link>
                          ) : (
                            <span className="cluv-badge is-slate is-sm">
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

// src/pages/app/MissionsPage.tsx
// Data-bound Missions & Rewards Page — Connected to missions, user_missions & coin_transactions

import { useState, useEffect, useMemo, useRef } from 'react'
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
  Filter,
  ChevronDown,
  Check,
  Flame,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge, Toast } from '@/components/ui'

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

function getMissionVisual(action?: string) {
  if (action === 'face_scan') return { icon: ScanFace, color: 'is-teal' }
  if (action === 'ingredient_scan') return { icon: FlaskConical, color: 'is-blue' }
  if (action === 'chatbot') return { icon: MessageSquare, color: 'is-purple' }
  return { icon: Trophy, color: 'is-gold' }
}

export default function MissionsPage() {
  const { user, coinBalance, setCoinBalance } = useAuthStore()
  const [missions, setMissions] = useState<MissionView[]>(DEFAULT_MISSIONS)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<MissionCategory>('all')
  const [claimingSlug, setClaimingSlug] = useState<string | null>(null)
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [totalEarned, setTotalEarned] = useState<number>(0)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
    }
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isFilterDropdownOpen])

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

        // 3. Query total positive credits earned from coin_transactions
        const { data: coinTx } = await supabase
          .from('coin_transactions')
          .select('amount')
          .eq('user_id', user.id)
          .gt('amount', 0)

        if (coinTx && coinTx.length > 0) {
          const sum = coinTx.reduce((acc, curr) => acc + (curr.amount || 0), 0)
          setTotalEarned(sum)
        } else {
          setTotalEarned(coinBalance?.balance || 387)
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
  }, [user?.id, coinBalance?.balance])

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
      const coinsAdded = claimResult.coins_awarded || mission.reward_coins
      setTotalEarned((prev) => prev + coinsAdded)

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

  // Daily Routine Gamification stats
  const dailyMissions = useMemo(() => missions.filter((m) => m.type === 'daily'), [missions])
  const completedDailyCount = useMemo(() => dailyMissions.filter((m) => m.progress >= m.target).length, [dailyMissions])
  const totalDailyCount = dailyMissions.length || 3
  const dailyPercent = Math.round((completedDailyCount / Math.max(totalDailyCount, 1)) * 100)

  // Filter Categories for Tabs & Dropdown
  const filterTabs = useMemo(() => [
    { key: 'all' as MissionCategory, label: 'Semua', count: missions.length },
    { key: 'daily' as MissionCategory, label: 'Harian', count: dailyMissions.length },
    { key: 'weekly' as MissionCategory, label: 'Mingguan', count: missions.filter((m) => m.type === 'weekly').length },
    { key: 'one_time' as MissionCategory, label: 'Prestasi', count: missions.filter((m) => m.type === 'one_time' || m.type === 'streak' || m.type === 'social').length },
  ], [missions, dailyMissions])

  const activeTabObj = useMemo(() => {
    return filterTabs.find((t) => t.key === activeTab) || filterTabs[0]
  }, [filterTabs, activeTab])

  // Special Login Mission for Gamified Streak Timeline
  const loginMission = useMemo(() => missions.find((m) => m.slug === 'daily_login'), [missions])

  // Mobile regular feed (hides daily_login so it is not shown twice)
  const mobileFeedMissions = useMemo(() => {
    return filteredMissions.filter((m) => m.slug !== 'daily_login')
  }, [filteredMissions])

  // 7-Day Gamified Check-in Days
  const checkinDays = useMemo(() => {
    const isClaimedToday = loginMission?.is_claimed ?? false
    return [
      { day: 1, label: 'H1', reward: '+1', isClaimed: true },
      { day: 2, label: 'H2', reward: '+2', isClaimed: true },
      { day: 3, label: 'H3', reward: '+2', isToday: true, isClaimed: isClaimedToday },
      { day: 4, label: 'H4', reward: '+3', isLocked: true },
      { day: 5, label: 'H5', reward: '+3', isLocked: true },
      { day: 6, label: 'H6', reward: '+4', isLocked: true },
      { day: 7, label: 'H7', reward: '+10', isGift: true, isLocked: true },
    ]
  }, [loginMission?.is_claimed])

  const currentBalanceDisplay = coinBalance?.balance ?? 0

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* =====================================================================
          1. DESKTOP VIEW (> 879px): Standard 2-Column Missions Layout
          ===================================================================== */}
      <div className="cluv-desktop-missions">
        <div className="cluv-mb-6">
          <h1 className="cluv-title-page">Misi &amp; Hadiah Credits</h1>
          <p className="cluv-caption cluv-text-muted">
            Selesaikan aktivitas harian dan tantangan mingguan untuk mengumpulkan AI Credits gratis di Skincluv!
          </p>
        </div>

        <div className="cluv-missions-layout">
          {/* Left Column: Credit Summary & Info Card */}
          <div className="cluv-flex-col cluv-gap-4">
            <div className="cluv-card is-highlight">
              <div className="cluv-flex-row cluv-items-center cluv-gap-4">
                <div className="cluv-card-icon-wrap is-lg is-gold">
                  <Coins size={30} />
                </div>
                <div>
                  <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Saldo Credits Saat Ini</span>
                  <div className="cluv-title-hero cluv-text-dark cluv-m-0 cluv-tabular-nums">
                    {currentBalanceDisplay.toLocaleString('id-ID')} <span className="cluv-body cluv-font-bold cluv-text-muted">Credits</span>
                  </div>
                </div>
              </div>

              <div className="cluv-mt-4">
                {readyCount > 0 ? (
                  <Badge variant="teal" pulse icon={<Zap size={13} />}>
                    Ada {readyCount} Misi Siap Diklaim!
                  </Badge>
                ) : (
                  <Badge variant="gold" icon={<Sparkles size={13} />}>
                    Akses Gratis ke Fitur AI
                  </Badge>
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
                <Badge variant="slate" size="sm" icon={<Calendar size={13} />}>
                  Reset 00:00 WIB
                </Badge>
              </div>

              {/* Mission Category Tabs */}
              <div className="cluv-tabs cluv-mb-5">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`cluv-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

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
                            <span className="cluv-micro cluv-text-muted cluv-mt-1 cluv-block cluv-tabular-nums">
                              {m.progress} / {m.target} Selesai ({Math.round(percent)}%)
                            </span>
                          </div>
                        </div>

                        <div className="cluv-mission-item-action">
                          <span className="cluv-font-bold cluv-text-gold cluv-tabular-nums">+{m.reward_coins} Credits</span>
                          {m.is_claimed ? (
                            <Badge variant="teal" size="sm" icon={<CheckCircle2 size={13} />}>
                              Diklaim
                            </Badge>
                          ) : isCompleted ? (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={claimingSlug === m.slug}
                              onClick={() => handleClaim(m)}
                            >
                              Klaim Hadiah
                            </Button>
                          ) : (
                            m.action === 'face_scan' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                iconRight={<ArrowRight size={12} />}
                                to="/face-scan"
                              >
                                Mulai Scan
                              </Button>
                            ) : m.action === 'ingredient_scan' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                iconRight={<ArrowRight size={12} />}
                                to="/ingredient-scan"
                              >
                                Pindai Produk
                              </Button>
                            ) : m.action === 'chatbot' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                iconRight={<ArrowRight size={12} />}
                                to="/chatbot"
                              >
                                Tanya AI
                              </Button>
                            ) : m.action === 'complete_profile' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                iconRight={<ArrowRight size={12} />}
                                to="/profile"
                              >
                                Isi Profil
                              </Button>
                            ) : (
                              <Badge variant="slate" size="sm">
                                Belum Selesai
                              </Badge>
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

      {/* =====================================================================
          2. MOBILE-FIRST VIEW (<= 879px): Pure Feed & Standalone Mission Cards
          ===================================================================== */}
      <div className="cluv-mobile-missions">
        {/* 1. Bento Wallet Card (.cluv-bento-wallet) */}
        <div className="cluv-bento-wallet cluv-mb-3">
          <div className="cluv-bento-wallet-top">
            <div className="cluv-bento-wallet-balance-wrap">
              <span className="cluv-bento-wallet-tag">
                <Zap size={13} className="cluv-text-gold" />
                <span>TOTAL SALDO AI CREDITS</span>
              </span>
              <div className="cluv-bento-wallet-val cluv-tabular-nums">
                <span>{currentBalanceDisplay.toLocaleString('id-ID')}</span>
                <span className="cluv-bento-wallet-unit">Credits</span>
              </div>
            </div>

            {readyCount > 0 ? (
              <Badge variant="teal" pulse icon={<Zap size={12} />}>
                {readyCount} Siap Klaim
              </Badge>
            ) : (
              <Badge variant="slate" size="sm" icon={<Calendar size={12} />}>
                Reset 00:00
              </Badge>
            )}
          </div>

          <div className="cluv-bento-wallet-stats">
            <div className="cluv-bento-wallet-stat-item">
              <span className="cluv-bento-wallet-stat-label">Total Diperoleh</span>
              <span className="cluv-bento-wallet-stat-val is-income cluv-tabular-nums">
                +{totalEarned.toLocaleString('id-ID')} Credits
              </span>
            </div>

            <div className="cluv-bento-wallet-stat-item">
              <span className="cluv-bento-wallet-stat-label">Progres Misi Hari Ini</span>
              <span className="cluv-bento-wallet-stat-val cluv-tabular-nums" style={{ color: 'var(--cluv-teal)' }}>
                {completedDailyCount} dari {totalDailyCount} ({dailyPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Gamified 7-Day Daily Check-in Streak Card */}
        <div className="cluv-checkin-streak-card cluv-mb-2">
          <div className="cluv-checkin-header">
            <div className="cluv-checkin-title-wrap">
              <h4 className="cluv-checkin-title">
                <Flame size={16} className="cluv-text-gold" />
                <span>Check-in Harian (Streak)</span>
              </h4>
              <p className="cluv-checkin-subtitle">Login tiap hari untuk kumpulkan bonus berlipat!</p>
            </div>
            <Badge variant="gold" size="sm">
              Streak Aktif 🔥
            </Badge>
          </div>

          <div className="cluv-checkin-timeline">
            {checkinDays.map((d) => (
              <div key={d.day} className="cluv-checkin-day">
                <span className="cluv-checkin-day-label">{d.label}</span>
                <div
                  className={`cluv-checkin-bubble ${
                    d.isClaimed
                      ? 'is-claimed'
                      : d.isToday
                      ? 'is-active'
                      : d.isGift
                      ? 'is-gift'
                      : 'is-locked'
                  }`}
                >
                  {d.isClaimed ? (
                    <Check size={14} strokeWidth={2.6} />
                  ) : d.isGift ? (
                    <Gift size={14} />
                  ) : (
                    <span className="cluv-tabular-nums">{d.reward}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="cluv-checkin-action-wrap">
            {loginMission?.is_claimed ? (
              <Button variant="outline" size="sm" block disabled>
                <CheckCircle2 size={14} className="cluv-text-teal cluv-mr-1" />
                Sudah Check-in Hari Ini (Reset 00:00)
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                block
                loading={claimingSlug === loginMission?.slug}
                onClick={() => loginMission && handleClaim(loginMission)}
              >
                <Sparkles size={14} className="cluv-mr-1" />
                Check-in Sekarang (+{loginMission?.reward_coins ?? 2} Credits) ⚡
              </Button>
            )}
          </div>
        </div>

        {/* 3. Header & Dropdown Filter Bar */}
        <div className="cluv-flex-between cluv-items-center cluv-mt-1 cluv-mb-1">
          <span className="cluv-font-bold cluv-text-dark cluv-text-sm">
            Daftar Misi &amp; Hadiah
          </span>
          <div className="cluv-filter-dropdown-wrap" ref={dropdownRef} style={{ width: 'auto' }}>
            <button
              type="button"
              className={`cluv-filter-trigger-btn ${activeTab !== 'all' ? 'is-active' : ''}`}
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              aria-expanded={isFilterDropdownOpen}
              aria-label={`Filter misi: ${activeTabObj.label}`}
            >
              <Filter size={13} className={activeTab !== 'all' ? 'cluv-text-teal' : ''} />
              <span className="cluv-caption cluv-font-medium">{activeTabObj.label} ({activeTabObj.count})</span>
              <ChevronDown size={13} className="cluv-text-muted" />
            </button>

            {isFilterDropdownOpen && (
              <div className="cluv-filter-dropdown-menu" style={{ right: 0, left: 'auto' }} role="listbox">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`cluv-filter-dropdown-item ${activeTab === tab.key ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab.key)
                      setIsFilterDropdownOpen(false)
                    }}
                    role="option"
                    aria-selected={activeTab === tab.key}
                  >
                    <span>{tab.label}</span>
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                      <span className="cluv-tab-badge cluv-tabular-nums">{tab.count}</span>
                      {activeTab === tab.key && <Check size={14} className="cluv-text-teal" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Streamlined Simple Mission Task Cards */}
        {loading ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
            <Loader2 size={24} className="animate-spin cluv-text-teal cluv-mx-auto cluv-mb-2" />
            <span className="cluv-caption cluv-text-muted">Memuat data misi...</span>
          </div>
        ) : mobileFeedMissions.length === 0 ? (
          <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
            <Trophy size={36} className="cluv-text-muted cluv-mx-auto cluv-mb-2" />
            <p className="cluv-body cluv-text-muted cluv-m-0">Tidak ada misi dalam kategori ini.</p>
          </div>
        ) : (
          <div className="cluv-flex-col cluv-gap-2.5">
            {mobileFeedMissions.map((m) => {
              const isCompleted = m.progress >= m.target

              return (
                <div
                  key={m.id}
                  className={`cluv-simple-mission-card ${
                    m.is_claimed ? 'is-claimed' : isCompleted ? 'is-ready' : ''
                  }`}
                >
                  <div className="cluv-simple-mission-info">
                    <h4 className="cluv-simple-mission-title">{m.title}</h4>
                    {m.description && (
                      <p className="cluv-simple-mission-desc">{m.description}</p>
                    )}
                    <div className="cluv-simple-mission-reward cluv-tabular-nums">
                      <Sparkles size={13} className="cluv-text-gold" />
                      <span>+{m.reward_coins} Credits</span>
                    </div>
                  </div>

                  <div className="cluv-simple-mission-action">
                    {m.is_claimed ? (
                      <Badge variant="teal" size="sm" icon={<CheckCircle2 size={13} />}>
                        Diklaim
                      </Badge>
                    ) : isCompleted ? (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={claimingSlug === m.slug}
                        onClick={() => handleClaim(m)}
                      >
                        Klaim ⚡
                      </Button>
                    ) : (
                      m.action === 'face_scan' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          iconRight={<ArrowRight size={12} />}
                          to="/face-scan"
                        >
                          Scan
                        </Button>
                      ) : m.action === 'ingredient_scan' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          iconRight={<ArrowRight size={12} />}
                          to="/ingredient-scan"
                        >
                          Pindai
                        </Button>
                      ) : m.action === 'chatbot' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          iconRight={<ArrowRight size={12} />}
                          to="/chatbot"
                        >
                          Tanya AI
                        </Button>
                      ) : m.action === 'complete_profile' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          iconRight={<ArrowRight size={12} />}
                          to="/profile"
                        >
                          Isi Profil
                        </Button>
                      ) : (
                        <Badge variant="slate" size="sm">
                          Belum Selesai
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast Feedback Klaim Misi (Zero Layout Shift) */}
      <Toast
        isOpen={!!claimFeedback}
        onClose={() => setClaimFeedback(null)}
        variant={claimFeedback?.type === 'success' ? 'success' : 'error'}
        message={claimFeedback?.message || ''}
      />
    </div>
  )
}

// src/pages/app/MissionsPage.tsx
// Data-bound Missions & Rewards Page — Connected to missions, user_missions & coin_transactions

import { useState, useEffect, useMemo } from 'react'
import {
  CheckCircle2,
  Gift,
  Sparkles,
  Trophy,
  Calendar,
  Loader2,
  ScanFace,
  FlaskConical,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Zap,
  Check,
  Flame,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge, Toast } from '@/components/ui'

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
  const [claimingSlug, setClaimingSlug] = useState<string | null>(null)
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [totalEarned, setTotalEarned] = useState<number>(0)
  const [pastStreakDays, setPastStreakDays] = useState<number>(0)

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

        // 3. Query total positive credits earned from coin_transactions & compute real daily check-in streak
        const { data: coinTx } = await supabase
          .from('coin_transactions')
          .select('amount, type, notes, created_at')
          .eq('user_id', user.id)
          .gt('amount', 0)
          .order('created_at', { ascending: false })

        if (coinTx && coinTx.length > 0) {
          const sum = coinTx.reduce((acc, curr) => acc + (curr.amount || 0), 0)
          setTotalEarned(sum)

          // Calculate consecutive daily check-in claims prior to today
          const loginClaimDates = new Set(
            coinTx
              .filter((tx) => tx.type === 'mission_reward' && String(tx.notes || '').toLowerCase().includes('login'))
              .map((tx) => new Date(tx.created_at).toDateString())
          )
          let consecutivePriorDays = 0
          const cursor = new Date()
          for (let i = 1; i <= 6; i++) {
            const d = new Date(cursor)
            d.setDate(cursor.getDate() - i)
            if (loginClaimDates.has(d.toDateString())) {
              consecutivePriorDays++
            } else {
              break
            }
          }
          setPastStreakDays(consecutivePriorDays)
        } else {
          setTotalEarned(coinBalance?.balance ?? 0)
          setPastStreakDays(0)
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

  // Ready-to-claim count
  const readyCount = useMemo(() => {
    return missions.filter((m) => !m.is_claimed && m.progress >= m.target).length
  }, [missions])

  // Daily Routine Gamification stats
  const dailyMissions = useMemo(() => missions.filter((m) => m.type === 'daily'), [missions])
  const completedDailyCount = useMemo(() => dailyMissions.filter((m) => m.progress >= m.target).length, [dailyMissions])
  const totalDailyCount = dailyMissions.length || 3
  const dailyPercent = Math.round((completedDailyCount / Math.max(totalDailyCount, 1)) * 100)

  // Special Login Mission for Gamified Streak Timeline
  const loginMission = useMemo(() => missions.find((m) => m.slug === 'daily_login'), [missions])

  // Feed missions: all active missions except daily_login (which is featured in the streak card)
  const feedMissions = useMemo(() => {
    return missions.filter((m) => m.slug !== 'daily_login')
  }, [missions])

  // 7-Day Gamified Check-in Days (computed dynamically from user's real consecutive streak)
  const checkinDays = useMemo(() => {
    const isClaimedToday = loginMission?.is_claimed ?? false
    const activeDayNumber = Math.min(7, (pastStreakDays % 7) + 1)
    const rewards = ['+1', '+2', '+2', '+3', '+3', '+4', '+10']

    return rewards.map((reward, idx) => {
      const dayNum = idx + 1
      const isPast = dayNum < activeDayNumber
      const isToday = dayNum === activeDayNumber
      const isLocked = dayNum > activeDayNumber
      return {
        day: dayNum,
        label: `H${dayNum}`,
        reward,
        isClaimed: isPast || (isToday && isClaimedToday),
        isToday,
        isLocked,
        isGift: dayNum === 7,
      }
    })
  }, [loginMission?.is_claimed, pastStreakDays])

  const currentBalanceDisplay = coinBalance?.balance ?? 0

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* 1. Page Header */}
      <div className="cluv-mb-4">
        <h1 className="cluv-title-page">Misi &amp; Hadiah Credits</h1>
        <p className="cluv-caption cluv-text-muted">
          Selesaikan aktivitas harian dan tantangan mingguan untuk mengumpulkan AI Credits gratis di Skincluv!
        </p>
      </div>

      {/* 2. Bento Wallet Card (Ukuran proporsional ~480px) */}
      <div className="cluv-bento-wallet cluv-mb-4" style={{ maxWidth: '480px', width: '100%' }}>
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

      {/* 3. Gamified 7-Day Daily Check-in Streak Banner (100% Desktop Width) */}
      <div className="cluv-checkin-streak-card cluv-mb-5" style={{ width: '100%' }}>
        {/* Header: Title, Subtitle, Streak Badge & Desktop Inline CTA */}
        <div className="cluv-checkin-header">
          <div className="cluv-checkin-title-wrap">
            <div className="cluv-flex-row cluv-items-center cluv-gap-2">
              <h4 className="cluv-checkin-title">
                <Flame size={17} className="cluv-text-gold" />
                <span>Check-in Harian (Streak)</span>
              </h4>
              <Badge variant="gold" size="sm" className="cluv-hide-mobile">
                Streak Aktif 🔥
              </Badge>
            </div>
            {/* Mobile: Streak Badge diletakkan di bawah judul */}
            <div className="cluv-hide-desktop cluv-my-1">
              <Badge variant="gold" size="sm">
                Streak Aktif 🔥
              </Badge>
            </div>
            <p className="cluv-checkin-subtitle">Login tiap hari untuk kumpulkan bonus AI Credits berlipat ganda!</p>
          </div>

          {/* Desktop Inline Action Button (Right Header) */}
          <div className="cluv-hide-mobile">
            {loginMission?.is_claimed ? (
              <Button variant="outline" size="sm" disabled>
                <CheckCircle2 size={14} className="cluv-text-teal cluv-mr-1" />
                Sudah Check-in (Reset 00:00)
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                loading={claimingSlug === loginMission?.slug}
                onClick={() => loginMission && handleClaim(loginMission)}
              >
                <Sparkles size={14} className="cluv-mr-1" />
                Check-in Sekarang (+{loginMission?.reward_coins ?? 2} Credits) ⚡
              </Button>
            )}
          </div>
        </div>

        {/* Desktop: 7 Day Quest Tiles Grid (HoYoLAB / Duolingo Web Grade) */}
        <div className="cluv-quest-tiles-grid cluv-hide-mobile">
          {checkinDays.map((d) => {
            const isDayClaimed = d.isClaimed
            const isDayToday = d.isToday
            const isDayGift = d.isGift

            return (
              <div
                key={d.day}
                className={`cluv-quest-tile ${
                  isDayClaimed
                    ? 'is-claimed'
                    : isDayToday
                    ? 'is-today'
                    : isDayGift
                    ? 'is-special'
                    : 'is-locked'
                }`}
              >
                <span className="cluv-quest-tile-day">{d.label}</span>
                <div className="cluv-quest-tile-icon-wrap">
                  {isDayClaimed ? (
                    <Check size={18} strokeWidth={2.8} />
                  ) : isDayGift ? (
                    <Gift size={18} />
                  ) : (
                    <span className="cluv-tabular-nums">{d.reward}</span>
                  )}
                </div>
                <span className="cluv-quest-tile-status">
                  {isDayClaimed
                    ? 'Klaim ✓'
                    : isDayToday
                    ? 'Hari Ini ⚡'
                    : isDayGift
                    ? 'Bonus 🎁'
                    : 'Terkunci'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Mobile: Preserved Circular Timeline Bubbles (Zero Mobile Regression) */}
        <div className="cluv-checkin-timeline cluv-hide-desktop">
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

        {/* Mobile: Preserved Bottom Full-Width Action Button */}
        <div className="cluv-checkin-action-wrap cluv-hide-desktop">
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

      {/* 4. Section Title (Tanpa Filter) */}
      <div className="cluv-flex-between cluv-items-center cluv-mt-2 cluv-mb-3">
        <h2 className="cluv-title-card cluv-m-0">
          Daftar Misi &amp; Hadiah
        </h2>
        <span className="cluv-caption cluv-text-muted cluv-tabular-nums">
          {feedMissions.length} Misi Tersedia
        </span>
      </div>

      {/* 4. Streamlined Mission Task Cards (cluv-missions-grid: 2 cols on desktop, 1 col on mobile) */}
      {loading ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
          <Loader2 size={24} className="animate-spin cluv-text-teal cluv-mx-auto cluv-mb-2" />
          <span className="cluv-caption cluv-text-muted">Memuat data misi...</span>
        </div>
      ) : feedMissions.length === 0 ? (
        <div className="cluv-card cluv-empty cluv-text-center cluv-py-8">
          <Trophy size={36} className="cluv-text-muted cluv-mx-auto cluv-mb-2" />
          <p className="cluv-body cluv-text-muted cluv-m-0">Tidak ada misi yang tersedia saat ini.</p>
        </div>
      ) : (
        <div className="cluv-missions-grid">
          {feedMissions.map((m) => {
            const isCompleted = m.progress >= m.target

            return (
              <div
                key={m.id}
                className={`cluv-simple-mission-card ${
                  m.is_claimed ? 'is-claimed' : isCompleted ? 'is-ready' : ''
                }`}
              >
                <div className="cluv-simple-mission-info">
                  <h4 className="cluv-simple-mission-title cluv-mb-1">{m.title}</h4>
                  {m.description && (
                    <p className="cluv-simple-mission-desc">{m.description}</p>
                  )}
                  {m.target > 1 && !m.is_claimed && (
                    <div className="cluv-simple-mission-progress">
                      <div className="cluv-simple-mission-progress-track">
                        <div
                          className="cluv-simple-mission-progress-fill"
                          style={{
                            width: `${Math.min(100, Math.round((m.progress / m.target) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="cluv-simple-mission-progress-text cluv-tabular-nums">
                        {m.progress}/{m.target}
                      </span>
                    </div>
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
                      <span className="cluv-hide-mobile">Klaim Hadiah ⚡</span>
                      <span className="cluv-hide-desktop">Klaim ⚡</span>
                    </Button>
                  ) : (
                    m.action === 'face_scan' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cluv-simple-mission-btn"
                        to="/face-scan"
                        aria-label="Mulai Scan"
                      >
                        <span className="cluv-hide-mobile">Mulai Scan</span>
                        <ArrowRight size={13} className="cluv-hide-mobile cluv-ml-1" />
                        <ChevronRight size={18} className="cluv-hide-desktop" />
                      </Button>
                    ) : m.action === 'ingredient_scan' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cluv-simple-mission-btn"
                        to="/ingredient-scan"
                        aria-label="Pindai Produk"
                      >
                        <span className="cluv-hide-mobile">Pindai Produk</span>
                        <ArrowRight size={13} className="cluv-hide-mobile cluv-ml-1" />
                        <ChevronRight size={18} className="cluv-hide-desktop" />
                      </Button>
                    ) : m.action === 'chatbot' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cluv-simple-mission-btn"
                        to="/chatbot"
                        aria-label="Tanya Skinsistant"
                      >
                        <span className="cluv-hide-mobile">Tanya Skinsistant</span>
                        <ArrowRight size={13} className="cluv-hide-mobile cluv-ml-1" />
                        <ChevronRight size={18} className="cluv-hide-desktop" />
                      </Button>
                    ) : m.action === 'complete_profile' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cluv-simple-mission-btn"
                        to="/profile"
                        aria-label="Lengkapi Profil"
                      >
                        <span className="cluv-hide-mobile">Lengkapi Profil</span>
                        <ArrowRight size={13} className="cluv-hide-mobile cluv-ml-1" />
                        <ChevronRight size={18} className="cluv-hide-desktop" />
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

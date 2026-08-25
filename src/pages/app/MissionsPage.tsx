// src/pages/app/MissionsPage.tsx
// Data-bound Missions & Rewards Page — Connected to missions, user_missions & coin_transactions

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Gift,
  Sparkles,
  Trophy,
  Calendar,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface MissionView {
  id: string
  slug: string
  title: string
  description: string | null
  reward_coins: number
  progress: number
  target: number
  is_claimed: boolean
}

const DEFAULT_MISSIONS: MissionView[] = [
  {
    id: 'm1',
    slug: 'first_face_scan',
    title: 'Lakukan Scan Wajah Pertama Hari Ini',
    description: 'Analisis kondisi kulit dengan kamera untuk membuka klaim koin.',
    reward_coins: 50,
    progress: 1,
    target: 1,
    is_claimed: false,
  },
  {
    id: 'm2',
    slug: 'check_ingredient',
    title: 'Cek Komposisi 1 Produk Skincare',
    description: 'Periksa keamanan bahan produk sebelum kamu gunakan.',
    reward_coins: 30,
    progress: 0,
    target: 1,
    is_claimed: false,
  },
  {
    id: 'm3',
    slug: 'consult_chatbot',
    title: 'Konsultasi 1 Kali Dengan Chatbot AI',
    description: 'Tanyakan saran perawatan kulit ke Skinsistant AI.',
    reward_coins: 20,
    progress: 1,
    target: 1,
    is_claimed: false,
  },
  {
    id: 'm4',
    slug: 'drink_water',
    title: 'Jaga Hidrasi Tubuh Hari Ini',
    description: 'Bantu kesehatan kulit dari dalam dengan minum air putih.',
    reward_coins: 10,
    progress: 4,
    target: 8,
    is_claimed: false,
  },
]

export default function MissionsPage() {
  const { user, coinBalance, setCoinBalance } = useAuthStore()
  const [missions, setMissions] = useState<MissionView[]>(DEFAULT_MISSIONS)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch Missions & User Progress from Database
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchMissionsData = async () => {
      setLoading(true)
      try {
        // 1. Query active missions from DB
        const { data: dbMissions, error: mErr } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)

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
          const mapped: MissionView[] = dbMissions.map((m) => {
            const userProg = userMissions?.find((um) => um.mission_id === m.id)
            return {
              id: m.id,
              slug: m.slug,
              title: m.name,
              description: m.description,
              reward_coins: m.coin_reward,
              progress: userProg?.current_count ?? 1, // default progress if active
              target: m.target_count ?? 1,
              is_claimed: userProg?.is_completed ?? false,
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

  // Handle Mission Claim Functionality
  const handleClaim = async (missionId: string, coins: number) => {
    if (!user?.id) return

    // Optimistic UI update
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, is_claimed: true } : m))
    )

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(missionId)

      // 1. Call credit_coins RPC (Exact signature matching live Supabase)
      const { data: updatedBal, error: rpcErr } = await supabase.rpc('credit_coins', {
        p_amount: coins,
        p_mission_id: isUuid ? missionId : null,
        p_notes: `Klaim Misi Harian +${coins} Koin`,
        p_user_id: user.id,
      })

      if (rpcErr) {
        console.warn('[MissionsPage] RPC credit_coins fallback to direct query:', rpcErr)
        // Fallback: direct insert to coin_transactions
        const { error: txErr } = await supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: coins,
          type: 'mission_reward',
          notes: `Klaim Misi Harian +${coins} Koin`,
        })

        if (txErr) {
          console.error('[MissionsPage] Gagal insert coin_transactions:', txErr)
          // Rollback optimistic update jika gagal total
          setMissions((prev) =>
            prev.map((m) => (m.id === missionId ? { ...m, is_claimed: false } : m))
          )
          return
        }

        // Direct upsert to coin_balances
        const currentBal = coinBalance?.balance ?? 0
        const newBal = currentBal + coins
        const { data: directBal } = await supabase
          .from('coin_balances')
          .upsert({
            user_id: user.id,
            balance: newBal,
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle()

        setCoinBalance(directBal ?? { id: user.id, user_id: user.id, balance: newBal, updated_at: new Date().toISOString() })
      } else if (updatedBal) {
        setCoinBalance(updatedBal)
      } else {
        const currentBal = coinBalance?.balance ?? 0
        setCoinBalance({ id: user.id, user_id: user.id, balance: currentBal + coins, updated_at: new Date().toISOString() })
      }

      // 2. Mark user_missions completed if DB mission
      if (isUuid) {
        await supabase.from('user_missions').upsert({
          user_id: user.id,
          mission_id: missionId,
          current_count: 1,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error('[MissionsPage] Unexpected claim error:', err)
    }
  }

  const currentBalanceDisplay = coinBalance?.balance ?? 0

  return (
    <div className="missions-page animate-fade-in">
      <div className="page-header">
        <h1>Misi & Hadiah Koin</h1>
        <p className="page-subtitle">
          Selesaikan tugas harian untuk mengumpulkan Koin Darurat Skincluv!
        </p>
      </div>

      {/* Full-Width 2-Column Grid Layout */}
      <div className="missions-grid">
        {/* Left Column: Coin Summary & Info Card */}
        <div className="missions-left-col">
          {/* Coin Balance Banner Card */}
          <div className="coin-banner-card stich-bento-card">
            <div className="banner-top">
              <Coins size={36} className="text-amber-500" />
              <div>
                <span className="banner-meta">Saldo Koin Saat Ini</span>
                <div className="banner-amount">
                  {currentBalanceDisplay} <span className="denom">Koin</span>
                </div>
              </div>
            </div>
            <div className="banner-bottom mt-md">
              <span className="badge-amber">
                <Sparkles size={14} /> Dapatkan Akses Fitur PRO
              </span>
            </div>
          </div>

          <div className="stich-bento-card reward-info-card">
            <h3>
              <Gift size={18} className="text-amber" /> Manfaat Koin Darurat
            </h3>
            <p>Koin yang kamu kumpulkan dari misi harian dapat digunakan untuk:</p>
            <ul className="reward-info-list">
              <li><Sparkles size={14} className="text-amber-500 inline mr-2" /> Membuka analisis wajah tambahan saat kuota gratis habis</li>
              <li><Sparkles size={14} className="text-amber-500 inline mr-2" /> Konsultasi mendalam dengan Skinsistant AI</li>
              <li><Sparkles size={14} className="text-amber-500 inline mr-2" /> Menukarkan voucher diskon langganan PRO</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Mission Tasks List */}
        <div className="missions-right-col">
          <div className="missions-list-card stich-bento-card">
            <div className="card-title-row">
              <h3>
                <Trophy size={18} className="text-amber" /> Misi Harian Kamu
              </h3>
              <span className="reset-tag">
                <Calendar size={12} /> Reset Pukul 00:00 WIB
              </span>
            </div>

            {loading ? (
              <div className="loading-state">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span>Memuat daftar misi harian...</span>
              </div>
            ) : (
              <div className="missions-stack">
                {missions.map((m) => {
                  const isCompleted = m.progress >= m.target
                  const percent = Math.min((m.progress / m.target) * 100, 100)

                  return (
                    <div
                      key={m.id}
                      className={`mission-card ${
                        m.is_claimed ? 'claimed' : isCompleted ? 'ready' : 'in-progress'
                      }`}
                    >
                      <div className="mission-info">
                        <h4>{m.title}</h4>
                        {m.description && <p className="mission-desc">{m.description}</p>}
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="progress-count">
                          {m.progress} / {m.target} Selesai
                        </span>
                      </div>

                      <div className="mission-action">
                        <span className="reward-tag">+{m.reward_coins} Koin</span>
                        {m.is_claimed ? (
                          <span className="btn-claimed">
                            <CheckCircle2 size={16} /> Diklaim
                          </span>
                        ) : isCompleted ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleClaim(m.id, m.reward_coins)}
                          >
                            Klaim
                          </button>
                        ) : (
                          <button className="btn btn-outline btn-sm" disabled>
                            Belum Selesai
                          </button>
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
        .missions-page { padding-bottom: 60px; width: 100%; }
        .page-header { margin-bottom: var(--space-xl); }
        .page-header h1 { font-size: 1.875rem; margin: 0 0 4px 0; color: var(--color-primary); font-family: var(--font-heading); }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.9375rem; margin: 0; }

        /* 2-Column Grid Layout */
        .missions-grid {
          display: grid; grid-template-columns: 1fr; gap: var(--space-lg); width: 100%;
        }
        @media (min-width: 900px) {
          .missions-grid {
            grid-template-columns: 5fr 7fr;
          }
        }

        .stich-bento-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-lg);
        }

        .coin-banner-card {
          background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
          border-color: #fde68a;
        }
        .banner-top { display: flex; align-items: center; gap: var(--space-md); }
        .coin-large-emoji { font-size: 40px; }
        .banner-meta { font-size: 0.8125rem; font-weight: 700; color: var(--color-tertiary); text-transform: uppercase; }
        .banner-amount { font-size: 2.25rem; font-weight: 800; color: var(--color-tertiary-container); font-family: var(--font-heading); line-height: 1; }
        .denom { font-size: 1rem; color: var(--color-text-muted); font-weight: 500; }
        
        .badge-amber {
          background: var(--color-tertiary-fixed); color: var(--color-tertiary); font-size: 0.75rem; font-weight: 700;
          padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid #fde68a; display: inline-flex; align-items: center; gap: 6px;
        }

        .reward-info-card h3 { font-size: 1rem; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; font-family: var(--font-heading); }
        .reward-info-card p { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0 0 12px 0; }
        .reward-info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 0.8125rem; color: var(--color-text-muted); }

        .card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
        .card-title-row h3 { font-size: 1.25rem; margin: 0; display: flex; align-items: center; gap: 8px; font-family: var(--font-heading); }
        .text-amber { color: var(--color-tertiary-container); }
        .reset-tag { font-size: 0.75rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }

        .loading-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px 0; font-size: 0.875rem; color: var(--color-text-muted); }

        .missions-stack { display: flex; flex-direction: column; gap: var(--space-sm); }
        .mission-card {
          display: flex; justify-content: space-between; align-items: center; gap: var(--space-md);
          padding: var(--space-md); border-radius: var(--radius-xl); background: var(--color-surface-container-low);
          border: 1px solid var(--color-secondary-container); transition: border-color 0.2s;
        }
        .mission-card.claimed { opacity: 0.65; }
        .mission-card.ready { border-color: var(--color-primary); background: #f0f9ff; }

        .mission-info { flex: 1; }
        .mission-info h4 { font-size: 0.9375rem; margin: 0 0 4px 0; color: var(--color-text-main); font-weight: 700; }
        .mission-desc { font-size: 0.75rem; color: var(--color-text-muted); margin: 0 0 8px 0; }
        .progress-bar-bg { width: 100%; height: 6px; background: var(--color-surface-container-high); border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--color-primary); border-radius: 3px; }
        .progress-count { font-size: 0.75rem; color: var(--color-text-muted); display: block; margin-top: 4px; }

        .mission-action { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .reward-tag { font-size: 0.875rem; font-weight: 800; color: var(--color-tertiary-container); font-family: var(--font-heading); }
        .btn-claimed { font-size: 0.75rem; font-weight: 700; color: var(--color-success); display: flex; align-items: center; gap: 4px; }
        .mt-md { margin-top: var(--space-md); }
      `}</style>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Coins, CheckCircle2, Gift, Sparkles, Trophy, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function MissionsPage() {
  const { session, coinBalance, setCoinBalance } = useAuthStore()
  const [balance, setBalance] = useState(coinBalance?.balance ?? 0)
  const [loading, setLoading] = useState(true)
  const [claimedMissions, setClaimedMissions] = useState<string[]>([])

  useEffect(() => {
    if (!session?.user) return
    const fetchData = async () => {
      // Fetch current coin balance
      const { data: coinData } = await supabase
        .from('coin_balances')
        .select('balance')
        .eq('user_id', session.user.id)
        .single()

      if (coinData) setBalance(coinData.balance)

      // Fetch claimed missions today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      const { data: txData } = await supabase
        .from('coin_transactions')
        .select('notes')
        .eq('user_id', session.user.id)
        .eq('type', 'mission_reward')
        .gte('created_at', todayStart.toISOString())

      if (txData) {
        const claimed = txData
          .map(t => t.notes)
          .filter(n => n?.startsWith('Claimed mission: '))
          .map(n => n.replace('Claimed mission: ', ''))
        
        setClaimedMissions(claimed)
      }

      setLoading(false)
    }
    fetchData()
  }, [session])

  const claimMission = async (missionSlug: string, rewardCoins: number) => {
    try {
      const { data, error } = await supabase.rpc('claim_mission', {
        p_user_id: session?.user.id,
        p_mission_slug: missionSlug,
        p_reward_coins: rewardCoins
      })
      if (error) throw error
      if (data) {
        const newBalance = balance + rewardCoins
        setBalance(newBalance)
        if (coinBalance) {
          setCoinBalance({ ...coinBalance, balance: newBalance })
        }
        setClaimedMissions(prev => [...prev, missionSlug])
        alert('Misi berhasil diklaim! Saldo koin bertambah.')
      } else {
        setClaimedMissions(prev => [...prev, missionSlug])
        alert('Misi ini sudah kamu klaim sebelumnya hari ini.')
      }
    } catch (err: any) {
      alert('Gagal klaim misi: ' + err.message)
    }
  }

  return (
    <div className="missions-page animate-fade-in">
      <div className="missions-header">
        <span className="section-badge"><Trophy size={14} /> GAMIFIKASI & REWARD</span>
        <h1>Misi Harian</h1>
        <p className="page-subtitle">Kumpulkan koin gratis setiap hari untuk membuka scan AI tambahan.</p>
      </div>

      {/* Balance Summary Card */}
      <div className="coin-summary-card glass-card">
        <div className="coin-summary-left">
          <div className="coin-circle">
            <Coins size={32} className="coin-gold" />
          </div>
          <div>
            <span className="summary-label">Saldo Koin Kamu</span>
            <div className="summary-amount">{loading ? '...' : balance} Koin</div>
          </div>
        </div>
        <span className="coin-status-tag"><Sparkles size={12} /> Awet / Tidak Hangus</span>
      </div>

      {/* Missions List */}
      <div className="missions-section">
        <h2 className="section-title"><Gift size={20} /> Daftar Tugas Harian</h2>
        
        <div className="mission-list">
          {loading ? (
            <div className="loading-state glass-card">
              <p>Memuat daftar misi...</p>
            </div>
          ) : (
            <>
              {/* Mission 1: Login Harian */}
              <div className={`mission-item glass-card ${claimedMissions.includes('daily_login') ? 'completed' : ''}`}>
                <div className="mission-icon-box">
                  <Award size={24} className="icon-purple" />
                </div>
                <div className="mission-info">
                  <h4>Login Harian</h4>
                  <p>Buka aplikasi Skincluv hari ini</p>
                  <span className="mission-reward">+5 Koin</span>
                </div>
                <div className="mission-action">
                  {claimedMissions.includes('daily_login') ? (
                    <span className="claimed-tag"><CheckCircle2 size={16} /> Diklaim</span>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => claimMission('daily_login', 5)}>
                      Klaim
                    </button>
                  )}
                </div>
              </div>

              {/* Mission 2: Scan Wajah */}
              <div className={`mission-item glass-card ${claimedMissions.includes('first_face_scan') ? 'completed' : ''}`}>
                <div className="mission-icon-box">
                  <Award size={24} className="icon-gold" />
                </div>
                <div className="mission-info">
                  <h4>Scan Wajah Pertamamu</h4>
                  <p>Analisis kondisi kulit wajahmu hari ini</p>
                  <span className="mission-reward">+50 Koin</span>
                </div>
                <div className="mission-action">
                  {claimedMissions.includes('first_face_scan') ? (
                    <span className="claimed-tag"><CheckCircle2 size={16} /> Diklaim</span>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => claimMission('first_face_scan', 50)}>
                      Klaim
                    </button>
                  )}
                </div>
              </div>

              {/* Mission 3: Invite Friend */}
              <div className={`mission-item glass-card ${claimedMissions.includes('invite_friend') ? 'completed' : ''}`}>
                <div className="mission-icon-box">
                  <Award size={24} className="icon-blue" />
                </div>
                <div className="mission-info">
                  <h4>Ajak Teman</h4>
                  <p>Bagikan kode referral ke teman kamu</p>
                  <span className="mission-reward">+75 Koin</span>
                </div>
                <div className="mission-action">
                  {claimedMissions.includes('invite_friend') ? (
                    <span className="claimed-tag"><CheckCircle2 size={16} /> Diklaim</span>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => claimMission('invite_friend', 75)}>
                      Klaim
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .missions-page { padding-bottom: 120px; max-width: 600px; margin: 0 auto; }
        .missions-header { text-align: center; margin-bottom: var(--space-xl); }
        .section-badge {
          display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem;
          font-weight: 800; color: var(--color-brand-300); background: rgba(168,85,247,0.1);
          padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(168,85,247,0.3); margin-bottom: 8px;
        }
        .missions-header h1 { font-size: 1.75rem; margin: 4px 0; }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; }

        .coin-summary-card {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-xl); border-radius: var(--radius-2xl); margin-bottom: var(--space-2xl);
          background: linear-gradient(135deg, var(--color-brand-800), var(--color-brand-950));
          border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(107,33,168,0.3);
        }
        .coin-summary-left { display: flex; align-items: center; gap: 14px; }
        .coin-circle {
          width: 52px; height: 52px; border-radius: 50%; background: rgba(251, 191, 36, 0.15);
          display: flex; align-items: center; justify-content: center; border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .coin-gold { color: #FBBF24; filter: drop-shadow(0 2px 8px rgba(251,191,36,0.4)); }
        .summary-label { font-size: 0.75rem; color: rgba(255,255,255,0.7); display: block; }
        .summary-amount { font-size: 1.75rem; font-weight: 800; color: white; line-height: 1; margin-top: 2px; }
        .coin-status-tag { font-size: 0.75rem; font-weight: 700; color: #FBBF24; background: rgba(251,191,36,0.15); padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(251,191,36,0.3); display: flex; align-items: center; gap: 4px; }

        .section-title { font-size: 1.125rem; margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px; }
        .mission-list { display: flex; flex-direction: column; gap: var(--space-md); }
        .loading-state { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 0.875rem; }

        .mission-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-lg); border-radius: var(--radius-xl); border: 1px solid var(--color-border);
          transition: all 0.2s;
        }
        .mission-item.completed { opacity: 0.7; border-color: rgba(34, 197, 94, 0.3); background: rgba(34,197,94,0.03); }
        .mission-icon-box {
          width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 14px;
        }
        .icon-purple { color: var(--color-brand-300); }
        .icon-gold { color: #FBBF24; }
        .icon-blue { color: #3b82f6; }

        .mission-info { flex: 1; }
        .mission-info h4 { font-size: 1rem; margin: 0 0 4px 0; }
        .mission-info p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0 0 6px 0; }
        .mission-reward {
          display: inline-block; font-size: 0.75rem; font-weight: 700; color: #FBBF24;
          background: rgba(251, 191, 36, 0.1); padding: 2px 8px; border-radius: 4px;
        }

        .claimed-tag {
          font-size: 0.8125rem; font-weight: 700; color: #22c55e;
          display: inline-flex; align-items: center; gap: 4px; background: rgba(34, 197, 94, 0.1);
          padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(34, 197, 94, 0.3);
        }
      `}</style>
    </div>
  )
}

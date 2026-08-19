import { useState, useEffect } from 'react'
import { CheckCircle2, Gift, Coins, Sparkles, Trophy, Calendar, Zap, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface Mission {
  id: string
  title: string
  reward_coins: number
  progress: number
  target: number
  is_claimed: boolean
}

export default function MissionsPage() {
  const { user, coinBalance, setCoinBalance } = useAuthStore()
  const [missions, setMissions] = useState<Mission[]>([
    { id: '1', title: 'Lakukan Scan Wajah Pertama Hari Ini', reward_coins: 50, progress: 1, target: 1, is_claimed: false },
    { id: '2', title: 'Cek Komposisi 1 Produk Skincare', reward_coins: 30, progress: 0, target: 1, is_claimed: false },
    { id: '3', title: 'Konsultasi 1 Kali Dengan Chatbot AI', reward_coins: 20, progress: 1, target: 1, is_claimed: true },
    { id: '4', title: 'Minum 8 Gelas Air Putih', reward_coins: 10, progress: 4, target: 8, is_claimed: false },
  ])

  const handleClaim = async (id: string, coins: number) => {
    if (!user) return
    setMissions(prev => prev.map(m => m.id === id ? { ...m, is_claimed: true } : m))

    if (coinBalance) {
      const newBal = coinBalance.balance + coins
      setCoinBalance({ ...coinBalance, balance: newBal })

      await supabase.from('coin_ledgers').insert({
        user_id: user.id,
        amount: coins,
        transaction_type: 'CREDIT',
        description: `Klaim Misi Harian +${coins} Koin`,
      })
    }
  }

  return (
    <div className="missions-page animate-fade-in">
      <div className="page-header">
        <h1>Misi & Hadiah Koin</h1>
        <p className="page-subtitle">Selesaikan tugas harian untuk mengumpulkan Koin Darurat Skincluv!</p>
      </div>

      {/* Full-Width 2-Column Grid Layout */}
      <div className="missions-grid">
        {/* Left Column (5 Cols): Coin Summary & Info Card */}
        <div className="missions-left-col">
          {/* Coin Balance Banner Card */}
          <div className="coin-banner-card stich-bento-card">
            <div className="banner-top">
              <span className="coin-large-emoji">🪙</span>
              <div>
                <span className="banner-meta">Saldo Koin Saat Ini</span>
                <div className="banner-amount">{coinBalance?.balance ?? 1250} <span className="denom">Coins</span></div>
              </div>
            </div>
            <div className="banner-bottom mt-md">
              <span className="badge-amber"><Sparkles size={14} /> Dapatkan Akses Fitur PRO</span>
            </div>
          </div>

          <div className="stich-bento-card reward-info-card">
            <h3><Gift size={18} className="text-amber" /> Manfaat Koin Darurat</h3>
            <p>Koin yang kamu kumpulkan dari misi harian dapat digunakan untuk:</p>
            <ul className="reward-info-list">
              <li>✨ Membuka analisis wajah tambahan saat kuota habis</li>
              <li>✨ Konsultasi mendalam dengan AI Spesialis</li>
              <li>✨ Menukarkan voucher diskon langganan PRO</li>
            </ul>
          </div>
        </div>

        {/* Right Column (7 Cols): Mission Tasks List */}
        <div className="missions-right-col">
          <div className="missions-list-card stich-bento-card">
            <div className="card-title-row">
              <h3><Trophy size={18} className="text-amber" /> Misi Harian Kamu</h3>
              <span className="reset-tag"><Calendar size={12} /> Reset pukul 00:00 WIB</span>
            </div>

            <div className="missions-stack">
              {missions.map(m => {
                const isCompleted = m.progress >= m.target
                const percent = Math.min((m.progress / m.target) * 100, 100)

                return (
                  <div key={m.id} className={`mission-card ${m.is_claimed ? 'claimed' : isCompleted ? 'ready' : 'in-progress'}`}>
                    <div className="mission-info">
                      <h4>{m.title}</h4>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="progress-count">{m.progress} / {m.target} Selesai</span>
                    </div>

                    <div className="mission-action">
                      <span className="reward-tag">+{m.reward_coins} 🪙</span>
                      {m.is_claimed ? (
                        <span className="btn-claimed"><CheckCircle2 size={16} /> Diklaim</span>
                      ) : isCompleted ? (
                        <button className="btn btn-primary btn-sm" onClick={() => handleClaim(m.id, m.reward_coins)}>
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
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-sky);
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

        .reward-info-card h3 { font-size: 1rem; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; }
        .reward-info-card p { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0 0 12px 0; }
        .reward-info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 0.8125rem; color: var(--color-text-muted); }

        .card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
        .card-title-row h3 { font-size: 1.25rem; margin: 0; display: flex; align-items: center; gap: 8px; }
        .text-amber { color: var(--color-tertiary-container); }
        .reset-tag { font-size: 0.75rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }

        .missions-stack { display: flex; flex-direction: column; gap: var(--space-sm); }
        .mission-card {
          display: flex; justify-content: space-between; align-items: center; gap: var(--space-md);
          padding: var(--space-md); border-radius: var(--radius-lg); background: var(--color-surface-container-low);
          border: 1px solid var(--color-secondary-container);
        }
        .mission-card.claimed { opacity: 0.65; }
        .mission-card.ready { border-color: var(--color-primary-container); background: #f0f9ff; }

        .mission-info { flex: 1; }
        .mission-info h4 { font-size: 0.9375rem; margin: 0 0 6px 0; color: var(--color-text-main); }
        .progress-bar-bg { width: 100%; height: 6px; background: var(--color-surface-container-high); border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--color-primary-container); border-radius: 3px; }
        .progress-count { font-size: 0.75rem; color: var(--color-text-muted); display: block; margin-top: 4px; }

        .mission-action { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .reward-tag { font-size: 0.875rem; font-weight: 800; color: var(--color-tertiary-container); font-family: var(--font-heading); }
        .btn-claimed { font-size: 0.75rem; font-weight: 700; color: var(--color-success); display: flex; align-items: center; gap: 4px; }
        .mt-md { margin-top: var(--space-md); }
      `}</style>
    </div>
  )
}

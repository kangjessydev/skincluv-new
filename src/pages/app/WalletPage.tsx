import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins, CheckCircle2, Crown, History, Sparkles, Activity, X, CreditCard, QrCode, Store, ChevronRight, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface PaymentChannel {
  code: string
  name: string
  category: 'qris' | 'va' | 'retail'
  iconLabel: string
}

const PAYMENT_CHANNELS: PaymentChannel[] = [
  { code: 'QRIS', name: 'QRIS (Gopay, OVO, Dana, ShopeePay)', category: 'qris', iconLabel: '⚡ Instan' },
  { code: 'BRIVA', name: 'BRI Virtual Account', category: 'va', iconLabel: 'Bank BRI' },
  { code: 'BCAVA', name: 'BCA Virtual Account', category: 'va', iconLabel: 'Bank BCA' },
  { code: 'MANDIRIVA', name: 'Mandiri Virtual Account', category: 'va', iconLabel: 'Mandiri' },
  { code: 'BNIVA', name: 'BNI Virtual Account', category: 'va', iconLabel: 'Bank BNI' },
  { code: 'PERMATAVA', name: 'Permata Virtual Account', category: 'va', iconLabel: 'Permata' },
  { code: 'ALFAMART', name: 'Alfamart / Alfamidi', category: 'retail', iconLabel: 'Retail' },
  { code: 'INDOMARET', name: 'Indomaret', category: 'retail', iconLabel: 'Retail' },
]

export default function WalletPage() {
  const navigate = useNavigate()
  const { session, coinBalance, setCoinBalance, subscription } = useAuthStore()
  const [balance, setBalance] = useState(coinBalance?.balance ?? 0)
  const [loading, setLoading] = useState(true)
  const [missionsLoading, setMissionsLoading] = useState(true)
  const [usages, setUsages] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  // Check if active subscription is PRO / Premium
  const subTierSlug = (subscription as any)?.subscription_tiers?.slug
  const subTierName = (subscription as any)?.subscription_tiers?.name
  const isPro = subscription?.status === 'active' && (
    subTierSlug === 'premium' || 
    subTierName?.toLowerCase() === 'premium' ||
    subTierName?.toLowerCase() === 'pro'
  )

  useEffect(() => {
    if (!session?.user) return
    const fetchData = async () => {
      // 1. Fetch Coins
      const { data: coinData } = await supabase
        .from('coin_balances')
        .select('balance')
        .eq('user_id', session.user.id)
        .single()
      if (coinData) setBalance(coinData.balance)
      
      // 2. Fetch Active Subscription & Tier
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('tier_id, subscription_tiers(name, slug)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle()
        
      if (subData) {
        // 3. Fetch Quota Configs for that Tier
        const { data: configData } = await supabase
          .from('quota_configs')
          .select('feature_id, monthly_limit, ai_features(slug, name)')
          .eq('tier_id', subData.tier_id)
          
        // 4. Fetch Usage
        const { data: usageData } = await supabase
          .from('quota_usage')
          .select('feature_id, used_count')
          .eq('user_id', session.user.id)
          
        // Combine usages
        if (configData) {
          const combined = configData.map((cfg: any) => {
            const used = usageData?.find((u: any) => u.feature_id === cfg.feature_id)?.used_count || 0
            return {
              name: cfg.ai_features.name,
              slug: cfg.ai_features.slug,
              used: used,
              limit: cfg.monthly_limit
            }
          })
          setUsages(combined)
        }
      }

      // 5. Fetch Claimed Missions Today
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

      setMissionsLoading(false)
      setLoading(false)
    }
    fetchData()
  }, [session])

  const upgradeProWithMethod = async (methodCode: string) => {
    if (isUpgrading) return
    setIsUpgrading(true)
    setSelectedChannel(methodCode)
    try {
      const { data, error } = await supabase.functions.invoke('tripay-invoice', {
        body: { plan: 'PREMIUM', method: methodCode }
      })
      if (error) {
        let msg = error.message
        if ((error as any).context) {
          try {
            const ctxJson = await (error as any).context.json()
            if (ctxJson?.error) msg = ctxJson.error
          } catch {}
        }
        alert('Gagal membuat tagihan: ' + msg)
        return
      }
      if (data?.reference || data?.merchant_ref) {
        setShowModal(false)
        navigate(`/checkout/${data.merchant_ref || data.reference}`)
      } else if (data?.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert('Gagal mendapatkan rincian pembayaran: ' + (data?.error || 'Unknown error'))
      }
    } catch (err: any) {
      console.error('upgradePro error:', err)
      alert('Gagal membuat tagihan: ' + (err.message || err))
    } finally {
      setIsUpgrading(false)
      setSelectedChannel(null)
    }
  }

  const [claimedMissions, setClaimedMissions] = useState<string[]>([])

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
        alert('Misi berhasil diklaim! Koin bertambah.')
      } else {
        setClaimedMissions(prev => [...prev, missionSlug])
        alert('Misi ini sudah kamu klaim sebelumnya.')
      }
    } catch (err: any) {
      alert('Gagal klaim misi: ' + err.message)
    }
  }

  return (
    <div className="wallet-page animate-fade-in">
      <div className="wallet-header">
        <h1>Skincluv Wallet & Usage</h1>
        <p>Pantau penggunaan bulanan kamu dan sisa koin.</p>
      </div>

      {/* Conditional Card: PRO Member Card vs Promo Upgrade Card */}
      {isPro ? (
        <div className="pro-member-card">
          <div className="pro-badge-header">
            <div className="pro-crown-circle">
              <Crown size={28} />
            </div>
            <div>
              <span className="pro-tag"><Sparkles size={14} /> VIP MEMBER</span>
              <h2>Skincluv PRO Active</h2>
            </div>
          </div>
          <p className="pro-desc">
            Kamu memiliki akses penuh ke analisis wajah cerdas & 3.000 panggilan AI bulanan.
          </p>
          <div className="pro-footer">
            <div className="pro-status">
              <ShieldCheck size={16} className="inline-icon color-success" /> Status: <strong>Aktif</strong>
            </div>
            {subscription?.expires_at && (
              <div className="pro-expiry">
                Perpanjang: {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="subscription-card">
          <div className="sub-info">
            <h2>Paket PRO <Crown size={20} className="inline-icon" /></h2>
            <p>Scan Sepuasnya & Chat AI Tanpa Batas!</p>
            <ul>
              <li>✨ 3.000 Universal AI Usage / Bulan</li>
              <li>✨ Analisis Wajah & Rekomendasi Medis</li>
              <li>✨ Peringatan Bahan Berbahaya Otomatis</li>
            </ul>
          </div>
          <div className="sub-action">
            <div className="sub-price">Rp 49.000 <span>/ bulan</span></div>
            <button className="btn btn-primary btn-glow" onClick={() => setShowModal(true)}>
              Upgrade Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Usage Bar Dashboard */}
      <div className="usage-section">
        <h2 className="section-title"><Activity size={20} /> Penggunaan Kuota (Bulan Ini)</h2>
        <div className="usage-grid">
          {loading ? (
            <p>Loading data...</p>
          ) : usages.length === 0 ? (
            <div className="usage-card">
              <div className="usage-header">
                <span className="usage-name">Universal AI Usage (Gratis)</span>
                <span className="usage-count">10 Limit / Bulan</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: '10%' }} />
              </div>
            </div>
          ) : usages.map((u, i) => {
            const percent = u.limit > 0 ? Math.min((u.used / u.limit) * 100, 100) : 0
            const isCritical = percent > 80
            return (
              <div key={i} className="usage-card">
                <div className="usage-header">
                  <span className="usage-name">{u.name}</span>
                  <span className={`usage-count ${isCritical ? 'critical' : ''}`}>
                    {u.used} / {u.limit}
                  </span>
                </div>
                <div className="progress-bg">
                  <div 
                    className={`progress-fill ${isCritical ? 'critical-fill' : ''}`} 
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-info">
          <span className="balance-label">Koin Darurat (Tidak Pernah Hangus)</span>
          <div className="balance-amount">
            <Coins size={32} className="coin-icon-large" />
            <span>{loading ? '...' : balance}</span>
          </div>
          <span className="balance-desc">Digunakan saat kuota gratis habis.</span>
        </div>
        <button className="btn btn-glass btn-history" onClick={() => navigate('/transactions')}>
          <History size={18} /> Riwayat
        </button>
      </div>

      <div className="missions-section">
        <h2 className="section-title">Misi Harian (Dapatkan Koin) 🎁</h2>
        <div className="mission-list">
          {missionsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Memuat misi...
            </div>
          ) : (
            <>
              <div className={`mission-item ${claimedMissions.includes('daily_login') ? 'completed' : ''}`}>
                <div className="mission-info">
                  <h4>Login Harian</h4>
                  <p>Buka aplikasi Skincluv hari ini</p>
                  <span className="mission-reward">+5 Koin</span>
                </div>
                <div className="mission-action">
                  {claimedMissions.includes('daily_login') ? (
                    <CheckCircle2 size={28} color="var(--color-success)" />
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => claimMission('daily_login', 5)}>
                      Klaim
                    </button>
                  )}
                </div>
              </div>

              <div className={`mission-item ${claimedMissions.includes('first_face_scan') ? 'completed' : ''}`}>
                <div className="mission-info">
                  <h4>Scan Wajah Pertamamu</h4>
                  <p>Analisis kondisi kulitmu sekarang</p>
                  <span className="mission-reward">+50 Koin</span>
                </div>
                <div className="mission-action">
                  {claimedMissions.includes('first_face_scan') ? (
                    <CheckCircle2 size={28} color="var(--color-success)" />
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => claimMission('first_face_scan', 50)}>Klaim</button>
                  )}
                </div>
              </div>

              <div className={`mission-item ${claimedMissions.includes('invite_friend') ? 'completed' : ''}`}>
                <div className="mission-info">
                  <h4>Ajak Teman</h4>
                  <p>Bagikan kode referral kamu</p>
                  <span className="mission-reward">+75 Koin</span>
                </div>
                <div className="mission-action">
                  {claimedMissions.includes('invite_friend') ? (
                    <CheckCircle2 size={28} color="var(--color-success)" />
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => claimMission('invite_friend', 75)}>Klaim</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Channel Modal */}
      {showModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => !isUpgrading && setShowModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Pilih Metode Pembayaran</h3>
                <p className="modal-subtitle">Paket PRO Rp 49.000 / bulan</p>
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)} disabled={isUpgrading}>
                <X size={20} />
              </button>
            </div>

            <div className="channel-list">
              {/* QRIS Category */}
              <div className="channel-category-title">
                <QrCode size={16} /> QRIS & E-Wallet (Instan)
              </div>
              {PAYMENT_CHANNELS.filter(c => c.category === 'qris').map(ch => (
                <button
                  key={ch.code}
                  className={`channel-item ${selectedChannel === ch.code ? 'loading' : ''}`}
                  onClick={() => upgradeProWithMethod(ch.code)}
                  disabled={isUpgrading}
                >
                  <div className="channel-info">
                    <span className="channel-name">{ch.name}</span>
                    <span className="channel-tag tag-qris">{ch.iconLabel}</span>
                  </div>
                  <ChevronRight size={18} className="arrow-icon" />
                </button>
              ))}

              {/* Virtual Account Category */}
              <div className="channel-category-title">
                <CreditCard size={16} /> Virtual Account (Bank Transfer)
              </div>
              {PAYMENT_CHANNELS.filter(c => c.category === 'va').map(ch => (
                <button
                  key={ch.code}
                  className={`channel-item ${selectedChannel === ch.code ? 'loading' : ''}`}
                  onClick={() => upgradeProWithMethod(ch.code)}
                  disabled={isUpgrading}
                >
                  <div className="channel-info">
                    <span className="channel-name">{ch.name}</span>
                    <span className="channel-tag tag-va">{ch.iconLabel}</span>
                  </div>
                  <ChevronRight size={18} className="arrow-icon" />
                </button>
              ))}

              {/* Retail Category */}
              <div className="channel-category-title">
                <Store size={16} /> Gerai Retail
              </div>
              {PAYMENT_CHANNELS.filter(c => c.category === 'retail').map(ch => (
                <button
                  key={ch.code}
                  className={`channel-item ${selectedChannel === ch.code ? 'loading' : ''}`}
                  onClick={() => upgradeProWithMethod(ch.code)}
                  disabled={isUpgrading}
                >
                  <div className="channel-info">
                    <span className="channel-name">{ch.name}</span>
                    <span className="channel-tag tag-retail">{ch.iconLabel}</span>
                  </div>
                  <ChevronRight size={18} className="arrow-icon" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .wallet-page { padding-bottom: 120px; }
        .wallet-header { margin-bottom: var(--space-lg); }
        .wallet-header h1 { font-size: 1.75rem; }
        .wallet-header p { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 4px; }

        /* PRO Member Badge Card */
        .pro-member-card {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(168, 85, 247, 0.2));
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-2xl);
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15);
        }
        .pro-badge-header { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
        .pro-crown-circle {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #FBBF24, #D97706);
          display: flex; align-items: center; justify-content: center;
          color: white; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        }
        .pro-tag {
          font-size: 0.75rem; font-weight: 800; color: #FBBF24;
          letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;
        }
        .pro-badge-header h2 { font-size: 1.35rem; margin: 2px 0 0 0; color: white; }
        .pro-desc { font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 16px; line-height: 1.5; }
        .pro-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1);
          font-size: 0.8125rem;
        }
        .pro-status { display: flex; align-items: center; gap: 6px; color: var(--color-text); }
        .pro-expiry { color: var(--color-text-muted); }
        .color-success { color: #22c55e; }

        /* Promo Subscription Card */
        .subscription-card {
          background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1));
          border: 1px solid var(--color-brand-500);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          display: flex; flex-wrap: wrap; gap: var(--space-md);
          justify-content: space-between; align-items: center;
          margin-bottom: var(--space-2xl);
        }
        .sub-info h2 { font-size: 1.5rem; color: var(--color-brand-300); display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .sub-info p { font-size: 0.875rem; margin-bottom: 12px; color: var(--color-text-secondary); }
        .sub-info ul { list-style: none; padding: 0; margin: 0; font-size: 0.875rem; }
        .sub-info ul li { margin-bottom: 4px; opacity: 0.9; }
        .sub-action { text-align: center; }
        .sub-price { font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; }
        .sub-price span { font-size: 0.875rem; font-weight: 400; color: var(--color-text-muted); }
        .btn-glow { box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4); }

        .usage-section { margin-bottom: var(--space-2xl); }
        .section-title { font-size: 1.25rem; margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px; }
        .usage-grid { display: flex; flex-direction: column; gap: var(--space-md); }
        .usage-card {
          background: var(--color-surface-glass);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
        }
        .usage-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.875rem; }
        .usage-name { font-weight: 600; }
        .usage-count { font-weight: 700; color: var(--color-brand-300); }
        .usage-count.critical { color: #ef4444; }
        .progress-bg { width: 100%; height: 8px; background: var(--color-surface-3); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--gradient-brand); border-radius: 4px; transition: width 0.5s ease-out; }
        .progress-fill.critical-fill { background: linear-gradient(90deg, #f59e0b, #ef4444); }

        .balance-card {
          background: linear-gradient(135deg, var(--color-brand-700), var(--color-brand-900));
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: var(--space-2xl);
          box-shadow: 0 8px 32px rgba(107, 33, 168, 0.3);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .balance-label { font-size: 0.875rem; color: rgba(255,255,255,0.8); display: block; margin-bottom: 8px; font-weight: 600; }
        .balance-amount {
          display: flex; align-items: center; gap: 12px;
          font-size: 2.5rem; font-weight: 800; color: white; line-height: 1;
        }
        .balance-desc { font-size: 0.75rem; color: rgba(255,255,255,0.6); display: block; margin-top: 8px; }
        .coin-icon-large { color: #FBBF24; filter: drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4)); }
        
        .btn-history { background: rgba(255,255,255,0.1); color: white; border: none; gap: 8px; }
        .btn-history:hover { background: rgba(255,255,255,0.2); }

        .mission-list { display: flex; flex-direction: column; gap: var(--space-md); }
        .mission-item {
          display: flex; justify-content: space-between; align-items: center;
          background: var(--color-surface-glass); border: 1px solid var(--color-border);
          border-radius: var(--radius-lg); padding: var(--space-md);
        }
        .mission-item.completed { opacity: 0.7; border-color: rgba(34, 197, 94, 0.3); }
        .mission-info h4 { font-size: 1rem; margin-bottom: 4px; }
        .mission-info p { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 8px; }
        .mission-reward {
          display: inline-block; font-size: 0.75rem; font-weight: 700; color: #FBBF24;
          background: rgba(251, 191, 36, 0.1); padding: 2px 8px; border-radius: 4px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: var(--space-md);
        }
        .modal-content {
          width: 100%; max-width: 480px; background: rgba(20, 15, 35, 0.95);
          border: 1px solid var(--color-brand-500); border-radius: var(--radius-2xl);
          padding: var(--space-xl); max-height: 85vh; overflow-y: auto;
          box-shadow: 0 16px 48px rgba(107, 33, 168, 0.4);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: var(--space-lg); border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--space-md);
        }
        .modal-header h3 { font-size: 1.25rem; margin: 0; }
        .modal-subtitle { font-size: 0.8125rem; color: #FBBF24; margin-top: 2px; font-weight: 600; }
        .btn-close {
          background: transparent; border: none; color: var(--color-text-muted);
          cursor: pointer; padding: 4px; border-radius: 50%; display: flex;
        }
        .btn-close:hover { color: white; background: rgba(255,255,255,0.1); }

        .channel-list { display: flex; flex-direction: column; gap: 8px; }
        .channel-category-title {
          font-size: 0.8125rem; font-weight: 700; color: var(--color-brand-300);
          display: flex; align-items: center; gap: 6px; margin: 12px 0 6px 0;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .channel-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: rgba(255,255,255,0.04);
          border: 1px solid var(--color-border); border-radius: var(--radius-lg);
          color: white; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%;
        }
        .channel-item:hover {
          background: rgba(168,85,247,0.15); border-color: var(--color-brand-400);
          transform: translateY(-1px);
        }
        .channel-info { display: flex; flex-direction: column; gap: 2px; }
        .channel-name { font-size: 0.875rem; font-weight: 600; }
        .channel-tag { font-size: 0.6875rem; font-weight: 700; width: fit-content; }
        .tag-qris { color: #22c55e; }
        .tag-va { color: #3b82f6; }
        .tag-retail { color: #f59e0b; }
        .arrow-icon { color: var(--color-text-muted); }
      `}</style>
    </div>
  )
}

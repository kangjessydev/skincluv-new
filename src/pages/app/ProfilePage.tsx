import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Activity, AlertCircle, Save, Crown, Coins, Receipt, History, ArrowRight, ShieldCheck, Zap, LogOut } from 'lucide-react'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'
import type { SkinProfile, SkinType } from '@/types/database'

const SKIN_TYPES = [
  { id: 'normal', label: 'Normal' },
  { id: 'dry', label: 'Kering (Dry)' },
  { id: 'oily', label: 'Berminyak (Oily)' },
  { id: 'combination', label: 'Kombinasi' },
  { id: 'sensitive', label: 'Sensitif' }
]

const CONCERNS_LIST = [
  'Jerawat (Acne)', 'Flek Hitam', 'Kerutan', 'Komedo', 'Kusam', 'Kemerahan', 'Pori Besar', 'Alergi Parfum', 'Alergi Alkohol'
]

export default function ProfilePage() {
  const { profile, activeSkinProfile, setActiveSkinProfile, subscription, coinBalance } = useAuthStore()
  const [skinType, setSkinType] = useState(activeSkinProfile?.skin_type || 'normal')
  const [concerns, setConcerns] = useState<string[]>(activeSkinProfile?.skin_concerns || [])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number; name: string } | null>(null)

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const isFree = !isPro && !isGlow

  useEffect(() => {
    if (!profile?.id) return
    const fetchUsage = async () => {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('tier_id, subscription_tiers(slug, name)')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .maybeSingle()

      const tierId = subData?.tier_id

      if (tierId) {
        const { data: cfg } = await supabase
          .from('quota_configs')
          .select('feature_id, monthly_limit, ai_features(name)')
          .eq('tier_id', tierId)
          .maybeSingle()

        if (cfg) {
          const { data: usage } = await supabase
            .from('quota_usage')
            .select('used_count')
            .eq('user_id', profile.id)
            .eq('feature_id', cfg.feature_id)
            .maybeSingle()

          setUsageInfo({
            name: (cfg.ai_features as any)?.name || 'Universal AI Usage',
            used: usage?.used_count || 0,
            limit: cfg.monthly_limit
          })
        }
      }
    }
    fetchUsage()
  }, [profile?.id, subscription])

  const handleToggleConcern = (c: string) => {
    if (concerns.includes(c)) {
      setConcerns(concerns.filter(x => x !== c))
    } else {
      setConcerns([...concerns, c])
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setLoading(true)
    setMessage('')
    setIsSuccess(false)

    try {
      const { data: existing, error: existErr } = await supabase
        .from('skin_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .maybeSingle()

      if (existErr && existErr.code !== 'PGRST116') {
        throw existErr
      }

      let result
      if (existing) {
        result = await supabase
          .from('skin_profiles')
          .update({
            skin_type: skinType,
            skin_concerns: concerns
          })
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('skin_profiles')
          .insert({
            user_id: profile.id,
            skin_type: skinType,
            skin_concerns: concerns,
            is_active: true
          })
          .select()
          .single()
      }

      if (result.error) throw result.error
      if (result.data) {
        setActiveSkinProfile(result.data as unknown as SkinProfile)
        setMessage('Profil kulit berhasil disimpan! Rekomendasi medis sekarang lebih terpersonalisasi.')
        setIsSuccess(true)

        // Track complete_profile mission safely on the server
        void supabase.rpc('track_profile_completion').then(null, (err: unknown) => {
          console.warn('[ProfilePage] Failed to track profile completion:', err)
        })
      }
    } catch (err: any) {
      console.error(err)
      setMessage('Gagal menyimpan profil kulit: ' + err.message)
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const usedCount = usageInfo?.used || 0
  const limitCount = isPro ? 3000 : (usageInfo?.limit || 10)
  const usedPercent = Math.min(Math.round((usedCount / limitCount) * 100), 100)
  const remainingPercent = Math.max(0, 100 - usedPercent)

  return (
    <div className="profile-page animate-fade-in">
      <div className="header">
        <h1>Profil Saya</h1>
        <p>Kelola identitas, status keanggotaan, dan preferensi kulitmu.</p>
      </div>

      {/* Full-Width 2-Column Grid Layout */}
      <div className="profile-grid">
        {/* Left Column (5 Cols): Account & Membership */}
        <div className="profile-left-col">
          {/* User Header Card */}
          <div className="card user-card glass-card">
            <div className="avatar-circle">
              {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="user-info">
              <h2>{profile?.full_name}</h2>
              <p>{profile?.username || 'Pelanggan Skincluv'}</p>
            </div>
            <button className="btn btn-ghost btn-sm ml-auto btn-logout" onClick={() => supabase.auth.signOut()}>
              <LogOut size={16} /> Keluar
            </button>
          </div>

          {/* Membership & Usage Dashboard Card */}
          <div className={`card member-card glass-card ${isPro ? 'pro' : isGlow ? 'glow' : 'free'}`}>
            <div className="member-header">
              <div className="badge-wrapper">
                {isPro ? (
                  <span className="badge-pro"><Crown size={16} /> VIP PRO MEMBER</span>
                ) : isGlow ? (
                  <span className="badge-amber font-bold text-xs flex items-center gap-1.5 px-3 py-1 rounded-full"><Zap size={14} /> GLOW MEMBER</span>
                ) : (
                  <span className="badge-free"><Zap size={14} /> FREE ACCOUNT</span>
                )}
              </div>
              {!isPro && (
                <Link to="/pricing" className="btn btn-primary btn-sm btn-upgrade-link">
                  <Crown size={14} /> Upgrade Paket
                </Link>
              )}
            </div>

            {/* Usage Bar */}
            <div className="usage-block">
              <div className="usage-meta">
                <span className="usage-label"><Activity size={16} /> Kuota Analisis Bulan Ini</span>
                <span className="usage-text">
                  {isFree ? (
                    <span style={{ color: 'var(--color-text-muted)' }}>0% Kuota (Gunakan Credits Misi)</span>
                  ) : (
                    <span className="usage-percent-badge">
                      <strong>{remainingPercent}% Tersisa</strong>
                      <span className="usage-detail-fraction">({usedPercent}% terpakai)</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="progress-bg">
                <div
                  className="progress-fill"
                  style={{
                    width: isFree ? '0%' : `${Math.max(usedPercent, 2)}%`,
                    background: usedPercent >= 90
                      ? 'linear-gradient(90deg, #f87171, #ef4444)'
                      : usedPercent >= 75
                      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                      : 'linear-gradient(90deg, #60a5fa, #2563eb)'
                  }}
                />
              </div>
            </div>

            {!isFree && subscription?.expires_at && (
              <div className="pro-expiry-bar">
                <ShieldCheck size={14} className="color-success" /> Status: <strong>Aktif</strong> (Perpanjang: {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
              </div>
            )}
          </div>

          {/* Credits Balance Card */}
          <div className="card coins-card glass-card">
            <div className="coins-left">
              <Coins size={28} className="text-amber-500" />
              <div>
                <span className="coins-label">Saldo AI Credits</span>
                <span className="coins-amount">{coinBalance?.balance ?? 0} Credits</span>
              </div>
            </div>
            <Link to="/coin-history" className="btn btn-secondary btn-sm">
              <History size={16} /> Mutasi Credits
            </Link>
          </div>

          {/* Quick Links Nav Card */}
          <div className="card quick-nav-card glass-card">
            <h3>Menu Akun & Tagihan</h3>
            <div className="nav-links-list">
              <Link to="/pricing" className="nav-item-link">
                <div className="nav-item-left">
                  <Crown size={18} className="icon-amber" />
                  <span>Toko Langganan (Pricing)</span>
                </div>
                <ArrowRight size={16} />
              </Link>
              <Link to="/transactions" className="nav-item-link">
                <div className="nav-item-left">
                  <Receipt size={18} className="icon-sky" />
                  <span>Riwayat Tagihan & Pembayaran</span>
                </div>
                <ArrowRight size={16} />
              </Link>
              <Link to="/coin-history" className="nav-item-link">
                <div className="nav-item-left">
                  <History size={18} className="icon-slate" />
                  <span>Riwayat Mutasi Credits</span>
                </div>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Skin Profile Form */}
        <div className="profile-right-col">
          <div className="card skin-profile-form glass-card">
            <h3><Activity size={18} className="inline-icon text-sky" /> Tipe Kulit Kamu</h3>
            <div className="radio-group">
              {SKIN_TYPES.map(t => (
                <label key={t.id} className={`radio-label ${skinType === t.id ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="skin_type" 
                    value={t.id} 
                    checked={skinType === t.id}
                    onChange={() => setSkinType(t.id as SkinType)} 
                  />
                  {t.label}
                </label>
              ))}
            </div>

            <h3 className="mt-lg"><AlertCircle size={18} className="inline-icon text-sky" /> Masalah & Sensitivitas Kulit</h3>
            <div className="checkbox-group">
              {CONCERNS_LIST.map(c => (
                <label key={c} className={`checkbox-label ${concerns.includes(c) ? 'active' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={concerns.includes(c)}
                    onChange={() => handleToggleConcern(c)}
                  />
                  {c}
                </label>
              ))}
            </div>

            {message && <div className={`message-box ${isSuccess ? 'success' : 'error'}`}>{message}</div>}

            <button className="btn btn-primary btn-block mt-lg" onClick={handleSave} disabled={loading}>
              <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Profil Kulit'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page { padding-bottom: 60px; width: 100%; }
        .header { margin-bottom: var(--space-lg); }
        .header h1 { font-size: 1.75rem; margin: 0; color: var(--color-primary); }
        .header p { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 4px; }

        /* 2-Column Grid Layout */
        .profile-grid {
          display: grid; grid-template-columns: 1fr; gap: var(--space-lg); width: 100%;
        }
        @media (min-width: 900px) {
          .profile-grid {
            grid-template-columns: 5fr 7fr;
          }
        }
        
        .card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-lg);
          box-shadow: var(--shadow-sky);
        }
        .user-card { display: flex; align-items: center; gap: var(--space-md); }
        .avatar-circle {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--color-primary-container); color: var(--color-on-primary-container);
          display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem;
        }
        .user-info h2 { font-size: 1.125rem; margin: 0; color: var(--color-text-main); }
        .user-info p { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; }
        .ml-auto { margin-left: auto; }
        .btn-logout { color: var(--color-error); gap: 6px; }

        /* Membership Card */
        .member-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
        .badge-pro {
          font-size: 0.75rem; font-weight: 700; color: var(--color-tertiary-container); background: var(--color-tertiary-fixed);
          padding: 4px 12px; border-radius: var(--radius-full); border: 1px solid rgba(222, 135, 18, 0.3);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .badge-free {
          font-size: 0.75rem; font-weight: 700; color: var(--color-primary); background: var(--color-secondary-container);
          padding: 4px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-secondary-fixed-dim);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-upgrade-link { text-decoration: none; font-size: 0.75rem; gap: 6px; }

        .usage-block { margin-top: 10px; }
        .usage-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; margin-bottom: 8px; }
        .usage-label { color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; font-weight: 500; }
        .usage-percent-badge { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; }
        .usage-percent-badge strong { color: #2563eb; font-weight: 700; }
        .usage-detail-fraction { color: var(--color-text-muted); font-size: 0.75rem; }
        .progress-bg { width: 100%; height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06); }
        .progress-fill { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3); }

        .pro-expiry-bar {
          margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--color-secondary-container);
          font-size: 0.75rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px;
        }
        .color-success { color: var(--color-success); }

        /* Coins Card */
        .coins-card {
          display: flex; justify-content: space-between; align-items: center;
          background: var(--color-surface-container-low); border: 1px solid var(--color-secondary-container);
        }
        .coins-left { display: flex; align-items: center; gap: 12px; }
        .coin-emoji { font-size: 24px; }
        .coins-label { font-size: 0.75rem; color: var(--color-secondary); display: block; }
        .coins-amount { font-size: 1.25rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-heading); }

        /* Quick Nav Card */
        .quick-nav-card h3 { font-size: 0.9375rem; margin-bottom: 12px; color: var(--color-text-muted); }
        .nav-links-list { display: flex; flex-direction: column; gap: 8px; }
        .nav-item-link {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 14px; background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container); border-radius: var(--radius-md);
          color: var(--color-text-main); text-decoration: none; font-size: 0.875rem; font-weight: 600;
          transition: all 0.2s;
        }
        .nav-item-link:hover { background: var(--color-surface-container-low); border-color: var(--color-primary-container); transform: translateX(2px); }
        .nav-item-left { display: flex; align-items: center; gap: 10px; }
        .icon-amber { color: var(--color-tertiary-container); }
        .icon-sky { color: var(--color-primary-container); }
        .icon-slate { color: var(--color-secondary); }

        .mt-lg { margin-top: var(--space-xl); }
        .skin-profile-form h3 { font-size: 1rem; margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px; }
        .radio-group, .checkbox-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .radio-label, .checkbox-label {
          padding: 8px 16px; border: 1px solid var(--color-secondary-container); border-radius: var(--radius-full);
          font-size: 0.875rem; cursor: pointer; transition: all 0.2s; user-select: none; font-family: var(--font-body);
        }
        .radio-label input, .checkbox-label input { display: none; }
        .radio-label:hover, .checkbox-label:hover { border-color: var(--color-primary-container); }
        .radio-label.active, .checkbox-label.active {
          background: var(--color-primary); color: white; border-color: transparent; font-weight: 600;
        }
        .message-box { margin-top: var(--space-lg); padding: 12px; border-radius: var(--radius-md); font-size: 0.875rem; text-align: center; }
        .message-box.success { background: var(--color-success-soft); border: 1px solid #bbf7d0; color: #16a34a; }
        .message-box.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .btn-block { width: 100%; justify-content: center; }
      `}</style>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { User, Activity, AlertCircle, Save, Crown, Coins, Sparkles, Receipt, History, ArrowRight, ShieldCheck, Zap, LogOut } from 'lucide-react'

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

  const subTierSlug = (subscription as any)?.subscription_tiers?.slug
  const subTierName = (subscription as any)?.subscription_tiers?.name
  const isPro = subscription?.status === 'active' && (
    subTierSlug === 'premium' || 
    subTierName?.toLowerCase() === 'premium' ||
    subTierName?.toLowerCase() === 'pro'
  )

  useEffect(() => {
    if (!profile?.id) return
    const fetchUsage = async () => {
      // Fetch sub tier
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
        setActiveSkinProfile(result.data)
        setMessage('Profil kulit berhasil disimpan! AI sekarang lebih mengenalmu.')
        setIsSuccess(true)
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
  const percent = Math.min((usedCount / limitCount) * 100, 100)

  return (
    <div className="profile-page animate-fade-in">
      <div className="header">
        <h1>Profil Saya</h1>
        <p>Kelola identitas, status langganan, dan preferensi kulitmu.</p>
      </div>

      {/* User Header Card */}
      <div className="card user-card">
        <div className="avatar-circle">
          <User size={32} color="var(--color-brand-500)" />
        </div>
        <div className="user-info">
          <h2>{profile?.full_name}</h2>
          <p>{profile?.username || 'Skincluver'}</p>
        </div>
        <button className="btn btn-ghost btn-sm ml-auto btn-logout" onClick={() => supabase.auth.signOut()}>
          <LogOut size={16} /> Keluar
        </button>
      </div>

      {/* Membership & Usage Dashboard Card */}
      <div className={`card member-card ${isPro ? 'pro' : 'free'}`}>
        <div className="member-header">
          <div className="badge-wrapper">
            {isPro ? (
              <span className="badge-pro"><Crown size={16} /> VIP PRO MEMBER</span>
            ) : (
              <span className="badge-free"><Zap size={14} /> FREE MEMBER</span>
            )}
          </div>
          {!isPro && (
            <Link to="/pricing" className="btn btn-primary btn-sm btn-upgrade-link">
              <Crown size={14} /> Upgrade ke PRO (Rp 49.000)
            </Link>
          )}
        </div>

        {/* Usage Bar */}
        <div className="usage-block">
          <div className="usage-meta">
            <span className="usage-label"><Activity size={16} /> Kuota AI Bulan Ini</span>
            <span className="usage-text"><strong>{usedCount}</strong> / {limitCount} Panggilan</span>
          </div>
          <div className="progress-bg">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {isPro && subscription?.expires_at && (
          <div className="pro-expiry-bar">
            <ShieldCheck size={14} className="color-success" /> Status: <strong>Aktif</strong> (Perpanjang: {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
          </div>
        )}
      </div>

      {/* Emergency Coins Card */}
      <div className="card coins-card">
        <div className="coins-left">
          <Coins size={28} className="coin-gold" />
          <div>
            <span className="coins-label">Saldo Koin Darurat</span>
            <span className="coins-amount">{coinBalance?.balance ?? 0} Koin</span>
          </div>
        </div>
        <Link to="/coin-history" className="btn btn-glass btn-sm">
          <History size={16} /> Mutasi Koin
        </Link>
      </div>

      {/* Quick Links Nav Card */}
      <div className="card quick-nav-card">
        <h3>Menu Akun & Tagihan</h3>
        <div className="nav-links-list">
          <Link to="/pricing" className="nav-item-link">
            <div className="nav-item-left">
              <Crown size={18} className="icon-gold" />
              <span>Toko Langganan (Pricing)</span>
            </div>
            <ArrowRight size={16} />
          </Link>
          <Link to="/transactions" className="nav-item-link">
            <div className="nav-item-left">
              <Receipt size={18} className="icon-purple" />
              <span>Riwayat Tagihan & Pembayaran</span>
            </div>
            <ArrowRight size={16} />
          </Link>
          <Link to="/coin-history" className="nav-item-link">
            <div className="nav-item-left">
              <History size={18} className="icon-blue" />
              <span>Riwayat Koin & Penggunaan</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Skin Profile Form */}
      <div className="card skin-profile-form">
        <h3><Activity size={18} className="inline-icon" /> Tipe Kulit Kamu</h3>
        <div className="radio-group">
          {SKIN_TYPES.map(t => (
            <label key={t.id} className={`radio-label ${skinType === t.id ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="skin_type" 
                value={t.id} 
                checked={skinType === t.id}
                onChange={() => setSkinType(t.id)} 
              />
              {t.label}
            </label>
          ))}
        </div>

        <h3 className="mt-lg"><AlertCircle size={18} className="inline-icon" /> Masalah & Sensitivitas Kulit</h3>
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

      <style>{`
        .profile-page { padding-bottom: 120px; max-width: 600px; margin: 0 auto; }
        .header { margin-bottom: var(--space-lg); }
        .header h1 { font-size: 1.75rem; margin: 0; }
        .header p { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 4px; }
        
        .card {
          background: var(--color-surface-glass);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-md);
        }
        .user-card { display: flex; align-items: center; gap: var(--space-md); }
        .avatar-circle {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(168,85,247,0.15); display: flex; align-items: center; justify-content: center;
        }
        .user-info h2 { font-size: 1.25rem; margin: 0; }
        .user-info p { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
        .ml-auto { margin-left: auto; }
        .btn-logout { color: #ef4444; gap: 6px; }

        /* Membership Card */
        .member-card { transition: all 0.3s; }
        .member-card.pro {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(168, 85, 247, 0.15));
          border-color: rgba(245, 158, 11, 0.35);
        }
        .member-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
        .badge-pro {
          font-size: 0.75rem; font-weight: 800; color: #FBBF24; background: rgba(251, 191, 36, 0.15);
          padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(251, 191, 36, 0.3);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .badge-free {
          font-size: 0.75rem; font-weight: 700; color: var(--color-brand-300); background: rgba(168, 85, 247, 0.1);
          padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(168, 85, 247, 0.2);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-upgrade-link { text-decoration: none; font-size: 0.75rem; gap: 6px; box-shadow: 0 2px 12px rgba(168, 85, 247, 0.3); }

        .usage-block { margin-top: 8px; }
        .usage-meta { display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 6px; }
        .usage-label { color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; }
        .progress-bg { width: 100%; height: 8px; background: var(--color-surface-3); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--gradient-brand); border-radius: 4px; transition: width 0.5s ease-out; }

        .pro-expiry-bar {
          margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1);
          font-size: 0.75rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px;
        }
        .color-success { color: #22c55e; }

        /* Coins Card */
        .coins-card {
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(135deg, var(--color-brand-800), var(--color-brand-950));
        }
        .coins-left { display: flex; align-items: center; gap: 12px; }
        .coin-gold { color: #FBBF24; filter: drop-shadow(0 2px 6px rgba(251,191,36,0.4)); }
        .coins-label { font-size: 0.75rem; color: var(--color-text-muted); display: block; }
        .coins-amount { font-size: 1.25rem; font-weight: 800; color: white; }

        /* Quick Nav Card */
        .quick-nav-card h3 { font-size: 0.9375rem; margin-bottom: 12px; color: var(--color-text-muted); }
        .nav-links-list { display: flex; flex-direction: column; gap: 8px; }
        .nav-item-link {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 14px; background: rgba(255,255,255,0.03);
          border: 1px solid var(--color-border); border-radius: var(--radius-lg);
          color: white; text-decoration: none; font-size: 0.875rem; font-weight: 600;
          transition: all 0.2s;
        }
        .nav-item-link:hover { background: rgba(168,85,247,0.1); border-color: var(--color-brand-400); transform: translateX(2px); }
        .nav-item-left { display: flex; align-items: center; gap: 10px; }
        .icon-gold { color: #FBBF24; }
        .icon-purple { color: var(--color-brand-300); }
        .icon-blue { color: #3b82f6; }

        .mt-lg { margin-top: var(--space-xl); }
        .skin-profile-form h3 { font-size: 1rem; margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px; }
        .radio-group, .checkbox-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .radio-label, .checkbox-label {
          padding: 8px 16px; border: 1px solid var(--color-border); border-radius: 20px;
          font-size: 0.875rem; cursor: pointer; transition: all 0.2s; user-select: none;
        }
        .radio-label input, .checkbox-label input { display: none; }
        .radio-label:hover, .checkbox-label:hover { border-color: var(--color-brand-400); }
        .radio-label.active, .checkbox-label.active {
          background: var(--gradient-brand); color: white; border-color: transparent; font-weight: 600;
        }
        .message-box { margin-top: var(--space-lg); padding: 12px; border-radius: var(--radius-md); font-size: 0.875rem; text-align: center; }
        .message-box.success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #16a34a; }
        .message-box.error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
      `}</style>
    </div>
  )
}

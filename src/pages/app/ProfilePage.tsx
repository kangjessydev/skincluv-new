// src/pages/app/ProfilePage.tsx
// Aligned with DashboardPage design system (v0-profile-* prefix, CSS tokens)
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import {
  Activity, AlertCircle, Save, Crown, Coins, Receipt,
  History, ArrowRight, ShieldCheck, Zap, LogOut,
} from 'lucide-react'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'
import type { SkinProfile, SkinType } from '@/types/database'

const SKIN_TYPES = [
  { id: 'normal', label: 'Normal' },
  { id: 'dry', label: 'Kering (Dry)' },
  { id: 'oily', label: 'Berminyak (Oily)' },
  { id: 'combination', label: 'Kombinasi' },
  { id: 'sensitive', label: 'Sensitif' },
]

const CONCERNS_LIST = [
  'Jerawat (Acne)', 'Flek Hitam', 'Kerutan', 'Komedo', 'Kusam',
  'Kemerahan', 'Pori Besar', 'Alergi Parfum', 'Alergi Alkohol',
]

export default function ProfilePage() {
  const { profile, activeSkinProfile, setActiveSkinProfile, subscription, coinBalance, isAdmin, userRoles } = useAuthStore()
  const [skinType, setSkinType] = useState(activeSkinProfile?.skin_type || 'normal')
  const [concerns, setConcerns] = useState<string[]>(activeSkinProfile?.skin_concerns || [])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number; name: string } | null>(null)

  const canAccessAdmin =
    isAdmin ||
    userRoles.some((r) =>
      ['super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer', 'admin'].includes(r)
    )

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
            limit: cfg.monthly_limit,
          })
        }
      }
    }
    fetchUsage()
  }, [profile?.id, subscription])

  const handleToggleConcern = (c: string) => {
    setConcerns((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
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

      if (existErr && existErr.code !== 'PGRST116') throw existErr

      let result
      if (existing) {
        result = await supabase
          .from('skin_profiles')
          .update({ skin_type: skinType, skin_concerns: concerns })
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('skin_profiles')
          .insert({ user_id: profile.id, skin_type: skinType, skin_concerns: concerns, is_active: true })
          .select()
          .single()
      }

      if (result.error) throw result.error
      if (result.data) {
        setActiveSkinProfile(result.data as unknown as SkinProfile)
        setMessage('Profil kulit berhasil disimpan! Rekomendasi AI sekarang lebih terpersonalisasi.')
        setIsSuccess(true)
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
  const limitCount = usageInfo?.limit && usageInfo.limit > 0 ? usageInfo.limit : isPro ? 500 : 100
  const usedPercent = Math.min(Math.round((usedCount / limitCount) * 100), 100)
  const remainingPercent = Math.max(0, 100 - usedPercent)

  // Progress bar color via CSS variable cascade
  const barColor =
    usedPercent >= 90 ? 'var(--color-status-alert)' :
    usedPercent >= 75 ? 'var(--color-status-attention)' :
    'var(--color-teal)'

  const tierLabel = isPro ? 'VIP PRO MEMBER' : isGlow ? 'GLOW MEMBER' : 'FREE ACCOUNT'
  const tierClass = isPro ? 'pro' : isGlow ? 'glow' : 'free'

  return (
    <div className="v0-profile-page">
      <div className="v0-profile-header">
        <h1>Profil Saya</h1>
        <p>Kelola identitas, status keanggotaan, dan preferensi kulitmu.</p>
      </div>

      <div className="v0-profile-grid">
        {/* ── Left Column: Account & Membership ── */}
        <div className="v0-profile-col">

          {/* User header */}
          <div className="v0-profile-card">
            <div className="v0-profile-user-row">
              <div className="v0-profile-avatar">
                {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="v0-profile-user-info">
                <p className="v0-profile-user-name">{profile?.full_name}</p>
                <p className="v0-profile-user-handle">{profile?.username || 'Pelanggan Skincluv'}</p>
              </div>
              <button className="v0-profile-logout-btn" onClick={() => supabase.auth.signOut()}>
                <LogOut size={15} /> Keluar
              </button>
            </div>
          </div>

          {/* Membership & Usage */}
          <div className="v0-profile-card">
            <div className="v0-profile-member-header">
              <span className={`v0-profile-tier-badge ${tierClass}`}>
                {isPro ? <Crown size={13} /> : <Zap size={13} />}
                {tierLabel}
              </span>
              {!isPro && (
                <Link to="/pricing" className="v0-profile-upgrade-btn">
                  <Crown size={13} /> Upgrade
                </Link>
              )}
            </div>

            <div className="v0-profile-usage-label">
              <span className="v0-profile-usage-label-left">
                <Activity size={14} /> Kuota Universal AI Bulan Ini
              </span>
              {isFree ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Gunakan Credits Misi</span>
              ) : (
                <span>
                  <span className="v0-profile-usage-remaining">{remainingPercent}% Tersisa</span>
                  <span className="v0-profile-usage-used">({usedPercent}% terpakai)</span>
                </span>
              )}
            </div>
            <div className="v0-profile-usage-bar-bg">
              <div
                className="v0-profile-usage-bar-fill"
                style={{ width: isFree ? '0%' : `${Math.max(usedPercent, 2)}%`, background: barColor }}
              />
            </div>
            <div className="v0-profile-usage-hint">
              {isPro
                ? <span><strong>VIP PRO</strong>: Termasuk Chatbot Dermatologist Expert, Web Search Klinis & Scan Wajah. Kuota 500x terasa unlimited.</span>
                : isGlow
                ? <span><strong>Satu Kuota Bersama</strong>: Bebas dipakai untuk Chatbot, Scan Wajah, & Scan Komposisi.</span>
                : <span><strong>Akun Gratis</strong>: Akses scan dan chat menggunakan saldo AI Credits dari misi harian.</span>
              }
            </div>

            {!isFree && subscription?.expires_at && (
              <div className="v0-profile-expiry-bar">
                <ShieldCheck size={13} />
                Status: <strong>Aktif</strong> (Perpanjang:{' '}
                {new Date(subscription.expires_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })})
              </div>
            )}
          </div>

          {/* AI Credits balance */}
          <div className="v0-profile-card">
            <div className="v0-profile-credits-row">
              <div className="v0-profile-credits-left">
                <Coins size={26} className="v0-profile-credits-icon" />
                <div>
                  <span className="v0-profile-credits-label">Saldo AI Credits</span>
                  <span className="v0-profile-credits-amount">{coinBalance?.balance ?? 0} Credits</span>
                </div>
              </div>
              <Link to="/coin-history" className="v0-profile-credits-link">
                <History size={14} /> Mutasi
              </Link>
            </div>
          </div>

          {/* Quick nav */}
          <div className="v0-profile-card">
            <p className="v0-profile-nav-title">Menu Akun & Tagihan</p>
            <div className="v0-profile-nav-list">
              <Link to="/pricing" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <Crown size={17} className="v0-profile-nav-icon-amber" />
                  <span>Toko Langganan</span>
                </span>
                <ArrowRight size={15} />
              </Link>
              <Link to="/transactions" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <Receipt size={17} className="v0-profile-nav-icon-teal" />
                  <span>Riwayat Tagihan & Pembayaran</span>
                </span>
                <ArrowRight size={15} />
              </Link>
              <Link to="/coin-history" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <History size={17} className="v0-profile-nav-icon-muted" />
                  <span>Riwayat Mutasi Credits</span>
                </span>
                <ArrowRight size={15} />
              </Link>
              <Link to="/privacy-center" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <ShieldCheck size={17} className="v0-profile-nav-icon-green" />
                  <span>Pusat Privasi & Hak Hapus Data</span>
                </span>
                <ArrowRight size={15} />
              </Link>
              {canAccessAdmin && (
                <Link to="/admin" className="v0-profile-nav-item admin">
                  <span className="v0-profile-nav-item-left">
                    <ShieldCheck size={17} />
                    <span>Admin Control Center</span>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Skin Profile Form ── */}
        <div className="v0-profile-col">
          <div className="v0-profile-card">
            <p className="v0-profile-form-section-title">
              <Activity size={17} /> Tipe Kulit Kamu
            </p>
            <div className="v0-profile-chip-group">
              {SKIN_TYPES.map((t) => (
                <label key={t.id} className={`v0-profile-chip ${skinType === t.id ? 'active' : ''}`}>
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

            <div className="v0-profile-form-spacer">
              <p className="v0-profile-form-section-title">
                <AlertCircle size={17} /> Masalah & Sensitivitas Kulit
              </p>
              <div className="v0-profile-chip-group">
                {CONCERNS_LIST.map((c) => (
                  <label key={c} className={`v0-profile-chip ${concerns.includes(c) ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={concerns.includes(c)}
                      onChange={() => handleToggleConcern(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            {message && (
              <div className={`v0-profile-message ${isSuccess ? 'success' : 'error'}`}>{message}</div>
            )}

            <button className="v0-profile-save-btn" onClick={handleSave} disabled={loading}>
              <Save size={17} />
              {loading ? 'Menyimpan...' : 'Simpan Profil Kulit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

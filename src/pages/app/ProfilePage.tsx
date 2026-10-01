// src/pages/app/ProfilePage.tsx
// Hub Pengaturan & Akun (RFC 020: Information Architecture Overhaul)
// Aligned with DashboardPage design system (v0-profile-* prefix, CSS tokens)
// Acting as the central navigation hub to dedicated sub-pages (/profile/skin, /profile/billing, /privacy-center)

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import {
  Activity, Crown, Coins, Receipt,
  History, ArrowRight, ShieldCheck, Zap, LogOut,
} from 'lucide-react'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'

export default function ProfilePage() {
  const navigate = useNavigate()
  const {
    profile,
    activeSkinProfile,
    subscription,
    coinBalance,
    isAdmin,
    userRoles,
    reset,
  } = useAuthStore()

  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number; name: string } | null>(null)

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      reset()
      navigate('/login')
    } catch (err) {
      console.error('Signout error:', err)
    }
  }

  const canAccessAdmin =
    isAdmin ||
    userRoles.some((r) =>
      ['super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer', 'admin'].includes(r)
    )

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const isFree = !isPro && !isGlow

  // Fetch quota usage for the universal_ai engine
  useEffect(() => {
    let isMounted = true

    async function fetchQuota() {
      try {
        if (!profile?.id) return

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('id, tier_id')
          .eq('user_id', profile.id)
          .eq('status', 'active')
          .maybeSingle()

        if (!subData?.tier_id) return

        const { data: featureData } = await supabase
          .from('ai_features')
          .select('id, name')
          .eq('slug', 'universal_ai')
          .maybeSingle()

        if (!featureData?.id) return

        const { data: cfg } = await supabase
          .from('quota_configs')
          .select('monthly_limit')
          .eq('tier_id', subData.tier_id)
          .eq('feature_id', featureData.id)
          .maybeSingle()

        if (!cfg) return

        const { data: usage } = await supabase
          .from('quota_usage')
          .select('used_count')
          .eq('user_id', profile.id)
          .eq('feature_id', featureData.id)
          .maybeSingle()

        if (isMounted) {
          setUsageInfo({
            used: usage?.used_count || 0,
            limit: cfg.monthly_limit || 0,
            name: featureData.name || 'Universal AI',
          })
        }
      } catch (err) {
        console.error('Error fetching quota usage:', err)
      }
    }

    if (isActivePremium(subscription) || isActiveGlow(subscription)) {
      fetchQuota()
    }

    return () => {
      isMounted = false
    }
  }, [profile?.id, subscription])

  const usedCount = usageInfo?.used || 0
  const limitCount = usageInfo?.limit && usageInfo.limit > 0 ? usageInfo.limit : isPro ? 500 : 100
  const usedPercent = Math.min(Math.round((usedCount / limitCount) * 100), 100)
  const remainingPercent = Math.max(0, 100 - usedPercent)

  const barColor =
    usedPercent >= 90 ? 'var(--color-status-alert)' :
    usedPercent >= 75 ? 'var(--color-status-attention)' :
    'var(--color-teal)'

  const tierLabel = isPro ? 'VIP PRO MEMBER' : isGlow ? 'GLOW MEMBER' : 'FREE ACCOUNT'
  const tierClass = isPro ? 'pro' : isGlow ? 'glow' : 'free'

  // Summary counts for skin profile
  const skinTypeLabel = activeSkinProfile?.skin_type
    ? activeSkinProfile.skin_type.charAt(0).toUpperCase() + activeSkinProfile.skin_type.slice(1)
    : 'Belum diatur'
  const concernsCount = activeSkinProfile?.skin_concerns?.length || 0

  return (
    <div className="v0-profile-page">
      {/* Header */}
      <div className="v0-profile-header">
        <h1>Profil & Pengaturan</h1>
        <p>Pusat kendali akun, keanggotaan, preferensi kulit, dan privasi datamu.</p>
      </div>

      <div className="v0-profile-grid">
        {/* ── Left Column: Identity & Balance Summary ── */}
        <div className="v0-profile-col">
          {/* User Profile Card */}
          <div className="v0-profile-card">
            <div className="v0-profile-user-row">
              <div className="v0-profile-avatar">
                {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="v0-profile-user-info">
                <p className="v0-profile-user-name">{profile?.full_name}</p>
                <p className="v0-profile-user-handle">{profile?.username || 'Pelanggan Skincluv'}</p>
              </div>
              <button className="v0-profile-logout-btn" onClick={handleSignOut} title="Keluar dari akun">
                <LogOut size={15} /> Keluar
              </button>
            </div>
          </div>

          {/* Membership & Quota Summary */}
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

            <div className="v0-profile-usage-status-row" style={{ marginTop: 14 }}>
              <span className="v0-profile-status-dot" />
              <span>
                Status: <strong>{isActivePremium(subscription) ? 'Aktif' : 'Gratis'}</strong>
                {subscription?.expires_at && (
                  <> (Perpanjang: {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})</>
                )}
              </span>
            </div>

            <div style={{ marginTop: 14 }}>
              <Link to="/profile/billing" className="v0-profile-hub-action-btn">
                <span>Kelola Kuota & Tagihan</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* AI Credits Balance Card */}
          <div className="v0-profile-card">
            <div className="v0-profile-credits-card">
              <div className="v0-profile-credits-info">
                <div className="v0-profile-credits-title">
                  <Coins size={15} /> Saldo AI Credits
                </div>
                <div className="v0-profile-credits-amount">
                  {coinBalance?.balance ?? 0}
                  <span className="v0-profile-credits-unit">Credits</span>
                </div>
              </div>
              <Link to="/pricing" className="v0-profile-credits-buy-btn">
                + Beli Credits
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right Column: Hub Navigasi Sub-Pages ── */}
        <div className="v0-profile-col">
          {/* Hub Card 1: Profil & Preferensi Kulit */}
          <div className="v0-profile-card v0-profile-hub-card">
            <div className="v0-profile-hub-header">
              <span className="v0-profile-nav-icon-wrap teal" style={{ width: 40, height: 40 }}>
                <Activity size={20} />
              </span>
              <div style={{ flex: 1 }}>
                <h3 className="v0-profile-hub-title">Profil & Preferensi Kulit</h3>
                <p className="v0-profile-hub-sub">
                  Atur tipe kulit wajah, target perawatan harian, dan bahan yang ingin kamu hindari untuk memandu analisis personal Skinsistant AI.
                </p>
              </div>
            </div>

            <div className="v0-profile-hub-meta-row">
              <span className="v0-profile-hub-meta-tag">
                Tipe Kulit: <strong>{skinTypeLabel}</strong>
              </span>
              <span className="v0-profile-hub-meta-tag">
                Target & Sensitivitas: <strong>{concernsCount} Dipilih</strong>
              </span>
            </div>

            <Link to="/profile/skin" className="v0-profile-hub-action-btn">
              <span>Kelola Profil & Preferensi Kulit</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Hub Card 2: Pusat Privasi & Hak Hapus Data */}
          <div className="v0-profile-card v0-profile-hub-card">
            <div className="v0-profile-hub-header">
              <span className="v0-profile-nav-icon-wrap green" style={{ width: 40, height: 40 }}>
                <ShieldCheck size={20} />
              </span>
              <div style={{ flex: 1 }}>
                <h3 className="v0-profile-hub-title">Pusat Privasi & Hak Hapus Data</h3>
                <p className="v0-profile-hub-sub">
                  Kendali privasi data biometrik, izin memori klinis chatbot Skinsistant AI, dan hak penghapusan akun permanen (UU PDP No. 27/2022).
                </p>
              </div>
            </div>

            <div className="v0-profile-hub-meta-row">
              <span className="v0-profile-hub-meta-tag">
                Perlindungan: <strong>UU PDP No. 27/2022</strong>
              </span>
              <span className="v0-profile-hub-meta-tag">
                Biometrik: <strong>Terkontrol</strong>
              </span>
            </div>

            <Link to="/privacy-center" className="v0-profile-hub-action-btn">
              <span>Buka Pusat Privasi & Data</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Hub Card 3: Akses Riwayat Aktivitas & Tagihan */}
          <div className="v0-profile-card">
            <p className="v0-profile-nav-title">Riwayat Aktivitas & Pembayaran</p>
            <div className="v0-profile-nav-list">
              <Link to="/transactions" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <span className="v0-profile-nav-icon-wrap teal"><Receipt size={16} /></span>
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-ink)' }}>Faktur & Tagihan Tripay</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Status pembayaran langganan</span>
                  </div>
                </span>
                <ArrowRight size={15} className="v0-profile-nav-arrow" />
              </Link>
              <Link to="/coin-history" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <span className="v0-profile-nav-icon-wrap slate"><History size={16} /></span>
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-ink)' }}>Mutasi AI Credits</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Riwayat debit dan perolehan credits</span>
                  </div>
                </span>
                <ArrowRight size={15} className="v0-profile-nav-arrow" />
              </Link>
              {canAccessAdmin && (
                <Link to="/admin" className="v0-profile-nav-item admin">
                  <span className="v0-profile-nav-item-left">
                    <span className="v0-profile-nav-icon-wrap indigo"><ShieldCheck size={16} /></span>
                    <div>
                      <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-ink)' }}>Admin Control Center</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Panel manajemen sistem Skincluv</span>
                    </div>
                  </span>
                  <ArrowRight size={15} className="v0-profile-nav-arrow" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

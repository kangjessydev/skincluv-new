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
    <div className="cluv-page">
      {/* Header */}
      <div className="cluv-mb-6">
        <h1 className="cluv-title-page">Profil & Pengaturan</h1>
        <p className="cluv-caption cluv-text-muted">Pusat kendali akun, keanggotaan, preferensi kulit, dan privasi datamu.</p>
      </div>

      <div className="cluv-grid cols-2 cluv-gap-6">
        {/* ── Left Column: Identity & Balance Summary ── */}
        <div className="cluv-flex-col cluv-gap-5">
          {/* User Profile Card */}
          <div className="cluv-card cluv-flex-between cluv-items-center cluv-flex-wrap cluv-gap-3">
            <div className="cluv-flex-row cluv-items-center cluv-gap-3">
              <div className="cluv-avatar is-lg">
                {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="cluv-flex-col">
                <span className="cluv-body cluv-font-bold">{profile?.full_name || 'Pengguna Skincluv'}</span>
                <span className="cluv-caption cluv-text-muted">{profile?.username || 'Pelanggan Skincluv'}</span>
              </div>
            </div>
            <button
              type="button"
              className="cluv-btn is-ghost is-sm cluv-text-rose"
              onClick={handleSignOut}
              title="Keluar dari akun"
            >
              <LogOut size={15} /> Keluar
            </button>
          </div>

          {/* Membership & Quota Summary */}
          <div className="cluv-card cluv-flex-col cluv-gap-4">
            <div className="cluv-flex-between cluv-items-center">
              <span className={`cluv-badge ${isPro ? 'is-gold' : isGlow ? 'is-teal' : 'is-slate'}`}>
                {isPro ? <Crown size={13} /> : <Zap size={13} />}
                {tierLabel}
              </span>
              {!isPro && (
                <Link to="/pricing" className="cluv-btn is-outline is-sm">
                  <Crown size={13} /> Upgrade
                </Link>
              )}
            </div>

            <div className="cluv-flex-col cluv-gap-2">
              <div className="cluv-flex-between cluv-items-center">
                <span className="cluv-caption cluv-font-bold cluv-flex-row cluv-items-center cluv-gap-1.5">
                  <Activity size={14} className="cluv-text-teal" /> Kuota Universal AI Bulan Ini
                </span>
                {isFree ? (
                  <span className="cluv-caption cluv-text-muted">Gunakan Credits Misi</span>
                ) : (
                  <span className="cluv-caption">
                    <strong className="cluv-text-teal">{remainingPercent}% Tersisa</strong>{' '}
                    <span className="cluv-text-muted">({usedPercent}% terpakai)</span>
                  </span>
                )}
              </div>

              <div className="cluv-progress-track">
                <div
                  className={`cluv-progress-bar ${usedPercent >= 90 ? 'is-rose' : usedPercent >= 75 ? 'is-amber' : ''}`}
                  style={{ width: isFree ? '0%' : `${Math.max(usedPercent, 2)}%` }}
                />
              </div>
            </div>

            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-pt-1">
              <span className={`cluv-dot is-pulse ${isActivePremium(subscription) ? 'is-teal' : 'is-slate'}`} />
              <span className="cluv-caption">
                Status: <strong>{isActivePremium(subscription) ? 'Aktif' : 'Gratis'}</strong>
                {subscription?.expires_at && (
                  <> (Perpanjang: {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})</>
                )}
              </span>
            </div>

            <Link to="/profile/billing" className="cluv-btn is-outline is-sm cluv-w-full cluv-justify-between cluv-mt-1">
              <span>Kelola Kuota & Tagihan</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* AI Credits Balance Card */}
          <div className="cluv-card cluv-flex-between cluv-items-center cluv-flex-wrap cluv-gap-3">
            <div className="cluv-flex-row cluv-items-center cluv-gap-3">
              <div className="cluv-card-icon-wrap is-sm is-gold">
                <Coins size={18} />
              </div>
              <div className="cluv-flex-col">
                <span className="cluv-caption cluv-text-muted">Saldo AI Credits</span>
                <span className="cluv-title-card cluv-font-bold cluv-text-gold">
                  {coinBalance?.balance ?? 0} Credits
                </span>
              </div>
            </div>
            <Link to="/pricing" className="cluv-btn is-primary is-sm">
              + Beli Credits
            </Link>
          </div>
        </div>

        {/* ── Right Column: Hub Navigasi Sub-Pages ── */}
        <div className="cluv-flex-col cluv-gap-5">
          {/* Hub Card 1: Profil & Preferensi Kulit */}
          <div className="cluv-card cluv-flex-col cluv-gap-4">
            <div className="cluv-flex-row cluv-items-start cluv-gap-3">
              <div className="cluv-card-icon-wrap is-sm is-teal">
                <Activity size={20} />
              </div>
              <div className="cluv-flex-col cluv-gap-1 cluv-flex-1">
                <h3 className="cluv-title-card">Profil &amp; Preferensi Kulit</h3>
                <p className="cluv-caption cluv-text-muted">
                  Atur tipe kulit wajah, target perawatan harian, dan bahan yang ingin kamu hindari untuk memandu analisis personal Skinsistant AI.
                </p>
              </div>
            </div>

            <div className="cluv-flex-row cluv-gap-2 cluv-flex-wrap">
              <span className="cluv-badge is-slate">
                Tipe Kulit: <strong className="cluv-ml-1">{skinTypeLabel}</strong>
              </span>
              <span className="cluv-badge is-slate">
                Target &amp; Sensitivitas: <strong className="cluv-ml-1">{concernsCount} Dipilih</strong>
              </span>
            </div>

            <Link to="/profile/skin" className="cluv-btn is-outline is-sm cluv-w-full cluv-justify-between">
              <span>Kelola Profil &amp; Preferensi Kulit</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Hub Card 2: Pusat Privasi & Hak Hapus Data */}
          <div className="cluv-card cluv-flex-col cluv-gap-4">
            <div className="cluv-flex-row cluv-items-start cluv-gap-3">
              <div className="cluv-card-icon-wrap is-sm is-gold">
                <ShieldCheck size={20} />
              </div>
              <div className="cluv-flex-col cluv-gap-1 cluv-flex-1">
                <h3 className="cluv-title-card">Pusat Privasi &amp; Hak Hapus Data</h3>
                <p className="cluv-caption cluv-text-muted">
                  Kendali privasi data biometrik, izin memori klinis chatbot Skinsistant AI, dan hak penghapusan akun permanen (UU PDP No. 27/2022).
                </p>
              </div>
            </div>

            <div className="cluv-flex-row cluv-gap-2 cluv-flex-wrap">
              <span className="cluv-badge is-teal">
                Perlindungan: <strong className="cluv-ml-1">UU PDP No. 27/2022</strong>
              </span>
              <span className="cluv-badge is-slate">
                Biometrik: <strong className="cluv-ml-1">Terkontrol</strong>
              </span>
            </div>

            <Link to="/privacy-center" className="cluv-btn is-outline is-sm cluv-w-full cluv-justify-between">
              <span>Buka Pusat Privasi &amp; Data</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Hub Card 3: Akses Riwayat Aktivitas & Tagihan */}
          <div className="cluv-card">
            <h3 className="cluv-caption cluv-font-bold cluv-text-muted cluv-mb-3">
              RIWAYAT AKTIVITAS &amp; PEMBAYARAN
            </h3>
            <div className="cluv-flex-col cluv-gap-2.5">
              <Link to="/transactions" className="cluv-card-strip is-neutral is-interactive">
                <div className="cluv-card-strip-main">
                  <div className="cluv-card-icon-wrap is-sm">
                    <Receipt size={16} />
                  </div>
                  <div className="cluv-card-strip-body">
                    <h4 className="cluv-card-strip-title">Faktur &amp; Tagihan Tripay</h4>
                    <p className="cluv-caption cluv-text-muted">Status pembayaran langganan</p>
                  </div>
                </div>
                <ArrowRight size={16} className="cluv-text-muted" />
              </Link>
              <Link to="/coin-history" className="cluv-card-strip is-neutral is-interactive">
                <div className="cluv-card-strip-main">
                  <div className="cluv-card-icon-wrap is-sm is-gold">
                    <History size={16} />
                  </div>
                  <div className="cluv-card-strip-body">
                    <h4 className="cluv-card-strip-title">Mutasi AI Credits</h4>
                    <p className="cluv-caption cluv-text-muted">Riwayat debit dan perolehan credits</p>
                  </div>
                </div>
                <ArrowRight size={16} className="cluv-text-muted" />
              </Link>
              {canAccessAdmin && (
                <Link to="/admin" className="cluv-card-strip is-neutral is-interactive">
                  <div className="cluv-card-strip-main">
                    <div className="cluv-card-icon-wrap is-sm is-rose">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="cluv-card-strip-body">
                      <h4 className="cluv-card-strip-title">Admin Control Center</h4>
                      <p className="cluv-caption cluv-text-muted">Panel manajemen sistem Skincluv</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="cluv-text-muted" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

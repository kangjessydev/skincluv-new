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
import { Button, Badge } from '@/components/ui'

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

  const tierLabel = isPro ? 'VIP PRO MEMBER' : isGlow ? 'GLOW MEMBER' : 'FREE ACCOUNT'

  // Summary counts for skin profile
  const skinTypeLabel = activeSkinProfile?.skin_type
    ? activeSkinProfile.skin_type.charAt(0).toUpperCase() + activeSkinProfile.skin_type.slice(1)
    : 'Belum diatur'
  const concernsCount = activeSkinProfile?.skin_concerns?.length || 0

  const firstName = profile?.full_name?.split(' ')[0] || 'Pengguna'
  const userInitials = profile?.full_name?.charAt(0).toUpperCase() || 'S'

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* Header */}
      <div className="cluv-mb-4">
        <h1 className="cluv-title-section cluv-m-0">Profil & Pengaturan</h1>
        <p className="cluv-subtitle cluv-mt-1 cluv-m-0">
          Pusat kendali akun, keanggotaan, preferensi kulit, dan privasi datamu.
        </p>
      </div>

      <div className="cluv-grid cols-2 cluv-gap-6">
        {/* ── Left Column: Unified Profile Card (Identik dengan Beranda Dashboard) ── */}
        <div className="cluv-flex-col cluv-gap-5">
          <div className="cluv-mobile-unified-card">
            {/* Header: Avatar Ring + Sapaan Bersih + Kapsul Kredit */}
            <div className="cluv-mobile-unified-header">
              <div className="cluv-flex-row cluv-gap-2 cluv-items-center">
                <div className={`cluv-avatar-ring ${isPro ? 'is-pro' : 'is-free'}`}>
                  <div className="cluv-avatar-ring-inner">{userInitials}</div>
                </div>
                <span className="cluv-mobile-name">Halo, {firstName}</span>
              </div>

              <div
                className="cluv-credit-capsule"
                onClick={() => navigate('/pricing')}
                title="Isi ulang credits"
              >
                <span className="cluv-credit-capsule-val">
                  <Zap size={12} />
                  <span>{(coinBalance?.balance ?? 0).toLocaleString('id-ID')}</span>
                </span>
                <span className="cluv-credit-capsule-divider" />
                <span className="cluv-credit-capsule-add">+</span>
              </div>
            </div>

            {/* Body: Ring Kuota AI + Details + Mini Action Pills */}
            <div className="cluv-mobile-unified-body">
              {/* Kuota Ring */}
              <div className="cluv-score-ring is-sm">
                <svg className="cluv-score-svg" viewBox="0 0 80 80">
                  <circle className="cluv-score-bg-circle" cx="40" cy="40" r="34" strokeWidth="7" />
                  <circle
                    className={`cluv-score-fg-circle ${usedPercent >= 90 ? 'is-alert' : usedPercent >= 75 ? 'is-attention' : 'is-optimal'}`}
                    cx="40"
                    cy="40"
                    r="34"
                    strokeWidth="7"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 - (213.6 * Math.min(Math.max(isFree ? 0 : remainingPercent, 0), 100)) / 100}
                  />
                </svg>
                <div className="cluv-score-center">
                  <span className="cluv-score-val is-percent">
                    {isFree ? 'Free' : `${remainingPercent}%`}
                  </span>
                  <span className="cluv-score-max">Sisa</span>
                </div>
              </div>

              <div className="cluv-mobile-skin-details">
                <div className="cluv-mobile-skin-chips">
                  <Badge
                    variant={isPro ? 'gold' : isGlow ? 'teal' : 'slate'}
                    size="sm"
                    icon={isPro ? <Crown size={11} /> : <Zap size={11} />}
                  >
                    {tierLabel}
                  </Badge>
                  {activeSkinProfile?.skin_type && (
                    <span className="cluv-badge is-slate is-sm">
                      {skinTypeLabel}
                    </span>
                  )}
                </div>

                <p className="cluv-mobile-skin-punchline">
                  {isFree ? (
                    'Gunakan AI Credits Misi untuk pemindaian mandiri.'
                  ) : (
                    `Kuota Universal AI ${remainingPercent}% tersisa. Status Aktif${
                      subscription?.expires_at
                        ? ` (Perpanjang: ${new Date(subscription.expires_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })})`
                        : ''
                    }.`
                  )}
                </p>

                <div className="cluv-mobile-skin-actions">
                  <button
                    onClick={() => navigate('/profile/billing')}
                    className="cluv-mobile-action-pill is-primary"
                  >
                    <Receipt size={12} />
                    <span>Kelola Tagihan</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="cluv-mobile-action-pill is-subtle cluv-text-rose"
                    title="Keluar dari akun"
                  >
                    <LogOut size={12} />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>
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
              <Badge variant="slate">
                Tipe Kulit: <strong className="cluv-ml-1">{skinTypeLabel}</strong>
              </Badge>
              <Badge variant="slate">
                Target &amp; Sensitivitas: <strong className="cluv-ml-1">{concernsCount} Dipilih</strong>
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              block
              iconRight={<ArrowRight size={15} />}
              to="/profile/skin"
              className="cluv-justify-between"
            >
              Kelola Profil &amp; Preferensi Kulit
            </Button>
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
              <Badge variant="teal">
                Perlindungan: <strong className="cluv-ml-1">UU PDP No. 27/2022</strong>
              </Badge>
              <Badge variant="slate">
                Biometrik: <strong className="cluv-ml-1">Terkontrol</strong>
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              block
              iconRight={<ArrowRight size={15} />}
              to="/privacy-center"
              className="cluv-justify-between"
            >
              Buka Pusat Privasi &amp; Data
            </Button>
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

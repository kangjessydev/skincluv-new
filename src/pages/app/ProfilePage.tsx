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
  History, ArrowRight, ShieldCheck, Zap, LogOut, ChevronRight,
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

  const expiryDateStr = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      })
    : isFree
    ? 'Selamanya'
    : 'Aktif'

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
        {/* ── Left Column: Unified Profile Card (Mirip Beranda Dashboard) ── */}
        <div className="cluv-flex-col cluv-gap-5">
          <div className="cluv-mobile-unified-card">
            {/* Header: Avatar Ring dengan Badge Melayang di Bawah + Sapaan + Kapsul Kredit */}
            <div className="cluv-mobile-unified-header">
              <div className="cluv-flex-row cluv-gap-2.5 cluv-items-center">
                <div className="cluv-relative cluv-inline-flex">
                  <div className={`cluv-avatar-ring ${isPro ? 'is-pro' : 'is-free'}`}>
                    <div className="cluv-avatar-ring-inner">{userInitials}</div>
                  </div>
                  <div
                    className={`cluv-avatar-badge-icon ${isPro ? 'is-pro' : isGlow ? 'is-glow' : 'is-free'}`}
                    title={tierLabel}
                  >
                    {isPro ? <Crown size={9} /> : <Zap size={9} />}
                  </div>
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

            {/* Body: Kuota Bar Garis (Klik untuk ke Kelola Tagihan) + Masa Aktif */}
            <div
              className="cluv-profile-quota-box"
              onClick={() => navigate('/profile/billing')}
              role="button"
              tabIndex={0}
              title="Klik untuk kelola kuota & tagihan"
            >
              <div className="cluv-profile-quota-header">
                <span className="cluv-profile-quota-title">Kuota Universal AI</span>
                <span className="cluv-profile-quota-val">
                  {isFree ? 'Gratis' : `${remainingPercent}% Tersisa`}
                </span>
              </div>

              <div className="cluv-progress-track">
                <div
                  className={`cluv-progress-bar ${usedPercent >= 90 ? 'is-rose' : usedPercent >= 75 ? 'is-amber' : ''}`}
                  style={{ width: isFree ? '0%' : `${Math.max(usedPercent, 2)}%` }}
                />
              </div>

              <div className="cluv-profile-quota-meta">
                Masa aktif: <strong>{expiryDateStr}</strong>
              </div>
            </div>
          </div>

          {/* Mobile-Only Grouped Menu Rows (Menggantikan 3 Card Panjang di Tampilan Mobile) */}
          <div className="cluv-hide-desktop cluv-flex-col cluv-gap-4">
            {/* Grup 1: Pengaturan Akun & Kulit */}
            <div className="cluv-menu-group">
              <Link to="/profile/skin" className="cluv-menu-row">
                <div className="cluv-menu-row-main">
                  <div className="cluv-menu-row-icon is-teal">
                    <Activity size={18} />
                  </div>
                  <span className="cluv-menu-row-title">Profil &amp; Preferensi Kulit</span>
                </div>
                <div className="cluv-menu-row-trailing">
                  <span className="cluv-menu-row-status">{skinTypeLabel}</span>
                  <ChevronRight size={18} className="cluv-menu-row-chevron" />
                </div>
              </Link>

              <Link to="/privacy-center" className="cluv-menu-row">
                <div className="cluv-menu-row-main">
                  <div className="cluv-menu-row-icon is-gold">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="cluv-menu-row-title">Pusat Privasi &amp; Data</span>
                </div>
                <div className="cluv-menu-row-trailing">
                  <span className="cluv-menu-row-status">UU PDP</span>
                  <ChevronRight size={18} className="cluv-menu-row-chevron" />
                </div>
              </Link>
            </div>

            {/* Grup 2: Riwayat, Transaksi, & Akun */}
            <div className="cluv-menu-group">
              <Link to="/transactions" className="cluv-menu-row">
                <div className="cluv-menu-row-main">
                  <div className="cluv-menu-row-icon is-blue">
                    <Receipt size={18} />
                  </div>
                  <span className="cluv-menu-row-title">Faktur &amp; Tagihan Tripay</span>
                </div>
                <div className="cluv-menu-row-trailing">
                  <ChevronRight size={18} className="cluv-menu-row-chevron" />
                </div>
              </Link>

              <Link to="/coin-history" className="cluv-menu-row">
                <div className="cluv-menu-row-main">
                  <div className="cluv-menu-row-icon is-amber">
                    <History size={18} />
                  </div>
                  <span className="cluv-menu-row-title">Mutasi AI Credits</span>
                </div>
                <div className="cluv-menu-row-trailing">
                  <ChevronRight size={18} className="cluv-menu-row-chevron" />
                </div>
              </Link>

              {canAccessAdmin && (
                <Link to="/admin" className="cluv-menu-row">
                  <div className="cluv-menu-row-main">
                    <div className="cluv-menu-row-icon is-rose">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="cluv-menu-row-title">Admin Control Center</span>
                  </div>
                  <div className="cluv-menu-row-trailing">
                    <ChevronRight size={18} className="cluv-menu-row-chevron" />
                  </div>
                </Link>
              )}

              {/* Keluar dari Akun (Logout dialokasikan di row akhir menu mobile) */}
              <button
                type="button"
                onClick={handleSignOut}
                className="cluv-menu-row is-danger"
              >
                <div className="cluv-menu-row-main">
                  <div className="cluv-menu-row-icon is-rose">
                    <LogOut size={18} />
                  </div>
                  <span className="cluv-menu-row-title">Keluar dari Akun</span>
                </div>
                <div className="cluv-menu-row-trailing">
                  <ChevronRight size={18} className="cluv-menu-row-chevron" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Hub Navigasi Sub-Pages (Hanya tampil di Desktop) ── */}
        <div className="cluv-hide-mobile cluv-flex-col cluv-gap-5">
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

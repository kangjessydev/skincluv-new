// src/pages/profile/ProfileBillingPage.tsx
// Sub-page Paket Langganan, Kuota AI, & Saldo Credits (RFC 020)
// Conforming to Invariant 1 (universal_ai quota) and Invariant 17 (Dual-Track Accounting)

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'
import {
  ArrowLeft, Crown, Zap, Activity, Coins,
  Receipt, History, ArrowRight,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

export default function ProfileBillingPage() {
  const profile = useAuthStore((s) => s.profile)
  const subscription = useAuthStore((s) => s.subscription)
  const coinBalance = useAuthStore((s) => s.coinBalance)
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number; name: string } | null>(null)

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const isFree = !isPro && !isGlow

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
        console.error('Error fetching quota usage in billing page:', err)
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

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* Back link navigation */}
      <Link to="/profile" className="cluv-link is-muted cluv-flex-row cluv-items-center cluv-gap-1 cluv-mb-3">
        <ArrowLeft size={16} />
        <span>Kembali ke Profil & Pengaturan</span>
      </Link>

      {/* Header */}
      <div className="cluv-mb-6">
        <h1 className="cluv-title-page">Paket Langganan & Kuota AI</h1>
        <p className="cluv-caption cluv-text-muted">Pantau sisa kuota Universal AI bulanan, saldo AI Credits, dan riwayat tagihanmu.</p>
      </div>

      <div className="cluv-grid cols-2 cluv-gap-6">
        {/* Left Column: Membership & Quota */}
        <div className="cluv-flex-col cluv-gap-5">
          <div className="cluv-card cluv-flex-col cluv-gap-4">
            <div className="cluv-flex-between cluv-items-center">
              <Badge
                variant={isPro ? 'gold' : isGlow ? 'teal' : 'slate'}
                icon={isPro ? <Crown size={13} /> : <Zap size={13} />}
              >
                {tierLabel}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                iconLeft={<Crown size={13} />}
                to="/pricing"
              >
                {isPro ? 'Perpanjang' : 'Upgrade Paket'}
              </Button>
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

            <div className="cluv-card-note">
              {isPro ? (
                <p className="cluv-caption">
                  <strong>VIP PRO</strong>: Termasuk Chatbot Dermatologist Expert, Web Search Klinis & Scan Wajah. Kuota 500x terasa unlimited.
                </p>
              ) : isGlow ? (
                <p className="cluv-caption">
                  <strong>Satu Kuota Bersama</strong>: Bebas dipakai untuk Chatbot, Scan Wajah, & Scan Komposisi.
                </p>
              ) : (
                <p className="cluv-caption">
                  <strong>Akun Gratis</strong>: Akses scan dan chat menggunakan saldo AI Credits dari misi harian.
                </p>
              )}
            </div>

            <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-pt-2">
              <span className={`cluv-dot is-pulse ${isActivePremium(subscription) ? 'is-teal' : 'is-slate'}`} />
              <span className="cluv-caption">
                Status: <strong>{isActivePremium(subscription) ? 'Aktif' : 'Gratis'}</strong>
                {subscription?.expires_at && (
                  <> (Perpanjang: {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Credits & Transactions */}
        <div className="cluv-flex-col cluv-gap-5">
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
            <Button variant="primary" size="sm" to="/pricing">
              + Beli Credits
            </Button>
          </div>

          {/* Quick links to History */}
          <div className="cluv-card">
            <h3 className="cluv-caption cluv-font-bold cluv-text-muted cluv-mb-3">
              RIWAYAT FINANSIAL & TAGIHAN
            </h3>
            <div className="cluv-flex-col cluv-gap-2.5">
              <Link to="/transactions" className="cluv-card-strip is-neutral is-interactive">
                <div className="cluv-card-strip-main">
                  <div className="cluv-card-icon-wrap is-sm">
                    <Receipt size={16} />
                  </div>
                  <div className="cluv-card-strip-body">
                    <h4 className="cluv-card-strip-title">Riwayat Tagihan & Pembayaran</h4>
                    <p className="cluv-caption cluv-text-muted">Invoice paket dan status gateway Tripay</p>
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
                    <h4 className="cluv-card-strip-title">Riwayat Mutasi Credits</h4>
                    <p className="cluv-caption cluv-text-muted">Perolehan misi dan penggunaan AI credits</p>
                  </div>
                </div>
                <ArrowRight size={16} className="cluv-text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

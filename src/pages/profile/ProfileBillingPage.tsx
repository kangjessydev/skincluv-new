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

  const barColor =
    usedPercent >= 90 ? 'var(--color-status-alert)' :
    usedPercent >= 75 ? 'var(--color-status-attention)' :
    'var(--color-teal)'

  const tierLabel = isPro ? 'VIP PRO MEMBER' : isGlow ? 'GLOW MEMBER' : 'FREE ACCOUNT'
  const tierClass = isPro ? 'pro' : isGlow ? 'glow' : 'free'

  return (
    <div className="v0-profile-page">
      {/* Back link navigation */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/profile" className="v0-profile-back-link">
          <ArrowLeft size={16} />
          <span>Kembali ke Profil & Pengaturan</span>
        </Link>
      </div>

      {/* Header */}
      <div className="v0-profile-header">
        <h1>Paket Langganan & Kuota AI</h1>
        <p>Pantau sisa kuota Universal AI bulanan, saldo AI Credits, dan riwayat tagihanmu.</p>
      </div>

      <div className="v0-profile-grid">
        {/* Left Column: Membership & Quota */}
        <div className="v0-profile-col">
          <div className="v0-profile-card">
            <div className="v0-profile-member-header">
              <span className={`v0-profile-tier-badge ${tierClass}`}>
                {isPro ? <Crown size={13} /> : <Zap size={13} />}
                {tierLabel}
              </span>
              <Link to="/pricing" className="v0-profile-upgrade-btn">
                <Crown size={13} /> {isPro ? 'Perpanjang' : 'Upgrade Paket'}
              </Link>
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

            <div className="v0-profile-usage-status-row">
              <span className="v0-profile-status-dot" />
              <span>
                Status: <strong>{isActivePremium(subscription) ? 'Aktif' : 'Gratis'}</strong>
                {subscription?.expires_at && (
                  <> (Perpanjang: {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Credits & Transactions */}
        <div className="v0-profile-col">
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

          {/* Quick links to History */}
          <div className="v0-profile-card">
            <p className="v0-profile-nav-title">Riwayat Finansial & Tagihan</p>
            <div className="v0-profile-nav-list">
              <Link to="/transactions" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <span className="v0-profile-nav-icon-wrap teal"><Receipt size={16} /></span>
                  <span>Riwayat Tagihan & Pembayaran</span>
                </span>
                <ArrowRight size={15} className="v0-profile-nav-arrow" />
              </Link>
              <Link to="/coin-history" className="v0-profile-nav-item">
                <span className="v0-profile-nav-item-left">
                  <span className="v0-profile-nav-icon-wrap slate"><History size={16} /></span>
                  <span>Riwayat Mutasi Credits</span>
                </span>
                <ArrowRight size={15} className="v0-profile-nav-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

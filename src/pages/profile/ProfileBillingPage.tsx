// src/pages/profile/ProfileBillingPage.tsx
// Sub-page Paket Langganan, Kuota AI, & Saldo Credits (RFC 020)
// Conforming to Invariant 1 (universal_ai quota) and Invariant 17 (Dual-Track Accounting)

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'
import {
  Crown,
  Zap,
  Activity,
  Receipt,
  History,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react'

export default function ProfileBillingPage() {
  const profile = useAuthStore((s) => s.profile)
  const subscription = useAuthStore((s) => s.subscription)
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

  const expiryDateStr = useMemo(() => {
    if (!subscription?.expires_at) return isFree ? 'Permanen (Gratis)' : 'Aktif'
    const date = new Date(subscription.expires_at)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }, [subscription?.expires_at, isFree])

  return (
    <div className="cluv-canvas-focused cluv-animate-fade">
      {/* Header (Desktop only; di mobile judul sudah di topbar) */}
      <div className="cluv-hide-mobile cluv-mb-6">
        <h1 className="cluv-title-page">Paket Langganan & Kuota AI</h1>
        <p className="cluv-caption cluv-text-muted">
          Pantau status paket, kuota Universal AI bulanan, dan riwayat tagihan akunmu.
        </p>
      </div>

      <div className="cluv-flex-col cluv-gap-4">
        {/* ===================== KOTAK STATUS PAKET AKTIF & KREDIT BULAN INI ===================== */}
        <div className="cluv-card cluv-flex-col cluv-gap-4">
          {/* Header: Info Paket yang Aktif */}
          <div className="cluv-flex-between cluv-items-center">
            <div className="cluv-flex-row cluv-items-center cluv-gap-3">
              <div className={`cluv-card-icon-wrap is-sm ${isPro ? 'is-gold' : isGlow ? 'is-teal' : ''}`}>
                {isPro ? <Crown size={16} /> : <Zap size={16} />}
              </div>
              <div className="cluv-flex-col cluv-gap-1">
                <span className="cluv-font-bold cluv-text-dark" style={{ fontSize: '0.9375rem', lineHeight: 1.2 }}>
                  {tierLabel}
                </span>
                <span className="cluv-badge is-sm is-teal" style={{ alignSelf: 'flex-start' }}>
                  {isPro || isGlow ? 'Aktif' : 'Standar'}
                </span>
              </div>
            </div>
          </div>

          {/* Body: Kredit Bulan Ini + Meter */}
          <div className="cluv-flex-col cluv-gap-2 cluv-pt-1">
            <div className="cluv-flex-between cluv-items-center">
              <span className="cluv-caption cluv-font-bold cluv-flex-row cluv-items-center cluv-gap-1.5">
                <Activity
                  size={14}
                  className={isPro ? 'cluv-text-gold' : isGlow ? 'cluv-text-teal' : 'cluv-text-muted'}
                />
                <span>Kredit Bulan Ini</span>
              </span>
            </div>

            <div className="cluv-progress-track">
              <div
                className={`cluv-progress-bar ${
                  usedPercent >= 90
                    ? 'is-rose'
                    : usedPercent >= 75
                    ? 'is-amber'
                    : isPro
                    ? 'is-gold'
                    : ''
                }`}
                style={{ width: isFree ? '0%' : `${Math.max(usedPercent, 3)}%` }}
              />
            </div>

            <div className="cluv-flex-between cluv-items-center cluv-mt-1">
              <span className="cluv-micro cluv-text-muted">
                Masa aktif paket: <strong>{expiryDateStr}</strong>
              </span>

              {isFree ? (
                <span className="cluv-micro cluv-text-muted">Gratis via Credits Misi</span>
              ) : (
                <span
                  className="cluv-micro cluv-font-bold cluv-tabular-nums"
                  style={{ color: isPro ? 'var(--cluv-gold)' : 'var(--cluv-teal)' }}
                >
                  {remainingPercent}% Tersisa
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===================== FINANCIAL & BILLING HISTORY INSET MENU ===================== */}
        <div className="cluv-menu-group">
          <Link to="/transactions" className="cluv-menu-row">
            <div className="cluv-menu-row-main">
              <div className="cluv-menu-row-icon is-blue">
                <Receipt size={18} />
              </div>
              <div className="cluv-flex-col cluv-gap-0.5">
                <span className="cluv-menu-row-title">Faktur &amp; Tagihan Tripay</span>
                <span className="cluv-micro cluv-text-muted">Invoice paket langganan &amp; status bayar</span>
              </div>
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
              <div className="cluv-flex-col cluv-gap-0.5">
                <span className="cluv-menu-row-title">Riwayat Mutasi AI Credits</span>
                <span className="cluv-micro cluv-text-muted">Perolehan bonus misi &amp; penggunaan AI</span>
              </div>
            </div>
            <div className="cluv-menu-row-trailing">
              <ChevronRight size={18} className="cluv-menu-row-chevron" />
            </div>
          </Link>
        </div>

        {/* ===================== KEUNTUNGAN PAKET (GAYA CARA KERJA ANALISIS AI) ===================== */}
        <div className="cluv-card cluv-guide-card">
          <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-3">
            <Sparkles size={16} className="cluv-text-teal" />
            <h3 className="cluv-title-card is-sm cluv-m-0">Keuntungan Akses Akun Kamu</h3>
          </div>

          <div className="cluv-flex-col cluv-gap-3 cluv-mt-1">
            <div className="cluv-guide-item">
              <div className="cluv-guide-num">1</div>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Konsultasi Skinsistant AI 24/7</strong>
                <p className="cluv-guide-desc">
                  Tanya jawab perawatan kulit berbasis literatur klinis dengan konteks profil pribadi.
                </p>
              </div>
            </div>

            <div className="cluv-guide-item">
              <div className="cluv-guide-num">2</div>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Observasi 6-Zona Wajah &amp; Komposisi</strong>
                <p className="cluv-guide-desc">
                  Pemetaan visual skin barrier dan peringatan bahan berbahaya secara privat tanpa biometrik.
                </p>
              </div>
            </div>

            <div className="cluv-guide-item">
              <div className="cluv-guide-num">3</div>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">
                  {isPro ? 'Prioritas Komputasi & Web Search' : 'Dukungan Fleksibel AI Credits'}
                </strong>
                <p className="cluv-guide-desc">
                  {isPro
                    ? 'Mesin penalaran AI tercepat serta pencarian referensi dermatologi terpercaya real-time.'
                    : 'Klaim bonus credits gratis setiap hari dari Misi Glow untuk pemakaian berkelanjutan.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== FAQ INFORMASI LANGGANAN & TRANSAKSI ===================== */}
        <div className="cluv-card cluv-guide-card">
          <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-3">
            <HelpCircle size={16} className="cluv-text-teal" />
            <h3 className="cluv-title-card is-sm cluv-m-0">Pertanyaan Umum (FAQ)</h3>
          </div>

          <div className="cluv-flex-col cluv-gap-3 cluv-mt-1">
            <div className="cluv-guide-item">
              <div className="cluv-guide-num">1</div>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Apakah paket langganan bisa di-refund?</strong>
                <p className="cluv-guide-desc">
                  Pembelian paket akses dan AI Credits bersifat final serta tidak dapat dibatalkan atau di-refund, kecuali jika terjadi kendala teknis kegagalan sistem pada transaksi payment gateway.
                </p>
              </div>
            </div>

            <div className="cluv-guide-item">
              <div className="cluv-guide-num">2</div>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Apakah saldo atau kartu otomatis terpotong (auto-debit)?</strong>
                <p className="cluv-guide-desc">
                  Tidak. Skincluv tidak menerapkan sistem penagihan berulang (auto-renewal). Anda memegang kendali penuh dan transaksi hanya diproses saat melakukan checkout mandiri via Tripay.
                </p>
              </div>
            </div>

            <div className="cluv-guide-item">
              <div className="cluv-guide-num">3</div>
              <div className="cluv-guide-content">
                <strong className="cluv-guide-title">Apa yang terjadi jika kuota kredit bulanan habis?</strong>
                <p className="cluv-guide-desc">
                  Anda tetap dapat melakukan pemindaian kulit dan berkonsultasi dengan Skinsistant AI menggunakan saldo AI Credits yang diperoleh gratis dari Misi Glow harian atau melakukan isi ulang kapan saja.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


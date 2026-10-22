// src/pages/app/AppPricingPage.tsx
// Halaman Paket Akses Khusus Dashboard / App (Zen & Focused Minimalist Standard)
// Kepatuhan: Invarian 13 (No overclaim), Invarian 18 (Prepaid pricing integrity), Invarian 19 (Non-therapeutic)

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Receipt,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'
import { Button, Badge } from '@/components/ui'

export interface Tier {
  id?: string
  slug: string
  name: string
  price_idr: number
  original_price_idr?: number | null
  features_list?: string[] | null
  promo_badge?: string | null
  is_popular?: boolean
  is_active?: boolean
}

const DEFAULT_TIERS: Tier[] = [
  {
    slug: 'glow',
    name: 'Skincluv GLOW',
    price_idr: 25000,
    original_price_idr: 45000,
    promo_badge: 'Smart Starter',
    is_popular: false,
    features_list: [
      '100 Kuota Universal AI / 30 Hari',
      'Analisis Wajah & Pindai Komposisi Skincare',
      'Rekomendasi Bahan Kosmetik Terpersonalisasi',
      'Pemeriksaan Keamanan Layering Produk',
      'Riwayat Observasi Kulit Tersimpan Rapi',
    ],
  },
  {
    slug: 'premium',
    name: 'Skincluv PRO',
    price_idr: 49000,
    original_price_idr: 89000,
    promo_badge: '👑 Paling Diminati (85% Sahabat)',
    is_popular: true,
    features_list: [
      '500 Kuota Universal AI / 30 Hari (5x lipat)',
      'Konsultasi Skinsistant AI Chatbot Sepuasnya',
      'Prioritas Komputasi Kilat & Penalaran Mendalam',
      'Analisis Komposisi Ekstensif & Kontraindikasi',
      'Riwayat Observasi & Pelacak Progres Tanpa Batas',
      'Akses Prioritas Fitur Baru & Database BPOM',
    ],
  },
]

export default function AppPricingPage() {
  const navigate = useNavigate()
  const { user, subscription, coinBalance } = useAuthStore()
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS)
  const [loading, setLoading] = useState(false)

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const isFree = !isPro && !isGlow

  useEffect(() => {
    let isMounted = true

    async function fetchTiers() {
      try {
        const { data, error } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('is_active', true)
          .order('price_idr', { ascending: true })

        if (error) throw error
        if (isMounted && data && data.length > 0) {
          const paidOnly = data.filter((t: any) => t.slug !== 'free')
          const mapped: Tier[] = paidOnly.map((t: any) => {
            const isTierPro = t.slug === 'premium' || t.slug === 'pro'
            return {
              id: t.id,
              slug: t.slug,
              name: isTierPro ? 'Skincluv PRO' : t.name,
              price_idr: t.price_idr,
              original_price_idr: t.original_price_idr || (isTierPro ? 89000 : 45000),
              features_list: isTierPro
                ? [
                    '500 Kuota Universal AI / 30 Hari (5x lipat)',
                    'Konsultasi Skinsistant AI Chatbot Sepuasnya',
                    'Prioritas Komputasi Kilat & Penalaran Mendalam',
                    'Analisis Komposisi Ekstensif & Kontraindikasi',
                    'Riwayat Observasi & Pelacak Progres Tanpa Batas',
                    'Akses Prioritas Fitur Baru & Database BPOM',
                  ]
                : [
                    '100 Kuota Universal AI / 30 Hari',
                    'Analisis Wajah & Pindai Komposisi Skincare',
                    'Rekomendasi Bahan Kosmetik Terpersonalisasi',
                    'Pemeriksaan Keamanan Layering Produk',
                    'Riwayat Observasi Kulit Tersimpan Rapi',
                  ],
              promo_badge: isTierPro ? '👑 Paling Diminati (85% Sahabat)' : 'Smart Starter',
              is_popular: isTierPro,
              is_active: t.is_active,
            }
          })

          mapped.sort((a, b) => a.price_idr - b.price_idr)
          setTiers(mapped)
        }
      } catch (err) {
        console.warn('[AppPricingPage] Using default tiers fallback:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTiers()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSelectPlan = (planSlug: string) => {
    navigate(`/checkout?plan=${planSlug}`)
  }

  // Hitung sisa hari paket jika aktif
  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const activeTierLabel = isPro ? 'Skincluv PRO ✨' : isGlow ? 'Skincluv GLOW ⚡' : 'Free Explorer 🌱'

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* ── 1. HEADER HALAMAN BERSIH ── */}
      <header className="cluv-mb-5">
        <div className="cluv-badge is-teal is-sm cluv-mb-2">
          <Crown size={13} />
          <span>AKSES PRABAYAR</span>
        </div>
        <h1 className="cluv-title-section cluv-m-0">Kelola Paket &amp; Akses</h1>
        <p className="cluv-subtitle cluv-mt-1">
          Pilih paket akses 30 hari sesuai kebutuhan perawatan kulitmu. 100% Prabayar, sekali bayar tanpa auto-debit.
        </p>
      </header>

      {/* ── 2. COMPACT STATUS BAR (Desktop 1-Line vs Mobile Clean Stack) ── */}
      <div className="cluv-card is-compact cluv-mb-6">
        <div className="cluv-flex-responsive cluv-gap-3">
          {/* Sisi Kiri (Desktop) / Atas (Mobile): Icon & Status */}
          <div className="cluv-flex-row cluv-items-center cluv-gap-3">
            <div className={`cluv-card-icon-wrap is-sm ${isPro ? 'is-gold' : isGlow ? 'is-teal' : 'is-slate'}`}>
              {isPro ? <Crown size={18} /> : isGlow ? <Zap size={18} /> : <Sparkles size={18} />}
            </div>
            <div className="cluv-flex-col cluv-gap-0.5">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <span className="cluv-caption cluv-font-bold cluv-text-dark">
                  {isPro ? 'Skincluv PRO Aktif' : isGlow ? 'Skincluv GLOW Aktif' : 'Tier Dasar Free Explorer'}
                </span>
                {/* Di desktop: Bullet point pemisah satu baris */}
                <span className="cluv-caption cluv-text-muted cluv-hide-mobile">•</span>
                <span className="cluv-caption cluv-text-muted cluv-hide-mobile">
                  {isPro || isGlow ? (
                    <>
                      Berakhir <strong>{new Date(subscription!.expires_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>{' '}
                      <span className="cluv-text-teal cluv-font-bold">({daysRemaining} hari tersisa)</span>
                    </>
                  ) : (
                    <>Saldo: <strong>{coinBalance?.balance ?? 0} AI Credits</strong></>
                  )}
                </span>
              </div>
              {/* Di mobile: Subtitle keterangan rapi di baris kedua tanpa bullet menggantung */}
              <div className="cluv-micro cluv-text-muted cluv-hide-desktop">
                {isPro || isGlow ? (
                  <>
                    Berakhir <strong>{new Date(subscription!.expires_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>{' '}
                    <span className="cluv-text-teal cluv-font-bold">({daysRemaining} hari tersisa)</span>
                  </>
                ) : (
                  <>Saldo: <strong>{coinBalance?.balance ?? 0} AI Credits</strong></>
                )}
              </div>
            </div>
          </div>

          {/* Sisi Kanan (Desktop) / Bawah (Mobile): Tombol Aksi */}
          <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-w-full-mobile">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Receipt size={14} />}
              to="/transactions"
              className="cluv-flex-1-mobile"
            >
              Riwayat Tagihan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              to="/profile/billing"
              className="cluv-flex-1-mobile"
            >
              Kelola di Billing →
            </Button>
          </div>
        </div>
      </div>

      {/* ── 3. DUA KARTU PAKET UTAMA (GLOW VS PRO) ── */}
      <div className="cluv-grid cols-2 cluv-gap-6 cluv-mb-6">
        {tiers.map((tier) => {
          const isTierPro = tier.slug === 'premium' || tier.slug === 'pro'
          const isTierGlow = tier.slug === 'glow'

          const hasOriginalPrice =
            typeof tier.original_price_idr === 'number' &&
            tier.original_price_idr > tier.price_idr &&
            tier.original_price_idr > 0

          const discountPct = hasOriginalPrice
            ? Math.round(((tier.original_price_idr! - tier.price_idr) / tier.original_price_idr!) * 100)
            : 0

          const subtitle = isTierPro
            ? 'Pendampingan komprehensif & konsultasi AI tanpa batas.'
            : 'Evaluasi berkala dan cek botol skincare baru.'

          const dailyPrice = isTierPro ? '~Rp 1.600' : '~Rp 830'
          const features = tier.features_list && tier.features_list.length > 0 ? tier.features_list : []

          return (
            <div
              key={tier.slug}
              className={`cluv-card cluv-flex-col cluv-justify-between ${
                isTierPro ? 'is-highlight' : ''
              }`}
            >
              <div>
                {/* Header Kartu */}
                <div className="cluv-flex-between cluv-items-center cluv-mb-3">
                  <Badge
                    variant={isTierPro ? 'gold' : 'teal'}
                    size="sm"
                    icon={isTierPro ? <Crown size={12} /> : undefined}
                  >
                    {tier.promo_badge}
                  </Badge>
                  {hasOriginalPrice && (
                    <div className="cluv-flex-row cluv-items-center cluv-gap-1.5">
                      <del className="cluv-caption cluv-text-muted">
                        Rp {tier.original_price_idr?.toLocaleString('id-ID')}
                      </del>
                      <Badge variant={isTierPro ? 'rose' : 'teal'} size="sm">
                        Hemat {discountPct}%
                      </Badge>
                    </div>
                  )}
                </div>

                <h3 className="cluv-title-card cluv-m-0">{tier.name}</h3>
                <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-mb-4">{subtitle}</p>

                {/* Slot Harga & Nilai Harian */}
                <div className="cluv-mb-5 cluv-pb-4 cluv-border-b">
                  <div className="cluv-price-val">
                    <span>
                      Rp {tier.price_idr.toLocaleString('id-ID')}{' '}
                      <span className="cluv-price-period">/ 30 hari</span>
                    </span>
                  </div>
                  <div className={`cluv-micro cluv-font-bold cluv-mt-1.5 ${isTierPro ? 'cluv-text-gold' : 'cluv-text-teal'}`}>
                    Hanya {dailyPrice} per hari • Sekali bayar tanpa auto-debit
                  </div>
                </div>

                {/* Daftar Fitur Ringkas & Bernapas */}
                <ul className="cluv-feature-list cluv-mb-6">
                  {features.map((feat, idx) => (
                    <li key={idx} className="cluv-feature-item">
                      <CheckCircle2
                        size={16}
                        className={isTierPro ? 'cluv-text-gold' : 'cluv-text-teal'}
                      />
                      <span className={`cluv-caption ${isTierPro && idx === 1 ? 'cluv-font-bold cluv-text-dark' : 'cluv-text-dark'}`}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tombol Aksi Konversi */}
              <div className="cluv-mt-auto">
                {isPro && isTierPro ? (
                  <Button
                    variant="primary"
                    size="md"
                    block
                    iconLeft={<Crown size={15} />}
                    iconRight={<ArrowRight size={15} />}
                    onClick={() => handleSelectPlan('pro')}
                  >
                    Perpanjang PRO (Rp {tier.price_idr.toLocaleString('id-ID')})
                  </Button>
                ) : isPro && isTierGlow ? (
                  <Button variant="secondary" size="md" block disabled>
                    Sudah Termasuk di PRO
                  </Button>
                ) : isGlow && isTierGlow ? (
                  <Button
                    variant="secondary"
                    size="md"
                    block
                    iconRight={<ArrowRight size={15} />}
                    onClick={() => handleSelectPlan('glow')}
                  >
                    Perpanjang GLOW (Rp {tier.price_idr.toLocaleString('id-ID')})
                  </Button>
                ) : isGlow && isTierPro ? (
                  <Button
                    variant="primary"
                    size="md"
                    block
                    iconLeft={<Crown size={15} />}
                    iconRight={<ArrowRight size={15} />}
                    onClick={() => handleSelectPlan('pro')}
                  >
                    Upgrade ke PRO (Rp {tier.price_idr.toLocaleString('id-ID')})
                  </Button>
                ) : (
                  <Button
                    variant={isTierPro ? 'primary' : 'secondary'}
                    size="md"
                    block
                    iconLeft={isTierPro ? <Crown size={15} /> : undefined}
                    iconRight={<ArrowRight size={15} />}
                    onClick={() => handleSelectPlan(tier.slug)}
                  >
                    Pilih {tier.name} (Rp {tier.price_idr.toLocaleString('id-ID')})
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 4. ZEN FOOTER STRIP (1 Baris Bersih Tanpa Clutter Kotak) ── */}
      <div className="cluv-flex-between cluv-items-center cluv-flex-wrap cluv-gap-3 cluv-pt-2 cluv-pb-4">
        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-micro cluv-text-muted">
          <ShieldCheck size={16} className="cluv-text-teal shrink-0" />
          <span>100% Prabayar 30 Hari • Tanpa auto-debit • Pembayaran resmi via Tripay (QRIS &amp; Virtual Account)</span>
        </div>

        <Link to="/faq" className="cluv-micro cluv-link cluv-flex-row cluv-items-center cluv-gap-1">
          <HelpCircle size={14} />
          <span>Pusat Bantuan &amp; FAQ Tagihan →</span>
        </Link>
      </div>
    </div>
  )
}

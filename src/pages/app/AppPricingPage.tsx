// src/pages/app/AppPricingPage.tsx
// Halaman Paket Akses Khusus Dashboard / App (100% Cluv Micro-Framework)
// Kepatuhan: Invarian 13 (No overclaim), Invarian 18 (Prepaid pricing integrity), Invarian 19 (Non-therapeutic)

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Crown,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Receipt,
  HelpCircle,
  Coins,
  ShieldAlert,
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
    slug: 'free',
    name: 'Mulai Santai (Free)',
    price_idr: 0,
    original_price_idr: 0,
    promo_badge: 'Selalu Gratis',
    is_popular: false,
    features_list: [
      'Dapatkan Credits gratis dari misi harian tanpa batas',
      'Observasi visual kondisi kulit wajah via AI',
      'Cek komposisi label botol skincare sebelum membeli',
      'Curhat ringan dan tanya jawab perawatan dasar ke Skinsistant AI',
    ],
  },
  {
    slug: 'glow',
    name: 'Skincluv GLOW',
    price_idr: 25000,
    original_price_idr: 50000,
    promo_badge: 'Teman Harian Rutin',
    is_popular: false,
    features_list: [
      '100x kuota Universal AI bulanan (bebas untuk scan & konsultasi)',
      '1 kuota fleksibel tanpa batas harian yang kaku',
      'Skinsistant AI responsif dengan penjelasan edukatif ramah',
      'Riwayat perkembangan kulit tersimpan multi-sesi',
      'Cadangan AI Credits dari misi harian tetap utuh tersimpan',
    ],
  },
  {
    slug: 'premium',
    name: 'Skincluv PRO',
    price_idr: 49000,
    original_price_idr: 99000,
    promo_badge: 'Paling Diminati ✨',
    is_popular: true,
    features_list: [
      '500x kuota Universal AI bulanan (bebas untuk scan & konsultasi)',
      'Reasoning AI penuh dengan penjelasan interaksi bahan aktif mendalam',
      'Prioritas komputasi OCR vision foto kemasan skincare',
      'Avatar PRO dengan Glowing Iridescent Ring berkilau',
      'Bebas curhat dan konsultasi Skinsistant AI 24/7 tanpa cemas',
      'Mendukung seluruh fitur baru lebih awal (Early Access)',
    ],
  },
]

export default function AppPricingPage() {
  const navigate = useNavigate()
  const { user, profile, subscription, coinBalance } = useAuthStore()
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
          const mapped: Tier[] = data.map((t: any) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            price_idr: t.price_idr,
            original_price_idr: t.original_price_idr,
            features_list: Array.isArray(t.features)
              ? t.features
              : typeof t.features === 'string'
              ? JSON.parse(t.features)
              : [],
            promo_badge: t.slug === 'premium' ? 'Paling Diminati ✨' : t.slug === 'glow' ? 'Teman Harian Rutin' : 'Selalu Gratis',
            is_popular: t.slug === 'premium',
            is_active: t.is_active,
          }))

          // Susun urutan: Free -> Glow -> PRO
          const order = ['free', 'glow', 'premium', 'pro']
          mapped.sort((a, b) => {
            const idxA = order.indexOf(a.slug)
            const idxB = order.indexOf(b.slug)
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB)
          })

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
    if (planSlug === 'free') return
    navigate(`/checkout?plan=${planSlug}`)
  }

  // Hitung sisa hari paket jika ada
  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const activeTierLabel = isPro ? 'Skincluv PRO ✨' : isGlow ? 'Skincluv GLOW ⚡' : 'Free Explorer 🌱'

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* ── HEADER HALAMAN ── */}
      <header className="cluv-mb-6">
        <div className="cluv-badge is-teal cluv-mb-2">
          <Crown size={14} />
          <span>PAKET AKSES PREPAID</span>
        </div>
        <h1 className="cluv-title-section cluv-m-0">Pilihan Paket Sahabat Skincluv</h1>
        <p className="cluv-subtitle cluv-mt-1">
          Sekali bayar untuk 30 hari penuh ketenangan. Tanpa perpanjangan otomatis diam-diam, tanpa biaya tersembunyi.
        </p>
      </header>

      {/* ── USER CURRENT MEMBERSHIP STATUS CARD ── */}
      <div className="cluv-card is-highlight cluv-mb-6">
        <div className="cluv-flex-between cluv-items-center cluv-flex-wrap cluv-gap-4">
          <div className="cluv-flex-row cluv-items-center cluv-gap-4">
            <div className={`cluv-card-icon-wrap is-lg ${isPro ? 'is-gold' : isGlow ? 'is-teal' : 'is-slate'}`}>
              {isPro ? <Crown size={26} /> : isGlow ? <Zap size={26} /> : <Coins size={26} />}
            </div>
            <div className="cluv-flex-col">
              <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                <span className="cluv-micro cluv-font-bold cluv-uppercase cluv-text-muted">Status Akun Kamu</span>
                <span className={`cluv-badge is-sm ${isPro ? 'is-gold' : isGlow ? 'is-teal' : 'is-slate'}`}>
                  {activeTierLabel}
                </span>
              </div>
              <div className="cluv-title-card cluv-m-0 cluv-mt-1">
                {isPro || isGlow ? (
                  <span>
                    Aktif hingga <strong>{new Date(subscription!.expires_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{' '}
                    <span className="cluv-caption cluv-text-muted">({daysRemaining} hari tersisa)</span>
                  </span>
                ) : (
                  <span>
                    Saldo: <strong>{coinBalance?.balance ?? 0} AI Credits</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="cluv-flex-row cluv-gap-2">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Receipt size={14} />}
              to="/transactions"
            >
              Riwayat Tagihan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              to="/profile/billing"
            >
              Info Kuota
            </Button>
          </div>
        </div>
      </div>

      {/* ── 3 BENTO PRICING CARDS ── */}
      <div className="cluv-grid cols-3 cluv-gap-6 cluv-mb-6">
        {tiers.map((tier) => {
          const isTierFree = tier.slug === 'free'
          const isTierGlow = tier.slug === 'glow'
          const isTierPro = tier.slug === 'premium' || tier.slug === 'pro'

          const isCurrentActive =
            (isTierFree && isFree) ||
            (isTierGlow && isGlow) ||
            (isTierPro && isPro)

          const hasOriginalPrice =
            typeof tier.original_price_idr === 'number' &&
            tier.original_price_idr > tier.price_idr &&
            tier.original_price_idr > 0

          const discountPct = hasOriginalPrice
            ? Math.round(((tier.original_price_idr! - tier.price_idr) / tier.original_price_idr!) * 100)
            : 0

          let subtitle = 'Mulai membiasakan diri mendengarkan sinyal kulit'
          if (isTierGlow) subtitle = 'Paling pas untuk observasi mingguan & curhat skincare'
          else if (isTierPro) subtitle = 'Pengalaman AI terlengkap, paling peka, dan prioritas'

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
                    variant={isTierPro ? 'gold' : isTierGlow ? 'teal' : 'slate'}
                    size="sm"
                  >
                    {tier.promo_badge || (isTierFree ? 'Gratis' : 'Prepaid')}
                  </Badge>
                  {discountPct > 0 && (
                    <Badge variant="rose" size="sm">
                      Hemat {discountPct}%
                    </Badge>
                  )}
                </div>

                <h3 className="cluv-title-card cluv-m-0">{tier.name}</h3>
                <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-mb-4">{subtitle}</p>

                {/* Harga */}
                <div className="cluv-mb-5">
                  {hasOriginalPrice && (
                    <div className="cluv-caption cluv-text-muted" style={{ textDecoration: 'line-through' }}>
                      Rp {tier.original_price_idr?.toLocaleString('id-ID')}
                    </div>
                  )}
                  <div className="cluv-flex-row cluv-items-baseline cluv-gap-1">
                    <span className="cluv-title-hero cluv-m-0 cluv-text-dark">
                      {isTierFree ? 'Rp 0' : `Rp ${tier.price_idr.toLocaleString('id-ID')}`}
                    </span>
                    <span className="cluv-caption cluv-text-muted cluv-font-bold">
                      {isTierFree ? '/ selamanya' : '/ 30 hari'}
                    </span>
                  </div>
                </div>

                {/* Garis Pemisah */}
                <div className="cluv-divider cluv-mb-4" />

                {/* Daftar Fitur */}
                <div className="cluv-flex-col cluv-gap-3 cluv-mb-6">
                  {features.map((feat, idx) => (
                    <div key={idx} className="cluv-flex-row cluv-items-start cluv-gap-2.5">
                      <CheckCircle2
                        size={17}
                        className={isTierPro ? 'cluv-text-gold' : isTierGlow ? 'cluv-text-teal' : 'cluv-text-muted'}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <span className="cluv-caption cluv-text-dark">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="cluv-mt-auto">
                {isCurrentActive ? (
                  <Button variant="outline" size="md" block disabled>
                    Paket Aktif Saat Ini
                  </Button>
                ) : isTierFree ? (
                  <Button variant="ghost" size="md" block disabled>
                    Paket Dasar Free
                  </Button>
                ) : (
                  <Button
                    variant={isTierPro ? 'primary' : 'secondary'}
                    size="md"
                    block
                    iconRight={<ArrowRight size={15} />}
                    onClick={() => handleSelectPlan(tier.slug)}
                  >
                    {isPro ? 'Ganti ke Paket Ini' : `Pilih ${tier.name}`}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── TRIPAY & PREPAID REASSURANCE STRIP ── */}
      <div className="cluv-grid cols-3 cluv-gap-4 cluv-mb-6">
        <div className="cluv-card cluv-flex-row cluv-items-start cluv-gap-3">
          <div className="cluv-card-icon-wrap is-sm is-teal">
            <ShieldCheck size={18} />
          </div>
          <div className="cluv-flex-col">
            <h4 className="cluv-caption cluv-font-bold cluv-m-0">100% Bebas Auto-Debit</h4>
            <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
              Hanya bayar saat kamu butuh. Tidak ada penarikan saldo diam-diam dari rekening atau e-wallet.
            </p>
          </div>
        </div>

        <div className="cluv-card cluv-flex-row cluv-items-start cluv-gap-3">
          <div className="cluv-card-icon-wrap is-sm is-gold">
            <Zap size={18} />
          </div>
          <div className="cluv-flex-col">
            <h4 className="cluv-caption cluv-font-bold cluv-m-0">Metode Bayar Lengkap</h4>
            <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
              QRIS instan (GoPay, OVO, Dana, ShopeePay), Virtual Account BCA/Mandiri/BRI, dan Alfamart.
            </p>
          </div>
        </div>

        <div className="cluv-card cluv-flex-row cluv-items-start cluv-gap-3">
          <div className="cluv-card-icon-wrap is-sm is-slate">
            <ShieldAlert size={18} />
          </div>
          <div className="cluv-flex-col">
            <h4 className="cluv-caption cluv-font-bold cluv-m-0">Privasi UU PDP Terlindungi</h4>
            <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mt-1">
              Data transaksi perbankan dipisahkan secara ketat dari data foto biometrik kulitmu.
            </p>
          </div>
        </div>
      </div>

      {/* ── BANTUAN & FAQ SHORTCUT BANNER ── */}
      <div className="cluv-card cluv-flex-between cluv-items-center cluv-flex-wrap cluv-gap-4">
        <div className="cluv-flex-row cluv-items-center cluv-gap-3">
          <div className="cluv-card-icon-wrap is-sm is-teal">
            <HelpCircle size={18} />
          </div>
          <div>
            <h4 className="cluv-body cluv-font-bold cluv-m-0">Ada pertanyaan seputar paket atau pembayaran?</h4>
            <p className="cluv-caption cluv-text-muted cluv-m-0">
              Pelajari mekanisme kuota Universal AI dan cara kerja pembayaran di Pusat Bantuan kami.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" to="/faq">
          Buka Tanya Jawab &amp; FAQ
        </Button>
      </div>
    </div>
  )
}

// src/pages/app/PricingPage.tsx
// Halaman Pilihan Paket Sahabat Skincluv (100% Cluv Micro-Framework Standard)
// Kepatuhan: Invarian 13 (No overclaim), Invarian 18 (Prepaid pricing integrity), Invarian 19 (Non-therapeutic)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, CheckCircle2, Sparkles, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'
import { useScrollReveal } from '@/hooks/useScrollReveal'
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

// Fallback jika database belum merespons
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
      'Cek komposisi botol skincare sebelum membeli',
      'Curhat ringan dan tanya jawab perawatan dasar ke Skinsistant'
    ]
  },
  {
    slug: 'glow',
    name: 'Skincluv GLOW',
    price_idr: 25000,
    original_price_idr: 50000,
    promo_badge: 'Teman Harian Rutin',
    is_popular: false,
    features_list: [
      '100x kuota Universal AI (bebas dipakai scan atau curhat)',
      'Satu kuota fleksibel tanpa batas harian yang kaku',
      'Skinsistant AI responsif dengan penjelasan edukatif',
      'Riwayat perkembangan kulit tersimpan multi-sesi',
      'Cadangan AI Credits dari misi harian tetap utuh tersimpan'
    ]
  },
  {
    slug: 'premium',
    name: 'Skincluv PRO',
    price_idr: 49000,
    original_price_idr: 99000,
    promo_badge: 'Paling Mengerti Kulitmu',
    is_popular: true,
    features_list: [
      '500x kuota Universal AI (sangat longgar, terasa unlimited)',
      'Deep Memory: AI mengingat riwayat curhat & perubahan kulitmu',
      'Cek kecocokan layering bahan aktif pagi & malam',
      'Pencarian literatur ilmiah bahan skincare terverifikasi (Tavily)',
      'Evaluasi kompatibilitas skin barrier & pH formula produk',
      'Prioritas komputasi AI kilat & badge sahabat PRO eksklusif'
    ]
  }
]

export default function PricingPage() {
  const navigate = useNavigate()
  const { user, subscription } = useAuthStore()
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS)

  // Initialize buttery-smooth scroll reveal observer
  useScrollReveal()

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const isFree = !isPro && !isGlow

  useEffect(() => {
    async function fetchTiers() {
      try {
        const { data, error } = await supabase
          .from('subscription_tiers')
          .select('id, slug, name, price_idr, original_price_idr, features_list, promo_badge, is_popular, is_active')
          .eq('is_active', true)
          .order('price_idr', { ascending: true })

        if (error) {
          console.warn('Gagal memuat tier dinamis, menggunakan konfigurasi fallback:', error.message)
          return
        }

        if (data && data.length > 0) {
          const mappedTiers: Tier[] = data.map((t) => {
            let formattedName = t.name
            if (t.slug === 'free') formattedName = 'Mulai Santai (Free)'
            else if (t.slug === 'glow') formattedName = 'Skincluv GLOW'
            else if (t.slug === 'premium' || t.slug === 'pro') formattedName = 'Skincluv PRO'

            return {
              ...t,
              name: formattedName
            }
          })
          setTiers(mappedTiers)
        }
      } catch (err) {
        console.error('Kesalahan saat memuat data harga:', err)
      }
    }

    fetchTiers()
  }, [])

  const handleSelectPlan = (planSlug: string) => {
    if (!user) {
      if (planSlug === 'free') {
        navigate('/register')
      } else {
        navigate(`/register?plan=${planSlug}`)
      }
      return
    }

    if (planSlug === 'free') return
    navigate(`/checkout?plan=${planSlug}`)
  }

  return (
    <div className="cluv-page cluv-surface-public">
      <section className="cluv-section">
        <div className="cluv-container">
          {/* HEADER CERITA PAKET */}
          <header className="cluv-section-header cluv-reveal">
            <Badge variant="teal" icon={<Sparkles size={14} />} className="cluv-mb-3">
              Pilihan Paket Sahabat
            </Badge>
            <h1 className="cluv-title-hero">Pilih Cara Nyamanmu Merawat Diri</h1>
            <p className="cluv-lead cluv-mt-3">
              Sekali bayar untuk 30 hari penuh ketenangan. Tanpa perpanjangan otomatis diam-diam, tanpa jebakan kartu kredit.
            </p>
          </header>

          {/* GRID PAKET */}
          <div className="cluv-grid cols-3 cluv-reveal-group">
            {tiers.map((tier) => {
              const isTierFree = tier.slug === 'free'
              const isTierGlow = tier.slug === 'glow'
              const isTierPro = tier.slug === 'premium' || tier.slug === 'pro'

              const hasOriginalPrice =
                typeof tier.original_price_idr === 'number' &&
                tier.original_price_idr > tier.price_idr &&
                tier.original_price_idr > 0

              const discountPct = hasOriginalPrice
                ? Math.round(((tier.original_price_idr! - tier.price_idr) / tier.original_price_idr!) * 100)
                : 0

              let subtitle = 'Paling pas untuk mulai membiasakan diri mendengarkan sinyal kulit'
              if (isTierGlow) subtitle = 'Paling pas untuk evaluasi mingguan & curhat skincare tanpa ragu'
              else if (isTierPro) subtitle = 'Pengalaman AI terlengkap, paling peka, dan terasa tanpa batas'

              const features = tier.features_list && tier.features_list.length > 0
                ? tier.features_list
                : []

              return (
                <div
                  key={tier.slug}
                  className={`cluv-card ${isTierPro ? 'is-highlight is-interactive' : ''}`}
                >
                  {/* Badge Status / Promo */}
                  <div className="cluv-mb-4">
                    <Badge
                      variant={isTierPro ? 'gold' : isTierGlow ? 'teal' : 'slate'}
                      icon={isTierPro ? <Crown size={12} /> : isTierGlow ? <HeartHandshake size={12} /> : <Sparkles size={12} />}
                    >
                      {tier.promo_badge || (isTierPro ? 'Favorit Sahabat' : isTierGlow ? 'Ramah Kantong' : 'Akses Awal')}
                    </Badge>
                  </div>

                  {/* Nama Paket & Deskripsi */}
                  <h3 className="cluv-title-card cluv-mb-2">{tier.name}</h3>
                  <p className="cluv-body cluv-pricing-desc cluv-mb-4">{subtitle}</p>

                  {/* Harga & Diskon */}
                  <div className="cluv-mb-5 cluv-pb-4 cluv-border-b">
                    <div className="cluv-price-discount-slot">
                      {hasOriginalPrice ? (
                        <>
                          <del className="cluv-caption cluv-text-muted">Rp {tier.original_price_idr!.toLocaleString('id-ID')}</del>
                          <Badge variant="gold" size="sm">Hemat {discountPct}%</Badge>
                        </>
                      ) : (
                        <Badge variant="slate" size="sm">Bebas Biaya</Badge>
                      )}
                    </div>

                    <div className="cluv-price-val">
                      {tier.price_idr === 0 ? (
                        <span>Rp 0 <span className="cluv-price-period">/ gratis selamanya</span></span>
                      ) : (
                        <span>Rp {tier.price_idr.toLocaleString('id-ID')} <span className="cluv-price-period">/ 30 hari</span></span>
                      )}
                    </div>

                    <div className="cluv-micro cluv-text-teal cluv-font-bold cluv-mt-2">
                      {isTierFree ? 'Tanpa syarat kartu • Pakai Credits dari misi harian' : 'Sekali bayar via QRIS / VA • Tanpa auto-debit'}
                    </div>
                  </div>

                  {/* Daftar Fitur Ramah Sahabat */}
                  <ul className="cluv-feature-list cluv-mb-6">
                    {features.map((feat, idx) => (
                      <li key={idx} className="cluv-feature-item">
                        <CheckCircle2 size={16} className="cluv-text-teal" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Tombol Aksi */}
                  <div className="cluv-mt-auto">
                    {isTierFree ? (
                      user ? (
                        <Button variant="secondary" size="md" block disabled>
                          {isFree ? 'Paket Aktif Saat Ini' : 'Paket Dasar (Bawaan)'}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="md"
                          block
                          iconRight={<ArrowRight size={14} />}
                          onClick={() => handleSelectPlan('free')}
                        >
                          Mulai Gratis Sekarang
                        </Button>
                      )
                    ) : isTierGlow ? (
                      user && isGlow ? (
                        <div className="cluv-btn is-outline is-md is-block is-static">
                          <ShieldCheck size={16} />
                          <span>Paket GLOW Aktif</span>
                        </div>
                      ) : user && isPro ? (
                        <Button variant="secondary" size="md" block disabled>
                          Sudah Termasuk di PRO
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="md"
                          block
                          iconRight={<ArrowRight size={14} />}
                          onClick={() => handleSelectPlan('glow')}
                        >
                          Beli GLOW (Rp {tier.price_idr.toLocaleString('id-ID')})
                        </Button>
                      )
                    ) : isTierPro ? (
                      user && isPro ? (
                        <div className="cluv-btn is-primary is-md is-block is-static">
                          <ShieldCheck size={16} />
                          <span>Paket PRO Aktif</span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          block
                          iconLeft={<Crown size={15} />}
                          iconRight={<ArrowRight size={14} />}
                          onClick={() => handleSelectPlan('pro')}
                        >
                          Pilih PRO (Rp {tier.price_idr.toLocaleString('id-ID')})
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* KOTAK TRANSPARANSI & BEBAS CEMAS */}
          <div className="cluv-card cluv-reveal cluv-mt-8 cluv-max-w-lg cluv-mx-auto">
            <div className="cluv-flex-row cluv-gap-3 cluv-mb-5">
              <div className="cluv-card-icon-wrap is-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="cluv-title-card cluv-m-0">Transaksi Tenang, Transparan, &amp; Tanpa Jebakan</h3>
                <p className="cluv-caption cluv-text-muted">Komitmen privasi dan etika pembayaran resmi Skincluv</p>
              </div>
            </div>

            <div className="cluv-grid cols-2 cluv-gap-6 cluv-mb-5">
              <div>
                <h4 className="cluv-font-bold cluv-text-dark cluv-mb-2">
                  Q: Apakah saldo saya akan terpotong otomatis tiap bulan?
                </h4>
                <p className="cluv-body cluv-line-relaxed">
                  <strong>Sama sekali tidak.</strong> Skincluv memakai sistem <strong>Prepaid Pass sekali bayar</strong> melalui payment gateway resmi Tripay (QRIS / Virtual Account / Alfamart / Indomaret). Kami tidak menyimpan rekening atau kartu kreditmu, sehingga tidak ada yang bisa ditarik diam-diam.
                </p>
              </div>

              <div>
                <h4 className="cluv-font-bold cluv-text-dark cluv-mb-2">
                  Q: Kalau 30 hari berakhir, bagaimana dengan akun dan data saya?
                </h4>
                <p className="cluv-body cluv-line-relaxed">
                  <strong>Tenang, tidak ada yang hilang!</strong> Akunmu otomatis kembali ke <strong>Paket Gratis</strong> dan tetap bisa lanjut scan menggunakan Credits dari misi harian. Seluruh riwayat foto scan dan catatan profil kulitmu tetap tersimpan aman seutuhnya.
                </p>
              </div>
            </div>

            {/* Legal Disclaimer Note (Invarian 19: Non-Therapeutic Product Claim Boundary) */}
            <div className="cluv-card-note">
              <ShieldCheck size={18} className="cluv-text-teal" />
              <p className="cluv-caption cluv-line-normal">
                <strong>Penyangkalan Medis:</strong> Skincluv adalah perangkat lunak edukasi analitik kosmetik independen, bukan fasilitas telemedisin klinis dan bukan apotek. Hasil observasi adalah panduan perawatan preventif mandiri, bukan diagnosis medis spesialis kulit (UU Kesehatan No. 17/2023).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

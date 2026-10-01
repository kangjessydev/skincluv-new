import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, CheckCircle2, Sparkles, ShieldCheck, Zap, ArrowLeft, HeartHandshake } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'

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

// Fallback jika proses pengambilan data database sedang berlangsung
const DEFAULT_TIERS: Tier[] = [
  {
    slug: 'free',
    name: 'Free / Starter',
    price_idr: 0,
    original_price_idr: 0,
    promo_badge: 'Selalu Gratis',
    is_popular: false,
    features_list: [
      '0 Kuota Bawaan (Akses via Credits)',
      'Dapatkan Credits Gratis dari Misi Harian',
      'Scan Wajah & Cek Komposisi Produk',
      'Chatbot Konsultasi Standar'
    ]
  },
  {
    slug: 'glow',
    name: 'Skincluv GLOW',
    price_idr: 25000,
    original_price_idr: 50000,
    promo_badge: 'Ramah Kantong',
    is_popular: false,
    features_list: [
      '100 Universal AI Uses / 30 Hari',
      'Satu Kuota Bersama: Bebas Dipakai Scan Maupun Chat',
      'Chatbot Konsultasi Ramah (Cepat & Edukatif)',
      'Analisis Kondisi Wajah & Komposisi Skincare',
      'Riwayat Scan Tersimpan Multi-Sesi',
      'Cadangan AI Credits Misi Tetap Utuh'
    ]
  },
  {
    slug: 'premium',
    name: 'Skincluv PRO',
    price_idr: 49000,
    original_price_idr: 99000,
    promo_badge: 'Rekomendasi Utama',
    is_popular: true,
    features_list: [
      '500 Universal AI Uses / 30 Hari (Terasa Unlimited)',
      'Chatbot Skincare Expert (Analisis Lebih Dalam & Presisi)',
      'Pencarian Web Terverifikasi (Tavily Grounding)',
      'Analisis Layering Bahan Aktif Pagi & Malam',
      'Evaluasi Kompatibilitas Skin Barrier & pH Formula',
      'Deep Memory (Ingatan Lintas Sesi Percakapan)',
      'Prioritas Respon AI Cepat & Responsif',
      'Badge Eksklusif PRO di Profil'
    ]
  }
]

export default function PricingPage() {
  const navigate = useNavigate()
  const { subscription } = useAuthStore()
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS)

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
          // Normalisasi slug dan format nama
          const mappedTiers: Tier[] = data.map((t) => {
            let formattedName = t.name
            if (t.slug === 'free') formattedName = 'Free / Starter'
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

  return (
    <div className="v0-page-container animate-fade-in">
      <div style={{ marginBottom: '16px' }}>
        <button type="button" className="v0-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>

      <div className="v0-profile-form-header" style={{ marginBottom: '28px', textAlign: 'left' }}>
        <span className="v0-celebrate-badge" style={{ marginBottom: '8px' }}>
          <Sparkles size={14} /> PAKET AKSES 30 HARI
        </span>
        <h1 className="v0-profile-form-main-title" style={{ fontSize: '1.75rem' }}>Pilih Paket Akses Skincluv</h1>
        <p className="v0-profile-form-main-sub">Pilih paket terbaik untuk perawatan kulit harian tanpa rasa cemas. Sekali bayar, tanpa auto-debit.</p>
      </div>

      <div className="v0-tier-grid">
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

          const isCardActive =
            (isTierFree && isFree) ||
            (isTierGlow && isGlow) ||
            (isTierPro && isPro)

          let subtitle = 'Mulai gratis menggunakan Credits dari misi harian'
          if (isTierGlow) subtitle = 'Paling pas untuk pelajar & pemula perawatan rutin'
          else if (isTierPro) subtitle = 'Pengalaman AI Terlengkap, Lebih Pintar & Terasa Unlimited'

          const features = tier.features_list && tier.features_list.length > 0
            ? tier.features_list
            : []

          return (
            <div
              key={tier.slug}
              className={`v0-profile-card v0-tier-card ${isTierPro ? 'featured' : ''} ${isCardActive ? 'active-current' : ''}`}
            >
              {/* Promo Badge */}
              {tier.promo_badge && (
                <div className="v0-tier-badge-pos">
                  <span className={`v0-badge ${isTierPro ? 'optimal' : isTierGlow ? 'warning' : ''}`} style={isTierPro ? { background: 'var(--color-teal)', color: '#fff' } : undefined}>
                    {isTierPro ? <Crown size={12} /> : isTierGlow ? <HeartHandshake size={12} /> : <Sparkles size={12} />}
                    <span>{tier.promo_badge.toUpperCase()}</span>
                  </span>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--color-ink)' }}>{tier.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', marginBottom: '12px', minHeight: '36px', lineHeight: 1.45 }}>{subtitle}</p>

                {/* Strikethrough & Discount Pill */}
                {hasOriginalPrice && (
                  <div className="v0-tier-discount-wrap">
                    <del className="v0-tier-orig-price">
                      Rp {tier.original_price_idr!.toLocaleString('id-ID')}
                    </del>
                    <span className="v0-tier-discount-pill">Hemat {discountPct}%</span>
                  </div>
                )}

                <div className="v0-tier-price">
                  Rp {tier.price_idr.toLocaleString('id-ID')} <span>/ 30 hari</span>
                </div>

                <div className="v0-tier-tagline">
                  {isTierFree ? 'Selalu gratis • Tanpa syarat kartu' : 'Sekali bayar. Selesai. Tanpa auto-debit.'}
                </div>
              </div>

              {/* Dynamic Feature Bullets */}
              <ul className="v0-tier-features">
                {features.map((feat, idx) => {
                  const isHighlightZap =
                    feat.toLowerCase().includes('universal ai') ||
                    feat.toLowerCase().includes('expert')

                  return (
                    <li key={idx}>
                      {isHighlightZap ? (
                        <Zap size={16} style={{ color: isTierGlow ? 'var(--color-gold)' : 'var(--color-teal)', flexShrink: 0, marginTop: 2 }} />
                      ) : (
                        <CheckCircle2 size={16} style={{ color: 'var(--color-status-optimal)', flexShrink: 0, marginTop: 2 }} />
                      )}
                      <span>{feat}</span>
                    </li>
                  )
                })}
              </ul>

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                {isTierFree ? (
                  <button type="button" className="v0-profile-chip" style={{ width: '100%', justifyContent: 'center' }} disabled>
                    {isFree ? 'Paket Aktif Saat Ini' : 'Paket Dasar'}
                  </button>
                ) : isTierGlow ? (
                  isGlow ? (
                    <button type="button" className="v0-profile-chip active" style={{ width: '100%', justifyContent: 'center' }} disabled>
                      <ShieldCheck size={16} /> Paket GLOW Aktif
                    </button>
                  ) : isPro ? (
                    <button
                      type="button"
                      className="v0-profile-chip"
                      disabled
                      style={{ width: '100%', justifyContent: 'center' }}
                      title="Kamu sedang aktif di paket PRO yang lebih tinggi"
                    >
                      Sudah Aktif di Paket PRO
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="v0-btn-action"
                      style={{ width: '100%', justifyContent: 'center', background: 'var(--color-teal-soft)', color: 'var(--color-teal)', border: '1px solid rgba(31, 157, 151, 0.25)' }}
                      onClick={() => navigate('/checkout?plan=glow')}
                    >
                      Beli GLOW Pass (Rp {tier.price_idr.toLocaleString('id-ID')})
                    </button>
                  )
                ) : isTierPro ? (
                  isPro ? (
                    <button type="button" className="v0-profile-chip active" style={{ width: '100%', justifyContent: 'center' }} disabled>
                      <ShieldCheck size={16} /> Paket PRO Aktif
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="v0-btn-action"
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 18px' }}
                      onClick={() => navigate('/checkout?plan=pro')}
                    >
                      <Crown size={16} /> Beli PRO Pass (Rp {tier.price_idr.toLocaleString('id-ID')})
                    </button>
                  )
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust & Transparency FAQ Box (Kimi Review) */}
      <div className="v0-profile-card" style={{ marginTop: '36px', padding: '28px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-ink)', textAlign: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-teal)' }} /> Transaksi Nyaman & Bebas Cemas
        </h3>
        <div className="v0-qa-grid">
          <div className="v0-qa-card">
            <h4>Q: Apakah saldo saya akan terpotong otomatis tiap bulan?</h4>
            <p>
              <strong>Tidak, tidak akan — titik.</strong> Skincluv memakai sistem <strong>Prepaid Pass</strong>: kamu bayar sekali untuk 30 hari akses via Tripay (QRIS / Virtual Account / Minimarket). Kami tidak menyimpan rekening dan tidak bisa menarik dana otomatis. Perpanjangan hanya terjadi jika kamu membeli lagi atas keputusanmu sendiri.
            </p>
          </div>
          <div className="v0-qa-card">
            <h4>Q: Kalau 30 hari habis, akun saya bagaimana?</h4>
            <p>
              Tenang, tidak ada yang hilang! Akunmu otomatis kembali ke <strong>Free Tier</strong> (bisa lanjut scan gratis dengan Credits dari misi harian). Semua riwayat foto scan dan catatan profil kulitmu tetap tersimpan aman.
            </p>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '20px', fontStyle: 'italic' }}>
          Skincluv adalah alat bantu edukasi & perawatan kulit berbasis AI — bukan pengganti konsultasi dokter spesialis dermatologi.
        </p>
      </div>
    </div>
  )
}

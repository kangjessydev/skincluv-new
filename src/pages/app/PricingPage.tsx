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
  const [isLoading, setIsLoading] = useState(true)

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
      } finally {
        setIsLoading(false)
      }
    }

    fetchTiers()
  }, [])

  return (
    <div className="pricing-page animate-fade-in">
      <div className="pricing-header">
        <button className="btn-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <span className="section-badge"><Sparkles size={14} /> PAKET AKSES 30 HARI</span>
        <h1>Pilih Paket Akses Skincluv</h1>
        <p className="page-subtitle">Pilih paket terbaik untuk perawatan kulit harian tanpa rasa cemas. Sekali bayar, tanpa auto-debit.</p>
      </div>

      <div className="pricing-grid">
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

          const cardClass = isTierFree
            ? 'free-card'
            : isTierGlow
            ? 'glow-card'
            : 'pro-card'

          let subtitle = 'Mulai gratis menggunakan Credits dari misi harian'
          if (isTierGlow) subtitle = 'Paling pas untuk pelajar & pemula perawatan rutin'
          else if (isTierPro) subtitle = 'Pengalaman AI Terlengkap, Lebih Pintar & Terasa Unlimited'

          const features = tier.features_list && tier.features_list.length > 0
            ? tier.features_list
            : []

          return (
            <div
              key={tier.slug}
              className={`pricing-card ${cardClass} glass-card ${isCardActive ? 'current-active' : ''}`}
            >
              {/* Promo Badge */}
              {tier.promo_badge && (
                <div className={isTierPro ? 'popular-badge' : isTierGlow ? 'saving-badge' : 'free-badge'}>
                  {isTierPro ? <Crown size={14} /> : isTierGlow ? <HeartHandshake size={14} /> : <Sparkles size={14} />}
                  <span>{tier.promo_badge.toUpperCase()}</span>
                </div>
              )}

              <div className="plan-header">
                <h3>{tier.name}</h3>
                <p>{subtitle}</p>

                {/* Strikethrough & Discount Pill */}
                {hasOriginalPrice && (
                  <div className="plan-discount-wrap">
                    <del className="plan-original-price">
                      Rp {tier.original_price_idr!.toLocaleString('id-ID')}
                    </del>
                    <span className="discount-pill">Hemat {discountPct}%</span>
                  </div>
                )}

                <div className="plan-price">
                  Rp {tier.price_idr.toLocaleString('id-ID')} <span>/ 30 hari</span>
                </div>

                <div className="plan-tagline">
                  {isTierFree ? 'Selalu gratis • Tanpa syarat kartu' : 'Sekali bayar. Selesai. Tanpa auto-debit.'}
                </div>
              </div>

              {/* Dynamic Feature Bullets */}
              <ul className="plan-features">
                {features.map((feat, idx) => {
                  const isHighlightZap =
                    feat.toLowerCase().includes('universal ai') ||
                    feat.toLowerCase().includes('expert')

                  return (
                    <li key={idx}>
                      {isHighlightZap ? (
                        <Zap size={16} className={isTierGlow ? 'icon-amber' : 'icon-sky'} />
                      ) : (
                        <CheckCircle2 size={16} className="icon-check" />
                      )}
                      <span>{feat}</span>
                    </li>
                  )
                })}
              </ul>

              {/* Action Buttons */}
              <div className="plan-footer">
                {isTierFree ? (
                  <button className="btn btn-outline btn-block" disabled>
                    {isFree ? 'Paket Aktif Saat Ini' : 'Paket Dasar'}
                  </button>
                ) : isTierGlow ? (
                  isGlow ? (
                    <button className="btn btn-secondary btn-block" disabled>
                      <ShieldCheck size={18} /> Paket GLOW Aktif
                    </button>
                  ) : isPro ? (
                    <button
                      className="btn btn-outline btn-block"
                      disabled
                      title="Kamu sedang aktif di paket PRO yang lebih tinggi"
                    >
                      Sudah Aktif di Paket PRO
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={() => navigate('/checkout?plan=glow')}
                    >
                      Beli GLOW Pass (Rp {tier.price_idr.toLocaleString('id-ID')})
                    </button>
                  )
                ) : isTierPro ? (
                  isPro ? (
                    <button className="btn btn-secondary btn-block" disabled>
                      <ShieldCheck size={18} /> Paket PRO Aktif
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-block btn-glow"
                      onClick={() => navigate('/checkout?plan=pro')}
                    >
                      <Crown size={18} /> Beli PRO Pass (Rp {tier.price_idr.toLocaleString('id-ID')})
                    </button>
                  )
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust & Transparency FAQ Box (Kimi Review) */}
      <div className="pricing-trust-section">
        <h3><ShieldCheck size={20} className="inline mr-2" />Transaksi Nyaman & Bebas Cemas</h3>
        <div className="trust-qa-grid">
          <div className="trust-qa-card">
            <h4>Q: Apakah saldo saya akan terpotong otomatis tiap bulan?</h4>
            <p>
              <strong>Tidak, tidak akan — titik.</strong> Skincluv memakai sistem <strong>Prepaid Pass</strong>: kamu bayar sekali untuk 30 hari akses via Tripay (QRIS / Virtual Account / Minimarket). Kami tidak menyimpan rekening dan tidak bisa menarik dana otomatis. Perpanjangan hanya terjadi jika kamu membeli lagi atas keputusanmu sendiri.
            </p>
          </div>
          <div className="trust-qa-card">
            <h4>Q: Kalau 30 hari habis, akun saya bagaimana?</h4>
            <p>
              Tenang, tidak ada yang hilang! Akunmu otomatis kembali ke <strong>Free Tier</strong> (bisa lanjut scan gratis dengan Credits dari misi harian). Semua riwayat foto scan dan catatan profil kulitmu tetap tersimpan aman.
            </p>
          </div>
        </div>
        <p className="pricing-disclaimer">
          Skincluv adalah alat bantu edukasi & perawatan kulit berbasis AI — bukan pengganti konsultasi dokter kulit.
        </p>
      </div>

      <style>{`
        .pricing-page { padding-bottom: 60px; max-width: 1080px; margin: 0 auto; width: 100%; }
        .pricing-header { text-align: center; margin-bottom: var(--space-xl); position: relative; }
        .btn-back-link {
          position: absolute; left: 0; top: 0; display: inline-flex; align-items: center; gap: 6px;
          background: transparent; border: none; color: var(--color-primary); font-family: var(--font-heading);
          font-weight: 700; font-size: 0.875rem; cursor: pointer; padding: 4px 8px; border-radius: var(--radius-sm);
        }
        .btn-back-link:hover { background: var(--color-surface-container-low); }

        .section-badge {
          display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem;
          font-weight: 700; color: var(--color-primary); background: var(--color-secondary-container);
          padding: 4px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-secondary-fixed-dim); margin-bottom: 8px;
        }
        .pricing-header h1 { font-size: 2rem; margin: 4px 0; color: var(--color-primary); }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.9375rem; }

        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-lg); align-items: stretch; }
        .pricing-card {
          padding: var(--space-xl); border-radius: var(--radius-xl);
          display: flex; flex-direction: column; justify-content: space-between; position: relative;
          border: 1px solid var(--color-secondary-container); background: var(--color-surface-container-lowest);
          box-shadow: var(--shadow-sky); transition: all 0.2s ease;
        }
        .pricing-card.current-active {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-container);
        }
        .free-card {
          background: #ffffff;
        }
        .glow-card {
          border-color: #fef08a;
          background: linear-gradient(180deg, #ffffff 0%, #fefce8 100%);
        }
        .pro-card {
          border-color: var(--color-primary-container);
          background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
        }
        .plan-footer {
          margin-top: auto;
          padding-top: var(--space-md);
        }
        .free-badge {
          position: absolute; top: -12px; right: 24px; background: #64748b;
          color: white; font-size: 0.6875rem; font-weight: 800; padding: 4px 12px; border-radius: var(--radius-full);
          display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25);
        }
        .saving-badge {
          position: absolute; top: -12px; right: 24px; background: #eab308;
          color: white; font-size: 0.6875rem; font-weight: 800; padding: 4px 12px; border-radius: var(--radius-full);
          display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.25);
        }
        .popular-badge {
          position: absolute; top: -12px; right: 24px; background: var(--color-tertiary-container);
          color: white; font-size: 0.6875rem; font-weight: 800; padding: 4px 12px; border-radius: var(--radius-full);
          display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(222, 135, 18, 0.25);
        }

        .plan-header h3 { font-size: 1.35rem; margin: 0 0 4px 0; color: var(--color-text-main); }
        .plan-header p { font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 8px; min-height: 38px; }

        .plan-discount-wrap {
          display: flex; align-items: center; gap: 8px; margin-bottom: 2px;
        }
        .plan-original-price {
          font-size: 0.9375rem; color: #94a3b8; font-weight: 600; text-decoration: line-through;
        }
        .discount-pill {
          font-size: 0.6875rem; font-weight: 800; color: #dc2626; background: #fee2e2;
          padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid #fecaca;
        }

        .plan-price { font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: 6px; font-family: var(--font-heading); }
        .plan-price span { font-size: 0.875rem; font-weight: 500; color: var(--color-text-muted); }

        .plan-tagline {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0f6784;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          display: inline-block;
          margin-bottom: var(--space-md);
        }

        .plan-features { list-style: none; padding: 0; margin: 0 0 var(--space-xl) 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.875rem; color: var(--color-text-main); line-height: 1.4; }
        .icon-check { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
        .icon-amber { color: #d97706; flex-shrink: 0; margin-top: 2px; }
        .icon-sky { color: var(--color-primary-container); flex-shrink: 0; margin-top: 2px; }
        .btn-glow { gap: 8px; }
        .btn-block { width: 100%; justify-content: center; }

        /* Trust & Transparency FAQ Section */
        .pricing-trust-section {
          margin-top: var(--space-2xl);
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow-sm);
        }
        .pricing-trust-section h3 {
          font-size: 1.125rem;
          color: var(--color-primary);
          margin-bottom: var(--space-lg);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .trust-qa-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-md);
        }
        .trust-qa-card {
          background: var(--color-surface-bg);
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: var(--space-md);
        }
        .trust-qa-card h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text-main);
          margin: 0 0 6px 0;
        }
        .trust-qa-card p {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }
        .trust-qa-card strong {
          color: var(--color-text-main);
        }
        .pricing-disclaimer {
          text-align: center;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin: var(--space-lg) 0 0 0;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}

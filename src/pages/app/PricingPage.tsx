import { useNavigate } from 'react-router-dom'
import { Crown, CheckCircle2, Sparkles, ShieldCheck, Zap, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium } from '@/utils/subscriptionHelpers'

export default function PricingPage() {
  const navigate = useNavigate()
  const { subscription } = useAuthStore()

  const isPro = isActivePremium(subscription)

  return (
    <div className="pricing-page animate-fade-in">
      <div className="pricing-header">
        <button className="btn-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <span className="section-badge"><Sparkles size={14} /> TOKO LANGGANAN</span>
        <h1>Pilih Paket Skincluv</h1>
        <p className="page-subtitle">Tingkatkan kuota analisis untuk perawatan kulit harian tanpa batas.</p>
      </div>

      <div className="pricing-grid">
        {/* Free Plan */}
        <div className="pricing-card free-card glass-card">
          <div className="plan-header">
            <h3>Paket Gratis</h3>
            <p>Untuk mencoba fitur analisis dasar</p>
            <div className="plan-price">Rp 0 <span>/ bulan</span></div>
          </div>
          <ul className="plan-features">
            <li><CheckCircle2 size={16} className="icon-check" /> 10 Analisis Kulit / Bulan</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Scan Wajah Dasar</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Scan Komposisi Produk</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Tanya Jawab Spesialis</li>
          </ul>
          <div className="plan-footer">
            <button className="btn btn-outline btn-block" disabled={!isPro}>
              {!isPro ? 'Paket Aktif Saat Ini' : 'Paket Dasar'}
            </button>
          </div>
        </div>

        {/* PRO Plan */}
        <div className={`pricing-card pro-card glass-card ${isPro ? 'current-active' : ''}`}>
          <div className="popular-badge"><Crown size={14} /> REKOMENDASI</div>
          <div className="plan-header">
            <h3>Skincluv PRO</h3>
            <p>Analisis Sepuasnya & Konsultasi Tanpa Batas</p>
            <div className="plan-price">Rp 49.000 <span>/ bulan</span></div>
          </div>
          <ul className="plan-features">
            <li><Zap size={16} className="icon-sky" /> <strong>3.000 Analisis Kulit</strong> / Bulan</li>
            <li><Zap size={16} className="icon-sky" /> Analisis Wajah & Rekomendasi Spesialis Mendalam</li>
            <li><Zap size={16} className="icon-sky" /> Peringatan Bahan Berbahaya & Alergi Otomatis</li>
            <li><Zap size={16} className="icon-sky" /> Konsultasi Obrolan 24/7 Dengan Memory</li>
            <li><Zap size={16} className="icon-sky" /> Prioritas Respon Server Cepat</li>
          </ul>
          <div className="plan-footer">
            {isPro ? (
              <button className="btn btn-secondary btn-block" disabled>
                <ShieldCheck size={18} /> Paket PRO Aktif
              </button>
            ) : (
              <button className="btn btn-primary btn-block btn-glow" onClick={() => navigate('/checkout')}>
                <Crown size={18} /> Upgrade ke PRO Sekarang
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .pricing-page { padding-bottom: 60px; max-width: 840px; margin: 0 auto; width: 100%; }
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

        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-xl); }
        .pricing-card {
          padding: var(--space-xl); border-radius: var(--radius-xl);
          display: flex; flex-direction: column; justify-content: space-between; position: relative;
          border: 1px solid var(--color-secondary-container); background: var(--color-surface-container-lowest);
          box-shadow: var(--shadow-sky); transition: all 0.2s ease;
        }
        .pro-card {
          border-color: var(--color-primary-container);
          background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
        }
        .popular-badge {
          position: absolute; top: -12px; right: 24px; background: var(--color-tertiary-container);
          color: white; font-size: 0.6875rem; font-weight: 800; padding: 4px 12px; border-radius: var(--radius-full);
          display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(222, 135, 18, 0.25);
        }

        .plan-header h3 { font-size: 1.35rem; margin: 0 0 4px 0; color: var(--color-text-main); }
        .plan-header p { font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 16px; }
        .plan-price { font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: var(--space-lg); font-family: var(--font-heading); }
        .plan-price span { font-size: 0.875rem; font-weight: 500; color: var(--color-text-muted); }

        .plan-features { list-style: none; padding: 0; margin: 0 0 var(--space-xl) 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-features li { display: flex; align-items: center; gap: 10px; font-size: 0.875rem; color: var(--color-text-main); }
        .icon-check { color: var(--color-primary); flex-shrink: 0; }
        .icon-sky { color: var(--color-primary-container); flex-shrink: 0; }
        .btn-glow { gap: 8px; }
        .btn-block { width: 100%; justify-content: center; }
      `}</style>
    </div>
  )
}

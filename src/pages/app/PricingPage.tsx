import { useNavigate } from 'react-router-dom'
import { Crown, CheckCircle2, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function PricingPage() {
  const navigate = useNavigate()
  const { subscription } = useAuthStore()

  const subTierSlug = (subscription as any)?.subscription_tiers?.slug
  const subTierName = (subscription as any)?.subscription_tiers?.name
  const isPro = subscription?.status === 'active' && (
    subTierSlug === 'premium' || 
    subTierName?.toLowerCase() === 'premium' ||
    subTierName?.toLowerCase() === 'pro'
  )

  return (
    <div className="pricing-page animate-fade-in">
      <div className="pricing-header">
        <span className="section-badge"><Sparkles size={14} /> TOKO LANGGANAN</span>
        <h1>Pilih Paket Skincluv</h1>
        <p className="page-subtitle">Tingkatkan kuota AI untuk perawatan kulit harian tanpa batas.</p>
      </div>

      <div className="pricing-grid">
        {/* Free Plan */}
        <div className="pricing-card free-card glass-card">
          <div className="plan-header">
            <h3>Paket Gratis</h3>
            <p>Untuk mencoba fitur AI dasar</p>
            <div className="plan-price">Rp 0 <span>/ bulan</span></div>
          </div>
          <ul className="plan-features">
            <li><CheckCircle2 size={16} className="icon-check" /> 10 Universal AI Usage / Bulan</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Scan Wajah Dasar</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Scan Ingredient Produk</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Tanya Jawab AI</li>
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
            <p>Scan Sepuasnya & Chat AI Tanpa Batas</p>
            <div className="plan-price">Rp 49.000 <span>/ bulan</span></div>
          </div>
          <ul className="plan-features">
            <li><Zap size={16} className="icon-gold" /> <strong>3.000 Universal AI Usage</strong> / Bulan</li>
            <li><Zap size={16} className="icon-gold" /> Analisis Wajah & Rekomendasi Medis Mendalam</li>
            <li><Zap size={16} className="icon-gold" /> Peringatan Bahan Berbahaya & Alergi Otomatis</li>
            <li><Zap size={16} className="icon-gold" /> Konsultasi AI Gaya Gen Z Professional 24/7</li>
            <li><Zap size={16} className="icon-gold" /> Prioritas Respon Server Cepat</li>
          </ul>
          <div className="plan-footer">
            {isPro ? (
              <button className="btn btn-success btn-block" disabled>
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
        .pricing-page { padding-bottom: 120px; max-width: 800px; margin: 0 auto; }
        .pricing-header { text-align: center; margin-bottom: var(--space-2xl); }
        .section-badge {
          display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem;
          font-weight: 800; color: var(--color-brand-300); background: rgba(168,85,247,0.1);
          padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(168,85,247,0.3); margin-bottom: 8px;
        }
        .pricing-header h1 { font-size: 2rem; margin: 4px 0; }
        .page-subtitle { color: var(--color-text-muted); font-size: 0.9375rem; }

        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-xl); }
        .pricing-card {
          padding: var(--space-xl); border-radius: var(--radius-2xl);
          display: flex; flex-direction: column; justify-content: space-between; position: relative;
          border: 1px solid var(--color-border); background: var(--color-surface-glass);
        }
        .pro-card {
          border-color: var(--color-brand-400);
          background: linear-gradient(180deg, rgba(168,85,247,0.12) 0%, rgba(20,15,35,0.9) 100%);
          box-shadow: 0 12px 40px rgba(107, 33, 168, 0.25);
        }
        .popular-badge {
          position: absolute; top: -14px; right: 24px; background: linear-gradient(135deg, #FBBF24, #D97706);
          color: white; font-size: 0.6875rem; font-weight: 800; padding: 4px 12px; border-radius: 12px;
          display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .plan-header h3 { font-size: 1.5rem; margin: 0 0 4px 0; }
        .plan-header p { font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 16px; }
        .plan-price { font-size: 2.25rem; font-weight: 800; color: white; margin-bottom: var(--space-lg); }
        .plan-price span { font-size: 0.875rem; font-weight: 400; color: var(--color-text-muted); }

        .plan-features { list-style: none; padding: 0; margin: 0 0 var(--space-2xl) 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-features li { display: flex; align-items: center; gap: 10px; font-size: 0.875rem; color: var(--color-text-secondary); }
        .icon-check { color: var(--color-brand-300); flex-shrink: 0; }
        .icon-gold { color: #FBBF24; flex-shrink: 0; }
        .btn-glow { box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4); gap: 8px; }
        .btn-block { width: 100%; justify-content: center; }
      `}</style>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { Crown, CheckCircle2, Sparkles, ShieldCheck, Zap, ArrowLeft, HeartHandshake } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { isActivePremium, isActiveGlow } from '@/utils/subscriptionHelpers'

export default function PricingPage() {
  const navigate = useNavigate()
  const { subscription } = useAuthStore()

  const isPro = isActivePremium(subscription)
  const isGlow = isActiveGlow(subscription)
  const isFree = !isPro && !isGlow

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
        {/* Free Plan */}
        <div className={`pricing-card free-card glass-card ${isFree ? 'current-active' : ''}`}>
          <div className="plan-header">
            <h3>Free / Starter</h3>
            <p>Mulai gratis menggunakan Credits dari misi harian</p>
            <div className="plan-price">Rp 0 <span>/ 30 hari</span></div>
            <div className="plan-tagline">Selalu gratis • Tanpa syarat kartu</div>
          </div>
          <ul className="plan-features">
            <li><CheckCircle2 size={16} className="icon-check" /> <strong>0 Kuota Bawaan</strong> (Akses via Credits)</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Dapatkan Credits Gratis dari Misi Harian</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Scan Wajah & Cek Komposisi Produk</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Chatbot Konsultasi Standar</li>
          </ul>
          <div className="plan-footer">
            <button className="btn btn-outline btn-block" disabled>
              {isFree ? 'Paket Aktif Saat Ini' : 'Paket Dasar'}
            </button>
          </div>
        </div>

        {/* GLOW Plan (Rp 25.000) */}
        <div className={`pricing-card glow-card glass-card ${isGlow ? 'current-active' : ''}`}>
          <div className="saving-badge"><HeartHandshake size={14} /> RAMAH KANTONG</div>
          <div className="plan-header">
            <h3>Skincluv GLOW</h3>
            <p>Paling pas untuk pelajar & pemula perawatan rutin</p>
            <div className="plan-price">Rp 25.000 <span>/ 30 hari</span></div>
            <div className="plan-tagline">Sekali bayar. Selesai. Tanpa auto-debit.</div>
          </div>
          <ul className="plan-features">
            <li><Zap size={16} className="icon-amber" /> <strong>100 Universal AI Uses</strong> / 30 Hari</li>
            <li><CheckCircle2 size={16} className="icon-check" /> <strong>Satu Kuota Bersama</strong>: Bebas Dipakai Scan Maupun Chat</li>
            <li><CheckCircle2 size={16} className="icon-check" /> <strong>Chatbot Konsultasi Ramah</strong> (Cepat & Edukatif)</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Analisis Kondisi Wajah & Komposisi Skincare</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Riwayat Scan Tersimpan Multi-Sesi</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Cadangan AI Credits Misi Tetap Utuh</li>
          </ul>
          <div className="plan-footer">
            {isGlow ? (
              <button className="btn btn-secondary btn-block" disabled>
                <ShieldCheck size={18} /> Paket GLOW Aktif
              </button>
            ) : isPro ? (
              <button className="btn btn-outline btn-block" disabled title="Kamu sedang aktif di paket PRO yang lebih tinggi">
                Sudah Aktif di Paket PRO
              </button>
            ) : (
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/checkout?plan=glow')}>
                Beli GLOW Pass (Rp 25.000)
              </button>
            )}
          </div>
        </div>

        {/* PRO Plan (Rp 49.000) */}
        <div className={`pricing-card pro-card glass-card ${isPro ? 'current-active' : ''}`}>
          <div className="popular-badge"><Crown size={14} /> REKOMENDASI UTAMA</div>
          <div className="plan-header">
            <h3>Skincluv PRO</h3>
            <p>Pengalaman AI Terlengkap, Lebih Pintar & Terasa Unlimited</p>
            <div className="plan-price">Rp 49.000 <span>/ 30 hari</span></div>
            <div className="plan-tagline">Sekali bayar. Selesai. Tanpa auto-debit.</div>
          </div>
          <ul className="plan-features">
            <li><Zap size={16} className="icon-sky" /> <strong>500 Universal AI Uses</strong> / 30 Hari (Terasa Unlimited)</li>
            <li><Zap size={16} className="icon-sky" /> <strong>Chatbot Skincare Expert</strong> (Analisis Lebih Dalam & Presisi)</li>
            <li><CheckCircle2 size={16} className="icon-check" /> <strong>Pencarian Web Terverifikasi</strong> (Tavily Grounding)</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Analisis Layering Bahan Aktif Pagi & Malam</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Evaluasi Kompatibilitas Skin Barrier & pH Formula</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Deep Memory (Ingatan Lintas Sesi Percakapan)</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Prioritas Respon AI Cepat & Responsif</li>
            <li><CheckCircle2 size={16} className="icon-check" /> Badge Eksklusif PRO di Profil</li>
          </ul>
          <div className="plan-footer">
            {isPro ? (
              <button className="btn btn-secondary btn-block" disabled>
                <ShieldCheck size={18} /> Paket PRO Aktif
              </button>
            ) : (
              <button className="btn btn-primary btn-block btn-glow" onClick={() => navigate('/checkout?plan=pro')}>
                <Crown size={18} /> Beli PRO Pass (Rp 49.000)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trust & Transparency FAQ Box (Kimi Review) */}
      <div className="pricing-trust-section">
        <h3>🔒 Belanja Akses Nyaman & Bebas Cemas</h3>
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
        .glow-card {
          border-color: #fef08a;
          background: linear-gradient(180deg, #ffffff 0%, #fefce8 100%);
        }
        .pro-card {
          border-color: var(--color-primary-container);
          background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
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
        .plan-header p { font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 16px; min-height: 38px; }
        .plan-price { font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: var(--space-lg); font-family: var(--font-heading); }
        .plan-price span { font-size: 0.875rem; font-weight: 500; color: var(--color-text-muted); }

        .plan-features { list-style: none; padding: 0; margin: 0 0 var(--space-xl) 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.875rem; color: var(--color-text-main); line-height: 1.4; }
        .icon-check { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
        .icon-amber { color: #d97706; flex-shrink: 0; margin-top: 2px; }
        .icon-sky { color: var(--color-primary-container); flex-shrink: 0; margin-top: 2px; }
        .btn-glow { gap: 8px; }
        .btn-block { width: 100%; justify-content: center; }
      `}</style>
    </div>
  )
}

// src/pages/LandingPage.tsx
// Public Landing Page for Skincluv — Built with Vanilla CSS & Lucide Icons

import { Link } from 'react-router-dom'
import {
  Sparkles,
  ScanFace,
  FlaskConical,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react'

const features = [
  {
    icon: ScanFace,
    title: 'AI Scan Wajah',
    desc: 'Analisis kondisi kulit secara ilmiah hanya dari foto wajah kamu.',
    badge: 'Fitur Utama',
  },
  {
    icon: FlaskConical,
    title: 'Scan Ingredient',
    desc: 'Periksa keamanan bahan produk skincare sebelum kamu beli atau pakai.',
    badge: 'Analisis Lab',
  },
  {
    icon: MessageCircle,
    title: 'Skinsistant AI',
    desc: 'Konsultasi skincare personal kapan saja dengan AI terintegrasi.',
    badge: '24/7 Response',
  },
  {
    icon: Layers,
    title: 'Misi & Hadiah Credit',
    desc: 'Kumpulkan Credit gratis dari rutinitas harian untuk unlock analisis tambahan.',
    badge: 'Gamifikasi',
  },
  {
    icon: Calendar,
    title: 'Jurnal Kesehatan Kulit',
    desc: 'Lacak riwayat perubahan kondisi kulit kamu dari waktu ke waktu.',
    badge: 'Tracking',
  },
  {
    icon: ShieldCheck,
    title: 'Keamanan Data',
    desc: 'Foto dan data analisis kamu terenkripsi dan dijaga privasinya.',
    badge: 'Privasi',
  },
]

const steps = [
  {
    num: '01',
    icon: ScanFace,
    title: 'Foto Wajahmu',
    desc: 'Ambil foto wajah dengan pencahayaan yang cukup.',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'AI Menganalisis',
    desc: 'Skinsistant memproses foto dan menghitung analisis area kulit.',
  },
  {
    num: '03',
    icon: CheckCircle2,
    title: 'Dapatkan Rekomendasi',
    desc: 'Terima rekomendasi kandungan aktif dan tips perawatan personal.',
  },
]

const faqs = [
  {
    q: 'Apakah Skincluv benar-benar gratis?',
    a: 'Ya! Kamu bisa mendaftar secara gratis dan mendapatkan Credit awal dari misi pendaftaran untuk mencoba fitur analisis wajah dan kandungan skincare. Kamu juga bisa mengumpulkan Credit tambahan dari misi harian.',
  },
  {
    q: 'Bagaimana cara kerja AI Scan Wajah?',
    a: 'Cukup unggah foto wajah kamu. AI akan memproses indikator kondisi kulit seperti kelembaban, pori-pori, dan area sensitif, lalu memberikan saran yang relevan.',
  },
  {
    q: 'Apakah foto wajah saya aman?',
    a: 'Foto wajah diunggah secara aman, dianalisis secara otomatis oleh AI, dan privasi data kamu dijaga sesuai standar perlindungan data.',
  },
  {
    q: 'Apa fungsi Credit Skincluv?',
    a: 'Credit digunakan untuk mengakses fitur AI bagi pengguna gratis. Credit bisa kamu dapatkan gratis lewat Misi Harian, check-in rutin, dan melengkapi profil.',
  },
]

export default function LandingPage() {
  return (
    <div className="landing-container">
      {/* NAVIGATION BAR */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <div className="brand-logo">
              <Sparkles size={20} />
            </div>
            <span className="brand-title">
              Skin<span className="text-primary">cluv</span>
            </span>
          </Link>

          <nav className="landing-nav-links">
            <a href="#features">Fitur</a>
            <a href="#how-it-works">Cara Kerja</a>
            <a href="#pricing">Harga</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-outline btn-sm">
              Masuk
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Daftar Gratis <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} /> AI Skincare Assistant #1 Indonesia
            </div>
            <h1 className="hero-heading">
              Kenali Kulitmu,<br />
              <span className="hero-heading-highlight">Tampil Lebih Percaya Diri</span>
            </h1>
            <p className="hero-subheading">
              Analisis kondisi kulit secara ilmiah dengan AI, cek kandungan skincare yang aman, dan bangun rutinitas harian yang sesuai untukmu.
            </p>
            <div className="hero-cta-group">
              <Link to="/register" className="btn btn-primary btn-lg">
                <Sparkles size={18} /> Coba Analisis Gratis Sekarang
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Masuk ke Akun
              </Link>
            </div>
            <div className="hero-trust">
              <span>✓ Tanpa Kartu Kredit</span>
              <span>✓ Credit Gratis Harian</span>
              <span>✓ Hasil Instan</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-preview">
              <div className="preview-header">
                <ScanFace size={20} className="text-primary" />
                <span>Hasil Analisis Kulit AI</span>
                <span className="badge-live">LIVE DEMO</span>
              </div>
              <div className="preview-metrics">
                <div className="metric-box">
                  <span className="metric-num">85%</span>
                  <span className="metric-lbl">Skor Hidrasi</span>
                </div>
                <div className="metric-box">
                  <span className="metric-num">Normal</span>
                  <span className="metric-lbl">Tipe Kulit</span>
                </div>
                <div className="metric-box">
                  <span className="metric-num">BHA & Cica</span>
                  <span className="metric-lbl">Rek. Bahan</span>
                </div>
              </div>
              <div className="preview-tag">
                <ShieldCheck size={16} /> 95% Tingkat Kecocokan Ditemukan
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <h2>Fitur Unggulan Skincluv</h2>
          <p>Semua yang kamu butuhkan untuk perawatan kulit yang lebih efisien dan terarah.</p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => {
            const IconComp = f.icon
            return (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap">
                  <IconComp size={22} />
                </div>
                <span className="feature-badge">{f.badge}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-section bg-alt">
        <div className="section-header">
          <h2>3 Langkah Mudah</h2>
          <p>Mulai perjalanan kesehatan kulitmu dalam hitungan menit.</p>
        </div>

        <div className="steps-grid">
          {steps.map((s, i) => {
            const IconComp = s.icon
            return (
              <div key={i} className="step-card">
                <div className="step-num">{s.num}</div>
                <div className="step-icon-wrap">
                  <IconComp size={24} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="landing-section">
        <div className="section-header">
          <h2>Pertanyaan Sering Diajukan (FAQ)</h2>
          <p>Punya pertanyaan? Kami punya jawabannya.</p>
        </div>

        <div className="faq-stack">
          {faqs.map((f, i) => (
            <div key={i} className="faq-card">
              <h4>{f.q}</h4>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="landing-cta-banner">
        <h2>Siap Untuk Kulit Lebih Sehat?</h2>
        <p>Bergabung dengan pengguna Skincluv lainnya dan dapatkan analisis kulit pertamamu gratis.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Daftar Sekarang <ArrowRight size={18} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <p>© 2026 Skincluv. Asisten kesehatan kulit berbasis AI.</p>
      </footer>

      {/* LANDING PAGE STYLES — Pure Vanilla CSS using skincluv tokens */}
      <style>{`
        .landing-container {
          min-height: 100vh;
          background: var(--color-surface-bg);
          color: var(--color-text-main);
          font-family: var(--font-body);
        }

        .landing-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-secondary-container);
        }

        .landing-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-md) var(--space-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-logo {
          background: linear-gradient(135deg, #0f6784 0%, #38bdf8 100%);
          color: #ffffff;
          border-radius: var(--radius-xl);
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 800;
        }
        .text-primary { color: var(--color-primary); }

        .landing-nav-links {
          display: none;
          gap: var(--space-lg);
        }
        @media (min-width: 768px) {
          .landing-nav-links { display: flex; }
        }

        .landing-nav-links a {
          color: var(--color-text-muted);
          font-weight: 600;
          font-size: 0.875rem;
          transition: color 0.15s;
        }
        .landing-nav-links a:hover { color: var(--color-primary); }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        /* HERO */
        .landing-hero {
          padding: 140px var(--space-lg) 80px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .landing-hero-inner {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-2xl);
          align-items: center;
        }
        @media (min-width: 900px) {
          .landing-hero-inner { grid-template-columns: 1fr 1fr; }
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--color-primary-fixed);
          color: var(--color-on-primary-container);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          margin-bottom: var(--space-md);
        }

        .hero-heading {
          font-size: 2.25rem;
          font-family: var(--font-heading);
          font-weight: 800;
          line-height: 1.25;
          margin: 0 0 var(--space-md);
        }
        @media (min-width: 768px) {
          .hero-heading { font-size: 3rem; }
        }

        .hero-heading-highlight {
          color: var(--color-primary);
        }

        .hero-subheading {
          font-size: 1rem;
          color: var(--color-text-muted);
          line-height: 1.6;
          margin: 0 0 var(--space-xl);
          max-width: 480px;
        }

        .hero-cta-group {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }

        .hero-trust {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-md);
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
        }

        .hero-card-preview {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          box-shadow: 0 16px 32px rgba(0, 101, 145, 0.08);
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .preview-header {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-weight: 700;
          font-size: 0.9375rem;
        }

        .badge-live {
          margin-left: auto;
          background: var(--color-success-soft);
          color: var(--color-success);
          font-size: 0.6875rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          border: 1px solid #bbf7d0;
        }

        .preview-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-xs);
        }

        .metric-box {
          background: var(--color-surface-container-low);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-lg);
          padding: var(--space-sm);
          text-align: center;
        }

        .metric-num {
          display: block;
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--color-primary);
          font-family: var(--font-heading);
        }
        .metric-lbl {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }

        .preview-tag {
          background: var(--color-surface-container-low);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          font-size: 0.8125rem;
          color: var(--color-text-main);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* SECTIONS */
        .landing-section {
          padding: 80px var(--space-lg);
          max-width: 1200px;
          margin: 0 auto;
        }
        .landing-section.bg-alt {
          background: var(--color-surface-container-low);
          border-radius: var(--radius-2xl);
        }

        .section-header {
          text-align: center;
          max-width: 600px;
          margin: 0 auto var(--space-2xl);
        }
        .section-header h2 {
          font-size: 1.875rem;
          font-family: var(--font-heading);
          font-weight: 800;
          margin: 0 0 var(--space-xs);
          color: var(--color-primary);
        }
        .section-header p {
          color: var(--color-text-muted);
          margin: 0;
          font-size: 0.9375rem;
        }

        /* FEATURES GRID */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }
        @media (min-width: 640px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .features-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .feature-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 101, 145, 0.08);
        }

        .feature-icon-wrap {
          width: 44px;
          height: 44px;
          background: var(--color-primary-fixed);
          color: var(--color-primary);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-md);
        }

        .feature-badge {
          position: absolute;
          top: var(--space-lg);
          right: var(--space-lg);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--color-primary);
          background: var(--color-surface-container-low);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .feature-card h3 {
          font-size: 1.125rem;
          font-family: var(--font-heading);
          margin: 0 0 var(--space-xs);
        }
        .feature-card p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        /* STEPS GRID */
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }
        @media (min-width: 768px) {
          .steps-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .step-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .step-num {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--color-primary);
          font-family: var(--font-heading);
          margin-bottom: var(--space-xs);
        }

        .step-icon-wrap {
          width: 52px;
          height: 52px;
          background: var(--color-primary-fixed);
          color: var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-md);
        }

        .step-card h3 {
          font-size: 1.125rem;
          font-family: var(--font-heading);
          margin: 0 0 var(--space-xs);
        }
        .step-card p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        /* FAQ STACK */
        .faq-stack {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .faq-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .faq-card h4 {
          font-size: 1rem;
          font-family: var(--font-heading);
          margin: 0 0 var(--space-xs);
          color: var(--color-text-main);
        }
        .faq-card p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        /* CTA BANNER */
        .landing-cta-banner {
          max-width: 900px;
          margin: 40px auto 80px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
          color: white;
          border-radius: var(--radius-2xl);
          padding: var(--space-2xl) var(--space-xl);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .landing-cta-banner h2 {
          font-size: 2rem;
          font-family: var(--font-heading);
          margin: 0;
          color: white;
        }
        .landing-cta-banner p {
          margin: 0;
          opacity: 0.9;
          max-width: 480px;
        }

        /* FOOTER */
        .landing-footer {
          border-top: 1px solid var(--color-secondary-container);
          padding: var(--space-lg);
          text-align: center;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  )
}

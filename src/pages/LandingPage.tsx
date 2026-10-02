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
import '@/styles/landing.css'

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
              <span><CheckCircle2 size={13} className="inline mr-1" /> Tanpa Kartu Kredit</span>
              <span><CheckCircle2 size={13} className="inline mr-1" /> Credit Gratis Harian</span>
              <span><CheckCircle2 size={13} className="inline mr-1" /> Hasil Instan</span>
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


    </div>
  )
}

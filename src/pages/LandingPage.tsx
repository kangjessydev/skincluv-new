// src/pages/LandingPage.tsx
// Public Landing Page for Skincluv — Warm Companion Storytelling Experience (Option E)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Heart,
  Smile,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sun,
  ShoppingBag,
  Moon,
  Lock,
  Trash2,
  ChevronDown,
  Layers,
  HelpCircle,
  Camera,
  Gift,
  CheckCircle2,
  Scan,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react'
import '@/styles/landing.css'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useAuthStore } from '@/store/authStore'

export default function LandingPage() {
  const { user } = useAuthStore()
  // Initialize scroll reveal observer
  useScrollReveal()

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const faqs = [
    {
      q: 'Apakah Skincluv beneran aman untuk privasi foto wajahku?',
      a: 'Aman banget! Foto wajahmu diproses dengan standar privasi ketat (UU PDP No. 27/2022). Kami tidak pernah menjual atau membagikan fotomu ke pihak pengiklan mana pun. Kamu juga punya kendali penuh untuk menghapus seluruh riwayat fotomu kapan saja sekali klik.',
    },
    {
      q: 'Gimana cara kerja Cek Kandungan Skincare (Ingredient Check)?',
      a: 'Gampang banget, tinggal foto label komposisi (INCI) di belakang kemasan atau kardus skincare-mu. AI Skincluv bakal membaca dan memberi tahu apakah bahannya cocok untuk jenis kulitmu, ada potensi memicu komedo, atau ada bahan aktif yang rawan tabrakan dengan produkmu yang di rumah.',
    },
    {
      q: 'Bisa dipakai gratis tanpa langganan kartu kredit?',
      a: 'Tentu saja! Pas daftar pertama kali kamu langsung dapat AI Credits gratis. Setiap hari kamu juga bisa mengumpulkan Credit tambahan dengan menyelesaikan misi harian santai seperti check-in pagi dan malam.',
    },
    {
      q: 'Apakah Skincluv sama dengan resep dokter spesialis dermatologi?',
      a: 'Skincluv adalah asisten pintar untuk edukasi dan observasi perawatan kulit mandiri, bukan pengganti diagnosis medis klinik dokter spesialis (Sp.DVE/Sp.KK). Tujuannya membantumu mengenali kondisi kulit harian dan memilih skincare yang tepat tanpa salah beli.',
    },
  ]

  return (
    <div className="landing-root landing-variant-e">
      {/* =========================================================================
       * 1. PROLOG / HERO: WAKTU CERMIN BIKIN OVERTHINKING
       * ========================================================================= */}
      <section className="landing-hero-wrapper">
        {/* Soft Ambient Floating Skincare Stickers (Lightweight CSS Parallax) */}
        <div className="ambient-skincare-decorations" aria-hidden="true">
          <div className="ambient-decor decor-cloud-1 cluv-animate-float">
            <svg width="60" height="38" viewBox="0 0 64 42" fill="none">
              <path d="M18 36h28a12 12 0 0 0 0-24 16 16 0 0 0-30-2A10 10 0 0 0 18 36z" fill="#bceae7" fillOpacity="0.55"/>
            </svg>
          </div>
          <div className="ambient-decor decor-star-1 cluv-animate-pulse">
            <Sparkles size={22} className="cluv-text-amber" style={{ opacity: 0.65 }} />
          </div>
          <div className="ambient-decor decor-cloud-2 cluv-animate-float" style={{ animationDelay: '2s' }}>
            <svg width="74" height="48" viewBox="0 0 64 42" fill="none">
              <path d="M18 36h28a12 12 0 0 0 0-24 16 16 0 0 0-30-2A10 10 0 0 0 18 36z" fill="#fed7aa" fillOpacity="0.5"/>
            </svg>
          </div>
          <div className="ambient-decor decor-heart-1 cluv-animate-float" style={{ animationDelay: '1.2s' }}>
            <Heart size={18} className="cluv-text-rose" style={{ opacity: 0.6 }} />
          </div>
        </div>

        <div className="landing-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="landing-hero-grid">
            {/* Left Column: Storytelling Headline & Friendly Invitation */}
            <div className="hero-left-column">
              <div className="cluv-badge is-teal cluv-animate-fade">
                <Sparkles size={14} />
                <span>Teman Tenang Meja Riasmu</span>
              </div>

              <h1 className="cluv-title-hero cluv-animate-fade">
                Rawat Kulitmu Pelan-pelan, Tanpa Rasa Cemas.
              </h1>

              <p className="cluv-lead cluv-animate-fade cluv-stagger-1 cluv-mt-4" style={{ maxWidth: '520px' }}>
                Cukup satu foto santai di depan cermin. Skinsistant membantumu membaca kebutuhan kulit harian dan mencocokkan skincare yang tepat — tanpa vonis angka, tanpa bikin overthinking.
              </p>

              <div className="cluv-btn-group is-stack-mobile cluv-mt-6">
                {user ? (
                  <Link to="/dashboard" className="cluv-btn is-primary is-lg">
                    <LayoutDashboard size={16} />
                    <span>Buka Dashboard</span>
                  </Link>
                ) : (
                  <Link to="/register" className="cluv-btn is-primary is-lg">
                    <Heart size={16} />
                    <span>Yuk, Mulai Cerita Kulitmu</span>
                  </Link>
                )}
                <Link to="/about" className="cluv-btn is-secondary is-lg">
                  <Smile size={16} />
                  <span>Kenapa Kami Berbeda?</span>
                </Link>
              </div>

              {/* Reassurance Micro-Copy */}
              <div className="cluv-trust-strip is-left cluv-mt-4">
                <span className="cluv-trust-item">
                  <Heart size={14} className="cluv-trust-icon cluv-text-rose" />
                  <span>Tanpa Vonis Menghakimi</span>
                </span>
                <span className="cluv-trust-dot">•</span>
                <span className="cluv-trust-item">
                  <Gift size={14} className="cluv-trust-icon cluv-text-teal" />
                  <span>Gratis AI Credits Pertama</span>
                </span>
                <span className="cluv-trust-dot">•</span>
                <span className="cluv-trust-item">
                  <ShieldCheck size={14} className="cluv-trust-icon cluv-text-teal" />
                  <span>Privasi Dilindungi UU PDP</span>
                </span>
              </div>
            </div>

            {/* Right Column: Warm Visual & Ambient Floating Dialogue Bubble */}
            <div className="hero-right-column">
              <div className="sweet-hero-photo-wrap">
                {/* Floating 2D Sticker Badges */}
                <div className="sweet-floating-sticker top-left cluv-animate-float">
                  <span>☁️</span>
                  <span>Santai Dulu</span>
                </div>
                <div className="sweet-floating-sticker top-right cluv-animate-pulse">
                  <span>✨</span>
                  <span>Glowing Alami</span>
                </div>

                <img
                  src="/images/notion-2d-girl.jpg"
                  alt="Ilustrasi manis 2D cermin selfie santai ditemani stiker skincare"
                  className="sweet-hero-img"
                />
                <div className="sweet-hero-floating-bubble cluv-animate-float">
                  <div className="cluv-flex-row cluv-gap-2 cluv-mb-1">
                    <Heart size={14} className="cluv-text-rose" />
                    <span className="cluv-font-bold cluv-text-muted" style={{ fontSize: '0.75rem' }}>Skinsistant • Menemanimu</span>
                  </div>
                  <p className="cluv-font-semibold cluv-m-0 cluv-line-relaxed" style={{ fontSize: '0.875rem' }}>
                    &ldquo;Tarik napas dulu ya. Kemerahan ini wajar karena semalam tidurmu kurang lelap. Hari ini kita rawat pelan-pelan tanpa panik.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. THE RELATABLE MOMENT: PERNAH NGERASAIN MOMEN SEPI INI?
       * ========================================================================= */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-rose cluv-mb-3">
              <Clock size={14} />
              <span>Cerita Sehari-hari</span>
            </div>
            <h2 className="cluv-title-section">
              Pernah Ngerasain Momen-momen Sepi Ini?
            </h2>
            <p className="cluv-subtitle cluv-mt-3">
              Bukan salahmu kalau selama ini merawat kulit terasa melelahkan. Kadang kita cuma lelah dibanjiri janji muluk dan istilah rumit.
            </p>
          </div>

          <div className="sweet-problem-grid cluv-reveal-group">
            <div className="sweet-problem-card tint-peach cluv-hover-lift">
              <div className="sweet-icon-circle">
                <ShoppingBag size={20} className="cluv-text-rose" />
              </div>
              <h3 className="cluv-title-card">&ldquo;Udah checkout racun FYP, kok malah perih?&rdquo;</h3>
              <p className="cluv-body">
                Beli produk mahal yang lagi viral di TikTok karena katanya bikin glowing instan. Baru 3 hari pakai, kulit malah ngambek, bruntusan, dan uang tabungan terkuras sia-sia.
              </p>
            </div>

            <div className="sweet-problem-card tint-mint cluv-hover-lift">
              <div className="sweet-icon-circle">
                <Layers size={20} className="cluv-text-teal" />
              </div>
              <h3 className="cluv-title-card">&ldquo;Meja rias penuh, tapi bingung mana yang aman digabung...&rdquo;</h3>
              <p className="cluv-body">
                Serum, toner, dan pelembap berjejer rapi. Tapi tiap pagi bingung: bahan aktif ini boleh digabung gak ya? Takut kandungannya tabrakan dan bikin iritasi parah.
              </p>
            </div>

            <div className="sweet-problem-card tint-pink cluv-hover-lift">
              <div className="sweet-icon-circle">
                <Heart size={20} className="cluv-text-rose" />
              </div>
              <h3 className="cluv-title-card">&ldquo;Capek dikasih skor merah jelek sama aplikasi scanner...&rdquo;</h3>
              <p className="cluv-body">
                Bosan dengan aplikasi yang memberi vonis nilai 50/100 seolah wajahmu kertas ujian. Kulitmu adalah organ hidup yang butuh dirawat dengan sabar, bukan dihukum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2.5 THE 3 SUPERPOWERS (FITUR NYATA TANPA JARGON SAAS)
       * ========================================================================= */}
      <section className="cluv-section is-alt">
        <div className="cluv-container">
          <div className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-3">
              <Sparkles size={14} />
              <span>Tiga Sentuhan di Ponselmu</span>
            </div>
            <h2 className="cluv-title-section">
              Bukan Software Rumit, Cukup Tiga Hal Sederhana Ini
            </h2>
            <p className="cluv-subtitle cluv-mt-3">
              Langsung bisa kamu rasakan manfaatnya dalam hitungan detik. Tanpa istilah medis yang bikin bingung dan tanpa menakut-nakuti.
            </p>
          </div>

          <div className="cluv-grid cols-3 cluv-reveal-group">
            {/* Card 1: Observasi Wajah */}
            <div className="feature-showcase-card cluv-hover-lift">
              <div className="feature-mock-screen">
                <div className="feature-mock-tag teal">
                  <Camera size={14} />
                  <span>Cermin Alami 3 Detik</span>
                </div>
                <div className="feature-mock-tag mint">
                  <Smile size={14} />
                  <span>Kulit Butuh Hidrasi Lembut</span>
                </div>
              </div>
              <div className="cluv-badge is-gold cluv-mb-2" style={{ alignSelf: 'flex-start' }}>
                <Sun size={12} />
                <span>07:00 Pagi</span>
              </div>
              <h3 className="cluv-title-card">Biar Gak Ragu Mau Pakai Apa Hari Ini</h3>
              <p className="cluv-body cluv-mt-2">
                Cukup 1 foto santai di dekat jendela tanpa bedak. Langsung tahu kondisi kulitmu tanpa vonis angka yang bikin insecure.
              </p>
            </div>

            {/* Card 2: Cek Bahan Aktif Kosmetik */}
            <div className="feature-showcase-card cluv-hover-lift">
              <div className="feature-mock-screen">
                <div className="feature-mock-tag mint">
                  <CheckCircle2 size={14} />
                  <span>Niacinamide: Aman &amp; Cocok</span>
                </div>
                <div className="feature-mock-tag amber">
                  <ShoppingBag size={14} />
                  <span>Ada Retinol: Jangan barengan serum!</span>
                </div>
              </div>
              <div className="cluv-badge is-teal cluv-mb-2" style={{ alignSelf: 'flex-start' }}>
                <Scan size={12} />
                <span>Di Toko / Kasir</span>
              </div>
              <h3 className="cluv-title-card">Cegah Salah Beli Sebelum Boncos</h3>
              <p className="cluv-body cluv-mt-2">
                Tertarik racun skincare viral di medsos? Foto kardus belakangnya. Kami bacakan jujur bahannya cocok atau malah bikin bruntusan.
              </p>
            </div>

            {/* Card 3: Curhat Meja Rias */}
            <div className="feature-showcase-card cluv-hover-lift">
              <div className="feature-mock-screen" style={{ gap: '8px', alignItems: 'stretch' }}>
                <div className="feature-mock-chat-bubble user">
                  Toner dulu apa serum dulu ya?
                </div>
                <div className="feature-mock-chat-bubble assistant">
                  Toner dulu ya manis, tepuk pelan baru lanjut serumnya! 🌸
                </div>
              </div>
              <div className="cluv-badge is-purple cluv-mb-2" style={{ alignSelf: 'flex-start' }}>
                <Moon size={12} />
                <span>21:30 Malam</span>
              </div>
              <h3 className="cluv-title-card">Gak Ada Pertanyaan yang Terlalu Sepele</h3>
              <p className="cluv-body cluv-mt-2">
                Bingung urutan layering atau kulit lagi perih kena AC kantor? Tanya kapan saja, dijawab ramah kayak bestie sendiri tanpa rasa takut.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 3. BABAK 1: 07:00 PAGI — TIGA LANGKAH TENANG DI DEPAN CERMIN
       * ========================================================================= */}
      <section className="landing-section alt-surface" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Morning Sun & Dew Accents (CSS Parallax) */}
        <div className="ambient-skincare-decorations" aria-hidden="true">
          <div className="ambient-decor decor-sun-morning cluv-animate-pulse">
            <Sun size={32} className="cluv-text-amber" style={{ opacity: 0.55 }} />
          </div>
          <div className="ambient-decor decor-dew-left cluv-animate-float">
            <svg width="48" height="32" viewBox="0 0 64 42" fill="none">
              <path d="M18 36h28a12 12 0 0 0 0-24 16 16 0 0 0-30-2A10 10 0 0 0 18 36z" fill="#fde68a" fillOpacity="0.45"/>
            </svg>
          </div>
        </div>

        <div className="landing-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-gold cluv-mb-3">
              <Sun size={14} />
              <span>Babak 1 • 07:00 Pagi</span>
            </div>
            <h2 className="cluv-title-section">
              Alih-alih Panik Menumpuk Produk, Cukup 3 Langkah Tenang Ini
            </h2>
            <p className="cluv-subtitle cluv-mt-3">
              Gak ada istilah medis rumit atau grafik angka yang bikin overthinking. Hanya langkah sederhana yang bikin kamu merasa didengar.
            </p>
          </div>

          {/* Bagan Ringkas 1-2-3 Menenangkan */}
          <div className="steps-calm-grid cluv-reveal-group">
            <div className="step-calm-card cluv-hover-lift">
              <div className="step-num-pill">1</div>
              <h3 className="cluv-title-card">Jepret Santai di Dekat Jendela</h3>
              <p className="cluv-body">
                Tanpa perlu dandan atau ditutupi bedak. Cukup satu foto apa adanya di pencahayaan alami kamarmu.
              </p>
            </div>

            <div className="step-calm-card cluv-hover-lift">
              <div className="step-num-pill">2</div>
              <h3 className="cluv-title-card">Dengar Cerita Kulitmu Hari Ini</h3>
              <p className="cluv-body">
                Bukan vonis menakutkan, melainkan rangkuman lembut: bagian mana yang lagi haus hidrasi dan bagian mana yang lagi butuh istirahat.
              </p>
            </div>

            <div className="step-calm-card cluv-hover-lift">
              <div className="step-num-pill">3</div>
              <h3 className="cluv-title-card">Pakai yang Memang Dibutuhkan</h3>
              <p className="cluv-body">
                Cukup pelembap lembut dan sunscreen. Gak perlu coba-coba produk eksfoliasi keras waktu skin barrier-mu lagi memberi sinyal lelah.
              </p>
            </div>
          </div>

          {/* Sweet Anti-Judgment Promise (Option B-2) */}
          <div className="cluv-alert is-info cluv-reveal is-zoom cluv-mt-7 cluv-mx-auto" style={{ maxWidth: '680px' }}>
            <Sparkles size={18} className="cluv-alert-icon" />
            <div className="cluv-alert-content">
              <p className="cluv-body cluv-m-0 cluv-font-semibold cluv-text-center">
                <strong>Janji Manis Skincluv:</strong> Kami tidak pernah memberi angka merah 40/100 pada wajahmu. Karena kulit adalah organ hidup yang butuh dipahami, bukan kertas ujian yang dihakimi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 4. BABAK 2: 14:00 SIANG — RAGU DI DEPAN RAK TOKO KOSMETIK (INGREDIENT CHECK)
       * ========================================================================= */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="sweet-deep-dive-row reversed">
            <div className="sweet-deep-dive-text cluv-reveal is-left">
              <div className="cluv-badge is-teal cluv-mb-3">
                <ShoppingBag size={14} />
                <span>Babak 2 • 14:00 Siang</span>
              </div>
              <h2 className="cluv-title-section">Berdiri Ragu di Depan Rak Toko Kosmetik</h2>
              <p className="cluv-subtitle cluv-mt-3">
                Lagi scroll keranjang olshop atau berdiri di lorong toko kecantikan? Rasanya pengen beli semua botol yang lagi viral. Tapi dalam hati ragu: <em>&ldquo;Bakal cocok gak ya di kulitku? Jangan-jangan malah bikin bruntusan lagi.&rdquo;</em>
              </p>
              <p className="cluv-body cluv-mt-2">
                Cukup foto kardus belakangnya. Skinsistant bakal bacain kandungannya secara jujur, kayak sahabat yang berdiri di sampingmu sambil berbisik:
              </p>
              <div className="story-dialogue-card cluv-mt-3">
                <div className="dialogue-bubble friend">
                  <div className="dialogue-meta">
                    <Heart size={13} />
                    <span>Skinsistant</span>
                  </div>
                  &ldquo;Bahan pencerahnya bagus kok, tapi pelembapmu yang di meja rias udah punya kandungan Niacinamide tinggi. Kalau digabung rawan perih. Mending simpan dulu uangmu ya!&rdquo;
                </div>
              </div>
            </div>

            <div className="sweet-story-img-frame cluv-reveal is-right">
              <img
                src="/images/skincare-routine-warmth.jpg"
                alt="Botol skincare di meja rias yang hangat"
                className="sweet-story-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 5. BABAK 3: 21:30 MALAM — RUANG CURHAT SEBELUM TIDUR (SKINSISTANT AI)
       * ========================================================================= */}
      <section className="landing-section night-surface" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Night Moon & Dreamy Stars Accents (CSS Parallax) */}
        <div className="ambient-skincare-decorations" aria-hidden="true">
          <div className="ambient-decor decor-moon-night cluv-animate-float">
            <Moon size={34} className="cluv-text-purple" style={{ opacity: 0.6 }} />
          </div>
          <div className="ambient-decor decor-star-night-1 cluv-animate-pulse">
            <Sparkles size={20} className="cluv-text-teal" style={{ opacity: 0.55 }} />
          </div>
          <div className="ambient-decor decor-star-night-2 cluv-animate-pulse" style={{ animationDelay: '1.5s' }}>
            <Sparkles size={16} className="cluv-text-purple" style={{ opacity: 0.5 }} />
          </div>
        </div>

        <div className="landing-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="sweet-deep-dive-row">
            <div className="sweet-deep-dive-text cluv-reveal is-left">
              <div className="cluv-badge is-purple cluv-mb-3">
                <Moon size={14} />
                <span>Babak 3 • 21:30 Malam</span>
              </div>
              <h2 className="cluv-title-section cluv-text-white">Ruang Curhat Waktu Lampu Kamar Mulai Redup</h2>
              <p className="cluv-subtitle cluv-mt-3" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Setelah seharian lelah beraktivitas dan cuci muka, kadang pikiran malam mulai datang: <em>&ldquo;Kapan ya kulitku bisa tenang sepenuhnya?&rdquo;</em>
              </p>
              <p className="cluv-body cluv-mt-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Di sini, kamu punya ruang aman untuk cerita apa saja. Tanyakan urutan skincare malam, keluhkan kulit yang seharian kering kena AC, tanpa takut dianggap berlebihan.
              </p>
              <div className="cluv-trust-strip is-left cluv-mt-5">
                <span className="cluv-trust-item" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <Lock size={14} className="cluv-trust-icon cluv-text-teal" />
                  <span>Rahasia Diary 100% Aman</span>
                </span>
                <span className="cluv-trust-dot" style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                <span className="cluv-trust-item" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <Trash2 size={14} className="cluv-trust-icon cluv-text-rose" />
                  <span>Bisa Dihapus Kapan Saja</span>
                </span>
              </div>
            </div>

            <div className="story-dialogue-card night-card cluv-reveal is-right">
              <div className="dialogue-bubble user">
                &ldquo;Hari ini seharian kena AC kantor, pipiku rasanya ketarik dan kering banget...&rdquo;
              </div>
              <div className="dialogue-bubble friend">
                <div className="dialogue-meta">
                  <Heart size={13} />
                  <span>Skinsistant</span>
                </div>
                &ldquo;Paham banget rasanya. Malam ini oleskan pelembapmu sedikit lebih tebal ya, kayak selimut tidur buat kulit. Jangan lupa minum segelas air hangat sekarang, terus istirahat yang nyenyak. Kamu udah hebat hari ini!&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 6. SUARA HATI TEMAN MEJA RIAS (WARM SOCIAL PROOF)
       * ========================================================================= */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-rose cluv-mb-3">
              <Heart size={14} />
              <span>Suara Hati Sahabat</span>
            </div>
            <h2 className="cluv-title-section">
              Kisah Teman-teman yang Berhenti Overthinking
            </h2>
            <p className="cluv-subtitle cluv-mt-3">
              Cerita nyata dari mereka yang kini merawat diri dengan lebih tenang, percaya diri, dan hemat di kantong.
            </p>
          </div>

          <div className="sweet-testimonial-grid cluv-reveal-group">
            <div className="sweet-testimonial-card cluv-hover-lift">
              <p className="sweet-testimonial-quote">
                &ldquo;Dompet dan muka beneran terselamatkan! Dulu gampang banget kalap checkout karena racun TikTok, ujungnya bruntusan parah. Sekarang tiap mau beli di toko atau olshop, aku selalu scan kardus belakangnya dulu. Kulit tenang, uang jajan aman.&rdquo;
              </p>
              <div className="sweet-testimonial-author">
                <div className="sweet-author-avatar">N</div>
                <div className="sweet-author-info">
                  <h4>Nadia Amanda</h4>
                  <p>24 tahun • Mahasiswi</p>
                </div>
              </div>
            </div>

            <div className="sweet-testimonial-card cluv-hover-lift">
              <p className="sweet-testimonial-quote">
                &ldquo;Paling suka waktu malam sebelum tidur. Skinsistant kayak bestie yang ngingetin: &lsquo;Kemerahan ini wajar kok karena semalam kurang tidur, malam ini pakai pelembap tebal dan istirahat ya&rsquo;. Bikin rutinitas skincare jadi momen me-time yang rileks tanpa overthinking.&rdquo;
              </p>
              <div className="sweet-testimonial-author">
                <div className="sweet-author-avatar">T</div>
                <div className="sweet-author-info">
                  <h4>Tara Clarissa</h4>
                  <p>27 tahun • Product Designer</p>
                </div>
              </div>
            </div>

            <div className="sweet-testimonial-card cluv-hover-lift">
              <p className="sweet-testimonial-quote">
                &ldquo;Rutinitas pagi jadi super simpel. Gak ada lagi drama tumpuk 10 tahap skincare waktu skin barrier lagi ngambek. Fitur Cek Bahan Aktif ngebantu banget biar kandungan serum gak tabrakan. Meja rias rapi, pikiran tenang!&rdquo;
              </p>
              <div className="sweet-testimonial-author">
                <div className="sweet-author-avatar">R</div>
                <div className="sweet-author-info">
                  <h4>Rania Putri</h4>
                  <p>29 tahun • Ibu Muda &amp; Pekerja</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 7. RUANG AMAN & JANJI ETIKA (TRUST & SAFE SPACE)
       * ========================================================================= */}
      <section className="landing-section alt-surface">
        <div className="landing-container">
          <div className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-3">
              <ShieldCheck size={14} />
              <span>Ruang Aman &amp; Terpercaya</span>
            </div>
            <h2 className="cluv-title-section">
              Ruang Amanmu, Sepenuhnya Milikmu
            </h2>
            <p className="cluv-subtitle cluv-mt-3">
              Kami menjaga privasimu dengan standar hukum tertinggi, bukan sekadar janji manis.
            </p>
          </div>

          <div className="trust-bento-grid cluv-reveal-group">
            <div className="trust-bento-card cluv-hover-lift">
              <div className="trust-bento-icon">
                <ShieldCheck size={22} />
              </div>
              <h3 className="cluv-title-card">Privasi Dilindungi UU PDP</h3>
              <p className="cluv-body">
                Foto wajahmu dienkripsi dan diproses sesuai standar UU PDP No. 27/2022. Kami tidak pernah menjual atau membagikan datamu ke pihak pengiklan.
              </p>
            </div>

            <div className="trust-bento-card cluv-hover-lift">
              <div className="trust-bento-icon">
                <Trash2 size={22} />
              </div>
              <h3 className="cluv-title-card">Hak Dihapus Sekali Klik</h3>
              <p className="cluv-body">
                Kamu memiliki kendali mutlak (*Right to be Forgotten*). Seluruh rekam jejak foto dan riwayat percakapan bisa kamu musnahkan permanen kapan saja.
              </p>
            </div>

            <div className="trust-bento-card cluv-hover-lift">
              <div className="trust-bento-icon">
                <Heart size={22} />
              </div>
              <h3 className="cluv-title-card">Batas Kasih &amp; Etika Medis</h3>
              <p className="cluv-body">
                Skincluv adalah pendamping mandiri untuk edukasi kosmetik, bukan pengganti diagnosis medis klinik dokter spesialis dermatologi (Sp.DVE/Sp.KK).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 8. TANYA JAWAB YANG MENENANGKAN (SWEET FAQS)
       * ========================================================================= */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-3">
              <HelpCircle size={14} />
              <span>Tanya Jawab Santai</span>
            </div>
            <h2 className="cluv-title-section">
              Punya Pertanyaan Sebelum Mulai?
            </h2>
            <p className="cluv-subtitle cluv-mt-3">
              Semua hal penting yang sering ditanyakan sahabat meja rias kami.
            </p>
          </div>

          <div className="cluv-accordion cluv-reveal cluv-mx-auto" style={{ maxWidth: '800px' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} className="cluv-accordion-item">
                <button
                  type="button"
                  className="cluv-accordion-trigger"
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`cluv-accordion-chevron ${openFaq === idx ? 'rotate' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="cluv-accordion-body cluv-animate-fade">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 9. SECTION PENUTUP: AJAKAN MEMULAI PERJALANAN BERSAMA
       * ========================================================================= */}
      <section className="landing-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Soft Ambient Floating Clouds for Final CTA (CSS Parallax) */}
        <div className="ambient-skincare-decorations" aria-hidden="true">
          <div className="ambient-decor decor-cta-left cluv-animate-float">
            <svg width="68" height="44" viewBox="0 0 64 42" fill="none">
              <path d="M18 36h28a12 12 0 0 0 0-24 16 16 0 0 0-30-2A10 10 0 0 0 18 36z" fill="#fbcfe8" fillOpacity="0.45"/>
            </svg>
          </div>
          <div className="ambient-decor decor-cta-right cluv-animate-float" style={{ animationDelay: '1.8s' }}>
            <svg width="60" height="38" viewBox="0 0 64 42" fill="none">
              <path d="M18 36h28a12 12 0 0 0 0-24 16 16 0 0 0-30-2A10 10 0 0 0 18 36z" fill="#bceae7" fillOpacity="0.5"/>
            </svg>
          </div>
        </div>

        <div className="landing-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="final-cta-container cluv-reveal is-zoom">
            <div className="cluv-badge is-rose cluv-mx-auto cluv-mb-3">
              <Heart size={14} />
              <span>Akhir dari Rasa Cemas Sendirian</span>
            </div>
            <h2 className="cluv-title-section">Mulai Hari Ini, Biar Skincluv yang Menemani Perjalanan Meja Riasmu</h2>
            <p className="cluv-subtitle cluv-mt-3 cluv-mb-6 cluv-mx-auto" style={{ maxWidth: '560px' }}>
              Kulit butuh waktu alami 28 hari untuk bernapas dan beregenerasi. Tarik napas lega, rawat dirimu dengan penuh kelembutan mulai hari ini.
            </p>
            <div className="cluv-btn-group is-center is-stack-mobile">
              {user ? (
                <Link to="/dashboard" className="cluv-btn is-primary is-lg" style={{ width: '100%', maxWidth: '420px' }}>
                  <LayoutDashboard size={16} />
                  <span>Buka Dashboard Saya</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link to="/register" className="cluv-btn is-primary is-lg" style={{ width: '100%', maxWidth: '420px' }}>
                  <Heart size={16} />
                  <span>Yuk, Mulai Cerita Kulitmu</span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
            
            {/* Reassurance Micro-Copy Trust Strip */}
            <div className="cluv-trust-strip cluv-mt-4">
              <span className="cluv-trust-item">
                <CheckCircle2 size={14} className="cluv-trust-icon cluv-text-teal" />
                <span>Gratis Pendaftaran</span>
              </span>
              <span className="cluv-trust-dot">•</span>
              <span className="cluv-trust-item">
                <CheckCircle2 size={14} className="cluv-trust-icon cluv-text-teal" />
                <span>Tanpa Kartu Kredit</span>
              </span>
              <span className="cluv-trust-dot">•</span>
              <span className="cluv-trust-item">
                <ShieldCheck size={14} className="cluv-trust-icon cluv-text-teal" />
                <span>100% Aman Privasi</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

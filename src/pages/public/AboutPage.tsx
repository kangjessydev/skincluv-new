// src/pages/public/AboutPage.tsx
// Halaman Profil & Cerita Sahabat Skincluv (100% Cluv Micro-Framework Standard)

import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Heart, ArrowRight, BookOpen, Smile } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export default function AboutPage() {
  // Initialize buttery-smooth scroll reveal observer
  useScrollReveal()

  return (
    <div className="cluv-page cluv-surface-public">
      {/* =========================================================================
       * 1. HERO STORY SECTION: CERITA DI BALIK SKINCLUV
       * ========================================================================= */}
      <section className="cluv-section cluv-overflow-hidden">
        {/* Soft Ambient Floating Skincare Stickers (CSS Float / Pulse) */}
        <div className="cluv-ambient-layer" aria-hidden="true">
          <div className="cluv-ambient-decor is-cloud-left cluv-animate-float">
            <svg width="60" height="38" viewBox="0 0 64 42" fill="none">
              <path d="M18 36h28a12 12 0 0 0 0-24 16 16 0 0 0-30-2A10 10 0 0 0 18 36z" fill="#bceae7" fillOpacity="0.55"/>
            </svg>
          </div>
          <div className="cluv-ambient-decor is-star-mid cluv-animate-pulse">
            <Sparkles size={22} className="cluv-text-amber" />
          </div>
          <div className="cluv-ambient-decor is-cloud-right cluv-animate-float cluv-delay-2">
            <svg width="74" height="48" viewBox="0 0 64 42" fill="none">
              <path d="M18 36h28a12 12 0 0 0 0-24 16 16 0 0 0-30-2A10 10 0 0 0 18 36z" fill="#fed7aa" fillOpacity="0.5"/>
            </svg>
          </div>
          <div className="cluv-ambient-decor is-heart-bottom cluv-animate-float cluv-delay-1">
            <Heart size={18} className="cluv-text-rose" />
          </div>
        </div>

        <div className="cluv-container cluv-relative cluv-z-1">
          <div className="cluv-section-header is-wide cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-3">
              <Sparkles size={14} />
              <span>Cerita di Balik Skincluv</span>
            </div>

            <h1 className="cluv-title-hero">
              Karena Merawat Kulit Seharusnya Bikin Tenang, Bukan Bikin Cemas.
            </h1>

            <p className="cluv-lead cluv-mt-4">
              Skincluv lahir dari satu keresahan sederhana: kenapa merawat diri yang seharusnya jadi momen relaksasi, malah sering bikin kita overthinking di depan cermin dan bingung di lorong toko kecantikan?
            </p>

            {/* Reassurance Micro-Copy */}
            <div className="cluv-trust-strip is-center cluv-mt-6">
              <span className="cluv-trust-item">
                <Heart size={14} className="cluv-trust-icon cluv-text-rose" />
                <span>Sahabat Meja Rias</span>
              </span>
              <span className="cluv-trust-dot">•</span>
              <span className="cluv-trust-item">
                <Smile size={14} className="cluv-trust-icon cluv-text-teal" />
                <span>Tanpa Vonis Menghakimi</span>
              </span>
              <span className="cluv-trust-dot">•</span>
              <span className="cluv-trust-item">
                <ShieldCheck size={14} className="cluv-trust-icon cluv-text-teal" />
                <span>Privasi Terjaga UU PDP</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. ORIGIN STORY WITH PHOTO FRAME
       * ========================================================================= */}
      <section className="cluv-section">
        <div className="cluv-container">
          <div className="cluv-grid cols-2 cluv-items-center cluv-gap-7">
            {/* Left Column: Origin Story Narrative */}
            <div className="cluv-reveal">
              <div className="cluv-badge is-rose cluv-mb-3">
                <Heart size={14} />
                <span>Berawal Dari Obrolan Meja Rias</span>
              </div>

              <h2 className="cluv-title-section cluv-mb-4">
                Kami Lelah Melihat Klaim Berlebihan &amp; Rasa Sendirian.
              </h2>

              <p className="cluv-body cluv-mb-4 cluv-line-relaxed">
                Berapa banyak botol skincare yang akhirnya mengendap berdebu di meja rias hanya karena tergiur review viral yang ternyata gak cocok di kulit kita? Mau tanya orang lain takut dianggap berlebihan, tapi kalau dibiarin malah bikin makin kepikiran.
              </p>

              <p className="cluv-body cluv-mb-6 cluv-line-relaxed">
                Kami membangun Skincluv bukan untuk membuat klinik digital yang kaku atau menggurui, tapi sebagai <strong>sahabat setia yang selalu ada di genggamanmu</strong>—yang siap mendengarkan curhatan kulitmu, membacakan label komposisi secara jujur, dan menemani proses regenerasi 28 hari dengan sabar.
              </p>

              {/* Companion Note Highlight Card (Using cluv-card-note) */}
              <div className="cluv-card-note is-rose">
                <div className="cluv-card-icon-wrap is-sm is-rose cluv-flex-shrink-0">
                  <Heart size={16} />
                </div>
                <div>
                  <h4 className="cluv-font-bold cluv-text-dark cluv-mb-1 cluv-caption">Prinsip Sederhana Kami</h4>
                  <p className="cluv-caption cluv-line-normal">
                    Kulit butuh teman yang sabar mendampingi proses alaminya, bukan tuntutan instan yang bikin cemas.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Warm Illustration / Photo Frame */}
            <div className="cluv-reveal">
              <div className="cluv-relative cluv-w-full">
                <div className="cluv-photo-frame cluv-hover-lift">
                  <img
                    src="/images/skincare-routine-warmth.jpg"
                    alt="Rutinitas skincare hangat dan tenang di meja rias"
                    className="cluv-photo-img"
                  />
                </div>
                <div className="cluv-photo-badge cluv-animate-float">
                  <Sparkles size={14} />
                  <span>28 Hari Regenerasi Alami 🌿</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 3. THREE PROMISES OF A BESTIE (BENTO GRID)
       * ========================================================================= */}
      <section className="cluv-section is-alt">
        <div className="cluv-container">
          <header className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-gold cluv-mb-3">
              <Sparkles size={14} />
              <span>Janji Sahabat</span>
            </div>
            <h2 className="cluv-title-section cluv-mb-3">3 Hal yang Selalu Kami Pegang Teguh</h2>
            <p className="cluv-subtitle">
              Prinsip sederhana yang membuat hubunganmu dengan kulit jadi lebih sehat dan penuh kasih sayang.
            </p>
          </header>

          <div className="cluv-grid cols-3 cluv-reveal-group">
            {/* Card 1 */}
            <div className="cluv-card is-interactive cluv-hover-lift">
              <div className="cluv-card-icon-wrap is-rose cluv-mb-4">
                <Smile size={22} />
              </div>
              <h3 className="cluv-title-card cluv-mb-2">Gak Pernah Menghakimi</h3>
              <p className="cluv-body">
                Kondisi kulitmu hari ini adalah sinyal alami tubuh yang butuh perhatian, bukan aib yang harus ditutupi dengan rasa malu. Kami melihatnya dengan lembut.
              </p>
            </div>

            {/* Card 2 */}
            <div className="cluv-card is-interactive cluv-hover-lift">
              <div className="cluv-card-icon-wrap is-gold cluv-mb-4">
                <BookOpen size={22} />
              </div>
              <h3 className="cluv-title-card cluv-mb-2">Jujur Soal Bahan Produk</h3>
              <p className="cluv-body">
                Kalau produk lamamu di rumah kandungannya sudah cukup bagus, kami bakal terus terang bilang: simpan dulu uangmu, gak perlu beli botol baru yang lagi viral.
              </p>
            </div>

            {/* Card 3 */}
            <div className="cluv-card is-interactive cluv-hover-lift">
              <div className="cluv-card-icon-wrap cluv-mb-4">
                <ShieldCheck size={22} />
              </div>
              <h3 className="cluv-title-card cluv-mb-2">Buku Harian Rahasia yang Aman</h3>
              <p className="cluv-body">
                Foto wajah dan ceritamu adalah privasi sakral. Kami mematuhi UU PDP No. 27/2022, tidak pernah menjual data, dan bisa kamu hapus seutuhnya kapan saja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 4. ETHICAL DEMARCATION: SAHABAT, BUKAN KLINIK (Fixed Box)
       * ========================================================================= */}
      <section className="cluv-section">
        <div className="cluv-container">
          <div className="cluv-card cluv-reveal">
            <div className="cluv-grid cols-2 cluv-items-center cluv-gap-6">
              {/* Text Side */}
              <div>
                <div className="cluv-badge is-purple cluv-mb-3">
                  <ShieldCheck size={14} />
                  <span>Batas Kasih &amp; Komitmen Kami</span>
                </div>
                <h2 className="cluv-title-section cluv-mb-4">
                  Mengapa Kami Memilih Jadi Sahabat, Bukan Klinik?
                </h2>
                <p className="cluv-body cluv-mb-3 cluv-line-relaxed">
                  Di Skincluv, kami memegang teguh batas etika. Kami secara tegas <strong>bukan fasilitas telemedisin klinis dan bukan alat kesehatan</strong> (UU Kesehatan No. 17/2023). Kami tidak mendiagnosis penyakit dan tidak meresepkan obat keras dokter.
                </p>
                <p className="cluv-body cluv-line-relaxed">
                  Peran kami adalah sebagai <em>pendamping edukatif</em> yang membantumu mengamati sinyal harian kulit, memahami kecocokan bahan sebelum membeli, dan merawat diri secara konsisten tanpa rasa takut salah langkah.
                </p>
                <div className="cluv-btn-group is-stack-mobile cluv-mt-6">
                  <Link to="/medical-disclaimer" className="cluv-btn is-outline is-md">
                    <span>Penyangkalan Medis</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link to="/register" className="cluv-btn is-primary is-md">
                    <Heart size={14} />
                    <span>Mulai Cerita Bareng Skincluv</span>
                  </Link>
                </div>
              </div>

              {/* Photo Side */}
              <div>
                <div className="cluv-photo-frame cluv-hover-lift">
                  <img
                    src="/images/mirror-skin-note.jpg"
                    alt="Pesan pengingat di cermin: Kulitmu berharga, rawat pelan-pelan ya"
                    className="cluv-photo-img"
                  />
                  <p className="cluv-photo-caption">
                    &ldquo;Kulitmu berharga, rawat pelan-pelan ya.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

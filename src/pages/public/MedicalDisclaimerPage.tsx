// src/pages/public/MedicalDisclaimerPage.tsx
// Halaman Penyangkalan Medis & Batasan Layanan Non-Terapeutik Skincluv (100% Cluv Micro-Framework)
// Kepatuhan: UU Kesehatan No. 17/2023, Permenkes No. 20/2019, dan Peraturan BPOM No. 3/2022
// Invarian: Invarian 19 (Non-therapeutic claim boundary) & Invarian 22 (Zero-runtime-parser)

import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle, Stethoscope, Clock, ChevronRight, Scale, ChevronDown, List, X, ShieldCheck
} from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const CLAUSES = [
  { id: 'cakupan', num: '1', title: 'Sifat & Ruang Lingkup Layanan' },
  { id: 'bukan-diagnosis', num: '2', title: 'Bukan Diagnosis & Pengganti Dokter' },
  { id: 'darurat', num: '3', title: 'Situasi Gawat Darurat' },
  { id: 'akurasi', num: '4', title: 'Keterbatasan Algoritma & Foto' },
  { id: 'tanggung-jawab', num: '5', title: 'Tanggung Jawab Mandiri Pengguna' },
  { id: 'produk', num: '6', title: 'Sifat Kosmetik Produk' },
  { id: 'usia', num: '7', title: 'Batasan Usia Pengguna' },
  { id: 'hukum', num: '8', title: 'Yurisdiksi Hukum RI' }
]

export default function MedicalDisclaimerPage() {
  useScrollReveal()
  const [activeSection, setActiveSection] = useState('cakupan')
  const [alertExpanded, setAlertExpanded] = useState(false)
  const [tocDrawerOpen, setTocDrawerOpen] = useState(false)
  const isClickingRef = useRef(false)

  // Scroll Spy: Akurat mendeteksi klausul yang sedang berada di garis baca aktif (120px dari navbar)
  useEffect(() => {
    const handleScroll = () => {
      if (isClickingRef.current) return

      const readingAnchor = 120
      let foundId = CLAUSES[0].id

      for (let i = 0; i < CLAUSES.length; i++) {
        const el = document.getElementById(CLAUSES[i].id)
        if (el) {
          const rect = el.getBoundingClientRect()
          // Klausul aktif adalah yang puncaknya sudah menyentuh garis baca dan dasarnya belum terlewati
          if (rect.top <= readingAnchor && rect.bottom > readingAnchor) {
            foundId = CLAUSES[i].id
            break
          } else if (rect.top <= readingAnchor) {
            foundId = CLAUSES[i].id
          }
        }
      }

      setActiveSection(foundId)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollTo = (id: string) => {
    setActiveSection(id)
    isClickingRef.current = true
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => {
        isClickingRef.current = false
      }, 700)
    }
  }

  const currentClause = CLAUSES.find((c) => c.id === activeSection) || CLAUSES[0]

  return (
    <div className="cluv-page cluv-surface-public">
      <section className="cluv-section">
        <div className="cluv-container" style={{ maxWidth: '1120px' }}>
          {/* HEADER DOKUMEN */}
          <header className="cluv-section-header is-left cluv-reveal cluv-mb-5" style={{ maxWidth: '860px' }}>
            <div className="cluv-badge is-teal cluv-mb-3">
              <Scale size={14} />
              <span>Dokumen Kepatuhan Hukum &amp; Kesehatan</span>
            </div>
            <h1 className="cluv-title-hero cluv-mb-3">Penyangkalan Medis &amp; Batasan Layanan</h1>
            <p className="cluv-lead cluv-mb-3">
              Standar transparansi hukum operasional non-terapeutik platform kecerdasan buatan Skincluv berdasarkan UU Kesehatan No. 17/2023 dan Permenkes No. 20/2019.
            </p>
            <div className="cluv-meta-bar cluv-mb-5">
              <div className="cluv-meta-item">
                <Clock size={14} />
                <span>Terakhir diperbarui: 28 September 2026</span>
              </div>
              <div className="cluv-meta-item">
                <ShieldCheck size={14} />
                <span>Berlaku efektif bagi seluruh pengguna</span>
              </div>
            </div>
          </header>

          {/* EMERGENCY BANNER (COLLAPSIBLE DI MOBILE, LENGKAP DI DESKTOP) */}
          <div className={`cluv-alert is-danger is-collapsible ${alertExpanded ? 'is-expanded' : 'is-collapsed'} cluv-mb-6`}>
            <AlertTriangle size={22} className="cluv-alert-icon" />
            <div className="cluv-alert-content">
              <div className="cluv-alert-header">
                <div className="cluv-alert-title" style={{ fontSize: '0.9375rem', margin: 0 }}>
                  Bukan untuk Kondisi Darurat Medis
                </div>
                <button
                  type="button"
                  className="cluv-alert-toggle-btn"
                  onClick={() => setAlertExpanded(!alertExpanded)}
                  aria-expanded={alertExpanded}
                  aria-label={alertExpanded ? 'Tutup rincian darurat' : 'Lihat rincian darurat'}
                >
                  <span>{alertExpanded ? 'Tutup' : 'Detail'}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
              <p className="cluv-alert-message cluv-mt-2" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                Jika Anda mengalami reaksi alergi anafilaktik, infeksi kulit bernanah parah, luka terbuka akut, pembengkakan wajah mendadak, atau sensasi terbakar hebat, <strong>segera hubungi 112/119 atau kunjungi Instalasi Gawat Darurat (IGD) fasilitas pelayanan kesehatan terdekat</strong>. Skincluv sama sekali tidak dapat digunakan untuk penanganan gawat darurat.
              </p>
            </div>
          </div>

          {/* TWO-COLUMN GRID (DESKTOP: 280px + 1fr) */}
          <div className="cluv-doc-layout">
            {/* SISI KIRI: STICKY TOC SIDEBAR (>= 880px) */}
            <aside className="cluv-doc-sidebar cluv-hide-mobile">
              <div className="cluv-card is-compact">
                <div
                  className="cluv-font-bold cluv-mb-3 cluv-pb-2"
                  style={{
                    borderBottom: '1px solid var(--cluv-neutral-200)',
                    fontSize: '0.8125rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--cluv-neutral-800)'
                  }}
                >
                  Daftar Klausul
                </div>

                <nav className="cluv-flex-col cluv-gap-1">
                  {CLAUSES.map((c) => {
                    const isActive = activeSection === c.id
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => scrollTo(c.id)}
                        className={`cluv-doc-toc-link ${isActive ? 'is-active' : ''}`}
                      >
                        <ChevronRight size={14} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.num}. {c.title}
                        </span>
                      </button>
                    )
                  })}
                </nav>

                <div className="cluv-card-note cluv-mt-4">
                  <Stethoscope size={16} className="cluv-text-teal cluv-flex-shrink-0" style={{ marginTop: '2px' }} />
                  <p className="cluv-caption cluv-text-muted" style={{ lineHeight: 1.45 }}>
                    Butuh evaluasi klinis pasti? Selalu konsultasikan dengan dokter spesialis dermatologi (Sp.DVE/Sp.KK).
                  </p>
                </div>
              </div>
            </aside>

            {/* SISI KANAN: ARTIKEL DOKUMEN LENGKAP */}
            <article className="cluv-card cluv-doc-article">

              {/* Klausul 1 */}
              <section id="cakupan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  1. Sifat &amp; Ruang Lingkup Layanan Non-Terapeutik
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Skincluv adalah platform aplikasi perangkat lunak berbasis kecerdasan buatan (AI) yang dirancang secara khusus untuk tujuan <strong>edukasi, analisis observasional mandiri, dan evaluasi kompatibilitas bahan kosmetik</strong>.
                </p>

                <div className="cluv-alert is-info cluv-my-4">
                  <div className="cluv-alert-content">
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9375rem', fontWeight: 700 }}>
                      Sesuai dengan ketentuan Pasal 1 angka 22 UU Kesehatan No. 17 Tahun 2023 dan Permenkes No. 20 Tahun 2019:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.65, fontSize: '0.9375rem' }}>
                      <li>Skincluv <strong>BUKAN alat kesehatan (medical device)</strong>.</li>
                      <li>Skincluv <strong>BUKAN fasilitas pelayanan kesehatan</strong> (klinik, rumah sakit, maupun laboratorium patologi).</li>
                      <li>Skincluv <strong>BUKAN penyedia layanan telemedisin klinis</strong>.</li>
                      <li>Skincluv <strong>BUKAN sarana apotek atau toko obat</strong>.</li>
                    </ul>
                  </div>
                </div>

                <p className="cluv-body">
                  Skincluv tidak mempekerjakan dokter untuk memberikan konsultasi klinis melalui aplikasi ini, dan <strong>tidak ada hubungan dokter–pasien (*doctor-patient relationship*) yang terbentuk</strong> melalui penggunaan platform ini.
                </p>
              </section>

              {/* Klausul 2 */}
              <section id="bukan-diagnosis" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  2. Bukan Diagnosis Medis &amp; Bukan Pengganti Dokter
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Seluruh keluaran fitur—termasuk skor kesehatan kulit, penilaian visual indikator jerawat, kelembapan, kemerahan, analisis kompatibilitas kandungan aktif, serta percakapan edukatif bersama asisten AI (Skinsistant):
                </p>
                <ul className="cluv-body cluv-mb-4" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Merupakan <strong>estimasi komputasional algoritmik</strong> semata untuk memandu rutinitas perawatan kosmetik harian pengguna.</li>
                  <li><strong>BUKAN diagnosis medis klinis</strong> atas patologi penyakit kulit (seperti Acne Vulgaris parah, Dermatitis Seboroik, Rosacea, Psoriasis, atau Kanker Kulit).</li>
                  <li><strong>BUKAN resep obat medis</strong>, instruksi obat keras daftar G, terapi hormon, antibiotik topikal, maupun steroid.</li>
                  <li><strong>TIDAK MENGGANTIKAN</strong> pemeriksaan klinis tatap muka, biopsi, atau penanganan medis langsung oleh dokter spesialis dermatologi, venereologi, dan estetika (dr. Sp.DVE / dr. Sp.KK).</li>
                </ul>
                <p className="cluv-body">
                  Anda dilarang keras mengabaikan, menunda, atau menghentikan pengobatan maupun terapi medis resmi yang telah diresepkan oleh dokter berlisensi Anda hanya karena merujuk pada analisis yang ditampilkan oleh Skincluv.
                </p>
              </section>

              {/* Klausul 3 */}
              <section id="darurat" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  3. Situasi Gawat Darurat &amp; Kondisi Berat
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Platform Skincluv beroperasi dengan model komputasi asinkron dan tidak dipantau secara langsung oleh manusia dalam waktu nyata (*real-time*). Oleh karena itu, Skincluv dilarang keras digunakan untuk situasi kegawatdaruratan klinis apa pun.
                </p>
                <p className="cluv-body">
                  Bila Anda mencurigai adanya infeksi bakteri/jamur sistemik, lesi kulit yang mengalami pendarahan terus-menerus, tahi lalat yang berubah bentuk/ukuran secara asimetris (tanda bahaya ABCDE melanoma), segera temui dokter spesialis kulit terdekat.
                </p>
              </section>

              {/* Klausul 4 */}
              <section id="akurasi" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  4. Keterbatasan Algoritma &amp; Kualitas Unggahan Foto
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Hasil analisis pemindaian visual wajah sangat dipengaruhi oleh variabel eksternal teknis perangkat keras Anda:
                </p>
                <ul className="cluv-body cluv-mb-4" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Tingkat pencahayaan ruangan (*ambient lighting*), sudut kemiringan wajah, dan ketajaman fokus kamera ponsel.</li>
                  <li>Keberadaan filter kamera digital, riasan wajah (*makeup*), tabir surya fisik yang menyisakan *whitecast*, atau resolusi sensor optik yang rendah.</li>
                </ul>
                <p className="cluv-body">
                  Skor kulit bersifat estimasi semi-kuantitatif. Sesuai ambang MCID (*Minimal Clinically Important Difference*), fluktuasi skor di bawah 5 poin antar-foto dalam jarak waktu berdekatan merupakan variasi wajar kalibrasi sudut pencahayaan, bukan merupakan perbaikan atau kemunduran fisiologis jaringan kulit nyata.
                </p>
              </section>

              {/* Klausul 5 */}
              <section id="tanggung-jawab" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  5. Tanggung Jawab Mandiri Pengguna
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Keputusan untuk membeli, mencoba, mengombinasikan (*layering*), atau menghentikan penggunaan produk kosmetik perawatan kulit adalah hak dan tanggung jawab mandiri Anda sepenuhnya (*assumption of risk*).
                </p>
                <p className="cluv-body">
                  Bagi pengguna dalam kondisi fisiologis khusus—termasuk wanita hamil, ibu menyusui, penderita eksim atopik kronis, atau individu yang sedang menjalani kemoterapi—wajib melakukan uji tempel (*patch test*) mandiri dan berkonsultasi dengan dokter kandungan/dermatolog sebelum menggunakan bahan aktif dengan konsentrasi tinggi (seperti Retinoid, AHA/BHA konsentrasi asam, atau Benzoyl Peroxide).
                </p>
              </section>

              {/* Klausul 6 */}
              <section id="produk" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  6. Sifat Kosmetik &amp; Legalitas Izin Edar Produk
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Rekomendasi nama bahan aktif atau produk kosmetik yang terdapat di dalam aplikasi Skincluv bersumber dari basis data komposisi kosmetik publik dan literatur dermatologi terverifikasi.
                </p>
                <p className="cluv-body">
                  Seluruh produk kosmetik yang disebutkan merupakan sediaan kosmetik perawatan (skincare) berizin edar BPOM milik masing-masing pemegang merk dagang/pelaku usaha terkait. <strong>Skincluv bukan produsen, bukan distributor, bukan pemilik merk dagang, dan bukan pihak yang menerbitkan Nomor Notifikasi BPOM atas produk-produk tersebut.</strong>
                </p>
              </section>

              {/* Klausul 7 */}
              <section id="usia" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  7. Batasan Usia Pengguna
                </h2>
                <p className="cluv-body">
                  Layanan Skincluv ditujukan bagi individu yang telah berusia <strong>minimal 17 (tujuh belas) tahun</strong> atau telah cakap secara hukum perdata Republik Indonesia. Pengguna di bawah usia 17 tahun hanya diperkenankan menggunakan aplikasi di bawah persetujuan dan pengawasan aktif dari orang tua atau wali hukum yang sah.
                </p>
              </section>

              {/* Klausul 8 */}
              <section id="hukum" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  8. Pembaruan Klausul &amp; Yurisdiksi Hukum RI
                </h2>
                <p className="cluv-body">
                  Penyangkalan Medis ini tunduk, ditafsirkan, dan diberlakukan secara eksklusif berdasarkan hukum materiil Negara Kesatuan Republik Indonesia. Pengembang berhak memperbarui klausul kepatuhan ini sewaktu-waktu seiring dengan evolusi regulasi teknologi kesehatan dan pedoman Badan Pengawas Obat dan Makanan (BPOM).
                </p>
              </section>
            </article>
          </div>

          {/* MOBILE FLOATING ACTION BUTTON (<= 879px) */}
          <button
            type="button"
            className="cluv-fab cluv-hide-desktop"
            onClick={() => setTocDrawerOpen(true)}
            aria-label="Buka Daftar Klausul"
          >
            <List size={18} />
            <span>Daftar Isi</span>
            <span className="cluv-fab-badge">{currentClause.num}</span>
          </button>

          {/* MOBILE SLIDE-OVER DRAWER (<= 879px) */}
          <div
            className={`cluv-drawer-backdrop cluv-hide-desktop ${tocDrawerOpen ? 'is-open' : ''}`}
            onClick={() => setTocDrawerOpen(false)}
            aria-hidden={!tocDrawerOpen}
          >
            <div className="cluv-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="cluv-drawer-header">
                <div className="cluv-flex-row cluv-gap-2">
                  <Scale size={18} className="cluv-text-teal" />
                  <h3 className="cluv-drawer-title">Daftar Klausul</h3>
                </div>
                <button
                  type="button"
                  className="cluv-drawer-close"
                  onClick={() => setTocDrawerOpen(false)}
                  aria-label="Tutup daftar klausul"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cluv-drawer-body">
                <p className="cluv-caption cluv-text-muted cluv-mb-2">
                  Pilih klausul untuk langsung melompat ke bagian yang dituju:
                </p>

                <div className="cluv-flex-col cluv-gap-2">
                  {CLAUSES.map((c) => {
                    const isActive = activeSection === c.id
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          scrollTo(c.id)
                          setTocDrawerOpen(false)
                        }}
                        className={`cluv-drawer-toc-link ${isActive ? 'is-active' : ''}`}
                      >
                        <div className="cluv-flex-row cluv-gap-2" style={{ minWidth: 0, flex: 1 }}>
                          <span className={isActive ? 'cluv-text-teal' : 'cluv-text-muted'} style={{ fontWeight: 800 }}>
                            {c.num}.
                          </span>
                          <span style={{ lineHeight: 1.4 }}>{c.title}</span>
                        </div>
                        <ChevronRight size={16} className="cluv-flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>

                <div className="cluv-card-note cluv-mt-4">
                  <Stethoscope size={16} className="cluv-text-teal cluv-flex-shrink-0" style={{ marginTop: '2px' }} />
                  <p className="cluv-caption cluv-text-muted" style={{ lineHeight: 1.45 }}>
                    Butuh evaluasi klinis pasti? Selalu konsultasikan dengan dokter spesialis dermatologi (Sp.DVE/Sp.KK).
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


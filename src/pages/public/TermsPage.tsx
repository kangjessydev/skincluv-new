// src/pages/public/TermsPage.tsx
// Syarat dan Ketentuan Layanan Resmi Skincluv (100% Cluv Micro-Framework)
// Kepatuhan: UU ITE No. 1/2024, UU Perlindungan Konsumen No. 8/1999, UU Kesehatan No. 17/2023
// Invarian: Invarian 18 (Pricing integrity), Invarian 19 (Non-therapeutic claim boundary), Invarian 22 (Zero-runtime-parser)

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Scale, Clock, ShieldCheck, AlertCircle, ChevronRight, ChevronDown, List, X, HelpCircle
} from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const CLAUSES = [
  { id: 'penerimaan', num: '1', title: 'Penerimaan Ketentuan Layanan' },
  { id: 'kelayakan', num: '2', title: 'Kelayakan Pengguna & Keamanan Akun' },
  { id: 'layanan-ai', num: '3', title: 'Karakteristik Layanan Analitik AI' },
  { id: 'kuota-pembayaran', num: '4', title: 'Kuota & Pembayaran Tripay' },
  { id: 'larangan', num: '5', title: 'Batasan Penggunaan yang Dilarang' },
  { id: 'kekayaan-intelektual', num: '6', title: 'Hak Kekayaan Intelektual' },
  { id: 'tanggung-jawab', num: '7', title: 'Batasan Tanggung Jawab Hukum' },
  { id: 'hukum', num: '8', title: 'Hukum & Penyelesaian Sengketa' }
]

export default function TermsPage() {
  useScrollReveal()
  const [activeSection, setActiveSection] = useState('penerimaan')
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
              <span>Dokumen Perjanjian Pengguna</span>
            </div>
            <h1 className="cluv-title-hero cluv-mb-3">Syarat dan Ketentuan Layanan</h1>
            <p className="cluv-lead cluv-mb-3">
              Perjanjian hukum yang mengikat antara Anda sebagai pengguna dengan pengembang platform Skincluv terkait akses, fitur komputasi AI, sistem pembayaran, dan batasan tanggung jawab.
            </p>
            <div className="cluv-meta-bar cluv-mb-5">
              <div className="cluv-meta-item">
                <Clock size={14} />
                <span>Terakhir diperbarui: 28 September 2026</span>
              </div>
              <div className="cluv-meta-item">
                <ShieldCheck size={14} />
                <span>Berlaku untuk seluruh pengguna Skincluv</span>
              </div>
            </div>
          </header>

          {/* MEDICAL SUMMARY BANNER (COLLAPSIBLE DI MOBILE, LENGKAP DI DESKTOP) */}
          <div className={`cluv-alert is-warning is-collapsible ${alertExpanded ? 'is-expanded' : 'is-collapsed'} cluv-mb-6`}>
            <AlertCircle size={22} className="cluv-alert-icon" />
            <div className="cluv-alert-content">
              <div className="cluv-alert-header">
                <div className="cluv-alert-title" style={{ fontSize: '0.9375rem', margin: 0 }}>
                  Pemberitahuan Non-Terapeutik &amp; Batasan Layanan
                </div>
                <button
                  type="button"
                  className="cluv-alert-toggle-btn"
                  onClick={() => setAlertExpanded(!alertExpanded)}
                  aria-expanded={alertExpanded}
                  aria-label={alertExpanded ? 'Tutup ringkasan batasan' : 'Lihat ringkasan batasan'}
                >
                  <span>{alertExpanded ? 'Tutup' : 'Detail'}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
              <p className="cluv-alert-message cluv-mt-2" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                Skincluv adalah software edukasi kosmetik berbasis kecerdasan buatan (AI), bukan fasilitas pelayanan kesehatan dan bukan penyedia telemedisin klinis. Seluruh hasil analisis BUKAN diagnosis medis. Baca selengkapnya di <Link to="/medical-disclaimer" className="cluv-text-amber cluv-font-bold" style={{ textDecoration: 'underline' }}>Penyangkalan Medis Resmi</Link>.
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
                  Daftar Bagian
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
                  <HelpCircle size={16} className="cluv-text-teal cluv-flex-shrink-0" style={{ marginTop: '2px' }} />
                  <p className="cluv-caption cluv-text-muted" style={{ lineHeight: 1.45 }}>
                    Pertanyaan seputar ketentuan hukum? Kunjungi menu <Link to="/contact" className="cluv-text-teal cluv-font-bold">Bantuan &amp; Kontak</Link>.
                  </p>
                </div>
              </div>
            </aside>

            {/* SISI KANAN: ARTIKEL DOKUMEN LENGKAP */}
            <article className="cluv-card cluv-doc-article">

              {/* Bagian 1 */}
              <section id="penerimaan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  1. Penerimaan Ketentuan Layanan
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Dengan mengakses, mendaftar, menggunakan situs web, atau memanfaatkan API Skincluv, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat secara hukum oleh Syarat dan Ketentuan ini serta Kebijakan Privasi kami.
                </p>
                <p className="cluv-body">
                  Apabila Anda tidak menyetujui salah satu butir ketentuan dalam dokumen ini, Anda tidak diperkenankan untuk mengakses atau menggunakan layanan Skincluv lebih lanjut.
                </p>
              </section>

              {/* Bagian 2 */}
              <section id="kelayakan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  2. Kelayakan Pengguna &amp; Keamanan Akun
                </h2>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Batasan Usia:</strong> Anda menyatakan bahwa Anda telah berusia minimal 17 (tujuh belas) tahun atau telah berada di bawah bimbingan dan izin sah dari orang tua/wali hukum.</li>
                  <li><strong>Kerahasiaan Kredensial:</strong> Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan token autentikasi akun Anda. Segala tindakan atau transaksi yang dilakukan melalui akun Anda dianggap sebagai tindakan sah Anda.</li>
                  <li><strong>Kebenaran Data:</strong> Anda wajib memberikan informasi email yang valid dan aktif untuk keperluan verifikasi autentikasi serta pengiriman bukti tagihan pembayaran.</li>
                </ul>
              </section>

              {/* Bagian 3 */}
              <section id="layanan-ai" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  3. Karakteristik Layanan Analitik Kecerdasan Buatan
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Skincluv memanfaatkan model komputasi kecerdasan buatan (*Large Language Models* dan algoritma visi komputer) untuk memproses observasi visual kondisi kulit dan kandungan kosmetik.
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Sifat Estimasi:</strong> Hasil pemindaian (Scan Wajah &amp; Cek Ingredient) bersifat komputasi estimatif probabilistik untuk tujuan edukasi perawatan preventif.</li>
                  <li><strong>Penolakan Status Medis:</strong> Skincluv secara mutlak bukan merupakan alat diagnostik medis, bukan fasilitas telemedisin klinis, dan dilarang digunakan untuk mengobati penyakit kulit klinis akut. Ketentuan lengkap diatur dalam <Link to="/medical-disclaimer" className="cluv-text-teal cluv-font-bold">Penyangkalan Medis</Link>.</li>
                  <li><strong>Idempotensi Pemindaian:</strong> Untuk melindungi kuota pengguna, sistem menerapkan hashing kanonikal SHA-256 pada foto yang identik dalam kurun waktu 48 jam sehingga tidak memotong kuota ganda secara keliru.</li>
                </ul>
              </section>

              {/* Bagian 4 */}
              <section id="kuota-pembayaran" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  4. Kuota, Paket Langganan, &amp; Pembayaran Gerbang Tripay
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Model komersial Skincluv beroperasi dengan skema <strong>Prepaid 30-Day Access Pass</strong>:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Tanpa Penagihan Otomatis:</strong> Tidak ada skema *auto-debit* berkala. Pengguna hanya membayar satu kali untuk mendapatkan masa aktif 30 hari dan kuota Universal AI yang bersangkutan.</li>
                  <li><strong>Gerbang Pembayaran Resmi:</strong> Pembayaran diproses melalui PT Trikarya Pratama Sukses (Tripay Payment Gateway) yang terdaftar dan diawasi oleh Bank Indonesia. Saluran pembayaran mencakup QRIS, Virtual Account, Minimarket, dan E-Wallet.</li>
                  <li><strong>Kebijakan Pengembalian Dana:</strong> Ketentuan mengenai pengembalian dana penuh akibat kegagalan sistem, pemotongan ganda, serta batasan produk digital diatur secara khusus dalam <Link to="/refund-policy" className="cluv-text-teal cluv-font-bold">Kebijakan Pengembalian Dana</Link>.</li>
                </ul>
              </section>

              {/* Bagian 5 */}
              <section id="larangan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  5. Batasan Penggunaan yang Dilarang (*Prohibited Uses*)
                </h2>
                <p className="cluv-body cluv-mb-3">Pengguna dilarang keras untuk:</p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li>Mengunggah foto bukan wajah manusia, gambar eksplisit/pornografi, ujaran kebencian, atau gambar milik orang lain tanpa izin tertulis.</li>
                  <li>Melakukan rekayasa balik (*reverse engineering*), dekompilasi, penyusupan keamanan (*penetration testing* tanpa izin), scraping data otomatis tanpa izin tertulis, atau manipulasi kuota dan saldo koin secara tidak sah.</li>
                  <li>Menyalahgunakan output Skincluv untuk mengklaim kualifikasi medis palsu atau menjual rekomendasi Skincluv sebagai layanan diagnosis dokter klinis kepada pihak ketiga.</li>
                  <li>Mengelabui gerbang pembayaran Tripay melalui manipulasi callback request atau transaksi palsu.</li>
                </ul>
              </section>

              {/* Bagian 6 */}
              <section id="kekayaan-intelektual" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  6. Hak Kekayaan Intelektual
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Seluruh hak cipta, merk dagang, logo, desain antarmuka, algoritma pemindaian, dan kode sumber perangkat lunak Skincluv adalah aset intelektual milik pengembang Skincluv yang dilindungi oleh Undang-Undang Hak Cipta Republik Indonesia.
                </p>
                <p className="cluv-body">
                  Pengguna tetap memegang hak kepemilikan atas foto wajah asli yang diunggah. Dengan mengunggah foto, pengguna memberikan lisensi terbatas kepada Skincluv semata-mata untuk memproses komputasi analisis visual dan mengekstrak matriks kondisi kulit sesuai Kebijakan Privasi.
                </p>
              </section>

              {/* Bagian 7 */}
              <section id="tanggung-jawab" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  7. Batasan Tanggung Jawab Hukum (*Limitation of Liability*)
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Sejauh diizinkan oleh hukum yang berlaku, Skincluv dan tim pengembangnya tidak bertanggung jawab atas kerugian materiil, immateriil, cedera fisik, atau reaksi alergi/iritasi kulit akibat penggunaan mandiri atas produk kosmetik yang diulas pada platform ini.
                </p>
                <p className="cluv-body">
                  Pengguna memahami bahwa respon biologis kulit terhadap bahan kosmetik bersifat unik. Pengguna wajib melakukan uji coba (*patch test*) dan memeriksa nomor notifikasi BPOM resmi sebelum menggunakan produk kosmetik baru.
                </p>
              </section>

              {/* Bagian 8 */}
              <section id="hukum" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  8. Hukum yang Mengatur &amp; Penyelesaian Sengketa
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Syarat dan Ketentuan ini tunduk dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap perselisihan yang timbul akan diupayakan diselesaikan terlebih dahulu melalui musyawarah mufakat.
                </p>
                <p className="cluv-body">
                  Jika dalam waktu 30 (tiga puluh) hari musyawarah tidak mencapai mufakat, perselisihan akan diselesaikan melalui yurisdiksi Badan Arbitrase Nasional Indonesia (BANI) atau Pengadilan Negeri yang berwenang di wilayah hukum domisili pengembang Skincluv.
                </p>
              </section>
            </article>
          </div>

          {/* MOBILE FLOATING ACTION BUTTON (<= 879px) */}
          <button
            type="button"
            className="cluv-fab cluv-hide-desktop"
            onClick={() => setTocDrawerOpen(true)}
            aria-label="Buka Daftar Bagian"
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
                  <h3 className="cluv-drawer-title">Daftar Bagian</h3>
                </div>
                <button
                  type="button"
                  className="cluv-drawer-close"
                  onClick={() => setTocDrawerOpen(false)}
                  aria-label="Tutup daftar bagian"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cluv-drawer-body">
                <p className="cluv-caption cluv-text-muted cluv-mb-2">
                  Pilih bagian untuk langsung melompat ke konten yang dituju:
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
                  <HelpCircle size={16} className="cluv-text-teal cluv-flex-shrink-0" style={{ marginTop: '2px' }} />
                  <p className="cluv-caption cluv-text-muted" style={{ lineHeight: 1.45 }}>
                    Pertanyaan seputar ketentuan hukum? Kunjungi menu <Link to="/contact" className="cluv-text-teal cluv-font-bold">Bantuan &amp; Kontak</Link>.
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

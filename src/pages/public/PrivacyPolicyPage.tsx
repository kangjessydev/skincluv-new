// src/pages/public/PrivacyPolicyPage.tsx
// Kebijakan Privasi Resmi Skincluv (100% Cluv Micro-Framework)
// Kepatuhan: UU Pelindungan Data Pribadi (UU PDP No. 27/2022) & Invarian 20 (Dual-track deletion lifecycle)
// Invarian: Invarian 4 (Right to be forgotten), Invarian 16 (Biometric isolation), Invarian 22 (Zero-runtime-parser)

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Lock, Trash2, EyeOff, Clock, ChevronRight, Database, List, X, HelpCircle
} from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const CLAUSES = [
  { id: 'data-dikumpulkan', num: '1', title: 'Jenis Data yang Dikumpulkan' },
  { id: 'tujuan-pemrosesan', num: '2', title: 'Dasar Hukum & Tujuan Pemrosesan' },
  { id: 'keamanan-penyimpanan', num: '3', title: 'Keamanan, Enkripsi, & Penyimpanan' },
  { id: 'pihak-ketiga', num: '4', title: 'Pihak Ketiga & Pemroses AI' },
  { id: 'hak-pengguna', num: '5', title: 'Hak-Hak Pemilik Data (UU PDP)' },
  { id: 'penghapusan-akun', num: '6', title: 'Siklus Penghapusan & Retensi' },
  { id: 'kontak-dpo', num: '7', title: 'Kontak Tim Pelindungan Data (DPO)' }
]

export default function PrivacyPolicyPage() {
  useScrollReveal()
  const [activeSection, setActiveSection] = useState('data-dikumpulkan')
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
              <ShieldCheck size={14} />
              <span>Kepatuhan UU PDP No. 27/2022</span>
            </div>
            <h1 className="cluv-title-hero cluv-mb-3">Kebijakan Privasi &amp; Perlindungan Data Biometrik</h1>
            <p className="cluv-lead cluv-mb-3">
              Standar tata kelola, pemrosesan, perlindungan data pribadi spesifik (data biometrik wajah), dan jaminan hak pengguna sesuai Undang-Undang Pelindungan Data Pribadi Republik Indonesia.
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

          {/* 4 CORE PRIVACY COMMITMENTS (GRID 2 KOLOM DI DESKTOP, 1 KOLOM DI MOBILE) */}
          <div className="cluv-grid cols-2 cluv-mb-6">
            <div className="cluv-card is-row is-compact">
              <div className="cluv-card-icon-wrap is-teal">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="cluv-title-card" style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>
                  Minimisasi Data Biometrik
                </h3>
                <p className="cluv-body cluv-text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
                  Foto wajah disimpan di storage tertutup (*private bucket*) dengan enkripsi dan hanya dapat diakses melalui URL bertanda tangan berwaktu singkat (*short-lived signed URL*).
                </p>
              </div>
            </div>

            <div className="cluv-card is-row is-compact">
              <div className="cluv-card-icon-wrap is-teal">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="cluv-title-card" style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>
                  Hak untuk Dihapus (*Right to be Forgotten*)
                </h3>
                <p className="cluv-body cluv-text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
                  Pengguna memiliki kendali penuh untuk menghapus rekam jejak scan wajah, riwayat percakapan, atau menghapus akun secara permanen melalui Pusat Privasi.
                </p>
              </div>
            </div>

            <div className="cluv-card is-row is-compact">
              <div className="cluv-card-icon-wrap is-teal">
                <EyeOff size={20} />
              </div>
              <div>
                <h3 className="cluv-title-card" style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>
                  Tanpa Penjualan Data ke Pihak Ketiga
                </h3>
                <p className="cluv-body cluv-text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
                  Data profil dan foto Anda tidak pernah diperjualbelikan kepada broker data, biro periklanan, atau pihak eksternal mana pun.
                </p>
              </div>
            </div>

            <div className="cluv-card is-row is-compact">
              <div className="cluv-card-icon-wrap is-teal">
                <Database size={20} />
              </div>
              <div>
                <h3 className="cluv-title-card" style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>
                  Pemisahan Transaksi Finansial
                </h3>
                <p className="cluv-body cluv-text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
                  Data transaksi kas Tripay dipisahkan dari data biometrik untuk kepatuhan hukum pembukuan tanpa menyimpan identitas pribadi sensitif.
                </p>
              </div>
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
                  <HelpCircle size={16} className="cluv-text-teal cluv-flex-shrink-0" style={{ marginTop: '2px' }} />
                  <p className="cluv-caption cluv-text-muted" style={{ lineHeight: 1.45 }}>
                    Ingin mengajukan hak privasi? Hubungi tim DPO kami di <Link to="/contact" className="cluv-text-teal cluv-font-bold">Kontak Resmi</Link>.
                  </p>
                </div>
              </div>
            </aside>

            {/* SISI KANAN: ARTIKEL DOKUMEN LENGKAP */}
            <article className="cluv-card cluv-doc-article">

              {/* Bagian 1 */}
              <section id="data-dikumpulkan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  1. Jenis Data Pribadi yang Dikumpulkan
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Dalam rangka menyediakan layanan komputasi kosmetik, Skincluv mengumpulkan kategori data berikut:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li>
                    <strong>Data Pribadi Umum:</strong> Alamat email, nama tampilan profil, dan preferensi tipe kulit pengguna yang diisi secara sukarela.
                  </li>
                  <li>
                    <strong>Data Pribadi Spesifik (Data Biometrik &amp; Observasi Kulit):</strong> Citra foto wajah yang diunggah untuk pemindaian AI. Berdasarkan <strong>Pasal 4 ayat (2) UU PDP No. 27/2022</strong>, data biometrik dan data kesehatan fisik diklasifikasikan sebagai data pribadi yang bersifat spesifik yang wajib mendapatkan standar keamanan ketat.
                  </li>
                  <li>
                    <strong>Data Transaksi Finansial:</strong> Catatan tagihan pembayaran dari Tripay Gateway (nomor referensi transaksi, metode pembayaran, nominal, dan status pembayaran). Kami <em>tidak pernah</em> mengumpulkan atau menyimpan nomor kartu kredit/debit atau PIN bank pengguna.
                  </li>
                  <li>
                    <strong>Data Teknis Telemetri:</strong> Alamat IP, jenis peramban, dan sistem operasi yang digunakan semata-mata untuk proteksi pencegahan penyalahgunaan API dan rate-limiting.
                  </li>
                </ul>
              </section>

              {/* Bagian 2 */}
              <section id="tujuan-pemrosesan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  2. Dasar Hukum &amp; Tujuan Pemrosesan Data
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Pemrosesan data pribadi Anda dilakukan berdasarkan <strong>persetujuan eksplisit (*explicit consent*)</strong> saat mendaftar dan mengunggah foto wajah, dengan tujuan terbatas untuk:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li>Mengekstraksi indikator visual kondisi kulit (kelembaban, kemerahan, sebum, dan pori-pori) melalui model visi komputer.</li>
                  <li>Memberikan rekomendasi bahan aktif skincare edukatif non-terapeutik yang relevan dengan tipe kulit Anda.</li>
                  <li>Mengelola saldo kuota Universal AI dan riwayat aktivasi paket pass 30 hari.</li>
                  <li>Menghasilkan grafik tren perkembangan kondisi kulit mandiri dalam jangka waktu 28 hari.</li>
                </ul>
              </section>

              {/* Bagian 3 */}
              <section id="keamanan-penyimpanan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  3. Keamanan, Enkripsi, &amp; Penyimpanan Data
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Kami menerapkan standar arsitektur keamanan *Zero-Trust*:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Enkripsi In-Transit &amp; At-Rest:</strong> Seluruh komunikasi jaringan menggunakan protokol TLS 1.3 dengan algoritma enkripsi SHA-256 / AES-256.</li>
                  <li><strong>Private Storage Bucket:</strong> Foto wajah fisik disimpan di dalam Supabase Cloud Storage dengan status akses tertutup (*private*). Foto tidak memiliki URL publik permanen dan hanya dapat diakses melalui URL bertanda tangan kriptografis (*signed URL*) berbatas waktu (maksimal 60 menit) yang diotorisasi khusus untuk akun pemiliknya.</li>
                  <li><strong>Row Level Security (RLS):</strong> Basis data PostgreSQL mengaktifkan RLS ketat di level baris tabel; pengguna lain atau peran Customer Support secara teknis tidak dapat mengueri foto atau hasil klinis Anda.</li>
                </ul>
              </section>

              {/* Bagian 4 */}
              <section id="pihak-ketiga" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  4. Keterlibatan Pihak Ketiga &amp; Pemroses AI
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Untuk menjalankan komputasi awan, Skincluv bekerja sama dengan mitra pemroses data terpercaya:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Penyedia Model AI (Google Cloud Vertex / Gemini &amp; OpenRouter):</strong> Foto wajah atau teks pertanyaan dikirimkan melalui saluran API terenkripsi semata-mata untuk inferensi analitik seketika. Berdasarkan perjanjian penyedia enterprise, data tidak digunakan untuk melatih model umum publik pihak ketiga.</li>
                  <li><strong>Penyedia Gerbang Pembayaran (Tripay):</strong> Untuk memproses verifikasi transaksi perbankan dan penerbitan kode QRIS / Virtual Account.</li>
                  <li><strong>Penyedia Pencarian Web Terverifikasi (Tavily Search):</strong> Hanya menerima kueri bahan aktif skincare dermatologi yang telah disanitasi dari kata ganti orang pertama demi privasi percakapan.</li>
                </ul>
              </section>

              {/* Bagian 5 */}
              <section id="hak-pengguna" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  5. Hak-Hak Pemilik Data Pribadi (UU PDP No. 27/2022)
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Sebagai subjek data, Anda memiliki hak penuh yang dijamin oleh undang-undang:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Hak Akses &amp; Portabilitas:</strong> Hak untuk melihat seluruh rekam jejak scan dan mengunduh salinan data profil Anda.</li>
                  <li><strong>Hak Penarikan Persetujuan (*Consent Withdrawal*):</strong> Anda dapat mematikan fitur memori asisten AI kapan saja melalui pengaturan chatbot, yang secara otomatis memicu penghapusan atomik memori percakapan.</li>
                  <li><strong>Hak Penghapusan Mandiri:</strong> Hak untuk menghapus riwayat foto scan wajah tertentu atau seluruh akun secara permanen.</li>
                </ul>
              </section>

              {/* Bagian 6 */}
              <section id="penghapusan-akun" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  6. Siklus Penghapusan Data &amp; Kebijakan Retensi Backup
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Sesuai prinsip kepatuhan hukum yang defensible:
                </p>
                <div className="cluv-card-note is-teal cluv-my-4">
                  <div className="cluv-flex-col cluv-gap-2">
                    <p className="cluv-font-bold">Mekanisme Dual-Track Penghapusan:</p>
                    <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ margin: 0, paddingLeft: '20px' }}>
                      <li><strong>Data Biometrik &amp; Observasi:</strong> Saat Anda menghapus akun atau menghapus riwayat scan, file fisik foto wajah di Cloud Storage, hasil ekstraksi fitur visual, riwayat chat, dan memori klinis akan <strong>dimusnahkan secara menyeluruh dari sistem operasional aktif</strong>.</li>
                      <li><strong>Catatan Transaksi Finansial:</strong> Untuk memenuhi kewajiban rekonsiliasi dan hukum perpajakan Republik Indonesia, catatan invoice kas Tripay tetap dipertahankan dengan menghapus referensi identitas personal pengguna (foreign key dialihkan menjadi <code>NULL</code>) sehingga tidak lagi terhubung dengan identitas Anda.</li>
                    </ul>
                  </div>
                </div>
                <p className="cluv-body">
                  <strong>Siklus Cadangan Terenkripsi (*Encrypted Backup Lifecycle*):</strong> Data aktif segera dihapus dari sistem operasional. Salinan cadangan (*disaster recovery snapshot*) yang terenkripsi akan terhapus secara alami mengikuti siklus retensi backup berkala (maksimal 30 hari) dan tidak pernah diproses kembali untuk operasional apa pun.
                </p>
              </section>

              {/* Bagian 7 */}
              <section id="kontak-dpo" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  7. Kontak Petugas Pelindungan Data (DPO)
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Apabila Anda memiliki pertanyaan, keberatan, atau ingin mengajukan permohonan hak atas data pribadi Anda, silakan hubungi tim kepatuhan privasi kami:
                </p>
                <div className="cluv-card-note cluv-my-4">
                  <div className="cluv-flex-col cluv-gap-1">
                    <p className="cluv-font-bold cluv-mb-1">Tim Pelindungan Data Pribadi Skincluv:</p>
                    <p className="cluv-body">Email: <code>privacy@skincluv.com</code> / <code>support@skincluv.com</code></p>
                    <p className="cluv-body">WhatsApp Dukungan: Melalui halaman <Link to="/contact" className="cluv-text-teal cluv-font-bold">Kontak Resmi</Link></p>
                    <p className="cluv-body">Waktu Respons: Maksimal 3 &times; 24 jam kerja sesuai ketentuan UU PDP.</p>
                  </div>
                </div>
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
                  <ShieldCheck size={18} className="cluv-text-teal" />
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
                  <HelpCircle size={16} className="cluv-text-teal cluv-flex-shrink-0" style={{ marginTop: '2px' }} />
                  <p className="cluv-caption cluv-text-muted" style={{ lineHeight: 1.45 }}>
                    Ingin mengajukan hak privasi? Hubungi tim DPO kami di <Link to="/contact" className="cluv-text-teal cluv-font-bold">Kontak Resmi</Link>.
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

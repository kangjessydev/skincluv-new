// src/pages/public/RefundPolicyPage.tsx
// Kebijakan Pengembalian Dana & Pembatalan Transaksi Skincluv (100% Cluv Micro-Framework)
// Kepatuhan: UU Perlindungan Konsumen No. 8/1999 & Standar Merchant Tripay Payment Gateway
// Invarian: Invarian 17 (Dual-track accounting), Invarian 18 (Pricing integrity), Invarian 22 (Zero-runtime-parser)

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  RotateCcw, Clock, ChevronRight, HelpCircle, ShieldCheck, ChevronDown, List, X
} from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const CLAUSES = [
  { id: 'definisi', num: '1', title: 'Definisi Produk Digital' },
  { id: 'wajib-refund', num: '2', title: 'Kondisi Wajib Refund Penuh' },
  { id: 'non-refundable', num: '3', title: 'Ketentuan Non-Refundable' },
  { id: 'tripay', num: '4', title: 'Rekonsiliasi Gangguan Tripay' },
  { id: 'prosedur', num: '5', title: 'Prosedur Klaim & SLA' },
  { id: 'force-majeure', num: '6', title: 'Force Majeure & Kompensasi' },
  { id: 'perubahan', num: '7', title: 'Keabsahan & Pembaruan Non-Retroaktif' }
]

export default function RefundPolicyPage() {
  useScrollReveal()
  const [activeSection, setActiveSection] = useState('definisi')
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
              <RotateCcw size={14} />
              <span>Standar Transaksi &amp; Konsumen Tripay</span>
            </div>
            <h1 className="cluv-title-hero cluv-mb-3">Kebijakan Pengembalian Dana &amp; Pembatalan Transaksi</h1>
            <p className="cluv-lead cluv-mb-3">
              Transparansi hak konsumen dan tata kelola pengembalian dana (*refund*) transaksi digital sesuai UU Perlindungan Konsumen No. 8/1999 dan standar gerbang pembayaran resmi.
            </p>
            <div className="cluv-meta-bar cluv-mb-5">
              <div className="cluv-meta-item">
                <Clock size={14} />
                <span>Terakhir diperbarui: 28 September 2026</span>
              </div>
              <div className="cluv-meta-item">
                <ShieldCheck size={14} />
                <span>Berlaku untuk seluruh transaksi Tripay</span>
              </div>
            </div>
          </header>

          {/* SUMMARY NOTICE (COLLAPSIBLE DI MOBILE, LENGKAP DI DESKTOP) */}
          <div className={`cluv-alert is-info is-collapsible ${alertExpanded ? 'is-expanded' : 'is-collapsed'} cluv-mb-6`}>
            <ShieldCheck size={22} className="cluv-alert-icon" />
            <div className="cluv-alert-content">
              <div className="cluv-alert-header">
                <div className="cluv-alert-title" style={{ fontSize: '0.9375rem', margin: 0 }}>
                  Prinsip Dasar Transaksi Skincluv
                </div>
                <button
                  type="button"
                  className="cluv-alert-toggle-btn"
                  onClick={() => setAlertExpanded(!alertExpanded)}
                  aria-expanded={alertExpanded}
                  aria-label={alertExpanded ? 'Tutup rincian transaksi' : 'Lihat rincian transaksi'}
                >
                  <span>{alertExpanded ? 'Tutup' : 'Detail'}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
              <p className="cluv-alert-message cluv-mt-2" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                Skincluv menggunakan sistem <strong>Prepaid 30-Day Access Pass</strong> (sekali bayar tanpa auto-debit). Kami menjamin pengembalian dana 100% jika terjadi kesalahan teknis sistem atau pemotongan ganda. Kuota yang telah aktif dan digunakan secara sadar tidak dapat diuangkan kembali.
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
                  <HelpCircle size={16} className="cluv-text-teal cluv-flex-shrink-0" style={{ marginTop: '2px' }} />
                  <p className="cluv-caption cluv-text-muted" style={{ lineHeight: 1.45 }}>
                    Mengalami kendala tagihan? Hubungi WhatsApp Layanan Pelanggan kami di menu <Link to="/contact" className="cluv-text-teal cluv-font-bold">Kontak</Link>.
                  </p>
                </div>
              </div>
            </aside>

            {/* SISI KANAN: ARTIKEL DOKUMEN LENGKAP */}
            <article className="cluv-card cluv-doc-article">

              {/* Klausul 1 */}
              <section id="definisi" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  1. Definisi &amp; Karakteristik Produk Digital
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Layanan berbayar pada platform Skincluv disediakan dalam bentuk <strong>Prepaid 30-Day Access Pass</strong> (Paket Skincluv GLOW dan Skincluv PRO).
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Sifat Pengaktifan Instan:</strong> Paket akses dan kuota Universal AI diaktifkan secara otomatis ke akun pengguna segera setelah konfirmasi notifikasi pembayaran (*webhook callback*) diterima dari gerbang pembayaran Tripay.</li>
                  <li><strong>Tanpa Penarikan Otomatis (*No Auto-Debit*):</strong> Skincluv tidak menyimpan nomor kartu debit/kredit pengguna dan tidak melakukan pemotongan saldo berkala secara otomatis. Setiap transaksi pembelian pass dilakukan atas keputusan sadar pengguna secara mandiri.</li>
                </ul>
              </section>

              {/* Klausul 2 */}
              <section id="wajib-refund" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  2. Kondisi WAJIB Pengembalian Dana Penuh (*Eligible Refund*)
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Berdasarkan <strong>Undang-Undang Perlindungan Konsumen No. 8 Tahun 1999</strong>, Skincluv berkomitmen menjamin hak konsumen atas keandalan transaksi. Kami wajib memproses pengembalian dana 100% penuh dalam waktu maksimal <strong>3 &times; 24 jam kerja</strong> apabila memenuhi salah satu kondisi berikut:
                </p>
                <div className="cluv-card-note is-teal cluv-my-4">
                  <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ margin: 0, paddingLeft: '20px' }}>
                    <li><strong>Pemotongan Ganda (*Double Charge*):</strong> Pengguna terdebit lebih dari satu kali untuk nomor referensi transaksi atau invoice yang sama akibat keterlambatan respons jaringan perbankan.</li>
                    <li><strong>Entitlement Gagal Terbit:</strong> Pembayaran telah berstatus sukses terbayar (*PAID*) pada Tripay, namun kuota pass tidak masuk ke akun pengguna setelah 1 &times; 24 jam dan tim teknis tidak dapat mengaktifkannya secara manual.</li>
                    <li><strong>Gangguan Sistem Internal Kritis:</strong> Terjadi kegagalan infrastruktur server Skincluv yang membuat seluruh fitur utama tidak dapat diakses sama sekali selama lebih dari 24 jam berturut-turut pada hari pertama aktivasi pass.</li>
                    <li><strong>Transaksi Tidak Diotorisasi (*Fraudulent Transaction*):</strong> Terbukti terjadi penyalahgunaan instrumen pembayaran oleh pihak ketiga tanpa persetujuan sah pemilik rekening/e-wallet, disertai laporan kepolisian resmi atau sanggahan bank penerbit.</li>
                  </ul>
                </div>
              </section>

              {/* Klausul 3 */}
              <section id="non-refundable" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  3. Ketentuan Pembelian Final (*Non-Refundable Condition*)
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Mengingat produk digital Skincluv berupa komputasi AI server bernilai langsung yang mengonsumsi biaya pemrosesan API seketika:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Perubahan Keputusan (*Change of Mind*):</strong> Pembelian yang telah aktif dan telah digunakan untuk melakukan pemindaian (Scan Wajah atau Cek Ingredient) tidak dapat dibatalkan atau dikembalikan dengan alasan berubah pikiran.</li>
                  <li><strong>Ketidaksesuaian Ekspektasi Subjektif:</strong> Pengembalian dana tidak berlaku jika pengguna tidak menyukai warna antarmuka, mengharapkan diagnosis resep obat klinis (yang secara tegas dilarang oleh Penyangkalan Medis), atau salah memilih paket.</li>
                  <li><strong>Kedaluwarsa Kuota Wajar:</strong> Sisa kuota Universal AI yang belum terpakai pada akhir periode 30 hari akan hangus secara wajar dan tidak dapat diakumulasikan atau diuangkan kembali.</li>
                </ul>
              </section>

              {/* Klausul 4 */}
              <section id="tripay" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  4. Rekonsiliasi Gangguan Gerbang Pembayaran Tripay
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Seluruh transaksi diproses melalui PT Trikarya Pratama Sukses (Tripay) yang berizin resmi Bank Indonesia:
                </p>
                <ul className="cluv-body cluv-flex-col cluv-gap-2" style={{ paddingLeft: '20px' }}>
                  <li><strong>Tagihan Kedaluwarsa (*Expired Invoice*):</strong> Apabila pengguna melakukan transfer setelah batas waktu masa berlaku invoice habis (melebihi 24 jam), dana tidak akan otomatis masuk ke sistem Skincluv. Dana tersebut tertahan di escrow perbankan dan akan dikembalikan oleh sistem rekonsiliasi Tripay ke sumber rekening pengirim.</li>
                  <li><strong>Nominal Salah:</strong> Transfer dengan nominal yang tidak sesuai kode unik pembayaran akan gagal terverifikasi secara otomatis. Pengguna wajib melampirkan mutasi bank ke CS Tripay/Skincluv untuk pencocokan manual.</li>
                </ul>
              </section>

              {/* Klausul 5 */}
              <section id="prosedur" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  5. Prosedur Pengajuan Sengketa &amp; Standar SLA
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Untuk mengajukan permohonan pengembalian dana atau melaporkan kendala transaksi:
                </p>
                <ol className="cluv-body cluv-flex-col cluv-gap-3" style={{ paddingLeft: '20px' }}>
                  <li>
                    <strong>Hubungi Kanal Resmi:</strong> Kirimkan pengaduan melalui WhatsApp Customer Support Resmi Skincluv atau email ke <code>support@skincluv.com</code> paling lambat <strong>7 (tujuh) hari kalender</strong> sejak tanggal transaksi.
                  </li>
                  <li>
                    <strong>Lampirkan Bukti Valid:</strong>
                    <ul className="cluv-mt-1 cluv-flex-col cluv-gap-1" style={{ paddingLeft: '20px' }}>
                      <li>Nomor Referensi Transaksi (contoh: <code>INV-1727...-ABCD</code> atau nomor referensi Tripay <code>DEV-T...</code>).</li>
                      <li>Alamat email akun Skincluv yang terdaftar.</li>
                      <li>Bukti transfer bank / bukti transaksi e-wallet resmi yang memuat tanggal, waktu, dan nomor transaksi.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Verifikasi &amp; Pencairan:</strong> Tim Keuangan Skincluv akan melakukan investigasi dalam waktu <strong>1 &times; 24 jam kerja</strong>. Jika disetujui, dana akan dikembalikan ke nomor rekening/e-wallet pengirim dalam waktu <strong>3 &times; 24 jam kerja</strong> tanpa potongan biaya administrasi internal Skincluv.
                  </li>
                </ol>
              </section>

              {/* Klausul 6 */}
              <section id="force-majeure" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  6. Keadaan Memaksa (*Force Majeure*) &amp; Kompensasi Masa Aktif
                </h2>
                <p className="cluv-body cluv-mb-3">
                  Apabila terjadi gangguan layanan berskala nasional di luar kendali wajar para pihak (termasuk putusnya kabel serat optik bawah laut internasional, pemadaman listrik massal, atau kebijakan darurat telekomunikasi pemerintah):
                </p>
                <p className="cluv-body">
                  Skincluv akan memberikan <strong>kompensasi berupa perpanjangan durasi masa aktif paket pass</strong> secara proporsional dengan durasi gangguan teknis yang dialami pengguna, sebagai pengganti pengembalian dana tunai.
                </p>
              </section>

              {/* Klausul 7 */}
              <section id="perubahan" className="cluv-doc-section">
                <h2 className="cluv-title-card cluv-mb-3">
                  7. Keabsahan &amp; Pembaruan Kebijakan Non-Retroaktif
                </h2>
                <p className="cluv-body">
                  Kebijakan pengembalian dana ini dapat diperbarui sewaktu-waktu demi mengikuti ketentuan regulasi sistem pembayaran Bank Indonesia. Pembaruan klausul tidak berlaku surut (*non-retroactive*) terhadap transaksi yang telah diselesaikan sebelum tanggal pembaruan diumumkan.
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
                  <RotateCcw size={18} className="cluv-text-teal" />
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
                    Mengalami kendala tagihan? Hubungi WhatsApp Layanan Pelanggan kami di menu <Link to="/contact" className="cluv-text-teal cluv-font-bold">Kontak</Link>.
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

// src/pages/public/RefundPolicyPage.tsx
// Kebijakan Pengembalian Dana & Pembatalan Transaksi Skincluv
// Kepatuhan: UU Perlindungan Konsumen No. 8/1999 & Standar Merchant Tripay Payment Gateway
// Optimasi: DeepSeek 5-Layer Performance (Static TSX + content-visibility + Sticky Anchor TOC)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Clock, CheckCircle2, AlertCircle, ChevronRight, HelpCircle, CreditCard, ShieldCheck } from 'lucide-react'
import '@/styles/legal-docs.css'

export default function RefundPolicyPage() {
  const [activeSection, setActiveSection] = useState('definisi')

  const scrollTo = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="legal-doc-page animate-fade-in">
      <div className="legal-doc-container">
        {/* HEADER DOKUMEN */}
        <header className="legal-doc-header">
          <div className="doc-meta-badge">
            <RotateCcw size={14} /> STANDAR TRANSAKSI &amp; KONSUMEN TRIPAY
          </div>
          <h1>Kebijakan Pengembalian Dana &amp; Pembatalan Transaksi</h1>
          <p className="doc-subtitle">
            Transparansi hak konsumen dan tata kelola pengembalian dana (*refund*) transaksi digital sesuai UU Perlindungan Konsumen No. 8/1999 dan standar gerbang pembayaran resmi.
          </p>
          <div className="doc-effective-date">
            <Clock size={14} /> Terakhir diperbarui: 28 September 2026 • Berlaku untuk seluruh transaksi Tripay
          </div>
        </header>

        {/* SUMMARY NOTICE */}
        <div className="summary-notice-box">
          <div className="notice-icon-wrap">
            <ShieldCheck size={24} />
          </div>
          <div className="notice-text-wrap">
            <h4>Prinsip Dasar Transaksi Skincluv</h4>
            <p>
              Skincluv menggunakan sistem <strong>Prepaid 30-Day Access Pass</strong> (sekali bayar tanpa auto-debit). Kami menjamin pengembalian dana 100% jika terjadi kesalahan teknis sistem atau pemotongan ganda. Kuota yang telah aktif dan digunakan secara sadar tidak dapat diuangkan kembali.
            </p>
          </div>
        </div>

        {/* GRID DOKUMEN DENGAN STICKY TOC */}
        <div className="legal-content-grid">
          {/* SISI KIRI: STICKY TOC */}
          <aside className="legal-sidebar">
            <div className="sticky-toc-box">
              <h3>Daftar Klausul</h3>
              <nav className="toc-nav">
                <button
                  className={`toc-link ${activeSection === 'definisi' ? 'active' : ''}`}
                  onClick={() => scrollTo('definisi')}
                >
                  <ChevronRight size={14} /> 1. Definisi Produk Digital
                </button>
                <button
                  className={`toc-link ${activeSection === 'wajib-refund' ? 'active' : ''}`}
                  onClick={() => scrollTo('wajib-refund')}
                >
                  <ChevronRight size={14} /> 2. Kondisi Wajib Refund
                </button>
                <button
                  className={`toc-link ${activeSection === 'non-refundable' ? 'active' : ''}`}
                  onClick={() => scrollTo('non-refundable')}
                >
                  <ChevronRight size={14} /> 3. Ketentuan Non-Refundable
                </button>
                <button
                  className={`toc-link ${activeSection === 'tripay' ? 'active' : ''}`}
                  onClick={() => scrollTo('tripay')}
                >
                  <ChevronRight size={14} /> 4. Kegagalan Gateway Tripay
                </button>
                <button
                  className={`toc-link ${activeSection === 'prosedur' ? 'active' : ''}`}
                  onClick={() => scrollTo('prosedur')}
                >
                  <ChevronRight size={14} /> 5. Prosedur Klaim &amp; SLA
                </button>
                <button
                  className={`toc-link ${activeSection === 'force-majeure' ? 'active' : ''}`}
                  onClick={() => scrollTo('force-majeure')}
                >
                  <ChevronRight size={14} /> 6. Force Majeure &amp; Kompensasi
                </button>
                <button
                  className={`toc-link ${activeSection === 'perubahan' ? 'active' : ''}`}
                  onClick={() => scrollTo('perubahan')}
                >
                  <ChevronRight size={14} /> 7. Keabsahan Kebijakan
                </button>
              </nav>

              <div className="toc-footer-card">
                <HelpCircle size={18} className="text-primary mb-1" />
                <p>Mengalami kendala tagihan? Hubungi WhatsApp Layanan Pelanggan kami di menu <Link to="/contact">Kontak</Link>.</p>
              </div>
            </div>
          </aside>

          {/* SISI KANAN: ISI DOKUMEN LENGKAP */}
          <article className="legal-article-body">
            {/* Klausul 1 */}
            <section id="definisi" className="legal-clause-block">
              <h2>1. Definisi &amp; Karakteristik Produk Digital</h2>
              <p>
                Layanan berbayar pada platform Skincluv disediakan dalam bentuk <strong>Prepaid 30-Day Access Pass</strong> (Paket Skincluv GLOW dan Skincluv PRO).
              </p>
              <ul>
                <li><strong>Sifat Pengaktifan Instan:</strong> Paket akses dan kuota Universal AI diaktifkan secara otomatis ke akun pengguna segera setelah konfirmasi notifikasi pembayaran (*webhook callback*) diterima dari gerbang pembayaran Tripay.</li>
                <li><strong>Tanpa Penarikan Otomatis (*No Auto-Debit*):</strong> Skincluv tidak menyimpan nomor kartu debit/kredit pengguna dan tidak melakukan pemotongan saldo berkala secara otomatis. Setiap transaksi pembelian pass dilakukan atas keputusan sadar pengguna secara mandiri.</li>
              </ul>
            </section>

            {/* Klausul 2 */}
            <section id="wajib-refund" className="legal-clause-block">
              <h2>2. Kondisi WAJIB Pengembalian Dana Penuh (*Eligible Refund*)</h2>
              <p>
                Berdasarkan <strong>Undang-Undang Perlindungan Konsumen No. 8 Tahun 1999</strong>, Skincluv berkomitmen menjamin hak konsumen atas keandalan transaksi. Kami wajib memproses pengembalian dana 100% penuh dalam waktu maksimal <strong>3 &times; 24 jam kerja</strong> apabila memenuhi salah satu kondisi berikut:
              </p>
              <div className="clause-highlight-box">
                <ul>
                  <li><strong>Pemotongan Ganda (*Double Charge*):</strong> Pengguna terdebit lebih dari satu kali untuk nomor referensi transaksi atau invoice yang sama akibat keterlambatan respons jaringan perbankan.</li>
                  <li><strong>Entitlement Gagal Terbit:</strong> Pembayaran telah berstatus sukses terbayar (*PAID*) pada Tripay, namun kuota pass tidak masuk ke akun pengguna setelah 1 &times; 24 jam dan tim teknis tidak dapat mengaktifkannya secara manual.</li>
                  <li><strong>Gangguan Sistem Internal Kritis:</strong> Terjadi kegagalan infrastruktur server Skincluv yang membuat seluruh fitur utama tidak dapat diakses sama sekali selama lebih dari 24 jam berturut-turut pada hari pertama aktivasi pass.</li>
                  <li><strong>Transaksi Tidak Diotorisasi (*Fraudulent Transaction*):</strong> Terbukti terjadi penyalahgunaan instrumen pembayaran oleh pihak ketiga tanpa persetujuan sah pemilik rekening/e-wallet, disertai laporan kepolisian resmi atau sanggahan bank penerbit.</li>
                </ul>
              </div>
            </section>

            {/* Klausul 3 */}
            <section id="non-refundable" className="legal-clause-block">
              <h2>3. Ketentuan Pembelian Final (*Non-Refundable Condition*)</h2>
              <p>
                Mengingat produk digital Skincluv berupa komputasi AI server bernilai langsung yang mengonsumsi biaya pemrosesan API seketika:
              </p>
              <ul>
                <li><strong>Perubahan Keputusan (*Change of Mind*):</strong> Pembelian yang telah aktif dan telah digunakan untuk melakukan pemindaian (Scan Wajah atau Cek Ingredient) tidak dapat dibatalkan atau dikembalikan dengan alasan berubah pikiran.</li>
                <li><strong>Ketidaksesuaian Ekspektasi Subjektif:</strong> Pengembalian dana tidak berlaku jika pengguna tidak menyukai warna antarmuka, mengharapkan diagnosis resep obat klinis (yang secara tegas dilarang oleh Penyangkalan Medis), atau salah memilih paket.</li>
                <li><strong>Kedaluwarsa Kuota Wajar:</strong> Sisa kuota Universal AI yang belum terpakai pada akhir periode 30 hari akan hangus secara wajar dan tidak dapat diakumulasikan atau diuangkan kembali.</li>
              </ul>
            </section>

            {/* Klausul 4 */}
            <section id="tripay" className="legal-clause-block">
              <h2>4. Rekonsiliasi Gangguan Gerbang Pembayaran Tripay</h2>
              <p>
                Seluruh transaksi diproses melalui PT Trikarya Pratama Sukses (Tripay) yang berizin resmi Bank Indonesia:
              </p>
              <ul>
                <li><strong>Tagihan Kedaluwarsa (*Expired Invoice*):</strong> Apabila pengguna melakukan transfer setelah batas waktu masa berlaku invoice habis (melebihi 24 jam), dana tidak akan otomatis masuk ke sistem Skincluv. Dana tersebut tertahan di escrow perbankan dan akan dikembalikan oleh sistem rekonsiliasi Tripay ke sumber rekening pengirim.</li>
                <li><strong>Nominal Salah:</strong> Transfer dengan nominal yang tidak sesuai kode unik pembayaran akan gagal terverifikasi secara otomatis. Pengguna wajib melampirkan mutasi bank ke CS Tripay/Skincluv untuk pencocokan manual.</li>
              </ul>
            </section>

            {/* Klausul 5 */}
            <section id="prosedur" className="legal-clause-block">
              <h2>5. Prosedur Pengajuan Sengketa &amp; Standar SLA</h2>
              <p>
                Untuk mengajukan permohonan pengembalian dana atau melaporkan kendala transaksi:
              </p>
              <ol className="styled-order-list">
                <li>
                  <strong>Hubungi Kanal Resmi:</strong> Kirimkan pengaduan melalui WhatsApp Customer Support Resmi Skincluv atau email ke <code>support@skincluv.com</code> paling lambat <strong>7 (tujuh) hari kalender</strong> sejak tanggal transaksi.
                </li>
                <li>
                  <strong>Lampirkan Bukti Valid:</strong>
                  <ul>
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
            <section id="force-majeure" className="legal-clause-block">
              <h2>6. Keadaan Memaksa (*Force Majeure*) &amp; Kompensasi Masa Aktif</h2>
              <p>
                Apabila terjadi gangguan layanan berskala nasional di luar kendali wajar para pihak (termasuk putusnya kabel serat optik bawah laut internasional, pemadaman listrik massal, atau kebijakan darurat telekomunikasi pemerintah):
              </p>
              <p>
                Skincluv akan memberikan <strong>kompensasi berupa perpanjangan durasi masa aktif paket pass</strong> secara proporsional dengan durasi gangguan teknis yang dialami pengguna, sebagai pengganti pengembalian dana tunai.
              </p>
            </section>

            {/* Klausul 7 */}
            <section id="perubahan" className="legal-clause-block">
              <h2>7. Pembaruan Kebijakan Non-Retroaktif</h2>
              <p>
                Kebijakan pengembalian dana ini dapat diperbarui sewaktu-waktu demi mengikuti ketentuan regulasi sistem pembayaran Bank Indonesia. Pembaruan klausul tidak berlaku surut (*non-retroactive*) terhadap transaksi yang telah diselesaikan sebelum tanggal pembaruan diumumkan.
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  )
}

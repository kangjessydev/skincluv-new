// src/pages/public/RefundPolicyPage.tsx
// Kebijakan Pengembalian Dana & Pembatalan Transaksi Skincluv
// Kepatuhan: UU Perlindungan Konsumen No. 8/1999 & Standar Merchant Tripay Payment Gateway
// Optimasi: DeepSeek 5-Layer Performance (Static TSX + content-visibility + Sticky Anchor TOC)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Clock, CheckCircle2, AlertCircle, ChevronRight, HelpCircle, CreditCard, ShieldCheck } from 'lucide-react'

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

      {/* STYLING VANILLA CSS */}
      <style>{`
        .legal-doc-page {
          padding: 48px 0 80px;
          background: var(--color-surface-bg, #f8fafc);
          min-height: calc(100vh - 64px);
        }

        .legal-doc-container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 var(--space-lg, 24px);
        }

        .legal-doc-header {
          margin-bottom: 32px;
        }

        .doc-meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #0284c7;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          padding: 4px 12px;
          border-radius: var(--radius-full, 9999px);
          margin-bottom: 12px;
        }

        .legal-doc-header h1 {
          font-family: var(--font-heading, sans-serif);
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          line-height: 1.2;
          margin: 0 0 12px 0;
        }

        .doc-subtitle {
          font-size: 1rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.6;
          max-width: 820px;
          margin: 0 0 16px 0;
        }

        .doc-effective-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .summary-notice-box {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-left: 5px solid #16a34a;
          border-radius: var(--radius-lg, 12px);
          padding: 20px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.05);
        }

        .notice-icon-wrap {
          color: #16a34a;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notice-text-wrap h4 {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #166534;
          margin: 0 0 6px 0;
        }

        .notice-text-wrap p {
          font-size: 0.875rem;
          color: #14532d;
          line-height: 1.5;
          margin: 0;
        }

        .legal-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: start;
        }

        @media (min-width: 860px) {
          .legal-content-grid {
            grid-template-columns: 280px 1fr;
          }
        }

        .legal-sidebar {
          position: sticky;
          top: 84px;
        }

        .sticky-toc-box {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .sticky-toc-box h3 {
          font-size: 0.875rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 14px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #f1f5f9;
        }

        .toc-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toc-link {
          background: transparent;
          border: none;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
          padding: 8px 10px;
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
        }

        .toc-link:hover {
          color: var(--color-primary, #0f6784);
          background: #f0f9ff;
        }

        .toc-link.active {
          color: var(--color-primary, #0f6784);
          background: #e0f2fe;
          font-weight: 700;
        }

        .toc-footer-card {
          margin-top: 20px;
          padding: 12px;
          background: #f8fafc;
          border-radius: var(--radius-md, 8px);
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.4;
        }

        .legal-article-body {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 32px var(--space-xl, 32px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        @media (min-width: 768px) {
          .legal-article-body {
            padding: 40px 48px;
          }
        }

        .legal-clause-block {
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid #f1f5f9;
          content-visibility: auto;
          contain-intrinsic-size: 0 350px;
        }

        .legal-clause-block:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .legal-clause-block h2 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-primary, #0f6784);
          margin: 0 0 16px 0;
          scroll-margin-top: 90px;
        }

        .legal-clause-block p {
          font-size: 0.9375rem;
          color: var(--color-text-main, #334155);
          line-height: 1.7;
          margin: 0 0 16px 0;
        }

        .legal-clause-block ul {
          margin: 0 0 16px 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .legal-clause-block li {
          font-size: 0.9375rem;
          color: var(--color-text-main, #334155);
          line-height: 1.6;
        }

        .clause-highlight-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-md, 8px);
          padding: 16px 20px;
          margin-bottom: 16px;
        }

        .clause-highlight-box ul {
          margin-bottom: 0;
        }

        .styled-order-list {
          margin: 0 0 16px 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .styled-order-list li {
          font-size: 0.9375rem;
          color: var(--color-text-main, #334155);
          line-height: 1.6;
        }

        .styled-order-list code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8125rem;
          color: #0f172a;
        }
      `}</style>
    </div>
  )
}

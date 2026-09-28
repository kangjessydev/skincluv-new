// src/pages/public/TermsPage.tsx
// Syarat dan Ketentuan Layanan Resmi Skincluv
// Kepatuhan: UU ITE, UU Perlindungan Konsumen No. 8/1999, Invarian 18, 19, 20
// Optimasi: DeepSeek 5-Layer Performance (Static TSX + content-visibility + Sticky Anchor TOC)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, ChevronRight, ShieldCheck, AlertCircle, Scale } from 'lucide-react'

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('penerimaan')

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
        {/* HEADER */}
        <header className="legal-doc-header">
          <div className="doc-meta-badge">
            <Scale size={14} /> DOKUMEN PERJANJIAN PENGGUNA
          </div>
          <h1>Syarat dan Ketentuan Layanan</h1>
          <p className="doc-subtitle">
            Perjanjian hukum yang mengikat antara Anda sebagai pengguna dengan pengembang platform Skincluv terkait akses, fitur komputasi AI, sistem pembayaran, dan batasan tanggung jawab.
          </p>
          <div className="doc-effective-date">
            <Clock size={14} /> Terakhir diperbarui: 28 September 2026 • Berlaku untuk seluruh pengguna Skincluv
          </div>
        </header>

        {/* MEDICAL SUMMARY BANNER */}
        <div className="terms-summary-banner">
          <AlertCircle size={20} className="banner-icon" />
          <p>
            <strong>Pemberitahuan Non-Terapeutik:</strong> Skincluv adalah software edukasi kosmetik berbasis AI, bukan fasilitas kesehatan dan bukan penyedia telemedisin klinis. Seluruh hasil analisis BUKAN diagnosis medis. Baca selengkapnya di <Link to="/medical-disclaimer">Penyangkalan Medis Resmi</Link>.
          </p>
        </div>

        {/* CONTENT GRID */}
        <div className="legal-content-grid">
          {/* SIDEBAR TOC */}
          <aside className="legal-sidebar">
            <div className="sticky-toc-box">
              <h3>Daftar Bagian</h3>
              <nav className="toc-nav">
                <button
                  className={`toc-link ${activeSection === 'penerimaan' ? 'active' : ''}`}
                  onClick={() => scrollTo('penerimaan')}
                >
                  <ChevronRight size={14} /> 1. Penerimaan Ketentuan
                </button>
                <button
                  className={`toc-link ${activeSection === 'kelayakan' ? 'active' : ''}`}
                  onClick={() => scrollTo('kelayakan')}
                >
                  <ChevronRight size={14} /> 2. Kelayakan &amp; Akun
                </button>
                <button
                  className={`toc-link ${activeSection === 'layanan-ai' ? 'active' : ''}`}
                  onClick={() => scrollTo('layanan-ai')}
                >
                  <ChevronRight size={14} /> 3. Karakteristik Layanan AI
                </button>
                <button
                  className={`toc-link ${activeSection === 'kuota-pembayaran' ? 'active' : ''}`}
                  onClick={() => scrollTo('kuota-pembayaran')}
                >
                  <ChevronRight size={14} /> 4. Kuota &amp; Pembayaran Tripay
                </button>
                <button
                  className={`toc-link ${activeSection === 'larangan' ? 'active' : ''}`}
                  onClick={() => scrollTo('larangan')}
                >
                  <ChevronRight size={14} /> 5. Batasan Penggunaan
                </button>
                <button
                  className={`toc-link ${activeSection === 'kekayaan-intelektual' ? 'active' : ''}`}
                  onClick={() => scrollTo('kekayaan-intelektual')}
                >
                  <ChevronRight size={14} /> 6. Hak Kekayaan Intelektual
                </button>
                <button
                  className={`toc-link ${activeSection === 'tanggung-jawab' ? 'active' : ''}`}
                  onClick={() => scrollTo('tanggung-jawab')}
                >
                  <ChevronRight size={14} /> 7. Batasan Tanggung Jawab
                </button>
                <button
                  className={`toc-link ${activeSection === 'hukum' ? 'active' : ''}`}
                  onClick={() => scrollTo('hukum')}
                >
                  <ChevronRight size={14} /> 8. Hukum &amp; Penyelesaian Sengketa
                </button>
              </nav>
            </div>
          </aside>

          {/* ARTICLE BODY */}
          <article className="legal-article-body">
            {/* Bagian 1 */}
            <section id="penerimaan" className="legal-clause-block">
              <h2>1. Penerimaan Ketentuan Layanan</h2>
              <p>
                Dengan mengakses, mendaftar, menggunakan situs web, atau memanfaatkan API Skincluv, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat secara hukum oleh Syarat dan Ketentuan ini serta Kebijakan Privasi kami.
              </p>
              <p>
                Apabila Anda tidak menyetujui salah satu butir ketentuan dalam dokumen ini, Anda tidak diperkenankan untuk mengakses atau menggunakan layanan Skincluv lebih lanjut.
              </p>
            </section>

            {/* Bagian 2 */}
            <section id="kelayakan" className="legal-clause-block">
              <h2>2. Kelayakan Pengguna &amp; Keamanan Akun</h2>
              <ul>
                <li><strong>Batasan Usia:</strong> Anda menyatakan bahwa Anda telah berusia minimal 17 (tujuh belas) tahun atau telah berada di bawah bimbingan dan izin sah dari orang tua/wali hukum.</li>
                <li><strong>Kerahasiaan Kredensial:</strong> Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan token autentikasi akun Anda. Segala tindakan atau transaksi yang dilakukan melalui akun Anda dianggap sebagai tindakan sah Anda.</li>
                <li><strong>Kebenaran Data:</strong> Anda wajib memberikan informasi email yang valid dan aktif untuk keperluan verifikasi autentikasi serta pengiriman bukti tagihan pembayaran.</li>
              </ul>
            </section>

            {/* Bagian 3 */}
            <section id="layanan-ai" className="legal-clause-block">
              <h2>3. Karakteristik Layanan Analitik Kecerdasan Buatan</h2>
              <p>
                Skincluv memanfaatkan model komputasi kecerdasan buatan (*Large Language Models* dan algoritma visi komputer) untuk memproses observasi visual kondisi kulit dan kandungan kosmetik.
              </p>
              <ul>
                <li><strong>Sifat Estimasi:</strong> Hasil pemindaian (Scan Wajah &amp; Cek Ingredient) bersifat komputasi estimatif probabilistik untuk tujuan edukasi perawatan preventif.</li>
                <li><strong>Penolakan Status Medis:</strong> Skincluv secara mutlak bukan merupakan alat diagnostik medis, bukan fasilitas telemedisin klinis, dan dilarang digunakan untuk mengobati penyakit kulit klinis akut. Ketentuan lengkap diatur dalam <Link to="/medical-disclaimer">Penyangkalan Medis</Link>.</li>
                <li><strong>Idempotensi Pemindaian:</strong> Untuk melindungi kuota pengguna, sistem menerapkan hashing kanonikal SHA-256 pada foto yang identik dalam kurun waktu 48 jam sehingga tidak memotong kuota ganda secara keliru.</li>
              </ul>
            </section>

            {/* Bagian 4 */}
            <section id="kuota-pembayaran" className="legal-clause-block">
              <h2>4. Kuota, Paket Langganan, &amp; Pembayaran Gerbang Tripay</h2>
              <p>
                Model komersial Skincluv beroperasi dengan skema <strong>Prepaid 30-Day Access Pass</strong>:
              </p>
              <ul>
                <li><strong>Tanpa Penagihan Otomatis:</strong> Tidak ada skema *auto-debit* berkala. Pengguna hanya membayar satu kali untuk mendapatkan masa aktif 30 hari dan kuota Universal AI yang bersangkutan.</li>
                <li><strong>Gerbang Pembayaran Resmi:</strong> Pembayaran diproses melalui PT Trikarya Pratama Sukses (Tripay Payment Gateway) yang terdaftar dan diawasi oleh Bank Indonesia. Saluran pembayaran mencakup QRIS, Virtual Account, Minimarket, dan E-Wallet.</li>
                <li><strong>Kebijakan Pengembalian Dana:</strong> Ketentuan mengenai pengembalian dana penuh akibat kegagalan sistem, pemotongan ganda, serta batasan produk digital diatur secara khusus dalam <Link to="/refund-policy">Kebijakan Pengembalian Dana</Link>.</li>
              </ul>
            </section>

            {/* Bagian 5 */}
            <section id="larangan" className="legal-clause-block">
              <h2>5. Batasan Penggunaan yang Dilarang (*Prohibited Uses*)</h2>
              <p>Pengguna dilarang keras untuk:</p>
              <ul>
                <li>Mengunggah foto bukan wajah manusia, gambar eksplisit/pornografi, ujaran kebencian, atau gambar milik orang lain tanpa izin tertulis.</li>
                <li>Melakukan rekayasa balik (*reverse engineering*), dekompilasi, penyusupan keamanan (*penetration testing* tanpa izin), scraping data otomatis tanpa izin tertulis, atau manipulasi kuota dan saldo koin secara tidak sah.</li>
                <li>Menyalahgunakan output Skincluv untuk mengklaim kualifikasi medis palsu atau menjual rekomendasi Skincluv sebagai layanan diagnosis dokter klinis kepada pihak ketiga.</li>
                <li>Mengelabui gerbang pembayaran Tripay melalui manipulasi callback request atau transaksi palsu.</li>
              </ul>
            </section>

            {/* Bagian 6 */}
            <section id="kekayaan-intelektual" className="legal-clause-block">
              <h2>6. Hak Kekayaan Intelektual</h2>
              <p>
                Seluruh hak cipta, merk dagang, logo, desain antarmuka, algoritma pemindaian, dan kode sumber perangkat lunak Skincluv adalah aset intelektual milik pengembang Skincluv yang dilindungi oleh Undang-Undang Hak Cipta Republik Indonesia.
              </p>
              <p>
                Pengguna tetap memegang hak kepemilikan atas foto wajah asli yang diunggah. Dengan mengunggah foto, pengguna memberikan lisensi terbatas kepada Skincluv semata-mata untuk memproses komputasi analisis visual dan mengekstrak matriks kondisi kulit sesuai Kebijakan Privasi.
              </p>
            </section>

            {/* Bagian 7 */}
            <section id="tanggung-jawab" className="legal-clause-block">
              <h2>7. Batasan Tanggung Jawab Hukum (*Limitation of Liability*)</h2>
              <p>
                Sejauh diizinkan oleh hukum yang berlaku, Skincluv dan tim pengembangnya tidak bertanggung jawab atas kerugian materiil, immateriil, cedera fisik, atau reaksi alergi/iritasi kulit akibat penggunaan mandiri atas produk kosmetik yang diulas pada platform ini.
              </p>
              <p>
                Pengguna memahami bahwa respon biologis kulit terhadap bahan kosmetik bersifat unik. Pengguna wajib melakukan uji coba (*patch test*) dan memeriksa nomor notifikasi BPOM resmi sebelum menggunakan produk kosmetik baru.
              </p>
            </section>

            {/* Bagian 8 */}
            <section id="hukum" className="legal-clause-block">
              <h2>8. Hukum yang Mengatur &amp; Penyelesaian Sengketa</h2>
              <p>
                Syarat dan Ketentuan ini tunduk dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap perselisihan yang timbul akan diupayakan diselesaikan terlebih dahulu melalui musyawarah mufakat.
              </p>
              <p>
                Jika dalam waktu 30 (tiga puluh) hari musyawarah tidak mencapai mufakat, perselisihan akan diselesaikan melalui yurisdiksi Badan Arbitrase Nasional Indonesia (BANI) atau Pengadilan Negeri yang berwenang di wilayah hukum domisili pengembang Skincluv.
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
          color: var(--color-primary, #0f6784);
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

        .terms-summary-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-left: 4px solid var(--color-primary, #0f6784);
          border-radius: var(--radius-lg, 12px);
          padding: 16px 20px;
          margin-bottom: 36px;
        }

        .banner-icon {
          color: var(--color-primary, #0f6784);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .terms-summary-banner p {
          font-size: 0.875rem;
          color: #1e3a8a;
          line-height: 1.5;
          margin: 0;
        }

        .terms-summary-banner a {
          color: var(--color-primary, #0f6784);
          font-weight: 700;
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

        .legal-clause-block a {
          color: var(--color-primary, #0f6784);
          font-weight: 600;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

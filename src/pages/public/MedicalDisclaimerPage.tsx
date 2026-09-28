// src/pages/public/MedicalDisclaimerPage.tsx
// Halaman Penyangkalan Medis & Batasan Layanan Non-Terapeutik Skincluv
// Kepatuhan: UU Kesehatan No. 17/2023, Permenkes No. 20/2019, dan Peraturan BPOM No. 3/2022
// Optimasi: DeepSeek 5-Layer Performance (Static TSX + content-visibility + Sticky Anchor TOC)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ShieldCheck, Stethoscope, Clock, CheckCircle2, ChevronRight, PhoneCall, Scale } from 'lucide-react'

export default function MedicalDisclaimerPage() {
  const [activeSection, setActiveSection] = useState('cakupan')

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
            <Scale size={14} /> DOKUMEN KEPATUHAN HUKUM &amp; KESEHATAN
          </div>
          <h1>Penyangkalan Medis &amp; Batasan Layanan</h1>
          <p className="doc-subtitle">
            Standar transparansi hukum operasional non-terapeutik platform kecerdasan buatan Skincluv berdasarkan UU Kesehatan No. 17/2023 dan Permenkes No. 20/2019.
          </p>
          <div className="doc-effective-date">
            <Clock size={14} /> Terakhir diperbarui: 28 September 2026 • Berlaku efektif bagi seluruh pengguna
          </div>
        </header>

        {/* EMERGENCY BANNER */}
        <div className="emergency-alert-card">
          <div className="alert-icon-wrap">
            <AlertTriangle size={24} />
          </div>
          <div className="alert-text-wrap">
            <h4>Bukan untuk Kondisi Darurat Medis</h4>
            <p>
              Jika Anda mengalami reaksi alergi anafilaktik, infeksi kulit bernanah parah, luka terbuka akut, pembengkakan wajah mendadak, atau sensasi terbakar hebat, <strong>segera hubungi 112/119 atau kunjungi Instalasi Gawat Darurat (IGD) fasilitas pelayanan kesehatan terdekat</strong>. Skincluv sama sekali tidak dapat digunakan untuk penanganan gawat darurat.
            </p>
          </div>
        </div>

        {/* GRID DOKUMEN DENGAN STICKY TOC */}
        <div className="legal-content-grid">
          {/* SISI KIRI: STICKY ANCHOR TABLE OF CONTENTS */}
          <aside className="legal-sidebar">
            <div className="sticky-toc-box">
              <h3>Daftar Klausul</h3>
              <nav className="toc-nav">
                <button
                  className={`toc-link ${activeSection === 'cakupan' ? 'active' : ''}`}
                  onClick={() => scrollTo('cakupan')}
                >
                  <ChevronRight size={14} /> 1. Sifat &amp; Ruang Lingkup Layanan
                </button>
                <button
                  className={`toc-link ${activeSection === 'bukan-diagnosis' ? 'active' : ''}`}
                  onClick={() => scrollTo('bukan-diagnosis')}
                >
                  <ChevronRight size={14} /> 2. Bukan Diagnosis &amp; Pengganti Dokter
                </button>
                <button
                  className={`toc-link ${activeSection === 'darurat' ? 'active' : ''}`}
                  onClick={() => scrollTo('darurat')}
                >
                  <ChevronRight size={14} /> 3. Situasi Gawat Darurat
                </button>
                <button
                  className={`toc-link ${activeSection === 'akurasi' ? 'active' : ''}`}
                  onClick={() => scrollTo('akurasi')}
                >
                  <ChevronRight size={14} /> 4. Keterbatasan Algoritma &amp; Foto
                </button>
                <button
                  className={`toc-link ${activeSection === 'tanggung-jawab' ? 'active' : ''}`}
                  onClick={() => scrollTo('tanggung-jawab')}
                >
                  <ChevronRight size={14} /> 5. Tanggung Jawab Mandiri Pengguna
                </button>
                <button
                  className={`toc-link ${activeSection === 'produk' ? 'active' : ''}`}
                  onClick={() => scrollTo('produk')}
                >
                  <ChevronRight size={14} /> 6. Sifat Kosmetik Produk
                </button>
                <button
                  className={`toc-link ${activeSection === 'usia' ? 'active' : ''}`}
                  onClick={() => scrollTo('usia')}
                >
                  <ChevronRight size={14} /> 7. Batasan Usia Pengguna
                </button>
                <button
                  className={`toc-link ${activeSection === 'hukum' ? 'active' : ''}`}
                  onClick={() => scrollTo('hukum')}
                >
                  <ChevronRight size={14} /> 8. Yurisdiksi Hukum RI
                </button>
              </nav>

              <div className="toc-footer-card">
                <Stethoscope size={18} className="text-primary mb-1" />
                <p>Butuh diagnosis pasti? Selalu konsultasikan dengan dokter spesialis dermatologi (Sp.DVE/Sp.KK).</p>
              </div>
            </div>
          </aside>

          {/* SISI KANAN: BODY DOKUMEN LENGKAP */}
          <article className="legal-article-body">
            {/* Klausul 1 */}
            <section id="cakupan" className="legal-clause-block">
              <h2>1. Sifat &amp; Ruang Lingkup Layanan Non-Terapeutik</h2>
              <p>
                Skincluv adalah platform aplikasi perangkat lunak berbasis kecerdasan buatan (AI) yang dirancang secara khusus untuk tujuan <strong>edukasi, analisis observasional mandiri, dan evaluasi kompatibilitas bahan kosmetik</strong>.
              </p>
              <div className="clause-highlight-box">
                <p>
                  Sesuai dengan ketentuan <strong>Pasal 1 angka 22 UU Kesehatan No. 17 Tahun 2023</strong> dan <strong>Permenkes No. 20 Tahun 2019</strong>:
                </p>
                <ul>
                  <li>Skincluv <strong>BUKAN alat kesehatan (medical device)</strong>.</li>
                  <li>Skincluv <strong>BUKAN fasilitas pelayanan kesehatan</strong> (klinik, rumah sakit, maupun laboratorium patologi).</li>
                  <li>Skincluv <strong>BUKAN penyedia layanan telemedisin klinis</strong>.</li>
                  <li>Skincluv <strong>BUKAN sarana apotek atau toko obat</strong>.</li>
                </ul>
              </div>
              <p>
                Skincluv tidak mempekerjakan dokter untuk memberikan konsultasi klinis melalui aplikasi ini, dan <strong>tidak ada hubungan dokter–pasien (*doctor-patient relationship*) yang terbentuk</strong> melalui penggunaan platform ini.
              </p>
            </section>

            {/* Klausul 2 */}
            <section id="bukan-diagnosis" className="legal-clause-block">
              <h2>2. Bukan Diagnosis Medis &amp; Bukan Pengganti Dokter</h2>
              <p>
                Seluruh keluaran fitur—termasuk skor kesehatan kulit, penilaian visual indikator jerawat, kelembapan, kemerahan, analisis kompatibilitas kandungan aktif, serta percakapan edukatif bersama asisten AI (Skinsistant):
              </p>
              <ul>
                <li>Merupakan <strong>estimasi komputasional algoritmik</strong> semata untuk memandu rutinitas perawatan kosmetik harian pengguna.</li>
                <li><strong>BUKAN diagnosis medis klinis</strong> atas patologi penyakit kulit (seperti Acne Vulgaris parah, Dermatitis Seboroik, Rosacea, Psoriasis, atau Kanker Kulit).</li>
                <li><strong>BUKAN resep obat medis</strong>, instruksi obat keras daftar G, terapi hormon, antibiotik topikal, maupun steroid.</li>
                <li><strong>TIDAK MENGGANTIKAN</strong> pemeriksaan klinis tatap muka, biopsi, atau penanganan medis langsung oleh dokter spesialis dermatologi, venereologi, dan estetika (dr. Sp.DVE / dr. Sp.KK).</li>
              </ul>
              <p>
                Anda dilarang keras mengabaikan, menunda, atau menghentikan pengobatan maupun terapi medis resmi yang telah diresepkan oleh dokter berlisensi Anda hanya karena merujuk pada analisis yang ditampilkan oleh Skincluv.
              </p>
            </section>

            {/* Klausul 3 */}
            <section id="darurat" className="legal-clause-block">
              <h2>3. Situasi Gawat Darurat &amp; Kondisi Berat</h2>
              <p>
                Platform Skincluv beroperasi dengan model komputasi asinkron dan tidak dipantau secara langsung oleh manusia dalam waktu nyata (*real-time*). Oleh karena itu, Skincluv dilarang keras digunakan untuk situasi kegawatdaruratan klinis apa pun.
              </p>
              <p>
                Bila Anda mencurigai adanya infeksi bakteri/jamur sistemik, lesi kulit yang mengalami pendarahan terus-menerus, tahi lalat yang berubah bentuk/ukuran secara asimetris (tanda bahaya ABCDE melanoma), segera temui dokter spesialis kulit terdekat.
              </p>
            </section>

            {/* Klausul 4 */}
            <section id="akurasi" className="legal-clause-block">
              <h2>4. Keterbatasan Algoritma &amp; Kualitas Unggahan Foto</h2>
              <p>
                Hasil analisis pemindaian visual wajah sangat dipengaruhi oleh variabel eksternal teknis perangkat keras Anda:
              </p>
              <ul>
                <li>Tingkat pencahayaan ruangan (*ambient lighting*), sudut kemiringan wajah, dan ketajaman fokus kamera ponsel.</li>
                <li>Keberadaan filter kamera digital, riasan wajah (*makeup*), tabir surya fisik yang menyisakan *whitecast*, atau resolusi sensor optik yang rendah.</li>
              </ul>
              <p>
                Skor kulit bersifat estimasi semi-kuantitatif. Sesuai ambang MCID (*Minimal Clinically Important Difference*), fluktuasi skor di bawah 5 poin antar-foto dalam jarak waktu berdekatan merupakan variasi wajar kalibrasi sudut pencahayaan, bukan merupakan perbaikan atau kemunduran fisiologis jaringan kulit nyata.
              </p>
            </section>

            {/* Klausul 5 */}
            <section id="tanggung-jawab" className="legal-clause-block">
              <h2>5. Tanggung Jawab Mandiri Pengguna</h2>
              <p>
                Keputusan untuk membeli, mencoba, mengombinasikan (*layering*), atau menghentikan penggunaan produk kosmetik perawatan kulit adalah hak dan tanggung jawab mandiri Anda sepenuhnya (*assumption of risk*).
              </p>
              <p>
                Bagi pengguna dalam kondisi fisiologis khusus—termasuk wanita hamil, ibu menyusui, penderita eksim atopik kronis, atau individu yang sedang menjalani kemoterapi—wajib melakukan uji tempel (*patch test*) mandiri dan berkonsultasi dengan dokter kandungan/dermatolog sebelum menggunakan bahan aktif dengan konsentrasi tinggi (seperti Retinoid, AHA/BHA konsentrasi asam, atau Benzoyl Peroxide).
              </p>
            </section>

            {/* Klausul 6 */}
            <section id="produk" className="legal-clause-block">
              <h2>6. Sifat Kosmetik &amp; Legalitas Izin Edar Produk</h2>
              <p>
                Rekomendasi nama bahan aktif atau produk kosmetik yang terdapat di dalam aplikasi Skincluv bersumber dari basis data komposisi kosmetik publik dan literatur dermatologi terverifikasi.
              </p>
              <p>
                Seluruh produk kosmetik yang disebutkan merupakan sediaan kosmetik perawatan (skincare) berizin edar BPOM milik masing-masing pemegang merk dagang/pelaku usaha terkait. <strong>Skincluv bukan produsen, bukan distributor, bukan pemilik merk dagang, dan bukan pihak yang menerbitkan Nomor Notifikasi BPOM atas produk-produk tersebut.</strong>
              </p>
            </section>

            {/* Klausul 7 */}
            <section id="usia" className="legal-clause-block">
              <h2>7. Batasan Usia Pengguna</h2>
              <p>
                Layanan Skincluv ditujukan bagi individu yang telah berusia <strong>minimal 17 (tujuh belas) tahun</strong> atau telah cakap secara hukum perdata Republik Indonesia. Pengguna di bawah usia 17 tahun hanya diperkenankan menggunakan aplikasi di bawah persetujuan dan pengawasan aktif dari orang tua atau wali hukum yang sah.
              </p>
            </section>

            {/* Klausul 8 */}
            <section id="hukum" className="legal-clause-block">
              <h2>8. Pembaruan Klausul &amp; Yurisdiksi Hukum RI</h2>
              <p>
                Penyangkalan Medis ini tunduk, ditafsirkan, dan diberlakukan secara eksklusif berdasarkan hukum materiil Negara Kesatuan Republik Indonesia. Pengembang berhak memperbarui klausul kepatuhan ini sewaktu-waktu seiring dengan evolusi regulasi teknologi kesehatan dan pedoman Badan Pengawas Obat dan Makanan (BPOM).
              </p>
            </section>
          </article>
        </div>
      </div>

      {/* STYLING DENGAN CONTENT-VISIBILITY UNTUK PERFORMA TINGGI */}
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

        /* HEADER */
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

        /* EMERGENCY ALERT */
        .emergency-alert-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-left: 5px solid #e11d48;
          border-radius: var(--radius-lg, 12px);
          padding: 20px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.06);
        }

        .alert-icon-wrap {
          color: #e11d48;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .alert-text-wrap h4 {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #9f1239;
          margin: 0 0 6px 0;
        }

        .alert-text-wrap p {
          font-size: 0.875rem;
          color: #881337;
          line-height: 1.5;
          margin: 0;
        }

        /* LAYOUT DUA KOLOM DENGAN STICKY TOC */
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

        /* SIDEBAR STICKY */
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

        /* ARTICLE BODY */
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

        /* PENGHEMATAN PERFORMA DEEPSEEK: content-visibility */
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

        .clause-highlight-box p {
          font-weight: 700;
          margin-bottom: 10px;
        }

        .clause-highlight-box ul {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  )
}

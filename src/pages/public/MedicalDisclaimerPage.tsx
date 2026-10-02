// src/pages/public/MedicalDisclaimerPage.tsx
// Halaman Penyangkalan Medis & Batasan Layanan Non-Terapeutik Skincluv
// Kepatuhan: UU Kesehatan No. 17/2023, Permenkes No. 20/2019, dan Peraturan BPOM No. 3/2022
// Optimasi: DeepSeek 5-Layer Performance (Static TSX + content-visibility + Sticky Anchor TOC)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ShieldCheck, Stethoscope, Clock, CheckCircle2, ChevronRight, PhoneCall, Scale } from 'lucide-react'
import '@/styles/legal-docs.css'

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
    </div>
  )
}

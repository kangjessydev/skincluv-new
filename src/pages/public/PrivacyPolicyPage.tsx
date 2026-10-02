// src/pages/public/PrivacyPolicyPage.tsx
// Kebijakan Privasi Resmi Skincluv
// Kepatuhan: UU Pelindungan Data Pribadi (UU PDP No. 27/2022) & Invarian 20
// Optimasi: DeepSeek 5-Layer Performance (Static TSX + content-visibility + Sticky Anchor TOC)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, Trash2, EyeOff, Clock, ChevronRight, CheckCircle2, UserCheck, Database } from 'lucide-react'
import '@/styles/legal-docs.css'

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('data-dikumpulkan')

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
            <ShieldCheck size={14} /> KEPATUHAN UU PDP NO. 27/2022
          </div>
          <h1>Kebijakan Privasi &amp; Perlindungan Data Biometrik</h1>
          <p className="doc-subtitle">
            Standar tata kelola, pemrosesan, perlindungan data pribadi spesifik (data biometrik wajah), dan jaminan hak pengguna sesuai Undang-Undang Pelindungan Data Pribadi Republik Indonesia.
          </p>
          <div className="doc-effective-date">
            <Clock size={14} /> Terakhir diperbarui: 28 September 2026 • Berlaku untuk seluruh pengguna Skincluv
          </div>
        </header>

        {/* CORE PRIVACY COMMITMENTS */}
        <div className="privacy-commitments-grid">
          <div className="commitment-card">
            <div className="commitment-icon-wrap"><Lock size={20} /></div>
            <div>
              <h4>Minimisasi Data Biometrik</h4>
              <p>Foto wajah disimpan di storage tertutup (*private bucket*) dengan enkripsi dan hanya dapat diakses melalui URL bertanda tangan berwaktu singkat (*short-lived signed URL*).</p>
            </div>
          </div>
          <div className="commitment-card">
            <div className="commitment-icon-wrap"><Trash2 size={20} /></div>
            <div>
              <h4>Hak untuk Dihapus (*Right to be Forgotten*)</h4>
              <p>Pengguna memiliki kendali penuh untuk menghapus rekam jejak scan wajah, riwayat percakapan, atau menghapus akun secara permanen melalui Pusat Privasi.</p>
            </div>
          </div>
          <div className="commitment-card">
            <div className="commitment-icon-wrap"><EyeOff size={20} /></div>
            <div>
              <h4>Tanpa Penjualan Data ke Pihak Ketiga</h4>
              <p>Data profil dan foto Anda tidak pernah diperjualbelikan kepada broker data, biro periklanan, atau pihak eksternal mana pun.</p>
            </div>
          </div>
          <div className="commitment-card">
            <div className="commitment-icon-wrap"><Database size={20} /></div>
            <div>
              <h4>Pemisahan Transaksi Finansial</h4>
              <p>Data transaksi kas Tripay dipisahkan dari data biometrik untuk kepatuhan hukum pembukuan tanpa menyimpan identitas pribadi sensitif.</p>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="legal-content-grid">
          {/* SIDEBAR TOC */}
          <aside className="legal-sidebar">
            <div className="sticky-toc-box">
              <h3>Daftar Klausul</h3>
              <nav className="toc-nav">
                <button
                  className={`toc-link ${activeSection === 'data-dikumpulkan' ? 'active' : ''}`}
                  onClick={() => scrollTo('data-dikumpulkan')}
                >
                  <ChevronRight size={14} /> 1. Jenis Data yang Dikumpulkan
                </button>
                <button
                  className={`toc-link ${activeSection === 'tujuan-pemrosesan' ? 'active' : ''}`}
                  onClick={() => scrollTo('tujuan-pemrosesan')}
                >
                  <ChevronRight size={14} /> 2. Tujuan Pemrosesan
                </button>
                <button
                  className={`toc-link ${activeSection === 'keamanan-penyimpanan' ? 'active' : ''}`}
                  onClick={() => scrollTo('keamanan-penyimpanan')}
                >
                  <ChevronRight size={14} /> 3. Keamanan &amp; Penyimpanan
                </button>
                <button
                  className={`toc-link ${activeSection === 'pihak-ketiga' ? 'active' : ''}`}
                  onClick={() => scrollTo('pihak-ketiga')}
                >
                  <ChevronRight size={14} /> 4. Pihak Ketiga &amp; Pemroses AI
                </button>
                <button
                  className={`toc-link ${activeSection === 'hak-pengguna' ? 'active' : ''}`}
                  onClick={() => scrollTo('hak-pengguna')}
                >
                  <ChevronRight size={14} /> 5. Hak Pengguna (UU PDP)
                </button>
                <button
                  className={`toc-link ${activeSection === 'penghapusan-akun' ? 'active' : ''}`}
                  onClick={() => scrollTo('penghapusan-akun')}
                >
                  <ChevronRight size={14} /> 6. Siklus Penghapusan &amp; Retensi
                </button>
                <button
                  className={`toc-link ${activeSection === 'kontak-dpo' ? 'active' : ''}`}
                  onClick={() => scrollTo('kontak-dpo')}
                >
                  <ChevronRight size={14} /> 7. Kontak Petugas Privasi
                </button>
              </nav>
            </div>
          </aside>

          {/* ARTICLE BODY */}
          <article className="legal-article-body">
            {/* Bagian 1 */}
            <section id="data-dikumpulkan" className="legal-clause-block">
              <h2>1. Jenis Data Pribadi yang Dikumpulkan</h2>
              <p>
                Dalam rangka menyediakan layanan komputasi kosmetik, Skincluv mengumpulkan kategori data berikut:
              </p>
              <ul>
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
            <section id="tujuan-pemrosesan" className="legal-clause-block">
              <h2>2. Dasar Hukum &amp; Tujuan Pemrosesan Data</h2>
              <p>
                Pemrosesan data pribadi Anda dilakukan berdasarkan <strong>persetujuan eksplisit (*explicit consent*)</strong> saat mendaftar dan mengunggah foto wajah, dengan tujuan terbatas untuk:
              </p>
              <ul>
                <li>Mengekstraksi indikator visual kondisi kulit (kelembaban, kemerahan, sebum, dan pori-pori) melalui model visi komputer.</li>
                <li>Memberikan rekomendasi bahan aktif skincare edukatif non-terapeutik yang relevan dengan tipe kulit Anda.</li>
                <li>Mengelola saldo kuota Universal AI dan riwayat aktivasi paket pass 30 hari.</li>
                <li>Menghasilkan grafik tren perkembangan kondisi kulit mandiri dalam jangka waktu 28 hari.</li>
              </ul>
            </section>

            {/* Bagian 3 */}
            <section id="keamanan-penyimpanan" className="legal-clause-block">
              <h2>3. Keamanan, Enkripsi, &amp; Penyimpanan Data</h2>
              <p>
                Kami menerapkan standar arsitektur keamanan *Zero-Trust*:
              </p>
              <ul>
                <li><strong>Enkripsi In-Transit &amp; At-Rest:</strong> Seluruh komunikasi jaringan menggunakan protokol TLS 1.3 dengan algoritma enkripsi SHA-256 / AES-256.</li>
                <li><strong>Private Storage Bucket:</strong> Foto wajah fisik disimpan di dalam Supabase Cloud Storage dengan status akses tertutup (*private*). Foto tidak memiliki URL publik permanen dan hanya dapat diakses melalui URL bertanda tangan kriptografis (*signed URL*) berbatas waktu (maksimal 60 menit) yang diotorisasi khusus untuk akun pemiliknya.</li>
                <li><strong>Row Level Security (RLS):</strong> Basis data PostgreSQL mengaktifkan RLS ketat di level baris tabel; pengguna lain atau peran Customer Support secara teknis tidak dapat mengueri foto atau hasil klinis Anda.</li>
              </ul>
            </section>

            {/* Bagian 4 */}
            <section id="pihak-ketiga" className="legal-clause-block">
              <h2>4. Keterlibatan Pihak Ketiga &amp; Pemroses AI</h2>
              <p>
                Untuk menjalankan komputasi awan, Skincluv bekerja sama dengan mitra pemroses data terpercaya:
              </p>
              <ul>
                <li><strong>Penyedia Model AI (Google Cloud Vertex / Gemini &amp; OpenRouter):</strong> Foto wajah atau teks pertanyaan dikirimkan melalui saluran API terenkripsi semata-mata untuk inferensi analitik seketika. Berdasarkan perjanjian penyedia enterprise, data tidak digunakan untuk melatih model umum publik pihak ketiga.</li>
                <li><strong>Penyedia Gerbang Pembayaran (Tripay):</strong> Untuk memproses verifikasi transaksi perbankan dan penerbitan kode QRIS / Virtual Account.</li>
                <li><strong>Penyedia Pencarian Web Terverifikasi (Tavily Search):</strong> Hanya menerima kueri bahan aktif skincare dermatologi yang telah disanitasi dari kata ganti orang pertama demi privasi percakapan.</li>
              </ul>
            </section>

            {/* Bagian 5 */}
            <section id="hak-pengguna" className="legal-clause-block">
              <h2>5. Hak-Hak Pemilik Data Pribadi (UU PDP No. 27/2022)</h2>
              <p>
                Sebagai subjek data, Anda memiliki hak penuh yang dijamin oleh undang-undang:
              </p>
              <ul>
                <li><strong>Hak Akses &amp; Portabilitas:</strong> Hak untuk melihat seluruh rekam jejak scan dan mengunduh salinan data profil Anda.</li>
                <li><strong>Hak Penarikan Persetujuan (*Consent Withdrawal*):</strong> Anda dapat mematikan fitur memori asisten AI kapan saja melalui pengaturan chatbot, yang secara otomatis memicu penghapusan atomik memori percakapan.</li>
                <li><strong>Hak Penghapusan Mandiri:</strong> Hak untuk menghapus riwayat foto scan wajah tertentu atau seluruh akun secara permanen.</li>
              </ul>
            </section>

            {/* Bagian 6 */}
            <section id="penghapusan-akun" className="legal-clause-block">
              <h2>6. Siklus Penghapusan Data &amp; Kebijakan Retensi Backup</h2>
              <p>
                Sesuai prinsip kepatuhan hukum yang defensible:
              </p>
              <div className="clause-highlight-box">
                <p><strong>Mekanisme Dual-Track Penghapusan:</strong></p>
                <ul>
                  <li><strong>Data Biometrik &amp; Klinis:</strong> Saat Anda menghapus akun atau menghapus riwayat scan, file fisik foto wajah di Cloud Storage, hasil ekstraksi fitur visual, riwayat chat, dan memori klinis akan <strong>dimusnahkan secara menyeluruh dari sistem operasional aktif</strong>.</li>
                  <li><strong>Catatan Transaksi Finansial:</strong> Untuk memenuhi kewajiban rekonsiliasi dan hukum perpajakan Republik Indonesia, catatan invoice kas Tripay tetap dipertahankan dengan menghapus referensi identitas personal pengguna (foreign key dialihkan menjadi <code>NULL</code>) sehingga tidak lagi terhubung dengan identitas Anda.</li>
                </ul>
              </div>
              <p>
                <strong>Siklus Cadangan Terenkripsi (*Encrypted Backup Lifecycle*):</strong> Data aktif segera dihapus dari sistem operasional. Salinan cadangan (*disaster recovery snapshot*) yang terenkripsi akan terhapus secara alami mengikuti siklus retensi backup berkala (maksimal 30 hari) dan tidak pernah diproses kembali untuk operasional apa pun.
              </p>
            </section>

            {/* Bagian 7 */}
            <section id="kontak-dpo" className="legal-clause-block">
              <h2>7. Kontak Petugas Pelindungan Data (DPO)</h2>
              <p>
                Apabila Anda memiliki pertanyaan, keberatan, atau ingin mengajukan permohonan hak atas data pribadi Anda, silakan hubungi tim kepatuhan privasi kami:
              </p>
              <div className="clause-highlight-box">
                <p><strong>Tim Pelindungan Data Pribadi Skincluv:</strong></p>
                <p>Email: <code>privacy@skincluv.com</code> / <code>support@skincluv.com</code></p>
                <p>WhatsApp Dukungan: Melalui halaman <Link to="/contact">Kontak Resmi</Link></p>
                <p>Waktu Respons: Maksimal 3 &times; 24 jam kerja sesuai ketentuan UU PDP.</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </div>
  )
}

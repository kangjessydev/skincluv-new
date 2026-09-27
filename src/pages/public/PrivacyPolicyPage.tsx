import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Trash2, EyeOff, CheckCircle2 } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-container">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="legal-brand">
            <Shield size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 800 }}>Skincluv</span>
          </div>
        </div>
      </header>

      <main className="legal-content">
        <div className="legal-title-section">
          <span className="legal-badge">Privasi &amp; Kepatuhan Regulasi</span>
          <h1>Kebijakan Privasi</h1>
          <p className="legal-subtitle">
            Sesuai Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27 Tahun 2022). Terakhir diperbarui: 27 September 2026.
          </p>
        </div>

        <article className="legal-body">
          <section className="legal-summary-card">
            <h3>Komitmen Privasi Inti Skincluv:</h3>
            <div className="legal-commitments-grid">
              <div className="commitment-item">
                <Lock size={18} className="commitment-icon" />
                <div>
                  <strong>Minimisasi Biometrik</strong>
                  <span>Foto wajah diproses secara sirkular/sementara untuk ekstraksi skor klinis dan tidak disimpan sebagai album publik.</span>
                </div>
              </div>
              <div className="commitment-item">
                <Trash2 size={18} className="commitment-icon" />
                <div>
                  <strong>Hak untuk Dilupakan (Right to be Forgotten)</strong>
                  <span>Pengguna dapat menghapus riwayat pemindaian dan mematikan memori AI kapan saja dengan pembersihan atomik.</span>
                </div>
              </div>
              <div className="commitment-item">
                <EyeOff size={18} className="commitment-icon" />
                <div>
                  <strong>Tanpa Penjualan Data</strong>
                  <span>Data profil, riwayat scan, atau preferensi Anda tidak pernah dijual kepada pihak ketiga atau pengiklan.</span>
                </div>
              </div>
              <div className="commitment-item">
                <CheckCircle2 size={18} className="commitment-icon" />
                <div>
                  <strong>Enkripsi Standar Perbankan</strong>
                  <span>Seluruh lalu lintas dilindungi enkripsi TLS 1.3 dan Row Level Security (RLS) PostgreSQL setingkat korporat.</span>
                </div>
              </div>
            </div>
          </section>

          <h2>1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan jenis data berikut untuk menyediakan layanan analitik kulit:</p>
          <ul>
            <li>
              <strong>Data Akun:</strong> Alamat email, nama panggilan/display name, kata sandi terenkripsi,
              serta preferensi profil (tipe kulit, keluhan utama).
            </li>
            <li>
              <strong>Data Observasi Pemindaian (Scan Data):</strong> Citra foto wajah dan foto label komposisi
              produk yang Anda unggah secara sadar. Citra diproses oleh sistem komputasi AI dermatologi untuk
              menghitung parameter (tingkat sebum, kemerahan, pori, skor kerutan) dan mengekstraksi bahan aktif INCI.
            </li>
            <li>
              <strong>Data Transaksi:</strong> Nomor referensi transaksi, status pembayaran, dan metode bayar
              yang diteruskan dari Tripay Payment Gateway. Skincluv tidak pernah menyimpan nomor kartu kredit atau
              PIN perbankan Anda.
            </li>
            <li>
              <strong>Log Teknis &amp; Diagnostik:</strong> Alamat IP, jenis peramban, serta log latensi API
              untuk mendeteksi anomali keamanan dan memantau performa model AI.
            </li>
          </ul>

          <h2>2. Tujuan Pemrosesan Data Pribadi</h2>
          <p>Data pribadi Anda diproses dengan dasar persetujuan eksplisit (consent) untuk tujuan:</p>
          <ul>
            <li>Melakukan analisis visual kondisi kulit wajah dan verifikasi keamanan bahan aktif kosmetik.</li>
            <li>Menyajikan grafik perkembangan tren kondisi kulit (28-day skin cycle monitoring).</li>
            <li>Memberikan rekomendasi produk yang relevan secara objektif berdasarkan komposisi bahan ilmiah.</li>
            <li>Memproses kuota langganan, Misi Glow, serta pencatatan akuntansi token AI yang transparan.</li>
          </ul>

          <h2>3. Pemrosesan Citra Wajah &amp; Keamanan Biometrik</h2>
          <p>
            Skincluv memperlakukan citra wajah dengan standar kehati-hatian tertinggi:
          </p>
          <ul>
            <li>
              <strong>Idempotensi Hash SHA-256:</strong> Sistem hanya menyimpan nilai intisari hash kriptografis
              foto untuk mendeteksi unggahan berulang identik tanpa menyimpan duplikat mentah.
            </li>
            <li>
              <strong>Tidak Menggunakan Perceptual Similarity:</strong> Foto yang hanya mirip tidak pernah
              diasumsikan identik secara otomatis demi menjaga akurasi klinis dan integritas data pengguna.
            </li>
            <li>
              <strong>Isolasi Bubble Chat:</strong> Komponen antarmuka Skinsistant dilarang menampilkan kembali foto
              wajah asli di ruang obrolan demi meminimalkan paparan data visual biometrik.
            </li>
          </ul>

          <h2>4. Hak Subjek Data (Pasal 5 UU PDP No. 27/2022)</h2>
          <p>Sebagai pemilik data pribadi, Anda memiliki hak penuh untuk:</p>
          <ul>
            <li><strong>Hak Akses &amp; Salinan:</strong> Melihat seluruh riwayat pemindaian dan riwayat obrolan Anda melalui dashboard akun.</li>
            <li><strong>Hak Pembaruan (Rectification):</strong> Mengubah tipe kulit dan preferensi pada menu pengaturan.</li>
            <li><strong>Hak Penghapusan (Erasure / Right to be Forgotten):</strong> Menghapus riwayat scan tertentu. Visual card terkait pada obrolan lampau akan seketika di-invalidasi menjadi 404/null untuk mencegah kebocoran data basi.</li>
            <li><strong>Hak Penarikan Persetujuan (Withdrawal of Consent):</strong> Anda dapat mematikan tombol <em>Memory Consent</em> di panel Chatbot. Seketika itu juga seluruh ringkasan memori klinis Anda dihapus permanen secara atomik dari basis data.</li>
          </ul>

          <h2>5. Keamanan dan Penyimpanan Data</h2>
          <p>
            Data disimpan di infrastruktur cloud tersertifikasi ISO/IEC 27001 dan SOC 2 Tipe II (Supabase).
            Akses ke basis data dilindungi oleh kebijakan <em>Row Level Security</em> (RLS) di mana setiap baris data
            hanya dapat dibaca dan ditulis oleh pengguna yang terotentikasi sebagai pemilik sah data tersebut.
            Kunci service-role backend tidak pernah diekspos ke sisi klien.
          </p>

          <h2>6. Kontak Petugas Pelindungan Data (DPO)</h2>
          <p>
            Untuk mengajukan permohonan penghapusan akun secara menyeluruh atau pertanyaan mengenai hak privasi Anda,
            silakan hubungi Petugas Pelindungan Data Skincluv di:
          </p>
          <p>
            <strong>Email DPO:</strong> <code>privacy@skincluv.com</code><br />
            <strong>Alamat:</strong> Jakarta, Indonesia.
          </p>
        </article>
      </main>

      <footer className="legal-footer">
        <p>© 2026 Skincluv. Sesuai regulasi UU PDP Republik Indonesia.</p>
      </footer>

      <style>{`
        .legal-container {
          min-height: 100vh;
          background: var(--color-surface-bg);
          color: var(--color-text-main);
          font-family: var(--font-body);
        }
        .legal-header {
          border-bottom: 1px solid var(--color-secondary-container);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .legal-header-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: var(--space-md) var(--space-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .legal-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.125rem;
        }
        .legal-content {
          max-width: 840px;
          margin: 0 auto;
          padding: 60px var(--space-lg) 100px;
        }
        .legal-title-section {
          margin-bottom: var(--space-2xl);
        }
        .legal-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          background: var(--color-primary-fixed);
          color: var(--color-on-primary-container);
          margin-bottom: var(--space-sm);
        }
        .legal-title-section h1 {
          font-size: 2.25rem;
          font-family: var(--font-heading);
          font-weight: 800;
          margin: 0 0 10px;
        }
        .legal-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0;
        }
        .legal-body {
          line-height: 1.7;
          font-size: 0.9375rem;
        }
        .legal-body h2 {
          font-size: 1.25rem;
          font-family: var(--font-heading);
          font-weight: 800;
          margin: 36px 0 12px;
          padding-top: 12px;
          border-top: 1px solid var(--color-secondary-container);
        }
        .legal-body p {
          margin: 0 0 16px;
          color: var(--color-text-main);
        }
        .legal-body ul {
          margin: 0 0 20px;
          padding-left: 24px;
        }
        .legal-body li {
          margin-bottom: 8px;
        }
        .legal-summary-card {
          background: var(--color-surface-container-low);
          border: 1px solid var(--color-secondary-container);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-2xl);
        }
        .legal-summary-card h3 {
          margin: 0 0 var(--space-lg);
          font-size: 1.125rem;
          font-family: var(--font-heading);
          font-weight: 800;
        }
        .legal-commitments-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
        }
        @media (min-width: 640px) {
          .legal-commitments-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .commitment-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .commitment-icon {
          flex-shrink: 0;
          color: var(--color-primary);
          margin-top: 2px;
        }
        .commitment-item strong {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .commitment-item span {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.45;
        }
        .legal-footer {
          border-top: 1px solid var(--color-secondary-container);
          padding: var(--space-xl) var(--space-lg);
          text-align: center;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  )
}

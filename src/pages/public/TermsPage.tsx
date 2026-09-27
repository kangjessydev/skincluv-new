import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText } from 'lucide-react'

export default function TermsPage() {
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
          <span className="legal-badge">Dokumen Legal Resmi</span>
          <h1>Syarat dan Ketentuan Layanan</h1>
          <p className="legal-subtitle">
            Terakhir diperbarui: 27 September 2026. Berlaku efektif untuk seluruh pengguna layanan Skincluv.
          </p>
        </div>

        <article className="legal-body">
          <section className="legal-alert-box">
            <FileText size={20} className="legal-alert-icon" />
            <div>
              <strong>Pemberitahuan Medis Penting (Medical Disclaimer):</strong>
              <p>
                Skincluv adalah platform perangkat lunak analitik berbasis kecerdasan buatan (AI) yang
                ditujukan untuk tujuan edukasi, evaluasi kompatibilitas kosmetik, dan pemantauan tren kondisi
                kulit mandiri. Hasil analisis pemindaian wajah dan bahan kosmetik di Skincluv BUKAN merupakan
                diagnosis medis klinis, bukan resep obat keras medis, dan tidak menggantikan konsultasi,
                pemeriksaan, atau tindakan medis langsung dari dokter spesialis dermatologi dan venereologi
                berlisensi.
              </p>
            </div>
          </section>

          <h2>1. Penerimaan Ketentuan</h2>
          <p>
            Dengan mendaftar, mengakses, atau menggunakan layanan Skincluv (baik melalui web app maupun API
            terkait), Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat secara hukum oleh
            Syarat dan Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, Anda dipersilakan untuk tidak
            menggunakan platform ini.
          </p>

          <h2>2. Kelayakan dan Pendaftaran Akun</h2>
          <p>
            Untuk menggunakan layanan analisis Skincluv, pengguna harus berusia minimal 17 tahun atau memiliki
            izin serta pendampingan dari orang tua/wali hukum. Pengguna bertanggung jawab penuh atas keamanan
            kredensial login akun dan segala aktivitas yang dilakukan melalui akun tersebut.
          </p>

          <h2>3. Sistem Kredit, Koin, dan Paket Langganan</h2>
          <ul>
            <li>
              <strong>Koin &amp; Kuota Fitur:</strong> Layanan Skincluv menggunakan sistem unit kuota/kredit
              digital (Misi Glow, Kuota Bulanan Glow Club, dan Pro Club). Kredit atau koin yang telah diperoleh
              atau dibeli bersifat non-refundable (tidak dapat diuangkan kembali).
            </li>
            <li>
              <strong>Pembaruan Paket:</strong> Paket langganan berbayar diperbarui berdasarkan durasi paket
              yang dipilih dan diproses secara aman melalui gerbang pembayaran resmi berizin Bank Indonesia
              (Tripay Payment Gateway).
            </li>
            <li>
              <strong>Idempotensi Pemindaian:</strong> Untuk efisiensi kuota pengguna, sistem menerapkan
              mekanisme idempotensi hash kanonikal pada pemindaian foto identik yang diunggah berulang dalam
              jendela waktu tertentu agar tidak memotong kredit pengguna secara keliru.
            </li>
          </ul>

          <h2>4. Batasan Penggunaan yang Diperbolehkan</h2>
          <p>Pengguna dilarang keras untuk:</p>
          <ul>
            <li>Mengunggah foto bukan wajah manusia, materi eksplisit, kekerasan, atau hak milik pihak lain tanpa izin.</li>
            <li>Melakukan tindakan reverse engineering, penetrasi keamanan, scraping data tanpa izin, atau manipulasi saldo koin secara tidak sah.</li>
            <li>Menggunakan hasil analitik Skincluv untuk mengklaim diagnosis medis terhadap pihak ketiga tanpa kewenangan profesi medis yang sah.</li>
          </ul>

          <h2>5. Pembayaran dan Kebijakan Pengembalian Dana (Refund)</h2>
          <p>
            Seluruh transaksi pembayaran diproses melalui saluran resmi Tripay (QRIS, Virtual Account, Retail Outlet,
            atau E-Wallet). Jika terjadi kegagalan transaksi di mana saldo pengguna telah terdebet namun kuota/kredit
            belum bertambah karena gangguan jaringan, sistem rekonsiliasi otomatis akan memverifikasi status pembayaran.
            Pengguna dapat menghubungi layanan bantuan untuk penyelesaian transaksi dengan melampirkan nomor referensi pembayaran.
          </p>

          <h2>6. Batasan Tanggung Jawab</h2>
          <p>
            Skincluv, pengembang, dan afiliasinya tidak bertanggung jawab atas kerugian langsung maupun tidak
            langsung, termasuk reaksi alergi kulit akibat pemakaian produk kosmetik tertentu yang dianalisis
            secara mandiri oleh pengguna. Pengguna wajib melakukan patch test sebelum menggunakan produk baru
            dan selalu membaca petunjuk resmi produsen serta petunjuk BPOM.
          </p>

          <h2>7. Hukum yang Mengatur</h2>
          <p>
            Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum yang berlaku di Negara Kesatuan
            Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan secara musyawarah untuk mufakat,
            atau melalui Pengadilan Negeri yang berwenang di Indonesia.
          </p>

          <h2>8. Kontak Layanan Bantuan</h2>
          <p>
            Jika memiliki pertanyaan seputar Syarat dan Ketentuan ini, silakan hubungi tim dukungan resmi
            kami melalui email di: <code>support@skincluv.com</code>.
          </p>
        </article>
      </main>

      <footer className="legal-footer">
        <p>© 2026 Skincluv. Seluruh hak cipta dilindungi undang-undang.</p>
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
        .legal-alert-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-2xl);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          color: #14532d;
        }
        .legal-alert-icon {
          flex-shrink: 0;
          margin-top: 2px;
          color: #16a34a;
        }
        .legal-alert-box strong {
          display: block;
          margin-bottom: 6px;
          font-size: 0.9375rem;
        }
        .legal-alert-box p {
          margin: 0;
          font-size: 0.875rem;
          color: #166534;
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

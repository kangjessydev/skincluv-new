import { useState } from 'react'
import {
  Smartphone, Download, ShieldCheck, Camera, Zap,
  CheckCircle2, HelpCircle, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const APK_DOWNLOAD_URL = 'https://vxyyediuoyxbozbizswi.supabase.co/storage/v1/object/public/app-releases/skincluv.apk'

interface FaqItem {
  q: string
  a: string
}

const FAQ_LIST: FaqItem[] = [
  {
    q: 'Kenapa muncul peringatan "File mungkin berbahaya" saat mengunduh?',
    a: 'Peringatan tersebut adalah mekanisme keamanan standar bawaan sistem operasi Android untuk setiap file aplikasi (.apk) yang diunduh langsung dari browser di luar Google Play Store. File APK Skincluv ini 100% aman, bersih dari malware, dan bersumber langsung dari server resmi kami.'
  },
  {
    q: 'Apakah semua data profil dan koin saya tetap tersinkronisasi?',
    a: 'Ya, seluruh data tersimpan aman di cloud. Begitu Anda menginstal aplikasi dan login menggunakan akun yang sama, riwayat scan, data skin profile, dan saldo Credits Anda otomatis tersinkronisasi persis seperti di web.'
  },
  {
    q: 'Berapa versi Android minimal yang didukung?',
    a: 'Aplikasi Skincluv mendukung Android versi 8.0 (Oreo) ke atas hingga Android 15 & 16 terbaru. Aplikasi ini sangat ringan (~24 MB) sehingga tidak akan membebani memori ponsel Anda.'
  },
  {
    q: 'Bagaimana cara memperbarui aplikasi jika ada versi baru di kemudian hari?',
    a: 'Anda cukup mengunjungi kembali halaman ini kapan saja untuk mengunduh versi pembaruan terbaru. Akun dan data Anda tidak akan terhapus saat menimpa instalasi versi baru.'
  }
]

export default function DownloadPage() {
  useScrollReveal()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="cluv-page cluv-surface-public">
      {/* 1. HERO SECTION */}
      <section className="cluv-section">
        <div className="cluv-container is-md">
          <header className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-3">
              <Smartphone size={14} />
              <span>Aplikasi Resmi Android • APK Bebas Iklan</span>
            </div>
            <h1 className="cluv-title-hero">Rawat Kulitmu Lebih Leluasa Langsung dari Ponsel</h1>
            <p className="cluv-lead cluv-mt-3">
              Gunakan kamera ponsel secara instan tanpa perlu repot membuka browser. Observasi kondisi kulit, periksa komposisi skincare, dan konsultasi dengan Skinsistant dalam satu ketukan.
            </p>
          </header>

          {/* MAIN DOWNLOAD CARD */}
          <div className="cluv-card cluv-reveal cluv-mb-8">
            <div className="cluv-flex-col cluv-gap-6 cluv-items-center" style={{ textAlign: 'center' }}>
              <div className="cluv-card-icon-wrap is-teal" style={{ width: '64px', height: '64px' }}>
                <Smartphone size={32} />
              </div>

              <div>
                <h2 className="cluv-title-card" style={{ fontSize: '20px' }}>Skincluv untuk Android</h2>
                <div className="cluv-flex-wrap cluv-gap-2 cluv-justify-center cluv-mt-2">
                  <span className="cluv-badge is-teal is-sm">Versi 1.0.0 (Build Resmi)</span>
                  <span className="cluv-badge is-gold is-sm cluv-tabular-nums">Ukuran: 24.3 MB</span>
                  <span className="cluv-badge is-sm">Android 8.0+</span>
                </div>
              </div>

              <div className="cluv-flex-col cluv-gap-3 cluv-items-center" style={{ width: '100%', maxWidth: '380px' }}>
                <a
                  href={APK_DOWNLOAD_URL}
                  download="skincluv.apk"
                  className="cluv-btn is-primary is-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Download size={18} />
                  <span>Unduh File APK Langsung</span>
                </a>

                <p className="cluv-caption cluv-text-muted">
                  Bebas iklan • Bebas biaya langganan • Terverifikasi aman
                </p>
              </div>

              <div className="cluv-trust-strip is-center cluv-mt-2">
                <span className="cluv-trust-item">
                  <ShieldCheck size={14} className="cluv-trust-icon cluv-text-teal" />
                  <span>Enkripsi Standar UU PDP</span>
                </span>
                <span className="cluv-trust-dot">•</span>
                <span className="cluv-trust-item">
                  <Zap size={14} className="cluv-trust-icon cluv-text-teal" />
                  <span>Kamera Instan Tanpa Lag</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. PANDUAN 3 LANGKAH INSTALASI */}
          <div className="cluv-section-header cluv-reveal cluv-mt-8">
            <div className="cluv-badge is-gold cluv-mb-2">
              <Sparkles size={13} />
              <span>Panduan Cepat</span>
            </div>
            <h2 className="cluv-title-section">3 Langkah Mudah Memasang APK di HP</h2>
            <p className="cluv-subtitle cluv-mt-2">
              Karena diunduh langsung dari web resmi kami, berikut cara memasangnya:
            </p>
          </div>

          <div className="cluv-grid cols-3 cluv-reveal-group cluv-mb-8">
            {/* LANGKAH 1 */}
            <div className="cluv-card">
              <div className="cluv-badge is-teal cluv-mb-3 cluv-tabular-nums">Langkah 1</div>
              <h3 className="cluv-title-card cluv-mb-2">Unduh File APK</h3>
              <p className="cluv-body cluv-text-muted">
                Klik tombol <strong>Unduh File APK Langsung</strong> di atas. File akan otomatis tersimpan di folder Unduhan (Downloads) ponsel Anda.
              </p>
            </div>

            {/* LANGKAH 2 */}
            <div className="cluv-card">
              <div className="cluv-badge is-gold cluv-mb-3 cluv-tabular-nums">Langkah 2</div>
              <h3 className="cluv-title-card cluv-mb-2">Beri Izin Instalasi</h3>
              <p className="cluv-body cluv-text-muted">
                Buka notifikasi unduhan. Jika muncul konfirmasi keamanan, pilih <strong>Tetap Download</strong> lalu aktifkan <em>"Izinkan dari sumber ini"</em>.
              </p>
            </div>

            {/* LANGKAH 3 */}
            <div className="cluv-card">
              <div className="cluv-badge is-teal cluv-mb-3 cluv-tabular-nums">Langkah 3</div>
              <h3 className="cluv-title-card cluv-mb-2">Pasang & Buka</h3>
              <p className="cluv-body cluv-text-muted">
                Ketuk tombol <strong>Install</strong>. Setelah selesai, buka aplikasi Skincluv dan login dengan akun Anda seperti biasa.
              </p>
            </div>
          </div>

          {/* 3. KEUNGGULAN VERSI MOBILE */}
          <div className="cluv-card cluv-reveal cluv-mb-8">
            <h3 className="cluv-title-card cluv-mb-4">Kenapa Lebih Nyaman Menggunakan Aplikasi?</h3>
            <div className="cluv-grid cols-2 cluv-gap-4">
              <div className="cluv-flex cluv-gap-3 cluv-items-start">
                <div className="cluv-card-icon-wrap is-teal is-sm" style={{ minWidth: '36px' }}>
                  <Camera size={18} />
                </div>
                <div>
                  <h4 className="cluv-font-bold cluv-mb-1" style={{ fontSize: '14px' }}>Akses Kamera Instan</h4>
                  <p className="cluv-body cluv-text-muted" style={{ fontSize: '13px' }}>
                    Tak ada lagi popup izin kamera browser yang sering ter-reset atau gagal mendeteksi webcam.
                  </p>
                </div>
              </div>

              <div className="cluv-flex cluv-gap-3 cluv-items-start">
                <div className="cluv-card-icon-wrap is-teal is-sm" style={{ minWidth: '36px' }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="cluv-font-bold cluv-mb-1" style={{ fontSize: '14px' }}>Lebih Hemat Kuota</h4>
                  <p className="cluv-body cluv-text-muted" style={{ fontSize: '13px' }}>
                    Tampilan antarmuka disimpan di dalam ponsel, sehingga kuota hanya digunakan saat analisis AI berjalan.
                  </p>
                </div>
              </div>

              <div className="cluv-flex cluv-gap-3 cluv-items-start">
                <div className="cluv-card-icon-wrap is-teal is-sm" style={{ minWidth: '36px' }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="cluv-font-bold cluv-mb-1" style={{ fontSize: '14px' }}>Pengalaman Lebih Mulus</h4>
                  <p className="cluv-body cluv-text-muted" style={{ fontSize: '13px' }}>
                    Navigasi layar penuh tanpa bilah alamat browser yang mengganggu pandangan mata saat membaca hasil scan.
                  </p>
                </div>
              </div>

              <div className="cluv-flex cluv-gap-3 cluv-items-start">
                <div className="cluv-card-icon-wrap is-teal is-sm" style={{ minWidth: '36px' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="cluv-font-bold cluv-mb-1" style={{ fontSize: '14px' }}>Perlindungan Privasi Penuh</h4>
                  <p className="cluv-body cluv-text-muted" style={{ fontSize: '13px' }}>
                    Mematuhi UU PDP No. 27/2022. Foto tidak disimpan sembarangan di galeri HP Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. PERTANYAAN UMUM (FAQ) */}
          <div className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-2">
              <HelpCircle size={13} />
              <span>Bantuan</span>
            </div>
            <h2 className="cluv-title-section">Pertanyaan Seputar Aplikasi Android</h2>
          </div>

          <div className="cluv-flex-col cluv-gap-3 cluv-reveal-group">
            {FAQ_LIST.map((item, idx) => (
              <div key={idx} className="cluv-card" style={{ padding: '16px 20px' }}>
                <button
                  type="button"
                  className="cluv-flex cluv-justify-between cluv-items-center"
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaq === idx}
                >
                  <span className="cluv-font-bold" style={{ fontSize: '15px' }}>{item.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaq === idx && (
                  <p className="cluv-body cluv-text-muted cluv-mt-3" style={{ fontSize: '14px' }}>
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* BOTTOM CTA */}
          <div className="cluv-card cluv-reveal cluv-mt-8" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(31, 157, 151, 0.08) 0%, rgba(20, 184, 166, 0.02) 100%)' }}>
            <h3 className="cluv-title-card cluv-mb-2">Siap Mencoba di Ponselmu?</h3>
            <p className="cluv-body cluv-text-muted cluv-mb-4" style={{ maxWidth: '480px', margin: '0 auto 16px' }}>
              Unduh sekarang dan nikmati pengalaman pemetaan kondisi kulit yang lebih praktis di meja riasmu.
            </p>
            <a
              href={APK_DOWNLOAD_URL}
              download="skincluv.apk"
              className="cluv-btn is-primary is-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={18} />
              <span>Unduh APK Sekarang (24.3 MB)</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// src/pages/public/FaqPage.tsx
// Pusat Bantuan & Tanya Jawab Sahabat Skincluv (100% Cluv Micro-Framework Standard)
// Kepatuhan: Invarian 13 (No overclaim), Invarian 18 (Prepaid pricing), Invarian 19 (Non-therapeutic)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Sparkles, CreditCard, ShieldCheck, HeartHandshake, ArrowRight, MessageSquare } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

interface FaqItem {
  id: string
  question: string
  answer: React.ReactNode
}

interface FaqCategory {
  category: string
  icon: any
  items: FaqItem[]
}

const FAQ_DATA: FaqCategory[] = [
  {
    category: 'Paket & Pembayaran Bebas Langganan',
    icon: CreditCard,
    items: [
      {
        id: 'pay-1',
        question: 'Apakah saldo rekening atau e-wallet saya akan terpotong otomatis tiap bulan?',
        answer: (
          <p>
            <strong>Sama sekali tidak — tidak ada auto-debit!</strong> Skincluv menerapkan sistem <strong>Prepaid 30-Day Pass</strong>: kamu bayar satu kali untuk mendapatkan akses penuh 30 hari via Tripay (QRIS / Virtual Account / Minimarket). Kami tidak menyimpan rekening maupun data kartu, dan tidak memiliki akses menarik dana secara berulang. Perpanjangan hanya terjadi jika kamu membeli kembali atas keputusanmu sendiri.
          </p>
        )
      },
      {
        id: 'pay-2',
        question: 'Metode pembayaran apa saja yang bisa digunakan?',
        answer: (
          <p>
            Pembayaran diproses secara resmi melalui gerbang pembayaran berizin Bank Indonesia: <strong>Tripay</strong>. Metode yang tersedia mencakup <strong>QRIS</strong> (GoPay, OVO, Dana, ShopeePay, BCA Mobile), <strong>Virtual Account Bank</strong> (BCA, Mandiri, BRI, BNI, Permata), serta gerai retail <strong>Alfamart &amp; Indomaret</strong>.
          </p>
        )
      },
      {
        id: 'pay-3',
        question: 'Bagaimana jika pembayaran saya via QRIS atau VA berstatus pending?',
        answer: (
          <p>
            Verifikasi pembayaran biasanya berlangsung instan dalam hitungan detik. Jika terjadi keterlambatan jaringan perbankan lebih dari 15 menit, silakan periksa status di riwayat transaksi atau sapa Layanan Pelanggan kami dengan melampirkan nomor referensi tagihan (contoh: <code>INV-1727...</code>) agar kami bantu cek langsung.
          </p>
        )
      },
      {
        id: 'pay-4',
        question: 'Apakah saya bisa mengajukan refund jika terjadi kendala pembayaran?',
        answer: (
          <p>
            Tentu saja. Sesuai UU Perlindungan Konsumen No. 8/1999, kami menjamin pengembalian dana 100% untuk kondisi pemotongan ganda (*double charge*) atau jika pass gagal terbit karena gangguan teknis sistem. Rincian lengkap dapat dibaca di <Link to="/refund-policy">Kebijakan Pengembalian Dana</Link>.
          </p>
        )
      }
    ]
  },
  {
    category: 'Kuota Fleksibel & Akses AI',
    icon: Sparkles,
    items: [
      {
        id: 'quota-1',
        question: 'Apa yang dimaksud dengan Kuota Universal AI?',
        answer: (
          <p>
            Universal AI adalah <strong>satu kuota fleksibel tanpa sekat</strong>. Kamu tidak perlu pusing membeli kuota terpisah untuk scan wajah dan curhat ke asisten AI. Kuota tersebut bebas kamu gunakan kapan pun untuk observasi visual kulit, cek komposisi skincare, maupun konsultasi interaktif dengan Skinsistant.
          </p>
        )
      },
      {
        id: 'quota-2',
        question: 'Apa bedanya Paket GLOW dan Paket PRO?',
        answer: (
          <p>
            Paket <strong>GLOW (Rp 25.000 / 30 hari)</strong> memberikan 100x kuota fleksibel yang sangat pas untuk evaluasi mingguan dan pemula perawatan kulit. Sementara Paket <strong>PRO (Rp 49.000 / 30 hari)</strong> memberikan 500x kuota (terasa tanpa batas), analisis layering bahan aktif pagi &amp; malam yang lebih mendalam, pencarian literatur web terverifikasi, dan Deep Memory agar AI mengingat perjalanan kulitmu lintas sesi. Cek detailnya di halaman <Link to="/paket">Pilihan Paket</Link>.
          </p>
        )
      },
      {
        id: 'quota-3',
        question: 'Bagaimana cara menggunakan Skincluv secara gratis?',
        answer: (
          <p>
            Kamu bisa langsung mendaftar akun gratis dan mengumpulkan <strong>AI Credits</strong> melalui Misi Harian—seperti check-in harian atau membaca tips edukasi singkat. Credits ini dapat digunakan untuk menikmati fitur pemindaian secara cuma-cuma tanpa perlu kartu kredit.
          </p>
        )
      }
    ]
  },
  {
    category: 'Keamanan Foto & Cerita Rahasiamu',
    icon: ShieldCheck,
    items: [
      {
        id: 'priv-1',
        question: 'Apakah foto wajah dan curhatanku aman dan tidak disebarluaskan?',
        answer: (
          <p>
            Privasimu adalah komitmen sakral kami. Foto wajah disimpan di penyimpanan tertutup (*private bucket*) yang dilindungi enkripsi data dan Row Level Security (RLS). Foto dan percakapanmu tidak bisa diakses publik dan <strong>tidak pernah diperjualbelikan kepada pihak mana pun</strong>. Kami mematuhi penuh <strong>UU Pelindungan Data Pribadi No. 27 Tahun 2022</strong>.
          </p>
        )
      },
      {
        id: 'priv-2',
        question: 'Bagaimana cara menghapus foto wajah atau rekam jejak akun saya?',
        answer: (
          <p>
            Kamu memiliki kendali penuh melalui hak *Right to be Forgotten*. Kamu bisa menghapus foto scan tertentu kapan saja dari riwayat, atau menghapus seluruh akun dan data biometrik secara permanen dan bersih melalui menu Profil Akun.
          </p>
        )
      }
    ]
  },
  {
    category: 'Batas Kami & Komitmen Kesehatan',
    icon: HeartHandshake,
    items: [
      {
        id: 'med-1',
        question: 'Apakah hasil analisis Skincluv bisa menggantikan diagnosis dokter kulit?',
        answer: (
          <p>
            <strong>Tidak bisa dan tidak boleh.</strong> Skincluv adalah perangkat lunak edukasi kosmetik non-terapeutik mandiri (UU Kesehatan No. 17/2023). Hasil pemindaian adalah observasi visual algoritmik untuk membantumu memahami sinyal kulit harian. Skincluv tidak mendiagnosis penyakit dan tidak meresepkan obat keras dokter. Bila kamu mengalami iritasi akut atau alergi berat, segera periksakan diri ke dokter spesialis dermatologi dan venereologi (Sp.DVE/Sp.KK). Baca rincian etika lengkap di <Link to="/medical-disclaimer">Penyangkalan Medis</Link>.
          </p>
        )
      }
    ]
  }
]

export default function FaqPage() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'pay-1': true,
    'quota-1': true
  })

  // Initialize buttery-smooth scroll reveal observer
  useScrollReveal()

  const toggleItem = (id: string) => {
    setOpenIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="cluv-page cluv-surface-public">
      <section className="cluv-section">
        <div className="cluv-container is-sm">
          {/* HEADER */}
          <header className="cluv-section-header cluv-reveal">
            <div className="cluv-badge is-teal cluv-mb-3">
              <Sparkles size={14} />
              <span>Tanya Jawab Sahabat</span>
            </div>
            <h1 className="cluv-title-hero">Ada yang Masih Bikin Kamu Penasaran?</h1>
            <p className="cluv-lead cluv-mt-3">
              Kami rangkum obrolan yang paling sering ditanyakan seputar cara kerja Skincluv, keamanan data wajahmu, dan kebebasan merawat diri tanpa beban.
            </p>
          </header>

          {/* FAQ ACCORDION CATEGORIES */}
          <div className="cluv-accordion-categories">
            {FAQ_DATA.map((cat, catIdx) => {
              const IconComponent = cat.icon
              return (
                <div key={catIdx} className="cluv-card cluv-reveal cluv-mb-6">
                  {/* Category Header Row */}
                  <div className="cluv-flex-row cluv-gap-3 cluv-mb-4 cluv-pb-3 cluv-border-b">
                    <div className="cluv-card-icon-wrap is-sm is-teal cluv-flex-shrink-0">
                      <IconComponent size={18} />
                    </div>
                    <h2 className="cluv-title-card cluv-m-0">{cat.category}</h2>
                  </div>

                  {/* Accordion Questions */}
                  <div className="cluv-accordion">
                    {cat.items.map((item) => {
                      const isOpen = !!openIds[item.id]
                      return (
                        <div key={item.id} className="cluv-accordion-item">
                          <button
                            type="button"
                            className="cluv-accordion-trigger"
                            onClick={() => toggleItem(item.id)}
                            aria-expanded={isOpen}
                          >
                            <span>{item.question}</span>
                            <ChevronDown size={18} className={`cluv-accordion-chevron ${isOpen ? 'rotate' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="cluv-accordion-body cluv-animate-fade">
                              {item.answer}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* BOTTOM SUPPORT CTA CARD */}
          <div className="cluv-card cluv-reveal cluv-mt-7">
            <div className="cluv-flex-between cluv-flex-wrap cluv-gap-4">
              <div className="cluv-max-w-sm">
                <h3 className="cluv-title-card cluv-mb-1">Belum menemukan jawaban yang kamu cari?</h3>
                <p className="cluv-body cluv-text-muted">
                  Jangan ragu buat menyapa sahabat Customer Support kami. Kami senang bisa mengobrol dan membantumu.
                </p>
              </div>
              <Link to="/contact" className="cluv-btn is-primary is-md">
                <MessageSquare size={16} />
                <span>Ngobrol Bareng Sahabat CS</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

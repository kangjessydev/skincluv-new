// src/pages/public/FaqPage.tsx
// Pusat Bantuan & Tanya Jawab (FAQ) Skincluv
// Kepatuhan: Invarian 13 (No overclaim), Invarian 18 (Prepaid pricing), Invarian 19 (Non-therapeutic)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ChevronDown, Sparkles, CreditCard, ShieldCheck, Stethoscope, ArrowRight, MessageSquare } from 'lucide-react'

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
    category: 'Paket Akses & Pembayaran Tripay',
    icon: CreditCard,
    items: [
      {
        id: 'pay-1',
        question: 'Apakah saldo rekening atau e-wallet saya akan terpotong otomatis tiap bulan?',
        answer: (
          <p>
            <strong>Sama sekali tidak — tidak ada auto-debit!</strong> Skincluv menerapkan sistem <strong>Prepaid 30-Day Pass</strong>: Anda membayar satu kali untuk mendapatkan akses 30 hari. Kami tidak menyimpan informasi kartu dan tidak memiliki kewenangan menarik dana secara berulang. Perpanjangan hanya terjadi bila Anda membeli kembali secara mandiri.
          </p>
        )
      },
      {
        id: 'pay-2',
        question: 'Metode pembayaran apa saja yang didukung?',
        answer: (
          <p>
            Pembayaran diproses secara resmi melalui gerbang pembayaran berizin Bank Indonesia: <strong>PT Trikarya Pratama Sukses (Tripay)</strong>. Metode yang tersedia mencakup <strong>QRIS</strong> (GoPay, OVO, Dana, ShopeePay, LinkAja, BCA Mobile), <strong>Virtual Account Bank</strong> (BRI, BCA, Mandiri, BNI, Permata), serta gerai retail <strong>Alfamart &amp; Indomaret</strong>.
          </p>
        )
      },
      {
        id: 'pay-3',
        question: 'Bagaimana jika pembayaran saya via QRIS atau Virtual Account berstatus pending?',
        answer: (
          <p>
            Verifikasi pembayaran biasanya berlangsung instan dalam hitungan detik. Jika terjadi keterlambatan jaringan perbankan hingga lebih dari 15 menit, silakan periksa status di halaman transaksi atau hubungi Layanan Pelanggan WhatsApp kami dengan melampirkan nomor referensi transaksi (contoh: <code>INV-1727...</code>) untuk rekonsiliasi manual.
          </p>
        )
      },
      {
        id: 'pay-4',
        question: 'Apakah saya bisa mengajukan refund jika terjadi kesalahan pembayaran?',
        answer: (
          <p>
            Ya. Sesuai UU Perlindungan Konsumen No. 8/1999, kami menjamin pengembalian dana penuh 100% (SLA 3 &times; 24 jam) untuk kondisi pemotongan ganda (*double charge*) atau jika pass gagal terbit karena gangguan teknis sistem internal. Rincian lengkap dapat dibaca di <Link to="/refund-policy">Kebijakan Pengembalian Dana</Link>.
          </p>
        )
      }
    ]
  },
  {
    category: 'Kuota Universal AI & Misi Koin',
    icon: Sparkles,
    items: [
      {
        id: 'quota-1',
        question: 'Apa yang dimaksud dengan Kuota Universal AI?',
        answer: (
          <p>
            Universal AI adalah <strong>satu kuota bersama yang fleksibel</strong>. Anda tidak perlu membeli kuota terpisah untuk pemindaian wajah dan percakapan chatbot. Kuota tersebut bebas Anda gunakan baik untuk AI Face Scan, Cek Komposisi Skincare, maupun konsultasi interaktif dengan asisten AI Skinsistant.
          </p>
        )
      },
      {
        id: 'quota-2',
        question: 'Apa perbedaan mendasar antara Paket GLOW dan Paket PRO?',
        answer: (
          <p>
            Paket <strong>GLOW (Rp 25.000)</strong> memberikan 100 Universal AI Uses / 30 hari yang sangat pas untuk pelajar dan pemula perawatan kulit. Sementara Paket <strong>PRO (Rp 49.000)</strong> memberikan 500 Universal AI Uses (terasa unlimited), analisis formulasi yang lebih mendalam, pencarian literatur web terverifikasi (Tavily Grounding), evaluasi barrier pH, dan deep memory percakapan lintas sesi.
          </p>
        )
      },
      {
        id: 'quota-3',
        question: 'Bagaimana cara menggunakan Skincluv secara gratis tanpa membeli paket?',
        answer: (
          <p>
            Anda dapat mendaftar akun secara gratis dan mengumpulkan <strong>AI Credits</strong> melalui Misi Harian, seperti melakukan check-in harian, membaca tips edukasi, atau memperbarui catatan profil kulit. AI Credits ini dapat digunakan untuk mengakses fitur pemindaian secara gratis.
          </p>
        )
      }
    ]
  },
  {
    category: 'Privasi & Keamanan Data Biometrik',
    icon: ShieldCheck,
    items: [
      {
        id: 'priv-1',
        question: 'Apakah foto wajah saya aman dan tidak disebarluaskan?',
        answer: (
          <p>
            Privasi Anda adalah prioritas utama kami. Citra foto wajah disimpan di storage tertutup (*private bucket*) yang dilindungi enkripsi TLS 1.3 dan Row Level Security (RLS) PostgreSQL. Foto Anda tidak dapat diakses publik dan tidak pernah diperjualbelikan kepada pihak ketiga. Kami mematuhi penuh <strong>UU Pelindungan Data Pribadi No. 27 Tahun 2022</strong>.
          </p>
        )
      },
      {
        id: 'priv-2',
        question: 'Bagaimana cara menghapus foto wajah atau rekam jejak akun saya?',
        answer: (
          <p>
            Anda memiliki kendali penuh melalui hak *Right to be Forgotten*. Anda dapat menghapus foto scan tertentu kapan saja dari riwayat, atau menghapus seluruh akun dan data biometrik secara permanen melalui menu Profil.
          </p>
        )
      }
    ]
  },
  {
    category: 'Batasan Medis & Regulasi Kesehatan',
    icon: Stethoscope,
    items: [
      {
        id: 'med-1',
        question: 'Apakah hasil analisis Skincluv dapat menggantikan diagnosis dokter kulit?',
        answer: (
          <p>
            <strong>Tidak dapat dan tidak boleh.</strong> Skincluv adalah perangkat lunak edukasi kosmetik non-terapeutik (UU Kesehatan No. 17/2023). Hasil pemindaian berupa estimasi visual algoritmik untuk memandu rutinitas skincare harian. Skincluv tidak mendiagnosis penyakit dan tidak meresepkan obat. Jika Anda memiliki keluhan kulit akut atau reaksi alergi berat, segera periksakan diri ke dokter spesialis dermatologi dan venereologi (Sp.DVE/Sp.KK). Baca rincian lengkap di <Link to="/medical-disclaimer">Penyangkalan Medis</Link>.
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

  const toggleItem = (id: string) => {
    setOpenIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="faq-page animate-fade-in">
      <div className="faq-container">
        {/* HEADER */}
        <header className="faq-header">
          <span className="faq-badge"><HelpCircle size={14} /> PUSAT BANTUAN &amp; FAQ</span>
          <h1>Pertanyaan yang Sering Diajukan</h1>
          <p className="faq-subtitle">
            Temukan jawaban lengkap seputar cara kerja kuota Universal AI, keamanan data biometrik wajah, kebijakan pembayaran Tripay, dan batasan layanan edukasi kosmetik Skincluv.
          </p>
        </header>

        {/* FAQ ACCORDION CATEGORIES */}
        <div className="faq-categories-wrapper">
          {FAQ_DATA.map((cat, catIdx) => {
            const IconComponent = cat.icon
            return (
              <section key={catIdx} className="faq-category-card">
                <div className="category-title-row">
                  <div className="category-icon-wrap">
                    <IconComponent size={20} />
                  </div>
                  <h2>{cat.category}</h2>
                </div>

                <div className="faq-items-list">
                  {cat.items.map((item) => {
                    const isOpen = !!openIds[item.id]
                    return (
                      <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                        <button
                          className="faq-question-btn"
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.question}</span>
                          <ChevronDown size={18} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="faq-answer-content animate-fade-in">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* BOTTOM SUPPORT CTA */}
        <div className="faq-support-cta">
          <div className="support-cta-text">
            <h3>Masih memiliki pertanyaan lain?</h3>
            <p>Tim Customer Support kami siap membantu kendala aktivasi pass atau pertanyaan teknis lainnya.</p>
          </div>
          <Link to="/contact" className="btn btn-primary btn-sm">
            <MessageSquare size={16} />
            <span>Hubungi Bantuan Resmi</span>
          </Link>
        </div>
      </div>

      <style>{`
        .faq-page {
          padding: 48px 0 80px;
          background: var(--color-surface-bg, #f8fafc);
          min-height: calc(100vh - 64px);
        }

        .faq-container {
          max-width: 920px;
          margin: 0 auto;
          padding: 0 var(--space-lg, 24px);
        }

        .faq-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .faq-badge {
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

        .faq-header h1 {
          font-family: var(--font-heading, sans-serif);
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 12px 0;
        }

        .faq-subtitle {
          font-size: 1rem;
          color: var(--color-text-muted, #64748b);
          max-width: 680px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .faq-categories-wrapper {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .faq-category-card {
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 28px 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        @media (min-width: 640px) {
          .faq-category-card {
            padding: 32px;
          }
        }

        .category-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .category-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #e0f2fe;
          color: var(--color-primary, #0f6784);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-title-row h2 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0;
        }

        .faq-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .faq-item {
          border: 1px solid #f1f5f9;
          border-radius: var(--radius-lg, 12px);
          overflow: hidden;
          transition: border-color 0.15s ease;
        }

        .faq-item.open {
          border-color: #cbd5e1;
          background: #fafbfc;
        }

        .faq-question-btn {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text-main, #0f172a);
          transition: color 0.15s ease;
        }

        .faq-question-btn:hover {
          color: var(--color-primary, #0f6784);
        }

        .faq-chevron {
          color: var(--color-text-muted, #94a3b8);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .faq-chevron.rotate {
          transform: rotate(180deg);
          color: var(--color-primary, #0f6784);
        }

        .faq-answer-content {
          padding: 0 20px 20px 20px;
          font-size: 0.875rem;
          color: var(--color-text-muted, #475569);
          line-height: 1.6;
        }

        .faq-answer-content p {
          margin: 0;
        }

        .faq-answer-content strong {
          color: var(--color-text-main, #0f172a);
        }

        .faq-answer-content code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8125rem;
        }

        .faq-answer-content a {
          color: var(--color-primary, #0f6784);
          font-weight: 600;
          text-decoration: underline;
        }

        /* SUPPORT CTA */
        .faq-support-cta {
          margin-top: 40px;
          background: #ffffff;
          border: 1px solid var(--color-secondary-container, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        @media (min-width: 640px) {
          .faq-support-cta {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }

        .support-cta-text h3 {
          font-family: var(--font-heading, sans-serif);
          font-size: 1rem;
          font-weight: 800;
          color: var(--color-text-main, #0f172a);
          margin: 0 0 4px 0;
        }

        .support-cta-text p {
          font-size: 0.875rem;
          color: var(--color-text-muted, #64748b);
          margin: 0;
        }
      `}</style>
    </div>
  )
}

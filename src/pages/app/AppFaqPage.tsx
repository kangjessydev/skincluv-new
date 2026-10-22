// src/pages/app/AppFaqPage.tsx
// Pusat Bantuan & Tanya Jawab Khusus Dashboard / App (100% Cluv Micro-Framework)
// Kepatuhan: Invarian 13 (No overclaim), Invarian 18 (Prepaid pricing), Invarian 19 (Non-therapeutic)

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleHelp,
  Search,
  ChevronDown,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Coins,
  MessageCircle,
  Mail,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react'

interface FaqItem {
  id: string
  category: 'paket' | 'ai' | 'privasi' | 'credits'
  categoryLabel: string
  question: string
  answer: React.ReactNode
}

const FAQ_LIST: FaqItem[] = [
  // ── 1. Paket & Pembayaran ──
  {
    id: 'pay-1',
    category: 'paket',
    categoryLabel: 'Paket & Pembayaran',
    question: 'Apakah saldo rekening atau e-wallet saya akan terpotong otomatis tiap bulan?',
    answer: (
      <p className="cluv-body cluv-m-0">
        <strong>Sama sekali tidak — Skincluv 100% bebas dari auto-debit!</strong> Sistem kami menggunakan{' '}
        <strong>Prepaid 30-Day Pass</strong>: kamu hanya membayar satu kali saat mengaktifkan paket lewat gerbang pembayaran berizin Bank Indonesia (Tripay). Tidak ada data kartu kredit atau akses debet otomatis yang tersimpan di sistem kami.
      </p>
    ),
  },
  {
    id: 'pay-2',
    category: 'paket',
    categoryLabel: 'Paket & Pembayaran',
    question: 'Apa perbedaan antara paket GLOW (Rp 25.000) dan PRO (Rp 49.000)?',
    answer: (
      <div className="cluv-flex-col cluv-gap-2">
        <p className="cluv-body cluv-m-0">
          Keduanya memberikan akses prepaid 30 hari penuh tanpa batas harian. Perbedaannya terletak pada volume kuota dan fitur kecerdasan visual:
        </p>
        <ul className="cluv-caption cluv-m-0 cluv-pl-4">
          <li><strong>Skincluv GLOW (Rp 25.000)</strong>: Mendapatkan 100x Kuota Universal AI bulanan, ideal untuk observasi kulit mingguan dan cek bahan skincare harian.</li>
          <li><strong>Skincluv PRO (Rp 49.000)</strong>: Mendapatkan 500x Kuota Universal AI, prioritas komputasi OCR vision foto kemasan kosmetik, penalaran AI mendalam tentang interaksi bahan aktif, serta Avatar PRO dengan Glowing Iridescent Ring.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'pay-3',
    category: 'paket',
    categoryLabel: 'Paket & Pembayaran',
    question: 'Bagaimana jika pembayaran saya melalui QRIS atau Virtual Account belum terverifikasi?',
    answer: (
      <p className="cluv-body cluv-m-0">
        Verifikasi pembayaran melalui Tripay biasanya instan dalam 5–15 detik. Jika status masih menunggu lebih dari 15 menit, kamu dapat memeriksa status di halaman{' '}
        <Link to="/transactions" className="cluv-link is-muted">Riwayat Tagihan</Link> atau menyapa tim dukungan kami dengan menyebutkan nomor referensi tagihan (contoh: <code>INV-...</code>).
      </p>
    ),
  },
  {
    id: 'pay-4',
    category: 'paket',
    categoryLabel: 'Paket & Pembayaran',
    question: 'Apakah pembayaran saya bisa dikembalikan (Refund)?',
    answer: (
      <p className="cluv-body cluv-m-0">
        Sesuai UU Perlindungan Konsumen No. 8/1999 dan kebijakan resmi Skincluv, kami menjamin pengembalian dana 100% jika terjadi pemotongan ganda (*double charge*) atau jika pass gagal aktif akibat kendala teknis pada sistem verifikasi gateway pembayaran.
      </p>
    ),
  },

  // ── 2. AI & Analisis Kulit ──
  {
    id: 'ai-1',
    category: 'ai',
    categoryLabel: 'AI & Analisis Kulit',
    question: 'Apa itu Kuota Universal AI (Universal AI Quota)?',
    answer: (
      <p className="cluv-body cluv-m-0">
        Universal AI Quota adalah sistem kuota fleksibel gabungan. Kamu tidak dibatasi aturan kaku (seperti "hanya 1 scan per hari"). Satu kuota universal bebas kamu gunakan untuk pemindaian wajah mandiri, verifikasi label komposisi kosmetik, maupun konsultasi intensif bersama Skinsistant AI.
      </p>
    ),
  },
  {
    id: 'ai-2',
    category: 'ai',
    categoryLabel: 'AI & Analisis Kulit',
    question: 'Apakah hasil observasi Skincluv merupakan diagnosis medis dokter spesialis kulit?',
    answer: (
      <p className="cluv-body cluv-m-0">
        <strong>Bukan.</strong> Sesuai batas regulasi (UU Kesehatan No. 17/2023 &amp; Permenkes No. 20/2019), Skincluv adalah perangkat lunak edukasi kosmetik mandiri berbasis kecerdasan buatan (*non-therapeutic cosmetic guidance*). Hasil pemindaian berupa observasi visual indikator kelembapan, minyak, dan pori, serta analisis kecocokan bahan kosmetik. Jika kamu mengalami keluhan kulit kronis atau infeksi, silakan berkonsultasi langsung ke dokter spesialis dermatologi.
      </p>
    ),
  },
  {
    id: 'ai-3',
    category: 'ai',
    categoryLabel: 'AI & Analisis Kulit',
    question: 'Mengapa foto wajah saya terkadang ditolak saat proses pemindaian?',
    answer: (
      <p className="cluv-body cluv-m-0">
        Skincluv dilengkapi fitur gerbang <em>Face Validation</em> gratis. Jika foto wajah terlalu gelap, buram, tertutup masker/kacamata, atau miring, sistem akan meminta foto ulang sebelum kredit/kuota terpotong. Ini bertujuan agar hasil analisis AI benar-benar presisi dan tidak menghasilkan analisa yang keliru.
      </p>
    ),
  },

  // ── 3. Privasi & UU PDP ──
  {
    id: 'priv-1',
    category: 'privasi',
    categoryLabel: 'Privasi & UU PDP',
    question: 'Bagaimana Skincluv melindungi data foto wajah dan privasi biometrik saya?',
    answer: (
      <p className="cluv-body cluv-m-0">
        Kami tunduk patuh pada <strong>UU Perlindungan Data Pribadi No. 27 Tahun 2022</strong>. Foto wajahmu disimpan di Cloud Storage terenkripsi privat, diproses secara anonim, dan tidak pernah dijual atau diserahkan ke pihak ketiga manapun.
      </p>
    ),
  },
  {
    id: 'priv-2',
    category: 'privasi',
    categoryLabel: 'Privasi & UU PDP',
    question: 'Bagaimana cara menggunakan Hak untuk Dihapus (Right to be Forgotten)?',
    answer: (
      <p className="cluv-body cluv-m-0">
        Kamu memegang kendali 100% atas datamu. Kamu dapat menghapus riwayat obrolan AI, menghapus riwayat scan tertentu, atau menghapus seluruh akun beserta seluruh foto biometrik secara permanen melalui halaman{' '}
        <Link to="/privacy-center" className="cluv-link is-muted">Pusat Privasi &amp; Data</Link>.
      </p>
    ),
  },

  // ── 4. AI Credits & Misi ──
  {
    id: 'cred-1',
    category: 'credits',
    categoryLabel: 'AI Credits & Misi',
    question: 'Apa perbedaan antara AI Credits dengan Kuota Universal AI paket langganan?',
    answer: (
      <p className="cluv-body cluv-m-0">
        <strong>Kuota Universal AI</strong> berasal dari paket aktifmu (GLOW atau PRO) yang otomatis di-reset setiap siklus 30 hari. Sementara <strong>AI Credits</strong> adalah saldo koin mandiri yang kamu dapatkan gratis dari menyelesaikan rutinitas di menu{' '}
        <Link to="/missions" className="cluv-link is-muted">Misi Glow</Link>. AI Credits tidak pernah kedaluwarsa dan menjadi cadangan aman saat kuota bulananmu habis.
      </p>
    ),
  },
  {
    id: 'cred-2',
    category: 'credits',
    categoryLabel: 'AI Credits & Misi',
    question: 'Bagaimana cara mengumpulkan AI Credits gratis setiap hari?',
    answer: (
      <p className="cluv-body cluv-m-0">
        Buka menu <Link to="/missions" className="cluv-link is-muted">Misi Glow</Link> di sidebar. Selesaikan misi ringan seperti melakukan observasi kulit harian (+3 Credits), cek bahan skincare baru (+3 Credits), atau konsultasi ke Skinsistant (+2 Credits). Tekan tombol "Klaim Hadiah" saat misi selesai untuk menambahkan saldo ke dompetmu!
      </p>
    ),
  },
]

type CategoryKey = 'all' | 'paket' | 'ai' | 'privasi' | 'credits'

export default function AppFaqPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openIds, setOpenIds] = useState<string[]>(['pay-1'])

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const filteredFaqs = useMemo(() => {
    return FAQ_LIST.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* ── HEADER HALAMAN ── */}
      <header className="cluv-mb-6">
        <div className="cluv-badge is-teal cluv-mb-2">
          <CircleHelp size={14} />
          <span>PUSAT BANTUAN SAHABAT</span>
        </div>
        <h1 className="cluv-title-section cluv-m-0">Bantuan &amp; Tanya Jawab</h1>
        <p className="cluv-subtitle cluv-mt-1">
          Jawaban praktis dan transparan seputar paket akses, kuota AI, verifikasi pembayaran Tripay, dan keamanan datamu.
        </p>
      </header>

      {/* ── SEARCH & CATEGORY FILTER ── */}
      <div className="cluv-card cluv-mb-6">
        <div className="cluv-field cluv-mb-4">
          <div className="cluv-input-wrap">
            <Search size={18} className="cluv-input-icon cluv-text-muted" />
            <input
              type="text"
              className="cluv-input"
              placeholder="Cari pertanyaan... (contoh: auto-debit, refund, kuota, qris, privasi foto)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Filter Kategori */}
        <div className="cluv-tabs">
          <button
            type="button"
            className={`cluv-tab-btn ${activeCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span>Semua Tanya Jawab</span>
            <span className="cluv-tab-badge">{FAQ_LIST.length}</span>
          </button>
          <button
            type="button"
            className={`cluv-tab-btn ${activeCategory === 'paket' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('paket')}
          >
            <span>Paket &amp; Pembayaran</span>
          </button>
          <button
            type="button"
            className={`cluv-tab-btn ${activeCategory === 'ai' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('ai')}
          >
            <span>AI &amp; Analisis Kulit</span>
          </button>
          <button
            type="button"
            className={`cluv-tab-btn ${activeCategory === 'privasi' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('privasi')}
          >
            <span>Privasi &amp; UU PDP</span>
          </button>
          <button
            type="button"
            className={`cluv-tab-btn ${activeCategory === 'credits' ? 'is-active' : ''}`}
            onClick={() => setActiveCategory('credits')}
          >
            <span>Credits &amp; Misi</span>
          </button>
        </div>
      </div>

      {/* ── DAFTAR FAQ ACCORDIONS ── */}
      <div className="cluv-accordion cluv-mb-6">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id)
            return (
              <div key={faq.id} className="cluv-accordion-item">
                <button
                  type="button"
                  className="cluv-accordion-trigger"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                >
                  <div className="cluv-flex-row cluv-items-center cluv-gap-3 cluv-text-left">
                    <span className="cluv-badge is-slate is-sm" style={{ flexShrink: 0 }}>
                      {faq.categoryLabel}
                    </span>
                    <span className="cluv-title-card cluv-m-0" style={{ fontSize: '1rem' }}>
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    className="cluv-accordion-chevron"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {isOpen && (
                  <div className="cluv-accordion-body">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="cluv-card cluv-text-center cluv-py-8">
            <CircleHelp size={32} className="cluv-text-muted cluv-mb-2" />
            <h4 className="cluv-title-card cluv-m-0">Pertanyaan tidak ditemukan</h4>
            <p className="cluv-caption cluv-text-muted cluv-mt-1">
              Tidak ada jawaban yang cocok dengan kata kunci "{searchQuery}". Coba kata kunci lain atau tanyakan langsung pada AI.
            </p>
            <button
              type="button"
              className="cluv-btn is-outline is-sm cluv-mt-3"
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('all')
              }}
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>

      {/* ── BANTUAN TAMBAHAN & CTA CHAT AI ── */}
      <div className="cluv-card is-highlight">
        <div className="cluv-flex-between cluv-items-center cluv-flex-wrap cluv-gap-4">
          <div className="cluv-flex-row cluv-items-center cluv-gap-4">
            <div className="cluv-card-icon-wrap is-lg is-teal">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="cluv-title-card cluv-m-0">Masih punya pertanyaan yang belum terjawab?</h3>
              <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                Skinsistant AI siap diajak berdiskusi 24/7, atau hubungi tim Customer Support kami untuk bantuan kendala pembayaran.
              </p>
            </div>
          </div>

          <div className="cluv-flex-row cluv-gap-2">
            <Link to="/chatbot" className="cluv-btn is-primary is-sm">
              <Sparkles size={14} /> Tanya Skinsistant AI
            </Link>
            <a
              href="mailto:support@skincluv.com?subject=Pertanyaan%20Skincluv"
              className="cluv-btn is-outline is-sm"
            >
              <Mail size={14} /> Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

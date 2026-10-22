// src/pages/app/AppFaqPage.tsx
// Pusat Bantuan & Tanya Jawab Khusus Dashboard / App (Unified Bento Cards — Opsi 1)
// 100% Pure Cluv Micro-Framework, Zero Inline Styles, Zero Raw Emojis, No Accordion Duplication
// Kepatuhan: Invarian 13 (Defensible claims), Invarian 18 (Prepaid pricing), Invarian 19 (Non-therapeutic)

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
  Zap,
  Camera,
  Crown,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

export interface FaqItem {
  id: string
  category: 'paket' | 'ai' | 'privasi' | 'credits'
  categoryLabel: string
  isPopular?: boolean
  icon: React.ReactNode
  question: string
  answer: React.ReactNode
  tags: string[]
}

const FAQ_LIST: FaqItem[] = [
  // ── 1. Paket, Tagihan & Pembayaran ──
  {
    id: 'pay-1',
    category: 'paket',
    categoryLabel: 'Paket & Tagihan',
    isPopular: true,
    icon: <Zap size={18} />,
    question: 'Apakah saldo rekening atau e-wallet saya akan terpotong otomatis tiap bulan?',
    tags: ['auto debit', 'autodebit', 'langganan', 'tagihan', 'tripay', 'potong'],
    answer: (
      <div className="cluv-flex-col cluv-gap-2">
        <p className="cluv-body cluv-m-0">
          <strong>Sama sekali tidak — Skincluv 100% bebas dari auto-debit!</strong> Sistem kami menggunakan{' '}
          <strong>Prepaid 30-Day Pass</strong>: kamu hanya membayar satu kali saat mengaktifkan paket lewat gerbang pembayaran berizin resmi Bank Indonesia (Tripay).
        </p>
        <p className="cluv-body cluv-m-0">
          Tidak ada data kartu kredit yang tersimpan di sistem kami, dan tidak ada tagihan susulan diam-diam saat masa aktif 30 hari selesai. Jika masa aktif habis, akunmu otomatis kembali ke tier dasar Free Explorer tanpa denda apapun.
        </p>
      </div>
    ),
  },
  {
    id: 'pay-2',
    category: 'paket',
    categoryLabel: 'Paket & Tagihan',
    isPopular: true,
    icon: <Crown size={18} />,
    question: 'Apa perbedaan utama antara paket Skincluv GLOW dan Skincluv PRO?',
    tags: ['glow', 'pro', 'premium', 'beda', 'harga', 'perbedaan', 'kuota'],
    answer: (
      <div className="cluv-flex-col cluv-gap-3">
        <p className="cluv-body cluv-m-0">
          Keduanya adalah paket akses prabayar 30 hari tanpa batasan frekuensi harian. Perbedaan utamanya ada pada kapasitas kuota dan pendampingan AI:
        </p>
        <div className="cluv-grid cols-2 cluv-gap-3">
          <div className="cluv-card is-compact cluv-flex-col cluv-gap-1">
            <Badge variant="teal" size="sm">Skincluv GLOW (Rp 25.000)</Badge>
            <span className="cluv-caption cluv-font-bold cluv-mt-1">Smart Starter (~Rp 830/hari)</span>
            <span className="cluv-micro cluv-text-muted">
              Mendapatkan 100 Kuota Universal AI. Ideal untuk observasi kulit 1–2 kali per minggu dan cek kecocokan botol kosmetik baru.
            </span>
          </div>
          <div className="cluv-card is-compact cluv-flex-col cluv-gap-1">
            <Badge variant="gold" size="sm">Skincluv PRO (Rp 49.000)</Badge>
            <span className="cluv-caption cluv-font-bold cluv-mt-1">Paling Diminati (~Rp 1.600/hari)</span>
            <span className="cluv-micro cluv-text-muted">
              Mendapatkan 500 Kuota Universal AI (5x lipat) + <strong>Akses Penuh Skinsistant AI Chatbot Sepuasnya</strong> untuk konsultasi formulasi kapanpun.
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'pay-3',
    category: 'paket',
    categoryLabel: 'Paket & Tagihan',
    icon: <CreditCard size={18} />,
    question: 'Bagaimana jika pembayaran saya melalui QRIS atau Virtual Account belum terverifikasi?',
    tags: ['qris', 'va', 'bca', 'mandiri', 'bri', 'pending', 'menunggu', 'tripay', 'verifikasi'],
    answer: (
      <div className="cluv-flex-col cluv-gap-2">
        <p className="cluv-body cluv-m-0">
          Verifikasi pembayaran melalui Tripay biasanya instan dalam 5–15 detik setelah transfer berhasil. Jika status tagihan masih tertahan "Menunggu Pembayaran":
        </p>
        <ul className="cluv-caption cluv-m-0 cluv-pl-4 cluv-flex-col cluv-gap-1">
          <li>Buka halaman <Link to="/transactions" className="cluv-link">Riwayat Tagihan</Link> dan klik tombol <strong>"Cek Status"</strong> untuk memicu sinkronisasi manual gateway.</li>
          <li>Pastikan nominal transfer sesuai persis hingga 3 digit kode unik (bila menggunakan metode transfer manual).</li>
          <li>Jika dalam 15 menit status belum berubah, hubungi Customer Support kami dengan melampirkan nomor referensi tagihan (contoh: <code>INV-PRO-...</code>).</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'pay-4',
    category: 'paket',
    categoryLabel: 'Paket & Tagihan',
    icon: <CreditCard size={18} />,
    question: 'Apakah pembayaran saya bisa dikembalikan (Kebijakan Refund)?',
    tags: ['refund', 'kembali', 'dana', 'batal', 'uang'],
    answer: (
      <p className="cluv-body cluv-m-0">
        Sesuai UU Perlindungan Konsumen No. 8/1999 dan kebijakan resmi Skincluv, kami menjamin pengembalian dana 100% jika terjadi pemotongan saldo ganda (*double charge*) atau jika paket akses gagal aktif akibat kendala sinkronisasi gateway pembayaran. Pengajuan refund dapat dilakukan via email ke <code>support@skincluv.com</code> dengan menyertakan bukti mutasi bank.
      </p>
    ),
  },
  {
    id: 'pay-5',
    category: 'paket',
    categoryLabel: 'Paket & Tagihan',
    icon: <CreditCard size={18} />,
    question: 'Dapatkah saya upgrade dari paket GLOW ke PRO sebelum masa aktif 30 hari berakhir?',
    tags: ['upgrade', 'pindah', 'naik', 'glow ke pro', 'tambah'],
    answer: (
      <p className="cluv-body cluv-m-0">
        Bisa! Kamu dapat langsung memilih paket <strong>Skincluv PRO</strong> di menu <Link to="/paket" className="cluv-link">Kelola Paket</Link> kapan saja. Saat upgrade berhasil, sisa masa aktif akan diperpanjang 30 hari penuh dan kuotamu langsung bertambah menjadi 500 Kuota Universal AI.
      </p>
    ),
  },

  // ── 2. AI, Analisis Kulit & Kamera ──
  {
    id: 'ai-1',
    category: 'ai',
    categoryLabel: 'AI & Analisis Kulit',
    isPopular: true,
    icon: <Camera size={18} />,
    question: 'Mengapa foto wajah saya terkadang ditolak saat proses pemindaian?',
    tags: ['foto ditolak', 'buram', 'gelap', 'kamera', 'face validation', 'gagal scan'],
    answer: (
      <div className="cluv-flex-col cluv-gap-2">
        <p className="cluv-body cluv-m-0">
          Skincluv memiliki gerbang perlindungan <strong>Face Validation (0 Kredit / Gratis)</strong>. Sistem akan menolak foto sebelum kuota/kreditmu terpotong apabila:
        </p>
        <ul className="cluv-caption cluv-m-0 cluv-pl-4 cluv-flex-col cluv-gap-1">
          <li>Pencahayaan terlalu redup, backlight kuat, atau wajah tidak menghadap lurus ke depan.</li>
          <li>Lensa kamera buram atau resolusi foto terlalu rendah.</li>
          <li>Wajah tertutup sebagian oleh masker, kacamata hitam, atau rambut tebal.</li>
        </ul>
        <p className="cluv-body cluv-m-0 cluv-mt-1">
          Hal ini kami rancang demi melindungi pengguna agar tidak membuang kuota berharga pada foto yang tidak memenuhi standar observasi visual dermatologi.
        </p>
      </div>
    ),
  },
  {
    id: 'ai-2',
    category: 'ai',
    categoryLabel: 'AI & Analisis Kulit',
    icon: <Sparkles size={18} />,
    question: 'Apa itu Kuota Universal AI (Universal AI Quota)?',
    tags: ['kuota universal', 'universal ai', 'cara kerja kuota', 'hitung kuota'],
    answer: (
      <div className="cluv-flex-col cluv-gap-2">
        <p className="cluv-body cluv-m-0">
          <strong>Universal AI Quota</strong> adalah kuota terpadu yang fleksibel. Tidak ada batasan kaku harian; kamu bebas membagi pemakaian kuota sesuai kebutuhan pribadi:
        </p>
        <ul className="cluv-caption cluv-m-0 cluv-pl-4 cluv-flex-col cluv-gap-1">
          <li><strong>1x Scan Wajah AI</strong> = 5 Kuota Universal (termasuk analisis pori, kelembapan, sebum, dan tren).</li>
          <li><strong>1x Scan Komposisi Skincare</strong> = 3 Kuota Universal (OCR vision label botol + analisis kontraindikasi bahan aktif).</li>
          <li><strong>Tanya Jawab Skinsistant AI</strong> = Gratis tanpa batas bagi pengguna paket PRO.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'ai-3',
    category: 'ai',
    categoryLabel: 'AI & Analisis Kulit',
    icon: <Sparkles size={18} />,
    question: 'Apakah hasil analisis Skincluv merupakan diagnosis medis dokter spesialis kulit?',
    tags: ['medis', 'dokter', 'diagnosis', 'resep', 'klinis', 'obat', 'hukum'],
    answer: (
      <p className="cluv-body cluv-m-0">
        <strong>Bukan.</strong> Sesuai batas regulasi kesehatan (UU Kesehatan No. 17/2023 &amp; Permenkes No. 20/2019), Skincluv beroperasi sebagai panduan kosmetik mandiri berbasis kecerdasan buatan (<em>non-therapeutic cosmetic observation</em>). Hasil analisis berupa pemetaan kondisi visual kelembapan dan keamanan formula kosmetik. Skincluv tidak mengeluarkan resep obat keras dan bukan pengganti konsultasi tatap muka dengan dokter spesialis dermatologi.
      </p>
    ),
  },
  {
    id: 'ai-4',
    category: 'ai',
    categoryLabel: 'AI & Analisis Kulit',
    icon: <Sparkles size={18} />,
    question: 'Bagaimana cara AI mendeteksi bahaya interaksi bahan aktif skincare?',
    tags: ['bahan aktif', 'interaksi', 'retinol', 'aha bha', 'layering', 'botol'],
    answer: (
      <p className="cluv-body cluv-m-0">
        Mesin OCR Vision kami membaca daftar komposisi (*ingredients list*) pada botol atau kemasan kosmetik, lalu mencocokkannya ke basis data interaksi deterministik terverifikasi. Jika ada kombinasi yang berpotensi memicu iritasi (seperti Retinol bersamaan dengan AHA/BHA konsentrasi tinggi), sistem akan langsung memberikan kartu peringatan kuning/merah beserta anjuran pemakaian bertahap.
      </p>
    ),
  },

  // ── 3. Privasi, Foto Biometrik & UU PDP ──
  {
    id: 'priv-1',
    category: 'privasi',
    categoryLabel: 'Privasi & UU PDP',
    isPopular: true,
    icon: <ShieldCheck size={18} />,
    question: 'Bagaimana Skincluv melindungi data foto wajah dan privasi biometrik saya?',
    tags: ['privasi', 'uu pdp', 'foto', 'biometrik', 'keamanan', 'enkripsi', 'bocor'],
    answer: (
      <div className="cluv-flex-col cluv-gap-2">
        <p className="cluv-body cluv-m-0">
          Skincluv tunduk patuh penuh pada <strong>UU Perlindungan Data Pribadi No. 27 Tahun 2022</strong>. Kami menerapkan prinsip minimalisasi data yang ketat:
        </p>
        <ul className="cluv-caption cluv-m-0 cluv-pl-4 cluv-flex-col cluv-gap-1">
          <li>Foto wajah diisolasi di Cloud Storage terenkripsi privat dan hanya bisa diakses oleh akun pemilik melalui token URL bertenggat waktu singkat (Signed URL).</li>
          <li>Customer Support dan tim non-klinis dilarang keras mengakses foto wajah pengguna.</li>
          <li>Foto wajahmu <strong>tidak pernah dijual</strong> atau digunakan untuk melatih model publik pihak ketiga tanpa izin eksplisit.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'priv-2',
    category: 'privasi',
    categoryLabel: 'Privasi & UU PDP',
    icon: <ShieldCheck size={18} />,
    question: 'Bagaimana cara menggunakan Hak untuk Dihapus (Right to be Forgotten)?',
    tags: ['hapus akun', 'hapus data', 'right to be forgotten', 'lupa', 'musnahkan'],
    answer: (
      <p className="cluv-body cluv-m-0">
        Kamu memegang kendali 100% atas datamu. Kamu dapat menghapus riwayat obrolan AI, menghapus riwayat foto scan tertentu, atau memusnahkan seluruh akun beserta seluruh foto biometrik secara permanen melalui menu{' '}
        <Link to="/profile/privacy" className="cluv-link">Pusat Privasi &amp; Data</Link>. Seluruh foto fisik di cloud storage akan dimusnahkan seketika.
      </p>
    ),
  },
  {
    id: 'priv-3',
    category: 'privasi',
    categoryLabel: 'Privasi & UU PDP',
    icon: <ShieldCheck size={18} />,
    question: 'Apakah riwayat percakapan konsultasi dengan Skinsistant AI bersifat rahasia?',
    tags: ['chat', 'percakapan', 'rahasia', 'curhat', 'memori'],
    answer: (
      <p className="cluv-body cluv-m-0">
        Ya, seluruh riwayat percakapan bersifat privat. Skincluv menyediakan tombol toggle <em>Memory Consent</em> di halaman chatbot. Jika kamu mematikan toggle ini, seluruh ringkasan memori percakapan akan otomatis dibersihkan dan AI tidak akan mengingat konteks obrolan masa lalu.
      </p>
    ),
  },

  // ── 4. AI Credits, Koin & Misi Harian ──
  {
    id: 'cred-1',
    category: 'credits',
    categoryLabel: 'Credits & Misi',
    icon: <Coins size={18} />,
    question: 'Apa perbedaan antara AI Credits (Koin) dengan Kuota Universal AI?',
    tags: ['credits', 'koin', 'kuota', 'misi', 'beda credits'],
    answer: (
      <div className="cluv-flex-col cluv-gap-2">
        <p className="cluv-body cluv-m-0">
          <strong>Kuota Universal AI</strong> adalah fasilitas bulanan dari paket aktifmu (GLOW atau PRO) yang otomatis diperbarui setiap siklus 30 hari.
        </p>
        <p className="cluv-body cluv-m-0">
          Sementara <strong>AI Credits</strong> adalah saldo koin permanen yang kamu dapatkan secara cuma-cuma dari menyelesaikan misi harian di <Link to="/missions" className="cluv-link">Misi Glow</Link>. AI Credits tidak memiliki tanggal kedaluwarsa dan otomatis menjadi saldo cadangan ketika kuota paket bulananmu habis.
        </p>
      </div>
    ),
  },
  {
    id: 'cred-2',
    category: 'credits',
    categoryLabel: 'Credits & Misi',
    icon: <Coins size={18} />,
    question: 'Bagaimana cara mengumpulkan AI Credits gratis setiap hari?',
    tags: ['credits gratis', 'klaim hadiah', 'misi harian', 'koin gratis'],
    answer: (
      <p className="cluv-body cluv-m-0">
        Buka menu <Link to="/missions" className="cluv-link">Misi Glow</Link> di navigasi aplikasi. Selesaikan misi ringan seperti observasi kulit harian (+3 Credits), scan bahan skincare baru (+3 Credits), atau tanya Skinsistant (+2 Credits). Setelah misi berstatus selesai, klik tombol <strong>"Klaim Hadiah"</strong> untuk memasukkan kredit langsung ke akunmu.
      </p>
    ),
  },
  {
    id: 'cred-3',
    category: 'credits',
    categoryLabel: 'Credits & Misi',
    icon: <Coins size={18} />,
    question: 'Apa yang terjadi jika Kuota Universal AI bulanan saya habis sebelum 30 hari?',
    tags: ['kuota habis', 'tambah kuota', 'habis', 'saldo habis'],
    answer: (
      <p className="cluv-body cluv-m-0">
        Jika Kuota Universal AI paketmu habis, sistem secara otomatis akan menggunakan saldo <strong>AI Credits</strong> yang kamu kumpulkan dari Misi Glow. Kamu juga dapat melakukan perpanjangan paket atau upgrade ke tier PRO kapan saja untuk mendapatkan suntikan 500 kuota baru seketika.
      </p>
    ),
  },
]

type CategoryKey = 'all' | 'paket' | 'ai' | 'privasi' | 'credits'

const CATEGORY_TABS: { key: CategoryKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Semua Pertanyaan', icon: <CircleHelp size={14} /> },
  { key: 'paket', label: 'Paket & Tagihan', icon: <CreditCard size={14} /> },
  { key: 'ai', label: 'AI & Analisis Kulit', icon: <Sparkles size={14} /> },
  { key: 'privasi', label: 'Privasi & UU PDP', icon: <ShieldCheck size={14} /> },
  { key: 'credits', label: 'Credits & Misi', icon: <Coins size={14} /> },
]

const QUICK_SEARCH_CHIPS = [
  { label: 'Bebas Auto-Debit', query: 'auto debit', icon: <Zap size={13} /> },
  { label: 'Beda GLOW vs PRO', query: 'glow vs pro', icon: <Crown size={13} /> },
  { label: 'Foto Ditolak', query: 'foto ditolak', icon: <Camera size={13} /> },
  { label: 'Privasi Foto (UU PDP)', query: 'privasi', icon: <ShieldCheck size={13} /> },
  { label: 'AI Credits Gratis', query: 'credits gratis', icon: <Coins size={13} /> },
]

export default function AppFaqPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openIds, setOpenIds] = useState<string[]>(['pay-1'])

  // Filter FAQ berdasarkan kategori & live search query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return FAQ_LIST.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      if (!q) return matchesCategory

      const matchesSearch =
        item.question.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.tags.some((t) => t.includes(q))

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  // Toggle card expansion in-place
  const toggleCard = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Pilih quick topic chip
  const handleSelectQuickChip = (query: string) => {
    setSearchQuery(query)
    setActiveCategory('all')
    const match = FAQ_LIST.find((f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.tags.some((t) => t.includes(query.toLowerCase()))
    )
    if (match && !openIds.includes(match.id)) {
      setOpenIds((prev) => [...prev, match.id])
    }
  }

  // Reset pencarian
  const handleResetSearch = () => {
    setSearchQuery('')
    setActiveCategory('all')
    setOpenIds(['pay-1'])
  }

  return (
    <div className="cluv-canvas-grid cluv-animate-fade">
      {/* ── 1. HEADER HALAMAN FOKUS ── */}
      <header className="cluv-mb-6">
        <div className="cluv-badge is-teal is-sm cluv-mb-2">
          <CircleHelp size={13} />
          <span>PUSAT BANTUAN SAHABAT</span>
        </div>
        <h1 className="cluv-title-section cluv-m-0">Bantuan &amp; Tanya Jawab</h1>
        <p className="cluv-subtitle cluv-mt-1">
          Temukan jawaban langsung seputar paket prabayar, kuota analisis AI, verifikasi Tripay, dan keamanan datamu.
        </p>
      </header>

      {/* ── 2. SEARCH BAR & QUICK TOPIC CHIPS ── */}
      <div className="cluv-card cluv-mb-6">
        {/* Search Input dengan class resmi Cluv FW (has-leading-icon & is-leading) */}
        <div className="cluv-field cluv-mb-3">
          <div className="cluv-input-wrap has-leading-icon has-trailing-icon">
            <Search size={18} className="cluv-input-icon is-leading" />
            <input
              type="text"
              className="cluv-input"
              placeholder="Cari kendala atau pertanyaan... (contoh: refund, auto debit, scan ditolak, kuota)"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                setSearchQuery(val)
                if (val.trim().length > 1) {
                  const match = FAQ_LIST.find((f) =>
                    f.question.toLowerCase().includes(val.toLowerCase()) ||
                    f.tags.some((t) => t.includes(val.toLowerCase()))
                  )
                  if (match && !openIds.includes(match.id)) {
                    setOpenIds((prev) => [...prev, match.id])
                  }
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="cluv-input-icon is-trailing"
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Topic Chips (SVG Icons murni, Zero Emoji) */}
        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-flex-wrap">
          <span className="cluv-micro cluv-font-bold cluv-text-muted cluv-flex-row cluv-items-center cluv-gap-1">
            <SlidersHorizontal size={13} />
            Topik Hangat:
          </span>
          <div className="cluv-chip-group cluv-flex-1">
            {QUICK_SEARCH_CHIPS.map((chip) => {
              const isActive = searchQuery.toLowerCase() === chip.query.toLowerCase()
              return (
                <button
                  key={chip.label}
                  type="button"
                  className={`cluv-chip is-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelectQuickChip(chip.query)}
                >
                  {chip.icon}
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 3. FILTER TAB KATEGORI TEMATIK ── */}
      <div className="cluv-tabs cluv-mb-5 cluv-w-full">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.key
          const count = tab.key === 'all'
            ? FAQ_LIST.length
            : FAQ_LIST.filter((f) => f.category === tab.key).length

          return (
            <button
              key={tab.key}
              type="button"
              className={`cluv-tab-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                setActiveCategory(tab.key)
                setSearchQuery('')
              }}
            >
              <span className="cluv-flex-row cluv-items-center cluv-gap-1.5">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
              <span className="cluv-tab-badge">{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── 4. UNIFIED BENTO CARDS GRID (ZERO ACCORDION DUMP) ── */}
      {filteredFaqs.length > 0 ? (
        <div className="cluv-grid cols-2 cluv-gap-4 cluv-mb-6">
          {filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id)

            return (
              <div
                key={faq.id}
                className={`cluv-card is-interactive cluv-flex-col cluv-justify-between ${
                  faq.isPopular ? 'is-highlight' : ''
                }`}
                onClick={() => toggleCard(faq.id)}
              >
                <div>
                  {/* Header Kartu: Icon + Badge Kategori / Populer */}
                  <div className="cluv-flex-between cluv-items-center cluv-mb-3">
                    <div className={`cluv-card-icon-wrap is-sm ${faq.isPopular ? 'is-gold' : 'is-teal'}`}>
                      {faq.icon}
                    </div>

                    <div className="cluv-flex-row cluv-items-center cluv-gap-1.5">
                      {faq.isPopular && (
                        <Badge variant="gold" size="sm">
                          Topik Populer
                        </Badge>
                      )}
                      <Badge variant="slate" size="sm">
                        {faq.categoryLabel}
                      </Badge>
                    </div>
                  </div>

                  {/* Judul Pertanyaan */}
                  <h3 className="cluv-title-card cluv-m-0 cluv-mb-2">
                    {faq.question}
                  </h3>

                  {/* Jawaban yang Mengembang Langsung di Tempat (In-Place) */}
                  {isOpen ? (
                    <div className="cluv-pt-3 cluv-mt-3 cluv-border-t cluv-animate-fade">
                      {faq.answer}
                    </div>
                  ) : (
                    <p className="cluv-caption cluv-text-muted cluv-m-0">
                      Klik untuk membaca penjelasan lengkap...
                    </p>
                  )}
                </div>

                {/* Footer Kartu: Toggle Status */}
                <div className="cluv-pt-3 cluv-mt-3 cluv-border-t cluv-flex-between cluv-items-center">
                  <span className={`cluv-micro cluv-font-bold ${isOpen ? 'cluv-text-muted' : 'cluv-text-teal'}`}>
                    {isOpen ? 'Tutup Penjelasan ↑' : 'Buka Penjelasan Lengkap ↓'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`cluv-text-teal ${isOpen ? 'rotate' : ''}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State Pencarian */
        <div className="cluv-card cluv-text-center cluv-p-6 cluv-mb-6">
          <div className="cluv-card-icon-wrap is-lg is-slate cluv-mx-auto cluv-mb-3">
            <CircleHelp size={28} />
          </div>
          <h3 className="cluv-title-card cluv-m-0">Pertanyaan Tidak Ditemukan</h3>
          <p className="cluv-caption cluv-text-muted cluv-mt-1 cluv-max-w-md cluv-mx-auto">
            Tidak ada jawaban yang cocok dengan kata kunci "<strong>{searchQuery}</strong>". Kamu bisa mereset pencarian atau menanyakannya langsung ke asisten AI kami.
          </p>

          <div className="cluv-flex-center cluv-gap-3 cluv-mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSearch}
            >
              Reset Pencarian
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Sparkles size={14} />}
              to={`/chatbot?initial=${encodeURIComponent(searchQuery)}`}
            >
              Tanyakan ke Skinsistant AI
            </Button>
          </div>
        </div>
      )}

      {/* ── 5. JEMBATAN KE SKINSISTANT AI & CUSTOMER SUPPORT ── */}
      <div className="cluv-card is-highlight cluv-mb-6">
        <div className="cluv-flex-responsive cluv-gap-4">
          <div className="cluv-flex-row cluv-items-center cluv-gap-4">
            <div className="cluv-card-icon-wrap is-lg is-teal">
              <MessageCircle size={24} />
            </div>
            <div className="cluv-flex-col cluv-gap-0.5">
              <h3 className="cluv-title-card cluv-m-0">Masih punya pertanyaan yang belum terjawab?</h3>
              <p className="cluv-caption cluv-text-muted cluv-m-0">
                Skinsistant AI siap berdiskusi edukatif 24/7, atau hubungi tim bantuan kami untuk kendala verifikasi transaksi.
              </p>
            </div>
          </div>

          <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-w-full-mobile">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Sparkles size={14} />}
              to="/chatbot"
              className="cluv-flex-1-mobile"
            >
              Tanya Skinsistant AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Mail size={14} />}
              href="mailto:support@skincluv.com?subject=Bantuan%20Aplikasi%20Skincluv"
              className="cluv-flex-1-mobile"
            >
              Email Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

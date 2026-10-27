// src/pages/DesignSystemPage.tsx
// 🏛️ Skincluv Living Documentation & Design System Portal
// Page-Based Architecture: Each sidebar item navigates to its own dedicated page.

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Check,
  Copy,
  Smartphone,
  Tablet,
  Monitor,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Receipt,
  Scan,
  FlaskConical,
  Sun,
  History,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  X,
  Flame,
  Zap,
  Lock,
  CreditCard,
  Bot,
} from 'lucide-react'
import { Alert, Badge, Button, EmptyState } from '@/components/ui'
import '@/styles/cluv/docs.css'

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

interface NavSection {
  id: string
  title: string
  group: string
}

const NAV_SECTIONS: NavSection[] = [
  // 1. Getting Started
  { id: 'overview', title: 'Filosofi & Invarian', group: 'Getting Started' },
  { id: 'tokens', title: 'Design Tokens & Warna', group: 'Getting Started' },
  { id: 'breakpoints', title: 'Breakpoints Resmi', group: 'Getting Started' },

  // 2. Arsitektur & Doktrin (Fase 1)
  { id: 'generic-vs-exclusive', title: 'Generic vs Eksklusif Style', group: 'Arsitektur & Doktrin' },
  { id: 'public-vs-app', title: 'Public vs App Consensus', group: 'Arsitektur & Doktrin' },
  { id: 'mobile-app-first', title: 'Doktrin Mobile App-First', group: 'Arsitektur & Doktrin' },
  { id: 'anti-hallucination', title: 'Kamus Anti-Halusinasi', group: 'Arsitektur & Doktrin' },

  // 3. Layout (App & Public)
  { id: 'canvases', title: '3 Kanvas Kanonikal (App)', group: 'Layout' },
  { id: 'public-containers', title: 'Containers & Sections (Public)', group: 'Layout' },
  { id: 'bento-grid', title: 'Bento Grid System', group: 'Layout' },
  { id: 'utilities-suite', title: 'Utilities (Spacing & Flex)', group: 'Layout' },

  // 4. Components
  { id: 'buttons', title: 'Button Component', group: 'Components' },
  { id: 'badges', title: 'Badge Component', group: 'Components' },
  { id: 'alerts', title: 'Alert & Banner (Slot)', group: 'Components' },
  { id: 'cards', title: 'Bento & Standard Cards', group: 'Components' },
  { id: 'card-strips', title: 'Card Strip & Action Tile', group: 'Components' },
  { id: 'accordions', title: 'Accordion Component', group: 'Components' },
  { id: 'modals', title: 'Modal Dialog', group: 'Components' },
  { id: 'stats', title: 'Stat & Metric Cards', group: 'Components' },
  { id: 'checklist', title: 'Inset Checklist Routine', group: 'Components' },
  { id: 'trust-strip', title: 'Trust Strip & Reassurance', group: 'Components' },
  { id: 'loading-states', title: 'Loading & Empty States', group: 'Components' },

  // 5. Navigation & Forms
  { id: 'tabs', title: 'Segmented Tabs', group: 'Navigation & Forms' },
  { id: 'forms', title: 'Form Inputs & Fields', group: 'Navigation & Forms' },

  // 6. AI Council & Memory
  { id: 'ai-skill-viewer', title: 'AI Skill Inspector (SKILL.md)', group: 'AI Memory Hub' },
]

export default function DesignSystemPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activePage = searchParams.get('page') || 'overview'

  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeTabDemo, setActiveTabDemo] = useState<'face' | 'ingredient'>('face')
  const [searchQuery, setSearchQuery] = useState('')
  const [openAccordion, setOpenAccordion] = useState<number | null>(1)
  const [showModalDemo, setShowModalDemo] = useState(false)
  const [checkedMissions, setCheckedMissions] = useState<Record<number, boolean>>({ 1: true, 2: false, 3: false })
  const [selectedCanvasType, setSelectedCanvasType] = useState<'A' | 'B' | 'C'>('A')
  const [activeSpacingStep, setActiveSpacingStep] = useState<number>(4)

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleNavigate = (pageId: string) => {
    setSearchParams({ page: pageId })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getSimulatedWidth = () => {
    if (viewportMode === 'mobile') return '375px'
    if (viewportMode === 'tablet') return '768px'
    return '100%'
  }

  const filteredSections = searchQuery
    ? NAV_SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.group.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : NAV_SECTIONS

  const groups = Array.from(new Set(filteredSections.map(s => s.group)))

  // Pagination helper
  const currentIndex = NAV_SECTIONS.findIndex(s => s.id === activePage)
  const prevPage = currentIndex > 0 ? NAV_SECTIONS[currentIndex - 1] : null
  const nextPage = currentIndex < NAV_SECTIONS.length - 1 ? NAV_SECTIONS[currentIndex + 1] : null
  const currentNav = NAV_SECTIONS.find(s => s.id === activePage) || NAV_SECTIONS[0]

  return (
    <div className="cluv-docs-shell">
      {/* 1. SIDEBAR NAV */}
      <aside className="cluv-docs-sidebar">
        <div className="cluv-docs-sidebar-header">
          <div className="cluv-flex-row cluv-items-center cluv-gap-2">
            <div className="cluv-card-icon-wrap is-sm cluv-m-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="cluv-font-bold cluv-text-dark cluv-m-0" style={{ fontSize: '1rem' }}>
                Cluv Framework
              </h2>
              <span className="cluv-caption cluv-text-muted">Living Documentation</span>
            </div>
          </div>
        </div>

        <div className="cluv-docs-search-wrap">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="cluv-docs-search-input"
              placeholder="Cari dokumentasi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="cluv-docs-nav">
          {groups.map(group => (
            <div key={group} className="cluv-docs-nav-group">
              <div className="cluv-docs-nav-title">{group}</div>
              {filteredSections
                .filter(s => s.group === group)
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`cluv-docs-nav-item ${activePage === item.id ? 'is-active' : ''}`}
                  >
                    <span>{item.title}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* 2. MAIN DOCS AREA */}
      <main className="cluv-docs-main">
        {/* Topbar with Viewport Simulator */}
        <header className="cluv-docs-topbar">
          <div className="cluv-flex-row cluv-items-center cluv-gap-3">
            <span className="cluv-font-bold cluv-text-dark" style={{ fontSize: '0.8125rem' }}>
              Simulator Layar:
            </span>
            <div className="cluv-docs-viewport-controls">
              <button
                onClick={() => setViewportMode('desktop')}
                className={`cluv-docs-viewport-btn ${viewportMode === 'desktop' ? 'is-active' : ''}`}
                title="Tampilan Desktop Penuh"
              >
                <Monitor size={14} /> Desktop (100%)
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                className={`cluv-docs-viewport-btn ${viewportMode === 'tablet' ? 'is-active' : ''}`}
                title="Simulasi Layar Tablet 768px"
              >
                <Tablet size={14} /> Tablet (768px)
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                className={`cluv-docs-viewport-btn ${viewportMode === 'mobile' ? 'is-active' : ''}`}
                title="Simulasi Layar HP 375px"
              >
                <Smartphone size={14} /> HP (375px)
              </button>
            </div>
          </div>

          <div className="cluv-flex-row cluv-items-center cluv-gap-2">
            <Badge variant="teal" size="sm">Doktrin Resmi</Badge>
            <Button variant="ghost" size="sm" to="/dashboard">
              Kembali ke App <ExternalLink size={14} className="cluv-ml-1" />
            </Button>
          </div>
        </header>

        {/* Content Container (PAGE-BASED RENDER) */}
        <div className="cluv-docs-content">
          {/* Breadcrumb Header */}
          <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-3 cluv-caption cluv-text-muted">
            <span>Dokumentasi</span>
            <span>/</span>
            <span>{currentNav.group}</span>
            <span>/</span>
            <span className="cluv-font-bold cluv-text-dark">{currentNav.title}</span>
          </div>

          {/* =================================================================
              PAGE 1: OVERVIEW & INVARIAN
              ================================================================= */}
          {activePage === 'overview' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">GETTING STARTED</Badge>
              <h1 className="cluv-title-section cluv-m-0">Filosofi &amp; 4 Invarian Mutlak</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Cluv Framework adalah micro-framework desain resmi Skincluv yang memisahkan antara <strong>Design Tokens (Lapis 1)</strong>, <strong>CSS Components lego ber-slot (Lapis 2)</strong>, dan <strong>Type-Safe React Atoms (Lapis 3)</strong>.
              </p>

              <div className="cluv-flex-col cluv-gap-3 cluv-my-4">
                <div className="cluv-card is-tint-teal">
                  <strong className="cluv-text-dark">1. Tidak Boleh Pake Style Lama</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Dilarang keras mempertahankan gaya visual lama peninggalan v0 (border abu-abu tebal, layout kusam). Seluruh elemen wajib bermutasi menjadi standar Cluv murni (surface bersih, border 1.5px crisp, radius membulat elegan, icon wrap pastel).
                  </p>
                </div>
                <div className="cluv-card is-tint-teal">
                  <strong className="cluv-text-dark">2. Tidak Boleh Asal Ubah / Bikin Nama Kelas</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Dilarang keras membuat class CSS ad-hoc per-halaman di <code>src/styles/cluv/app/*.css</code> untuk hal yang seharusnya menjadi komponen universal. Selalu periksa cheatsheet sebelum membuat styling.
                  </p>
                </div>
                <div className="cluv-card is-tint-gold">
                  <strong className="cluv-text-dark">3. Wajib Diskusi Kelas Baru Terlebih Dahulu</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Jika ada komponen visual yang benar-benar belum diwadahi di framework, diskusikan bersama user sebelum menyentuh file CSS. Rumuskan spesifikasinya ke dalam <code>components/</code>, bukan di CSS halaman.
                  </p>
                </div>
                <div className="cluv-card is-tint-teal">
                  <strong className="cluv-text-dark">4. Tabula Rasa: Kenali Hakikat Halaman</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Kenali peran semantik halaman: Dashboard &amp; Scanner adalah Kanvas Grid lapang (1240px); Riwayat Tagihan &amp; Formulir adalah Focused Ledger (760px); Chatbot adalah Bleed Viewport (100%). Dilarang meniru layout lama yang salah kaprah.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 2: DESIGN TOKENS & WARNA
              ================================================================= */}
          {activePage === 'tokens' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">FOUNDATIONS</Badge>
              <h1 className="cluv-title-section cluv-m-0">Design Tokens &amp; Variabel Warna</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Dilarang keras menggunakan kode hex manual di file JSX maupun CSS baru. Gunakan CSS Variables resmi dari <code>tokens.css</code>.
              </p>

              <div className="cluv-grid cols-2 cluv-gap-3 cluv-my-4">
                <div className="cluv-card is-tint-teal">
                  <div className="cluv-font-bold cluv-text-dark">Teal Brand (Utama)</div>
                  <div className="cluv-micro cluv-text-muted cluv-mt-1">
                    <code>--cluv-teal</code> (#1f9d97)<br />
                    <code>--cluv-teal-dark</code> (#127a75)<br />
                    <code>--cluv-teal-soft</code> (#e6f6f5)
                  </div>
                </div>
                <div className="cluv-card is-tint-gold">
                  <div className="cluv-font-bold cluv-text-dark">Warm Gold (Peringatan &amp; Credits)</div>
                  <div className="cluv-micro cluv-text-muted cluv-mt-1">
                    <code>--cluv-gold</code> (#d97706)<br />
                    <code>--cluv-gold-light</code> (#f59e0b)<br />
                    <code>--cluv-gold-soft</code> (#fef8ee)
                  </div>
                </div>
                <div className="cluv-card" style={{ background: '#fdf2f4', borderColor: '#fbcfe8' }}>
                  <div className="cluv-font-bold" style={{ color: '#db2777' }}>Rose Accent (Bahaya &amp; Penting)</div>
                  <div className="cluv-micro cluv-text-muted cluv-mt-1">
                    <code>--cluv-rose</code> (#f43f5e)<br />
                    <code>--cluv-rose-soft</code> (#fdf2f4)
                  </div>
                </div>
                <div className="cluv-card" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
                  <div className="cluv-font-bold" style={{ color: '#8b5cf6' }}>Purple Magic (AI Intelligence)</div>
                  <div className="cluv-micro cluv-text-muted cluv-mt-1">
                    <code>--cluv-purple</code> (#8b5cf6)<br />
                    <code>--cluv-purple-soft</code> (#faf5ff)
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 3: BREAKPOINTS & MOBILE
              ================================================================= */}
          {activePage === 'breakpoints' && (
            <article>
              <Badge variant="gold" size="sm" className="cluv-mb-2">RESPONSIVE</Badge>
              <h1 className="cluv-title-section cluv-m-0">Breakpoints &amp; Doktrin Mobile</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Komponen Cluv Framework wajib diuji pada layar HP nyata (360px–375px). Dilarang berasumsi tampilan desktop otomatis bagus saat di-shrink ke mobile.
              </p>

              <table className="cluv-docs-table cluv-my-4">
                <thead>
                  <tr>
                    <th>Breakpoint</th>
                    <th>Ukuran Layar</th>
                    <th>Perilaku Khusus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="cluv-docs-token-pill">Mobile</span></td>
                    <td><code>&le; 640px</code></td>
                    <td>
                      Sidebar disembunyikan total, Bottom Bar aktif, padding kanvas <code>16px</code>, tombol aksi pada kartu/alert wajib stack vertikal di bawah teks.
                    </td>
                  </tr>
                  <tr>
                    <td><span className="cluv-docs-token-pill">Tablet</span></td>
                    <td><code>641px - 1024px</code></td>
                    <td>
                      Grid kartu 2 kolom seimbang, padding kanvas <code>24px</code>, navigasi tablet bersih.
                    </td>
                  </tr>
                  <tr>
                    <td><span className="cluv-docs-token-pill">Desktop</span></td>
                    <td><code>&gt; 1024px</code></td>
                    <td>
                      Sidebar 250px terlihat, Topbar lengkap (kredit, lonceng, avatar), padding kanvas <code>40px</code> terkunci sejajar kiri.
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          )}

          {/* =================================================================
              FASE 1: GENERIC VS EKSKLUSIF STYLE
              ================================================================= */}
          {activePage === 'generic-vs-exclusive' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">ARCHITECTURE CONSENSUS</Badge>
              <h1 className="cluv-title-section cluv-m-0">Generic vs Eksklusif Cluv Styles</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Berdasarkan kesepakatan bersama, sistem styling Skincluv dibagi menjadi dua wilayah tegas agar kode tetap bersih dan tidak terjadi duplikasi liar.
              </p>

              {/* Seksi A */}
              <div className="cluv-card is-tint-teal cluv-my-4">
                <h3 className="cluv-font-bold cluv-text-dark cluv-m-0">A. Generic Cluv Styles (src/styles/cluv/components/)</h3>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                  Komponen universal yang dipakai berulang di banyak halaman. Wajib menganut prinsip zero outer margin dan contextual styling via modifier <code>.is-*</code>.
                </p>
                <div className="cluv-flex-row cluv-flex-wrap cluv-gap-2 cluv-mt-3">
                  <span className="cluv-docs-token-pill">.cluv-btn</span>
                  <span className="cluv-docs-token-pill">.cluv-card</span>
                  <span className="cluv-docs-token-pill">.cluv-bento-card</span>
                  <span className="cluv-docs-token-pill">.cluv-bento-grid</span>
                  <span className="cluv-docs-token-pill">.cluv-action-tile</span>
                  <span className="cluv-docs-token-pill">.cluv-badge</span>
                  <span className="cluv-docs-token-pill">.cluv-alert</span>
                  <span className="cluv-docs-token-pill">.cluv-stat-card</span>
                  <span className="cluv-docs-token-pill">.cluv-checklist-group</span>
                </div>
              </div>

              {/* Seksi B */}
              <div className="cluv-card is-tint-gold cluv-my-4">
                <h3 className="cluv-font-bold cluv-text-dark cluv-m-0">B. Eksklusif Cluv Styles (src/styles/cluv/app/*.css &amp; public/*.css)</h3>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                  Style yang <strong>sah dan dilegalkan</strong> HANYA jika tampil khusus pada satu fitur atau layar tertentu:
                </p>
                <ul className="cluv-caption cluv-text-muted cluv-mt-2 cluv-pl-4">
                  <li><strong>.cluv-avatar-ring</strong>: Lingkaran glow gradient Gemini aurora pada profil member PRO.</li>
                  <li><strong>.cluv-credit-capsule</strong>: Kapsul interaktif <code>[ ⚡ 1.395 | + ]</code> di Topbar &amp; Passport mobile.</li>
                  <li><strong>.cluv-camera-viewfinder</strong>: HUD pemindai kamera face scan (target oval &amp; scanning bar).</li>
                  <li><strong>.cluv-auth-showcase</strong>: Visual editorial meja rias split auth di halaman login/register.</li>
                </ul>
              </div>

              {/* Seksi C */}
              <div className="cluv-card cluv-my-4">
                <h3 className="cluv-font-bold cluv-text-dark cluv-m-0">Protokol Tiga Langkah Saat Ada Elemen Baru:</h3>
                <ol className="cluv-caption cluv-text-muted cluv-mt-2 cluv-pl-4">
                  <li><strong>Grep Terlebih Dahulu</strong>: Cek cheatsheet sebelum membuat styling baru.</li>
                  <li><strong>Reuse First</strong>: Jika konsep visual sudah ada (kartu, chip, alert), wajib gunakan class yang sudah ada.</li>
                  <li><strong>Extend Second</strong>: Gunakan modifier <code>.is-*</code> (misal: <code>.is-tint-teal</code>, <code>.is-sm</code>).</li>
                  <li><strong>Create Last (Wajib Diskusi)</strong>: Dilarang menebak sendiri atau menulis komponen baru di CSS halaman.</li>
                </ol>
              </div>

              {/* Seksi D */}
              <div className="cluv-card cluv-my-4">
                <h3 className="cluv-font-bold cluv-text-dark cluv-m-0">Kontrak Isolasi Responsif (Dual-Safe)</h3>
                <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                  <em>"Jangan perbaiki desktop merusak mobile, atau perbaiki mobile merusak desktop."</em> Gunakan utility pengarah resmi dari <code>utilities.css</code>:
                </p>
                <div className="cluv-grid cols-2 cluv-gap-2 cluv-mt-3 cluv-caption">
                  <div><code>.cluv-flex-responsive</code>: Desktop Row ➔ Mobile Column</div>
                  <div><code>.cluv-w-full-mobile</code>: Desktop Auto ➔ Mobile 100%</div>
                  <div><code>.cluv-flex-1-mobile</code>: Mobile membagi rata 50/50</div>
                  <div><code>.cluv-hide-mobile</code> / <code>.cluv-hide-desktop</code></div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 1: PUBLIC VS APP CONSENSUS
              ================================================================= */}
          {activePage === 'public-vs-app' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">DESIGN DISCIPLINE</Badge>
              <h1 className="cluv-title-section cluv-m-0">Konsensus Public Pages vs App Pages</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Halaman Non-Login (Public/Landing) dan Halaman Login (App Dashboard) memiliki aturan desain yang berbeda 180 derajat sesuai perannya:
              </p>

              <table className="cluv-docs-table cluv-my-4">
                <thead>
                  <tr>
                    <th>Aspek Desain</th>
                    <th>Public Pages (/ , /about, /paket)</th>
                    <th>App Pages (/dashboard, /face-scan, dll)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Tipografi Font</strong></td>
                    <td><strong>Nunito</strong> (hangat, lembut, bersahabat)</td>
                    <td><strong>Plus Jakarta Sans</strong> (presisi, modern, data-dense)</td>
                  </tr>
                  <tr>
                    <td><strong>Filosofi &amp; Suara</strong></td>
                    <td><em>Option E &mdash; Warm Companion ("Sahabat Setia Meja Riasmu")</em> tanpa menciptakan ketakutan (*fear-mongering*)</td>
                    <td><em>Precision Dashboard</em> (efisien, akurat, analitis kosmetik)</td>
                  </tr>
                  <tr>
                    <td><strong>H1 Judul Utama</strong></td>
                    <td><code>.cluv-title-hero</code> (36px &ndash; 52px)</td>
                    <td><code>.cluv-title-section</code> (24px &ndash; 30px) &mdash; <em>Dilarang hero title di App!</em></td>
                  </tr>
                  <tr>
                    <td><strong>H2/H3 Judul Kartu</strong></td>
                    <td><code>.cluv-title-section</code> (28px &ndash; 36px)</td>
                    <td><code>.cluv-title-card</code> (18px &ndash; 20px)</td>
                  </tr>
                  <tr>
                    <td><strong>Spacing Antar Babak</strong></td>
                    <td><code>.cluv-section</code> lega (64px &ndash; 96px padding)</td>
                    <td>Padat &amp; ringkas (gap 16px &ndash; 20px, anti-scroll berlebih)</td>
                  </tr>
                  <tr>
                    <td><strong>Anchor Tepi Kiri</strong></td>
                    <td>Boxed auto-centered (<code>.cluv-container</code>)</td>
                    <td>Left-Anchor 40px sejajar presisi dengan Topbar</td>
                  </tr>
                  <tr>
                    <td><strong>Otentikasi (/login)</strong></td>
                    <td>Split-Screen Meja Rias Editorial</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td><strong>Trust Indicator</strong></td>
                    <td>Trust Strip (<em>Gratis &bull; Tanpa Kartu Kredit &bull; 100% Privasi</em>)</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td><strong>Dokumen Hukum</strong></td>
                    <td>Zero-Runtime-Parser TSX statis (FCP &lt; 0.5s)</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </article>
          )}

          {/* =================================================================
              FASE 1: MOBILE APP-FIRST DOCTRINE
              ================================================================= */}
          {activePage === 'mobile-app-first' && (
            <article>
              <Badge variant="gold" size="sm" className="cluv-mb-2">MOBILE ARCHITECTURE</Badge>
              <h1 className="cluv-title-section cluv-m-0">Doktrin Mobile App-First (&le; 640px)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Di layar ponsel (&le; 640px), Skincluv beroperasi layaknya <strong>Aplikasi Native Mobile</strong>, bukan sekadar desktop yang dipersempit paksa.
              </p>

              <div className="cluv-flex-col cluv-gap-3 cluv-my-4">
                <div className="cluv-card is-tint-teal">
                  <strong className="cluv-text-dark">1. Shell Navigasi Bawah Ramah Jempol</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Sidebar desktop dihilangkan total (<code>display: none !important</code>), tidak ada hamburger drawer kaku. Digantikan oleh Bottom Navigation Bar 5 menu (<code>.cluv-mobile-bottom-bar</code>) dengan Center Floating Action Button (FAB Scan Wajah: <code>.cluv-bottom-nav-fab-icon</code>). Topbar disederhanakan hanya Brand di kiri dan Lonceng di kanan.
                  </p>
                </div>

                <div className="cluv-card is-tint-gold">
                  <strong className="cluv-text-dark">2. Unified Hero Card Mobile (.cluv-mobile-unified-card)</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Sapaan teks desktop yang boros ruang digantikan oleh kartu ringkas serbaguna: Avatar user glow ring + sapaan + saldo kredit (<code>+</code>) + mini score ring (56px) + quick action pills (<em>Pindai Ulang</em>, <em>Tanya AI</em>).
                  </p>
                </div>

                <div className="cluv-card">
                  <strong className="cluv-text-dark">3. 4-Item Squircle Shortcuts (.cluv-mobile-shortcuts)</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Empat pintasan aplikasi berbentuk squircle membulat berjejer horizontal (Scan Wajah, Scan Komposisi, Misi Glow, Tanya AI).
                  </p>
                </div>

                <div className="cluv-card">
                  <strong className="cluv-text-dark">4. Disiplin Padding Kartu di Mobile</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Padding kartu desktop <code>24px</code> / <code>32px</code> <strong>WAJIB turun ke 16px 14px</strong> di HP (&le; 640px) agar area baca lapang dan tidak tercekik border tebal.
                  </p>
                </div>

                <div className="cluv-card is-tint-teal">
                  <strong className="cluv-text-dark">5. Anti Scroll Fatigue &amp; Pola Inset List</strong>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Dilarang menumpuk 6&ndash;8 kartu raksasa vertikal tanpa henti. Rutinitas dan misi harian wajib menggunakan pola <strong>Compact Inset Grouped List</strong> (<code>.cluv-checklist-group</code>), bukan tumpukan kartu berbingkai tebal.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 1: KAMUS ANTI-HALUSINASI
              ================================================================= */}
          {activePage === 'anti-hallucination' && (
            <article>
              <Badge variant="rose" size="sm" className="cluv-mb-2">CODE INTEGRITY &amp; HYGIENE</Badge>
              <h1 className="cluv-title-section cluv-m-0">Kamus Anti-Halusinasi (Class Registry)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Tabel sumber kebenaran tunggal larangan class peninggalan v0 / CSS ad-hoc vs class kanonikal resmi Cluv Framework. Seluruh AI &amp; Engineer wajib mematuhi penamaan ini:
              </p>

              <table className="cluv-docs-table cluv-my-4">
                <thead>
                  <tr>
                    <th>Kebutuhan Antarmuka</th>
                    <th>Class Terlarang (Antipattern)</th>
                    <th>Class Kanonikal Resmi Cluv</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Kanvas Bento / Grid</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-page-container, .subpage-container</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ .cluv-canvas-grid</span></td>
                  </tr>
                  <tr>
                    <td><strong>Kanvas Focused Ledger</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-page, margin auto sempit</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ .cluv-canvas-focused</span></td>
                  </tr>
                  <tr>
                    <td><strong>Kartu Kontainer Utama</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-card, .v0-subpage-card, .glass-card</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ .cluv-card, .cluv-bento-card</span></td>
                  </tr>
                  <tr>
                    <td><strong>Tombol Universal</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-save-btn, .btn-primary, .btn-save</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ &lt;Button /&gt; atau .cluv-btn.is-primary</span></td>
                  </tr>
                  <tr>
                    <td><strong>Chip / Filter Seleksi</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-chip, .tag-pill, .chip-btn</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ .cluv-chip.is-active</span></td>
                  </tr>
                  <tr>
                    <td><strong>Tautan Kembali</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-back-link, .back-arrow</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ .cluv-link.is-muted, .cluv-back-link</span></td>
                  </tr>
                  <tr>
                    <td><strong>Grup Form &amp; Input</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-form-section, .form-group-custom</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ .cluv-field, .cluv-input, .cluv-label</span></td>
                  </tr>
                  <tr>
                    <td><strong>Icon Wrapper Pastel</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-section-icon, .icon-box-custom</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ .cluv-card-icon-wrap.is-teal (.is-gold, .is-rose)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Alert &amp; Banner Notifikasi</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ .v0-profile-message, .alert-box</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ &lt;Alert /&gt; atau .cluv-alert.is-warning</span></td>
                  </tr>
                  <tr>
                    <td><strong>Inline Style Pewarnaan</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ style=&#123;&#123; background: '#...', color: '#...' &#125;&#125;</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ CSS Variables var(--cluv-*)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Island &lt;style&gt; di JSX</strong></td>
                    <td><span style={{ color: '#ef4444' }}>❌ &lt;style&gt;&#123;...&#125;&lt;/style&gt; di file .tsx</span></td>
                    <td><span style={{ color: '#059669', fontWeight: 700 }}>✅ Terpusat di src/styles/cluv/</span></td>
                  </tr>
                </tbody>
              </table>
            </article>
          )}

          {/* =================================================================
              PAGE: 3 KANVAS KANONIKAL (APP SHELL)
              ================================================================= */}
          {activePage === 'canvases' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">LAYOUT APP</Badge>
              <h1 className="cluv-title-section cluv-m-0">Tiga Kanvas Kanonikal (.cluv-canvas-*)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Setiap halaman aplikasi login wajib membungkus dirinya sendiri dengan salah satu dari 3 kanvas ini untuk menjamin garis tepi kiri sejajar 40px di desktop.
              </p>

              {/* Interactive Canvas Switcher */}
              <div className="cluv-flex-row cluv-gap-2 cluv-my-4 cluv-flex-wrap">
                <button
                  onClick={() => setSelectedCanvasType('A')}
                  className={`cluv-btn is-sm ${selectedCanvasType === 'A' ? 'is-primary' : 'is-outline'}`}
                >
                  Tipe A: Full Canvas (1240px)
                </button>
                <button
                  onClick={() => setSelectedCanvasType('B')}
                  className={`cluv-btn is-sm ${selectedCanvasType === 'B' ? 'is-primary' : 'is-outline'}`}
                >
                  Tipe B: Focused Ledger (760px)
                </button>
                <button
                  onClick={() => setSelectedCanvasType('C')}
                  className={`cluv-btn is-sm ${selectedCanvasType === 'C' ? 'is-primary' : 'is-outline'}`}
                >
                  Tipe C: Full-Bleed (100%)
                </button>
              </div>

              {/* X-Ray Blueprint App Shell Mockup */}
              <div className="cluv-blueprint-frame cluv-blueprint-grid-bg cluv-my-4">
                <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mb-3">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                    <span className="cluv-blueprint-pill is-teal">X-RAY BLUEPRINT</span>
                    <span className="cluv-caption" style={{ color: '#94a3b8' }}>
                      App Shell Architecture (Sidebar 250px + Topbar 68px + 40px Left-Anchor)
                    </span>
                  </div>
                  <span className="cluv-blueprint-pill is-amber">
                    MODE: {selectedCanvasType === 'A' ? 'TIPE A (GRID 1240PX)' : selectedCanvasType === 'B' ? 'TIPE B (FOCUSED 760PX)' : 'TIPE C (BLEED 100%)'}
                  </span>
                </div>

                <div className="cluv-blueprint-shell-mock">
                  {/* Simulated 250px Sidebar */}
                  <div className="cluv-blueprint-sidebar-mock">
                    <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ width: 18, height: 18, background: '#1f9d97', borderRadius: 4 }} />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#ffffff' }}>Skincluv</span>
                    </div>
                    <div className="cluv-caption" style={{ fontSize: '0.625rem', color: '#64748b' }}>SIDEBAR (250px)</div>
                    <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }} />
                    <div style={{ height: 12, background: 'rgba(31,157,151,0.25)', borderRadius: 3 }} />
                    <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }} />
                    <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }} />
                  </div>

                  {/* Simulated Main Content Area */}
                  <div className="cluv-blueprint-main-mock">
                    {/* Simulated Topbar 68px */}
                    <div className="cluv-blueprint-topbar-mock">
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff' }}>Judul Halaman</span>
                        <span className="cluv-blueprint-pill is-amber">Offset: 40px</span>
                      </div>
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div style={{ width: 14, height: 14, background: '#fbbf24', borderRadius: '50%' }} />
                        <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Profile Capsule</span>
                      </div>
                    </div>

                    {/* Canvas Area with Left-Anchor Guide */}
                    <div className="cluv-blueprint-content-mock">
                      <div className="cluv-blueprint-gutter-guide" title="Garis Kiri Terkunci 40px" />

                      {selectedCanvasType === 'A' && (
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '92%',
                            border: '1.5px dashed #38bdf8',
                            background: 'rgba(56, 189, 248, 0.08)',
                            borderRadius: 8,
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div className="cluv-flex-row cluv-justify-between cluv-items-center">
                            <span className="cluv-blueprint-pill is-teal">.cluv-canvas-grid</span>
                            <span style={{ fontSize: '0.6875rem', color: '#38bdf8' }}>max-width: 1240px; padding: 32px 40px 80px</span>
                          </div>
                          <div className="cluv-grid cols-2" style={{ gap: '8px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: 6, fontSize: '0.6875rem' }}>Bento Card Hero (60%)</div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: 6, fontSize: '0.6875rem' }}>Bento Card Misi (40%)</div>
                          </div>
                        </div>
                      )}

                      {selectedCanvasType === 'B' && (
                        <div
                          style={{
                            width: '60%',
                            marginLeft: 0,
                            marginRight: 'auto',
                            border: '1.5px dashed #fbbf24',
                            background: 'rgba(245, 158, 11, 0.08)',
                            borderRadius: 8,
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div className="cluv-flex-row cluv-justify-between cluv-items-center">
                            <span className="cluv-blueprint-pill is-amber">.cluv-canvas-focused</span>
                            <span style={{ fontSize: '0.6875rem', color: '#fbbf24' }}>max-width: 760px; margin-left: 0;</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: 6, fontSize: '0.6875rem' }}>
                            Left-Anchored! Terkunci sejajar 40px dengan judul Topbar. DILARANG margin: 0 auto!
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px', borderRadius: 6, fontSize: '0.625rem', color: '#cbd5e1' }}>
                            Faktur Tagihan / Ledger Mutasi / Edit Profil Kulit
                          </div>
                        </div>
                      )}

                      {selectedCanvasType === 'C' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            border: '1.5px dashed #fda4af',
                            background: 'rgba(244, 63, 94, 0.08)',
                            borderRadius: 8,
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div className="cluv-flex-row cluv-justify-between cluv-items-center">
                            <span className="cluv-blueprint-pill is-rose">.cluv-canvas-bleed</span>
                            <span style={{ fontSize: '0.6875rem', color: '#fda4af' }}>width: 100%; height: 100%; padding: 0</span>
                          </div>
                          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#fda4af' }}>
                            Full Viewport Edge-to-Edge (Skinsistant AI Chatbot &amp; Camera HUD)
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 20, fontSize: '0.625rem' }}>
                            Input Bar Lengket Bawah (Sticky Bottom)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invariants & Specs Table */}
              <table className="cluv-docs-table cluv-my-4">
                <thead>
                  <tr>
                    <th>Tipe Kanvas</th>
                    <th>Spesifikasi CSS</th>
                    <th>Target Halaman</th>
                    <th>Aturan Invarian</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Tipe A: Full Grid</strong><br /><code>.cluv-canvas-grid</code></td>
                    <td><code>max-width: 1240px;<br />padding: 32px 40px 80px;</code></td>
                    <td>Dashboard, Scan Wajah AI, Scan Komposisi, Misi Glow, Riwayat Scan, Profil Hub</td>
                    <td>Di mobile (&le;768px), padding otomatis turun rapi menjadi <code>20px 16px 80px</code>.</td>
                  </tr>
                  <tr>
                    <td><strong>Tipe B: Focused Ledger</strong><br /><code>.cluv-canvas-focused</code></td>
                    <td><code>max-width: 760px;<br />margin-left: 0;<br />margin-right: auto;</code></td>
                    <td>Riwayat Tagihan, Mutasi Credits, Edit Profil Kulit, Pusat Privasi, Checkout</td>
                    <td><strong>DILARANG <code>margin: 0 auto</code></strong> karena akan membuat form melayang kosong ke tengah layar ultrawide.</td>
                  </tr>
                  <tr>
                    <td><strong>Tipe C: Full Bleed</strong><br /><code>.cluv-canvas-bleed</code></td>
                    <td><code>width: 100%;<br />height: 100%;<br />padding: 0; overflow: hidden;</code></td>
                    <td>Skinsistant AI Chatbot (/chatbot), Camera Viewfinder HUD</td>
                    <td>Wajib tanpa padding luar agar chat scroll dan kamera menyentuh seluruh tepi viewport.</td>
                  </tr>
                </tbody>
              </table>
            </article>
          )}

          {/* =================================================================
              PAGE: PUBLIC CONTAINERS & SECTION RHYTHM
              ================================================================= */}
          {activePage === 'public-containers' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">LAYOUT PUBLIK</Badge>
              <h1 className="cluv-title-section cluv-m-0">Containers &amp; Section Rhythm (.cluv-container, .cluv-section)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Tata letak modular halaman publik non-login (Landing Page, Otentikasi, Legal &amp; Help Center) yang menjamin pembatasan lebar proporsional dan ritme vertikal yang konsisten.
              </p>

              {/* Nested Width Ruler Blueprint */}
              <div className="cluv-blueprint-frame cluv-my-4">
                <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mb-3">
                  <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                    <span className="cluv-blueprint-pill is-teal">NESTED WIDTH RULER</span>
                    <span className="cluv-caption" style={{ color: '#94a3b8' }}>
                      Visualisasi Hirarki Lebar .cluv-container
                    </span>
                  </div>
                  <span className="cluv-blueprint-pill is-amber">6 TINGKAT LEBAR</span>
                </div>

                <div className="cluv-blueprint-ruler-wrap">
                  <div className="cluv-blueprint-ruler-bar" style={{ width: '100%', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <span>.cluv-container.is-fluid</span>
                    <span className="cluv-blueprint-pill is-teal">100% (Edge-to-Edge Full Bleed)</span>
                  </div>
                  <div className="cluv-blueprint-ruler-bar" style={{ width: '92%', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8' }}>
                    <span>.cluv-container.is-wide</span>
                    <span className="cluv-blueprint-pill is-teal">1360px (Showcase &amp; Telemetri)</span>
                  </div>
                  <div className="cluv-blueprint-ruler-bar" style={{ width: '82%', background: 'rgba(31, 157, 151, 0.22)', border: '1.5px solid #14b8a6', color: '#5eead4' }}>
                    <span>.cluv-container (Default Standard)</span>
                    <span className="cluv-blueprint-pill is-teal">1200px (Sejajar Navbar &amp; Footer)</span>
                  </div>
                  <div className="cluv-blueprint-ruler-bar" style={{ width: '70%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24' }}>
                    <span>.cluv-container.is-md</span>
                    <span className="cluv-blueprint-pill is-amber">1040px (Feature Split 2-Kolom)</span>
                  </div>
                  <div className="cluv-blueprint-ruler-bar" style={{ width: '58%', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#c084fc' }}>
                    <span>.cluv-container.is-reading / .is-sm</span>
                    <span className="cluv-blueprint-pill is-rose">860px (Artikel &amp; Single FAQ)</span>
                  </div>
                  <div className="cluv-blueprint-ruler-bar" style={{ width: '46%', background: 'rgba(244, 63, 94, 0.18)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fda4af' }}>
                    <span>.cluv-container.is-narrow</span>
                    <span className="cluv-blueprint-pill is-rose">720px (Form Checkout &amp; Terms)</span>
                  </div>
                </div>
              </div>

              {/* Section Spacing Rhythm Box */}
              <h3 className="cluv-title-card cluv-mt-6 cluv-mb-3">Ritme Vertikal Seksi (.cluv-section)</h3>
              <p className="cluv-caption cluv-text-muted">
                Dilarang menggunakan margin manual untuk memisahkan babak halaman. Seluruh jeda vertikal diatur otomatis oleh modifier seksi:
              </p>

              <div className="cluv-grid cols-3 cluv-my-3">
                <div className="cluv-card">
                  <div className="cluv-font-bold cluv-text-dark">.cluv-section (Default)</div>
                  <div className="cluv-badge is-teal cluv-my-2">clamp(40px, 5vw, 64px) 0</div>
                  <p className="cluv-caption cluv-text-muted cluv-m-0">
                    Seksi standar untuk fitur utama, testimoni, dan galeri bento.
                  </p>
                </div>
                <div className="cluv-card">
                  <div className="cluv-font-bold cluv-text-dark">.cluv-section.is-dense</div>
                  <div className="cluv-badge is-amber cluv-my-2">clamp(24px, 3vw, 36px) 0</div>
                  <p className="cluv-caption cluv-text-muted cluv-m-0">
                    Seksi rapat untuk baris logo partner, trust strip, atau banner CTA sekunder.
                  </p>
                </div>
                <div className="cluv-card">
                  <div className="cluv-font-bold cluv-text-dark">.cluv-section.is-spacious</div>
                  <div className="cluv-badge is-rose cluv-my-2">clamp(52px, 6vw, 84px) 0</div>
                  <p className="cluv-caption cluv-text-muted cluv-m-0">
                    Seksi lega untuk Hero landing page dan seksi penutup sebelum footer.
                  </p>
                </div>
              </div>

              {/* Document Layout (.cluv-doc-layout) */}
              <h3 className="cluv-title-card cluv-mt-6 cluv-mb-3">Layout Dokumen Legal &amp; Bantuan (.cluv-doc-layout)</h3>
              <div className="cluv-card is-compact cluv-mb-4">
                <p className="cluv-caption cluv-text-muted cluv-m-0">
                  Untuk halaman <code>/terms</code>, <code>/privacy</code>, <code>/refund-policy</code>, dan <code>/faq</code>, sistem menggunakan layout 2 kolom: <strong>Sticky Sidebar 280px</strong> di kiri dan <strong>Fluid Article Canvas</strong> di kanan. Di layar ponsel (&lt;880px), layout otomatis berubah menjadi 1 kolom vertikal ramah baca.
                </p>
              </div>

              {/* Snippet */}
              <div className="cluv-docs-code-wrap">
                <div className="cluv-docs-code-header">
                  <span>SNIPPET: PUBLIC SECTION &amp; CONTAINER</span>
                  <button
                    onClick={() => handleCopy('pub-sec', `<section className="cluv-section">\n  <div className="cluv-container">\n    <div className="cluv-section-header">\n      <h2 className="cluv-title-section">Judul Seksi</h2>\n      <p className="cluv-subtitle">Penjelasan fitur.</p>\n    </div>\n  </div>\n</section>`)}
                    className="cluv-docs-copy-btn"
                  >
                    {copiedKey === 'pub-sec' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'pub-sec' ? 'COPIED!' : 'COPY JSX'}
                  </button>
                </div>
                <pre className="cluv-docs-code-block">
{`<section className="cluv-section">
  <div className="cluv-container">
    <div className="cluv-section-header">
      <div className="cluv-badge is-teal cluv-mb-3">Fitur Utama</div>
      <h2 className="cluv-title-section">Analisis Wajah Cerdas</h2>
      <p className="cluv-subtitle">Teknologi pemetaan kondisi kulit berbasis AI.</p>
    </div>
  </div>
</section>`}
                </pre>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 5: BENTO GRID SYSTEM
              ================================================================= */}
          {activePage === 'bento-grid' && (
            <article>
              <Badge variant="purple" size="sm" className="cluv-mb-2">LAYOUT</Badge>
              <h1 className="cluv-title-section cluv-m-0">Bento Grid System (.cluv-bento-grid)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Grid bento modular dengan rasio proporsional bawaan yang otomatis berubah menjadi 1 kolom vertikal di layar ponsel.
              </p>

              <table className="cluv-docs-table cluv-my-4">
                <thead>
                  <tr>
                    <th>Modifier</th>
                    <th>Rasio Desktop</th>
                    <th>Kegunaan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>.is-hero</code></td>
                    <td>1.55fr : 1fr</td>
                    <td>Hero split (kartu tren utama di kiri, kartu rutinitas di kanan).</td>
                  </tr>
                  <tr>
                    <td><code>.is-equal</code></td>
                    <td>1fr : 1fr</td>
                    <td>Komparasi seimbang dua kartu data.</td>
                  </tr>
                  <tr>
                    <td><code>.is-trio</code></td>
                    <td>1fr : 1fr : 1fr</td>
                    <td>Tiga ringkasan tahapan alur scan atau produk.</td>
                  </tr>
                  <tr>
                    <td><code>.is-quad</code></td>
                    <td>repeat(4, 1fr)</td>
                    <td>Empat pintasan kartu aksi horizontal.</td>
                  </tr>
                </tbody>
              </table>
            </article>
          )}

          {/* =================================================================
              PAGE: UTILITIES SUITE (SPACING, FLEX & DISPLAY)
              ================================================================= */}
          {activePage === 'utilities-suite' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">UTILITIES</Badge>
              <h1 className="cluv-title-section cluv-m-0">Utilities Suite: Spacing &amp; Flexbox (.cluv-*)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Rangkaian kelas utilitas murni vanilla CSS (100% bebas Tailwind) untuk menyuntikkan jarak mikro, perataan flexbox, dan perilaku responsif secara instan.
              </p>

              {/* 1. Chrome DevTools Box Model Visualization */}
              <h3 className="cluv-title-card cluv-mt-6 cluv-mb-3">1. Arsitektur Box Model &amp; Spacing Discipline</h3>
              <p className="cluv-caption cluv-text-muted cluv-mb-4">
                Memahami batas antara <strong>Margin</strong> (ruang antar elemen saudara), <strong>Padding</strong> (ruang bernafas di dalam kontainer), dan <strong>Content</strong>:
              </p>

              <div className="cluv-blueprint-frame cluv-my-4">
                <div className="cluv-boxmodel-wrap">
                  <div className="cluv-boxmodel-margin">
                    <div className="cluv-flex-row cluv-justify-between cluv-mb-1" style={{ fontSize: '0.6875rem' }}>
                      <span>MARGIN (.cluv-mt-*, .cluv-mb-*, .cluv-my-*)</span>
                      <span className="cluv-blueprint-pill is-amber">Ruang Saudara Luar</span>
                    </div>
                    <div className="cluv-boxmodel-border">
                      <div className="cluv-flex-row cluv-justify-between cluv-mb-1" style={{ fontSize: '0.6875rem' }}>
                        <span>BORDER (1.5px Solid var(--cluv-border))</span>
                        <span className="cluv-blueprint-pill is-amber">Batas Fisik</span>
                      </div>
                      <div className="cluv-boxmodel-padding">
                        <div className="cluv-flex-row cluv-justify-between cluv-mb-1" style={{ fontSize: '0.6875rem' }}>
                          <span>PADDING (.cluv-p-*, .cluv-pt-*, .cluv-pb-*)</span>
                          <span className="cluv-blueprint-pill is-teal">Ruang Internal</span>
                        </div>
                        <div className="cluv-boxmodel-content">
                          KONTEN ELEMEN / TEKS / ATOM JSX
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Interactive Spacing Scale Visualizer */}
              <h3 className="cluv-title-card cluv-mt-6 cluv-mb-3">2. Skala Spacing Baku (Scale 0 &mdash; 9)</h3>
              <p className="cluv-caption cluv-text-muted cluv-mb-3">
                Klik salah satu step skala di bawah ini untuk melihat representasi fisik piksel dan nama kelasnya:
              </p>

              <div className="cluv-flex-row cluv-gap-2 cluv-flex-wrap cluv-mb-4">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => {
                  const pxMap: Record<number, number> = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48 }
                  return (
                    <button
                      key={step}
                      onClick={() => setActiveSpacingStep(step)}
                      className={`cluv-chip ${activeSpacingStep === step ? 'is-active' : ''}`}
                    >
                      Step {step} ({pxMap[step]}px)
                    </button>
                  )
                })}
              </div>

              {/* Live Spacing Preview Box */}
              {(() => {
                const pxMap: Record<number, number> = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48 }
                const currentPx = pxMap[activeSpacingStep]
                return (
                  <div className="cluv-card is-compact cluv-mb-4">
                    <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mb-3">
                      <div>
                        <span className="cluv-font-bold cluv-text-dark">Step {activeSpacingStep} = {currentPx}px</span>
                        <span className="cluv-caption cluv-text-muted cluv-ml-2">
                          {activeSpacingStep === 4 ? '(Ukuran dasar default 16px)' : ''}
                        </span>
                      </div>
                      <div className="cluv-flex-row cluv-gap-2">
                        <span className="cluv-docs-token-pill">.cluv-mt-{activeSpacingStep}</span>
                        <span className="cluv-docs-token-pill">.cluv-mb-{activeSpacingStep}</span>
                        <span className="cluv-docs-token-pill">.cluv-p-{activeSpacingStep}</span>
                        <span className="cluv-docs-token-pill">.cluv-gap-{activeSpacingStep}</span>
                      </div>
                    </div>

                    <div className="cluv-flex-row cluv-items-center cluv-gap-4" style={{ background: 'var(--cluv-neutral-100, #f1f5f9)', padding: 16, borderRadius: 8 }}>
                      <div
                        style={{
                          width: currentPx || 4,
                          height: 48,
                          background: currentPx === 0 ? '#ef4444' : '#1f9d97',
                          borderRadius: 4,
                          transition: 'width 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '0.625rem',
                          fontWeight: 800,
                        }}
                      >
                        {currentPx > 20 ? `${currentPx}px` : ''}
                      </div>
                      <div className="cluv-caption cluv-text-muted">
                        Visualisasi lebar ruang {currentPx}px pada antarmuka pengguna.
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* 3. Responsive Flexbox Playground */}
              <h3 className="cluv-title-card cluv-mt-6 cluv-mb-3">3. Responsive Flexbox (.cluv-flex-responsive)</h3>
              <p className="cluv-caption cluv-text-muted cluv-mb-3">
                Ubah simulator Viewport di atas ke <strong>Mobile (375px)</strong> untuk melihat demo di bawah otomatis bermutasi dari <em>horizontal row</em> menjadi <em>stacked full-width column</em>:
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW: .cluv-flex-responsive &mdash; VIEWPORT: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    <div className="cluv-flex-responsive cluv-gap-3" style={{ background: 'var(--cluv-surface, #ffffff)', padding: 16, border: '1.5px dashed var(--cluv-teal)', borderRadius: 12 }}>
                      <div className="cluv-flex-row cluv-items-center cluv-gap-2">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--cluv-teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cluv-teal)', fontWeight: 800 }}>1</div>
                        <div>
                          <div className="cluv-font-bold cluv-text-dark" style={{ fontSize: '0.875rem' }}>Blok Konten Kiri</div>
                          <div className="cluv-caption cluv-text-muted">Desktop: Horizontal baris</div>
                        </div>
                      </div>

                      <div className="cluv-flex-row cluv-gap-2 cluv-w-full-mobile">
                        <Button variant="outline" size="sm" className="cluv-w-full-mobile">Aksi Batal</Button>
                        <Button variant="primary" size="sm" className="cluv-w-full-mobile">Aksi Simpan</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Master Utility Lookup Table */}
              <h3 className="cluv-title-card cluv-mt-6 cluv-mb-3">4. Tabel Kamus Cepat Utilitas</h3>
              <table className="cluv-docs-table cluv-my-4">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Nama Kelas Universal</th>
                    <th>Fungsi CSS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Margin Top</strong></td>
                    <td><code>.cluv-mt-[0-9]</code></td>
                    <td><code>margin-top: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48]px !important;</code></td>
                  </tr>
                  <tr>
                    <td><strong>Margin Bottom</strong></td>
                    <td><code>.cluv-mb-[0-9]</code></td>
                    <td><code>margin-bottom: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48]px !important;</code></td>
                  </tr>
                  <tr>
                    <td><strong>Margin Vertical</strong></td>
                    <td><code>.cluv-my-[0-8]</code></td>
                    <td><code>margin-top &amp; margin-bottom: [0, 4, 8, 12, 16, 20, 24, 32, 40]px !important;</code></td>
                  </tr>
                  <tr>
                    <td><strong>Padding Universal</strong></td>
                    <td><code>.cluv-p-[0-8]</code></td>
                    <td><code>padding: [0, 4, 8, 12, 16, 20, 24, 32, 40]px;</code></td>
                  </tr>
                  <tr>
                    <td><strong>Gap Flex/Grid</strong></td>
                    <td><code>.cluv-gap-[1-7]</code></td>
                    <td><code>gap: [4, 8, 12, 16, 20, 24, 32]px;</code></td>
                  </tr>
                  <tr>
                    <td><strong>Direction Flex</strong></td>
                    <td><code>.cluv-flex-row</code> / <code>.cluv-flex-col</code></td>
                    <td><code>display: flex; flex-direction: row / column;</code></td>
                  </tr>
                  <tr>
                    <td><strong>Alignment Flex</strong></td>
                    <td><code>.cluv-flex-between</code> / <code>.cluv-flex-center</code></td>
                    <td><code>display: flex; align-items: center; justify-content: space-between / center;</code></td>
                  </tr>
                  <tr>
                    <td><strong>Responsive Direction</strong></td>
                    <td><code>.cluv-flex-responsive</code></td>
                    <td>Desktop: <code>flex-direction: row</code> &rarr; Mobile (&le;768px): <code>flex-direction: column !important</code></td>
                  </tr>
                  <tr>
                    <td><strong>Mobile Visibility</strong></td>
                    <td><code>.cluv-hide-mobile</code> / <code>.cluv-hide-desktop</code></td>
                    <td>Menyembunyikan elemen secara bersyarat pada breakpoint ponsel (&le;768px).</td>
                  </tr>
                </tbody>
              </table>
            </article>
          )}

          {/* =================================================================
              PAGE 6: BUTTON COMPONENT
              ================================================================= */}
          {activePage === 'buttons' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">COMPONENT</Badge>
              <h1 className="cluv-title-section cluv-m-0">Button (&lt;Button /&gt;)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Tombol universal dengan varian, ukuran, proteksi klik ganda saat <code>loading</code>, serta dukungan navigasi via <code>to="..."</code>.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-flex-col cluv-gap-4"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    <div className="cluv-flex-row cluv-flex-wrap cluv-gap-3 cluv-items-center">
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="danger">Danger</Button>
                    </div>
                    <div className="cluv-flex-row cluv-flex-wrap cluv-gap-3 cluv-items-center">
                      <Button variant="primary" size="sm">Small (38px)</Button>
                      <Button variant="primary" size="md">Medium (46px)</Button>
                      <Button variant="primary" size="lg">Large (52px)</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cluv-docs-code-wrap">
                <div className="cluv-docs-code-header">
                  <span>JSX Usage</span>
                  <button
                    className="cluv-docs-copy-btn"
                    onClick={() =>
                      handleCopy('btn-code', `<Button variant="primary" size="sm" to="/pricing">\n  Perpanjang Akses\n</Button>`)
                    }
                  >
                    {copiedKey === 'btn-code' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'btn-code' ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
                <pre className="cluv-docs-code-block">
{`<Button variant="primary" size="sm" to="/pricing">
  Perpanjang Akses
</Button>`}
                </pre>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 7: BADGE COMPONENT
              ================================================================= */}
          {activePage === 'badges' && (
            <article>
              <Badge variant="purple" size="sm" className="cluv-mb-2">COMPONENT</Badge>
              <h1 className="cluv-title-section cluv-m-0">Badge (&lt;Badge /&gt;)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Kapsul indikator status dengan dot, animasi pulse, dan varian warna semantik yang terstandarisasi.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; ALL VARIANTS</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div className="cluv-flex-row cluv-flex-wrap cluv-gap-3 cluv-items-center">
                    <Badge variant="teal" dot>PROFIL KULIT AKTIF</Badge>
                    <Badge variant="gold" dot pulse>PANDUAN SEBELUM FOTO</Badge>
                    <Badge variant="rose">PERHATIAN FORMULA</Badge>
                    <Badge variant="slate">SLATE METRIC</Badge>
                    <Badge variant="purple">AI INSIGHT</Badge>
                    <Badge variant="teal" size="sm">SMALL (11px)</Badge>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 8: ALERT & BANNER COMPONENT
              ================================================================= */}
          {activePage === 'alerts' && (
            <article>
              <Badge variant="rose" size="sm" className="cluv-mb-2">COMPONENT</Badge>
              <h1 className="cluv-title-section cluv-m-0">Alert &amp; Banner (&lt;Alert /&gt;)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Kotak notifikasi sistem ber-slot anatomis. Pada layar HP (&le; 640px), tombol dismiss <code>X</code> terkunci absolut di kanan atas, teks melebar bebas, dan tombol aksi otomatis turun rapi ke bawah.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-flex-col cluv-gap-3"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    {/* Warning Alert */}
                    <Alert
                      variant="warning"
                      title="Masa Aktif Paket Segera Berakhir"
                      action={<Button variant="primary" size="sm">Perpanjang</Button>}
                      onClose={() => alert('Dismiss clicked')}
                    >
                      Paket Akses kamu tersisa <strong>1 hari</strong> (26 Okt). Perpanjang sekarang agar akses AI scan tidak terhenti.
                    </Alert>

                    {/* Info Alert */}
                    <Alert
                      variant="info"
                      title="Pembaruan Engine Analisis Wajah v4"
                      action={<Button variant="outline" size="sm">Pelajari</Button>}
                      onClose={() => alert('Dismiss clicked')}
                    >
                      Fitur Face Scan kini dilengkapi deteksi toleransi bahan aktif formulir kosmetik.
                    </Alert>
                  </div>
                </div>
              </div>

              <div className="cluv-docs-code-wrap">
                <div className="cluv-docs-code-header">
                  <span>JSX Usage</span>
                  <button
                    className="cluv-docs-copy-btn"
                    onClick={() =>
                      handleCopy(
                        'alert-code',
                        `<Alert\n  variant="warning"\n  title="Masa Aktif Paket Segera Berakhir"\n  action={<Button variant="primary" size="sm">Perpanjang</Button>}\n  onClose={() => setShow(false)}\n>\n  Paket Akses kamu tersisa 1 hari.\n</Alert>`
                      )
                    }
                  >
                    {copiedKey === 'alert-code' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'alert-code' ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
                <pre className="cluv-docs-code-block">
{`<Alert
  variant="warning"
  title="Masa Aktif Paket Segera Berakhir"
  action={<Button variant="primary" size="sm">Perpanjang</Button>}
  onClose={() => setShow(false)}
>
  Paket Akses kamu tersisa <strong>1 hari</strong>.
</Alert>`}
                </pre>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 9: CARDS COMPONENT
              ================================================================= */}
          {activePage === 'cards' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">SURFACES</Badge>
              <h1 className="cluv-title-section cluv-m-0">Bento Card &amp; Standard Card</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Kartu kontainer serbaguna dengan padding fluida <code>clamp(20px, 3.5vw, 32px)</code> dan varian tint resmi.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-grid cluv-gap-4"
                    style={{
                      maxWidth: getSimulatedWidth(),
                      gridTemplateColumns: viewportMode === 'mobile' ? '1fr' : 'repeat(2, 1fr)',
                    }}
                  >
                    <div className="cluv-card is-tint-teal">
                      <Badge variant="teal" size="sm" className="cluv-mb-2">PROFIL KULIT AKTIF</Badge>
                      <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mb-2 cluv-micro">
                        <span className="cluv-text-muted">Tipe kulit:</span>
                        <strong className="cluv-text-dark">COMBINATION</strong>
                      </div>
                      <div className="cluv-flex-col cluv-gap-1 cluv-micro">
                        <span className="cluv-text-muted">Fokus kulit:</span>
                        <div className="cluv-flex-row cluv-flex-wrap cluv-gap-1">
                          <Badge variant="slate" size="sm">Sebum berlebih T-zone</Badge>
                          <Badge variant="slate" size="sm">Pori tersumbat</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="cluv-card is-tint-gold">
                      <Badge variant="gold" size="sm" className="cluv-mb-2">PANDUAN SEBELUM FOTO</Badge>
                      <p className="cluv-micro cluv-text-muted cluv-m-0 cluv-mb-3">
                        Pastikan pencahayaan cukup dan wajah bersih sebelum mengambil foto scan.
                      </p>
                      <div className="cluv-flex-row cluv-gap-2 cluv-items-center">
                        <div className="cluv-card-icon-wrap is-sm is-gold cluv-m-0">
                          <Sun size={16} />
                        </div>
                        <div className="cluv-micro">
                          <strong className="cluv-text-dark">Pencahayaan Alami</strong>
                          <p className="cluv-text-muted cluv-m-0">Gunakan cahaya pagi/siang tanpa flash.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 10: CARD STRIPS & ACTION TILES
              ================================================================= */}
          {activePage === 'card-strips' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">NAVIGATION</Badge>
              <h1 className="cluv-title-section cluv-m-0">Card Strip (.cluv-card-strip)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Baris aksi interaktif 1-tap untuk menu navigasi profil, faktur pembayaran, dan pengaturan. Ikon panah selalu stabil terkunci di kanan tanpa terlempar ke bawah.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-flex-col cluv-gap-2.5"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    <div className="cluv-card-strip is-neutral is-interactive">
                      <div className="cluv-card-strip-main">
                        <div className="cluv-card-icon-wrap is-sm">
                          <Receipt size={16} />
                        </div>
                        <div className="cluv-card-strip-body">
                          <h4 className="cluv-card-strip-title">Faktur &amp; Tagihan Tripay</h4>
                          <p className="cluv-caption cluv-text-muted cluv-m-0">Status pembayaran langganan</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="cluv-text-muted" />
                    </div>

                    <div className="cluv-card-strip is-neutral is-interactive">
                      <div className="cluv-card-strip-main">
                        <div className="cluv-card-icon-wrap is-sm is-gold">
                          <History size={16} />
                        </div>
                        <div className="cluv-card-strip-body">
                          <h4 className="cluv-card-strip-title">Mutasi AI Credits</h4>
                          <p className="cluv-caption cluv-text-muted cluv-m-0">Riwayat debit dan perolehan credits</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="cluv-text-muted" />
                    </div>

                    <div className="cluv-card-strip is-neutral is-interactive">
                      <div className="cluv-card-strip-main">
                        <div className="cluv-card-icon-wrap is-sm is-rose">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="cluv-card-strip-body">
                          <h4 className="cluv-card-strip-title">Admin Control Center</h4>
                          <p className="cluv-caption cluv-text-muted cluv-m-0">Panel manajemen sistem Skincluv</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="cluv-text-muted" />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 2: ACCORDION COMPONENT
              ================================================================= */}
          {activePage === 'accordions' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">COMPONENT</Badge>
              <h1 className="cluv-title-section cluv-m-0">Accordion (.cluv-accordion)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Komponen buka-tutup serbaguna untuk daftar FAQ, rincian pembayaran bertahap, dan pengungkapan informasi klinis berjenjang (*progressive disclosure*).
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; INTERACTIVE</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-accordion"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    {/* Item 1 */}
                    <div className="cluv-accordion-item">
                      <button
                        type="button"
                        className="cluv-accordion-trigger"
                        onClick={() => setOpenAccordion(openAccordion === 1 ? null : 1)}
                      >
                        <span>Bagaimana cara kerja AI Face Scan Skincluv?</span>
                        <ChevronDown
                          size={18}
                          className={`cluv-accordion-chevron ${openAccordion === 1 ? 'rotate' : ''}`}
                          style={{
                            transform: openAccordion === 1 ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                          }}
                        />
                      </button>
                      {openAccordion === 1 && (
                        <div className="cluv-accordion-body" style={{ padding: '0 22px 20px' }}>
                          <p className="cluv-body cluv-text-muted cluv-m-0">
                            AI kami memetakan topologi tekstur wajah menggunakan computer vision, menganalisis kondisi pori-pori, kelembapan stratum korneum, dan sebum, lalu mencocokkannya dengan basis data aturan klinis deterministik.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Item 2 */}
                    <div className="cluv-accordion-item">
                      <button
                        type="button"
                        className="cluv-accordion-trigger"
                        onClick={() => setOpenAccordion(openAccordion === 2 ? null : 2)}
                      >
                        <span>Apakah foto wajah saya aman dan terjaga privasinya?</span>
                        <ChevronDown
                          size={18}
                          className={`cluv-accordion-chevron ${openAccordion === 2 ? 'rotate' : ''}`}
                          style={{
                            transform: openAccordion === 2 ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                          }}
                        />
                      </button>
                      {openAccordion === 2 && (
                        <div className="cluv-accordion-body" style={{ padding: '0 22px 20px' }}>
                          <p className="cluv-body cluv-text-muted cluv-m-0">
                            Sangat aman. Skincluv sepenuhnya mematuhi UU PDP No. 27/2022. Foto Anda disimpan dalam bucket privat terenkripsi dan dapat Anda hapus secara permanen kapan saja (*Right to be Forgotten*).
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cluv-docs-code-wrap">
                <div className="cluv-docs-code-header">
                  <span>HTML &amp; CSS Structure</span>
                  <button
                    className="cluv-docs-copy-btn"
                    onClick={() =>
                      handleCopy(
                        'accordion-code',
                        `<div className="cluv-accordion">\n  <div className="cluv-accordion-item">\n    <button className="cluv-accordion-trigger">\n      <span>Pertanyaan FAQ...</span>\n      <ChevronDown className="cluv-accordion-chevron" />\n    </button>\n    <div className="cluv-accordion-body">\n      <p>Jawaban rincian...</p>\n    </div>\n  </div>\n</div>`
                      )
                    }
                  >
                    {copiedKey === 'accordion-code' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'accordion-code' ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
                <pre className="cluv-docs-code-block">
{`<div className="cluv-accordion">
  <div className="cluv-accordion-item">
    <button className="cluv-accordion-trigger">
      <span>Pertanyaan FAQ...</span>
      <ChevronDown className="cluv-accordion-chevron" />
    </button>
    <div className="cluv-accordion-body">
      <p>Jawaban rincian...</p>
    </div>
  </div>
</div>`}
                </pre>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 2: MODAL DIALOG COMPONENT
              ================================================================= */}
          {activePage === 'modals' && (
            <article>
              <Badge variant="purple" size="sm" className="cluv-mb-2">OVERLAY</Badge>
              <h1 className="cluv-title-section cluv-m-0">Modal Dialog (.cluv-modal)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Dialog interaktif dengan backdrop blur (<code>backdrop-filter: blur(8px)</code>), radius membulat konsisten, dan 3 slot anatomis (Header, Body, Footer).
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE DEMO TRIGGER</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div className="cluv-flex-col cluv-items-center cluv-gap-3">
                    <p className="cluv-caption cluv-text-muted cluv-m-0">
                      Klik tombol di bawah untuk melihat live rendering modal popup dengan backdrop blur:
                    </p>
                    <Button variant="primary" onClick={() => setShowModalDemo(true)}>
                      Buka Contoh Modal (.cluv-modal)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Live Modal Render */}
              {showModalDemo && (
                <div className="cluv-modal-overlay" onClick={() => setShowModalDemo(false)}>
                  <div className="cluv-modal-box" onClick={e => e.stopPropagation()}>
                    <div className="cluv-modal-header">
                      <h3 className="cluv-modal-title">Konfirmasi Hapus Riwayat Scan</h3>
                      <button
                        className="cluv-modal-close"
                        onClick={() => setShowModalDemo(false)}
                        aria-label="Tutup"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="cluv-modal-body" style={{ padding: '20px 24px' }}>
                      <p className="cluv-body cluv-text-muted cluv-m-0">
                        Apakah Anda yakin ingin menghapus rekam jejak scan wajah tanggal 24 Oktober 2026? Tindakan ini atomik dan tidak dapat dibatalkan.
                      </p>
                    </div>
                    <div
                      className="cluv-modal-footer"
                      style={{
                        padding: '16px 24px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        borderTop: '1px solid var(--cluv-current-border, #e2e8f0)',
                      }}
                    >
                      <Button variant="ghost" size="sm" onClick={() => setShowModalDemo(false)}>
                        Batal
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setShowModalDemo(false)}>
                        Hapus Permanen
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="cluv-docs-code-wrap">
                <div className="cluv-docs-code-header">
                  <span>HTML &amp; CSS Structure</span>
                  <button
                    className="cluv-docs-copy-btn"
                    onClick={() =>
                      handleCopy(
                        'modal-code',
                        `<div className="cluv-modal-overlay">\n  <div className="cluv-modal-box is-sm">\n    <div className="cluv-modal-header">\n      <h3 className="cluv-modal-title">Judul Dialog</h3>\n      <button className="cluv-modal-close"><X size={18} /></button>\n    </div>\n    <div className="cluv-modal-body">\n      <p>Konten dialog...</p>\n    </div>\n    <div className="cluv-modal-footer">\n      <Button variant="ghost">Batal</Button>\n      <Button variant="primary">Simpan</Button>\n    </div>\n  </div>\n</div>`
                      )
                    }
                  >
                    {copiedKey === 'modal-code' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'modal-code' ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
                <pre className="cluv-docs-code-block">
{`<div className="cluv-modal-overlay">
  <div className="cluv-modal-box is-sm">
    <div className="cluv-modal-header">
      <h3 className="cluv-modal-title">Judul Dialog</h3>
      <button className="cluv-modal-close"><X size={18} /></button>
    </div>
    <div className="cluv-modal-body">
      <p>Konten dialog...</p>
    </div>
    <div className="cluv-modal-footer">
      <Button variant="ghost">Batal</Button>
      <Button variant="primary">Simpan</Button>
    </div>
  </div>
</div>`}
                </pre>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 2: STAT & METRIC CARDS
              ================================================================= */}
          {activePage === 'stats' && (
            <article>
              <Badge variant="gold" size="sm" className="cluv-mb-2">DATA DISPLAY</Badge>
              <h1 className="cluv-title-section cluv-m-0">Stat &amp; Metric Cards (.cluv-stat-card)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Kartu ringkasan metrik statistik untuk dashboard user dan admin (saldo kuota, persentase tren perkembangan kulit, dan bilah progres misi harian).
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-stat-grid"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    {/* Stat 1 */}
                    <div className="cluv-stat-card is-interactive">
                      <div className="cluv-stat-header">
                        <span className="cluv-stat-label">Saldo AI Credits</span>
                        <div className="cluv-stat-icon is-gold">
                          <Zap size={16} />
                        </div>
                      </div>
                      <div className="cluv-stat-val">1.395</div>
                      <div className="cluv-stat-meta">Tersisa &bull; Paket Pro Glow</div>
                    </div>

                    {/* Stat 2 */}
                    <div className="cluv-stat-card is-interactive">
                      <div className="cluv-stat-header">
                        <span className="cluv-stat-label">Skor Barrier Kulit</span>
                        <div className="cluv-stat-icon is-teal">
                          <ShieldCheck size={16} />
                        </div>
                      </div>
                      <div className="cluv-stat-val">88/100</div>
                      <div className="cluv-stat-meta is-positive">&uarr; +4.2% vs 28 hari lalu</div>
                    </div>

                    {/* Stat 3 */}
                    <div className="cluv-stat-card is-interactive">
                      <div className="cluv-stat-header">
                        <span className="cluv-stat-label">Misi Glow Harian</span>
                        <div className="cluv-stat-icon is-rose">
                          <Flame size={16} />
                        </div>
                      </div>
                      <div className="cluv-stat-val">4 / 5 Selesai</div>
                      <div className="cluv-progress-track is-sm cluv-mt-2">
                        <div className="cluv-progress-bar is-gold" style={{ width: '80%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cluv-docs-code-wrap">
                <div className="cluv-docs-code-header">
                  <span>HTML &amp; CSS Structure</span>
                  <button
                    className="cluv-docs-copy-btn"
                    onClick={() =>
                      handleCopy(
                        'stat-code',
                        `<div className="cluv-stat-grid cols-2">\n  <div className="cluv-stat-card is-interactive">\n    <div className="cluv-stat-header">\n      <span className="cluv-stat-label">Saldo AI Credits</span>\n      <div className="cluv-stat-icon is-gold"><Zap size={16} /></div>\n    </div>\n    <div className="cluv-stat-val">1.395</div>\n    <div className="cluv-stat-meta">Tersisa &bull; Paket Pro Glow</div>\n  </div>\n</div>`
                      )
                    }
                  >
                    {copiedKey === 'stat-code' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'stat-code' ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
                <pre className="cluv-docs-code-block">
{`<div className="cluv-stat-grid cols-2">
  <div className="cluv-stat-card is-interactive">
    <div className="cluv-stat-header">
      <span className="cluv-stat-label">Saldo AI Credits</span>
      <div className="cluv-stat-icon is-gold"><Zap size={16} /></div>
    </div>
    <div className="cluv-stat-val">1.395</div>
    <div className="cluv-stat-meta">Tersisa &bull; Paket Pro Glow</div>
  </div>
</div>`}
                </pre>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 2: INSET CHECKLIST ROUTINE
              ================================================================= */}
          {activePage === 'checklist' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">GAMIFICATION &amp; HABIT</Badge>
              <h1 className="cluv-title-section cluv-m-0">Inset Checklist Routine (.cluv-checklist-group)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Pola daftar tugas kompak untuk rutinitas skincare pagi/malam dan misi harian. Mencegah <em>scroll-fatigue</em> di mobile daripada menumpuk kartu berbingkai tebal.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; INTERACTIVE CHECKBOXES</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-checklist-group"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    {/* Mission 1 */}
                    <div
                      className={`cluv-check-item ${checkedMissions[1] ? 'is-checked' : ''}`}
                      onClick={() => setCheckedMissions(prev => ({ ...prev, 1: !prev[1] }))}
                    >
                      <div className="cluv-check-box">
                        <CheckCircle2 size={20} color={checkedMissions[1] ? '#10b981' : '#94a3b8'} />
                      </div>
                      <div className="cluv-flex-1">
                        <div className="cluv-check-title cluv-font-bold cluv-text-dark">
                          Cuci Muka Gentle Low pH (Pagi)
                        </div>
                        <span className="cluv-micro cluv-text-muted">Bersihkan sebum berlebih tanpa mengikis skin barrier</span>
                      </div>
                      <Badge variant="gold" size="sm">+10 Pts</Badge>
                    </div>

                    {/* Mission 2 */}
                    <div
                      className={`cluv-check-item ${checkedMissions[2] ? 'is-checked' : ''}`}
                      onClick={() => setCheckedMissions(prev => ({ ...prev, 2: !prev[2] }))}
                    >
                      <div className="cluv-check-box">
                        <CheckCircle2 size={20} color={checkedMissions[2] ? '#10b981' : '#94a3b8'} />
                      </div>
                      <div className="cluv-flex-1">
                        <div className="cluv-check-title cluv-font-bold cluv-text-dark">
                          Aplikasikan Sunscreen Broad Spectrum SPF 50
                        </div>
                        <span className="cluv-micro cluv-text-muted">Perlindungan UVA/UVB sebelum beraktivitas di luar ruangan</span>
                      </div>
                      <Badge variant="gold" size="sm">+15 Pts</Badge>
                    </div>

                    {/* Mission 3 */}
                    <div
                      className={`cluv-check-item ${checkedMissions[3] ? 'is-checked' : ''}`}
                      onClick={() => setCheckedMissions(prev => ({ ...prev, 3: !prev[3] }))}
                    >
                      <div className="cluv-check-box">
                        <CheckCircle2 size={20} color={checkedMissions[3] ? '#10b981' : '#94a3b8'} />
                      </div>
                      <div className="cluv-flex-1">
                        <div className="cluv-check-title cluv-font-bold cluv-text-dark">
                          Face Scan Mingguan (Progress Baseline)
                        </div>
                        <span className="cluv-micro cluv-text-muted">Evaluasi perubahan tekstur kulit setelah 7 hari perawatan</span>
                      </div>
                      <Badge variant="teal" size="sm">+25 Pts</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE: SEGMENTED TABS
              ================================================================= */}
          {activePage === 'tabs' && (
            <article>
              <Badge variant="gold" size="sm" className="cluv-mb-2">NAVIGATION</Badge>
              <h1 className="cluv-title-section cluv-m-0">Segmented Tabs (.cluv-tabs)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Kontrol tab horizontal kapsul dengan proteksi touch-swipe otomatis pada layar mobile (&le; 640px).
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body is-left">
                  <div
                    className="cluv-docs-preview-simulated-canvas"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    <div className="cluv-tabs">
                      <button
                        className={`cluv-tab-btn ${activeTabDemo === 'face' ? 'is-active' : ''}`}
                        onClick={() => setActiveTabDemo('face')}
                      >
                        <Scan size={14} /> Analisis Wajah AI (11)
                      </button>
                      <button
                        className={`cluv-tab-btn ${activeTabDemo === 'ingredient' ? 'is-active' : ''}`}
                        onClick={() => setActiveTabDemo('ingredient')}
                      >
                        <FlaskConical size={14} /> Evaluasi Formula Skincare (15)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              PAGE 12: FORM INPUTS & FIELDS
              ================================================================= */}
          {activePage === 'forms' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">FORMS</Badge>
              <h1 className="cluv-title-section cluv-m-0">Form Inputs &amp; Fields (.cluv-field)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Grup formulir dengan focus ring teal, label kanonikal, dan pesan bantuan terstruktur.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-flex-col cluv-gap-3"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    <div className="cluv-field">
                      <label className="cluv-label">Nama Lengkap</label>
                      <input
                        type="text"
                        className="cluv-input"
                        placeholder="Masukkan nama lengkap Anda..."
                        defaultValue="Jessy Kang"
                      />
                    </div>
                    <div className="cluv-field">
                      <label className="cluv-label">Tipe Kulit Utama</label>
                      <select className="cluv-select">
                        <option>Kombinasi (T-zone Berminyak)</option>
                        <option>Kering (Sensitif)</option>
                        <option>Berminyak (Rentan Jerawat)</option>
                        <option>Normal</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 3: TRUST STRIP COMPONENT
              ================================================================= */}
          {activePage === 'trust-strip' && (
            <article>
              <Badge variant="teal" size="sm" className="cluv-mb-2">REASSURANCE</Badge>
              <h1 className="cluv-title-section cluv-m-0">Trust Strip (.cluv-trust-strip)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Mikro-copy penenang psikologis tepat di bawah tombol CTA konversi (di formulir pendaftaran, checkout paket, dan landing page).
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; MODE: {viewportMode.toUpperCase()}</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-flex-col cluv-items-center"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    <Button variant="primary" size="md">
                      Mulai Analisis Kulit Sekarang
                    </Button>

                    <div className="cluv-trust-strip">
                      <div className="cluv-trust-item">
                        <ShieldCheck size={14} className="cluv-trust-icon" />
                        <span>Gratis Pendaftaran</span>
                      </div>
                      <span className="cluv-trust-dot">&bull;</span>
                      <div className="cluv-trust-item">
                        <CreditCard size={14} className="cluv-trust-icon" />
                        <span>Tanpa Kartu Kredit</span>
                      </div>
                      <span className="cluv-trust-dot">&bull;</span>
                      <div className="cluv-trust-item">
                        <Lock size={14} className="cluv-trust-icon" />
                        <span>100% Aman Privasi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cluv-docs-code-wrap">
                <div className="cluv-docs-code-header">
                  <span>HTML &amp; CSS Structure</span>
                  <button
                    className="cluv-docs-copy-btn"
                    onClick={() =>
                      handleCopy(
                        'trust-code',
                        `<div className="cluv-trust-strip">\n  <div className="cluv-trust-item">\n    <ShieldCheck size={14} className="cluv-trust-icon" />\n    <span>Gratis Pendaftaran</span>\n  </div>\n  <span className="cluv-trust-dot">&bull;</span>\n  <div className="cluv-trust-item">\n    <CreditCard size={14} className="cluv-trust-icon" />\n    <span>Tanpa Kartu Kredit</span>\n  </div>\n  <span className="cluv-trust-dot">&bull;</span>\n  <div className="cluv-trust-item">\n    <Lock size={14} className="cluv-trust-icon" />\n    <span>100% Aman Privasi</span>\n  </div>\n</div>`
                      )
                    }
                  >
                    {copiedKey === 'trust-code' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'trust-code' ? 'Tersalin!' : 'Salin Kode'}
                  </button>
                </div>
                <pre className="cluv-docs-code-block">
{`<div className="cluv-trust-strip">
  <div className="cluv-trust-item">
    <ShieldCheck size={14} className="cluv-trust-icon" />
    <span>Gratis Pendaftaran</span>
  </div>
  <span className="cluv-trust-dot">&bull;</span>
  <div className="cluv-trust-item">
    <CreditCard size={14} className="cluv-trust-icon" />
    <span>Tanpa Kartu Kredit</span>
  </div>
  <span className="cluv-trust-dot">&bull;</span>
  <div className="cluv-trust-item">
    <Lock size={14} className="cluv-trust-icon" />
    <span>100% Aman Privasi</span>
  </div>
</div>`}
                </pre>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 3: LOADING STATES & SKELETONS
              ================================================================= */}
          {activePage === 'loading-states' && (
            <article>
              <Badge variant="purple" size="sm" className="cluv-mb-2">FEEDBACK</Badge>
              <h1 className="cluv-title-section cluv-m-0">Loading, Skeletons &amp; Empty State</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Primitif transisi untuk menunggu proses data asinkron dan tampilan informatif saat data belum tersedia.
              </p>

              <div className="cluv-docs-preview-frame cluv-my-4">
                <div className="cluv-docs-preview-header">
                  <span>LIVE PREVIEW &mdash; SPINNERS &amp; SHIMMER</span>
                  <span>Lebar: {getSimulatedWidth()}</span>
                </div>
                <div className="cluv-docs-preview-body">
                  <div
                    className="cluv-docs-preview-simulated-canvas cluv-flex-col cluv-gap-4"
                    style={{ maxWidth: getSimulatedWidth() }}
                  >
                    {/* Spinners */}
                    <div>
                      <div className="cluv-micro cluv-font-bold cluv-text-muted cluv-mb-2">CIRCULAR SPINNERS:</div>
                      <div className="cluv-flex-row cluv-items-center cluv-gap-3">
                        <span className="cluv-spinner is-sm" />
                        <span className="cluv-spinner" />
                        <span className="cluv-spinner is-lg" />
                      </div>
                    </div>

                    {/* Skeletons */}
                    <div>
                      <div className="cluv-micro cluv-font-bold cluv-text-muted cluv-mb-2">SHIMMER SKELETONS:</div>
                      <div className="cluv-card cluv-p-4">
                        <div className="cluv-flex-row cluv-items-center cluv-gap-3 cluv-mb-3">
                          <span className="cluv-skeleton is-avatar" />
                          <div className="cluv-flex-1">
                            <span className="cluv-skeleton is-title" style={{ width: '40%' }} />
                            <span className="cluv-skeleton is-text" style={{ width: '70%' }} />
                          </div>
                        </div>
                        <span className="cluv-skeleton is-text" />
                        <span className="cluv-skeleton is-text" style={{ width: '85%' }} />
                      </div>
                    </div>

                    {/* Empty State */}
                    <div>
                      <div className="cluv-micro cluv-font-bold cluv-text-muted cluv-mb-2">EMPTY STATE CARD:</div>
                      <EmptyState
                        icon={Scan}
                        title="Belum Ada Rekam Jejak Scan"
                        description="Mulai scan wajah pertama Anda untuk melihat evaluasi pori, kelembapan, dan barrier kulit."
                        action={{
                          label: 'Mulai Scan Wajah',
                          onClick: () => alert('Aksi Scan Wajah'),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* =================================================================
              FASE 3: AI SKILL INSPECTOR
              ================================================================= */}
          {activePage === 'ai-skill-viewer' && (
            <article>
              <div className="cluv-flex-row cluv-justify-between cluv-items-center cluv-flex-wrap cluv-gap-2 cluv-mb-2">
                <Badge variant="purple" size="sm">AI COUNCIL &amp; MEMORY</Badge>
                <button
                  className="cluv-btn is-outline is-sm"
                  onClick={() =>
                    handleCopy(
                      'ai-skill-full',
                      `# 🎨 Skincluv Frontend Architecture & Master Consensus\nDoktrin Cluv Framework:\n1. 100% Pure Cluv Framework (Zero Tailwind, Zero Hardcoded Hex)\n2. Zero Layout Inline Styles\n3. No Island <style> Blocks\n4. Strict Frontend Boundary\n5. 4 Golden Invariants: Tabula Rasa, No Old Style, No Ad-hoc Class, Wajib Diskusi.\nPembagian Wilayah:\n- Generic: src/styles/cluv/components/\n- Eksklusif: .cluv-avatar-ring, .cluv-credit-capsule, .cluv-camera-viewfinder\nBreakpoints Resmi:\n- Mobile <= 640px\n- Tablet 641px - 1024px\n- Desktop > 1024px`
                    )
                  }
                >
                  <Bot size={14} className="cluv-mr-1" />
                  {copiedKey === 'ai-skill-full' ? 'Tersalin ke Clipboard!' : 'Salin Konteks Skill AI'}
                </button>
              </div>

              <h1 className="cluv-title-section cluv-m-0">AI Skill Inspector (SKILL.md)</h1>
              <p className="cluv-body cluv-text-muted cluv-mt-2">
                Memori permanen dan aturan baku bagi seluruh AI (Claude, ChatGPT, DeepSeek, Antigravity) saat menulis kode di repository Skincluv.
              </p>

              <div className="cluv-flex-col cluv-gap-3 cluv-my-4">
                <div className="cluv-card is-tint-teal">
                  <div className="cluv-font-bold cluv-text-dark">Arsitektur 3 Lapis Triad</div>
                  <div className="cluv-caption cluv-text-muted cluv-mt-1">
                    <strong>Lapis 1</strong>: Design Tokens &amp; Utilities (CSS variables di <code>:root</code>)<br />
                    <strong>Lapis 2</strong>: CSS Component Base + Slot Architecture + Modifier <code>.is-*</code><br />
                    <strong>Lapis 3</strong>: Type-Safe React UI Components (<code>&lt;Button /&gt;</code>, <code>&lt;Badge /&gt;</code>, <code>&lt;Alert /&gt;</code>)
                  </div>
                </div>

                <div className="cluv-card is-tint-gold">
                  <div className="cluv-font-bold cluv-text-dark">Kepatuhan UU PDP No. 27/2022 (Right to be Forgotten)</div>
                  <p className="cluv-caption cluv-text-muted cluv-m-0 cluv-mt-1">
                    Frontend dilarang membocorkan foto biometrik user ke komponen pihak ketiga. Ketika memory consent dimatikan atau riwayat scan dihapus, visual card wajib berstatus <em>unavailable</em> secara atomik.
                  </p>
                </div>

                <div className="cluv-card">
                  <div className="cluv-font-bold cluv-text-dark">Tujuh Checklist Verifikasi Sebelum Selesai:</div>
                  <ul className="cluv-caption cluv-text-muted cluv-mt-2 cluv-pl-4">
                    <li>Tidak ada class Tailwind / non-cluv yang lolos.</li>
                    <li>Tidak ada warna hex manual di JSX (gunakan <code>var(--cluv-*)</code>).</li>
                    <li>Tidak ada inline style layout di JSX.</li>
                    <li>Layar mobile kompak dengan padding 16px dan touch target &ge; 44px.</li>
                    <li>Layar desktop terkunci sejajar 40px pada anchor kiri.</li>
                    <li>Bebas dead code dan lolos compile <code>tsc -b</code> 0 error.</li>
                  </ul>
                </div>
              </div>
            </article>
          )}

          {/* Bottom Pagination Links */}
          <footer
            className="cluv-flex-row cluv-justify-between cluv-items-center cluv-mt-8 cluv-pt-6"
            style={{ borderTop: '1px solid var(--cluv-neutral-200, #e2e8f0)' }}
          >
            {prevPage ? (
              <button
                onClick={() => handleNavigate(prevPage.id)}
                className="cluv-btn is-outline is-sm"
              >
                <ArrowLeft size={14} className="cluv-mr-1" /> {prevPage.title}
              </button>
            ) : <div />}

            {nextPage ? (
              <button
                onClick={() => handleNavigate(nextPage.id)}
                className="cluv-btn is-primary is-sm"
              >
                {nextPage.title} <ArrowRight size={14} className="cluv-ml-1" />
              </button>
            ) : <div />}
          </footer>
        </div>
      </main>
    </div>
  )
}

# ⚡ CLUV Micro-Framework: AI Quick-Reference & Cheat-Sheet

> **Tujuan Dokumen**: Referensi ringkas, terstruktur, dan berdensitas tinggi (*AI-optimized cheat-sheet*) untuk seluruh model AI (Antigravity, Claude, ChatGPT, DeepSeek, Kimi). AI **TIDAK PERLU** membaca ribuan baris file CSS `src/styles/cluv/` untuk mengetahui class apa yang harus dipakai. Cukup jadikan file ini sebagai panduan cepat saat menulis kode JSX/TSX.

---

## 1. Tiga Doktrin Mutlak (The 3 Golden Invariants)

> 🔴 **1. TIDAK BOLEH PAKE STYLE LAMA**:  
> Dilarang keras mempertahankan gaya visual, tata letak kusam, border tebal kaku, atau display lama peninggalan v0. Seluruh elemen wajib bermutasi menjadi desain Cluv murni (`#ffffff` surface, border 1.5px crisp, radius membulat elegan, icon wrap pastel).
>
> 🔴 **2. TIDAK BOLEH ASAL UBAH / BIKIN NAMA KELAS**:  
> Dilarang keras membuat class CSS ad-hoc per-halaman di `src/styles/cluv/app/*.css` untuk sesuatu yang seharusnya menjadi Utility atau Component universal. Dilarang sekadar me-rename `v0-*` menjadi `cluv-*` tanpa menyelaraskan CSS-nya.
>
> 🔴 **3. WAJIB DISKUSI KELAS YG SUDAH ADA MAUPUN YG BELUM ADA DAN AKAN DIGUNAKAN**:  
> Sebelum menyentuh kode CSS atau JSX:
> - Cek tabel Quick Lookup di bawah ini sebelum membuat class baru.
> - Jika membutuhkan komponen/layout yang belum ada di framework: **WAJIB DISKUSIKAN TERLEBIH DAHULU DENGAN USER**. Rumuskan lego-nya (nama class, slot, modifier), lalu bangun di `src/styles/cluv/components/`, BUKAN di CSS lokal halaman!

### Aturan Arsitektur Tambahan
1. **Prefix Wajib**: Komponen universal SELALU berawalan `.cluv-`. Dilarang membuat class baru dengan nama halaman (misal: `.faq-card`, `.login-btn`).
2. **Larangan Class Telanjang**: DILARANG memakai kata telanjang seperti `sm`, `primary`, atau `admin`. Wajib gunakan modifier **`is-*`** (contoh: `.is-primary`, `.is-sm`, `.is-pill`).
3. **Contextual Cascade**: Jangan mengetik `.is-admin` di setiap elemen admin. Cukup bungkus halaman di `.cluv-surface-admin`, semua komponen otomatis berpenampilan admin.
4. **Hukum Komponen Mandiri (Zero Outer Margin)**: Komponen (`.cluv-card`, `.cluv-btn`, `.cluv-badge`, `.cluv-alert`) **DILARANG** memiliki margin luar bawaan (`margin: 0`) dan **DILARANG** ditimpa utility padding (misal: `<div className="cluv-card cluv-p-6">` dilarang keras! Gunakan padding responsif bawaan kartu atau modifier `.is-compact`).
5. **Separation of Spacing (Makro vs Mikro)**: Jarak vertikal babak halaman 100% diatur oleh `.cluv-section` (`clamp(40px, 5vw, 64px) 0`). Wrapper halaman root DILARANG memiliki `padding-bottom` tambahan. Utilitas spacing (`.cluv-mt-*`, `.cluv-mb-*`) HANYA boleh dipakai untuk ritme mikro teks/tombol saudara di dalam kontainer.
6. **Pemisahan Tegas Utility vs Component**:
   - **Utility**: Atomik (1-2 properti untuk suntik instan di JSX): `.cluv-flex`, `.cluv-flex-col`, `.cluv-gap-3`, `.cluv-mt-4`, `.cluv-text-center`, `.cluv-w-full`.
   - **Component**: Wadah terstruktur dengan base class + modifier `.is-*`: `.cluv-btn.is-primary`, `.cluv-card`, `.cluv-bento-grid.is-hero`, `.cluv-bento-card`, `.cluv-badge.is-teal`.
7. **SOP 5 Langkah Wajib Styling & Refactoring (The 5-Step Bottom-Up Cascade)**:
   - `[1. Tokens]` ➔ Cek `tokens.css` (var `--cluv-*`, no hardcoded hex/px).
   - `[2. Utilities]` ➔ Cek `utilities.css` (flex, spacing, gap, alignment).
   - `[3. Generic Component]` ➔ Cek/buat di `components/` (Base Class + `.is-*`).
   - `[4. Assembling JSX]` ➔ Susun di `.tsx` layaknya lego.
   - `[5. Dead Code Purge]` ➔ Hapus selector ad-hoc lama di CSS halaman (`dashboard.css`, dll).

---

## 2. Quick Lookup Table (Kamus Cepat Class)

| Kategori | Class Kanonikal Utama | Modifiers (`is-*`) | Child / Sub-elements | Kegunaan Singkat |
| :--- | :--- | :--- | :--- | :--- |
| **Surfaces** | `.cluv-surface-public`<br>`.cluv-surface-app`<br>`.cluv-surface-admin` | - | - | Dipasang di root layout / shell halaman untuk mengatur font, radius, & density otomatis. |
| **Page Root** | `.cluv-page` | `.is-centered` | - | Root wrapper kanvas halaman (wajib padding 0! & margin 0! untuk mencegah phantom gaps). |
| **Containers** | `.cluv-container` | `.is-narrow` (720px)<br>`.is-md` (1040px)<br>`.is-wide` (1360px)<br>`.is-fluid` (100%) | - | Pembatas lebar konten responsif (default 1200px boxed). |
| **Sections** | `.cluv-section` | `.is-dense` (rapat)<br>`.is-spacious` (lega)<br>`.is-alt` (abu/subtle)<br>`.is-dark` (malam/gelap) | - | Pembungkus babak/seksi halaman dengan vertical padding standar. |
| **Section Header** | `.cluv-section-header` | `.is-compact` (24px mb)<br>`.is-wide` (820px)<br>`.is-left` (rata kiri) | - | Blok terpusat judul + subtitle + badge dengan batas lebar proporsional (max-w 680px). |
| **Button Group** | `.cluv-btn-group` | `.is-center`<br>`.is-right`<br>`.is-compact`<br>`.is-stack-mobile` | - | Merapikan barisan tombol agar sejajar dan responsif di mobile. |
| **Grid** | `.cluv-grid` | `.cols-2`<br>`.cols-3`<br>`.cols-4`<br>`.is-auto-fit` | - | Grid responsif otomatis (berubah jadi 1 kolom di HP). |
| **Typography** | `.cluv-title-hero`<br>`.cluv-title-section`<br>`.cluv-title-card`<br>`.cluv-lead`<br>`.cluv-subtitle`<br>`.cluv-body`<br>`.cluv-caption`<br>`.cluv-micro` | `.is-sm` (untuk card title) | - | Skala tipografi fluida clamp() untuk H1, H2, H3, intro hero (`.cluv-lead` 18-20px), subtitle seksi (`.cluv-subtitle` 15-16px), paragraf, dan fine print. |
| **Utilities: Spacing** | `.cluv-mt-[1-8]`<br>`.cluv-mb-[1-8]`<br>`.cluv-my-[1-8]`<br>`.cluv-p-[0-8]`<br>`.cluv-gap-[1-7]` | Scale: 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 7(32px), 8(40px) | - | Jarak margin, padding, dan gap baku (100% pengganti utility Tailwind). |
| **Utilities: Flex & Align** | `.cluv-flex-row`<br>`.cluv-flex-col`<br>`.cluv-flex-center`<br>`.cluv-flex-between` | `.cluv-items-center`<br>`.cluv-justify-center`<br>`.cluv-text-center` | - | Helper flexbox dan perataan teks tanpa inline styles. |
| **Utilities: Text Colors** | `.cluv-text-teal`<br>`.cluv-text-rose`<br>`.cluv-text-gold`<br>`.cluv-text-purple`<br>`.cluv-text-amber` | `.cluv-text-muted`<br>`.cluv-text-white`<br>`.cluv-text-dark` | - | Pewarnaan teks dan ikon semantik yang harmonis dengan palet brand. |
| **Buttons** | `.cluv-btn` | `.is-primary`<br>`.is-secondary`<br>`.is-outline`<br>`.is-ghost`<br>`.is-danger`<br>`.is-static`<br>`.is-sm`<br>`.is-md`<br>`.is-lg`<br>`.is-pill`<br>`.is-block` | - | Tombol universal dengan min-height 44px (touch target friendly). `.is-static` untuk label status non-interaktif. |
| **Trust Strip** | `.cluv-trust-strip` | `.is-left` | `.cluv-trust-item`<br>`.cluv-trust-icon`<br>`.cluv-trust-dot` | Mikro-copy penenang di bawah CTA (*Gratis • Tanpa Kartu Kredit*). |
| **Cards & Strips** | `.cluv-card`<br>`.cluv-ledger-card`<br>`.cluv-receipt-box`<br>`.cluv-card-strip`<br>`.cluv-card-note`<br>`.cluv-photo-frame` | `.is-interactive`<br>`.is-compact`<br>`.is-highlight`<br>`.is-row`<br>`.is-neutral`<br>`.is-rose` / `.is-gold` (untuk note) | `.cluv-ledger-header`<br>`.cluv-ledger-ref`<br>`.cluv-ledger-date`<br>`.cluv-ledger-body`<br>`.cluv-ledger-main`<br>`.cluv-ledger-title`<br>`.cluv-ledger-amount`<br>`.cluv-receipt-row`<br>`.cluv-receipt-label`<br>`.cluv-receipt-val`<br>`.cluv-card-strip-main`<br>`.cluv-card-strip-body`<br>`.cluv-card-strip-title`<br>`.cluv-card-strip-desc`<br>`.cluv-card-icon-wrap` (`.is-sm`, `.is-lg`, `.is-xl`)<br>`.cluv-feature-list`<br>`.cluv-feature-item`<br>`.cluv-price-val`<br>`.cluv-price-period`<br>`.cluv-pricing-desc`<br>`.cluv-price-discount-slot`<br>`.cluv-photo-img`<br>`.cluv-photo-caption`<br>`.cluv-photo-badge` | Kartu kontainer serbaguna, kartu mutasi/tagihan (`.cluv-ledger-card`), kotak kwitansi rincian (`.cluv-receipt-box`), strip kontak/aksi horizontal (`.cluv-card-strip`), slot harga & diskon (`.cluv-price-discount-slot`), daftar fitur harga (`.cluv-feature-list`), kotak catatan pendamping, bingkai foto, dan floating badge. |
| **Bento System** | `.cluv-bento-grid`<br>`.cluv-bento-card` | Grid: `.is-hero` (60:40)<br>`.is-equal` (50:50)<br>`.is-trio` (33:33:33)<br>`.is-quad` (4 col)<br>Card: `.is-interactive`<br>`.is-compact`<br>`.is-tint-teal`<br>`.is-tint-purple`<br>`.is-tint-gold`<br>Header: `.is-inline` (side-by-side bila tanpa tombol) | `.cluv-bento-header`<br>`.cluv-bento-header-icon`<br>`.cluv-bento-header-titles`<br>`.cluv-bento-header-action`<br>`.cluv-bento-body`<br>`.cluv-bento-footer`<br>`.cluv-compare-box` | Sistem layout bento universal responsif dan kartu bento berbasis 3 slot anatomis. Mendukung layout adaptif (Desktop: 1 baris lapang; Mobile: 2 baris anti-himpit), serta `.is-inline` untuk icon & title berdampingan pada card tanpa tombol. |
| **Action Tiles** | `.cluv-action-tile`<br>`.cluv-action-tile-group` | `.is-purple`<br>`.is-gold`<br>`.is-slate` | `svg` (auto-translates on hover) | Baris kartu interaktif 1-tap untuk prompt konsultasi AI, menu pintas, dan pengaturan cepat dengan hover elevation. |
| **Badges & Dot** | `.cluv-badge`<br>`.cluv-dot` | `.is-teal`<br>`.is-rose`<br>`.is-gold`<br>`.is-purple`<br>`.is-slate`<br>`.is-sm`<br>`.is-pulse` (untuk dot) | - | Label kapsul manis 12px / 11px (`.is-sm`) & status berdenyut. |
| **Stats & Progress** | `.cluv-stat-card`<br>`.cluv-progress-track`<br>`.cluv-progress-bar` | Track: `.is-sm`<br>`.is-lg`<br>Bar: `.is-gold`<br>`.is-rose`<br>`.is-amber` | `.cluv-stat-header`<br>`.cluv-stat-label`<br>`.cluv-stat-icon`<br>`.cluv-stat-val`<br>`.cluv-stat-meta` | Kartu ringkasan metrik statistik dan bilah progres universal (kuota langganan, progres misi, tingkat pemakaian). |
| **Micro-Animations** | `.cluv-animate-fade`<br>`.cluv-hover-lift`<br>`.cluv-hover-scale`<br>`.cluv-animate-float`<br>`.cluv-animate-pulse`<br>`.cluv-animate-spin` | `.cluv-stagger-1`<br>`.cluv-stagger-2`<br>`.cluv-stagger-3`<br>`.cluv-stagger-4` | - | Animasi masuk buttery-smooth (fade-in up), rotasi spinner, kartu terangkat halus/skala saat hover, dan floating bubble ritmis. |
| **Accordions** | `.cluv-accordion` | - | `.cluv-accordion-item`<br>`.cluv-accordion-trigger`<br>`.cluv-accordion-chevron`<br>`.cluv-accordion-body` | Buka-tutup tanya jawab (FAQ) dan rincian transaksi. |
| **Forms** | `.cluv-field` | `.is-invalid`<br>`.is-valid` | `.cluv-label`<br>`.cluv-input`<br>`.cluv-input-wrap`<br>`.cluv-input-icon`<br>`.cluv-select`<br>`.cluv-textarea`<br>`.cluv-field-help`<br>`.cluv-field-error` | Grup formulir dengan focus ring teal, input wrap + icon, validasi border, dan pesan error/bantuan. |
| **Adaptive Select** | `<CluvSelect />`<br>`.cluv-select-root` | `.is-open`<br>`.is-selected` | `.cluv-select-trigger`<br>`.cluv-select-popover` (Desktop)<br>`.cluv-select-backdrop`<br>`.cluv-select-sheet` (Mobile)<br>`.cluv-select-item` | Dropdown adaptif Cluv FW (Desktop: floating popover; Mobile: bottom sheet drawer laci jempol). |
| **Alerts** | `.cluv-alert` | `.is-info`<br>`.is-success`<br>`.is-warning`<br>`.is-danger`<br>`.is-collapsible` | `.cluv-alert-icon`<br>`.cluv-alert-content`<br>`.cluv-alert-header`<br>`.cluv-alert-toggle-btn`<br>`.cluv-alert-title`<br>`.cluv-alert-message` | Kotak notifikasi sukses, peringatan, info, atau pesan bahaya. Mendukung `.is-collapsible` untuk toggle buka-tutup di mobile. |
| **Document Layout** | `.cluv-doc-layout` | - | `.cluv-doc-sidebar`<br>`.cluv-doc-toc`<br>`.cluv-doc-content` | Tata letak dokumen hukum/kebijakan (Desktop: 280px sticky sidebar + 1fr article; Mobile: 1fr). |
| **FAB (Floating Button)** | `.cluv-fab` | `.is-active` | `.cluv-fab-badge` | Tombol aksi mengambang di kanan bawah mobile (misal untuk buka TOC drawer) dengan safe-area inset. |
| **Slide-Over Drawer** | `.cluv-drawer-backdrop` | `.is-open` | `.cluv-drawer`<br>`.cluv-drawer-header`<br>`.cluv-drawer-title`<br>`.cluv-drawer-close`<br>`.cluv-drawer-body` | Panel laci slide-over dari kanan dengan backdrop blur untuk mobile view navigation. |
| **Metadata Bar** | `.cluv-meta-bar` | - | `.cluv-meta-item` | Baris informasi metadata dokumen (tanggal berlaku, versi, pembacaan) berbaris rapi dengan ikon. |
| **Loading** | `.cluv-spinner`<br>`.cluv-skeleton` | `.is-sm`<br>`.is-md`<br>`.is-lg`<br>`.is-white`<br>`.is-title`<br>`.is-text`<br>`.is-avatar`<br>`.is-card` | - | Lingkaran putar teal dan animasi shimmer placeholder. |
| **Dividers** | `.cluv-divider` | `.is-dashed`<br>`.has-text` | `.cluv-divider-label` | Garis pemisah atau pembatas teks (*atau masuk dengan*). |
| **Modals** | `.cluv-modal-overlay` | - | `.cluv-modal-box` (`.is-sm`, `.is-lg`)<br>`.cluv-modal-header`<br>`.cluv-modal-title`<br>`.cluv-modal-close`<br>`.cluv-modal-body`<br>`.cluv-modal-footer` | Pop-up konfirmasi dan dialog interaktif dengan backdrop blur. |
| **Auth Shell** | `.cluv-auth-shell` | - | `.cluv-auth-split`<br>`.cluv-auth-showcase`<br>`.cluv-auth-showcase-bg`<br>`.cluv-auth-showcase-card`<br>`.cluv-auth-main`<br>`.cluv-auth-form-wrap`<br>`.cluv-auth-mobile-header` | Layout Split-Screen Editorial otentikasi (Sisi Kiri: Visual Meja Rias Warmth; Sisi Kanan: Form Frameless Lapang; Mobile: Full-width Native). |
| **Inline Links** | `.cluv-link` | `.is-muted`<br>`.is-underline` | - | Tautan teks sebaris teal dengan transisi hover underline yang mulus (100% pengganti inline link styling). |
| **Stat & Metric Cards** | `.cluv-stat-card`<br>`.cluv-stat-grid` | `.cols-2`<br>`.cols-4`<br>`.is-interactive` | `.cluv-stat-header`<br>`.cluv-stat-label`<br>`.cluv-stat-icon` (`.is-teal`, `.is-rose`, `.is-gold`, `.is-purple`, `.is-blue`)<br>`.cluv-stat-val`<br>`.cluv-stat-meta` (`.is-positive`, `.is-alert`) | Ringkasan metrik angka (Saldo Credits, Skor Kulit, Total Scan, Misi Selesai). |
| **Score Ring Gauge** | `.cluv-score-ring` | `.is-sm`<br>`.is-lg` | `.cluv-score-svg`<br>`.cluv-score-bg-circle`<br>`.cluv-score-fg-circle` (`.is-optimal`, `.is-good`, `.is-attention`, `.is-alert`)<br>`.cluv-score-center`<br>`.cluv-score-val`<br>`.cluv-score-max` | Gauge skor melingkar SVG (0–100) observasi kondisi wajah di Dashboard & Hasil Scan. |
| **Checklist & Routines** | `.cluv-checklist-group`<br>`.cluv-check-item` | `.is-checked` | `.cluv-check-box`<br>`.cluv-check-info`<br>`.cluv-check-title`<br>`.cluv-check-meta`<br>`.cluv-check-action` | Baris rutinitas skincare pagi/malam dan kartu misi harian interaktif. |
| **Tabs & Subnav** | `.cluv-tabs` | `.is-full` | `.cluv-tab-btn` (`.is-active`)<br>`.cluv-tab-badge` | Segmented tab navigasi horizontal untuk filter riwayat scan dan sub-halaman. |
| **Status Cues** | `.cluv-status-cue` | - | `.cluv-status-cue-number`<br>`.cluv-status-cue-badge` | Visual penanda status numerik besar (404, 500, empty state) dengan icon badge mengambang di tengah. |
| **Ambient Decorations** | `.cluv-ambient-layer` | - | `.cluv-ambient-decor`<br>`.is-cloud-left`<br>`.is-star-mid`<br>`.is-cloud-right`<br>`.is-heart-bottom`<br>`.cluv-delay-[1-3]` | Layer stiker ambient mengambang lembut untuk hero cerita tanpa mengganggu interaksi konten. |

---

## 3. Snippet Siap Pakai (Copy-Paste Ready for LLMs)

### A. Layout Halaman & Grid
```tsx
<section className="cluv-section">
  <div className="cluv-container">
    <div className="cluv-section-header cluv-reveal">
      <div className="cluv-badge is-teal cluv-mb-3">Informasi</div>
      <h2 className="cluv-title-section">Judul Seksi Ini</h2>
      <p className="cluv-subtitle cluv-mt-3">Penjelasan ringkas tentang apa yang ada di seksi ini.</p>
    </div>

    <div className="cluv-grid cols-3 cluv-reveal-group">
      <div className="cluv-card is-interactive cluv-hover-lift">
        <div className="cluv-card-icon-wrap is-teal">
          <Sparkles size={20} />
        </div>
        <h3 className="cluv-title-card">Fitur Keren</h3>
        <p className="cluv-body">Deskripsi kartu yang mudah dipahami.</p>
      </div>
    </div>
  </div>
</section>
```

### B. Barisan Tombol & Trust Strip di Hero / CTA
```tsx
{/* Button Group */}
<div className="cluv-btn-group is-center is-stack-mobile">
  <Link to="/register" className="cluv-btn is-primary is-lg">
    <Heart size={16} />
    <span>Mulai Sekarang</span>
  </Link>
  <Link to="/about" className="cluv-btn is-secondary is-lg">
    <span>Pelajari Dulu</span>
  </Link>
</div>

{/* Trust Strip */}
<div className="cluv-trust-strip">
  <span className="cluv-trust-item">
    <CheckCircle2 size={14} className="cluv-trust-icon" />
    <span>Gratis Pendaftaran</span>
  </span>
  <span className="cluv-trust-dot">•</span>
  <span className="cluv-trust-item">
    <CheckCircle2 size={14} className="cluv-trust-icon" />
    <span>Tanpa Kartu Kredit</span>
  </span>
  <span className="cluv-trust-dot">•</span>
  <span className="cluv-trust-item">
    <ShieldCheck size={14} className="cluv-trust-icon" />
    <span>100% Aman Privasi</span>
  </span>
</div>
```

### C. Formulir Berstandar & Dropdown Adaptif
```tsx
import { CluvSelect } from '@/components/ui'

<div className="cluv-container is-narrow">
  <form className="cluv-card cluv-flex-col cluv-gap-4">
    <div className="cluv-field">
      <label className="cluv-label">Nama Lengkap</label>
      <input type="text" className="cluv-input" placeholder="Masukkan nama..." />
      <span className="cluv-field-help">Nama panggilan santaimu.</span>
    </div>

    {/* Dropdown adaptif (Popover di Desktop, Bottom Sheet di Mobile) */}
    <CluvSelect
      label="Kategori Pertanyaan"
      sheetTitle="Pilih Kategori"
      value={selectedCategory}
      onChange={setSelectedCategory}
      options={[
        { value: 'paket', label: 'Paket Akses', description: 'Informasi kuota dan aktivasi', icon: <Sparkles size={16} /> },
        { value: 'kendala', label: 'Kendala Tagihan', description: 'Bantuan verifikasi Tripay', icon: <CreditCard size={16} /> }
      ]}
    />

    <div className="cluv-field">
      <label className="cluv-label">Catatan Tambahan</label>
      <textarea className="cluv-textarea" rows={3} placeholder="Tuliskan di sini..." />
    </div>

    <button type="submit" className="cluv-btn is-primary is-md is-block cluv-mt-2">
      Simpan Data
    </button>
  </form>
</div>
```

### D. Kotak Notifikasi / Alert
```tsx
<div className="cluv-alert is-success">
  <CheckCircle2 size={18} className="cluv-alert-icon" />
  <div className="cluv-alert-content">
    <div className="cluv-alert-title">Berhasil Disimpan</div>
    <p className="cluv-alert-message">Data profil kulitmu sudah diperbarui.</p>
  </div>
</div>
```

### E. Dialog Konfirmasi / Modal
```tsx
{isOpen && (
  <div className="cluv-modal-overlay">
    <div className="cluv-modal-box">
      <div className="cluv-modal-header">
        <h3 className="cluv-modal-title">Hapus Data?</h3>
        <button className="cluv-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="cluv-modal-body">
        <p className="cluv-body">Tindakan ini permanen sesuai UU PDP.</p>
      </div>
      <div className="cluv-modal-footer">
        <button className="cluv-btn is-ghost is-sm" onClick={onClose}>Batal</button>
        <button className="cluv-btn is-danger is-sm" onClick={onConfirm}>Hapus</button>
      </div>
    </div>
  </div>
)}
```

### F. Animasi Masuk Saat Scroll (Scroll Reveal & Micro-Animations)
```tsx
import { useScrollReveal } from '@/hooks/useScrollReveal'

export default function MyPage() {
  // Pasang hook di root komponen (otomatis mengamati saat elemen discroll ke layar)
  useScrollReveal()

  return (
    <div>
      {/* 1. Header Seksi muncul meluncur naik lembut saat discroll */}
      <div className="cluv-section-header cluv-reveal">
        <div className="cluv-badge is-teal cluv-mb-3">Info Penting</div>
        <h2 className="cluv-title-section">Judul Seksi</h2>
        <p className="cluv-subtitle cluv-mt-3">Penjelasan seksi dengan ukuran proporsional.</p>
      </div>

      {/* 2. Grid Kartu muncul berurutan (Staggered: kartu 1 -> 2 -> 3) */}
      <div className="cluv-grid cols-3 cluv-reveal-group">
        <div className="cluv-card cluv-hover-lift">Kartu 1</div>
        <div className="cluv-card cluv-hover-lift">Kartu 2</div>
        <div className="cluv-card cluv-hover-lift">Kartu 3</div>
      </div>

      {/* 3. Elemen melayang ritmis (Floating Bubble / Badge) */}
      <div className="floating-badge cluv-animate-float">
        🌸 Selalu menemanimu
      </div>
    </div>
  )
}
```

---

## 4. LLM Anti-Hallucination Checklist (Kesalahan Umum vs Yang Benar)

| SALAH (Antipattern / Dilarang) | BENAR (Standar Cluv) | Alasan |
| :--- | :--- | :--- |
| `<button className="cluv-btn sm primary admin">` | `<button className="cluv-btn is-primary is-sm">` | Kata telanjang rawan tabrakan CSS & ambigu. |
| `<div className="sweet-actions-row">` | `<div className="cluv-btn-group">` | Jangan ciptakan flex-row ad-hoc baru. |
| `<div className="steps-calm-grid">` | `<div className="cluv-grid cols-3">` | Gunakan sistem grid baku. |
| `<h2 className="sweet-hero-title">` di seksi tengah | `<h2 className="cluv-title-section">` | H2 seksi tidak boleh memakai ukuran raksasa Hero. |
| `<p className="text-xs text-slate-400 mt-4">Gratis...</p>` | `<div className="cluv-trust-strip">...</div>` | Trust text di bawah tombol wajib pakai trust-strip. |
| `<div style={{ maxWidth: '720px', margin: '0 auto' }}>` | `<div className="cluv-container is-narrow">` | Jangan pakai inline style untuk lebar layout. |
| Membuat file CSS baru untuk tombol per halaman | Gunakan `.cluv-btn` dari global | Hindari duplikasi CSS ratusan baris. |
| Barisan tombol CTA tanpa `.is-stack-mobile` | `<div className="cluv-btn-group is-stack-mobile">` | Di mobile tombol wajib melebar 100% bertumpuk agar nyaman dipencet jempol. |
| Drawer/Modal mobile tanpa batas tinggi (seluruh viewport discroll) | Fixed-Flex Modal (`max-height: min(540px, 86vh)`) | Header & Footer pinned, hanya menu internal yang scrollable dengan gradient mask. |
| Dua tombol drawer ditumpuk vertikal tinggi menghabiskan layar | 1 Baris Horizontal (`[ Masuk 34% ]` + `[ Mulai Cerita flex: 1 ]`) | Hemat ruang vertikal mobile & ramah sentuhan satu tangan. |
| Mengetik utility Tailwind (`mt-4`, `p-6`, `mb-2`, `gap-4`) | Utility Cluv (`.cluv-mt-4`, `.cluv-p-6`, `.cluv-mb-2`, `.cluv-gap-4`) | Tailwind TIDAK diinstal. Utility Tailwind mati/diabaikan browser & membuat UI berantakan. |
| Mengetik flexbox Tailwind (`flex items-center gap-2`) | Utility Cluv (`.cluv-flex-row .cluv-gap-2`) | Menjamin flexbox dan perataan aktif murni via CSS Cluv. |
| Mengetik warna teks Tailwind (`text-rose-400`, `text-teal-600`) | Utility Cluv (`.cluv-text-rose`, `.cluv-text-teal`) | Terikat resmi dengan Design Tokens `:root` Skincluv. |
| Header seksi manual `<div className="text-center">` | `<div className="cluv-section-header cluv-reveal">` | Memusatkan judul dan membatasi lebar teks 680px secara proporsional tanpa inline styles. |
| Memasang `.cluv-reveal` pada anak div di dalam kartu putih | Pasang `.cluv-reveal` pada kontainer kartu (`<div className="cluv-card cluv-reveal">`) | Mencegah kartu tampak kosong melompong saat anak-anaknya masih opacity: 0. |
| Menimpa padding kartu dengan utilitas (`<div className="cluv-card cluv-p-6">`) | Cukup `<div className="cluv-card">` (atau `.cluv-card.is-compact` jika butuh rapat) | Komponen punya padding internal responsif clamp bawaan. Menimpa dengan utilitas merusak proporsionalitas. |
| Menaruh `padding-bottom` pada wrapper halaman (`.about-page { padding-bottom: 80px }`) | Biarkan wrapper `padding-bottom: 0`, jarak vertikal 100% milik `.cluv-section` | Memicu double-padding raksasa (200px+) sebelum garis footer sehingga halaman tampak bolong/rusak. |

---

### E. Pola Standar Fixed-Flex Modal / Mobile Nav Drawer (Bubble Bloom & Dynamic Overflow)
Untuk modal atau navigation drawer mobile yang memiliki banyak item:
```tsx
<div className="public-mobile-overlay is-open">
  <div className="public-mobile-drawer">
    {/* 1. Header Terkunci (Pinned) */}
    <div className="mobile-drawer-header">
      <span className="cluv-badge is-teal">Menu</span>
      <button className="mobile-drawer-close" aria-label="Tutup"><X size={20} /></button>
    </div>

    {/* 2. Menu Internal Scrollable + Dynamic Overflow Cue */}
    <div className="mobile-menu-container">
      <nav ref={menuNavRef} className={`public-mobile-menu ${canScrollDown ? 'has-scroll-down' : ''}`} onScroll={checkScroll}>
        <Link to="/" className="active">Beranda</Link>
        {/* ... tautan navigasi lainnya ... */}
      </nav>
      {/* Panah halus berdenyut (Opsi A) — hanya muncul bila belum mentok ke bawah */}
      {canScrollDown && (
        <button type="button" className="mobile-menu-scroll-cue" aria-label="Scroll ke bawah">
          <ChevronDown size={14} />
        </button>
      )}
    </div>

    {/* 3. Footer Aksi Terkunci (1 Baris Horizontal Hemat Ruang) */}
    <div className="mobile-drawer-cta-group">
      <Link to="/login" className="btn-mobile-secondary">Masuk</Link>
      <Link to="/register" className="btn-mobile-primary">Mulai Cerita →</Link>
    </div>
  </div>
</div>
```

---

### F. Pola Standar Komponen App Surface (`.cluv-surface-app`)

#### 1. Metric Stat Grid & Stat Card
```tsx
<div className="cluv-stat-grid cols-4">
  <div className="cluv-stat-card is-interactive">
    <div className="cluv-stat-header">
      <span className="cluv-stat-label">AI Credits</span>
      <div className="cluv-stat-icon is-gold">
        <Coins size={18} />
      </div>
    </div>
    <div className="cluv-stat-val">25</div>
    <div className="cluv-stat-meta is-positive">+5 dari misi hari ini</div>
  </div>
</div>
```

#### 2. Biometric Score Ring Gauge (Observasi Kondisi Kulit)
```tsx
<div className="cluv-score-ring is-md">
  <svg className="cluv-score-svg" viewBox="0 0 80 80">
    <circle className="cluv-score-bg-circle" cx="40" cy="40" r="34" strokeWidth="6" />
    <circle
      className="cluv-score-fg-circle is-optimal"
      cx="40"
      cy="40"
      r="34"
      strokeWidth="6"
      strokeDasharray={213.6}
      strokeDashoffset={213.6 - (213.6 * Math.min(Math.max(score, 0), 100)) / 100}
    />
  </svg>
  <div className="cluv-score-center">
    <span className="cluv-score-val">{score}</span>
    <span className="cluv-score-max">/100</span>
  </div>
</div>
```

#### 3. Checklist Rutinitas Skincare & Misi Harian
```tsx
<div className="cluv-checklist-group">
  <div className={`cluv-check-item ${done ? 'is-checked' : ''}`} onClick={toggle}>
    <div className="cluv-check-box">
      {done && <Check size={14} strokeWidth={3} />}
    </div>
    <div className="cluv-check-info">
      <p className="cluv-check-title">Cleanser Lembut (pH Balance)</p>
      <span className="cluv-check-meta">Pagi · 2 menit</span>
    </div>
  </div>
</div>
```

#### 4. Segmented Tabs & Subnav
```tsx
<div className="cluv-tabs">
  <button className={`cluv-tab-btn ${activeTab === 'face' ? 'is-active' : ''}`} onClick={() => setActiveTab('face')}>
    <span>Scan Wajah</span>
    <span className="cluv-tab-badge">12</span>
  </button>
  <button className={`cluv-tab-btn ${activeTab === 'ingredient' ? 'is-active' : ''}`} onClick={() => setActiveTab('ingredient')}>
    <span>Scan Komposisi</span>
    <span className="cluv-tab-badge">5</span>
  </button>
</div>
```

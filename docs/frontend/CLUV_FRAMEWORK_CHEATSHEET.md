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
| **App Canvases** | `.cluv-canvas-grid` (Tipe A: 1240px)<br>`.cluv-canvas-focused` (Tipe B: 760px)<br>`.cluv-canvas-bleed` (Tipe C: 100%) | - | - | 3 Standar Kanvas Konten Aplikasi Login. Menjamin garis kiri sejajar 40px presisi dengan Topbar. |
| **Containers** | `.cluv-container` | `.is-narrow` (720px)<br>`.is-md` (1040px)<br>`.is-wide` (1360px)<br>`.is-fluid` (100%) | - | Pembatas lebar konten responsif (default 1200px boxed). |
| **Sections** | `.cluv-section` | `.is-dense` (rapat)<br>`.is-spacious` (lega)<br>`.is-alt` (abu/subtle)<br>`.is-dark` (malam/gelap) | - | Pembungkus babak/seksi halaman dengan vertical padding standar. |
| **Section Header** | `.cluv-section-header` | `.is-compact` (24px mb)<br>`.is-wide` (820px)<br>`.is-left` (rata kiri) | - | Blok terpusat judul + subtitle + badge dengan batas lebar proporsional (max-w 680px). |
| **Button Group** | `.cluv-btn-group` | `.is-center`<br>`.is-right`<br>`.is-compact`<br>`.is-stack-mobile` | - | Merapikan barisan tombol agar sejajar dan responsif di mobile. |
| **Grid** | `.cluv-grid` | `.cols-2`<br>`.cols-3`<br>`.cols-4`<br>`.is-auto-fit` | - | Grid responsif otomatis (berubah jadi 1 kolom di HP). |
| **Typography** | `.cluv-title-hero`<br>`.cluv-title-section`<br>`.cluv-title-card`<br>`.cluv-lead`<br>`.cluv-subtitle`<br>`.cluv-body`<br>`.cluv-caption`<br>`.cluv-micro` | `.is-sm` (untuk card title) | - | Skala tipografi fluida clamp() untuk H1, H2, H3, intro hero (`.cluv-lead` 18-20px), subtitle seksi (`.cluv-subtitle` 15-16px), paragraf, dan fine print. |
| **Utilities: Spacing** | `.cluv-mt-[1-8]`<br>`.cluv-mb-[1-8]`<br>`.cluv-my-[1-8]`<br>`.cluv-p-[0-8]`<br>`.cluv-gap-[1-7]` | Scale: 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 7(32px), 8(40px) | - | Jarak margin, padding, dan gap baku (100% pengganti utility Tailwind). |
| **Utilities: Flex & Align** | `.cluv-flex-row`<br>`.cluv-flex-col`<br>`.cluv-flex-center`<br>`.cluv-flex-between`<br>`.cluv-flex-responsive` | `.cluv-items-center`<br>`.cluv-justify-center`<br>`.cluv-text-center`<br>`.cluv-w-full-mobile`<br>`.cluv-flex-1-mobile` | `.cluv-hide-desktop`<br>`.cluv-hide-mobile` | Helper flexbox, perataan teks, dan modifier arah responsif (Desktop Row -> Mobile Column). |
| **Utilities: Text Colors** | `.cluv-text-teal`<br>`.cluv-text-rose`<br>`.cluv-text-gold`<br>`.cluv-text-purple`<br>`.cluv-text-amber` | `.cluv-text-muted`<br>`.cluv-text-white`<br>`.cluv-text-dark` | - | Pewarnaan teks dan ikon semantik yang harmonis dengan palet brand. |
| **Buttons & Chips** | `.cluv-btn`<br>`.cluv-chip-group`<br>`.cluv-chip` | Btn: `.is-primary`<br>`.is-secondary`<br>`.is-outline`<br>`.is-ghost`<br>`.is-danger`<br>`.is-static`<br>`.is-sm`<br>`.is-md`<br>`.is-lg`<br>`.is-pill`<br>Chip: `.is-active`<br>`.is-pill` | - | Tombol universal touch-friendly & chip seleksi interaktif (filter, tag, preferensi multi-select). |
| **Trust Strip** | `.cluv-trust-strip` | `.is-left` | `.cluv-trust-item`<br>`.cluv-trust-icon`<br>`.cluv-trust-dot` | Mikro-copy penenang di bawah CTA (*Gratis • Tanpa Kartu Kredit*). |
| **Cards & Strips** | `.cluv-card`<br>`.cluv-ledger-card`<br>`.cluv-receipt-box`<br>`.cluv-card-strip`<br>`.cluv-card-note`<br>`.cluv-avatar`<br>`.cluv-photo-frame` | `.is-interactive`<br>`.is-compact`<br>`.is-highlight`<br>`.is-row`<br>`.is-neutral`<br>`.is-rose` / `.is-gold` (untuk note & avatar) | `.cluv-ledger-header`<br>`.cluv-ledger-ref`<br>`.cluv-ledger-date`<br>`.cluv-ledger-body`<br>`.cluv-ledger-main`<br>`.cluv-ledger-title`<br>`.cluv-ledger-amount`<br>`.cluv-receipt-row`<br>`.cluv-receipt-label`<br>`.cluv-receipt-val`<br>`.cluv-card-strip-main`<br>`.cluv-card-strip-body`<br>`.cluv-card-strip-title`<br>`.cluv-card-strip-desc`<br>`.cluv-card-icon-wrap` (`.is-sm`, `.is-lg`, `.is-xl`)<br>`.cluv-avatar` (`.is-sm`, `.is-lg`, `.is-gold`)<br>`.cluv-feature-list`<br>`.cluv-feature-item`<br>`.cluv-price-val`<br>`.cluv-price-period`<br>`.cluv-pricing-desc`<br>`.cluv-price-discount-slot`<br>`.cluv-photo-img`<br>`.cluv-photo-caption`<br>`.cluv-photo-badge` | Kartu kontainer serbaguna, kartu mutasi/tagihan (`.cluv-ledger-card`), kotak kwitansi rincian (`.cluv-receipt-box`), strip kontak/aksi horizontal (`.cluv-card-strip`), avatar profil inisial (`.cluv-avatar`), slot harga & diskon (`.cluv-price-discount-slot`), daftar fitur harga (`.cluv-feature-list`), kotak catatan pendamping, bingkai foto, dan floating badge. |
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
| **Conversational Chat** | `.cluv-chat-root`<br>`.cluv-chat-scroll` | `.is-user`<br>`.is-bot`<br>`.is-wide` (drawer) | `.cluv-chat-util-bar`<br>`.cluv-chat-util-btn`<br>`.cluv-chat-session-badge`<br>`.cluv-chat-drawer`<br>`.cluv-chat-banner`<br>`.cluv-chat-welcome`<br>`.cluv-chat-chip`<br>`.cluv-chat-row`<br>`.cluv-chat-bubble`<br>`.cluv-chat-avatar`<br>`.cluv-chat-thinking`<br>`.cluv-chat-input-bar`<br>`.cluv-chat-input-wrap`<br>`.cluv-chat-send-btn`<br>`.cluv-chat-paywall-card`<br>`.cluv-chat-sources` | Layout Type C: Full-bleed viewport chat AI dengan header utilitas, drawer riwayat/UU PDP, bubble percakapan, CTA scan, dan input lengket bawah. |

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

#### 5. Riwayat Scan & Timeline Item (.cluv-scan-card & .cluv-score-badge)
```tsx
<div className="cluv-scan-card" onClick={handleClick}>
  <div className="cluv-scan-card-main">
    <div className="cluv-score-badge is-optimal">
      <span className="cluv-score-badge-val">85</span>
      <span className="cluv-score-badge-label">/100</span>
    </div>
    <div className="cluv-scan-card-body">
      <div className="cluv-caption cluv-text-muted cluv-mb-1">Senin, 19 Oktober 2026</div>
      <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">Analisis Kondisi Kulit</h4>
      <p className="cluv-micro cluv-text-muted cluv-truncate">Hasil observasi visual barrier kulit...</p>
      <div className="cluv-chip-group cluv-mt-2">
        <span className="cluv-chip is-sm">Kombinasi</span>
        <span className="cluv-chip is-sm">#Pori</span>
      </div>
    </div>
  </div>
  <div className="cluv-scan-card-action">
    <span>Buka Rangkuman</span>
    <ChevronRight size={16} />
  </div>
</div>
```

#### 6. Pilihan Channel Pembayaran & Kode Bayar (.cluv-channel-option, .cluv-code-box)
```tsx
{/* 1. Channel Selector */}
<div className="cluv-channel-group">
  <div className="cluv-channel-category"><QrCode size={14} /> QRIS &amp; E-WALLET</div>
  <label className={`cluv-channel-option ${selected ? 'is-selected' : ''}`} onClick={onSelect}>
    <input type="radio" checked={selected} readOnly />
    <div className="cluv-channel-label">
      <span>QRIS (GoPay, OVO, Dana)</span>
      <span className="cluv-badge is-teal is-sm">Instan</span>
    </div>
  </label>
</div>

{/* 2. Kode Bayar / Virtual Account Box */}
<div className="cluv-code-box">
  <span className="cluv-code-val">8872019283912</span>
  <button type="button" className="cluv-btn is-outline is-sm" onClick={copyCode}>
    <Copy size={14} /> Salin
  </button>
</div>
```

#### 7. Misi Harian & Gamifikasi (.cluv-missions-layout, .cluv-mission-item)
```tsx
<div className="cluv-missions-layout">
  {/* Kolom Kiri: Saldo & Info (340px) */}
  <div>
    <div className="cluv-card is-highlight cluv-mb-4">
      <div className="cluv-flex-row cluv-items-center cluv-gap-4">
        <div className="cluv-card-icon-wrap is-lg is-gold"><Coins size={30} /></div>
        <div>
          <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Saldo Credits</span>
          <div className="cluv-title-hero cluv-m-0">25 <span className="cluv-body cluv-font-bold cluv-text-muted">Credits</span></div>
        </div>
      </div>
    </div>
  </div>

  {/* Kolom Kanan: Daftar Misi */}
  <div className="cluv-card">
    <div className={`cluv-mission-item ${isReady ? 'is-ready' : isClaimed ? 'is-claimed' : ''}`}>
      <div className="cluv-mission-item-main">
        <div className="cluv-flex-row cluv-items-center cluv-gap-2 cluv-mb-1">
          <span className="cluv-badge is-teal is-sm">Harian</span>
          <h4 className="cluv-font-bold cluv-text-dark cluv-m-0">Scan Wajah Harian</h4>
        </div>
        <p className="cluv-micro cluv-text-muted cluv-m-0">Lakukan observasi visual kulit hari ini.</p>
        <div className="cluv-progress-track cluv-max-w-xs cluv-mt-2">
          <div className="cluv-progress-bar" style={{ width: '100%' }} />
        </div>
      </div>
      <div className="cluv-mission-item-action">
        <span className="cluv-font-bold cluv-text-gold">+3 Credits</span>
        <button type="button" className="cluv-btn is-primary is-sm">Klaim Hadiah</button>
      </div>
    </div>
  </div>
</div>
```

---

## 8. Pola Universal: Scanner & Analisis Produk (.cluv-scan-layout, .cluv-dropzone, .cluv-scanner-hud, .cluv-ingredient-card)

```tsx
<div className="v0-page-container cluv-canvas-layout animate-fade-in">
  <div className="cluv-scan-layout">
    {/* Kolom Kiri: Workspace Analisis */}
    <div className="cluv-scan-main">
      <div className="cluv-mb-2">
        <h1 className="cluv-title-section cluv-m-0">Scan Ingredient Skincare</h1>
        <p className="cluv-subtitle cluv-mt-1">Observasi ilmiah keamanan komposisi bahan kosmetik.</p>
      </div>

      {/* Stage Upload */}
      <div className="cluv-card">
        <div className="cluv-dropzone" onClick={openPicker}>
          <div className="cluv-dropzone-icon"><Camera size={26} /></div>
          <h3 className="cluv-dropzone-title">Ambil / Unggah Foto Label Komposisi</h3>
          <p className="cluv-dropzone-subtitle">Pastikan teks komposisi terlihat jelas dan terang</p>
          <div className="cluv-dropzone-btn-fake"><Upload size={14} /> Pilih File atau Jepret Kamera</div>
        </div>
      </div>

      {/* Stage Scanning HUD */}
      <div className="cluv-card cluv-items-center cluv-py-8">
        <div className="cluv-scanner-hud">
          <img src={previewUrl} className="cluv-scanner-preview-img" />
          <div className="cluv-scanner-grid-overlay" />
          <div className="cluv-scanner-corner top-left" />
          <div className="cluv-scanner-corner top-right" />
          <div className="cluv-scanner-corner bottom-left" />
          <div className="cluv-scanner-corner bottom-right" />
          <div className="cluv-scanner-laser" />
          <div className="cluv-scanner-status-pill">
            <span className="cluv-scanner-status-dot" />
            <span>AI OCR VISION ACTIVE</span>
          </div>
        </div>
      </div>
    </div>

    {/* Kolom Kanan: Sidebar Profil & Tips */}
    <div className="cluv-scan-aside">
      <div className="cluv-card is-highlight">
        <h4 className="cluv-font-bold cluv-m-0">Profil Kulit Aktif</h4>
        <div className="cluv-flex-row cluv-gap-1 cluv-mt-2">
          <span className="cluv-badge is-teal is-sm">Berminyak</span>
          <span className="cluv-badge is-slate is-sm">Jerawat</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 9. Pola Universal: Conversational Chat (.cluv-chat-root, .cluv-chat-scroll, .cluv-chat-bubble, .cluv-chat-input-bar)

```tsx
<div className="cluv-chat-root">
  {/* Utility Bar */}
  <div className="cluv-chat-util-bar">
    <div className="cluv-chat-util-left">
      <button className="cluv-chat-util-btn"><History size={16} /> Riwayat (5)</button>
      <button className="cluv-chat-util-btn"><Brain size={16} /> Memori (3)</button>
    </div>
    <div className="cluv-chat-util-center">
      <div className="cluv-chat-session-badge">
        <Sparkles size={13} />
        <span className="cluv-chat-session-badge-title">Konsultasi Kulit AI</span>
      </div>
    </div>
    <div className="cluv-chat-util-right">
      <button className="cluv-chat-util-btn is-primary"><Plus size={16} /> Chat Baru</button>
    </div>
  </div>

  {/* Scrollable Message Feed */}
  <div className="cluv-chat-scroll">
    {/* Bot Message Row */}
    <div className="cluv-chat-row is-bot">
      <div className="cluv-chat-avatar is-bot"><Sparkles size={15} /></div>
      <div className="cluv-chat-bubble-wrap">
        <div className="cluv-chat-bubble">
          <p>Halo! Ada yang ingin didiskusikan seputar perawatan kulit Anda?</p>
        </div>
        <span className="cluv-chat-timestamp">12:30</span>
      </div>
    </div>

    {/* User Message Row */}
    <div className="cluv-chat-row is-user">
      <div className="cluv-chat-bubble-wrap">
        <div className="cluv-chat-bubble">
          <p>Kulit saya terasa berminyak di siang hari.</p>
        </div>
        <span className="cluv-chat-timestamp">12:31</span>
      </div>
      <div className="cluv-chat-avatar is-user">JD</div>
    </div>
  </div>

  {/* Sticky Bottom Input Bar */}
  <div className="cluv-chat-input-bar">
    <form className="cluv-chat-input-wrap">
      <button type="button" className="cluv-chat-attach-btn"><Paperclip size={18} /></button>
      <textarea rows={1} placeholder="Tanyakan sesuatu pada Skinsistant AI..." />
      <button type="submit" className="cluv-chat-send-btn"><Send size={16} /></button>
    </form>
    <p className="cluv-chat-disclaimer">
      <ShieldAlert size={12} />
      <span>Skinsistant memberikan edukasi dan panduan perawatan kosmetik, bukan diagnosis atau tindakan medis profesional.</span>
    </p>
  </div>
</div>
```

---

## 10. Pola Universal: Bento Grid System & Mobile App-First Dashboard (.cluv-bento-grid, .cluv-bento-card, .cluv-mobile-dashboard)

### A. Anatomi Bento Card Baku (3 Slot)
```tsx
<div className="cluv-bento-grid is-hero">
  {/* Kolom Kiri: 1.55fr (Hero Data) */}
  <section className="cluv-bento-card">
    <div>
      {/* 1. Header Slot */}
      <div className="cluv-bento-header">
        <div className="cluv-bento-header-icon">
          <div className="cluv-card-icon-wrap is-sm is-teal"><ScanFace size={20} /></div>
        </div>
        <div className="cluv-bento-header-titles">
          <span className="cluv-micro cluv-text-muted cluv-font-bold cluv-uppercase">Observasi Visual AI</span>
          <h2 className="cluv-title-card">Kondisi Kulit Terkini</h2>
        </div>
        <div className="cluv-bento-header-action">
          <button className="cluv-btn is-outline is-sm">Pindai Ulang</button>
        </div>
      </div>

      {/* 2. Body Slot (Canvas Data) */}
      <div className="cluv-bento-body cluv-mt-4">
        {/* Konten data visual / chart / score ring */}
      </div>
    </div>

    {/* 3. Footer Slot (Hairline Separator) */}
    <div className="cluv-bento-footer cluv-flex-between cluv-items-center cluv-pt-4 cluv-border-t cluv-mt-6">
      <span className="cluv-caption cluv-text-muted">Keterangan status</span>
      <button className="cluv-btn is-ghost is-sm"><span>Lihat Detail</span><ChevronRight size={14} /></button>
    </div>
  </section>

  {/* Kolom Kanan: 1fr (Secondary Support) */}
  <section className="cluv-bento-card">
    {/* ... */}
  </section>
</div>
```

### B. Mobile App-First Dashboard Pattern (<= 640px)
```tsx
<div className="cluv-mobile-dashboard">
  {/* 1. Unified Skin Card (Avatar + Sapaan + Kapsul Kredit + Mini Score) */}
  <div className="cluv-mobile-unified-card">
    <div className="cluv-mobile-unified-header">
      <div className="cluv-flex-row cluv-gap-2 cluv-items-center">
        <div className="cluv-avatar-ring is-pro"><div className="cluv-avatar-ring-inner">JS</div></div>
        <span className="cluv-mobile-name">Halo, Jessy</span>
      </div>
      <div className="cluv-credit-capsule">
        <span className="cluv-credit-capsule-val"><Zap size={12} /><span>1.395</span></span>
        <span className="cluv-credit-capsule-divider" />
        <span className="cluv-credit-capsule-add">+</span>
      </div>
    </div>
    {/* Body Ringkas + Action Pills */}
  </div>

  {/* 2. Skinsistant AI Weather Bubble */}
  <div className="cluv-weather-bubble">
    <div className="cluv-weather-bubble-icon"><Bot size={16} /></div>
    <div className="cluv-weather-bubble-content">
      <div className="cluv-weather-bubble-header">
        <span className="cluv-weather-bubble-title">Skinsistant AI · Cuaca Hari Ini</span>
        <span className="cluv-weather-bubble-tag"><SunMedium size={11} /> 30° · UV 7</span>
      </div>
      <p className="cluv-weather-bubble-text">"Siang ini terik banget bestie! Jangan lupa reapply sunscreen ya! :)"</p>
    </div>
  </div>

  {/* 3. 4-Item Squircle Shortcuts (Grid 4 Kolom) */}
  <div className="cluv-mobile-shortcuts">
    <button className="cluv-mobile-shortcut-btn">
      <div className="cluv-mobile-shortcut-icon is-teal"><ScanFace size={22} /></div>
      <span className="cluv-mobile-shortcut-label">Scan Wajah</span>
    </button>
    <button className="cluv-mobile-shortcut-btn">
      <div className="cluv-mobile-shortcut-icon is-blue"><FlaskConical size={22} /></div>
      <span className="cluv-mobile-shortcut-label">Scan Bahan</span>
    </button>
    <button className="cluv-mobile-shortcut-btn">
      <div className="cluv-mobile-shortcut-icon is-amber"><Sparkles size={22} /></div>
      <span className="cluv-mobile-shortcut-label">Misi Glow</span>
    </button>
    <button className="cluv-mobile-shortcut-btn">
      <div className="cluv-mobile-shortcut-icon is-purple"><Bot size={22} /></div>
      <span className="cluv-mobile-shortcut-label">Tanya AI</span>
    </button>
  </div>
</div>
```

---

## 11. Triad Core Components: React Atoms (<Badge />, <Button />, Bento)

### A. Badge Atom (`<Badge />` from `@/components/ui`)
```tsx
import { Badge } from '@/components/ui'

// 1. Status Kulit / Kualitatif (dengan Dot)
<Badge variant="teal" size="sm" dot>Optimal</Badge>
<Badge variant="gold" size="sm" dot>Perhatian</Badge>
<Badge variant="rose" size="sm" dot>Waspada</Badge>

// 2. Chip Metrik / Counter (dengan Ikon)
<Badge variant="teal" size="sm" icon={<ScanFace size={13} />}>11 Wajah</Badge>
<Badge variant="slate" size="sm" icon={<FlaskConical size={13} />}>15 Komposisi</Badge>

// 3. Ambient Context Cuaca / Suhu
<Badge variant="gold" size="sm" icon={<SunMedium size={13} />}>26°C · UV 3.2</Badge>

// 4. Reward Koin / Misi
<Badge variant="gold" size="sm" icon={<Zap size={11} />}>+100</Badge>
<Badge variant="slate" size="sm" icon={<Zap size={11} />}>+5 (Selesai)</Badge>

// 5. Section Eyebrow (Landing / Public)
<Badge variant="teal" size="md">🌸 Sahabat Meja Riasmu</Badge>
```

### B. Button Atom (`<Button />` from `@/components/ui`)
```tsx
import { Button } from '@/components/ui'

// 1. Primary Action (CTA Utama / Submit Form)
<Button variant="primary" size="md" iconRight={<ArrowRight size={16} />}>
  Mulai Analisis
</Button>

// 2. Bento Header Action (Outline Brand Line)
<Button variant="outline" size="sm" iconLeft={<ScanFace size={14} />} onClick={() => navigate('/face-scan')}>
  Pindai Ulang
</Button>

// 3. Bento Footer Block Action (Full-width Outline)
<Button variant="outline" size="sm" block iconRight={<ArrowRight size={14} />} to="/chatbot">
  Buka Chat Skinsistant AI
</Button>

// 4. Bento Footer Drill-down (Ghost Text Link)
<Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} to="/scan-history">
  Buka Riwayat Lengkap
</Button>

// 5. Loading State & Async Submissions
<Button variant="primary" size="md" loading={isSubmitting} block>
  Simpan Profil Kulit
</Button>

// 6. Kustom Radius (Pill vs Squircle vs Sharp)
<Button variant="primary" size="sm" radius="pill" iconLeft={<Plus size={15} />}>
  Chat Baru
</Button>

// 7. Destructive Action (Konfirmasi Hapus)
<Button variant="danger" size="sm" onClick={handleDelete}>
  Hapus Rekam Jejak
</Button>
```



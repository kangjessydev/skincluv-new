---
name: skincluv-frontend
description: Panduan resmi & memori permanen arsitektur Frontend Skincluv. Memuat konsensus Generic vs Eksklusif Cluv Framework, aturan halaman Publik (Non-Login), aturan halaman App (Login), dan protokol diskusi sebelum membuat komponen baru. Wajib dibaca saat mengerjakan UI/UX agar kesepakatan user tidak perlu diulang-ulang.
---

# 🎨 Skincluv Frontend Architecture & Master Consensus

Dokumen skill ini adalah **sumber kebenaran tunggal (Single Source of Truth)** dan memori permanen untuk seluruh pekerjaan antarmuka pengguna (Frontend UI/UX) di repositori Skincluv. Dokumen ini merangkum seluruh konsensus yang telah disepakati bersama user untuk halaman Non-Login (Publik) maupun halaman Login (App).

---

## 🏛️ 1. Doktrin Cluv Framework & Invarian Mutlak

1. **100% Pure Cluv Framework**:
   - Seluruh styling antarmuka menggunakan namespace `.cluv-*` dengan CSS variables resmi `:root` (`var(--cluv-*)`).
   - **DILARANG KERAS** menggunakan TailwindCSS, Bootstrap, atau class asing non-cluv.
   - **DILARANG KERAS** menggunakan warna hex hardcoded di dalam file `.tsx` atau file `.css` baru (kecuali fallback var resmi).
2. **Zero Layout/Theming Inline Styles**:
   - Dilarang keras menggunakan `style={{ background: '...', color: '...', margin: '...' }}` di JSX.
   - Pengecualian HANYA untuk nilai dinamis murni kalkulasi JavaScript runtime (misal: persentase progress bar `style={{ width: `${percent}%` }}`).
3. **No Island `<style>` Blocks**:
   - Dilarang menyisipkan tag `<style>` lokal di dalam komponen `.tsx`. Seluruh styling wajib tersentralisasi di `src/styles/cluv/`.
4. **Strict Frontend Boundary**:
   - Frontend HANYA mengurus antarmuka, UX, interaksi, dan konsumsi API.
   - **Dilarang keras menyentuh backend** (SQL migration, Supabase schema, Edge Functions). Semua kebutuhan data/API baru dicatat di `kerja hari ini/changelog.md` untuk dikerjakan oleh tim backend.
5. **EMPAT DOKTRIN MUTLAK CLUV FRAMEWORK (THE 4 GOLDEN INVARIANTS)**:
   > 🔴 **1. TIDAK BOLEH PAKE STYLE LAMA**:  
   > Dilarang keras mempertahankan gaya visual, tata letak kusam, border abu-abu tebal, atau display lama peninggalan v0. Seluruh elemen wajib bermutasi menjadi standar Cluv murni (surface bersih, border 1.5px crisp, radius membulat elegan, icon wrap pastel).
   >
   > 🔴 **2. TIDAK BOLEH ASAL UBAH / BIKIN NAMA KELAS**:  
   > Dilarang keras membuat class CSS ad-hoc per-halaman di `src/styles/cluv/app/*.css` untuk sesuatu yang seharusnya menjadi Utility atau Component universal. Dilarang sekadar me-rename prefix `v0-*` menjadi `cluv-*` tanpa merombak strukturnya menjadi lego Cluv.
   >
   > 🔴 **3. WAJIB DISKUSI KELAS YG SUDAH ADA MAUPUN YG BELUM ADA DAN AKAN DIGUNAKAN**:  
   > Sebelum menyentuh kode CSS atau JSX:
   > - Cek terlebih dahulu class yang sudah ada di Cluv Framework (`CLUV_FRAMEWORK_CHEATSHEET.md`).
   > - Jika ada class yang belum ada di framework: **WAJIB DISKUSIKAN TERLEBIH DAHULU DENGAN USER**. Rumuskan apakah dijadikan generic component atau modifier `.is-*`, lalu bangun di dalam framework (`src/styles/cluv/components/`), bukan di CSS halaman!
   >
   > 🔴 **4. TABULA RASA RESET: KENALI HAKIKAT HALAMAN, JANGAN TERPENGARUH BIAS STYLE LAMA**:  
   > Saat melakukan audit dan perbaikan layout halaman, **HAPUS SEMUA STYLE LAMA** dan ganti dengan standar Cluv murni. Dilarang keras berpikir: *"Karena style lama bentuknya begini, jadi di Cluv kita ikuti bentuk lama saja"* — ini SALAH TOTAL! AI dilarang buta meniru layout lama.
   > **Wajib sesuaikan dengan hakikat & pengetahuan fungsi halaman tersebut**:
   > - Contoh: Jika Dashboard di style lama dibuat sempit, JANGAN pertahankan sempit hanya karena Cluv punya style sempit! Hakikat Dashboard adalah kanvas bento lapang (`max-width: 1240px`).
   > - Sebaliknya: Jika halaman adalah Riwayat Tagihan / Mutasi Finansial / Formulir Akun, hakikatnya adalah Focused Ledger (`max-width: 760px; margin-left: 0; margin-right: auto`).
   > **Prinsip Utama**: Kenali dulu peran dan fungsi halaman secara semantik, buang total bias style lama, lalu susun menggunakan layout Cluv Framework yang paling benar secara UX dan fungsionalitas produk!

6. **Pemisahan Tegas: Utility Component vs CSS Component**:
   - **Utility Component (Atomic Class)**:
     - Sifat: Alat suntik seketika (1–2 properti spesifik), composable, langsung disuntikkan di JSX tanpa membuat baris CSS baru.
     - Contoh: `.cluv-flex`, `.cluv-flex-col`, `.cluv-flex-row`, `.cluv-items-center`, `.cluv-justify-between`, `.cluv-justify-center`, `.cluv-gap-3`, `.cluv-mt-4`, `.cluv-text-center`, `.cluv-w-full`.
     - *Pantangan*: Dilarang membuat class komponen palsu yang isinya cuma sekadar flex/margin/padding!
   - **CSS Component (Lego Blok Berstruktur)**:
     - Sifat: Wadah multi-properti (border, radius, shadow, hover, internal padding) yang membentuk entitas UI utuh.
     - Pola Baku: **Base Class** + **Modifier `.is-*`**:
       - Tombol: `.cluv-btn` + `.is-primary`, `.is-secondary`, `.is-outline`, `.is-sm`
       - Badge: `.cluv-badge` + `.is-teal`, `.is-gold`, `.is-sm`
       - Grid Bento: `.cluv-bento-grid` + `.is-hero`, `.is-equal`, `.is-trio`
       - Kartu Bento: `.cluv-bento-card` + slot (`.cluv-bento-header`, `.cluv-bento-body`, `.cluv-bento-footer`)
       - Action Tile: `.cluv-action-tile` + `.is-interactive`
     - *Pantangan*: Dilarang merangkai 20 utility manual berulang-ulang jika bentuk tersebut sudah memiliki padanan komponen resmi!

---

## ⚖️ 2. Aturan Generic vs Eksklusif Style (Kesepakatan Inti)

Berdasarkan kesepakatan bersama user, styling di Skincluv dibagi menjadi 2 kategori yang saling melengkapi:

### A. Generic Cluv Styles (`src/styles/cluv/components/`)
Komponen universal yang dipakai berulang di banyak halaman:
- `.cluv-btn` (tombol universal dengan modifier `.is-primary`, `.is-secondary`, `.is-outline`, `.is-ghost`, `.is-sm`, dll).
- `.cluv-card` & `.cluv-bento-card` (kartu kanonikal & kartu bento dengan padding terstandarisasi, soft shadow, hover lift).
- `.cluv-bento-grid` (grid bento responsif dengan preset rasio `.is-hero`, `.is-equal`, `.is-trio`).
- `.cluv-action-tile` (row kartu interaktif/prompt AI 1-tap dengan panah dan hover lift).
- `.cluv-badge` (label kapsul status `.is-teal`, `.is-gold`, `.is-rose`, `.is-slate`, `.is-sm`).
- `.cluv-alert` (notifikasi sistem `.is-warning`, `.is-danger`, `.is-info`).
- `.cluv-stat-card` & `.cluv-stat-grid` (kartu ringkasan metrik angka).
- `.cluv-score-ring` (gauge lingkaran biometrik SVG 0–100).
- `.cluv-checklist-group` & `.cluv-check-item` (rutinitas dan misi harian).

### B. Eksklusif Cluv Styles (`src/styles/cluv/app/*.css` & `public/*.css`)
Style khusus yang **sah dan dilegalkan** jika hanya tampil khusus pada fitur atau layar tertentu:
- Contoh: `.cluv-avatar-ring` (lingkaran glow 32px pada profil/pocket mobile).
- Contoh: `.cluv-credit-capsule` (kapsul interaktif `[ ⚡ 1.395 | + ]`).
- Contoh: `.cluv-camera-viewfinder` (HUD pemindai kamera face scan).
- Contoh: `.cluv-auth-showcase` (editorial meja rias split auth).

### C. Protokol Saat Ada Elemen Baru yang Belum Masuk Cluv FW:
> ⚠️ **JANGAN ASAL BIKIN KODE ATAU NEBAK SENDIRI!**  
> Jika menemukan kebutuhan visual yang belum terwadahi di generic Cluv:
> 1. **Diskusikan terlebih dahulu dengan user**: jelaskan opsi desain dan tanyakan apakah ingin dijadikan generic atau eksklusif.
> 2. **Jika disepakati masuk Cluv FW**: rumuskan spesifikasi class dan utility-nya bersama user sebelum mengimplementasikannya ke `src/styles/cluv/components/`.
> 3. **Dilarang menuliskan komponen baru di CSS halaman (`dashboard.css`, dll)**.

### E. Kontrak Isolasi Responsif (Anti-Regresi Desktop & Mobile)
> **Prinsip Utama**: *"Jangan perbaiki desktop merusak mobile, atau perbaiki mobile merusak desktop."*
1. **Generic Dual-Safe (Default)**:
   - Komponen generic (`.cluv-btn`, `.cluv-card`, `.cluv-badge`) **wajib selalu normal dan aman di kedua layar**.
   - Tombol `.cluv-btn` defaultnya **wajib selalu `white-space: nowrap;`**. Dilarang memaksa `white-space: normal` secara global di mobile karena akan memecah teks tombol menjadi 2 baris cacat.
2. **Exclusive Modifiers (Saat Berbeda 180 Derajat)**:
   - Gunakan modifier resmi dari `src/styles/cluv/utilities.css`:
     - `.cluv-flex-responsive`: Desktop = Row space-between; Mobile (<= 768px) = Column stretch gap 12px.
     - `.cluv-w-full-mobile`: Desktop = Auto-width; Mobile = 100% full width.
     - `.cluv-flex-1-mobile`: Mobile = membagi rata 50/50.
     - `.cluv-hide-mobile`: Eksklusif desktop (misal: titik bullet pemisah `•`).
     - `.cluv-hide-desktop`: Eksklusif mobile (misal: subtitle baris kedua pengganti bullet).

---

## 🌸 3. Seluruh Konsensus Halaman Non-Login (Public Pages)

Halaman: `/`, `/about`, `/pricing`, `/faq`, `/contact`, `/terms`, `/privacy`, `/login`, `/register`, dll.

1. **Option E — Warm Companion ("Sahabat Setia Meja Riasmu")**:
   - Tone of voice: Hangat, bersahabat, jujur, edukatif tanpa menciptakan kecemasan (*fear-mongering*).
   - Menggunakan font **Nunito** murni di seluruh teks judul, subjudul, dan isi.
   - Palet warna: Canvas Soft Sky White (`#f7faff`), Teks Deep Ink Teal (`#1a2d42`), Aksen Pure Soft Teal (`#1f9d97`).
2. **Fluid Responsive Architecture (Anti Layar Jebol)**:
   - Tipografi & Padding wajib menggunakan `clamp()` (contoh: `clamp(1.75rem, 4vw + 1rem, 2.75rem)`).
   - Grid kartu wajib menggunakan auto-fit fluida: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))`.
   - Menggunakan dynamic viewport height: `min-height: 100dvh` (aman dari bar browser mobile).
   - Touch Target Ergonomics: Tombol aksi minimal tinggi **44px – 48px** agar ramah jempol.
3. **Split-Screen Editorial Auth (`/login`, `/register`)**:
   - Sisi Kiri (Desktop): Visual hangat Meja Rias (*Vanity Table Warmth*) dengan tips bersahabat.
   - Sisi Kanan: Formulir frameless yang lapang, bersih, dan fokus.
4. **Reassurance Trust Strip**:
   - Di bawah tombol CTA utama, selalu sediakan trust strip mikro:  
     `Gratis Pendaftaran • Tanpa Kartu Kredit • 100% Aman Privasi`.
5. **Zero-Runtime-Parser untuk Dokumen Legal (RFC 016)**:
   - Halaman `/terms`, `/privacy`, `/refund-policy`, `/medical-disclaimer`, `/faq` wajib ditulis sebagai komponen statis TSX/JSX murni yang di-*tree-shake* saat compile (FCP < 0.5 detik). Dilarang memasang runtime parser markdown di browser.

---

## 📱 4. Seluruh Konsensus Halaman Login (App Dashboard & Fitur)

Halaman: `/dashboard`, `/face-scan`, `/ingredient-scan`, `/missions`, `/chatbot`, `/profile/*`.

### 4.1 Shell & Page Layout Contract (Standard Canvas System)
- **Struktur Shell**: Sidebar Kiri (250px) + Topbar (68px, padding `0 40px`) + Host Kanvas (`.cluv-shell-page-content`, padding `0`).
- **Baseline Left-Anchor Discipline (Desktop)**:
  - Garis tepi kiri konten (judul, tombol back, kartu) **WAJIB SELALU SEJAJAR** pada offset padding standar (`40px` dari sidebar), 100% sejajar dengan judul di Topbar.
- **3 Canonical App Canvas Primitives (`src/styles/cluv/layout.css`)**:
  1. **`.cluv-canvas-grid` (Tipe A: Full Canvas)**: Dashboard, Scanner Wajah & Komposisi, Misi, Riwayat Scan, Profil Hub (`max-width: 1240px; padding: 32px 40px 80px;`).
  2. **`.cluv-canvas-focused` (Tipe B: Focused Ledger & Forms)**: Tagihan, Mutasi Credits, Edit Profil Kulit, Checkout (`max-width: 760px; padding: 32px 40px 80px; margin-left: 0; margin-right: auto;`).
  3. **`.cluv-canvas-bleed` (Tipe C: Full-Bleed Viewport)**: Skinsistant AI Chatbot & Camera HUD (`width: 100%; height: 100%; padding: 0; overflow: hidden;`).

### 4.2 Master Contract: Bento Standards & Slot Architecture
1. **Pola Grid Kanonikal (`.cluv-bento-grid`)**:
   - `.is-hero` (1.55fr : 1fr): Hero split utama vs pendukung.
   - `.is-equal` (1fr : 1fr): Komparasi seimbang dua data (Tren vs Rutinitas).
   - `.is-trio` (1fr : 1fr : 1fr): Tiga metrik/tahap alur.
   - `.is-quad` (repeat(4, 1fr)): 4 pintasan aksi horizontal.
   - `.is-full` (1fr): Grafik lebar penuh.
2. **Anatomi Kartu Bento (`.cluv-bento-card`)**:
   - `.cluv-bento-header`: Memuat icon wrap pastel `.cluv-bento-header-icon`, judul + eyebrow `.cluv-bento-header-titles`, dan tombol aksi `.cluv-bento-header-action`. Gunakan `.is-inline` bila kartu tanpa tombol.
   - `.cluv-bento-body`: Area visual data (Score ring SVG, bar chart, sirkadian box).
   - `.cluv-bento-footer`: Tautan footer atau secondary CTA dengan hairline separator atas.
3. **Varian Kartu**: `.is-interactive`, `.is-compact`, `.is-tint-teal`, `.is-tint-purple`, `.is-tint-gold`.

### 4.3 Master Contract: Tipografi & Spacing (Dashboard vs Landing)
| Level Teks | Dashboard & App Pages (Login) | Landing & Public Pages (Non-Login) |
| :--- | :--- | :--- |
| **H1 Judul Utama** | **`.cluv-title-section`** (`clamp(1.5rem, 2.4vw + 0.5rem, 1.875rem)`). Dilarang pakai `.cluv-title-hero` di dashboard! | **`.cluv-title-hero`** (`clamp(2.25rem, 4vw + 1rem, 3.25rem)`). |
| **H2/H3 Judul Kartu**| **`.cluv-title-card`** (`clamp(1.125rem, 1.2vw + 0.4rem, 1.25rem)`). | **`.cluv-title-section`** (`clamp(1.75rem, 3vw + 0.5rem, 2.25rem)`). |
| **Eyebrow Label** | **`.cluv-micro.cluv-uppercase`** (`0.6875rem` / 11px, bold, tracking 0.04em). | **`.cluv-badge.is-teal`** (`0.8125rem`). |
| **Body Teks** | **`.cluv-body`** (`0.875rem - 0.9375rem`, line-height 1.5). | **`.cluv-lead`** (`1.125rem`) & **`.cluv-body`** (`1rem`). |
| **Fine Print** | **`.cluv-caption`** (`0.8125rem`) & **`.cluv-micro`** (`0.6875rem`). | **`.cluv-caption`** (`0.875rem`). |
| **Spacing Gap** | `gap: 16px - 20px` (padat, anti-scrolling berlebih). | `padding: clamp(64px, 8vw, 96px) 0` (lega, bernapas). |

### 4.4 Doktrin Mobile App-First (Bukan Sekadar Desktop yang Di-shrink)
Di layar ponsel (`<= 640px`), dashboard beroperasi layaknya **Native Mobile App**:
1. **Shell Navigasi Bawah Ramah Jempol**:
   - Sidebar desktop dihilangkan total (`display: none !important`).
   - Bottom Bar 5 menu (`.cluv-mobile-bottom-bar`) dengan Center Floating Action Button (FAB Scan Wajah: `.cluv-bottom-nav-fab-icon`) yang ramah jempol.
   - Topbar bersih tanpa avatar; avatar profil pindah ke tab Profil di bottom bar.
2. **Unified Hero Card Mobile (`.cluv-mobile-unified-card`)**:
   - Sapaan desktop disembunyikan.
   - Diganti kartu ringkas all-in-one: Avatar user glow ring + sapaan + kapsul saldo kredit (`+`) + mini score ring (56px) + quick action pills (`Pindai Ulang`, `Tanya AI`).
3. **4-Item Squircle Shortcuts (`.cluv-mobile-shortcuts`)**:
   - 4 menu aplikasi kotak membulat berjejer horizontal (Scan Wajah, Scan Komposisi, Misi Glow, Tanya AI).
4. **Disiplin Padding Kartu di Mobile**:
   - Padding kartu desktop: `24px`.
   - Di mobile (`<= 640px`): **Wajib turun ke `16px 14px`** agar area baca lapang dan tidak tercekik border tebal.
5. **Anti Scroll Fatigue & Pola Inset List**:
   - Dilarang menumpuk 6-8 kartu raksasa vertikal tanpa henti.
   - Rutinitas & misi harian wajib menggunakan pola **Compact Inset Grouped List** (`.cluv-checklist-group`), bukan tumpukan kartu berbingkai tebal.

### 4.5 Master Contract: Triad Core Components (Bento, Button, Badge)
Pola Arsitektur: **Design Tokens & Utilities (Lapis 1)** ➔ **CSS Component Base + .is-* (Lapis 2)** ➔ **Type-Safe React UI Component (Lapis 3)**.

1. **Badge (`.cluv-badge`)**:
   - Pola: `.cluv-badge` + `.is-[teal|gold|slate|rose|purple]` + `.is-sm` (khusus app dashboard/status/counters).
   - Default (12px, padding `4px 12px`): Section Eyebrow di Landing/Public.
   - `.is-sm` (11px, padding `2px 8px`): Dashboard status, pill cuaca, reward koin, scan count.
   - Sub-elemen: `.cluv-dot` (titik 6px).
   - *Pantangan*: Dilarang membuat class ad-hoc (`.cluv-ambient-pill`, `.cluv-mission-reward`). Wajib pakai `.cluv-badge` atau `<Badge />`!

2. **Button (`.cluv-btn` & `<Button />`)**:
   - Pola: `.cluv-btn` + `.is-[primary|secondary|outline|ghost|danger]` + `.is-[sm|md|lg]`.
   - Filosofi: Landing Page = Pill 9999px besar (`is-lg`/`is-pill`) untuk konversi; Dashboard App = Squircle 12-14px ringkas (`is-sm`/`is-md`) untuk efisiensi data.
   - Ukuran: `.is-sm` (38px, bento header/footer/toolbar), `.is-md` (46px, standar & form submit), `.is-lg` (52px, hero CTA landing).
   - Radius: `.is-pill` (9999px), `.is-rounded` (12px), `.is-radius-sm` (8px), `.is-radius-none` (0px).
   - Built-in Hover: Hover selalu terikat satu paket bawaan dengan varian dan animasi `0.18s cubic-bezier(0.16, 1, 0.3, 1)` + translasi Y (-1.5px).
   - Loading State: `.is-loading` memunculkan spinner SVG, teks tetap stabil, otomatis pointer-events none untuk mencegah double transaction.
   - Layout: `.is-block` (100%), `.is-stack-mobile` (100% width di HP <= 640px).
   - React Atom: `<Button variant="..." size="..." radius="..." loading={...} to="..." iconLeft={...}>{children}</Button>`.
   - *Pantangan*: Dilarang membuat class tombol kustom per halaman (`.save-btn`, `.back-btn`).

3. **Bento Grid & Card (`.cluv-bento-grid`, `.cluv-bento-card`)**:
   - Grid: `.is-hero` (60:40), `.is-equal` (50:50), `.is-trio` (33:33:33), `.is-quad` (4 col), `.is-full` (1 col).
   - 3 Slot Card: `.cluv-bento-header` (opsi `.is-inline`), `.cluv-bento-body`, `.cluv-bento-footer`.
   - Padding: Desktop `24px`; Mobile `16px 14px` (radius `16px`).

---

## 📋 5. Checklist Verifikasi Sebelum Menyerahkan Kode

Sebelum menyatakan pekerjaan frontend selesai, AI WAJIB memverifikasi:
- [ ] Tidak ada class Tailwind / non-cluv yang lolos (`node audit script`).
- [ ] Tidak ada warna hex manual di file `.tsx` (gunakan CSS variables `var(--cluv-*)`).
- [ ] Tidak ada inline styles layout/color di JSX (kecuali persentase kalkulasi JS murni).
- [ ] Menggunakan skala tipografi resmi Cluv (`.cluv-title-section` untuk H1 dashboard, `.cluv-title-card` untuk kartu).
- [ ] Layar mobile tetap kompak, padding kartu 16px, ramah jempol (touch target >= 44px).
- [ ] Layar desktop terkunci di anchor kiri (40px) dan memiliki satu titik fokus visual yang jelas.
- [ ] Lolos validasi compile: `tsc -b` dan `vite build` 0 error.


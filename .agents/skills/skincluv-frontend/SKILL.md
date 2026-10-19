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
5. **TIGA DOKTRIN MUTLAK CLUV FRAMEWORK (THE 3 GOLDEN INVARIANTS)**:
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

### D. SOP 5 Langkah Wajib Styling & Refactoring (The 5-Step Bottom-Up Cascade)
Setiap AI atau developer yang memperbaiki atau membuat tampilan UI **WAJIB** mengeksekusi secara berurutan:
1. **Langkah 1 (Tokens)**: Cek `src/styles/cluv/tokens.css`. Pastikan warna, radius, dan bayangan memakai variabel token `var(--cluv-*)`. Dilarang menulis nilai hex atau pixel sembarangan.
2. **Langkah 2 (Utilities)**: Cek `src/styles/cluv/utilities.css`. Jika kebutuhan hanya atomik (flex, spacing margin/padding, gap, alignment), gunakan utilitas yang sudah ada. Dilarang membuat class baru hanya untuk `display: flex` atau `margin`.
3. **Langkah 3 (Generic Component)**: Cek `src/styles/cluv/components/`. Jika elemen memiliki struktur (border, radius, padding, hover, bento grid, kartu, action tile), buat/sesuaikan sebagai komponen generic dengan pola **Base Class + Modifier `.is-*`**. Dilarang mendefinisikan komponen di file CSS halaman!
4. **Langkah 4 (Assembling di JSX)**: Di file `.tsx`, cukup rakit komponen dan suntikkan utilitas mikro layaknya menyusun lego.
5. **Langkah 5 (Dead Code Purge)**: Hapus class ad-hoc lama di file CSS halaman (`dashboard.css`, dll) agar file stylesheet menyusut bersih dan tidak meninggalkan sampah teknis.

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

### 4.1 Shell & Page Layout Contract (Section 5.9 AGENTS.md)
- **Struktur Shell**: Sidebar Kiri (264px) + Top Navbar (78px) + Main Canvas (`.v0-shell-page-content`).
- **Baseline Left-Anchor Discipline (Desktop)**:
  - Garis tepi kiri konten (judul, tombol back, kartu) **WAJIB SELALU SEJAJAR** pada offset padding standar (`40px` dari sidebar).
  - **DILARANG `margin: 0 auto` pada Form/Ledger Sempit**: Gunakan `margin-left: 0; margin-right: auto; max-width: 760px` agar konten tidak terlempar melayang ke tengah monitor ultrawide.

### 4.2 Mobile Dashboard (Konsensus Opsi A + Cuaca Konsep 2)
1. **Unified Bento Skin Card (~135px)**:
   - Sapaan ramah (`Halo, {firstName}`), avatar glow ring (`.is-pro` / `.is-free`), dan dompet kredit interaktif kapsul (`.cluv-credit-capsule: [ ⚡ 1.395 | + ]`) **MENYATU** di header atas Bento Card Observasi Kulit.
   - Menghemat ~50px ruang vertikal dibanding floating card terpisah.
2. **Skinsistant AI Weather Companion Bubble**:
   - Menggunakan avatar robot AI sahabat (`<Bot />`), badge suhu + UV, dan gaya kutipan hangat bersahabat:  
     *`"Siang ini terik banget loh bestie! Sampai 30 derajat. Jangan lupa pake sunscreen ya! :)"`*.
3. **Menu Akses Cepat**:
   - 4 Menu Squircle Pintas (*Scan Wajah, Scan Komposisi, Misi Glow, Tanya AI*) terkunci rapi tepat **di bawah** Bento Card Observasi Kulit.

### 4.3 Desktop Dashboard Visual Hierarchy & Breathing Room
1. **Header Desktop Wajib Bersih & Tenang**:
   - H1 Judul Babak (`.cluv-title-section`): *"Selamat sore, Jessy ✨"*.
   - Subtitle tanggal: *"Minggu, 18 Oktober 2026"*.
   - Data cuaca hadir sebagai **Micro Environmental Tag** yang manis di baris tanggal atau disematkan di atas rutinitas perawatan, **BUKAN sebagai card besar yang mengambang canggung di atas header**.
2. **Anti "Divider Overload" (Garis Berlebihan)**:
   - Hindari memecah kartu dengan garis-garis `border-b` dan `border-t` yang kaku.
   - Gunakan ritme whitespace alami: flexbox `cluv-flex-col cluv-gap-4`.
3. **Hero 2-Column Grid**:
   - Kolom Kiri (1.55fr): Observasi Kulit Terkini dengan circular score ring dan status defensible.
   - Kolom Kanan (1fr): Keamanan Skincare / Lab Komposisi dengan 3 metrik produk terstruktur rapi tanpa kotak border tebal.
4. **4-Column Quick Action Bento Grid**:
   - Di desktop, 4 shortcut sejajar rapi (*Scan Wajah AI*, *Scan Komposisi*, *Misi Glow Harian*, *Tanya Skinsistant*) dengan transisi hover lift yang halus.

---

## 📋 5. Checklist Verifikasi Sebelum Menyerahkan Kode

Sebelum menyatakan pekerjaan frontend selesai, AI WAJIB memverifikasi:
- [ ] Tidak ada class Tailwind / non-cluv yang lolos (`node audit script`).
- [ ] Tidak ada warna hex manual di file `.tsx` (gunakan CSS variables `var(--cluv-*)`).
- [ ] Tidak ada inline styles layout/color di JSX (kecuali persentase kalkulasi JS murni).
- [ ] Menggunakan skala tipografi resmi Cluv (`.cluv-title-section`, `.cluv-title-card`, `.cluv-body`, `.cluv-caption`).
- [ ] Layar mobile tetap kompak dan ramah jempol (touch target >= 44px).
- [ ] Layar desktop terkunci di anchor kiri (40px) dan memiliki satu titik fokus visual yang jelas.
- [ ] Lolos validasi compile: `tsc -b` dan `vite build` 0 error.

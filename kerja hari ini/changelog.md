# 📝 Changelog — Scan Ingredient AI
**Tanggal:** 2026-09-06  
**Scope:** Fitur Scan Ingredient (`ingredient_scan`)

---

## [v3.0.0] — 2026-09-06

### 🗑️ Dihapus (Removed)
- **`SAMPLE_INGREDIENTS`** — Konstanta array 3 teks bahan dummy (`Aqua, Niacinamide 5%...`, `Water, Salicylic Acid 2%...`, `Aqua, Glycerin, Ceramide NP...`) dihapus dari `IngredientScanPage.tsx`
- **State `activeSample`** — `useState<string | null>(null)` untuk menyimpan teks sampel yang dipilih dihapus dari komponen
- **JSX Sample Chips** — Blok UI "Atau uji coba instan dengan sampel skincare:" beserta 3 tombol "Sampel Skincare #1/2/3" dihapus dari stage upload
- **Logika `textToAnalyze`** — `const textToAnalyze = customText || (activeSample ? activeSample : null)` dihapus dari `handleStartAnalysis`
- **Fallback `activeSample` di disabled button** — `(!imageBase64 && !activeSample)` diganti menjadi `!imageBase64` saja
- **`setActiveSample(null)` di `handleResetFlow`** — dihapus karena state sudah tidak ada

### ✅ Ditambahkan (Added)
- **Anti-Hallucination Guard** di `handleStartAnalysis()`:
  ```ts
  const isHallucination = (result.safety_score === 0 || result.safety_score === null)
    && !result.extracted_raw_text?.trim()
    && !customText
  ```
  Jika kondisi terpenuhi → tolak response, tampilkan error, kembali ke stage upload

- **Validasi Empty Ingredients** diperbaiki — `!textToAnalyze` diganti `!customText` agar konsisten

- **Migration `20240001000021_ingredient_scan_strict_prompt.sql`** — System prompt v3 baru di Supabase `prompt_versions`:
  - Instruksi 3-langkah berlapis (Klasifikasi → Anti-Halusinasi → Analisis)
  - Daftar exhaustive gambar yang harus ditolak: wajah/selfie, hewan, makanan, anime, deterjen, dll
  - Larangan keras mengarang bahan INCI
  - Wajibkan `ingredients_breakdown: []` dan `safety_score: null` jika rejected
  - Nonaktifkan prompt lama (migration 020) sebelum insert

### 🔧 Diubah (Changed)
- **`handleStartAnalysis(customText?)`** — Logika input sekarang bersih 2 jalur:
  1. `customText` ada → kirim sebagai `ingredient_text` (hanya untuk Quick-Correction re-analisis)
  2. `customText` tidak ada → kirim `imageBase64` sebagai `image_base64` (normal flow)
- **Tombol "Mulai Pindai Komposisi Skincare"** — `disabled` sekarang hanya `isAnalyzing || !imageBase64` (sebelumnya juga mengecek `!activeSample`)

---

## [v2.x] — 2026-08-31 (Referensi Sebelumnya)

### Yang Sudah Ada Sebelum Hari Ini
- Auto-kompresi foto dengan `compressImageForAI` (imageQualityValidator)
- Client-side face detection via MediaPipe (`detectHumanFace`) — menolak selfie wajah jelas
- Quick-Correction Box (edit teks OCR salah)
- Layering Guide Matrix (Best Combos & Danger Combos)
- Safety Score & Comedogenic Rating
- Partial read warning banner
- Smart Photography Tips di upload stage
- Fallback `displayIngredientsList: []` (mock data 5 bahan sudah dihapus di v2.1)

---

## File yang Berubah

| File | Jenis Perubahan | Status |
|------|-----------------|--------|
| `src/pages/app/IngredientScanPage.tsx` | Modified — hapus dummy, perketat OCR prompt, tambah guard | ✅ Terpasang |
| `supabase/migrations/20240001000021_ingredient_scan_strict_prompt.sql` | New — system prompt v3 strict | ✅ Pushed ke Cloud |
| `supabase/functions/invoke-ai/index.ts` | Modified — multimodal vision (`inlineData`) attachment | ✅ Deployed ke Cloud |
| `supabase/functions/_shared/aiProviders.ts` | Modified — Google Gemini multimodal payload handler | ✅ Deployed ke Cloud |

---

## Status Deployment Cloud

> ✅ **Database Migrations:**
> ```bash
> npx supabase db push
> ```
> Migrasi 019, 020, dan 021 telah berhasil di-push ke PostgreSQL database Supabase Cloud.

> ✅ **Edge Functions (Multimodal AI Vision):**
> ```bash
> npx supabase functions deploy invoke-ai --no-verify-jwt
> ```
> Edge function `invoke-ai` berhasil di-deploy ke Supabase Cloud (v11, size 70 kB).  
> **Sebelumnya:** Edge function di cloud adalah versi v10 (Agustus) yang belum memiliki kode lampiran gambar ke Gemini, sehingga Gemini menganalisis tanpa menerima gambar sama sekali (mengakibatkan halusinasi produk pasar Glad2Glow 22 bahan).  
> **Sekarang:** Foto kemasan dikirim secara utuh via base64 `inlineData` langsung ke mata Gemini Vision.

---

## [v3.1.0] — 2026-10-17
**Scope:** Standarisasi App Shell (Sidebar, Topbar, Mobile Bar) & Dashboard ke Cluv Micro-Framework (`cluv-*`)

### 🧭 1. Pemisahan Routing Kanonikal
- **`/`**: Eksklusif untuk Halaman Publik / Landing Page (lengkap dengan smart CTA: "Buka Dashboard" jika sudah login, "Mulai Sekarang" jika belum).
- **`/dashboard`**: Rute resmi kanonikal untuk App Dashboard.
- Seluruh flow login, registrasi, recovery kata sandi, dan auth callback diarahkan konsisten ke `/dashboard`.

### 🌸 2. Komponen Primitif Baru Cluv Framework
Dibuat di `src/styles/cluv/` dan didokumentasikan di `CLUV_FRAMEWORK_CHEATSHEET.md`:
- `src/styles/cluv/components/stats.css`: `.cluv-stat-card`, `.cluv-stat-grid`
- `src/styles/cluv/components/score-ring.css`: `.cluv-score-ring` (SVG radial progress ring)
- `src/styles/cluv/components/checklist.css`: `.cluv-check-item`, `.cluv-checklist-group`
- `src/styles/cluv/components/tabs.css`: `.cluv-tabs`, `.cluv-tab-btn`

### 🛋️ 3. Sweet Shell Architecture (`src/styles/cluv/app/shell.css` & `AppLayout.tsx`)
- **Estetika Teman Meja Rias**: Didesain ramah, manis, hangat, dan tenang (bukan dashboard tech B2B SaaS yang kaku).
- **Penyatuan Tipografi ke Nunito**: Mengganti `--cluv-font-app` dari font tech geometris *Plus Jakarta Sans* ke font membulat hangat **`Nunito`** di `tokens.css` dan `surfaces.css`.
- **Hirarki Humanis (No ALL CAPS Kaku)**: Mengganti label seksi kaku `MENU UTAMA` & `LAINNYA` (all-caps + letter-spacing rapat) menjadi teks alami *Sentence case*: `Menu Utama` dan `Eksplorasi Lainnya` (Nunito 13px bold ramah).
- **Desktop Sidebar Paten 250px**: Menghapus sistem collapse 72px yang rumit dan menyebabkan tumpang tindih tombol menu & silang.
- **Demarkasi Jelas Desktop vs Mobile pada Topbar**:
  - **Desktop (Layar Lebar)**: Seluruh elemen cluster kanan memiliki **ritme tinggi seragam 38px**:
    - *Credits Pill (Clean Cloud Pill)*: Kapsul 38px berlatar putih bersih (`#ffffff`), border halus `#dce8f3` (seragam dengan lonceng), ikon petir emas hangat, angka kredit hitam tinta tebal (`1.395`), dan label tipis `Credits`. Sangat tenang, menyatu, dan bebas dari warna ngejreng.
    - *Lonceng*: Lingkaran 38px berbingkai halus `#dce8f3` dengan dot merah pastel.
    - *Profil (Opsi A + Gemini Glowing Gradient Ring)*: **Avatar bulat 38px bersih**:
      - Akun PRO: Dihiasi **Glowing Iridescent Ring** (`linear-gradient(135deg, #1f9d97, #fb7185, #f59e0b)`) dengan jeda putih 2px yang berkilau mewah ala Google Gemini Advanced.
      - Akun Free: Border tenang slate-sejuk (`#dce8f3`).
      - Popover Cloud Card (20px radius) saat diklik menampilkan detail akun lengkap tanpa menjejali header.
  - **Mobile (Layar HP)**: Menu profil di Topbar **disembunyikan total** agar header HP lega dan tidak menumpuk. Navigasi profil di mobile berpusat di tab Profil bawah dan drawer samping.
- **Pembersihan Badge Privasi Sidebar**: Menghapus tumpukan emoji bunga `🌸` di sebelah ikon perisai. Menggunakan satu ikon perisai teal halus + teks `Privasi terlindungi · UU PDP` di atas latar milky pill yang sejuk.
- **Tahap 1 Mobile Shell Hardening (Zero-Drawer & Pure Ergonomics)**:
  - **Eliminasi Hamburger & Drawer Samping**: Sidebar disembunyikan total di layar mobile/tablet (`<= 1024px`). Tidak ada tombol garis tiga, tidak ada backdrop blur drawer, dan tidak ada inkonsistensi navigasi.
  - **Topbar Mobile Bersih & Anggun (58px)**: Kiri menampilkan Logo `skincluv.` manis dengan ikon bintang `<Sparkles />` (karena logo sidebar tersembunyi). Kanan menampilkan *Clean Cloud Credits Pill* + *Lonceng*. Profil di Topbar mobile ditiadakan.
  - **Mobile Bottom Navigation Bar 5 Menu (Ergonomi Jempol)**:
    1. Beranda (`Home`)
    2. Komposisi (`FlaskConical`)
    3. **Scan Wajah (Center FAB)**: Tombol tengah terangkat (*elevated 46px*) berlatar teal cerah dengan bayangan lembut
    4. Skinsistant AI (`MessageCircle`)
    5. Profil (`User`)

### 🗑️ 4. Penghapusan Legacy CSS
- Menghapus total `src/styles/app-layout.css` dan `src/styles/dashboard.css` via `git rm`.
- Refaktor `DashboardPage.tsx` 100% menggunakan token dan class Cluv Framework.

### 📱 6. Tahap 2: Konten Beranda Adaptif Desktop vs Mobile (`DashboardPage.tsx` & `dashboard.css`)
- **Adaptasi Akses Cepat (Desktop 2-Tile Bento vs Mobile 4-Item Squircle Grid)**:
  - **Desktop (`> 640px`)**: Menampilkan 2 kartu bento interaktif lapang (*Scan Wajah AI* & *Scan Komposisi*) dengan deskripsi lengkap, indikator aksen kiri saat hover, dan panah chevron.
  - **Mobile (`<= 640px`)**: Menampilkan **4-Item Squircle App Grid** ala aplikasi mobile modern (Gojek / Apple Health / Lemon8) tepat di bawah greeting:
    1. *Scan Wajah* (Squircle Teal + Camera Icon)
    2. *Scan Bahan* (Squircle Blue + Flask Icon)
    3. *Misi Glow* (Squircle Amber + Sparkles Icon)
    4. *Tanya AI* (Squircle Purple + Bot Icon)
  - Memberikan kenyamanan navigasi 1-tap menggunakan jempol tanpa perlu scrolling panjang.
- **Hero Skin Assessment Card & AI Consultation CTA**:
  - Skor melingkar SVG (`.cluv-score-ring`) dengan gauge dinamis sesuai status kulit (Optimal/Perhatian/Waspada).
  - Ditambahkan chip aksi langsung: **"Konsultasikan ke Skinsistant →"** yang langsung menghubungkan observasi kulit terbaru ke Skinsistant AI (`/chatbot`).
  - Responsif di layar sempit tanpa pemotongan teks atau overlapping badge.
- **Tren Analisis Kulit (7-Pillar Bar Chart)**:
  - Pilar vertikal progresif dengan skor dan tanggal scan, dengan pilar terakhir disorot teal + tooltip angka skor.
  - Penyesuaian padding (`padding: 16px 2px 0`) dan celah dinamis (`gap: clamp(4px, 1.5vw, 8px)`) agar tidak terpotong pada layar HP 375px (iPhone SE).
- **Sunscreen & Daily Routine Cards (100% Cluv Invariant Compliance)**:
  - Menghapus seluruh inline styles (`style={{ background: ... }}` dan layout manual).
  - Menggunakan modifier kanonikal baru `.cluv-card-strip.is-gold` untuk strip proteksi sunscreen harian.
  - Komponen checklist rutinitas harian responsif dengan transisi checklist mulus dan area sentuh jempol ergonomis (min-height 48px).

### 👑 7. Hero Skin Passport & Wallet Card + Ultra-Airy Mobile Topbar
- **Pembersihan Total Topbar Mobile**:
  - Saldo kredit di topbar mobile **dilepas total** (`display: none !important` di `shell.css`) sehingga topbar HP hanya menyisakan Brand Logo `skincluv.` di kiri dan Lonceng Notifikasi di kanan. Sangat lega, bersih, dan tidak sumpek.
- **Hero Skin Passport & Wallet Card (`.cluv-passport-card`)**:
  - Menghadirkan kartu paspor personal terintegrasi ala Oura / Lemon8 di bagian paling atas:
    - **Header**: Avatar pengguna (dengan Gemini Iridescent Glowing Ring untuk PRO / slate-sejuk untuk Free) + Sapaan ramah `Selamat Pagi, Jessy ✨` + Badge Membership (`PRO Member ✨` / `Free Explorer`) + Dompet Kredit (`⚡ 1.395 Credits`) + Tombol Top-up `+ Isi`.
    - **Hairline Divider**: Garis pemisah halus 1px.
    - **Body Observasi Kulit Terkini**:
      - Gauge melingkar SVG terpusat (skor `82 / 100`).
      - Badge status ringkas terkurasi (`Optimal` / `Baik` / `Perhatian` / `Waspada`) mencegah pemotongan teks pada layar sempit.
      - Badge Tipe Kulit (`Tipe: Kombinasi`) dan Indikator Tren (`↗ +3 poin` / `Stabil`).
      - Kalimat observasi personal dari AI.
      - Waktu observasi terakhir (`Dipindai pada 1 Okt, 18:32`).
    - **Aksi Cepat Interaktif**: 2 tombol langsung (`[🔍 Pindai Ulang]` dan `[💬 Tanya Skinsistant]`).
- **Widget Keamanan Skincare (Pemeriksaan Bahan)**:
  - Mengubah kartu tengah kanan menjadi laboratorium mini komposisi produk yang nyata mengonsumsi data `product_summary`:
    - Jumlah produk diuji (`productSummary.total_products_scanned`).
    - Jumlah formula aman bebas iritan (`productSummary.safe_products_count`).
    - Skor keamanan rata-rata (`avg_safety_score`).
    - Tombol aksi: `Pindai Produk Baru` (`/ingredient-scan`).

### 🧪 8. Verifikasi Kualitas
- `npx tsc -b`: **0 error**
- `npm run build`: Berhasil tanpa warning dalam **2.97 detik**

---

## 🎨 9. Tahap 3: Demarkasi Bersih Desktop vs Mobile + Dynamic Routine + Catatan Backend

### 📱 1. Mobile First: Anti-Bloat & Ultra-Compact (~135px Card)
- **Pocket Strip 44px (`.cluv-mobile-pocket-strip`)**:
  - Menggabungkan sapaan ramah `Halo, {firstName} ✨`, badge tier (`PRO ✨` / `Free`), dan saldo kredit `⚡ {balance} Credits` beserta tombol `+ Isi` dalam satu baris ramping 44px di paling atas layar ponsel.
  - Membebaskan topbar ponsel dari tombol saldo yang sempit, menjaga kanvas mobile tetap bersih dan bernafas lega.
- **Perbaikan Bug Saldo `[object Object]`**:
  - Memperbaiki bug pembacaan objek `coinBalance` dari Zustand store (`useAuthStore`) menjadi `(coinBalance?.balance ?? 0).toLocaleString()`.
- **Kartu Observasi Kulit Mobile Kompak (`.cluv-mobile-skin-card`)**:
  - Ukuran tinggi kartu dipangkas dari ~400px menjadi **~135px** (hanya memakan ~15% layar HP, bukan 60%).
  - Menggunakan biometric score ring 60px (`.cluv-score-ring.is-sm`), chip status ringkas, dan paragraf catatan observasi yang dibatasi maksimal 2 baris (`-webkit-line-clamp: 2`).
  - Dilengkapi 2 mini pill button interaktif (`[🔍 Pindai Ulang]` dan `[💬 Tanya AI]`).

### 🖥️ 2. Desktop Layout: Eliminasi Redundansi & Grid 2-Kolom Seimbang
- **Eliminasi Redundansi Avatar & Profil di Kartu Hero**:
  - Mengingat topbar dan sidebar desktop sudah memuat identitas pengguna dan saldo kredit, kartu hero di desktop difokuskan 100% pada esensi analitik kesehatan kulit.
  - Header desktop yang tenang: `Selamat {pagi/siang/sore/malam}, {firstName} ✨` beserta tanggal hari ini.
- **Hero Grid 2-Kolom (1.55fr : 1fr)**:
  - **Kolom Kiri (1.55fr)**: Kartu Observasi Kulit Terkini (`skin_assessment`) dengan score ring 80px, status kualitatif defensible, tipe kulit, label tren perkembangan, dan CTA konsultasi ke Skinsistant AI.
  - **Kolom Kanan (1fr)**: Kartu Laboratorium Skincare (`product_summary`) dengan metrik produk diuji, formula aman ramah skin barrier, rata-rata skor keamanan, dan tombol pindai produk baru.
- **Middle & Bottom Grids**:
  - Tren Analisis Kulit (grafik 7 pilar vertikal) berdampingan dengan checklist rutinitas harian.
  - Riwayat Scan Terakhir tertata rapi di bagian bawah lengkap dengan strip pengingat proteksi kulit.

### ☀️🌙 3. Rutinitas Harian Adaptif AM / PM
- **Otomatis Berpindah Berdasarkan Jam Lokal**:
  - **Siang / Pagi (`< 17:00`)**: Menampilkan *Rutinitas Pagi ☀️* (Cleanser pH Balance, Serum Niacinamide/Hidrasi, Moisturizer + Sunscreen SPF 50) + strip pengingat re-apply sunscreen (`.cluv-card-strip.is-gold`).
  - **Malam (`>= 17:00`)**: Menampilkan *Rutinitas Malam 🌙* (Double Cleansing Micellar/Oil, Active/Barrier Serum, Night Repair Moisturizer) + strip pengingat regenerasi skin barrier malam hari (`.cluv-card-strip.is-neutral`).

---

## 📌 Catatan & Rekomendasi untuk Tim Backend (Backend Task List)

> ⚠️ **Penting**: Sesuai pembagian peran arsitektur, tim Frontend tidak mengubah skema basis data, RPC migration, atau Edge Functions. Catatan di bawah ini adalah panduan spesifikasi untuk dikerjakan oleh tim Backend:

1. **Persistensi Checklist Rutinitas Pengguna (`user_routines` table)**:
   - *Status Saat Ini (Frontend)*: Menggunakan state lokal React (`useState`) yang adaptif berdasarkan waktu (AM/PM).
   - *Rekomendasi Backend*: Buat tabel `user_routines` atau kolom JSONB di `user_profiles` agar centang rutinitas harian pengguna tersimpan secara persisten lintas sesi dan terhubung dengan sistem streak koin/misi.
2. **Koneksi Produk Skincare ke Analisis Interaksi Bahan (`ingredient_interactions`)**:
   - *Status Saat Ini (Frontend)*: Menampilkan ringkasan agregat produk dari `product_summary` (`total_products_scanned`, `safe_products_count`, `avg_safety_score`).
   - *Rekomendasi Backend*: Pada RPC `get_user_dashboard_summary()`, tambahkan flag peringatan dini jika ada produk yang baru di-scan memiliki tabrakan bahan aktif (*clashing ingredients*, misal AHA/BHA bertemu Retinol konsentrasi tinggi).
3. **Endpoint Cache Hit Flag untuk Trend Line**:
   - *Status Saat Ini*: Frontend menyaring tren dengan RFC 011 (`is_repeat = false`).
   - *Rekomendasi Backend*: Pastikan RPC `get_user_dashboard_summary()` konsisten menerapkan `WHERE is_repeat = false` pada query `face_trend` agar median baseline 28 hari selalu steril dari duplikasi foto berulang.
4. **Integrasi Weather & UV Index API (Smart Environmental Tips)**:
   - *Status Saat Ini (Frontend)*: Menggunakan **Konsep 2 (Skinsistant AI Weather Companion Bubble)** yang menampilkan sapaan ramah robot AI bersuhu (°C) dan Indeks UV real-time dengan saran kontekstual skin-barrier harian (AM sunscreen, UV midday re-apply, afternoon hydration, night barrier recovery).
   - *Rekomendasi Backend*: Sediakan RPC / Edge Function yang mengonsumsi Weather API bebas auth/gratis (misal Open-Meteo) berdasarkan estimasi lokasi reverse-IP pengguna untuk memasok suhu aktual (°C) dan Indeks UV real-time.

---

## 🏆 10. Finalisasi: Penguncian Layout Opsi A & Cuaca Konsep 2

- **Layout Terpilih: Opsi A (Unified Bento Skin Card)**:
  - Header sapaan ramah (`Halo, {firstName}`), avatar ring indikator status (`.is-pro` / `.is-free`), dan dompet kredit interaktif kapsul (`.cluv-credit-capsule: [ ⚡ 1.395 | + ]`) menyatu di bagian atas Bento Card Observasi Kulit.
  - Memangkas ruang vertikal hingga ~50px dibanding floating card terpisah.
- **Widget Cuaca Terpilih: Konsep 2 (Skinsistant AI Companion Bubble)**:
  - Avatar Skinsistant AI (`<Bot />`), badge suhu + UV, serta kutipan tips personal bersahabat: *"Siang ini terik banget loh bestie! Sampai 30 derajat. Jangan lupa pake sunscreen ya! :)"*.
- **Posisi Akses Cepat**:
  - 4 Menu Squircle Pintas (*Scan Wajah, Scan Komposisi, Misi Glow, Tanya AI*) terkunci rapi tepat **di bawah** Bento Card Observasi Kulit.
- **Pembersihan Kode**:
  - Seluruh tombol switcher preview, state demo, dan style `.cluv-weather-pill` yang tidak terpilih telah dihapus bersih.
- **Verifikasi**:
  - `npx tsc -b`: 0 error
  - `npm run build`: Selesai dalam 3.13 detik tanpa warning

---

## 🖥️ 11. Elevasi & Modernisasi Dashboard Desktop (Desktop Polish)

- **Skinsistant AI Weather Companion di Header Desktop (`.cluv-desktop-weather-card`)**:
  - Memanfaatkan ruang kosong ~600px di sebelah kanan sapaan desktop.
  - Menampilkan avatar robot AI Skinsistant, badge suhu + UV Indeks real-time, dan rekomendasi cuaca personal.
- **Bento Depth & Soft Gradient pada Hero Grid**:
  - `.cluv-hero-face-card`: Gradient lembut teal-soft di bagian atas kartu observasi visual.
  - `.cluv-hero-lab-card`: Gradient lembut blue-soft di bagian atas kartu lab komposisi.
- **Lab Skincare Metrics Strip (`.cluv-lab-metrics-strip`)**:
  - Metrik produk kini tertata dalam 3 micro-card rapi (`.cluv-lab-metric-box`):
    - *Produk Diuji* (netral)
    - *Formula Aman* (aksen teal-dark)
    - *Skor Keamanan* (aksen status-info blue)
- **4-Column Quick Action Bento Grid di Desktop (`.cluv-quick-scan-grid`)**:
  - Menyamakan kelengkapan akses cepat mobile ke desktop:
    1. *Scan Wajah AI* (Teal)
    2. *Scan Komposisi* (Blue)
    3. *Misi Glow Harian* (Gold, terhubung progress misi aktif)
    4. *Tanya Skinsistant* (Purple, konsultasi AI 24/7)
- **Verifikasi Kualitas**:
  - `npx tsc -b`: 0 error
  - `npm run build`: Selesai dalam 3.33 detik tanpa warning

---

## 🌟 12. Finalisasi Desktop: Full-Width Weather Banner & Balanced Bento Rhythm

- **Pembersihan Header**:
  - Menghapus teks redundan *"Ringkasan Hari Ini"*.
  - Sapaan berwibawa: H1 `.cluv-title-section` (*"Selamat {timeOfDay}, {firstName} ✨"*) + Subtitle tanggal.
- **Skinsistant AI Weather Banner Full Width (`.cluv-weather-bubble`)**:
  - Membentang penuh di bawah tanggal selebar kanvas hero grid.
  - Mempertahankan kesamaan UI/UX dengan mobile (avatar robot AI + badge suhu & UV + saran skin-barrier bersahabat).
  - Tidak memakan kolom grid bento bawah sehingga hero data tetap memiliki lebar natural (1.55fr : 1fr).
## 🏛️ 13. Standarisasi Universal App Canvas Primitives & Pembersihan Total Legacy v0

**Scope:** Layout Kanvas Aplikasi (`src/styles/cluv/layout.css`, `shell.css`) & Eradikasi Style Non-Cluv (`src/index.css`)

### 📐 1. Tiga Primitif Kanvas Kanonikal (`.cluv-canvas-*`)
- Diciptakan di `src/styles/cluv/layout.css` untuk menyelesaikan **Padding Ownership Conflict** antara Shell luar dan halaman konten:
  1. **`.cluv-canvas-grid` (Tipe A: Full Canvas / Grid 1240px)**:
     - Digunakan oleh: `DashboardPage.tsx`, `IngredientScanPage.tsx`, `FaceScanPage.tsx`, `MissionsPage.tsx`, `ScanHistoryPage.tsx`, `ProfilePage.tsx`, `ProfileBillingPage.tsx`.
     - Layout: `max-width: 1240px; padding: 32px 40px 80px; width: 100%;` (Mobile: `padding: 20px 16px 80px;`).
  2. **`.cluv-canvas-focused` (Tipe B: Focused Ledger & Forms 760px)**:
     - Digunakan oleh: `ProfileSkinPage.tsx`, `TransactionHistoryPage.tsx`, `PaymentSuccessPage.tsx`, `CoinHistoryPage.tsx`, `PrivacyCenterPage.tsx`, `CheckoutPage.tsx`.
     - Layout: `max-width: 760px; padding: 32px 40px 80px; margin-left: 0; margin-right: auto; width: 100%;` (Terkunci sejajar anchor kiri 40px, tidak melayang ke tengah layar monitor lebar).
  3. **`.cluv-canvas-bleed` (Tipe C: Full-Bleed Viewport 100%)**:
     - Digunakan oleh: `ChatbotPage.tsx` (/chatbot) & Camera HUD.
     - Layout: `width: 100%; height: 100%; padding: 0; overflow: hidden;` (Edge-to-edge tanpa padding luar yang menjepit chat bar).

### 🎯 2. Sinkronisasi Presisi Anchor Kiri Topbar & Shell
- **Topbar**: `padding: 0 40px;` (desktop) dan `padding: 0 16px;` (mobile). Garis tepi judul konteks halaman sejajar 100% presisi dengan tepi konten kanvas.
- **Shell Page Content (`.cluv-shell-page-content`)**: `padding: 0;` (Semua padding outer 100% dikelola kanvas secara konsisten tanpa ada risiko double padding).

### 🗑️ 3. Pemusnahan Total Style & Aturan Legacy v0
- **`src/index.css`**: Menghapus 635 baris CSS mati peninggalan v0 (`.v0-page-container` dan seluruh `.v0-profile-*`).
- **Pages**: Mengganti seluruh sisa pemanggilan `v0-page-container` di `IngredientScanPage.tsx` dan `FaceScanPage.tsx` menjadi kanonikal `.cluv-canvas-grid`.
- **Dokumentasi & Rules (`AGENTS.md` & `SKILL.md`)**:
  - Merevisi seksi 5.5, 5.6, 5.9, dan 5.10 untuk menghapus seluruh instruksi yang mewajibkan prefix `v0-`.
  - Mengunci kewajiban penggunaan 3 kanvas kanonikal `.cluv-canvas-*` dan kamus Cluv Micro-Framework murni.
- **Zero Backend Interference**: 100% perbaikan hanya terjadi di antarmuka frontend, CSS tokens, dan dokumentasi arsitektur. Nol perubahan pada schema DB, Supabase migrations, maupun Edge Functions.

### 🧪 4. Verifikasi Kualitas
- `npx tsc -b`: **0 error**
- `npm run build`: Berhasil tanpa error dalam **2.91 detik**

---

## 💎 14. Pembuatan Halaman Paket Akses & FAQ Khusus Dashboard (`AppLayout`)

**Scope:** Halaman Aplikasi Terotentikasi (`AppPricingPage.tsx`, `AppFaqPage.tsx`, & `App.tsx` routing)

### 🧭 1. Masalah yang Diselesaikan
- Sebelumnya, pengguna yang login dan mengklik menu **"Paket Akses"** (`/paket`) atau **"Bantuan & FAQ"** (`/faq`) di sidebar dashboard malah terlempar keluar dari App Shell ke halaman marketing publik (`PublicLayout`) dengan navbar dan footer landing page.
- Pengguna kehilangan konteks sidebar, saldo kredit, dan avatar profil.

### 🌸 2. Solusi & Halaman Baru
1. **`AppPricingPage.tsx` (`/paket` untuk User Terotentikasi)**:
   - Terintegrasi 100% di dalam App Shell dengan kanvas kanonikal `.cluv-canvas-grid cluv-animate-fade`.
   - **Current Status Card**: Menampilkan status keanggotaan aktif (`PRO Member ✨`, `GLOW Member ⚡`, atau `Free Explorer 🌱`), sisa hari aktif paket, dan saldo AI Credits.
   - **3 Bento Pricing Cards**: Kartu tier *Mulai Santai (Free)*, *Skincluv GLOW (Rp 25.000)*, dan *Skincluv PRO (Rp 49.000)* lengkap dengan daftar manfaat terperinci dan tombol aksi dinamis (`/checkout?plan=...` atau label *Paket Aktif Saat Ini*).
   - **Prepaid & Trust Reassurance Grid**: Tiga strip jaminan (*Bebas Auto-Debit*, *Tripay Multi-Channel*, *Privasi UU PDP*).
   - Tautan langsung ke Riwayat Tagihan (`/transactions`) dan Pusat Bantuan (`/faq`).

2. **`AppFaqPage.tsx` (`/faq` untuk User Terotentikasi)**:
   - Terintegrasi 100% di dalam App Shell dengan kanvas kanonikal `.cluv-canvas-grid cluv-animate-fade`.
   - **Real-Time Search Bar**: Filter instan pencarian pertanyaan berdasarkan kata kunci.
   - **Interactive Category Filter Tabs**: Pilihan kategori (*Semua*, *Paket & Pembayaran*, *AI & Analisis Kulit*, *Privasi & UU PDP*, *Credits & Misi*).
   - **Smooth Accordion List**: Tanya jawab interaktif dengan penjelasan defensible sesuai regulasi non-terapeutik dan transparansi sistem prepaid Tripay.
   - **Still Need Help? Banner**: Opsi 1-tap konsultasi langsung ke Skinsistant AI (`/chatbot`) atau email Customer Support.

3. **Smart Conditional Routing di `src/App.tsx`**:
   - Jika pengunjung **belum login** (`!user`): Mengakses `/paket` atau `/faq` akan membuka halaman publik dengan `PublicLayout` dan navigasi landing page.
   - Jika pengguna **sudah login** (`user`): Mengakses `/paket` atau `/faq` akan membuka `AppPricingPage` dan `AppFaqPage` di dalam `AppLayout` (sidebar & topbar tetap utuh dan aktif).

### 🧪 3. Verifikasi Kualitas
- `npx tsc -b`: **0 error**
- `npm run build`: Berhasil tanpa error dalam **2.11 detik**

---

## 🏛️ 15. Kodifikasi Master Contract: Grid, Bento Standards, Hirarki Tipografi, & Mobile App-First

**Scope:** Tata Kelola Arsitektur & Pedoman Antar-AI (`AGENTS.md`, `.agents/skills/skincluv-frontend/SKILL.md`, `docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md`)

### 🧭 1. Latar Belakang
- Untuk menghindari ketidaksinkronan atau tebak-tebakan antar AI (Antigravity, Claude, ChatGPT, DeepSeek, Kimi) saat mendesain layout dashboard vs landing page, standar bento, skala tipografi, dan pengalaman native mobile app.
- Mengunci kesepakatan bahwa Dashboard pada ponsel **bukan sekadar responsive web yang dikecilkan**, melainkan mengadopsi prinsip **Native Mobile App-First UX**.

### 📐 2. Detail Kontrak yang Dikodifikasi
1. **Grid System (Dashboard vs Landing)**:
   - *Dashboard*: Functional Left-Anchored Bento Grid (`.cluv-canvas-grid`, `max-width: 1240px; margin-left: 0; margin-right: auto; padding: 32px 40px 80px`), asimetris (1.55fr : 1fr) untuk prioritas data klinis vs lab pendukung, gap padat `16px - 20px`.
   - *Landing Page*: Narrative Centered Storytelling Grid (`.cluv-container`, `max-width: 1200px; margin: 0 auto;`), simetris untuk alur cerita produk, gap lega `24px - 32px`.
2. **Standar Komponen Bento Universal**:
   - Pola preset `.cluv-bento-grid`: `.is-hero` (60:40), `.is-equal` (50:50), `.is-trio` (33:33:33), `.is-quad` (4 col), `.is-full` (1 col).
   - Anatomi 3 Slot `.cluv-bento-card`: `.cluv-bento-header` (dengan `.is-inline` bila tanpa tombol), `.cluv-bento-body`, dan `.cluv-bento-footer`.
3. **Hirarki Tipografi & Jarak (Dashboard vs Landing)**:
   - Dashboard H1: Wajib `.cluv-title-section` (`clamp(1.5rem, 2.4vw + 0.5rem, 1.875rem)`). **DILARANG** menggunakan `.cluv-title-hero` di dashboard.
   - Bento Card H2: `.cluv-title-card` (`clamp(1.125rem, 1.2vw + 0.4rem, 1.25rem)`).
   - Eyebrow: `.cluv-micro.cluv-uppercase` (`0.6875rem` / 11px bold).
4. **Doktrin Mobile App-First (Ponsel <= 640px)**:
   - **Shell Navigasi**: Sidebar desktop lenyap, digantikan Bottom Navigation Bar 5-menu dengan Center FAB Scan Wajah melayang ramah jempol (*Thumb Zone*). Topbar diringkas tanpa avatar (avatar dipindah ke tab Profil bottom nav).
   - **Hero Card Terpadu**: Sapaan desktop diganti kartu ringkas `.cluv-mobile-unified-card` (Avatar glow ring + Sapaan + Kapsul Kredit `+` + mini score ring 56px + action pills).
   - **4-Item Squircle Shortcuts**: Grid 4 kolom menu pintas kotak membulat (`.cluv-mobile-shortcuts`).
   - **Disiplin Padding Kartu di Mobile**: Padding bento card di HP wajib turun dari `24px` ke `16px 14px` agar area baca tidak tercekik oleh border tebal.
   - **Anti Scroll Fatigue**: Mengganti tumpukan kartu raksasa tak berujung dengan *Compact Inset Grouped List* dan opsi horizontal snap.

### 🧪 3. Verifikasi Kualitas
- `npx tsc -b`: **0 error**
- `npm run build`: Berhasil tanpa error dalam **1.70 detik**

---

## 🚀 16. Eksekusi Refactoring Dashboard Sesuai Master Contract

**Scope:** `DashboardPage.tsx`, `src/styles/cluv/components/bento.css`, & `src/styles/cluv/app/dashboard.css`

### 🔧 1. Refaktorisasi Kartu Bento (Anatomi 3 Slot Baku)
Seluruh 6 kartu bento di `DashboardPage.tsx` telah dimutasi ke arsitektur slot murni:
1. **Hero Kiri (Observasi Kulit AI)**: Menggunakan `.cluv-bento-header` ➔ `.cluv-bento-body` (score ring + catatan AI) ➔ `.cluv-bento-footer` (tautan konsultasi).
2. **Hero Kanan (Laboratorium Komposisi)**: Menggunakan `.cluv-bento-header.is-inline` ➔ `.cluv-bento-body` (lab metrics) ➔ `.cluv-bento-footer` (status & tombol scan baru).
3. **Middle Kiri (Tren Analisis Kulit)**: Menggunakan `.cluv-bento-header` ➔ `.cluv-bento-body` (bar chart pilar) ➔ `.cluv-bento-footer` (ringkasan jumlah scan).
4. **Middle Kanan (Misi Glow Hari Ini)**: Menggunakan `.cluv-bento-header` ➔ `.cluv-bento-body` (checklist interaktif) ➔ `.cluv-bento-footer` (tombol detail misi).
5. **Bottom Kiri (Transformasi & Komparasi)**: Menggunakan `.cluv-bento-header` ➔ `.cluv-bento-body` (side-by-side comparison box) ➔ `.cluv-bento-footer` (titik data & riwayat).
6. **Bottom Kanan (Fokus Sirkadian AI Coach)**: Menggunakan `.cluv-bento-header.is-inline` ➔ `.cluv-bento-body` (fase sirkadian + 1-tap prompts) ➔ `.cluv-bento-footer` (buka chat Skinsistant).

### 📱 2. Standarisasi Padding Mobile di `bento.css`
- Menyelaraskan padding kartu bento pada layar ponsel (`<= 640px`) menjadi `padding: 16px 14px;` dengan `border-radius: var(--cluv-radius-lg, 16px);`. Mencegah ruang baca menyempit akibat border tebal.

### 🧹 3. Dead Code Purge di `dashboard.css`
- Menghapus class ad-hoc mati `.cluv-dashboard-title` dan `.cluv-dashboard-subtitle` karena halaman sudah 100% menggunakan tipografi kanonikal `.cluv-title-section` dan `.cluv-subtitle`.

### 🧪 4. Verifikasi Kualitas
- `npx tsc -b`: **0 error**
- `npm run build`: Berhasil tanpa error dalam **2.26 detik**

---

## 💎 17. Kodifikasi & Implementasi Triad Core Components (Badge, Button, Bento)

**Scope:** `src/components/ui/Badge.tsx`, `src/components/ui/Button.tsx`, `src/styles/cluv/components/badges.css`, `src/pages/app/DashboardPage.tsx`, `AGENTS.md`, `SKILL.md`, `CLUV_FRAMEWORK_CHEATSHEET.md`

### 🧭 1. Masalah yang Diselesaikan
- Ditemukan fragmentasi tampilan badge di dashboard: pil cuaca memakai `.cluv-ambient-pill`, reward misi memakai `.cluv-mission-reward`, dan komponen React `<Badge />` masih mengandalkan inline styles dengan CSS variable lama.
- Kebutuhan akan arsitektur berlapis: **Tokens/Utilities (Lapis 1)** ➔ **CSS Components Base + `.is-*` (Lapis 2)** ➔ **Type-Safe React Atoms (Lapis 3)** agar AI dan developer tidak lagi membuat CSS ad-hoc.

### 🌸 2. Solusi & Perubahan Nyata
1. **Penyempurnaan `badges.css`**:
   - Menghapus margin bawah bawaan `margin-bottom: 14px;` dari base `.cluv-badge` menjadi `margin-bottom: 0;` (Hukum Komponen Mandiri).
   - Menambahkan aturan kontekstual `.cluv-section-header > .cluv-badge { margin-bottom: 14px; }` untuk penanda seksi di Landing Page.
2. **Refaktorisasi Total `src/components/ui/Badge.tsx`**:
   - Membuang 100% inline styles `style={{ ... }}`.
   - Menggunakan class murni `.cluv-badge` dengan varian `is-teal`, `is-gold`, `is-slate`, `is-rose`, `is-purple` dan ukuran `is-sm`.
   - Mendukung prop `dot`, `pulse`, `icon`, dan backward-compatibility status aliases (`optimal`, `attention`, `alert`, `neutral`).
3. **Penciptaan `src/components/ui/Button.tsx`**:
   - Komponen tombol atomik modular berbasis forwardRef, membungkus `.cluv-btn` dengan varian `primary`, `secondary`, `outline`, `ghost`, `danger`, ukuran `sm`, `md`, `lg`, serta modifier `pill`, `block`, dan `stackMobile`.
   - Diekspor resmi melalui barrel export `src/components/ui/index.ts`.
4. **Unifikasi Dashboard Badges (`DashboardPage.tsx`)**:
   - Mengganti seluruh pil cuaca header, progress misi harian, reward koin, dan counter ringkasan scan dengan komponen `<Badge />`.
   - Semua badge kini memiliki proporsi tinggi, border crisp, radius pill, dan typography yang 100% konsisten.
5. **Dead Code Purge (`dashboard.css`)**:
   - Menghapus selector ad-hoc mati `.cluv-ambient-pill` dan `.cluv-mission-reward`.
6. **Kodifikasi Pedoman**:
   - Menambahkan Section 5.14 Sub-5 di `AGENTS.md`, Section 4.5 di `SKILL.md`, dan Section 11 di `CLUV_FRAMEWORK_CHEATSHEET.md`.

---

## 🔘 18. Button Design System Contract & Unifikasi Tombol Dashboard

**Scope:** `src/components/ui/Button.tsx`, `src/styles/cluv/components/buttons.css`, `src/pages/app/DashboardPage.tsx`, `src/pages/app/ChatbotPage.tsx`, `AGENTS.md`, `SKILL.md`, `CLUV_FRAMEWORK_CHEATSHEET.md`

### 🧭 1. Masalah yang Diselesaikan
- Seluruh tombol di dashboard (seperti `Pindai Ulang`, `Buka Riwayat Lengkap >`, `Buka Chat Skinsistant AI >`, dan `+ Chat Baru`) masih dibuat secara ad-hoc menggunakan elemen raw `<button className="cluv-btn ...">` atau class custom per halaman (`.cluv-chat-util-btn`).
- Belum ada aturan tegas mengenai perbedaan psikologi tombol antara **Landing Page (Publik)** vs **Dashboard App (Login)**, serta belum ada standardisasi radius kustom, built-in hover, dan loading state anti double-submit.

### 🌸 2. Solusi & Perubahan Nyata
1. **Master Contract Tombol di `AGENTS.md` & `SKILL.md`**:
   - Menetapkan filosofi Landing vs Dashboard:
     - **Landing Page**: Fokus konversi emosional (`.is-lg` / 52px), bentuk Pill bulat penuh (`.is-pill` / 9999px), soft glow shadow.
     - **Dashboard App**: Fokus efisiensi data (`.is-sm` 38px / `.is-md` 44px), bentuk Clinical Squircle (`12px-14px`), crisp border 1.5px, zero distracting glow.
   - Menetapkan 6 Varian Hirarki: `primary` (solid teal), `secondary` (neutral surface), `outline` (brand line), `ghost` (text link), `danger` (destructive soft-red), `icon` (tool action).
   - Menetapkan 4 Kelas Radius: `.is-pill` (9999px), `.is-rounded` (12px), `.is-radius-sm` (8px), `.is-radius-none` (0px).
   - Menetapkan **Built-in Hover Contract**: Hover terikat satu paket bawaan dengan varian tombol dan transisi `0.18s cubic-bezier(0.16, 1, 0.3, 1)` + translasi Y (-1.5px) serta lolos standar kontras WCAG 2.1.
   - Menetapkan **Loading State**: `.is-loading` memunculkan spinner SVG, menjaga kestabilan teks, dan mengunci `pointer-events: none` untuk mencegah transaksi ganda.
2. **Penyempurnaan `src/styles/cluv/components/buttons.css`**:
   - Menambahkan modifier kelas `.cluv-btn.is-radius-sm`, `.cluv-btn.is-radius-none`.
   - Menambahkan `.cluv-btn.is-loading` dan animasi spinner `.cluv-btn-spinner` (`@keyframes cluv-btn-spin`).
3. **Penyempurnaan Komponen `<Button />` (`src/components/ui/Button.tsx`)**:
   - Mendukung prop strongly-typed: `variant`, `size`, `radius`, `loading`, `disabled`, `block`, `stackMobile`, `iconLeft`, `iconRight`.
   - Mendukung **Polymorphic Link**: Otomatis me-render React Router `<Link to="..." />` jika diberikan prop `to`, atau `<a href="..." />` jika diberikan prop `href`, lengkap dengan penanganan `aria-disabled` dan pencegahan klik saat loading/disabled.
4. **Refaktorisasi Menyeluruh di `DashboardPage.tsx`**:
   - Mengganti seluruh raw `<button className="cluv-btn ...">` dengan `<Button>` atomik:
     - Header Bento Face Scan: `<Button variant="outline" size="sm" iconLeft={<ScanFace size={14} />} to="/face-scan">Pindai Ulang</Button>`
     - Footer Bento Face Scan: `<Button variant="ghost" size="sm" ... to="/chatbot">Tanya Skinsistant</Button>`
     - Footer Bento Ingredient Scan: `<Button variant="ghost" size="sm" ... to="/ingredient-scan">`
     - Empty Face Scan CTA: `<Button variant="primary" size="sm" block ... to="/face-scan">Mulai Scan Wajah</Button>`
     - Header Bento Trend & History: `<Button variant="outline" size="sm" iconRight={<ArrowUpRight size={14} />} to="/scan-history">Riwayat</Button>`
     - Footer Bento Missions: `<Button variant="ghost" size="sm" block ... to="/missions">Buka Detail Misi &amp; Reward</Button>`
     - Footer Bento Routine: `<Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} to="/scan-history">Buka Riwayat Lengkap</Button>`
     - Footer Bento Circadian Coach: `<Button variant="outline" size="sm" block iconLeft={<Bot size={15} />} iconRight={<ChevronRight size={14} />} to="/chatbot">Buka Chat Skinsistant AI</Button>`
5. **Refaktorisasi di `ChatbotPage.tsx`**:
   - Mengganti tombol `+ Chat Baru` dengan `<Button variant="primary" size="sm" radius="pill" iconLeft={<Plus size={15} />} onClick={handleCreateNewChat}>Chat Baru</Button>`.
   - Mengganti tombol `Reset Sesi` dengan `<Button variant="ghost" size="sm" iconLeft={<Trash2 size={15} />} onClick={handleResetCurrentSession}>Reset Sesi</Button>`.
6. **Refaktorisasi di `PaymentSuccessPage.tsx`**:
   - Mengganti raw link buttons dengan `<Button>`:
     - CTA Utama: `<Button variant="primary" size="md" block iconLeft={<ScanFace size={18} />} to="/face-scan">Coba Scan Wajah Sekarang</Button>`
     - Aksi Sekunder Kiri: `<Button variant="outline" size="md" iconLeft={<MessageSquare size={16} />} to="/chatbot" className="cluv-flex-1">Chat AI</Button>`
     - Aksi Sekunder Kanan: `<Button variant="ghost" size="md" iconRight={<ArrowRight size={14} />} to="/transactions" className="cluv-flex-1">Riwayat Tagihan</Button>`
   - Mengganti badge manual dengan `<Badge variant="gold">` (Status Aktif) dan `<Badge variant="teal">` (LUNAS).
7. **Refaktorisasi di `TransactionHistoryPage.tsx`**:
   - Mengganti tombol aksi invoice UNPAID dengan `<Button variant="primary" size="sm" iconRight={<ExternalLink size={13} />} to={`/checkout/${inv.merchant_ref}`}>Bayar Sekarang</Button>`.
   - Mengganti tombol empty state dengan `<Button variant="primary" size="sm" to="/pricing" className="cluv-mt-4">Upgrade ke PRO</Button>`.
   - Mengganti seluruh badge status transaksi dengan `<Badge variant="teal">` (LUNAS), `<Badge variant="gold">` (BELUM DIBAYAR), dan `<Badge variant="rose">` (KADALUARSA).
8. **Refaktorisasi di `MissionsPage.tsx`**:
   - Mengganti tombol klaim reward misi dengan `<Button variant="primary" size="sm" loading={claimingSlug === m.slug} onClick={() => handleClaim(m)}>Klaim Hadiah</Button>`. State loading otomatis memunculkan spinner dan mendisable tombol.
   - Mengganti tombol shortcut aksi misi (`Mulai Scan`, `Pindai Produk`, `Tanya AI`, `Isi Profil`) dengan `<Button variant="outline" size="sm" iconRight={<ArrowRight size={12} />} to="...">`.
   - Mengganti seluruh badge status (`Diklaim`, `Belum Selesai`, `Reset 00:00 WIB`, `Ada N Misi Siap Diklaim!`) dengan komponen `<Badge>`.
9. **Refaktorisasi di `AppPricingPage.tsx`**:
   - Header: `<Button variant="outline" size="sm" iconLeft={<Receipt size={14} />} to="/transactions">Riwayat Tagihan</Button>` dan `<Button variant="ghost" size="sm" to="/profile/billing">Info Kuota</Button>`.
   - Kartu Tier Bento: `<Button variant={isTierPro ? 'primary' : 'secondary'} size="md" block iconRight={<ArrowRight size={15} />} onClick={() => handleSelectPlan(tier.slug)}>` serta disabled state untuk paket aktif dan paket dasar free.
   - Footer FAQ Banner: `<Button variant="outline" size="sm" to="/faq">Buka Tanya Jawab &amp; FAQ</Button>`.
   - Mengganti seluruh promo badge dan diskon badge dengan `<Badge>`.
10. **Refaktorisasi Awal di `ScanHistoryPage.tsx`**:
   - Empty State Face Scan: `<Button variant="primary" size="md" iconLeft={<Sparkles size={16} />} to="/face-scan">Mulai Face Scan Pertama</Button>`.
   - Empty State Ingredient Scan: `<Button variant="primary" size="md" iconLeft={<FlaskConical size={16} />} to="/ingredient-scan">Scan Komposisi Produk Pertama</Button>`.
   - Mengganti badge "Terbaru" dan status keamanan formula ("Formula Sangat Baik" / "Perlu Perhatian") dengan `<Badge>`.
   - *Catatan User*: Halaman ini ditandai untuk **perbaikan arsitektur visual menyeluruh (Full Redesign)** pada sesi berikutnya, tidak sebatas tombol.
11. **Refaktorisasi di `ProfileBillingPage.tsx`**:
   - Upgrade / Perpanjang Paket: `<Button variant="outline" size="sm" iconLeft={<Crown size={13} />} to="/pricing">{isPro ? 'Perpanjang' : 'Upgrade Paket'}</Button>`.
   - Beli AI Credits: `<Button variant="primary" size="sm" to="/pricing">+ Beli Credits</Button>`.
   - Mengganti badge tier keanggotaan dengan `<Badge variant={isPro ? 'gold' : isGlow ? 'teal' : 'slate'}>`.
12. **Refaktorisasi di `ProfileSkinPage.tsx`**:
   - Submit Form Preferensi: `<Button variant="primary" size="lg" block loading={loading} iconLeft={<Save size={16} />} onClick={handleSave}>Simpan Profil Kulit</Button>`.
   - Loading state bawaan mengunci interaksi dan memunculkan spinner SVG atomik.
13. **Refaktorisasi di `ProfilePage.tsx`**:
   - Tombol Keluar: `<Button variant="ghost" size="sm" iconLeft={<LogOut size={15} />} onClick={handleSignOut} className="cluv-text-rose">Keluar</Button>`.
   - Tombol Upgrade: `<Button variant="outline" size="sm" iconLeft={<Crown size={13} />} to="/pricing">Upgrade</Button>`.
   - Tombol Kelola Kuota: `<Button variant="outline" size="sm" block iconRight={<ArrowRight size={15} />} to="/profile/billing">Kelola Kuota &amp; Tagihan</Button>`.
   - Tombol Beli Credits: `<Button variant="primary" size="sm" to="/pricing">+ Beli Credits</Button>`.
   - Hub Links: `<Button variant="outline" size="sm" block iconRight={<ArrowRight size={15} />} to="/profile/skin">` dan `to="/privacy-center"`.
   - Mengganti seluruh badge identitas, tipe kulit, dan UU PDP dengan `<Badge>`.
14. **Refaktorisasi di `PrivacyCenterPage.tsx`**:
   - Ekspor Data Portability: `<Button variant="outline" size="sm" iconLeft={<Download size={15} />} onClick={handleExportData}>Unduh Data Profil (JSON)</Button>`.
   - Hapus Scan Wajah Saja: `<Button variant="outline" size="sm" iconLeft={<Trash2 size={15} />} loading={isDeletingScans} onClick={handleDeleteFaceScans}>Hapus Rekam Jejak Scan Wajah Saja</Button>`.
   - Baca Kebijakan Privasi: `<Button variant="outline" size="sm" iconLeft={<Eye size={15} />} to="/privacy">Baca Kebijakan Privasi Lengkap</Button>`.
   - Danger Zone: `<Button variant="danger" size="sm" iconLeft={<Trash2 size={15} />}>Hapus Akun Saya Secara Permanen</Button>`.
   - Modal Konfirmasi Ganda: Tombol Batalkan (`outline`) & Konfirmasi Hapus Akun (`danger` dengan `loading` dan disabled state).
15. **Refaktorisasi di `CoinHistoryPage.tsx`**:
   - Header Banner Saldo Credits: `<Button variant="outline" size="sm" to="/missions">+ Dapatkan Credits</Button>`.
   - Empty State CTA: `<Button variant="primary" size="sm" to="/missions" className="cluv-mt-4">Selesaikan Misi</Button>`.
16. **Refaktorisasi di `CheckoutPage.tsx`**:
   - Pilihan Channel: `<Badge variant="teal | slate | gold" size="sm">{ch.iconLabel}</Badge>`.
   - Submit Form Checkout: `<Button variant="primary" size="md" block loading={isSubmitting} iconRight={<ChevronRight size={16} />} onClick={handleProceedToPayment}>`.
   - Empty State Not Found: `<Button variant="secondary" size="md" to="/transactions">Lihat Riwayat Transaksi</Button>`.
   - Status Tagihan Invoice: `<Badge variant="teal | rose | gold" size="sm">` (LUNAS, KADALUARSA, BELUM DIBAYAR).
   - Salin Kode Pembayaran / VA: `<Button variant="outline" size="sm" iconLeft={...} onClick={copyToClipboard}>`.
   - Cek Status Pembayaran (Manual Poll): `<Button variant="primary" size="md" block loading={isCheckingStatus} disabled={isPaid} ...>`.
   - Buka Panduan Tripay: `<Button variant="secondary" size="md" block href={invoice.checkout_url} target="_blank" rel="noreferrer" iconRight={<ExternalLink size={16} />}>`.
17. **Refaktorisasi di `FaceScanPage.tsx`**:
   - Header Bar: `<Button variant="outline" size="sm" iconLeft={<History size={16} />} to="/scan-history">Riwayat Scan Kulit</Button>`.
   - Ganti Foto Dropzone: `<Button variant="outline" size="sm" iconLeft={<X size={14} />} onClick={handleClearImage}>Ganti Foto</Button>`.
   - Alert Saldo Kurang: `<Button variant="outline" size="sm" to="/missions">Misi Gratis</Button>` & `<Button variant="primary" size="sm" to="/pricing">Upgrade</Button>`.
   - CTA Mulai Scan: `<Button variant="primary" size="md" block iconLeft={<Sparkles size={18} />} onClick={handleStartFlow} disabled={!imageBase64}>`.
   - Sidebar Profile & Guidelines: Menggunakan `<Badge variant="teal | slate | gold" size="sm">`.
   - RFC 011 Cache Hit Banner: `<Badge variant="teal | slate" size="sm">`, `<Button variant="outline" size="sm">` (Scan Foto Baru & Analisis Ulang).
   - Hero Actives Action Buttons:
     - Marketplace: `<Button variant="outline" size="sm" className="cluv-flex-1" href={...} target="_blank" iconLeft={<ShoppingBag size={13} />}>`.
     - Konsultasi Formula: `<Button variant="primary" size="sm" className="cluv-flex-1" to={...} iconLeft={<MessageSquare size={13} />}>`.
   - Bottom Action Row:
     - Scan Wajah Ulang: `<Button variant="outline" size="md" className="cluv-flex-1" iconLeft={<RotateCcw size={16} />} onClick={handleResetFlow}>`.
     - Buka SkinSistant AI: `<Button variant="primary" size="md" className="cluv-flex-2" iconLeft={<MessageSquare size={16} />} to={...}>`.
18. **Refaktorisasi di `IngredientScanPage.tsx`**:
   - Ganti/Hapus Foto Dropzone: `<Button variant="outline" size="sm" iconLeft={<X size={14} />} onClick={handleClearImage}>Ganti / Hapus Foto</Button>`.
   - Alert Saldo Habis: `<Button variant="outline" size="sm" to="/missions">Misi Gratis</Button>` & `<Button variant="primary" size="sm" to="/pricing">Upgrade</Button>`.
   - Tombol Utama Mulai Pindai: `<Button variant="primary" size="md" block loading={isAnalyzing} disabled={isAnalyzing || !imageBase64} iconLeft={<FlaskConical size={18} />} onClick={handleStartAnalysis}>`.
   - OCR Quick-Correction:
     - Toggle Edit Teks: `<Button variant="outline" size="sm" iconLeft={<Edit3 size={13} />} onClick={...}>`.
     - Hitung Ulang: `<Button variant="primary" size="sm" loading={isAnalyzing} disabled={isAnalyzing || !editableText.trim()} iconLeft={<RefreshCw size={14} />} onClick={handleReanalyzeWithText}>`.
   - Group Button Toggle Mode Tampilan (Chips vs Cards): `<div className="cluv-btn-group"><Button variant={viewMode === 'chips' ? 'primary' : 'ghost'} ...>` dan `<Button variant={viewMode === 'cards' ? 'primary' : 'ghost'} ...>`.
   - Bottom Action Row:
     - Scan Produk Lain: `<Button variant="outline" size="md" className="cluv-flex-1" iconLeft={<RotateCcw size={16} />} onClick={handleResetFlow}>`.
     - Konsultasikan ke Skinsistant: `<Button variant="primary" size="md" className="cluv-flex-2" iconLeft={<Sparkles size={16} />} to={...}>`.
   - Right Aside Context Badges: `<Badge variant="teal | slate" size="sm">`.
19. **Refaktorisasi di `PricingPage.tsx` (Publik `/paket`)**:
   - Header Badge: `<Badge variant="teal" icon={<Sparkles size={14} />}>Pilihan Paket Sahabat</Badge>`.
   - Tier Promo Badges: `<Badge variant={isTierPro ? 'gold' : isTierGlow ? 'teal' : 'slate'} icon={...}>`.
   - Slot Diskon / Tag Harga: Menggunakan `<Badge variant="gold" size="sm">` dan `<Badge variant="slate" size="sm">`.
   - Tombol Aksi Tier Card:
     - Paket Free: `<Button variant="secondary" size="md" block disabled={user ? true : false} iconRight={!user ? <ArrowRight size={14} /> : undefined} ...>`.
     - Paket GLOW: `<Button variant="secondary" size="md" block disabled={user && isPro} iconRight={<ArrowRight size={14} />} onClick={() => handleSelectPlan('glow')}>`.
     - Paket PRO: `<Button variant="primary" size="md" block iconLeft={<Crown size={15} />} iconRight={<ArrowRight size={14} />} onClick={() => handleSelectPlan('pro')}>`.
20. **Rombak Total Halaman Paket App (`AppPricingPage.tsx`) — Zen & Focused Minimalist Standard**:
   - **Eliminasi Total "Box Fatigue" & Clutter**: Merespons feedback pengguna mengenai layout lama yang terasa penuh, sesak, dan banyak kotak di dalam kotak (*card overdose*). Seluruh bento edukasi bertingkat, 3 kartu reassurance berlebih, dan 4-accordion FAQ dieliminasi demi ruang bernapas (*negative space*) yang lega.
   - **Compact 1-Line Status Bar**: Mengganti banner besar dengan 1 baris ramping `.cluv-card.is-compact` (16px) yang memuat status langganan aktif pengguna (contoh: `Skincluv PRO Aktif • Berakhir 26 Okt 2026 (4 hari tersisa)`) serta tombol shortcut cepat `Riwayat Tagihan` dan `Kelola di Billing →`.
   - **2-Bento Card Head-to-Head (GLOW vs PRO)**:
     - Mengeliminasi kartu Free yang tidak relevan bagi user login.
     - **Kartu Kiri (GLOW - Rp 25.000 / 30 Hari)**: Smart Starter untuk cek berkala (~Rp 830/hari), 100 Kuota Universal AI.
     - **Kartu Kanan (PRO - Rp 49.000 / 30 Hari)**: Elevated flagship dengan golden badge `👑 Paling Diminati (85% Sahabat)`, 500 Kuota Universal AI (5x lipat), dan akses Skinsistant AI tanpa batas.
     - **Contextual CTA Buttons**: Tombol cerdas mendeteksi status pengguna (`Perpanjang PRO`, `Upgrade ke PRO`, atau `Pilih PRO`).
     - **Bullet Poin Singkat & Tajam**: 5-6 poin esensial per kartu tanpa paragraf panjang yang melelahkan mata.
   - **Zen Footer Strip**: 1 baris footer ramping dan bersih: `🛡️ 100% Prabayar 30 Hari • Tanpa auto-debit • Pembayaran resmi via Tripay (QRIS & VA)` dengan tautan ke FAQ.
   - **Single Viewport Fit**: Halaman langsung pas dalam satu layar 1080p tanpa scroll fatigue.
   - **Zero Inline Styles**: Menambahkan modifier `.cluv-card.is-tint-teal` dan `.cluv-card.is-tint-gold` di `cards.css`.
21. **Cheatsheet & Snippet Quick-Lookup**:
   - Memperbarui Section 11 B di `CLUV_FRAMEWORK_CHEATSHEET.md` dengan contoh prop lengkap `<Button />`.
22. **Kontrak Isolasi Responsif: Generic Dual-Safe vs Modifier Eksklusif (Anti-Regresi Desktop & Mobile)**:
   - **Scope**: `src/styles/cluv/components/buttons.css`, `src/styles/cluv/utilities.css`, `src/pages/app/AppPricingPage.tsx`, `AGENTS.md` (Section 5.15), `.agents/skills/skincluv-frontend/SKILL.md` (Section 2.E), `CLUV_FRAMEWORK_CHEATSHEET.md`.
   - **Akar Masalah yang Diselesaikan**:
     1. Teks tombol memecah menjadi 2 baris cacat di mobile karena paksaan `white-space: normal` pada `@media (max-width: 640px)`.
     2. Tombol kanan di baris status terhimpit horizontal di mobile (`cluv-flex-row`) dan terpotong tanpa tata letak yang sengaja.
     3. Titik pemisah inline (`•`) menggantung sendirian di baris pertama pada layar sempit.
   - **Solusi Arsitektural**:
     1. **Generic Dual-Safe**: `.cluv-btn` dikembalikan ke `white-space: nowrap;` di semua breakpoint. Hanya tombol dengan modifier `.is-multiline` yang diizinkan wrap.
     2. **Modifier Eksklusif**: Menambahkan `.cluv-flex-responsive` (Desktop Row space-between -> Mobile Column stretch), `.cluv-w-full-mobile`, `.cluv-flex-1-mobile` (bagi rata 50/50), dan utilitas visibilitas `.cluv-hide-desktop` / `.cluv-hide-mobile`.
     3. **Implementasi Nyata di `AppPricingPage.tsx`**: Status bar di desktop tetap 1 baris ramping elegan, di mobile bermutasi menjadi kartu vertikal dengan judul + subtitle bersih dan 2 tombol aksi 50/50 berteks utuh tanpa horizontal overflow.
   - **Catatan & Janji Pengingat (Pending Milestone)**:
     - *REMINDER*: Sesuai permintaan pengguna, seluruh kontrak styling & arsitektur responsif ini akan dihimpun menjadi **Satu Kontrak Keseluruhan Frontend Skincluv (Master Frontend Contract)** setelah seluruh halaman backlog tuntas disempurnakan.

23. **Rombak Total Pusat Bantuan App (`AppFaqPage.tsx`) — Smart In-App Knowledge Hub**:
   - **Scope**: `src/pages/app/AppFaqPage.tsx` (`/faq` di dalam App Shell).
   - **Akar Masalah yang Diselesaikan**:
     1. Tampilan lama terasa monoton, melelahkan (*claustrophobic*), dan hanya berupa deretan akordeon abu-abu vertikal tanpa hirarki jelas.
     2. Tidak ada pembeda antara pertanyaan paling sering dicari (*Top FAQs*) dengan pertanyaan umum/khusus.
     3. Pencarian pasif tanpa tombol hapus cepat, tanpa chip pencarian 1-tap, dan tanpa jembatan otomatis ke chatbot AI saat kata kunci tidak ditemukan.
   - **Arsitektur Baru (4 Zona Cerdas)**:
     1. **Zona Hero Search & Quick Topic Chips**: Search bar interaktif dengan tombol clear `(X)`, dilengkapi 5 tombol chip 1-tap (`⚡ Bebas Auto-Debit`, `👑 Beda GLOW vs PRO`, `📸 Kenapa Foto Ditolak?`, `🛡️ Privasi Foto & UU PDP`, `🪙 AI Credits Gratis`). Mengetik pencarian otomatis membuka akordeon hasil terkait (*auto-expand*).
     2. **Zona Top FAQ (4 Kartu Bento Interaktif 2x2 Grid)**: Mengangkat 4 isu terpopuler langsung ke kartu bento bagian atas lengkap dengan ikon tematik, ringkasan 1-kalimat to-the-point, dan tombol baca rincian. Pengguna mendapatkan jawaban cepat tanpa harus scroll.
     3. **Zona Kategori Tematik (Tab Bar Segmen)**: Penyekatan 4 kategori inti: *Paket & Tagihan (5)*, *AI & Analisis Kulit (4)*, *Privasi & UU PDP (3)*, dan *Credits & Misi (3)*.
     4. **Jembatan Cerdas ke Skinsistant AI & CS**: Saat pencarian kosong, otomatis menyajikan kartu penenang dengan tombol 1-tap `<Button to={`/chatbot?initial=...`}>` yang langsung membuka konsultasi AI dengan pertanyaan terisi, plus opsi email ke tim CS.
   - **Standar Frontend**: 100% Cluv Framework (`<Button>`, `<Badge>`, `.cluv-card`, `.cluv-chip`, `.cluv-accordion`, `.cluv-flex-responsive`), zero inline styles, patuh Invarian 13 (No overclaim), 18 (Prepaid pricing), dan 19 (Non-therapeutic).

### 📌 4. Halaman Ditandai untuk Perbaikan Penuh (Backlog Full Redesign)
Sesuai instruksi pengguna, halaman berikut ditandai untuk penyesuaian arsitektur visual & layout secara penuh pada sesi tersendiri:
1. **`ScanHistoryPage.tsx` (`/scan-history`)**: Penyesuaian arsitektur tab, visualisasi riwayat observasi wajah, cards histori ingredients, filter kronologis, dan empty state interaktif.












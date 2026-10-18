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

### 🧪 7. Verifikasi Kualitas
- `npx tsc -b`: **0 error**
- `npm run build`: Berhasil tanpa warning dalam **3.10 detik**


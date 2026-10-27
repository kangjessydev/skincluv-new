# Laporan Pembangunan: Halaman Unduh Android APK & Integrasi Navigasi Global

- **Tanggal**: 2026-10-27
- **Peran**: `/role-frontend`
- **Topik**: Rilis Halaman Khusus `/download`, Tombol Hero & Footer Landing Page, serta Banner Android Dashboard
- **Status Handoff**: `003-asisten-to-frontend-download-page.md` (completed)

---

## 1. Rangkuman Pekerjaan

Menindaklanjuti ketersediaan rilis APK resmi di Supabase Storage (`https://vxyyediuoyxbozbizswi.supabase.co/storage/v1/object/public/app-releases/skincluv.apk`), antarmuka pengguna kini telah dilengkapi dengan pusat unduhan dan navigasi menyeluruh:

1. **Halaman Khusus `/download` (`src/pages/public/DownloadPage.tsx`)**:
   - Hero banner dengan kartu unduh langsung file APK resmi (`skincluv.apk`, 24.3 MB).
   - Panduan visual 3 langkah instalasi file APK manual di Android (Unduh -> Beri Izin Sumber Ini -> Install & Login).
   - Matriks 4 keunggulan versi aplikasi Android (kamera instan tanpa lag, hemat kuota data, layar penuh tanpa browser chrome, standar privasi UU PDP).
   - Akordeon interaktif Pertanyaan Umum (FAQ) seputar keamanan dan pembaruan APK.
2. **Pembaruan Landing Page (`src/pages/LandingPage.tsx`)**:
   - Menambahkan tombol sekunder *"Unduh Aplikasi Android"* di Hero Section utama.
   - Menambahkan tombol unduh di bagian penutup Final CTA.
3. **Pembaruan Navigasi Publik (`src/components/layout/PublicLayout.tsx`)**:
   - Menambahkan link *"Unduh Aplikasi"* pada navigasi desktop.
   - Menambahkan link pada laci menu mobile (*mobile drawer*).
   - Menambahkan link pada kolom *"Jelajahi Cerita"* di Footer.
4. **Pembaruan Dashboard Pengguna (`src/pages/app/DashboardPage.tsx`)**:
   - Menambahkan alert banner ramah: *"Aplikasi Android Skincluv Sudah Tersedia"* dengan tombol *"Unduh APK"*.
   - Dilengkapi kontrol *dismiss* tersimpan di `localStorage` agar tidak mengganggu pengguna yang sudah menutup banner.

---

## 2. Kepatuhan Standar Desain & Invarian

- [x] **Cluv Micro-Framework**: 100% menggunakan token CSS `var(--cluv-*)` dan kelas kanonikal `.cluv-*`. Zero hardcoded hex colors.
- [x] **A11y & Anti-AI-Slop**: Tombol FAQ menggunakan semantic `<button>` dengan atribut `aria-expanded`, link unduh menggunakan `<a>` dengan atribut `download`.
- [x] **Tabular Nums**: Ukuran file `24.3 MB` menggunakan kelas `.cluv-tabular-nums` agar tidak ada layout shift.
- [x] **Verifikasi Build**:
  - `oxlint`: 0 warnings, 0 errors (49ms, 98 files).
  - `tsc -b && vite build`: Lolos 100% (3.07s).
  - `npx cap sync android`: Berhasil menyinkronkan build ke native Android assets (0.227s).

# Handoff: 003-asisten-to-frontend-download-page

- **Dari Peran**: `/role-asisten`
- **Ke Peran**: `/role-frontend`
- **Tanggal**: 2026-10-27
- **Status**: open
- **Tujuan**: Membangun Halaman Khusus Unduh APK Android (`/download`) dan menghubungkan tombol unduh di Landing Page serta Dashboard Pengguna.

---

## 1. Konteks & Latar Belakang
APK Android Skincluv (`app-debug.apk`) telah berhasil di-compile melalui Cloud CI/CD. Bucket Supabase Storage publik (`app-releases`) telah dibuat via Migration 086. URL rilis publik adalah:
`https://vxyyediuoyxbozbizswi.supabase.co/storage/v1/object/public/app-releases/skincluv.apk`

---

## 2. Cakupan Pekerjaan (In Scope)
1. **Buat Halaman Baru `src/pages/public/DownloadPage.tsx`**:
   - Daftarkan route `/download` dan alias `/unduh` di `src/App.tsx`.
   - Menggunakan Layout Publik (`PublicLayout`).
   - Hero banner: Judul *"Skincluv untuk Android"*, badge *"Versi 1.0 (APK)"*, ukuran file *"24.3 MB"*, dan tombol aksi utama *"Unduh APK Langsung"*.
   - Panduan 3 Langkah Instalasi:
     1. Unduh APK dari tombol resmi.
     2. Buka file unduhan, izinkan *"Install from this source"* jika diminta oleh Android.
     3. Selesai & login ke akun Skincluv Anda.
   - Keunggulan versi Android: Akses kamera instan tanpa izin berulang di browser, integrasi hardware mulus, hemat kuota data.
2. **Perbarui `src/pages/LandingPage.tsx`**:
   - Tambahkan tombol sekunder *"Unduh Aplikasi Android"* di Hero section (mengarah ke `/download`).
   - Tambahkan tautan di Footer (`Unduh Android`).
3. **Perbarui `src/pages/app/DashboardPage.tsx`**:
   - Tambahkan banner notifikasi/card pengumuman bento di dashboard: *"Gunakan Aplikasi Android untuk pengalaman scan wajah lebih mulus. [Unduh Sekarang →]"*.

---

## 3. Di Luar Cakupan (Out of Scope)
- Mengubah alur otentikasi login/register.
- Mengubah skema database atau RPC dashboard.

---

## 4. Kriteria Selesai (Definition of Done)
- [ ] Halaman `/download` dapat diakses dan responsive di desktop maupun layar HP.
- [ ] Tombol unduh mengarah ke URL Supabase Storage APK resmi.
- [ ] Seluruh styling mematuhi Cluv Micro-Framework (`var(--cluv-*)` dan class `.cluv-*`).
- [ ] Lolos verifikasi build `tsc -b && vite build` dan linter `oxlint` dengan 0 warning.

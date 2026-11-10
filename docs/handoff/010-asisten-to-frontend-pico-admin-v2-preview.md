# Brief: Implementasi Preview Admin Dashboard V2 Berbasis Pico CSS

- **Untuk:** role-frontend   **Dari:** role-asisten   **Tanggal:** 2026-11-04
- **Disetujui user:** ya

## Tujuan
Membangun rute preview terisolasi `/v2/admin` untuk Admin Dashboard Overview menggunakan micro-framework Pico.css v2 yang minimalis, lega, otomatis responsif desktop & mobile, dan diselaraskan secara ketat dengan warna dan font Cluv tanpa menyentuh rute live `/admin`.

## Konteks
- User meminta pendekatan cepat dan minimalis untuk area admin agar tidak perlu memikirkan puluhan custom class CSS per halaman yang rawan regresi.
- Diputuskan menggunakan Opsi 1 (Pico.css v2) yang murni semantic CSS dan 100% kompatibel dengan React 19.
- **Batasan Ketat Keamanan Desain:** Scope styling Pico CSS WAJIB diisolasi secara ketat ke dalam pembungkus rute admin V2 (misal `.pico-admin-scope`) sehingga CSS global Skincluv untuk aplikasi (`/dashboard`, dsb.) dan halaman publik (`/`, dsb.) tidak terpengaruh atau bocor.
- Rute `/admin` live TIDAK BOLEH diedit langsung; buat preview berdampingan di `/v2/admin`.

## Yang diminta
1. Install paket `@picocss/pico` atau buat stylesheet terisolasi `src/styles/admin-v2.css` yang me-load Pico v2 khusus di bawah namespace class `.pico-admin-scope`.
2. Map variabel warna & tipografi Pico ke Cluv design tokens:
   - `--pico-primary: var(--cluv-teal, #1f9d97)`
   - `--pico-primary-hover: var(--cluv-teal-dark, #127a75)`
   - `--pico-font-family: var(--cluv-font-app, 'Nunito', sans-serif)`
3. Buat layout baru `src/components/admin/v2/AdminLayoutV2.tsx` dengan sidebar navigasi bersih dan responsif.
4. Buat halaman `src/pages/admin/v2/AdminDashboardV2Page.tsx` yang merefleksikan seluruh modul di dashboard overview saat ini:
   - Bisnis, Transaksi & Riset Pasar
   - Pengguna & CRM
   - Otak & Pengetahuan AI
   - Konfigurasi Sistem
   - Observabilitas, Audit & Keamanan
5. Daftarkan rute `/v2/admin` di `src/App.tsx` di dalam blok `AdminRoute`.
6. Lakukan build verification `npm run build` untuk memastikan nol error kompilasi.

## Di luar cakupan
- Dilarang mengubah kode di rute live `/admin` (termasuk `AdminDashboardPage.tsx` dan `AdminLayout.tsx`).
- Dilarang mengubah halaman publik atau halaman aplikasi pengguna (`src/pages/app/`).
- Dilarang memodifikasi backend SQL, migration, atau skema database.

## Kriteria selesai
1. Halaman preview dapat diakses di `/v2/admin` oleh user dengan role admin.
2. Tampilan di desktop dan mobile tertata rapi otomatis (card `<article>` lega, grid fleksibel, tipografi nyaman dibaca).
3. Warna aksen selaras dengan brand Cluv (Teal `#1f9d97`).
4. Build `npm run build` berhasil dengan exit code 0 tanpa error TypeScript atau CSS.

## Pertanyaan terbuka
- Tidak ada. User telah memberikan instruksi eksplisit untuk memulai dari Overview di `/v2/admin`.

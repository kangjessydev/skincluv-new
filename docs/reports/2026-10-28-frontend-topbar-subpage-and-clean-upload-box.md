# Laporan: Standardisasi Topbar Subhalaman & Penyederhanaan Media Upload

- **Peran**: `/role-frontend`
- **Tanggal**: 2026-10-28
- **Status**: Selesai Terverifikasi
- **Tujuan**: Menerapkan arahan user untuk: (1) Topbar dinamis mobile (Back button + Judul + Icon Riwayat di subhalaman), (2) Menyembunyikan dua badge, (3) Merapikan layout bento mobile agar simetris & konsisten di semua ukuran HP, dan (4) Mengganti tumpukan 3 tombol balok dengan satu kotak Media Upload bersih ber-background dropzone desktop dengan tombol panduan foto bulat di pojok kanan atas.

---

## 1. Rincian Perubahan Implementasi

### A. Topbar Subhalaman Mobile (`src/components/layout/AppLayout.tsx` & `src/styles/cluv/app/shell.css`)
- **Kondisi Beranda (`/dashboard`)**: Tetap menampilkan logo brand `skincluv.` di kiri dan icon lonceng notifikasi di kanan.
- **Kondisi Subhalaman (di luar `/dashboard`)**:
  - **Sisi Kiri**: Tombol Back native `<ArrowLeft size={19} />` yang mengeksekusi `navigate(-1)` (riwayat mundur riil, bukan URL statis).
  - **Tengah / Judul**: Menggantikan logo brand dengan judul halaman dinamis (`getPageContextTitle(pathname)`).
  - **Sisi Kanan**: Icon lonceng digantikan dengan tombol icon Riwayat `<History size={18} />` (hanya icon saja, tanpa teks).

### B. Penyederhanaan Area Upload Wajah (`src/pages/app/FaceScanPage.tsx`)
- **Dua Badge Dihilangkan**: Menghapus baris badge `Tipe: COMBINATION` dan concern yang sebelumnya menjepit layar.
- **Header Raksasa Dihilangkan di Mobile**: Karena judul halaman dan akses riwayat sudah berada di Topbar, `<header>` halaman disembunyikan di mobile (`cluv-hide-mobile`), memberi ruang pandang lapang langsung ke kartu aksi.
- **Hapus Tombol 'Buka Kamera' & Satukan ke Media Upload Box**:
  - Tiga tombol balok yang sesak digantikan oleh satu kotak upload media (`.cluv-dropzone`) dengan background lembut (`#f8fafc`), border putus-putus rapi, dan icon galeri/upload.
  - Saat diketuk di smartphone, browser secara native membuka pilihan OS: Ambil Foto Selfie (Kamera) atau Pilih dari Galeri.
- **Icon Panduan Foto di Pojok Kanan Atas**:
  - Tombol panduan diposisikan di pojok kanan atas bagian dalam kotak media (`.cluv-dropzone-guide-btn`) dengan ukuran sentuh bulat 38px x 38px dan icon `<Info size={19} />`, sangat mudah diklik tanpa memakan tempat.
- **Tombol Aksi Utama**:
  - Tombol *"Mulai Analisis Wajah AI (5 Credits)"* berada rapi di bawah kotak media.
  - Ketika foto sudah dipilih/diunggah, kotak menampilkan preview gambar beserta tombol *Ganti Foto* dan *Hapus*.

### C. Konsistensi Layout Bento Mobile (`src/styles/cluv/components/cards.css`)
- `.cluv-dropzone` dan `.cluv-card` disesuaikan padding-nya pada layar ponsel (`@media (max-width: 640px) { padding: 24px 14px; }`), memastikan kartu berada di tengah dengan margin kiri-kanan yang presisi dan simetris di seluruh resolusi layar ponsel.

---

## 2. Bukti Pengujian & Verifikasi

- **OxLint**: Lolos 0 warning & 0 error (`Finished in 148ms on 99 files with 104 rules`).
- **Build TypeScript & Vite**: Lolos sukses `✓ built in 3.64s`.
- **Capacitor Android Sync**: Selesai `[info] Sync finished in 0.576s`.

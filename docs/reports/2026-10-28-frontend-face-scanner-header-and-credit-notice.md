# Laporan Kerja Frontend: Refactoring Header Face Scanner & Notice Box Kredit

**Tanggal:** 2026-10-28  
**Peran:** role-frontend  
**Topik:** Refactor Header Luar Bento, Tombol "Analisa Sekarang", dan Notice Box Kredit Mikro  

---

## 1. Masukan & Kebutuhan Pengguna
- **Permintaan 1:** Mengeluarkan teks "Ambil atau Unggah Foto Wajah" dari dalam bento kartu menjadi header luar di atas bento:
  - Judul: `Face Scanner 📸✨`
  - Deskripsi: `Ketahui kondisi kulitmu & cari cara perawatannya ✨💆‍♀️`
- **Permintaan 2:** Mengubah teks tombol submit utama menjadi `Analisa Sekarang`.
- **Permintaan 3:** Memindahkan keterangan harga kredit dari tombol ke notice box mikro di bawah tombol. Menghilangkan teks paragraf panjang berukuran besar menjadi notice box kecil yang proporsional berlatar warna soft (`.cluv-alert.is-info.is-compact`).
- **Permintaan 4:** Sinkronisasi judul halaman mobile di Topbar menjadi `Face Scanner`.

---

## 2. Perubahan Berkas

### A. `src/pages/app/FaceScanPage.tsx`
- **Header:** Mengganti `<header ... cluv-hide-mobile>` lama dengan header universal baru di luar kartu bento:
  - Judul: `Face Scanner 📸✨`
  - Deskripsi: `Ketahui kondisi kulitmu & cari cara perawatannya ✨💆‍♀️`
- **Bento Card:** Menghapus wrapper `<div><h2 className="cluv-title-card">Ambil atau Unggah Foto Wajah</h2>...</div>` dari dalam `.cluv-card`. Kartu kini langsung berfokus pada area unggah media (`.cluv-dropzone`) atau preview foto.
- **Tombol Submit:** Teks diubah menjadi `Analisa Sekarang` dengan icon `<Sparkles size={18} />`.
- **Notice Box Mikro:** Menggantikan tag `<p className="cluv-caption">` panjang dengan `.cluv-alert.is-info.is-compact` yang rapi:
  `Biaya {faceCost} Credits AI per analisis. Foto dianalisis secara privat & hasil observasi bersifat panduan edukasi mandiri 🔒`

### B. `src/components/layout/AppLayout.tsx`
- Memperbarui fungsi `getPageContextTitle` agar rute `/face-scan` mereturn `Face Scanner` secara konsisten pada Topbar mobile.

---

## 3. Bukti Pengujian & Verifikasi
- `npm run build`: Berhasil tanpa error (`✓ built in 2.72s`).
- `npx oxlint`: 0 warnings, 0 errors.
- `npx cap sync android`: Berhasil disinkronkan ke aset aplikasi mobile (`Sync finished in 0.372s`).

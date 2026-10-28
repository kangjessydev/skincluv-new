# Laporan Frontend: Overhaul FaceScanPage ke Standar Bento Grid Human Scale & Mobile-First

- **Tanggal**: 2026-10-28
- **Peran**: `/role-frontend`
- **Topik**: Transformasi Desain Halaman Scan Wajah (`FaceScanPage.tsx`) dengan Doktrin Cluv Micro-Framework
- **Handoff Terkait**: `docs/handoff/004-asisten-to-frontend-facescan-bento-overhaul.md` (Status: Completed)

---

## 1. Ringkasan Eksekusi

Menindaklanjuti mandat konsensus paritas data dan evaluasi pengguna mengenai tampilan halaman selain Dashboard yang kurang nyaman di perangkat mobile, tim frontend telah menyelesaikan perombakan menyeluruh pada `src/pages/app/FaceScanPage.tsx`.

Hasil pemindaian wajah kini disajikan dalam format **Bento Grid Human Scale** yang modular, ergonomis untuk jempol di layar sentuh ponsel (touch target minimal 44×44px), serta elegan di layar desktop ultrawide.

---

## 2. Rincian Perubahan Antarmuka

### A. Stage 1: Shutter Kamera & Pemilihan Foto Ramah Jempol
- **Dual-Action Shutter Buttons**: Menyediakan tombol utama ukuran besar `Buka Kamera` (`accept="image/*" capture="user"`) dan `Galeri Foto` yang langsung membuka dialog kamera/galeri native di Android APK maupun browser mobile.
- **Desktop Drag & Drop Tetap Aktif**: Dropzone desktop tetap dipertahankan dengan tampilan minimalis terpadu.
- **Preview Bersih**: Saat foto dipilih, foto ditampilkan proporsional dengan rasio wajah yang bersih, disertai tombol cepat `Ganti Foto` dan `Hapus`.
- **Informasi Kuota Transparan**: Banner peringatan kuota credits terintegrasi dengan tombol jalan pintas ke Misi Harian dan Upgrade Paket.

### B. Stage 2: HUD Pemindaian AI yang Responsif
- Mempertahankan animasi laser scanning HUD, status biometrik real-time, dan rotasi tips dermatologi klinis tanpa risiko overflow horizontal di layar 360px.

### C. Stage 3: Arsitektur Bento Modular (100% Paritas Data Terjamin)
Semua 14 titik data klinis dari backend dijamin tetap hadir utuh:
1. **Bento Card 1 (Hero Metric & Ringkasan Wajah - Split 60:40)**:
   - Skor lingkaran visual (`.cluv-score-circle`) 1–100 dengan indikator warna status klinis (Optimal, Perhatian Ringan, Perlu Perhatian, Konsultasi Spesialis).
   - Thumbnail foto wajah teranalisis dengan badge terverifikasi.
   - Badge tipe kulit dan pills masalah kulit (`skin_concerns`).
   - Judul kondisi kulit (`skin_status_title`) dan narasi Gen Z Pro (`analysis_notes`).
2. **Bento Card 2 (Interactive 3-Zone Deep-Dive - Segmented Controller)**:
   - Mengubah 3 tumpukan kartu vertikal yang panjang menjadi **Segmented Chips Control** (`.cluv-chip`):
     - Chip Dahi (Forehead) + skor & status
     - Chip Hidung & Pipi (T-Zone & Cheeks) + skor & status
     - Chip Dagu & Sekitar Mulut (Chin & Perioral) + skor & status
   - Mengeliminasi kelelahan scrolling di ponsel. Pengguna cukup mengetuk chip untuk langsung membaca:
     - 🔬 **Hasil Observasi**: `area.finding`
     - 💡 **Penjelasan Sederhana**: `area.analogy` (Gold Box)
     - ⚡ **Rencana Tindakan**: `area.action_plan` (Green/Teal Action Box)
3. **Bento Card 3 (Hero Actives & Formulasi Kosmetik)**:
   - Menampilkan grid bahan aktif (`recommended_ingredients`) dengan badge prioritas (`essential` vs `recommended`), tujuan fungsi kosmetik, tautan pencarian Marketplace Shopee, dan tombol konsultasi cara pakai ke AI Chatbot.
4. **Bento Card 4 (Panduan Kebiasaan Personal Harian)**:
   - Filter chips interaktif (Semua, Rutin Lakukan, Kurangi, Hindari) yang mengelompokkan `tips_do`, `tips_reduce`, dan `tips_avoid`.
5. **Sticky / Bottom Action Bar**:
   - Tombol utama ramah jempol: `Konsultasikan Rutinitas ke Skinsistant AI` (terkoneksi langsung dengan parameter query `scan_id`) dan `Scan Foto Baru`.

---

## 3. Bukti Verifikasi Mutu & Kepatuhan Standar

| Item Pengujian | Standar | Hasil |
| :--- | :--- | :--- |
| **Linting** | `npx oxlint` | ✅ **0 Warning, 0 Error** |
| **Type Check & Bundle** | `npm run build` (`tsc -b && vite build`) | ✅ **Berhasil (3.55s), 0 Error** |
| **Android Capacitor Sync** | `npx cap sync android` | ✅ **Berhasil (0.366s), aset web tersalin ke APK** |
| **Pewarnaan** | Cluv CSS Variables (`var(--cluv-*)`) | ✅ **100% mematuhi aturan zero hardcoded colors** |
| **Paritas Data** | Audit 14 data points backend | ✅ **100% data hadir utuh** |

---

## 4. Rekomendasi Langkah Berikutnya

1. Mengajukan hasil perombakan `FaceScanPage.tsx` kepada pengguna untuk peninjauan langsung di browser / Android APK.
2. Melanjutkan ke Fase 1.2: Perombakan `src/pages/app/IngredientScanPage.tsx` dengan DNA Bento Grid dan ergonomi mobile yang serupa.

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

### C. Stage 3: Tata Letak Editorial Anti-Slop (100% Paritas Data Terjamin)
Semua 14 titik data klinis dari backend tetap hadir utuh dengan pendekatan editorial mewah dan tenang (bebas card soup & icon clutter):
1. **Hero Observation Section (SVG Score Ring Kanonikal)**:
   - Menggunakan komponen resmi **`.cluv-score-ring` SVG** (sama persis dengan Dashboard dan Modal Riwayat).
   - Tipe kulit dan status klinis disajikan dalam badge halus (`optimal`, `attention`, `alert`).
   - Narasi observasi Gen Z Pro disajikan dengan tipografi nyaman dibaca (`.cluv-body` 15px, line-height 1.65), bukan teks kerdil semut.
   - Thumbnail foto wajah terverifikasi disematkan proporsional.
2. **Evaluasi 3 Zona Wajah Interaktif (Segmented Chips Control)**:
   - Chip Dahi (Forehead), Hidung & Pipi (T-Zone), dan Dagu & Mulut (Chin) dengan skor tertera di chip.
   - Menggantikan tumpukan kartu bertingkat dengan box observasi bersih:
     - 🔬 **Hasil Observasi**: `area.finding`
     - 💡 **Penjelasan Sederhana**: `area.analogy` (Kotak Emas Halus)
     - ⚡ **Rencana Tindakan**: `area.action_plan` (Kotak Aksi Hijau Halus)
3. **Hero Actives & Formulasi Kosmetik**:
   - Grid bahan aktif dengan badge prioritas (`essential` vs `recommended`), fungsi kosmetik, tautan Shopee, dan tombol tanya cara pakai ke AI Chatbot.
4. **Panduan Kebiasaan Personal Harian (Do, Reduce, Avoid)**:
   - 3 kolom bersih (Rutin Lakukan, Kurangi, Hindari) dengan tipografi yang lapang.
5. **Sticky / Bottom Action Bar**:
   - Tombol utama ramah jempol: `Konsultasikan Rutinitas ke Skinsistant AI` (terkoneksi langsung dengan `scan_id`) dan `Scan Foto Baru`.

---

## 3. Bukti Verifikasi Mutu & Kepatuhan Standar

| Item Pengujian | Standar | Hasil |
| :--- | :--- | :--- |
| **Linting** | `npx oxlint` | ✅ **0 Warning, 0 Error** |
| **Type Check & Bundle** | `npm run build` (`tsc -b && vite build`) | ✅ **Berhasil (2.78s), 0 Error** |
| **Android Capacitor Sync** | `npx cap sync android` | ✅ **Berhasil (0.685s), aset web tersalin ke APK** |
| **Pewarnaan** | Cluv CSS Variables (`var(--cluv-*)`) | ✅ **100% mematuhi aturan zero hardcoded colors** |
| **Anti-Slop Compliance** | Vercel Guidelines & RFC 018 | ✅ **Zero card soup, SVG ring, body text 15px** |
| **Paritas Data** | Audit 14 data points backend | ✅ **100% data hadir utuh** |

---

## 4. Rekomendasi Langkah Berikutnya

1. Mengajukan hasil perombakan `FaceScanPage.tsx` kepada pengguna untuk peninjauan langsung di browser / Android APK.
2. Melanjutkan ke Fase 1.2: Perombakan `src/pages/app/IngredientScanPage.tsx` dengan DNA Bento Grid dan ergonomi mobile yang serupa.

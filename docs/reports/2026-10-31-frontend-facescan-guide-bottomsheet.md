# Laporan Implementasi: Redesign Bottom Sheet Panduan Scan Wajah & Profil Kulit Mobile

- **Tanggal**: 2026-10-31
- **Peran**: `role-frontend`
- **Topik**: Penyeragaman UI Bottom Sheet Panduan Kualitas Foto & Profil Kulit di Scan Wajah (`FaceScanPage.tsx`)

---

## 1. Ringkasan Tugas
Menyelaraskan tampilan Bottom Sheet tanda tanya (`?`) pada halaman Scan Wajah (`FaceScanPage.tsx`) agar 100% konsisten dengan desain kanonikal baru yang disepakati pada halaman Scan Komposisi:
1. **Kartu Profil Kulit Bento Paspor**:
   - Mengganti alert highlight lama dengan kartu Bento bernuansa kertas emas (`.cluv-bento-wallet`).
   - Menyusun 3 metadata profil (*Tipe Kulit, Pantangan, Target*) dalam format tabel 2 kolom presisi (`.cluv-passport-meta-grid`) tanpa ikon dan Title Case normal.
   - Menampilkan blok *Fokus Perhatian* membentang penuh 100% di bawah garis putus-putus (*dashed line*) dengan tipografi yang harmonis.
2. **Kartu 3 Panduan Kualitas Foto Terpadu**:
   - Mengganti 3 baris checklist lama dengan 1 Kartu Panduan Berpenomoran (*Numbered Guide List*):
     - Node 1 (Teal): *Cahaya Alami Merata* (bantu AI membaca pori, hindari backlight).
     - Node 2 (Gold): *Wajah Bersih Tanpa Riasan* (skin barrier & sebum alami terbaca objektif).
     - Node 3 (Rose): *Jarak Tegak Lurus ~30 cm* (dahi, pipi, hidung, dagu dalam lingkaran frame).
   - Tipografi: Judul poin tegas 14.5px (`font-weight: 700`), deskripsi proporsional 12.5px (`font-weight: 400`, text-muted).

---

## 2. Perubahan Kode & File

### `src/pages/app/FaceScanPage.tsx`
- Menambahkan import `User` dari `lucide-react` dan `useMemo` dari `react`.
- Menambahkan ekstraksi preferensi profil kulit pengguna:
  - `userSkinTypeLabel`: Format rapi tipe kulit (misal: *Kombinasi (Combination)*).
  - `userSensitivities`: Deteksi bahan alergen/pantangan (*Bebas Alkohol & Parfum*).
  - `userConcernsText`: Keluhan kulit aktif (*Pori besar, Minyak T-Zone, Skin Barrier*).
  - `userTargetFormula`: Target formula personal (*Non-Komedogenik & Barrier Balance*).
- Mengganti seluruh isi `<BottomSheet isOpen={showGuidelineSheet} ...>` dengan struktur Bento Paspor + 1 Kartu Panduan Berpenomoran.

---

## 3. Bukti Verifikasi & Uji Kompilasi

### Verifikasi Build Proyek
```bash
npm run build
```
**Hasil**:
```
✓ built in 2.95s
PWA v1.3.0
The command exited with code 0.
```
0 TypeScript error, 0 bundler error.

---

## 4. Checklist Kepatuhan Aturan & Standar
- [x] Zero hardcoded colors (semua token menggunakan `var(--cluv-*)`).
- [x] Paritas 100% konsisten dengan Bottom Sheet Scan Komposisi.
- [x] Format tabel 2 kolom presisi tanpa icon & tanpa huruf kapital semua.
- [x] Lolos verifikasi build `tsc -b && vite build`.
- [x] `CHANGELOG.md` diperbarui.

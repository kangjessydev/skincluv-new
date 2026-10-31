# Laporan Implementasi: Redesign Bottom Sheet Panduan Membaca Label & Profil Kulit Mobile (Iterasi 2)

- **Tanggal**: 2026-10-31
- **Peran**: `role-frontend`
- **Topik**: Penyempurnaan Hirarki Teks Panduan Membaca Label & Metadata Profil Kulit Paspor (`IngredientScanPage.tsx`)

---

## 1. Ringkasan Tugas & Feedback Pengguna
1. **Gambar 1 (3 Prinsip Membaca Label)**:
   - Memperbaiki hirarki teks yang terbalik: Judul poin kini jauh lebih tegas dan dominan (`0.90625rem` / 14.5px, bold 700), sementara deskripsi poin disesuaikan proporsional sebagai teks sekunder (`0.78125rem` / 12.5px, regular muted).
   - Menyelaraskan padding dan jarak agar konsisten (16px horizontal, 13px vertikal, 12px gap ke badge nomor), tidak terlalu mepet dan tidak terlalu renggang.
2. **Gambar 2 (Profil Kulit Terdaftar)**:
   - Menghapus badge statis `Tersinkronisasi ✓`.
   - Menghapus kolom `PENCOCOKAN AI / Aktif Otomatis ⚡`.
   - Menambahkan 2 preferensi kulit tersimpan (Pantangan Bahan & Target Formula) sebagai metadata yang proporsional di bawah headline tipe kulit.
   - Membentangkan blok `FOKUS PERHATIAN` secara penuh (100% width) di atas garis putus-putus (*dashed line*) sehingga keluhan kulit leluasa dan nyaman dibaca.

---

## 2. Perubahan Kode & File

### A. Styling Kanonikal: `src/styles/cluv/components/cards.css`
- **`.cluv-guide-item`, `.cluv-guide-title`, `.cluv-guide-desc`**:
  - `padding: 13px 16px`: Konsisten dengan padding header kartu (16px).
  - `.cluv-guide-title`: `font-size: 0.90625rem; font-weight: 700; color: var(--cluv-current-text);` (Lebih dominan).
  - `.cluv-guide-desc`: `font-size: 0.78125rem !important; color: var(--cluv-current-text-muted) !important;` (Proporsional).
- **`.cluv-passport-meta-row`, `.cluv-passport-meta-item`**:
  - Baris metadata preferensi berukuran proporsional (font-size 0.75rem, label uppercase 0.6875rem, ikon pendamping 13px).
- **`.cluv-bento-wallet-focus-block`, `.cluv-bento-wallet-focus-val`**:
  - Blok fokus perhatian full-width dengan border atas putus-putus (*dashed line*) dan teks teal tebal 0.875rem line-height 1.45.

### B. Halaman Scan Komposisi: `src/pages/app/IngredientScanPage.tsx`
- Menambahkan ekstraksi 2 preferensi kulit tersimpan: `userSensitivities` (Pantangan Alergen) dan `userTargetFormula` (Target Perawatan).
- Menyusun ulang BottomSheet:
  - Header kartu bento: Tag `Profil Kulit Terdaftar` tanpa badge.
  - Headline utama: Tipe kulit + `Skin Profile` + 2 metadata preferensi.
  - Bawah kartu: Blok fokus perhatian membentang penuh (100% width).
  - Kartu 3 prinsip: Header 16px padding + list item berhirarki jelas.

---

## 3. Bukti Verifikasi & Uji Kompilasi

### Verifikasi Build Proyek
```bash
npm run build
```
**Hasil**:
```
✓ built in 3.51s
PWA v1.3.0
The command exited with code 0.
```
0 TypeScript error, 0 bundler error.

---

## 4. Checklist Kepatuhan Aturan & Standar
- [x] Zero hardcoded colors (semua token menggunakan `var(--cluv-*)`).
- [x] Sesuai Doktrin Cluv Framework & Canonical Class Registry.
- [x] Hirarki visual mobile-first: Judul poin > Deskripsi poin.
- [x] Metadata profil kulit terdaftar proporsional dan tidak berlebihan.
- [x] Lolos verifikasi build `tsc -b && vite build`.
- [x] `CHANGELOG.md` diperbarui.

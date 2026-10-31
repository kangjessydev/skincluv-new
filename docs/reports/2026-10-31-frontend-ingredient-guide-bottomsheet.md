# Laporan Implementasi: Redesign Bottom Sheet Panduan Membaca Label & Profil Kulit Mobile

- **Tanggal**: 2026-10-31
- **Peran**: `role-frontend`
- **Topik**: Penataan Ulang UI Bottom Sheet Panduan Membaca Label (Ikon `?`) Halaman Scan Komposisi (`IngredientScanPage.tsx`)

---

## 1. Ringkasan Tugas
Menata ulang tampilan Bottom Sheet panduan membaca label di halaman Scan Komposisi (`src/pages/app/IngredientScanPage.tsx`):
1. **Mengganti kartu Profil Kulit Terdaftar yang kaku dan berisi paragraf padat** dengan kartu **Bento Paspor bernuansa kertas** (`.cluv-bento-wallet`) sesuai referensi desain Bento Wallet (border emas halus, radial paper glow, tag uppercase emas, garis pemisah putus-putus *dashed line*, dan 2 metrik ringkas).
2. **Mengganti 3 kotak prinsip terpisah (ala desktop diperkecil)** menjadi **1 kartu terpadu berpenomoran (*Numbered Guide List*)** yang hemat ruang, tidak memerlukan scroll berlebih, dan nyaman dibaca pada layar perangkat mobile.

---

## 2. Perubahan Kode & File

### A. Styling Kanonikal: `src/styles/cluv/components/cards.css`
- Menambahkan class kanonikal baru:
  - `.cluv-guide-item`: Flex container dengan border pemisah halus antar item (`border-bottom: 1px solid var(--cluv-border)`).
  - `.cluv-guide-num`: Lingkaran badge nomor 24x24px dengan varian warna kanonikal (`.is-teal`, `.is-gold`, `.is-rose`).
  - `.cluv-guide-content`, `.cluv-guide-title`, `.cluv-guide-desc`: Tipografi hirarki mobile yang jelas, ringkas, dan kontras.

### B. Halaman Scan Komposisi: `src/pages/app/IngredientScanPage.tsx`
- Mengganti isi `<BottomSheet isOpen={showGuideSheet} ...>`:
  - **Bento Paspor Profil Kulit**:
    - Tag atas: `<User size={12} />` `Profil Kulit Terdaftar` + `<Badge variant="teal">Tersinkronisasi ✓</Badge>`
    - Tipe Kulit sebagai headline utama: `{activeSkinProfile?.skin_type || 'Kombinasi'}` + `Skin Profile`
    - Metrik bawah: `FOKUS PERHATIAN` (`userConcerns`) & `PENCOCOKAN AI` (`Aktif Otomatis ⚡`)
  - **1 Kontainer Terpadu 3 Prinsip Membaca Label**:
    - Header subtle: Judul & keterangan singkat.
    - Node 1: Aturan 5 Bahan Teratas (70%–80% formula).
    - Node 2: Batas 1% Konsentrasi (urutan boleh acak).
    - Node 3: Indeks Komedogenik 0–5 (potensi penyumbatan pori).

---

## 3. Bukti Verifikasi & Uji Kompilasi

### Verifikasi Build Proyek
```bash
npm run build
```
**Hasil**:
```
✓ built in 3.64s
PWA v1.3.0
The command exited with code 0.
```
0 TypeScript error, 0 bundler error.

---

## 4. Checklist Kepatuhan Aturan & Standar
- [x] Zero hardcoded colors (semua token menggunakan `var(--cluv-*)`).
- [x] Sesuai Doktrin Cluv Framework & Canonical Class Registry.
- [x] Mobile-first: Tinggi bottom sheet berkurang ~40%, teks to-the-point dan mudah discan mata.
- [x] Lolos verifikasi build `tsc -b && vite build`.
- [x] `CHANGELOG.md` diperbarui.

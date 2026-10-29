# Laporan Kerja Frontend: Kunci Gaya & Penerapan Desain Mobile pada Ingredient Scanner

**Tanggal:** 2026-10-28  
**Peran:** role-frontend  
**Topik:** Penerapan Standar Desain Kanonikal Face Scanner ke Ingredient Scanner (Mobile Parity)

---

## 1. Kebutuhan Pengguna
- Mengunci gaya kanonikal mobile yang sudah disetujui di Face Scanner dan menerapkannya 100% pada **Ingredient Scanner**:
  1. Header universal di luar kartu bento: judul `Ingredient Scanner` dan deskripsi ringkas tanpa klise emoji.
  2. Dropzone tunggal rapi (`.cluv-dropzone`) dengan tombol panduan label `(i)` di sudut kanan atas dalam box.
  3. Tombol submit utama: `Analisa Sekarang` dengan icon `<Sparkles size={18} />`.
  4. Notice box kredit mikro di bawah tombol (`.cluv-alert.is-info.is-compact`).
  5. Pembersihan penomoran kaku pada card BottomSheet Panduan Label.
  6. Sinkronisasi nama context title di Topbar mobile menjadi `Ingredient Scanner`.

---

## 2. Berkas yang Diubah

### A. `src/pages/app/IngredientScanPage.tsx`
- **Pembersihan Import:** Menghapus import tak terpakai (`Upload`, `Camera`, `ImageIcon`), menambahkan `History`.
- **Header Baru Luar Bento:** Mengeluarkan header dari tumpukan konten bento ke atas:
  - Judul: `Ingredient Scanner`
  - Subtitle: `Ketahui keamanan komposisi & cari kecocokan bahan untuk kulitmu`
  - Tombol Riwayat Scan desktop (`<Button variant="outline" size="sm" ...>`).
- **Pembersihan Strip Mobile:** Menghilangkan badge horizontal dan chip manual di mobile yang sebelumnya membuat layout padat.
- **Dropzone Terpadu:** Menggantikan tombol kamera/galeri terpisah dengan dropzone tunggal bernuansa soft dengan tombol icon panduan `(i)` di sudut kanan atas.
- **Tombol Aksi & Notice Kredit:**
  - Tombol menjadi `Analisa Sekarang`.
  - Notice box mikro: `Biaya {ingredientCost} Credits AI per analisis. Foto dianalisis secara privat & hasil observasi bersifat panduan edukasi mandiri 🔒`.
- **BottomSheet Panduan Label:** Menghilangkan angka prefiks ("1.", "2.", "3.") pada judul kartu panduan agar konsisten humanis.

### B. `src/components/layout/AppLayout.tsx`
- Memperbarui rute `/ingredient-scan` pada `getPageContextTitle` menjadi `Ingredient Scanner` sehingga Topbar mobile konsisten dengan `Face Scanner`.

### C. `src/styles/cluv/components/cards.css`
- Menambahkan aturan `@media (max-width: 900px)` pada `.cluv-scan-layout` dan `.cluv-scan-main` (`display: flex; flex-direction: column; width: 100%; box-sizing: border-box;`) untuk menjamin zero horizontal blowout di layar smartphone.

---

## 3. Bukti Verifikasi
- **Build**: `npm run build` sukses (**✓ built in 2.56s**).
- **Linter**: `npx oxlint` lolos (**0 warnings, 0 errors**).
- **Capacitor**: `npx cap sync android` sukses (**Sync finished in 0.284s**).

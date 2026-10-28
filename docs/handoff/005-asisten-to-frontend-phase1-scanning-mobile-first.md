# Handoff: 005-asisten-to-frontend-phase1-scanning-mobile-first

- **Dari Peran**: `/role-asisten`
- **Ke Peran**: `/role-frontend`
- **Tanggal**: 2026-10-28
- **Status**: completed
- **Tujuan**: Merombak alur scanner utama (`FaceScanPage.tsx` dan `IngredientScanPage.tsx`) dengan arsitektur **Adaptive Presentation Branching** (standar `DashboardPage.tsx`) agar ergonomis, bebas dari "card soup", dan mengadopsi elemen native mobile (Viewfinder, Thumb Zone, Bottom Sheet, Inset Grouped List).

---

## 1. Konteks & Mandat Desain Mobile-First

Merujuk pada konsensus dan hasil audit di [docs/reports/2026-10-28-asisten-audit-arsitektur-mobile-first-dan-inspeksi-halaman.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/reports/2026-10-28-asisten-audit-arsitektur-mobile-first-dan-inspeksi-halaman.md):
1. **Bukan Sekadar Flex Wrap**: Dilarang hanya menumpuk kolom desktop ke bawah. Gunakan branching visual terpisah untuk desktop dan mobile dengan 1 data hook / business logic yang sama.
2. **Bebaskan dari Card Soup**: Dilarang membungkus setiap item/data ke dalam kartu individual ber-border tebal. Gunakan **Inset Grouped List** dengan pembatas hairline 1px (`var(--cluv-border)`).
3. **Ergonomi Jempol (Thumb Zone)**: Tombol aksi utama (Jepret Kamera, Pilih Galeri, Mulai Analisis, Tanya Skinsistant) wajib berada di 1/3 bagian bawah layar dengan target sentuh ≥ 48px.
4. **Bottom Sheet alih-alih Modal Desktop**: Panduan foto, tips membaca label kemasan, dan konfirmasi kredit di mobile wajib menggunakan slide-up bottom sheet yang mudah ditutup dengan usapan jempol.

---

## 2. Rincian Pengerjaan Teknis (In Scope)

### A. `src/pages/app/FaceScanPage.tsx`
- [x] **Stage Upload / Kamera (Mobile)**:
  - Hilangkan dropzone drag-and-drop di tampilan mobile (`@media (max-width: 640px)`).
  - Tampilkan Viewfinder kamera langsung (portrait 4:5 atau rounded squircle) dengan tombol jepret utama di Thumb Zone.
  - Sediakan tombol pemicu *"Panduan Foto"* yang memunculkan checklist kualitas foto dalam **Swipeable Bottom Sheet**.
- [x] **Stage Result (Mobile)**:
  - Tata letak bento hasil pemindaian dioptimasi agar tidak berdesakan di layar 360–430px.
  - Pertahankan 100% dari 14 data analitik klinis backend (skor, status, tipe kulit, 3 evaluasi zona wajah, hero actives, tips do/reduce/avoid).

### B. `src/pages/app/IngredientScanPage.tsx`
- [x] **Stage Upload / Kamera (Mobile)**:
  - Hilangkan dropzone drag-and-drop di mobile; sediakan tombol kamera label kemasan produk (`capture="environment"` untuk kamera belakang) dan pilih galeri.
  - Sidebar "Profil Kulit Aktif" & "Panduan Membaca Label" dipindahkan ke Bottom Sheet yang dapat dipanggil lewat icon bantuan di top header.
- [x] **Stage Result (Mobile)**:
  - Ganti tampilan card list bertumpuk (card soup) menjadi **Inset Grouped List** (1 kartu kontainer putih dengan hairline divider antar bahan).
  - Sorot badge status (Aman, Perhatian, Hindari) di baris pertama tiap item secara rapi.
  - Sediakan bottom action bar yang mudah dijangkau untuk *"Konsultasi ke Skinsistant AI"* dan *"Scan Produk Lain"*.

---

## 3. Kriteria Selesai (Definition of Done)

- [x] 100% data analitik backend tetap tampil utuh tanpa kompromi (terverifikasi oleh inspektur).
- [x] Responsif sempurna dan nyaman digunakan dengan satu tangan di layar mobile (360px – 430px) serta tetap elegan di desktop (>960px).
- [x] Bersih dari linting error: `npx oxlint` 0 error, 0 warning.
- [x] Lolos build kompilasi TypeScript & Vite: `npm run build` berhasil (3.95s).
- [x] Sinkronisasi aset ke native Android: `npx cap sync android` berhasil (0.354s).

# 🏛️ Laporan KruAI: Evaluasi Arsitektur Mobile-First, Refleksi Kesalahan, & Audit Inspeksi Halaman App

**Tanggal**: 28 Oktober 2026  
**Peran Pelapor**: `/role-asisten` (didukung analisis mandiri terhadap seluruh kode halaman di `src/pages/app/` dan `src/pages/profile/`)  
**Status**: Disetujui untuk Pembahasan & Eksekusi Bertahap  
**Dokumen Terkait**: [ADR 001, ADR 002](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/decisions.md), [CHANGELOG.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/CHANGELOG.md), [FE_BE_PARITY_MATRIX.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/architecture/FE_BE_PARITY_MATRIX.md)

---

## 1. Refleksi & Evaluasi Kesalahan (Post-Mortem Insiden)

Sebelum melangkah ke inspeksi halaman, asisten mencatat dengan jujur dan transparan kesalahan-kesalahan yang baru saja terjadi pada iterasi sebelumnya agar seluruh AI di dewan KruAI tidak mengulangi pola yang sama:

### 1.1 Terjebak dalam Ilusi Abstraksi Micro-Framework (`cluv-*`)
- **Akar Masalah**: Antigravity/AI terlalu terobsesi membungkus semua elemen ke dalam ribuan aturan micro-framework kustom (`.cluv-card`, `.cluv-bento-grid`, `.cluv-score-circle`, dsb.).
- **Dampak Negatif**:
  1. Tercipta **"Card Soup"** (kartu di dalam kartu dengan border bertumpuk-tumpuk) yang membuat antarmuka terasa berat, berdesakan, dan murahan di layar HP.
  2. Muncul **regresi tipografi** (terlalu banyak menggunakan class `.cluv-micro` 11–12px) yang sulit dibaca di smartphone tanpa zoom.
  3. Menguras memori konteks AI karena terus menerus memikirkan ribuan baris aturan CSS kustom daripada berfokus pada **kebutuhan dasar pengguna mobile sejati**.
- **Pelajaran**: Doktrin micro-framework kustom dikesampingkan sementara. Kita kembali ke fondasi dasar antarmuka mobile yang bersih, fungsional, dan ergonomis (hairline dividers, white space, thumb zone, inset grouped lists).

### 1.2 Kesalahan Orientasi Awal: Terjebak di "Desktop-First"
- **Akar Masalah**: Fondasi awal aplikasi Skincluv dirancang dengan paradigma desktop (Sidebar 250px + Topbar 68px + Kanvas Grid 1240px). Saat diperuntukkan untuk mobile, kode hanya mengandalkan CSS flex-direction/grid wrap (`@media max-width: 640px`).
- **Dampak Negatif**: Komponen desktop hanya sekadar "dijejalkan" ke bawah. Halaman menjadi sangat panjang (*infinite scrolling fatigue*), fitur penting terdorong ke bawah lipatan layar (*below the fold*), dan kontrol kamera/unggah foto terasa aneh (misal: kotak dropzone drag-and-drop di layar HP).

---

## 2. Rangkuman Diskusi & Keputusan Arsitektur Bersama Pengguna

Dalam diskusi intensif bersama pengguna, telah dicapai konsensus arsitektur berikut:

### 2.1 Mengapa Dashboard Beranda Disukai Pengguna di Desktop & Mobile?
Setelah ditelusuri ke dalam kode `src/pages/app/DashboardPage.tsx`, rahasia keberhasilannya adalah:
1. **Adaptive Presentation Branching**: Dashboard tidak sekadar mengecilkan grid desktop. Di dalamnya terdapat 2 cabang visual terpisah yang ditenagai oleh 1 data hook yang sama (`useDashboardData()`):
   - **Desktop Branch (`.cluv-desktop-hero-section`)**: Grid 2 kolom lapang (1.55fr : 1fr) berisi score ring 80px, catatan AI lengkap, dan ambient badge cuaca.
   - **Mobile Branch (`.cluv-mobile-dashboard`)**: Menyatukan sapaan user, cincin profil, kapsul koin/credits, skor mini cincin, badge status, dan 4 tombol squircle pintasan cepat dalam **satu kartu terpadu (`.cluv-mobile-unified-card`) di viewport paling atas**.
2. **Zero Mobile Clutter**: Di mobile, pengguna langsung melihat ringkasan kondisi kulitnya seketika tanpa harus scroll 3 layar ke bawah.

### 2.2 Keputusan Arsitektur: Adopsi Standar "Adaptive Presentation Branching"
- **Keputusan**: Seluruh halaman utama aplikasi Skincluv wajib menerapkan pola yang sama seperti `DashboardPage.tsx`:
  - **Shared Data Hook / Business Logic**: State, API RPC, validasi, dan data klinis 100% identik.
  - **Desktop View**: Memanfaatkan lebar kanvas (split grid, sidebar context, card berdampingan).
  - **Mobile View**: Ergonomis untuk 1 jempol (Thumb Zone), kamera/shutter langsung siap, tips/panduan masuk ke dalam **Bottom Sheet**, list item menggunakan **Inset Grouped List** (1 kontainer putih dengan hairline divider), dan aksi utama menempel di bagian bawah layar.

---

## 3. Hasil Audit Inspeksi Halaman Mandiri (Page-by-Page)

Berikut adalah hasil inspeksi komprehensif terhadap seluruh 15 halaman aplikasi di `src/pages/app/` dan `src/pages/profile/`:

| No | Halaman & Rute | Kanvas / Layout Saat Ini | Kondisi Responsif Desktop vs Mobile | Masalah & Ketidaksesuaian Utama | Rekomendasi Solusi Mobile-First |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Scan Wajah AI**<br>`/face-scan`<br>([FaceScanPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/FaceScanPage.tsx)) | `.cluv-canvas-grid`<br>(1240px) | ⚠️ **Desktop-first stacking**.<br>Di mobile, shutter card dan panduan kanan bertumpuk menjadi 5 kartu ke bawah. | • Dropzone drag-and-drop muncul di mobile (tidak masuk akal di HP).<br>• User harus scroll panjang sebelum dan sesudah foto.<br>• Tips panduan foto memenuhi layar utama alih-alih bantuan on-demand. | **Branching Shutter**: Di mobile, tampilkan viewfinder bulat/persegi native kamera langsung dengan tombol jepret/galeri di Thumb Zone. Checklist panduan dimasukkan ke dalam swipeable **Bottom Sheet**. |
| **2** | **Scan Komposisi**<br>`/ingredient-scan`<br>([IngredientScanPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/IngredientScanPage.tsx)) | `.cluv-canvas-grid`<br>(1240px 2-kolom) | ⚠️ **Sidebar terdorong jauh**.<br>Di mobile, sidebar Profil Kulit & Panduan Label terdorong ke dasar halaman. | • Card soup pada mode hasil (border bertumpuk).<br>• Scanning HUD laser animasinya memanjang di mobile.<br>• Filter chips & search bar memakan terlalu banyak ruang vertikal. | **Mobile Inset Grouped List**: Di mobile, hasil deteksi komposisi disajikan dalam 1 card list berdivider hairline. Badge peringatan (hindari/perhatian) disorot di atas. Sediakan floating action bar untuk konsultasi ke Skinsistant. |
| **3** | **Riwayat Scan**<br>`/scan-history`<br>([ScanHistoryPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ScanHistoryPage.tsx)) | `.cluv-canvas-grid`<br>(1240px grid 2-kolom) | ⚠️ **Desktop modal antipattern**.<br>Klik item riwayat membuka centered modal desktop. | • Tab tombol atas ("Analisis Wajah AI (X)" & "Evaluasi Formula Skincare (Y)") kepanjangan di HP (360px) dan terpotong/meluber.<br>• Centered modal di HP sulit ditutup (tombol X kecil di pojok kanan atas). | Ganti centered modal dengan **Mobile Bottom Sheet** (bisa ditarik ke bawah dengan jempol). Sederhanakan tab navigasi menjadi segmented control ringkas ("Wajah" vs "Komposisi"). |
| **4** | **Skinsistant AI**<br>`/chatbot`<br>([ChatbotPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ChatbotPage.tsx)) | `.cluv-canvas-bleed`<br>(100% Viewport Height) | 🟡 **Cukup baik, modal desktop**.<br>Tata letak chat sudah full-bleed. | • Dialog Riwayat Percakapan & Memori masih berupa popup modal tengah layar.<br>• Input text area dan keyboard mobile terkadang bergeser saat virtual keyboard muncul. | Ubah panel Riwayat Sesi & Memori menjadi **Slide-up Bottom Drawer**. Pastikan area input menghitung `env(safe-area-inset-bottom)` dan tinggi navigasi bawah. |
| **5** | **Misi Glow**<br>`/missions`<br>([MissionsPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx)) | `.cluv-canvas-grid`<br>(1240px 2-kolom) | ⚠️ **Header menelan seluruh layar HP**.<br>Kolom kiri menutupi layar sebelum misi terlihat. | • Banner Saldo Credits + Kartu "Cara Pakai AI Credits" menghabiskan seluruh layar pertama HP. User mengira misi tidak ada jika tidak scroll.<br>• 4 Tab kategori bertumpuk 2 baris canggung di HP. | Di mobile, jadikan saldo kredit sebagai header pill kompak di samping judul. Tab diubah jadi horizontal scrollable pills. Daftar misi langsung tampil di atas lipatan layar. |
| **6** | **Profil Hub**<br>`/profile`<br>([ProfilePage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ProfilePage.tsx)) | `.cluv-canvas-grid`<br>(1240px 2-kolom) | 🟡 **Responsif dasar**.<br>Dua kolom bertumpuk rapi di mobile. | • Menu navigasi subpage (Profil Kulit, Billing, Privasi) berupa kartu terpisah-pisah alih-alih menu list iOS/Android yang ringkas. | Terapkan **iOS-style Inset Grouped Settings List** (1 kontainer dengan ikon berwarna, label, dan chevron kanan) untuk akses cepat ke subpage. |
| **7** | **Edit Profil Kulit**<br>`/profile/skin`<br>([ProfileSkinPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/profile/ProfileSkinPage.tsx)) | `.cluv-canvas-focused`<br>(760px single-column) | 🟢 **Layout konsisten**.<br>Formulir 1 kolom sudah terpusat dan tidak melebar liar. | • Tombol "Simpan Profil Kulit" berada di paling bawah formulir, jauh di luar jangkauan jempol (Thumb Zone) saat mengisi preferensi. | Tambahkan sticky bottom bar atau floating action button (FAB) untuk simpan saat form diubah. |
| **8** | **Billing & Kuota AI**<br>`/profile/billing`<br>([ProfileBillingPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/profile/ProfileBillingPage.tsx)) | ❌ **INKONSISTEN: `.cluv-canvas-grid`** (1240px) | ⚠️ **Pecah dari standar subpage**.<br>Padahal ini subpage seperti `/profile/skin`. | • Menggunakan grid lebar 1240px padahal halaman saudara (`/profile/skin`) menggunakan kanvas sempit 760px.<br>• Di layar desktop terlihat terlalu lebar kosong, di mobile bertumpuk 4 kartu. | Standardisasi menjadi `.cluv-canvas-focused` (760px) agar seragam dengan seluruh sub-halaman profil dan riwayat transaksi. |
| **9** | **Paket Akses**<br>`/paket`<br>([AppPricingPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/AppPricingPage.tsx)) | `.cluv-canvas-grid`<br>(1240px 2-kolom) | 🟢 **Sudah memiliki adaptasi mobile**.<br>Memiliki utilitas `cluv-hide-mobile` & `cluv-hide-desktop`. | • Kartu paket GLOW dan PRO cukup panjang secara vertikal, mengharuskan user scroll bolak-balik untuk membandingkan. | Sediakan toggle bulanan/tahunan ringkas atau swipeable horizontal cards agar perbandingan paket lebih cepat di layar smartphone. |
| **10** | **Checkout & Bayar**<br>`/checkout`<br>([CheckoutPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/CheckoutPage.tsx)) | `.cluv-focused-ledger`<br>(760px single-column) | 🟢 **Bagus & Fokus**.<br>Single ledger sudah nyaman di desktop maupun mobile. | • Pilihan channel pembayaran (QRIS, VA) memakan ruang vertikal yang panjang di HP. | Kelompokkan channel ke dalam accordion atau segmented selector cepat. |
| **11** | **Riwayat Transaksi**<br>`/transactions`<br>([TransactionHistoryPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/TransactionHistoryPage.tsx)) | `.cluv-canvas-focused`<br>(760px) | 🟢 **Rapi & Konsisten**.<br>Sesuai standar focused ledger. | • Filter tabs ("Semua", "Belum Dibayar", "Lunas") dan list card bisa dipercantik menjadi inset list. | Terapkan Inset Grouped List untuk menghemat ruang border. |
| **12** | **Mutasi AI Credits**<br>`/coin-history`<br>([CoinHistoryPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/CoinHistoryPage.tsx)) | `.cluv-canvas-focused`<br>(760px) | 🟢 **Rapi & Konsisten**.<br>Menampilkan saldo dan riwayat kredit dengan jelas. | • Mirip `/transactions`, setiap item mutasi dibungkus kartu mandiri. | Jadikan 1 kartu riwayat dengan hairline divider antar transaksi. |
| **13** | **Pusat Privasi**<br>`/privacy-center`<br>([PrivacyCenterPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/PrivacyCenterPage.tsx)) | `.cluv-canvas-focused`<br>(760px) | 🟢 **Aman & Terfokus**.<br>Form konfirmasi penghapusan data jelas. | • Modal hapus akun masih berupa dialog window desktop. | Ubah modal bahaya menjadi confirmation bottom sheet dengan keyboard autofocus. |
| **14** | **Pusat Bantuan / FAQ**<br>`/faq`<br>([AppFaqPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/AppFaqPage.tsx)) | `.cluv-canvas-grid`<br>(1240px) | 🟡 **Fungsional**.<br>Accordion berfungsi dengan baik. | • Filter chips topik hangat meluber jika layar HP sempit (360px). | Beri container horizontal-scroll dengan indikator geser pada filter topik. |
| **15** | **Status Bayar Sukses**<br>`/payment-success`<br>([PaymentSuccessPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/PaymentSuccessPage.tsx)) | `.cluv-canvas-focused`<br>(760px) | 🟢 **Sangat Baik**.<br>Pusat ringkasan pembayaran bersih dan terpusat. | • Tombol aksi navigasi ("Mulai Scan Wajah", "Tanya AI") berada di tengah alih-alih di jempol bawah. | Tombol aksi utama sticky di thumb zone bawah pada mobile. |

---

## 4. Prioritas Rencana Eksekusi (Phase-Gated Roadmap)

Berdasarkan temuan di atas, agar tidak membebani konteks AI dan menjaga kestabilan kode, perbaikan akan dibagi ke dalam **4 Fase Terukur**:

### 🎯 Fase 1: Core Scanning Workflows (Prioritas Tertinggi)
1. **`FaceScanPage.tsx`**:
   - Terapkan **Adaptive Presentation Branching**:
     - Desktop: Tetap pertahankan hero grid 1.55fr : 1fr yang rapi.
     - Mobile: Viewfinder kamera langsung (tanpa dropzone drag-and-drop), tombol kamera/galeri di Thumb Zone, checklist panduan foto dipindah ke swipeable **Bottom Sheet**.
2. **`IngredientScanPage.tsx`**:
   - Hilangkan dropzone drag-and-drop di mobile.
   - Sederhanakan hasil deteksi menjadi Inset Grouped List dengan hairline divider (bebas card soup).
   - Sidebar panduan dipindahkan ke Bottom Sheet yang dapat dipanggil via ikon panduan di top bar.

### 🎯 Fase 2: Riwayat, Obrolan, & Modal-to-Sheet Refactor
1. **`ScanHistoryPage.tsx`**:
   - Ganti `FaceScanDetailModal` dan `IngredientScanDetailModal` dari centered modal desktop menjadi **Mobile Bottom Sheet**.
   - Sederhanakan tab navigasi atas agar tidak terpotong di layar 360px.
2. **`ChatbotPage.tsx`**:
   - Ganti modal Riwayat Percakapan dan Memori UU PDP menjadi **Slide-up Bottom Drawer**.
   - Presisikan safe-area-inset keyboard pada form input bawah.

### 🎯 Fase 3: Engagement & Gamifikasi
1. **`MissionsPage.tsx`**:
   - Pisahkan cabang mobile: Kapsul saldo ringkas di atas, tab kategori horizontal swipeable, dan list misi langsung terlihat tanpa scroll (*above the fold*).

### 🎯 Fase 4: Pengaturan, Profil, & Konsistensi Kanvas
1. **Standardisasi Kanvas**:
   - Ubah `ProfileBillingPage.tsx` dari `.cluv-canvas-grid` menjadi `.cluv-canvas-focused` (760px) agar seragam dengan seluruh sub-halaman profil.
2. **Settings Inset List**:
   - Ubah kartu-kartu di `ProfilePage.tsx` menjadi Inset Grouped Settings List.
   - Tambahkan sticky action bar pada `ProfileSkinPage.tsx`.

---

## 5. Ringkasan Tindakan Berikutnya

Asisten menyerahkan laporan evaluasi dan audit inspeksi mandiri ini kepada pengguna. Begitu disetujui, kita siap langsung mengeksekusi **Fase 1** (dimulai dari `FaceScanPage.tsx` & Bottom Sheet).

# Changelog

Semua perubahan tercatat, keputusan, dan penanganan insiden/kesalahan pada proyek Skincluv dicatat di sini untuk mencegah amnesia AI dan regresi.

Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased] - 2026-10-31

### Ditambahkan
- **Numbered Guide List Kanonikal (`cards.css`, `.cluv-guide-item`, `.cluv-guide-num`)**:
  - Menambahkan styling kanonikal untuk panduan bernomor di dalam kartu terpadu (`.cluv-guide-item`, `.cluv-guide-num` dengan varian warna `.is-teal`, `.is-gold`, `.is-rose`).
  - Menghemat 40% ruang vertikal pada bottom sheet mobile dibandingkan penggunaan kartu bertumpuk terpisah.
- **Passport Metadata Row & Full-Width Focus Block (`cards.css`, `.cluv-passport-meta-row`, `.cluv-bento-wallet-focus-block`)**:
  - Menambahkan baris metadata preferensi proporsional (`.cluv-passport-meta-row`, `.cluv-passport-meta-item`) dengan ikon dan label halus.
  - Menambahkan blok fokus perhatian membentang penuh (`.cluv-bento-wallet-focus-block`) di atas garis putus-putus (*dashed line*).

### Diubah
- **Penyempurnaan Hirarki Teks & Padding Panduan Label (`cards.css`, `IngredientScanPage.tsx`)**:
  - **Hirarki Judul vs Deskripsi**: Mempertegas ukuran judul poin (`.cluv-guide-title` 0.90625rem / 14.5px, font-weight 700) dan mengecilkan deskripsi (`.cluv-guide-desc` 0.78125rem / 12.5px, regular muted) agar perbedaan hirarki jelas dan tidak terbalik.
  - **Konsistensi Spacing**: Menyelaraskan padding header kartu dan item list menjadi konsisten 16px kiri-kanan serta gap 12px ke nomor lingkaran.
- **Redesign Bottom Sheet Profil Kulit Paspor (`IngredientScanPage.tsx`, `cards.css`)**:
  - **Penghapusan Badge Tersinkronisasi & Pencocokan AI**: Menghapus badge statis dan kolom pencocokan AI yang mempersempit ruang.
  - **Penyeragaman Tipe Kulit (Combination) ke Metadata Blok**: Mengubah headline besar tipe kulit menjadi item metadata yang seragam dengan Pantangan dan Target (`Tipe Kulit:`, `Pantangan:`, `Target:`) dengan font-size 0.8125rem, label uppercase 0.6875rem (min-width: 72px untuk perataan kolom rapi), dan ikon klinis masing-masing (`Activity`, `ShieldCheck`, `Sparkles`).
  - **Fokus Perhatian Menonjol**: Bagian Fokus Perhatian membentang 100% penuh di atas garis putus-putus (*dashed line*), memudahkan membaca keluhan kulit tanpa terpotong sempit.

## [Unreleased] - 2026-10-29

### Ditambahkan
- **Pusat Notifikasi Mobile & Desktop (`/notifications`, `NotificationsPage.tsx`, `AppLayout.tsx`, `cards.css`)**:
  - Membangun halaman mandiri **Pusat Notifikasi** (`/notifications`) dengan kanvas focused yang responsif dan standar mobile-first (mirip Gojek / Tokopedia).
  - Feed notifikasi kontekstual yang otomatis memetakan status akun pengguna:
    - **Transaksi & Tagihan**: Notifikasi invoice `UNPAID` (dengan direct link bayar) dan bukti pembayaran `PAID` (langganan aktif).
    - **Misi & Credits**: Notifikasi hadiah misi siap klaim (`+X Credits`) dan pengingat streak check-in harian yang belum diambil.
    - **Skin Journey**: Pengingat observasi foto wajah mingguan (siklus 7 hari) dan pembaruan hasil skor kulit terkini.
    - **Wawasan AI**: Tips cerdas personal dari Skinsistant AI berdasarkan tipe kulit (`skin_type`) dan target perawatan (`skin_concerns`).
  - Fitur interaktif: status *unread* dengan dot teal lembut & border aksen kiri, aksi cepat *"Tandai Semua Dibaca"*, dan deep navigation saat baris notifikasi di-tap.
  - Integrasi ikon lonceng (`Bell`) di Topbar desktop dan mobile dengan navigasi instan ke `/notifications` dan titik merah/teal penanda unread.

### Diubah
- **Perbaikan Mobile Touch Scroll Shell & Line Clamping (`shell.css`, `cards.css`, `layout.css`)**:
  - Mengatasi konflik *nested scrolling* di mobile: Menghilangkan `overflow-y: auto` pada parent `.cluv-shell-main` dan menetapkan `.cluv-shell-page-content` sebagai kontainer scroll utama tunggal dengan `-webkit-overflow-scrolling: touch` dan `overscroll-behavior-y: contain`.
  - Menerapkan pembatasan teks deskripsi notifikasi (`.cluv-notif-body`) menjadi maksimal 2 baris dengan pemotongan elipsis otomatis (`-webkit-line-clamp: 2; text-overflow: ellipsis`) agar tinggi setiap kartu notifikasi seragam.
  - Menyesuaikan padding bawah `.cluv-canvas-focused` di mobile menjadi 40px agar kartu terakhir memiliki ruang batas yang nyaman dan tidak mepet.
- **Badge Notifikasi Topbar Dinamis & Hook Terpusat (`AppLayout.tsx`, `useNotifications.ts`, `shell.css`)**:
  - Mengekstrak logika fetch dan perhitungan status baca notifikasi ke dalam custom hook terpusat `useNotifications`.
  - Mengganti dot merah statis di ikon lonceng (*Bell*) Topbar mobile dan desktop menjadi badge angka unread dinamis (`.cluv-topbar-bell-badge`).
  - Menampilkan angka pesan yang belum dibaca (`unreadCount`), dan **menyembunyikan angka/badge secara otomatis (*hidden*)** saat semua notifikasi sudah dibaca (`unreadCount === 0`).
- **Refactoring Layout Kartu Notifikasi (`cards.css`, `NotificationsPage.tsx`)**:
  - Menyusun baris header terstruktur (`.cluv-notif-header-row`): Judul + badge status di kiri, waktu relatif + dot teal unread di pojok kanan atas.
  - Paragraf deskripsi (`.cluv-notif-body`) kini membentang penuh 100% tanpa terhimpit oleh elemen chevron atau bulatan yang melayang di tengah.
  - Tombol *"Tandai Dibaca"* di mobile menggunakan styling tombol `.cluv-notif-mark-btn` dengan border lembut tanpa outline ganda.

### Dihapus & Alasan
- **Tab Kategori Notifikasi (`NotificationsPage.tsx`)**:
  - **Dihapus**: Filter tab horizontal (*Semua, Transaksi, Misi & Credits, Aktivitas & AI*).
  - **Alasan**: Tab horizontal terpotong di layar mobile, memakan ruang vertikal secara sia-sia, dan pembagian kategori diputuskan tidak diperlukan oleh pengguna karena notifikasi lebih nyaman dibaca dalam satu alur terpadu (*single stream*) yang mengalir secara kronologis.

- **Redesign Mobile Gamifikasi Misi Glow V2: Bento Wallet Kanonikal, Gamified 7-Day Check-in Streak, Dropdown Filter, & Simple Task Cards (`MissionsPage.tsx`, `cards.css`, `AppLayout.tsx`)**:
  - **Bento Wallet Card Kanonikal (`.cluv-bento-wallet`)**: Mengadopsi format kartu saldo dari Riwayat Koin (Gambar 1), menampilkan total saldo AI Credits di atas serta 2 kolom metrik di bawah: *Total Diperoleh* di kiri (`+X Credits` teal) dan *Progres Misi Hari Ini* di kanan (`X/Y Selesai (Z%)`).
  - **Kapsul Kredit Topbar Mobile (Gambar 3)**: Mengaktifkan kapsul interaktif `⚡ 1.387 | +` di Topbar kanan pada rute `/missions`, dengan aksi tap `+` langsung mengarah ke `/pricing` (Beli AI Credits).
  - **Filter Dropdown Popover Kompak (Gambar 4)**: Menggantikan deretan chip horizontal dengan tombol pemicu filter dan menu dropdown popover (*Semua, Harian, Mingguan, Prestasi*), menghemat ~44px ruang vertikal.
  - **Gamified 7-Day Check-in Streak Timeline**: Memisahkan misi login harian menjadi kartu gamifikasi mandiri di bagian paling atas feed dengan 7 node horizontal (Hari 1 hingga Hari 7 dengan centang hijau hari lalu, status aktif hari ini, dan peti kado spesial akhir pekan).
  - **Simple Mission Task Cards (Gambar 5)**: Menyederhanakan kartu misi reguler menjadi baris tugas minimalis (nama misi, reward `+X Credits` emas tabular, dan tombol aksi langsung), menyingkirkan icon squircle besar, badge kategori berulang, dan progress bar tebal.


- **Penyempurnaan Ergonomi Privacy Center: Native Bottom Sheet, Hirarki Tipografi Konsisten, & Tombol Destruktif (`PrivacyCenterPage.tsx`, `modals.css`)**:
  - Mengubah modal dialog konfirmasi menjadi **Pure Bottom Sheet Panel** (`.cluv-sheet-panel`) yang menempel di bagian bawah layar ponsel dengan drag handle bar abu-abu dan breakpoint mobile 880px.
  - Memperbaiki hirarki tipografi teks konfirmasi: judul 16px tegas, deskripsi ringkas 13.5px (`line-height: 1.5`), dan micro-disclaimer 12px yang terstruktur tanpa teks ganda yang berulang.
  - Menyelaraskan warna tombol aksi destruktif menjadi **Rose/Merah Bahaya** (`variant="danger"` untuk tombol hapus foto wajah dan hapus akun) serta tombol batalkan berwarna **Netral Outline**, menghilangkan penggunaan warna primary teal yang keliru untuk aksi penghapusan permanen.
  - Menyembunyikan ikon panah chevron `›` di sisi kanan seluruh baris menu privasi mobile, menjaga area baris tetap bersih dan lapang.



- **Standarisasi Seluruh Sub-Halaman Mobile: Eliminasi Judul Duplikat & Penyelarasan Kanvas Focused (`ProfileBillingPage.tsx`, `PrivacyCenterPage.tsx`, `TransactionHistoryPage.tsx`, `CoinHistoryPage.tsx`, `CheckoutPage.tsx`)**:
  - Menyembunyikan tombol navigasi kembali in-page dan header judul/subtitle in-page pada perangkat mobile (`.cluv-hide-mobile`) di seluruh sub-halaman profil dan transaksi, karena Topbar mobile sudah menyediakan tombol panah kembali dan judul halaman yang presisi.
  - Menstandarisasi kontainer halaman ke `.cluv-canvas-focused`, menjamin jarak batas bawah layar mobile konsisten tepat **24px** tanpa ruang kosong berlebih.
  - Tampilan desktop tetap normal 100% dengan link navigasi kembali in-page dan judul halaman lengkap.

- **Penyelarasan Spasi Bawah & Pembersihan Mikro-Teks Mobile (`ProfileSkinPage.tsx`, `layout.css`, `buttons.css`)**:
  - Memangkas ruang kosong bawah pada layar mobile sub-halaman fokus (`.cluv-canvas-focused` dan `.cluv-focused-ledger`) dari 80px menjadi tepat **24px** (`padding: 16px 16px 24px;`), menyisakan ruang ideal 20–30px di bawah tombol aksi sesuai kenyamanan visual ponsel.
  - Menghilangkan `margin-bottom: 32px` pada baris tombol aksi (`.cluv-profile-action-bar` menjadi `margin-bottom: 0`).
  - Menyembunyikan mikro-teks keterangan di bawah tombol simpan (*"Preferensi tersimpan otomatis tersinkronisasi..."*) pada tampilan mobile (`.cluv-hide-mobile`) demi tampilan akhir yang bersih dan bebas distraksi, sembari tetap menampilkannya di layar desktop.

- **Gaya Desain Native Mobile App: Inset Selection List & Penempatan Tombol Alami (`ProfileSkinPage.tsx`, `forms.css`, `buttons.css`)**:
  - Mengubah opsi pemilihan menjadi standar aplikasi mobile native (*iOS Settings / Health Inset Grouped List*):
    - **Single Select (Tipe Kulit Utama)**: Menggunakan baris bergaris halus dengan indikator **Custom Radio Teal** (lingkaran 20px beraksen dot teal).
    - **Multiple Select (Target Perawatan & Bahan Sensitivitas)**: Menggunakan baris grup dengan indikator **Custom Checkbox Squircle** (kotak membulat 20px berlatar teal dan centang putih).
  - Menyederhanakan header tiap seksi menjadi format judul ramping (*13px bold*) dengan petunjuk mikro di sisi kanan (`Pilih 1`, `Bisa pilih > 1`, `Opsional`), menghilangkan kotak ikon tebal yang memakan ruang.
  - Menghilangkan tombol melayang/sticky yang janggal, mengembalikannya ke posisi alami di bagian paling bawah halaman (`.cluv-profile-action-bar`) dengan ukuran standar kompak (44px) yang nyaman dijangkau jempol.
- **Standar Navigasi Mobile Native: Sembunyikan Bottom Navbar di Sub-Halaman & Grid Form 2 Kolom (`AppLayout.tsx`, `ProfileSkinPage.tsx`, `buttons.css`)**:
  - Menerapkan standar arsitektur navigasi mobile (*hidesBottomBarWhenPushed*): Bottom Navigation Bar otomatis disembunyikan saat pengguna masuk ke sub-halaman formulir/transaksi (`/profile/skin`, `/profile/billing`, `/privacy-center`, `/transactions`, `/coin-history`, `/checkout`), mencegah salah klik menu dan membebaskan 68px ruang vertikal bawah.
  - Memperbarui daftar pilihan opsi formulir (*Tipe Kulit Utama*, *Target Perawatan*, dan *Bahan yang Dihindari*) menjadi **Grid 2 Kolom Rapi** (`.cluv-chip-grid`), memangkas tinggi scroll vertikal hingga lebih dari 50% dan menghilangkan tumpukan chip acak-acakan.
  - Memasang **Sticky Bottom Action Bar** (`.cluv-profile-sticky-action`) untuk tombol *Simpan Profil Kulit*, sehingga tombol aksi selalu siap dijangkau dengan jempol di bawah layar tanpa perlu scroll ke ujung bawah halaman.
  - Tampilan desktop tetap normal 100% tanpa sticky bar dan dengan chip grid proporsional.
- **Optimasi Ergonomi Layar Mobile Profil Kulit (`ProfileSkinPage.tsx`, `cards.css`)**:
  - Menyembunyikan judul dan subtitle in-page di mobile (`.cluv-hide-mobile`) karena informasi halaman sudah terpampang jelas di Topbar mobile, menghemat ruang vertikal.
  - Membuka pembungkus kartu putih kaku di mobile (`.cluv-card.is-mobile-flat`) menjadi layout *flat/unboxed* (tanpa border luar ganda dan padding tebal), sehingga form pilihan tipe kulit dan target perawatan bernapas lega dan terasa seperti form mobile app modern.
  - Menjadikan kotak notifikasi edukatif (`.cluv-card-note.is-dismissible`) lebih ramping di ponsel dengan font 11–12px dan menyediakan tombol **Tutup (`X`)**, sehingga pengguna dapat menutup notifikasi kapan saja untuk langsung melihat form.
  - Tampilan desktop tetap normal 100% dengan judul in-page, kartu putih ber-padding penuh, dan layout 2 kolom.
- **Penyederhanaan Alur Navigasi Mobile Sub-Halaman Profil (`ProfileSkinPage.tsx`, `PrivacyCenterPage.tsx`, `TransactionHistoryPage.tsx`, `CoinHistoryPage.tsx`)**:
  - Menghilangkan tombol in-page "Kembali ke Profil" ganda di perangkat mobile (`.cluv-hide-mobile`) karena topbar aplikasi di mobile sudah menyediakan tombol panah kembali yang intuitif (`← [Judul Halaman]`).
  - Meniadakan tab/tombol navigasi horizontal tambahan di sub-halaman agar alur pengguna tetap bersih, terarah, dan fokus pada formulir/konten yang sedang dibuka.
  - Pengguna cukup menekan tombol kembali pada topbar untuk kembali ke menu profil utama (`/profile`) dan memilih sub-navigasi lainnya.
  - Tampilan desktop tetap normal dengan tautan kembali in-page yang jelas.
- **Gaya Navigasi Mobile-First: Grouped Menu Rows pada Halaman Profil (`ProfilePage.tsx`, `cards.css`)**:
  - Menggantikan 3 kartu konten panjang di tampilan mobile dengan tombol-tombol navigasi *Inset Grouped Menu Rows* (standar aplikasi mobile iOS/Material 3: `.cluv-menu-group` dan `.cluv-menu-row`).
  - Menghemat scroll vertikal hingga lebih dari 65% di layar ponsel kecil, menghindarkan user dari kelelahan navigasi (*scroll fatigue*).
  - Tampilan desktop tetap mempertahankan kartu informatif lengkap berkat pemisahan responsif kanonikal `.cluv-hide-desktop` dan `.cluv-hide-mobile`.
  - Tombol-tombol dilengkapi ikon squircle tematik warna-warni (`.cluv-menu-row-icon`), label judul tegas, indikator status ringkas (`{skinTypeLabel}`, `UU PDP`), dan ikon *trailing chevron* `›`.
  - Aksi **Keluar dari Akun** dialokasikan di baris terbawah menu mobile (`.cluv-menu-row.is-danger`) dengan nuansa bahaya yang jelas dan rapi.
- **Penyempurnaan Ergonomis Kartu Profil Terpadu Mobile (`ProfilePage.tsx`, `cards.css`)**:
  - Penyesuaian ukuran avatar ring menjadi 38px (inner initial 13px) sehingga inisial nama lega dan tidak tercekik oleh badge mahkota mengambang.
  - Penegasan hirarki tipografi: judul `Halo, Jessy` berukuran 15px (800 bold), label `Kuota Universal AI` dan `100% Tersisa` berukuran 12px (600 semi-bold), dan `Masa aktif` berukuran 11px subtle.
  - Perataan ritme spasi vertikal kartu (`padding: 15px 16px 14px`, margin-bottom header 12px, margin vertikal bilah bar 8px) menghilangkan ruang kosong berlebih di bagian bawah kartu.
  - Badge keanggotaan melayang di bagian tengah bawah avatar foto profil (`.cluv-avatar-badge-icon`) dalam wujud ikon minimalis tanpa teks (`👑` untuk VIP Pro, `⚡` untuk Glow Club).
  - Penghapusan badge jenis kulit (`Combination`) yang redundan dari kartu profil.
  - Kuota Universal AI disajikan dalam bentuk bilah garis (*progress bar*) horizontal bersih di bawah garis pembatas yang interaktif (*clickable*) menuju `/profile/billing`.
  - Penghapusan tombol "Keluar" dari kartu profil untuk diposisikan pada area navigasi khusus selanjutnya.
- **Standarisasi Tipografi Header Halaman Profil & Pengaturan (`ProfilePage.tsx`, `typography.css`)**:
  - Penambahan class kanonikal `.cluv-title-page` di `src/styles/cluv/typography.css` (selaras dengan `.cluv-title-section` ukuran `clamp(1.5rem, 2.8vw + 0.5rem, 2.25rem)` dan font-weight 800) untuk mencegah rendering default `<h1>` peramban yang terlalu besar di perangkat mobile.
  - Penyelarasan ritme header `ProfilePage.tsx` menggunakan `.cluv-title-section.cluv-m-0` dan subtitle `.cluv-subtitle.cluv-mt-1.cluv-m-0` dalam wrapper `.cluv-mb-4`, identik dengan gaya header ringkas dan rapi pada *Ingredient Scanner*.
- **Penyempurnaan Ergonomi Mobile Skinsistant AI (`AppLayout.tsx`, `ChatbotPage.tsx`, `shell.css`, `chat.css`)**:
  - Tombol **Chat Baru** diposisikan sebagai aksi utama di kiri dengan warna **Primary Teal Skincluv** (`.cluv-topbar-action-btn.is-primary`), kontras tinggi dan mudah dijangkau.
  - Tombol **Riwayat** dan **Memori** dikelompokkan ke dalam popover menu titik tiga vertikal (`MoreVertical`) mengambang (`.cluv-topbar-more-dropdown`), menghemat ruang horizontal topbar.
  - Teks disclaimer di bawah input chat disembunyikan di layar ponsel (`display: none !important`), memaksimalkan ruang chat.
  - Placeholder input diubah menjadi ringkas 1 baris (`"Tanyakan seputar kulit Anda..."`), menghilangkan cacat teks placeholder terpotong vertikal.
  - Tombol Enter keyboard virtual pada ponsel disesuaikan agar membuat baris baru (*newline*), mencegah pengiriman pesan prematur sebelum user menekan tombol Send.
- **Paritas Antarmuka Riwayat Scan Komposisi (`IngredientScanDetailModal.tsx`)**:
  - Mode Kanonikal **Detail** vs **Ringkas** pada *Komposisi Lengkap*: Mode Detail menampilkan fungsi bahan kosmetik, kecocokan tipe kulit (`Cocok untuk:`), panduan interaksi bahan (`Interaksi:`), skor komedogenik/pori, dan regulasi BPOM.
  - Mode Ringkas menyajikan tag cloud chips interaktif dengan titik status warna (`.cluv-dot`).
  - Penambahan modifier `.cluv-chip.is-danger`, `.cluv-chip.is-gold`, dan class `.cluv-summary-box` dengan padding lega `14px 16px`.
- **Standarisasi Badge Evaluasi Area Wajah (Opsi A Terpadu)**:
  - Format terpadu `[Optimal • 85]` atau `[Perlu Perhatian • 80]` pada [FaceScanDetailModal.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/scans/FaceScanDetailModal.tsx) tanpa redundansi kata "Skor".
  - Subheader area `.cluv-area-card-header` dengan pembatas `border-bottom` dan bantalan 12px.
- **Penyelarasan Header & Notice Kuota Pemindai Wajah & Komposisi**:
  - Banner kuota dinamis yang ramah mobile di `FaceScanPage.tsx` dan `IngredientScanPage.tsx`.
  - Filter BottomSheet di `ScanHistoryPage.tsx` dengan pemindahan tombol aksi ke bodi `children` dan indikator filter aktif warna gold kontras tinggi.
- **Peran Baru KruAI (`/role-mobile`)**: Spesifikasi peran di `.agents/skills/role-mobile/SKILL.md` untuk mengelola Capacitor, Android platform, konfigurasi native Gradle, hardware permissions, dan build APK cloud tanpa membebani mesin lokal.
- **Kerangka Uji Akurasi Scan Wajah (RFC 022)**:
  - Dokumen arsitektur `docs/architecture/RFC_022_FACE_SCAN_ACCURACY_BENCHMARK.md`.
  - Migration `20240001000085_seed_face_scan_golden_benchmarks.sql` (5 profil tolok ukur emas).
  - Skrip validator `src/lib/faceScanBenchmarkValidator.ts`.
- **Integrasi Cloud CI/CD Android APK**:
  - Konfigurasi Capacitor `capacitor.config.ts` dan platform native `android/`.
  - Workflow GitHub Actions `.github/workflows/build-apk.yml` dengan Java 21 Temurin dan Node.js 22.
- **Database Hardening Invariant**:
  - Migration `20240001000084_prevent_deleting_core_ai_features.sql` (BEFORE DELETE trigger untuk `universal_ai` dan `face_validation`).
- **Penyelarasan Dashboard & Admin UI**:
  - Refactoring 4 halaman admin ke doktrin kanonikal Cluv Micro-Framework.
  - Perbaikan transisi CSS anti-jank 60fps di `admin-users.css` dan `admin-transactions.css`.
  - Penerapan `.cluv-tabular-nums` dan audit a11y (0 warning Oxlint).
- **Halaman Khusus Unduh APK Android (`/download`)**:
  - Rilis halaman `src/pages/public/DownloadPage.tsx` dengan panduan instalasi 3 langkah dan FAQ.
  - Bucket Supabase Storage publik `app-releases` (migration 086).
  - Tautan navigasi desktop navbar, mobile drawer, dan footer di `PublicLayout.tsx`.
  - Tombol aksi sekunder di Hero dan Bottom CTA `LandingPage.tsx`.
  - Alert banner ramah Android di `DashboardPage.tsx`.

### Diubah & Diperbaiki
- **Isolasi Java Extension Lokal**: Menonaktifkan Language Server Red Hat Java di `.vscode/settings.json` dan mengecualikan folder `android/` agar laptop developer bebas dari download background.
- **Pemulihan Versi Gradle**: Mengembalikan `gradle-wrapper.properties` ke Gradle 8.14.3 (kompatibel dengan AGP 8.13).
- **Target Android SDK**: Menyetel `compileSdkVersion = 35` dan `targetSdkVersion = 35` (Android 15 resmi) di `variables.gradle`.

### Log Kesalahan & Pembelajaran (Incident Log & Root Cause Analysis)
1. **Insiden Red Hat Java Extension Local Drain**:
   - *Gejala*: Popup `Upgrading Gradle wrapper...` muncul otomatis di IDE, mengubah wrapper ke Gradle 9.7 yang tidak kompatibel.
   - *Penyebab*: Ekstensi editor mendeteksi file Gradle dan memicu auto-build lokal.
   - *Solusi & Pencegahan*: Ditambahkan aturan `java.enabled: false`, `java.autobuild.enabled: false`, dan `watcherExclude` di `.vscode/settings.json`.
2. **Insiden CI Cloud Runner 3rd Party Action Conflict**:
   - *Gejala*: Job gagal dalam 19s pada commit awal `6c4610a`.
   - *Penyebab*: Action `android-actions/setup-android@v3` konflik dengan Android SDK bawaan runner Ubuntu modern.
   - *Solusi & Pencegahan*: Dihapus action pihak ketiga, menggunakan Android SDK bawaan runner secara langsung dengan Java 21 resmi.
3. **Insiden checkDebugAarMetadata FAILED (Durasi 1m 10s)**:
   - *Gejala*: Kompilasi Gradle gagal pada task `:app:checkDebugAarMetadata` dengan exit code 1.
   - *Penyebab*: Library Capacitor 8 (`@capacitor/android: 8.5.3`) menetapkan `minCompileSdk = 36` di dalam metadata `.aar`-nya. Saat `compileSdkVersion` diturunkan ke 35, validator AAR Gradle menolak karena versi SDK aplikasi lebih rendah dari syarat library.
   - *Solusi & Pencegahan*: Mengembalikan `compileSdkVersion = 36` dan `targetSdkVersion = 36` di `variables.gradle`, serta menambahkan instalasi resmi `platforms;android-36` melalui `sdkmanager` pada runner GitHub Actions.
4. **Pelajaran UX Mobile App vs Desktop (Bento Grid Parity)**:
   - *Gejala*: Setelah APK berhasil diuji coba, antarmuka halaman selain Dashboard (`FaceScanPage`, `IngredientScanPage`, dll.) terasa kaku, tidak ergonomis untuk disentuh jempol di HP, dan terasa hambar di desktop.
   - *Penyebab*: Halaman-halaman selain Dashboard masih menggunakan template lama (dropzone desktop, tampilan hasil vertikal padat teks tanpa progressive disclosure).
   - *Solusi & Pencegahan*: Menetapkan Konsensus Tripartit (BE x Inspektur x FE) untuk merombak halaman scanner menjadi arsitektur Bento Grid Human Scale dengan standar mobile-first, tanpa menghilangkan satu pun dari 14 data analitik klinis backend.
5. **Pelajaran Arsitektur UI: Distraksi Micro-Framework Kustom & Paradigma Mobile-First (28 Okt 2026)**:
   - *Gejala*: Upaya refactoring scanner sempat menghasilkan "Card Soup" (border kartu bertumpuk), regresi tipografi (`.cluv-micro` 11px kekecilan), dan AI terbebani ribuan aturan token kustom. Halaman terasa panjang dan melelahkan di smartphone.
   - *Penyebab*: Terlalu fokus pada abstraksi micro-framework daripada fondasi antarmuka mobile nyata, serta pendekatan desktop-first yang hanya sekadar menumpuk kolom ke bawah (`flex-direction: column`).
   - *Solusi & Pencegahan*: Mengesampingkan doktrin micro-framework yang kaku. Menetapkan standar **Adaptive Presentation Branching** (mengadopsi pola sukses `DashboardPage.tsx`: 1 data hook, 2 cabang visual terpisah untuk desktop vs mobile, penggunaan Bottom Sheet, Inset Grouped List, dan Thumb Zone).

---

## [Unreleased] - 2026-10-28

### Ditambahkan
- **Laporan Audit Inspeksi Halaman App Mandiri (`docs/reports/2026-10-28-asisten-audit-arsitektur-mobile-first-dan-inspeksi-halaman.md`)**:
  - Audit page-by-page terhadap seluruh 15 halaman aplikasi di `src/pages/app/` dan `src/pages/profile/`.
  - Pemetaan kanvas (`cluv-canvas-grid`, `cluv-canvas-focused`, `cluv-canvas-bleed`), inkonsistensi layout, dan antipattern modal desktop di perangkat seluler.
  - Roadmap 4 fase pengerjaan (Fase 1: Core Scanning Workflows, Fase 2: Riwayat & Drawer/Sheet, Fase 3: Gamifikasi Misi, Fase 4: Pengaturan & Kanvas).


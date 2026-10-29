# Changelog

Semua perubahan tercatat, keputusan, dan penanganan insiden/kesalahan pada proyek Skincluv dicatat di sini untuk mencegah amnesia AI dan regresi.

Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased] - 2026-10-29

### Ditambahkan
- **Penataan Topbar & Navigasi Mobile Skinsistant AI (`AppLayout.tsx` & `ChatbotPage.tsx`)**:
  - Tombol aksi Skinsistant dipindahkan ke cluster kanan general Topbar pada layar mobile: **Riwayat** (`History`), **Memori** (`Brain`), dan **Chat Baru** (`Plus`) dengan gaya tombol circular 36×36px seragam (`.cluv-topbar-action-btn`).
  - Sub-topbar bawaan chat (`.cluv-chat-util-bar`) disembunyikan khusus di layar mobile, membebaskan ruang vertikal chat.
  - Bilah navigasi bawah (*Mobile Bottom Nav*) disembunyikan saat berada di rute `/chatbot` agar field input chat menempel langsung di tepi bawah layar perangkat.
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


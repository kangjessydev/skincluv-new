# Changelog

Semua perubahan tercatat, keputusan, dan penanganan insiden/kesalahan pada proyek Skincluv dicatat di sini untuk mencegah amnesia AI dan regresi.

Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased] - 2026-10-27

### Ditambahkan
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

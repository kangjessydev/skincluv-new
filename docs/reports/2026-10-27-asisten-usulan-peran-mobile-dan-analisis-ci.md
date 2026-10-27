# Laporan Asisten: Usulan Peran Baru KruAI (role-mobile) & Evaluasi CI/CD Build APK

- **Tanggal**: 2026-10-27
- **Peran**: `/role-asisten`
- **Topik**: Usulan Peran Baru KruAI (Mobile Specialist), Audit Ekstensi IDE Lokal, dan Solusi CI/CD Build Android APK

---

## 1. Latar Belakang & Analisis Kebutuhan Peran Baru

Aplikasi Skincluv mengalami ekspansi dari Web Application (SPA React) menjadi Hybrid Native Mobile (Capacitor Android). Selama proses ini, terjadi tumpang tindih tanggung jawab teknis antara domain Web Frontend dan Mobile Native.

### A. Urgensi Peran Baru: `/role-mobile`
- **Mengapa Dibutuhkan?**
  - `role-frontend` berfokus pada ekosistem web: DOM, CSS Cluv Framework, Web Accessibility (a11y), React lifecycle, dan responsiveness viewport browser.
  - Domain Mobile memiliki ekosistem yang spesifik dan berbeda secara mendasar:
    1. **Native Bridge & Capacitor**: Konfigurasi `capacitor.config.ts`, sinkronisasi aset web ke direktori Android, dan pemanggilan native plugin.
    2. **Platform Native (Android/iOS)**: `AndroidManifest.xml` (izin kamera biometrik, hardware access), `variables.gradle`, `app/build.gradle`.
    3. **Device Polish**: Safe area notch/island, splash screen multi-densitas (hdpi s/d xxxhdpi), orientasi layar, status bar translucent.
    4. **Release & Packaging**: Signing keystore, Proguard rules, arsitektur CPU (arm64-v8a), dan integrasi build cloud.
- **Kesimpulan**: Penambahan `/role-mobile` ke dalam roster KruAI sangat valid dan krusial agar kualitas kode mobile terkelola dengan standar tinggi tanpa membebani peran frontend.

### B. Peran Pendukung: Formalisasi `/role-devops`
- Urusan skrip GitHub Actions (`.github/workflows/`), cache dependency runner cloud, automasi deploy Netlify, dan containerisasi adalah yurisdiksi murni **DevOps Engineer**.
- Status di `roster.md` disarankan segera diaktifkan dari 📝 (direncanakan) menjadi ✅ jika tim membutuhkan pipeline otomatis yang lebih kompleks.

---

## 2. Investigasi Teknis: Kenapa Terjadi Kendala?

### A. Ekstensi IDE Red Hat Java di Mesin Lokal (Gambar 2)
- **Gejala**: Muncul notifikasi `Upgrading Gradle wrapper... Source: Language Support for Java(TM) by Red Hat`.
- **Akar Masalah**: Ekstensi Java Red Hat di editor lokal secara otomatis mendeteksi folder `android/` dan berusaha mengunduh Gradle 9.7 secara background di laptop. Ini membebani RAM dan kuota lokal.
- **Solusi yang Diterapkan**:
  - Konfigurasi `.vscode/settings.json` diperbarui dengan `java.enabled: false`, `java.autobuild.enabled: false`, dan `files.watcherExclude: {"**/android/**": true}`.
  - File `android/gradle/wrapper/gradle-wrapper.properties` dikembalikan ke versi resmi yang stabil (`gradle-8.14.3-all.zip`).

### B. Evaluasi Kegagalan Build GitHub Actions (Gambar 1)
- **Gejala**: Job gagal dalam waktu 19–20 detik.
- **Akar Masalah**:
  1. Pada run pertama (commit `6c4610a`), workflow memanggil action pihak ketiga `android-actions/setup-android@v3` yang mengalami kegagalan inisialisasi pada runner Ubuntu modern.
  2. Ketika tombol *Re-run* ditekan pada run yang lama, GitHub Actions mengeksekusi kembali commit lama (`6c4610a`), bukan commit terbaru yang sudah diperbaiki (`6ed908a`).
- **Solusi**:
  - Workflow diperbarui ke `actions/setup-java@v5` dan Node 22 murni tanpa action pihak ketiga yang usang.
  - User dipandu untuk menjalankan workflow baru melalui tombol **`Run workflow`** di branch `main` (bukan me-rerun histori lama).

---

## 3. Tindakan yang Telah Dilakukan (Sesuai Izin User)

1. [x] Membuat spesifikasi peran baru `.agents/skills/role-mobile/SKILL.md`.
2. [x] Mendaftarkan `/role-mobile` ke `.agents/roster.md`.
3. [x] Menyetel isolasi ekstensi Java di `.vscode/settings.json` agar laptop developer tetap ringan 100%.
4. [x] Memulihkan integritas `gradle-wrapper.properties` ke Gradle 8.14.3.
5. [x] Memutakhirkan workflow CI ke standar `actions/setup-java@v5`.

---

## 4. Status Roster KruAI Saat Ini

| Shortcut | Status | Cakupan Utama |
|---|---|---|
| `/role-asisten` | ✅ | Gerbang komunikasi, investigasi, perumusan brief |
| `/role-mobile` | ✅ **(BARU)** | Capacitor, Android build, izin perangkat, packaging APK |
| `/role-frontend` | ✅ | Antarmuka web, Cluv Framework, a11y, reactivity |
| `/role-backend` | ✅ | API, Supabase Edge Functions, integrasi AI & Tripay |
| `/role-database` | ✅ | Migrasi PostgreSQL, RLS, integritas data |
| `/role-inspektur` | ✅ | Audit end-to-end, kepatuhan anti-slop & parity |

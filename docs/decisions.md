# Catatan Keputusan Arsitektur (ADR)

Dokumen ini mencatat keputusan arsitektur, pilihan stack, dan trade-off yang disepakati bersama User.

---

## ADR 001: Strategi Single-Codebase Hybrid Mobile (Capacitor) & Unifikasi Backend
- **Tanggal**: 2026-10-27
- **Status**: Diterima (Accepted)
- **Pengusul**: `/role-asisten`
- **Pihak Terkait**: Pengguna, `/role-mobile`, `/role-frontend`, `/role-backend`

### Konteks
Setelah build APK Android mandiri berhasil dijalankan di GitHub Actions Runner, muncul pertimbangan arsitektural: apakah pengembangan mobile perlu dipecah menjadi dua divisi terpisah: Frontend Mobile dan Backend Mobile?

### Keputusan
1. **Backend Tetap Tunggal (Unified Headless BaaS)**:
   - Tidak ada pembuatan "Backend Mobile" terpisah.
   - Seluruh logika bisnis, database PostgreSQL, RLS, Edge Functions, kalkulasi kredit/koin, dan integrasi AI (Gemini/Qwen) tetap terpusat di Supabase. Web SPA dan Mobile APK mengonsumsi 100% API/RPC yang sama.
2. **Pemisahan Peran `/role-mobile`**:
   - Dibuat peran khusus `/role-mobile` (`.agents/skills/role-mobile/SKILL.md`) yang bertanggung jawab eksklusif atas:
     - Konfigurasi Capacitor (`capacitor.config.ts`), native permissions (kamera/storage di `AndroidManifest.xml`), dan sinkronisasi (`npx cap sync android`).
     - Alur Cloud CI/CD GitHub Actions (`.github/workflows/build-apk.yml`) agar laptop developer tetap ringan (zero local Gradle/Android Studio).
3. **Frontend Bertanggung Jawab Penuh atas UI Hybrid**:
   - Karena Capacitor menjalankan React SPA di dalam WebView Chromium modern, perbaikan tampilan mobile diserahkan ke `/role-frontend` dengan prinsip *Responsive Mobile-First*.

---

## ADR 002: Konsensus Tripartit Paritas Data (BE × Inspektur × FE) & Standar Bento Grid
- **Tanggal**: 2026-10-28
- **Status**: Diterima (Accepted)
- **Pengusul**: Pengguna & `/role-asisten`
- **Pihak Terkait**: `/role-backend`, `/role-inspektur`, `/role-frontend`

### Konteks
Pengguna mengevaluasi bahwa aplikasi hanya nyaman dilihat di Beranda (Dashboard), sedangkan halaman fungsional seperti Scan Wajah (`/face-scan`) dan Scan Komposisi (`/ingredient-scan`) terasa tidak enak dilihat di ponsel dan hambar di desktop. Pengguna memberikan instruksi kritis: *"Diskusikan dulu antara frontend, backend, dan inspektur supaya tidak ada data yang sudah backend tampilkan, tapi malah disembunyikan atau menghilang karena frontend."*

### Keputusan
1. **Invarian Paritas Data (Data Parity Invariant)**:
   - Dilarang keras memangkas atau menyembunyikan titik data yang telah disediakan oleh backend (`invoke-ai` / `sync_face_analysis_prompt.sql`).
   - Seluruh 14 data points klinis (skor keseluruhan, diagnosis kualitatif, tipe kulit, concerns, narasi Gen Z Pro, evaluasi 3 zona wajah lengkap [skor, status, temuan, analogi, action plan], hero active ingredients [nama, tujuan, prioritas], serta panduan do, reduce, avoid) **WAJIB 100% tetap dapat diakses oleh pengguna**.
2. **Adopsi Arsitektur Bento Grid Human Scale**:
   - Menggantikan tampilan vertikal panjang satu kolom dengan susunan Bento Modular:
     - **Card 1 (Hero Metric)**: Visual ringkas skor, tipe kulit, dan pesan naratif.
     - **Card 2 (Interactive 3-Zone)**: Pemilih zona (Dahi, Pipi/Hidung, Dagu) berbasis chips segmented control sehingga tidak menumpuk teks secara vertikal.
     - **Card 3 (Hero Actives & Formulasi)**: Grid kartu bahan aktif dengan badge prioritas kosmetik.
     - **Card 4 (Daily Habit Guide)**: Tab navigasi untuk Do, Reduce, dan Avoid.
3. **Standar Ergonomi Mobile-First**:
   - Area aksi pemindaian wajib menyediakan tombol rana kamera primer ramah jempol (touch target >= 44×44px), bukan hanya dropzone drag-and-drop desktop.


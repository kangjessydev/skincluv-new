# Laporan Sesi `/role-asisten`: Perencanaan 5 Agenda Kesiapan Produksi & Sinkronisasi AI Studio

- **Tanggal:** 2026-11-08
- **Peran:** `/role-asisten`
- **Status:** Selesai (Brief Fase 1 diterbitkan ke `/role-inspektur`)

---

## 1. Ringkasan Kebutuhan & Keputusan User
User menetapkan 5 agenda utama menuju rilis produksi penuh:
1. Memastikan seluruh fitur berjalan normal.
2. Memastikan kredit akun user yang digunakan sesuai dengan token yang dibeli di Google AI Studio (baik penyesuaian bobot kredit per fitur maupun kesesuaian tampilan pemakaian token/saldo di dashboard Admin dengan dashboard Google AI Studio).
3. Memastikan fungsi dan data tampil normal (bukan lagi data dummy statis).
4. Memastikan halaman Landing Page sudah resmi (tidak lagi data dummy), menggunakan teks dan angka resmi yang ditentukan langsung oleh user.
5. Rebuild aplikasi (APK Android) melalui GitHub Actions.

**Konfirmasi User:**
- Menyetujui pembagian kerja menjadi **4 Fase Bertahap (Phase-Gating)**:
  - **Fase 1 (`/role-inspektur`)**: Audit menyeluruh fitur, mekanisme token AI Studio, deteksi dummy di App/Admin, dan inventarisasi item Landing Page.
  - **Fase 2 (`/role-backend` & `/role-database`)**: Konfigurasi API Key Google AI Studio & penyelarasan perhitungan kredit user serta pencatatan token/biaya riil.
  - **Fase 3 (`/role-frontend` & `/role-copywriter`)**: Pembersihan sisa dummy di App/Admin & peresmian konten Landing Page sesuai teks resmi dari user.
  - **Fase 4 (`/role-mobile`)**: Sinkronisasi Capacitor & pemicuan rebuild APK via GitHub Actions.
- Memberikan izin delegasi berkelanjutan agar peran tujuan dapat menuntaskan fase tanpa berhenti di setiap sub-langkah kecil.

---

## 2. Artefak yang Dibuat / Diperbarui
1. [docs/conventions.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/conventions.md) — Sintesis konvensi stack proyek (React 19, Supabase RPC/Edge Functions, Cluv Framework) sebagai panduan ringkas bagi peran pembangun dan auditor.
2. [docs/handoff/011-asisten-to-inspektur-full-audit-production-readiness.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/011-asisten-to-inspektur-full-audit-production-readiness.md) — Brief penugasan Fase 1 untuk `/role-inspektur`.

---

## 3. Langkah Selanjutnya
Memanggil `/role-inspektur` untuk mengeksekusi [011-asisten-to-inspektur-full-audit-production-readiness.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/011-asisten-to-inspektur-full-audit-production-readiness.md).

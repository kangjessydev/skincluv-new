# Laporan Asisten: Konsensus Tripartit Paritas Data (BE × Inspektur × FE) & Standar Mobile-First Bento

- **Tanggal**: 2026-10-28
- **Peran**: `/role-asisten`
- **Topik**: Konsensus Arsitektur Paritas Data Backend, Pengalaman Belajar Desain Mobile WebView, dan Rencana Overhaul Bento Scanner
- **Target Pembelajaran KruAI**: Pedoman Kolaborasi Multi-Peran & Desain Single-Codebase Hybrid App

---

## 1. Latar Belakang & Keluhan Pengguna

Setelah rilis perdana APK Android Skincluv (`skincluv.apk`), pengguna memberikan evaluasi penting:
1. *Aplikasi hanya terasa nyaman di Beranda (Dashboard), sedangkan halaman sisanya (Scan Wajah, Scan Komposisi, Riwayat, dll.) benar-benar tidak enak dilihat di layar ponsel.*
2. *Di layar desktop pun, halaman-halaman selain Dashboard terasa hambar, kaku, dan jomplang.*
3. *Muncul pertanyaan arsitektural: apakah peran mobile developer perlu dipecah antara frontend dan backend?*

---

## 2. Pelajaran Arsitektur Berharga untuk KruAI (Lessons Learned)

### A. Kenapa Backend Mobile Tidak Perlu Dipecah?
- Proyek Skincluv menggunakan arsitektur **Single Source Headless BaaS** (Supabase PostgreSQL + Edge Functions).
- Web SPA dan Mobile APK mengonsumsi 100% endpoint, skema, tabel, dan RPC yang sama.
- **Kesimpulan**: Membagi backend menjadi web dan mobile adalah redundansi (*over-engineering*). `role-backend` dan `role-database` sudah mencakup kebutuhan web dan mobile secara serentak.

### B. Mengapa Tampilan Mobile Buruk jika Dashboard Sudah Bagus?
- Dashboard (`DashboardPage.tsx`) telah dirombak menggunakan standar **Bento Grid Human Scale** (proporsi v0, Plus Jakarta Sans, kartu terukur, ambient weather header, dan responsive mobile-first).
- Halaman lainnya masih mewarisi **"Legacy Desktop UI yang Dipaksakan ke Mobile"**:
  - Dropzone berbentuk kotak drag-and-drop desktop yang kaku, bukan tombol shutter kamera ramah jempol.
  - Hasil analisis ditumpahkan secara vertikal dalam teks panjang tanpa pengelompokan modular (*cognitive overload*).
  - Elemen interaktif memiliki touch-target < 44px yang sulit disentuh di layar sentuh.

---

## 3. Konsensus Tripartit: Menjamin Anti-Hilang Data (Data Parity Invariant)

Pengguna menegaskan: *"Diskusikan dulu antara frontend, backend, dan inspektur supaya tidak ada data yang sudah backend tampilkan, tapi malah disembunyikan atau menghilang karena frontend."*

### A. Kontrak Data Wajib Tampil (Audit Inspektur):
1. **Identitas & Metrik Utama**:
   - `overall_score` (Skor lingkaran 1–100)
   - `skin_status_title` (Judul diagnosis kualitatif)
   - `skin_type` (Oily, Dry, Combination, Normal, Sensitive)
   - `skin_concerns` (Badge masalah kulit)
   - `analysis_notes` (Narasi ramah Gen Z Pro)
2. **Evaluasi 3 Zona Wajah Klinis (`area_evaluations`)**:
   - Dahi (Forehead)
   - Hidung & Pipi (T-Zone & Cheeks)
   - Dagu & Sekitar Mulut (Chin & Perioral)
   *(Wajib memuat: skor zona, status, temuan biologis, analogi relatable, dan action plan).*
3. **Hero Active Ingredients (`recommended_ingredients`)**:
   - Nama bahan aktif, tujuan formulasi kosmetik, dan tingkat prioritas.
4. **Panduan Kebiasaan Sehari-hari**:
   - `tips_do` (Hal yang dianjurkan)
   - `tips_reduce` (Hal yang dikurangi)
   - `tips_avoid` (Hal yang dihindari)

### B. Solusi Desain Bento Frontend:
- Mengubah susunan vertikal panjang menjadi **4 Kartu Bento Modular**:
  - Card 1: Hero Metric (Skor + Status + Tipe Kulit + Narasi)
  - Card 2: Interactive 3-Zone Selector (Chip Dahi / Pipi / Dagu dalam 1 kartu ringkas)
  - Card 3: Hero Actives & Formulasi (Grid bahan aktif dengan badge prioritas)
  - Card 4: Action Guide (Checklist Do, Reduce, Avoid)
- **Hasil**: 100% data backend tetap tampil tanpa ada yang disembunyikan, tetapi sangat ramah jempol di HP dan aesthetic di desktop.

---

## 4. Langkah Lanjutan
- Membuka tiket handoff `docs/handoff/004-asisten-to-frontend-facescan-bento-overhaul.md`.
- Memulai eksekusi Langkah 1 pada `FaceScanPage.tsx`.

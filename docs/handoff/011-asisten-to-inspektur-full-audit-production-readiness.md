# Brief: Audit Menyeluruh Kesiapan Produksi, Deteksi Data Dummy (App & Landing Page), dan Kesiapan Ekonomi Token AI Studio (Fase 1)

- **Untuk:** role-inspektur   **Dari:** role-asisten   **Tanggal:** 2026-11-08
- **Disetujui user:** ya (Delegasi berkelanjutan disetujui untuk Fase 1)
- **Status:** done (Laporan tersimpan di docs/reports/2026-11-08-inspektur-audit-menyeluruh-kesiapan-produksi.md)

## Tujuan
Mengaudit secara menyeluruh (read-only) 4 area kritis: (1) kenormalan seluruh fitur end-to-end (UI ↔ Edge Function ↔ DB), (2) kesiapan struktur pencatatan token/kredit AI Studio di DB & Edge Function (`invoke-ai` & `/admin/financials`), (3) deteksi sisa data dummy statis di halaman App/Admin, dan (4) pemetaan lengkap seluruh teks/angka dummy di Landing Page (`src/pages/public/LandingPage.tsx`) agar siap diganti dengan teks resmi dari user.

## Konteks
- Rujukan utama: [project-brief.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/project-brief.md), [project-map.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/project-map.md), [conventions.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/conventions.md), dan [FE_BE_PARITY_MATRIX.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/architecture/FE_BE_PARITY_MATRIX.md).
- Profil risiko: **Ketat (Strict)**.
- User menghendaki 5 agenda besar yang dieksekusi bertahap (Fase 1 s/d Fase 4):
  1. Memastikan seluruh fitur berjalan normal.
  2. Memastikan kredit akun user yang digunakan sesuai dengan pemakaian token & saldo yang tampil di dashboard Google AI Studio (baik bobot potongan kredit per fitur maupun monitoring konsumsi token/deposit di Admin).
  3. Memastikan fungsi dan data tampil normal (bukan lagi dummy statis).
  4. Memastikan halaman Landing Page (`LandingPage.tsx` dan halaman publik terkait) sudah resmi (tidak lagi data dummy), menggunakan teks/angka resmi yang akan ditentukan oleh user.
  5. Rebuild aplikasi (APK) melalui GitHub Actions.

## Yang diminta
1. **Verifikasi Kesehatan Build, Tipe, & Kontrak Fitur (Agenda #1)**:
   - Jalankan `npm run build` (`tsc -b && vite build`) dan `npm run lint` (`oxlint`) untuk memverifikasi kondisi baseline kompilasi saat ini.
   - Periksa integritas rute di `src/App.tsx`, hooks utama di `src/hooks/`, dan Edge Functions di `supabase/functions/` (`invoke-ai`, `tripay-invoice`, `tripay-webhook`, `tripay-check-status`).
2. **Audit Alur Ekonomi Token & Kredit Google AI Studio (Persiapan Agenda #2)**:
   - Periksa bagaimana `supabase/functions/invoke-ai/index.ts` memanggil Gemini API, membaca `usageMetadata` (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`), menghitung biaya aktual (`cost_usd`), memotong kredit/kuota user (`ai_features.credit_cost`, `deduct_coins`, `deduct_quota`), dan mencatatnya ke tabel log/finansial (`ai_usage_logs`, `provider_deposit_ledgers`, dll.).
   - Periksa bagaimana halaman Admin (`AdminFinancialsPage.tsx`, `AdminModelsPage.tsx`, `AdminLogsPage.tsx`) menampilkan pemakaian token dan saldo deposit provider, lalu identifikasi celah/ketidaksesuaian antara yang dicatat di DB dengan metrik di dashboard Google AI Studio.
3. **Audit Deteksi Data Dummy Statis di App & Admin (Agenda #3)**:
   - Lakukan pencarian sistematis (`grep`) pada `src/pages/app/`, `src/pages/admin/`, dan `src/hooks/` untuk mendeteksi konstanta array mock, fallback angka palsu, atau fitur yang belum benar-benar mengambil/menyimpan data ke Supabase.
4. **Inventarisasi Lengkap Elemen Dummy di Landing Page & Halaman Publik (Agenda #4)**:
   - Bedah `src/pages/public/LandingPage.tsx` (serta komponen pendukungnya di `src/components/landing/` bila ada, dan `PublicPricingPage.tsx` / `AboutPage.tsx`) baris demi baris.
   - Buat daftar tabel berisi semua klaim angka statis, badge, statistik pengguna, contoh skor/kartu simulasi, testimoni, atau harga yang saat ini masih hardcoded/dummy, supaya user tinggal memberikan teks/angka resmi penggantinya sebelum diserahkan ke `/role-frontend` & `/role-copywriter`.
5. **Tulis Laporan & Handoff Berikutnya**:
   - Simpan laporan hasil audit ke `docs/reports/2026-11-08-inspektur-audit-menyeluruh-kesiapan-produksi.md`.
   - Buat draft rekomendasi handoff untuk Fase 2 (`/role-backend` & `/role-database`) dan Fase 3 (`/role-frontend` & `/role-copywriter`).

## Di luar cakupan
- Dilarang mengubah satu baris pun kode di `src/`, `supabase/`, atau `.github/` (Mode Audit Read-Only).
- Jangan menjalankan workflow GitHub Actions dulu sebelum Fase 2 dan Fase 3 selesai.

## Kriteria selesai
- Kompilasi `npm run build` dan `npm run lint` terverifikasi dengan bukti output terminal.
- Seluruh titik data dummy (jika ada) di `src/pages/app/` dan `src/pages/admin/` tercatat lengkap dengan `file:baris`.
- Daftar lengkap seluruh teks/angka/item di `LandingPage.tsx` yang perlu diganti dengan versi resmi user tersaji rapi dalam bentuk tabel yang mudah diisi/diputuskan oleh user.
- Analisis teknis mekanisme sinkronisasi kredit user ↔ token Google AI Studio di `invoke-ai` dan `AdminFinancialsPage.tsx` terdokumentasi lengkap dengan `file:baris`.
- Laporan tersimpan di `docs/reports/2026-11-08-inspektur-audit-menyeluruh-kesiapan-produksi.md`.

## Pertanyaan terbuka
- (Tidak ada — user telah menyetujui urutan eksekusi dan memberikan izin delegasi penuh untuk Fase 1).

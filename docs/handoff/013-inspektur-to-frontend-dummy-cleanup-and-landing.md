# Handoff: Pembersihan Sisa Data Dummy di App/Admin & Peresmian Landing Page (Fase 3)

- **Dari:** role-inspektur
- **Untuk:** role-frontend (koordinasi dengan role-copywriter bila diperlukan)
- **Tanggal:** 2026-11-08
- **Status:** in_progress (Bagian A Pembersihan Data Dummy App/Admin/Kontak selesai; Bagian B Teks Resmi Landing Page menunggu teks dari user)
- **Laporan Audit Terkait:** [2026-11-08-inspektur-audit-menyeluruh-kesiapan-produksi.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/reports/2026-11-08-inspektur-audit-menyeluruh-kesiapan-produksi.md)

---

## 1. Konteks & Temuan Audit
Berdasarkan audit Fase 1 atas Agenda #3 (*"memastikan fungsi dan data tampil normal bukan lagi dummy statis"*) dan Agenda #4 (*"memastikan halaman landing sudah resmi"*), ditemukan daftar titik dummy/statis berikut yang wajib dibersihkan:

### A. Sisa Data Dummy di Halaman App, Admin, & Kontak
1. **[src/pages/app/MissionsPage.tsx:171](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L171)**:
   - Fallback `setTotalEarned(coinBalance?.balance || 387)` menampilkan angka dummy `387 Credits`. Wajib diubah menjadi `0`.
2. **[src/pages/app/MissionsPage.tsx:314-325](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L314-L325)**:
   - Array `checkinDays` (H1 s/d H7) masih meng-hardcode H1 & H2 sebagai `isClaimed: true` dan H3 sebagai `isToday: true`. Wajib dihitung secara dinamis dari riwayat klaim `daily_login` aktual pengguna.
3. **[src/pages/app/DashboardPage.tsx:49-81](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/DashboardPage.tsx#L49-L81) & [253-260](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/DashboardPage.tsx#L253-L260)**:
   - `getEnvironmentalWeather()` meng-hardcode suhu & indeks UV (`26°C · UV 3.2`, `31°C · UV 7.8`, dst.) hanya dari jam lokal perangkat. Wajib dihubungkan ke data cuaca real-time (misal Open-Meteo) atau diubah menjadi indikator ritme sirkadian/biologis kulit tanpa angka suhu palsu.
4. **[src/pages/public/ContactPage.tsx:27-30](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx#L27-L30) & [81](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx#L81)**:
   - `handleSubmit` belum menyimpan pesan ke database Supabase, dan nomor WhatsApp masih `6281234567890`.
5. **[src/pages/admin/AdminFinancialsPage.tsx:188-205](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx#L188-L205), [998-1002](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx#L998-L1002), & [1832-1834](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx#L1832-L1834)**:
   - Simulator diskon memakai `simPricePro = 69000` (hardcoded, bukan dari `tiers` DB), badge profitabilitas fitur hardcoded `Margin Super Tebal (>90%)`, dan perlu menampilkan breakdown `thoughtsTokenCount` / rekonsiliasi saldo AI Studio secara akurat.
6. **Rute Preview `/v2/admin/*` ([src/App.tsx:155-172](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/App.tsx#L155-L172)) & Unused Imports**:
   - Bersihkan 30 warning linter `oxlint` dan tindak lanjuti rute preview `/v2/admin/*` sesuai keputusan user.

### B. Peresmian Konten Landing Page ([src/pages/LandingPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx))
- Mengganti item `LP-01` s/d `LP-07`, `PUB-01`, dan `PUB-02` (termasuk 3 testimoni fiktif Nadia Amanda, Tara Clarissa, Rania Putri, serta kontradiksi klaim *"tanpa skor angka /100"*) dengan **teks resmi yang ditetapkan langsung oleh user**.

---

## 2. Di Luar Cakupan
- Perubahan logika Edge Function `invoke-ai` (ditangani di Handoff 012 oleh `/role-backend`).
- Eksekusi workflow GitHub Actions Android APK (ditangani di Fase 4 oleh `/role-mobile`).

---

## 3. Kriteria Selesai
- Tidak ada lagi angka fallback palsu (`387`), streak hardcoded H1-H2, atau form kontak tanpa penyimpanan di aplikasi.
- Seluruh teks di `LandingPage.tsx` dan `ContactPage.tsx` telah menggunakan teks dan kontak resmi dari user serta patuh Invarian 19 (Non-Therapeutic Boundary) & Invarian 23 (Canonical Vocabulary).
- `npm run build` dan `npm run lint` lolos bersih (0 error, 0 warning).

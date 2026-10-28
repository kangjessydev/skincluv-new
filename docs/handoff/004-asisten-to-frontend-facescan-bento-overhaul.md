# Handoff: 004-asisten-to-frontend-facescan-bento-overhaul

- **Dari Peran**: `/role-asisten`
- **Ke Peran**: `/role-frontend`
- **Tanggal**: 2026-10-28
- **Status**: completed
- **Tujuan**: Merombak total `src/pages/app/FaceScanPage.tsx` menjadi standar Bento Grid Human Scale dengan UX Mobile-First, mempertahankan 100% data klinis backend tanpa ada yang hilang.

---

## 1. Konteks & Mandat Paritas Data
Merujuk pada konsensus di `docs/reports/2026-10-28-asisten-konsensus-bento-scanner-dan-mobile-parity.md`, antarmuka baru wajib memuat:
1. `overall_score` (Skor lingkaran besar) & `skin_status_title`
2. `skin_type` badge & `skin_concerns` tags
3. `analysis_notes` (Narasi lengkap)
4. Evaluasi 3 zona wajah (`area_evaluations`: Dahi, Hidung/Pipi, Dagu) dengan skor, status, finding, analogi, dan action plan.
5. Bahan aktif (`recommended_ingredients`) dengan prioritas dan fungsi.
6. Tips harian (`tips_do`, `tips_reduce`, `tips_avoid`).

---

## 2. Cakupan Perubahan UI (In Scope)
1. **Stage Upload / Kamera**:
   - Tampilan ramah jempol (Thumb-Friendly): Tombol aksi utama "Buka Kamera" (`capture="user"`) dan "Galeri Foto" (minimal 48×48px).
   - Preview foto proporsional dengan rasio wajah yang bersih.
   - Pilihan "Ganti Foto" dan "Mulai Analisis Wajah" yang jelas.
2. **Stage Scanning**:
   - Indikator pemindaian bento yang halus, animasi pulsasi bertahap, dan status teks real-time yang menenangkan.
3. **Stage Result (Bento Modular Layout)**:
   - Menggunakan Layout Bento Cluv murni (`.cluv-canvas-grid`, `.cluv-bento-grid`, `.cluv-bento-card`).
   - Card Hero: Metrik Skor + Status Kulit + Profil Tipe Kulit.
   - Card 3 Zona Interaktif: Selector tab/chip Dahi / Pipi & Hidung / Dagu.
   - Card Hero Actives: Bahan aktif dengan badge prioritas (Essential/Recommended/Optional).
   - Card Panduan Harian: Checklist Do, Reduce, Avoid.
   - Tombol Tindak Lanjut: "Konsultasikan ke Skinsistant AI" & "Scan Ulang / Ambil Foto Baru".

---

## 3. Kriteria Selesai (Definition of Done)
- [x] 100% data backend tetap tampil utuh (terverifikasi oleh inspektur paritas).
- [x] Tampilan responsif di mobile (HP layar 360px - 430px) maupun desktop (>960px).
- [x] Lolos uji `oxlint` (0 warning) dan `tsc -b && vite build` (0 error).
- [x] Aset disinkronkan ke native Android via `npx cap sync android`.


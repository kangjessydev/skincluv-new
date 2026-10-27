# Brief: Audit Mutu UI Anti-AI Slop & Integritas Antarmuka Skincluv

- **Untuk:** role-inspektur   **Dari:** role-asisten   **Tanggal:** 2026-10-27
- **Disetujui user:** Ya (Opsi 1: Pengerjaan Terpandu per Langkah)
- **Status:** done (Laporan tersimpan di docs/reports/2026-10-27-inspektur-audit-ui-anti-slop.md)

## Tujuan
Melakukan audit menyeluruh terhadap komponen antarmuka pengguna (`src/pages/` dan `src/components/`) untuk mendeteksi indikasi *AI-Slop*, pelanggaran aksesibilitas, dan ketidakpatuhan terhadap doktrin Cluv Framework.

## Konteks
- **Profil Risiko:** Ketat (Strict).
- **Mode Audit:** **Audit-Only (Dilarang keras mengubah satu baris pun kode produksi di `src/`)**.
- **Acuan Standar:**
  - [.agents/references/anti-ai-slop-ui.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/.agents/references/anti-ai-slop-ui.md) (diadopsi terbuka dari Vercel Web Interface Guidelines).
  - [docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md) (Doktrin Cluv Micro-Framework).
  - [docs/project-brief.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/project-brief.md) & [docs/project-map.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/project-map.md).

## Yang Diminta
1. **Audit Elemen Interaktif & Semantik:**
   - Deteksi elemen non-semantik yang memiliki interaksi klik (seperti `<div onClick>`, `<span onClick>`).
   - Periksa keberadaan atribut `type="button"` pada elemen `<button>` agar tidak memicu submit formulir yang tidak disengaja.
2. **Audit Aksesibilitas (A11y) & Navigasi Keyboard:**
   - Periksa ketersediaan fokus (`focus-visible`) dan atribut `aria-label` pada tombol berbasis ikon saja.
   - Deteksi komponen interaktif yang tidak dapat diakses menggunakan tombol Tab / Enter / Spasi.
3. **Audit Kepatuhan Styling Cluv Framework:**
   - Deteksi penggunaan warna hex hardcoded (misal `#1f9d97`, `#ffffff`) di file `.tsx` yang seharusnya memakai CSS variable `var(--cluv-*)`.
   - Deteksi tag `<style>` lokal di dalam komponen atau inline `style={{ ... }}` yang mengatur tata letak/warna.
4. **Audit Layout Stability & Visual Polish:**
   - Deteksi potensi Cumulative Layout Shift (CLS) pada pemuatan gambar atau data dinamis.
5. **Format Pelaporan Temuan:**
   - Kelompokkan temuan berdasarkan tingkat keparahan (*High Signal-to-Noise*): Critical / Warning / Polish Suggestion, lengkap dengan bukti `file:baris`.

## Di Luar Cakupan
- **Dilarang mengubah atau memperbaiki kode produksi di `src/` atau `supabase/`** (perbaikan akan disalurkan ke `role-frontend` setelah disetujui user).
- Dilarang mengubah skema basis data atau tabel Supabase.

## Kriteria Selesai
- Dokumen laporan audit tersusun lengkap dan disimpan di `docs/reports/2026-10-27-inspektur-audit-ui-anti-slop.md`.
- Setiap butir temuan memiliki bukti konkret `file:baris` yang dapat diverifikasi secara langsung.
- Disertai rekomendasi handoff terstruktur untuk `role-frontend`.

## Pertanyaan Terbuka
- Tidak ada.

# Peran yang Direncanakan (belum dibuat)

Catatan spesifikasi dari diskusi, supaya tidak lupa. Semua peran mengikuti
`rules/team-protocol.md`. Tulis `SKILL.md` penuh hanya setelah tahap 1 terbukti berguna.

## role-init (proyek baru)
Tanya kebutuhan; buat `project-brief` (termasuk profil risiko), kontrak awal, SOP singkat
bernomor, glossary, `project-map` awal. Stack dibahas bersama `role-research`.

## role-research
Riset sampai selesai; tanya tujuan dulu. Untuk stack proyek baru: rekomendasi berdasar
kebutuhan, bukan popularitas. Kriteria tertulis: kesesuaian fitur, maintenance aktif
(rilis terakhir, isu), komunitas, dokumentasi. **Wajib cek sumber langsung** (registry,
repo, docs resmi; Context7/web), cantumkan tanggal. Keputusan + alternatif ditolak
dicatat di `decisions.md`.

## role-blueprint
Rancangan kasar dan **kontrak** (skema API/DB) di `docs/contract/` sebagai sumber
kebenaran FE/BE/inspektur.

## role-frontend / role-backend / role-database
Pembangun. Aturan kualitas kode di protocol berlaku penuh.
- **role-frontend**: mencakup UI dan styling. Wajib mematuhi kerangka kerja `.agents/references/anti-ai-slop-ui.md` (semantik HTML tombol vs link, aria-label, penanganan CLS gambar, tidak ada `transition: all`, dan flex `min-w-0`). Wajib memiliki checklist *micro-interactions* (transisi halus 150-300ms, hover/focus feedback, skeleton loading, dialog open/close transition). Wajib mendukung `prefers-reduced-motion`.
- Wajib memperbarui kontrak dan peta saat mengubah struktur.

## role-motion (konsultan/auditor animasi)
Hanya membaca dan membuat rekomendasi spesifikasi gerak (handoff ke `role-frontend`).
- Menentukan arsitektur motion: kapan cukup CSS/Tailwind transition, kapan butuh library (Framer Motion / Motion One / GSAP).
- Menetapkan skala timing dan easing curves (misal: standard cubic-bezier, spring physics) agar UI konsisten dan tidak berlebihan (mencegah AI slop animasi).
- Memastikan performa 60fps (hindari menganimasikan properti layout `width`/`height`/`top`, prioritaskan `transform` dan `opacity`).
- Memastikan kepatuhan aksesibilitas (`prefers-reduced-motion`).

## role-inspektur
Hanya membaca. Menelusuri data tampilan FE sampai endpoint dan tabel DB.
- **Audit Anti-AI Slop:** Memverifikasi komponen UI terhadap aturan di `.agents/references/anti-ai-slop-ui.md` (audit keyboard focus ring, semantik tombol, layout shift, teks truncate).
- **Audit Sinkronisasi Data:** Menelusuri data FE sampai ke DB. Tanda dummy: array literal di komponen, mock/faker/lorem/TODO, endpoint tak pernah dipanggil. Hasil: matriks UI → API → DB → status (nyata/dummy/putus).
- Cek duplikasi nama, kode mati (alat: jscpd, knip/ts-prune), kesesuaian peta dengan kode, handoff menggantung.

## role-security
Hanya membaca dan melapor. Kedalaman mengikuti profil risiko. Bukti yang bisa dijalankan:
npm audit/osv-scanner (dependensi), gitleaks (rahasia), Semgrep (pola kode), acuan OWASP
Top 10. Periksa juga skill/MCP yang terpasang. Catat batas: bukan pengganti audit manusia
untuk data sensitif/uang.

## role-bug-hunter
Cari bug dengan langkah reproduksi dan bukti; handoff ke pembangun (file:baris). Tidak mengubah kode.

## role-devops
Tes, build, CI, optimasi sebelum production, analisis ukuran bundle. Temuan optimasi kode
diserahkan ke pembangun lewat handoff.

## role-simplifier
Setelah fitur jalan: hapus duplikasi, kode mati, over-engineering; tes tetap hijau; laporkan
ukuran sebelum/sesudah.

## role-retro
Baca `Log Penyimpangan` di laporan. Jika satu langkah muncul berulang, usulkan
penambahan ke `SKILL.md` (butuh persetujuan user). Juga periksa kualitas peran dengan
uji proyek kecil berisi bug/dummy yang sengaja ditanam.

## role-help
Tampilkan `roster.md` sebagai kartu contekan.

## role-copywriter / role-marketer
Teks produk dan strategi pemasaran. Menyusul belakangan.

## Ide tooling (bukan peran)
- Hooks (`hooks.json`): jalankan lint/tes tiap kode berubah.
- Linter, formatter, characterization test untuk proyek lanjutan yang belum punya tes.

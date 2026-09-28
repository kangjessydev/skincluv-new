# [RFC 018] Frontend UI/UX Overhaul & Anti-AI Slop Design System

**Target Reviewer**: Claude (Chief Software Architect & Design Reviewer) + ChatGPT (UX Flow & Accessibility Auditor)  
**Tanggal**: 2026-09-29  
**Status Codebase**: React 19 + Vite 8 SPA + Pure Vanilla CSS (`src/index.css` + page-level styles) + Supabase  

---

## 1. Latar Belakang & Keluhan Pengguna (The Problem Statement)

Aplikasi **Skincluv** secara fungsionalitas backend, database, Edge Functions, dan kepatuhan regulasi sudah siap dan stabil. Namun dari sisi **Frontend UI & UX**, antarmuka saat ini dikritik keras oleh pengguna dengan alasan:
1. **"Tampilan sangat AI Slop"**: Penuh dengan kotak-kotak bertumpuk (*card soup*), border 1px dan gradient di mana-mana, badge kecil-kecil 11px bertebaran dengan aneka warna pelangi (amber, sky, emerald, slate), serta ikon di samping setiap teks.
2. **"Kecil-kecil dan Sesak"**: Tidak ada ruang bernapas (*whitespace*). Tipografi dipadatkan, padding sempit, dan ukuran font tidak konsisten.
3. **"Campur Aduk & Terpecah (Inconsistent Design System)"**:
   - Di `index.html`: Di-load font **Fraunces** (serif luxury) dan **Inter** (sans-serif bersih).
   - Di `src/index.css`: Masih dideklarasikan font **Quicksand** (bubbly/playful) dengan palet Sky Blue ala Material 3 (`--color-primary: #006591;`).
   - Di `AuthLayout` & `LoginPage`: Telah mengadopsi gaya editorial minimalis karya Claude (font Fraunces 32px, Inter, Deep Teal `#0B4F5C`, Warm Peach `#E8A87C`, Cream `#FAF7F1`, garis tipis, lapang).
   - Di `DashboardPage`, `FaceScanPage`, `IngredientScanPage`, `ProfilePage`: Masih menggunakan ratusan baris inline `<style>` lama yang memakai pill button 9999px, kartu kaca (`glass-card`), badge warna-warni, dan styling terfragmentasi.

Skincluv adalah platform kesehatan & perawatan kulit personal. Estetika yang dibutuhkan adalah **Modern Minimalist / Editorial Botanical Luxury** (seperti perpaduan *Aesop, Glossier, Apple Health,* dan *Linear*) — tenang, elegan, lapang, terpercaya, dan sangat manusiawi, **BUKAN** dashboard crypto, SaaS AI generik, atau tech demo yang ramai visual noise.

---

## 2. Analisis Anatomi "AI Slop" pada Skincluv Saat Ini

| Gejala AI Slop | Contoh Nyata di Skincluv Saat Ini | Solusi Anti-AI Slop yang Dibutuhkan |
| :--- | :--- | :--- |
| **Card Soup (Kotak dalam Kotak)** | Dashboard membungkus skor kulit, koin, tombol scan, dan riwayat ke dalam 8 kartu berbeda dengan border dan background berbeda-beda. | **Content-First Layout**: Hapus border kartu yang tidak perlu. Gunakan *whitespace* (margin 32px–48px) dan garis batas halus (*hairline divider*) untuk memisahkan section. |
| **Micro-Typography (Font Kerdil)** | Banyak label berukuran 10px–11px, `font-weight: 800`, uppercase, dipadatkan di dalam badge kecil. | **Legible Typography Scale**: Body minimal 14px–15px (line-height 1.6). Subtitle 16px. Section title 20px–24px. Hero title 32px–40px Fraunces serif. Teks di bawah 13px hanya untuk disclaimer hukum. |
| **Rainbow Badge Disorder** | Dalam satu layar ada badge warna Amber, Sky Blue, Rose, Emerald, Slate, dan Purple secara bersamaan. | **Palette Restraint (Max 3 Tones)**: Latar Cream/Off-white (`#FAF7F1` / `#FFFFFF`), Teks Deep Ink (`#1A2B2B`), dan Aksen Deep Teal (`#0B4F5C`) / Muted Peach (`#E8A87C`). Status hanya memakai shade desaturasi halus. |
| **Decorative Icon Clutter** | Setiap judul section diberi ikon kecil di depannya (`<Activity size={18} /> Tipe Kulit`, `<AlertCircle size={18} /> Masalah Kulit`). | **Restraint**: Hapus ikon dekoratif di depan heading teks. Ikon hanya dipakai jika memiliki fungsi interaktif (tombol, input slot, atau navigasi esensial). |
| **Bentuk Bentuk Bertabrakan** | Tombol di scan wajah berbentuk kapsul bulat 9999px (*pill*), sedangkan input di login berbentuk rounded rect 10px, dan kartu berbentuk rounded 24px. | **Unified Geometry**: Tetapkan radius seragam di seluruh aplikasi: Button & Input = 10px–12px, Card = 16px, Floating Modal = 20px. Tinggalkan bentuk kapsul 9999px yang kekanak-kanakan. |

---

## 3. Pertanyaan Kritis untuk Claude (Chief Architect & Design Reviewer)

Mohon berikan panduan desain dan spesifikasi yang tajam dan tegas:

1. **The Master Design System Foundation (`src/index.css`)**:
   - Bagaimana arsitektur token CSS global yang benar untuk mematikan sisa-sisa Quicksand dan menyatukan seluruh aplikasi di bawah fondasi **Fraunces + Inter**?
   - Tolong rumuskan set token CSS standar: Colors (Ink, Canvas, Cream, Spruce Teal, Peach), Typography scale, Spacing scale (4, 8, 16, 24, 32, 48, 64), Elevation/Shadows (sangat subtle, bukan shadow biru terang), dan Border Radii.

2. **Daftar Komponen Inti Bersama (Shared Core Components)**:
   - Komponen dasar apa saja yang harus kita standarkan ke dalam folder `src/components/ui/` agar halaman-halaman tidak lagi menulis CSS inline sendiri? (Misal: `Button`, `Container`, `SectionHeader`, `Badge`, `EmptyState`).
   - Bagaimana panduan ukuran tombol: apakah 48px tinggi seragam untuk touch target ponsel?

3. **Restrukturisasi Halaman Utama (Page-by-Page Overhaul Plan)**:
   - Bagaimana urutan prioritas pembersihan antarmuka dari yang paling krusial bagi user:
     - **Fase A**: `DashboardPage.tsx` (Wajah pertama pengguna saat login).
     - **Fase B**: `FaceScanPage.tsx` & `IngredientScanPage.tsx` (Fitur unggulan utama).
     - **Fase C**: `ProfilePage.tsx` & `ScanHistoryPage.tsx`.
   - Untuk Dashboard, bagaimana merancang tampilan yang tenang, lapang, dan berkelas seperti jurnal perawatan kulit pribadi tanpa terlihat seperti dashboard analitik saham?

4. **"Anti-AI Slop Rules" untuk `.agents/rules/`**:
   - Tolong buatkan 5–7 butir aturan mutlak (Design Guidelines) yang bisa dimasukkan ke dalam panduan Antigravity IDE, sehingga setiap kali saya atau AI lain meng-generate kode UI di masa depan, sistem **DILARANG KERAS** kembali menghasilkan UI kerdil, kotak-kotak berlebihan, atau warna pelangi.

---

## 4. Invarian yang Tetap Wajib Dijaga (Zero Regression)
Perubahan UI/UX ini murni di lapisan presentasi (CSS, HTML semantic layout, dan komponen UI):
- **DILARANG MERUSAK**: RPC call Supabase (`deduct_coins`, `deduct_quota`, `get_temporal_scan_comparison`, dll).
- **DILARANG MENGUBAH**: Invarian 1 (`universal_ai` aktif) dan Invarian 2 (`face_validation` 0 kredit).
- **DILARANG MENGGUNAKAN REGISTER MEDIS**: Tetap patuhi Invarian 19 & Leksikon Regulasi (gunakan *Skin Assessment, Pemetaan Kondisi Kulit*, bukan *Diagnosis*).
- **DILARANG MENAMBAH RUNTIME DEPENDENCY BERAT**: Tidak perlu menambahkan UI library raksasa jika bisa diselesaikan dengan CSS token yang bersih dan native HTML/React.

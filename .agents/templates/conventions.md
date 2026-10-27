# Konvensi Proyek & Panduan Stack (Project Conventions)

_Disintesis oleh `role-asisten` dari kerangka referensi arsitektur, anti-slop UI, dan database._  
_Terakhir diverifikasi: YYYY-MM-DD | Stack Terpilih: `<Framework Backend>` + `<Framework Frontend>` + `<Database>`_

---

## 1. Stack & Versi Terverifikasi (Live Registry Ping)
- **Backend:** `<Nama Framework/Library>` (v`<Versi Terverifikasi>`)
- **Frontend:** `<Nama Framework/Library>` (v`<Versi Terverifikasi>`)
- **Styling:** Tailwind CSS / Vanilla CSS / Design System
- **Database:** PostgreSQL / MySQL / SQLite (v`<Versi>`)
- **ORM / Query Builder:** Prisma / Drizzle / Eloquent / SQLAlchemy

---

## 2. Struktur Proyek & Layering (Feature-Based)
Aturan peletakan kode untuk proyek ini:
- Lokasi Fitur: `src/features/<feature-name>/` atau `app/Features/<feature-name>/`
- Pembagian 4-Layer:
  1. Route Handler: ...
  2. Controller / Action: ... (Dilarang ada query database)
  3. Service Layer: ... (Tempat 100% logika bisnis)
  4. Repository / Model: ... (Tempat eksekusi query ORM/SQL)

---

## 3. Penerjemahan Prinsip Arsitektur ke Sintaks Stack Terpilih

### A. Validasi Input & Keamanan (Threat Boundary)
- **Library/Fitur Validasi:** (Contoh: Laravel FormRequest / Zod / Pydantic)
- **Mitigasi IDOR:** Semua query wajib mengunci kepemilikan tenant/user:
  `...` *(Tuliskan contoh cuplikan kode nyata sesuai ORM proyek)*
- **Rate Limiting:** Middleware rate limit pada auth endpoint:
  `...`

### B. Optimasi Database & Integritas Skema
- **Pencegahan N+1 Query:** Cara eager-loading relasi di ORM proyek ini:
  `...` *(Contoh: Product::with('category') di Eloquent atau prisma.product.findMany({ include: { category: true } }))*
- **Pagination Standar:** Gunakan Cursor Pagination:
  `...`
- **Konvensi Kolom Wajib:** Setiap tabel wajib punya `id`, `created_at`, `updated_at`, dan foreign key bertipe data seragam.

### C. Komponen Frontend & Standar Anti-AI Slop
- **Semantik Elemen:** Semua tombol aksi wajib `<button>`, link navigasi wajib `<a>`/`<Link>`.
- **Status Fokus:** Wajib class `:focus-visible` (dilarang `outline-none` tanpa ring).
- **Animasi:** HANYA `transform` dan `opacity` (dilarang `transition: all`).
- **Layout Stability:** Gambar wajib menyertakan atribut rasio aspek atau `width`/`height` eksplisit.

---

## 4. Cuplikan Kode Baku (Golden Code Sample)
Contoh satu alur lengkap (Controller + Service + UI Component) yang menjadi standar acuan untuk ditiru oleh peran pembangun:
```
// Cuplikan kode acuan di sini
```

---
name: role-backend
description: >-
  Pembangun logika bisnis dan API backend. Menerapkan arsitektur 4 lapis (Controller, Service,
  Repository, Schema), modul berbasis fitur (Vertical Slice), validasi ketat, mitigasi race condition
  & idempotency, dan verifikasi versi dependensi via live registry ping.
---

# role-backend

Ikuti `.agents/rules/team-protocol.md`. Peran pembangun: berwenang membuat dan mengubah berkas logika bisnis, API routing, service, controller, dan repository di folder backend (`src/`).

## Batas Wewenang & Tanggung Jawab
- **Wewenang:** Membuat dan mengubah kode backend (API endpoints, controllers, services, database queries di layer repository, schema validator, dan middleware).
- **Bukan Wewenang:** Tidak mengubah skema database secara langsung (buat handoff ke `role-database`) dan tidak mendesain markup UI frontend (buat handoff ke `role-frontend`).

---

## Alur Kerja role-backend

### 1. Baca Masukan Wajib (Progressive Reading)
Sebelum menulis kode:
1. `docs/project-brief.md` (memahami proses bisnis dan profil risiko).
2. `docs/conventions.md` (arsitektur stack backend terpilih, contoh *golden code*, konvensi penamaan).
3. `docs/contract/` (terutama `database-schema.md` dari database dan spesifikasi endpoint API).
4. Handoff berstatus `open` yang ditujukan ke `role-backend`.
5. Dokumen acuan standar:
   - `.agents/references/backend-architecture-best-practices.md` (Arsitektur 4-Lapis, Anti-N+1, Proteksi Race Condition, Idempotency).
   - `.agents/references/feature-matrix.md` (Skenario alur logika bisnis & kriteria selesai).

### 2. Pra-Pemeriksaan & Pemeriksaan Skala (Context Guard)
- Cari kode backend yang sudah ada (`grep` routes, services, helpers). Jangan membuat fungsi duplikat jika fungsi serupa sudah ada di repositori.
- **Pemeriksaan Skala:** Jika tugas menyentuh lebih dari 3 file atau diperkirakan >200 baris kode, pecah tugas menjadi beberapa fase (misal: Fase 1: Schema validator & Repository query, Fase 2: Service business logic & Transaksi, Fase 3: Controller HTTP handler & Route wiring).

### 3. Ajukan Rencana & Tunggu Persetujuan User
Sampaikan rencana implementasi secara terstruktur kepada user:
- Endpoint API yang akan dibuat/diubah (Method, URL, Auth Guard).
- Struktur layer yang disentuh (Controller ➔ Service ➔ Repository).
- Dependensi baru yang dibutuhkan (jika ada, cantumkan hasil *Live Registry Ping*).
- **TUNGGU PERSETUJUAN USER** sebelum mengeksekusi penulisan kode.

### 4. Eksekusi Kode Berstandar Produksi
Patuhi aturan rekayasa perangkat lunak berikut:

1. **Pemisahan 4 Lapis Tegas (Strict Layering):**
   - **Routes:** Hanya mendaftarkan URL, HTTP verb, middleware validasi, dan controller handler.
   - **Controller:** Mengekstrak payload dari request, memanggil validator, memanggil service, dan mengembalikan HTTP response status (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`). **Dilarang keras ada query database atau kalkulasi bisnis di controller!**
   - **Service:** Tempat semua logika bisnis, kalkulasi nilai, pemanggilan API eksternal, dan penanganan transaksi.
   - **Repository:** Satu-satunya lapisan yang mengeksekusi query database / ORM.
2. **Validasi Payload Masukan Ketat:**
   - Gunakan schema validator (misal Zod, Joi, FormRequest).
   - Sanitasi input untuk mencegah XSS, SQL Injection, dan Mass Assignment.
3. **Pencegahan Masalah N+1 Query:**
   - Dilarang keras melakukan query database di dalam looping (`for`, `forEach`, `map`).
   - Gunakan batching query (`WHERE id IN (...)`) atau eager-loading bawaan ORM.
4. **Proteksi Concurrency, Race Condition & Idempotency:**
   - Gunakan *Database Transaction* (`BEGIN ... COMMIT`) untuk operasi multi-tabel.
   - Pada endpoint kritis (seperti pembayaran, checkout, atau pengurangan kuota), terapkan pengecekan **Idempotency Key** dan penanganan *Optimistic Concurrency Control* (verifikasi versi baris).
5. **Verifikasi Dependensi Real-Time (Live Registry Ping):**
   - Dilarang menebak nama dan versi paket npm/pip dari memori training.
   - Jalankan `npm view <package> version` di terminal untuk mendapatkan versi stabil terbaru sebelum menambahkannya ke `package.json`.

### 5. Verifikasi & Bukti Konkret
Uji kebenaran kode yang ditulis secara lokal:
- Jalankan test runner atau script verifikasi (misal: `npm test`, `npx vitest run`, atau `npm run build`).
- Jika endpoint baru dibuat, verifikasi via curl atau script uji lokal, lalu lampirkan output respons HTTP (status code, body JSON).
- Catat bukti konkret `file:baris` dan hasil terminal pada laporan.

### 6. Sinkronisasi Kontrak & Dokumentasi
1. Perbarui `docs/contract/api-specs.md` dengan endpoint baru, struktur request body, dan format response.
2. Perbarui `docs/project-map.md` (petakan route dan controller baru).

### 7. Laporan & Handoff
1. Buat laporan sesi di `docs/reports/YYYY-MM-DD-backend-<topik>.md` mengacu pada template `.agents/templates/report.md`.
2. Buat tiket handoff:
   - Ke `role-frontend` di `docs/handoff/YYYY-MM-DD-backend-to-frontend-<topik>.md` (memuat daftar endpoint, parameter query, dan format response).
   - Ke `role-inspektur` jika endpoint siap diaudit secara end-to-end.

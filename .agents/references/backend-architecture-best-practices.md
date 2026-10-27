# Praktik Terbaik Arsitektur Backend & Database (Quality & Architecture Guidelines)

> **Atribusi Sumber Referensi:**  
> Standar rekayasa dalam dokumen ini disintesis dan diselaraskan secara terbuka dari:
> 1. **Layered & Feature-Based Architecture:** Diadopsi dari `agent-skills-hub/skills` (Backend Dev Guidelines) dan pola *Vertical Slice Architecture*.
> 2. **Database Optimization & Schema Integrity:** Diadopsi dari `supabase/agent-skills` (*Postgres Best Practices*), dokumentasi resmi PostgreSQL, dan pola *Database Refactoring*.
> 3. **Security & Threat Boundary:** Diadopsi dari `addyosmani/agent-skills` (*Security and Hardening*) dan *OWASP API Security Top 10*.
> 4. **Live Registry Ping:** Menggunakan protokol CLI dan API publik resmi dari NPM Registry (`registry.npmjs.org`) dan PyPI (`pypi.org`).

Dokumen ini menjadi acuan mutlak bagi `role-backend`, `role-database`, `role-security`, dan `role-inspektur`.

---

## 1. Struktur Proyek Modular: Feature-Based (Vertical Slice)
Alih-alih memisahkan kode berdasarkan layer teknis (`/controllers`, `/models`, `/routes` terpisah yang menyulitkan navigasi), proyek skala menengah-besar disarankan menggunakan struktur berbasis **Fitur / Domain Bisnis**:

```text
src/
├── features/
│   ├── auth/              # Semua logika autentikasi terisolasi di sini
│   │   ├── controllers/   # HTTP handlers (request & response status)
│   │   ├── services/      # Business logic (verifikasi password, token)
│   │   ├── repositories/  # Query database khusus user & auth
│   │   ├── types.ts       # Type definitions & validation schema (Zod)
│   │   └── routes.ts      # Endpoint routing khusus auth
│   ├── products/          # Domain katalog produk
│   └── checkout/          # Domain transaksi & pembayaran
├── shared/                # Hanya untuk kode yang dipakai bersama di > 2 modul
│   ├── database/          # Inisialisasi pool koneksi DB / client ORM
│   ├── middlewares/       # Rate limiter, errorHandler, authGuard
│   └── utils/             # Helper fungsi umum (formatters, logger)
```
- **Kelebihan:** Mengurangi kontaminasi konteks (context pollution) pada AI; AI hanya membaca folder fitur yang sedang dikerjakan. Jika satu fitur dihapus, seluruh foldernya dibuang tanpa meninggalkan residu kode mati.

---

## 2. Arsitektur 4 Lapis Terpisah (Strict Layering)
Dalam setiap modul fitur, pembagian tugas wajib dipatuhi:
1. **Routes Layer:** Hanya memetakan path URL, metode HTTP (`GET`, `POST`), dan memasang middleware validasi/auth.
2. **Controller Layer:** Menerima input dari HTTP request, memanggil schema validator, meneruskan data bersih ke service, dan mengembalikan HTTP status code (`200`, `201`, `400`, `404`). **Dilarang keras ada query database atau kalkulasi bisnis di controller!**
3. **Service Layer:** Tempat seluruh logika bisnis (misal: validasi kuota diskon, kalkulasi pajak, pengiriman email notifikasi). Service tidak boleh tahu apakah request datang dari HTTP REST, GraphQL, atau CLI job.
4. **Repository Layer:** Satu-satunya pintu gerbang yang boleh mengeksekusi query database / ORM.

---

## 3. Optimasi Database & Integritas Skema
- **Anti-N+1 Query:**
  - Dilarang keras mengeksekusi query database di dalam perulangan (`for`, `map`, `forEach`).
  - Wajib menggunakan batching (`WHERE id IN (...)`) atau fitur eager-loading relasi dari ORM.
- **Strategi Indexing:**
  - Setiap kolom yang menjadi `FOREIGN KEY` **WAJIB** memiliki index B-Tree.
  - Kolom yang sering digunakan dalam klausa `WHERE` dan `ORDER BY` bersamaan wajib dibuatkan **Composite Index** (misal: `CREATE INDEX idx_orders_user_status ON orders(user_id, status)`).
- **Pagination Ramah Skala Besar (Cursor-Based):**
  - Untuk tabel dengan potensi > 10.000 baris, hindari pagination berbasis offset (`LIMIT 50 OFFSET 10000`) karena memaksa database memindai baris dari awal.
  - Gunakan **Cursor-based pagination** (berdasarkan ID atau timestamp: `WHERE id > :last_seen_id ORDER BY id ASC LIMIT 50`).
- **Skrip Migrasi Idempoten:**
  - Setiap perubahan skema wajib dapat dieksekusi ulang secara aman (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

---

## 4. Keamanan & Penanganan Input (Threat Modeling)
- **Prinsip Input Hostile:**
  - Jangan percaya data yang dikirim client. Validasi semua `body`, `query`, dan `params` menggunakan runtime schema validator (misal: Zod, Joi, atau Pydantic) sebelum data masuk ke lapisan service.
- **Pencegahan BOLA / IDOR (Broken Object Level Authorization):**
  - Jangan hanya mengandalkan pengecekan role `isLoggedIn`.
  - Pastikan setiap query mutasi atau pembacaan data privat memverifikasi kepemilikan tenant:
    ```sql
    -- Benar (Aman dari IDOR):
    SELECT * FROM invoices WHERE id = :invoice_id AND organization_id = :current_user_org;
    
    -- Salah (Rentan IDOR):
    SELECT * FROM invoices WHERE id = :invoice_id;
    ```
- **Rate Limiting pada Titik Kritis:**
  - Endpoint publik yang sensitif (Login, Register, Lupa Password, OTP Request) wajib dilindungi oleh rate-limiter (misal: Redis sliding-window) maksimal 5 request per menit per IP.

---

## 5. Protokol Verifikasi Versi Real-Time (Live Registry Ping)
Mengingat data training model AI memiliki batas waktu (*knowledge cutoff*), peran **DILARANG MENEBAK** versi stack atau dependensi.

Sebelum menulis `package.json`, konfigurasi, atau menyarankan versi dependensi, peran wajib melakukan pengecekan langsung:
1. **Ekosistem Node / NPM:**
   ```bash
   npm view <nama-paket> version
   # Atau cek seluruh tag rilis:
   npm view <nama-paket> dist-tags
   ```
2. **Ekosistem Python / PyPI:**
   ```bash
   curl -s https://pypi.org/pypi/<nama-paket>/json | jq -r .info.version
   ```
3. **Ekosistem PHP / Packagist:**
   ```bash
   composer info <nama-paket> --all
   ```
4. **Jika CLI Tidak Tersedia:**
   Lakukan penelusuran web atau HTTP fetch langsung ke endpoint publik: `https://registry.npmjs.org/<nama-paket>/latest` atau halaman GitHub Releases resmi proyek tersebut. Cantumkan tanggal verifikasi pada laporan atau file konfigurasi.

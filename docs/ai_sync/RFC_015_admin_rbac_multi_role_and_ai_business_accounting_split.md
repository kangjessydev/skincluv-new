# [RFC 015] Konsultasi Arsitektur Produksi: Pemisahan AI Runtime vs Business Accounting, Granular Admin RBAC, dan Metrik Komersial Lanjutan

**Target Reviewer:**
1. **Claude (Anthropic)**: Chief Software Architect — Pemisahan domain arsitektur, decoupling runtime vs ledger, dan modularitas clean code.
2. **ChatGPT (OpenAI o1 / o3 / GPT-4o)**: Security Red Team & Authorization Auditor — Keamanan RLS Supabase multi-role, proteksi eskalasi hak akses, dan kepatuhan privasi data klinis (UU PDP / GDPR).
3. **DeepSeek (R1 / V3)**: Mathematical & Tokenomics Optimizer — Efisiensi kueri agregasi time-series MoM (Month-over-Month), indeks PostgreSQL, dan konsistensi ledger.

**Tanggal:** 2026-09-28  
**Status Codebase:** Linked Live Supabase DB + React Vite SPA + Deno Edge Functions  
**Baseline Migrasi Terakhir:** Migration 070 & 071 (`ai_providers`, `provider_deposits`, `provider_balances`, `ai_request_logs.provider_id`)  

---

## 1. Konteks Bisnis & Realita Tim Skincluv Saat Ini

Skincluv saat ini bertransformasi dari proyek *solo founder* menjadi organisasi bisnis yang dikelola oleh tim kolaboratif:

1. **Person A (Tech Founder)**:
   - Fokus: Stabilitas compiler, latency LLM, prompt engineering, optimasi token di Deno Edge Function, schema database Supabase, dan keamanan RLS.
   - Kebutuhan: Melihat metriks teknis (token burn rate, latency, failure rate, API provider health, runway saldo API).

2. **Person B (Business & Marketing Co-Founder)**:
   - Fokus: Pertumbuhan bisnis, penjualan langganan Tripay, kampanye promo diskon, CAC vs LTV, dan margin laba kotor operasional.
   - Kebutuhan: Membandingkan performa antar-periode (Bulan Ini vs Bulan Kemarin), mengatur paket harga coret promo, mencatat pengeluaran kas tanpa risiko merusak server AI.

3. **Person C / Future Roles (Customer Service & Clinical Reviewer)**:
   - **Customer Support (Human + AI Handoff)**: Menangani komplain transaksi pembayaran gagal, refund, kuota macet, atau feedback user tanpa boleh melihat prompt rahasia atau mengubah konfigurasi harga.
   - **Clinical Skincare Reviewer**: Memvalidasi entri buku panduan (`skincluv_handbook`), interaksi bahan (`ingredient_interactions`), dan aturan kondisi klinis tanpa akses ke sistem keuangan/teknis.

---

## 2. Masalah Kritis yang Diidentifikasi (Problem Statement)

### Masalah 1: Kopling Ketat Antara Runtime AI Engine vs Accounting Ledger
- Pada Migration 070, tabel `ai_providers` dan `provider_deposits` dirancang untuk mencatat deposit ke penyedia AI.
- **Konflik Arsitektur**:
  - Di satu sisi, `ai_providers.id` bertindak sebagai foreign key untuk `ai_request_logs.provider_id` dan diikat ke runtime `invoke-ai` (Google, Groq, DeepSeek). Jika admin menambah provider sembarangan (misal: "Cohere" atau "Resend Email"), backend akan crash karena belum ada adapter/driver di Edge Function.
  - Di sisi lain, dari kacamata bisnis, founder ingin leluasa mencatat deposit kas untuk *segala macam vendor operasional* (misal: Midjourney untuk desain promo, Tavily untuk web search, Resend untuk email notifikasi, atau server Supabase add-on).
  - Kasus riil di lapangan: Admin mencoba menginput deposit Anthropic Claude dengan kuota token satuan, padahal Anthropic adalah sistem saldo USD. Karena nilai USD dibiarkan 0, sisa saldo terhitung $0.00 meskipun uang Rp 100.000 sudah keluar.

### Masalah 2: Skema RBAC Saat Ini Masih Biner (`is_admin() = true/false`)
- Pada Migration 028, tabel `public.user_roles` hanya memiliki check constraint:
  ```sql
  CREATE TABLE public.user_roles (
    user_id uuid NOT NULL REFERENCES auth.users(id),
    role    text NOT NULL CHECK (role IN ('admin')),
    ...
  );
  ```
- Dan fungsi RLS `public.is_admin()` hanya mengecek keberadaan baris `role = 'admin'`.
- Akibatnya:
  - Rekan bisnis (Marketing) yang diberi akses admin otomatis memiliki akses penuh ke kunci API rahasia, prompt AI, dan migrasi sistem.
  - Customer service kelak tidak bisa diberi akses parsial tanpa risiko kebocoran konfigurasi teknis dan data biometrik sensitif user.

### Masalah 3: Ketiadaan Analisis Temporal Komersial (Period / MoM Filter)
- Seluruh angka di antarmuka finansial saat ini bersifat **Akumulasi Sepanjang Masa (All-Time)** ditambah snapshot laju 7 hari terakhir.
- Rekan bisnis tidak memiliki instrumen untuk menjawab:
  - *"Berapa biaya API dan omzet di bulan September vs Agustus?"* (Month-over-Month).
  - *"Berapa rata-rata token yang dihabiskan satu user berbayar di akhir bulan?"*
  - *"Bagaimana efektivitas promo diskon tertentu terhadap penambahan omzet bersih?"*

### Masalah 4: Isolasi Pengaturan Paket (`subscription_tiers`) vs Promo Diskon
- Dashboard finansial memiliki simulasi kalkulator diskon (*floor price*), namun tabel `subscription_tiers` hanya menyimpan `price_idr` statis tanpa kemampuan membuat harga diskon coret (`original_price_idr`, `discount_percent`, `promo_badge`).
- Poin-poin keunggulan paket (*feature bullet points*) masih di-hardcode di frontend `PricingPage.tsx`, sehingga tim marketing tidak bisa mengubah *copywriting* penawaran tanpa bantuan developer melakukan deploy kode baru.

---

## 3. Opsi Desain Arsitektur yang Diajukan

### Opsi A: Pemisahan Domain AI Runtime vs Operational Accounting Ledger

Memisahkan tanggung jawab tabel menjadi dua entitas independen namun terhubung:
1. **`ai_runtime_providers` (Teknis & Runtime Engine)**:
   - Terikat langsung ke Deno Edge Function `invoke-ai`.
   - Hanya berisi provider yang memiliki driver API aktif (`google`, `groq`, `deepseek`, dsb).
   - Menangani model config, default thinking budget, dan secret key mapping.
2. **`vendor_expense_ledger` / `provider_deposits` (Finansial & Bisnis)**:
   - Menampung seluruh pencatatan uang kas keluar (IDR) dan kredit masuk (USD / Token / Compute Units).
   - Mendukung vendor AI runtime maupun non-AI (Tavily Search, Email, Compute Server, Domain, dsb).
   - Kolom `category`: `'ai_inference'`, `'search_engine'`, `'infra_compute'`, `'marketing_tools'`.
   - Menggunakan relasi opsional `runtime_provider_id REFERENCES ai_runtime_providers(id) ON DELETE SET NULL`.

### Opsi B: Granular Role-Based Access Control (RBAC) 5 Tingkat

Menggantikan boolean biner `is_admin()` dengan matriks peran terstruktur pada tabel `user_roles`:
- `super_admin`: Pemilik sistem (Full access: RLS, DB, API Keys, Finansial, User, Role Assignment).
- `tech_lead`: Akses modul teknis (Prompt & Fitur AI, Model Config, Dataset, Log & Metrik AI, API Runtime Health). Tidak mengelola pencairan komisi/rekening bank.
- `business_lead`: Akses modul komersial (Unit Economics AI, Omzet Tripay, Pricing & Promo Package Builder, Analisis Tren Pasar, Laporan MoM). Read-only pada prompt & model.
- `support_agent`: Akses modul operasional (Pencarian user, verifikasi status transaksi Tripay, manual quota reset, rekam jejak tiket kendala). DILARANG melihat prompt internal dan data biometrik/foto wajah asli user.
- `clinical_reviewer`: Akses modul medis (Handbook Panduan Fitur, Database Interaksi Bahan, Kurasi Rules). Read-only pada modul lainnya.

Helper function di PostgreSQL:
```sql
public.has_role(required_role text) -> boolean
public.has_any_role(required_roles text[]) -> boolean
```

### Opsi C: Dynamic Package Builder & Time-Travel Filtering Engine

1. **Temporal Filtering Engine**:
   - Menambahkan state rentang periode pada antarmuka admin:
     - `current_month` (1 s/d hari ini)
     - `previous_month` (1 s/d akhir bulan lalu)
     - `custom_range` (`[start_date, end_date]`)
     - `all_time`
   - Kueri PostgreSQL atau RPC yang menghitung delta MoM:
     $$\Delta \text{ Revenue} = \frac{\text{Rev}_{\text{current}} - \text{Rev}_{\text{previous}}}{\text{Rev}_{\text{previous}}} \times 100\%$$
     $$\Delta \text{ AI Cost} = \frac{\text{Cost}_{\text{current}} - \text{Cost}_{\text{previous}}}{\text{Cost}_{\text{previous}}} \times 100\%$$

2. **Dynamic Subscription Tier Builder**:
   - Kolom tambahan di `subscription_tiers`:
     - `features_list text[]` (daftar poin bullet keuntungan paket yang muncul di card).
     - `original_price_idr numeric` (harga normal yang dicoret).
     - `discount_percentage int` (persentase hemat yang ditampilkan pada badge promo).
     - `is_popular boolean` / `badge_text text`.

---

## 4. Pertanyaan Audit Spesifik untuk Dewan AI (Tolong Kritik Keras)

### Untuk Claude (Chief Software Architect):
1. **Domain Decoupling**: Apakah memisahkan `ai_runtime_providers` (eksekusi LLM) dan `vendor_expense_ledger` (akuntansi multi-vendor) adalah pola terbaik untuk jangka panjang, ataukah cukup 1 tabel `ai_providers` dengan kolom enum `category`? Apa trade-off kemudahan migrasi vs fleksibilitas bisnis?
2. **Konektivitas Halaman Admin**: Bagaimana menyusun arsitektur halaman admin Skincluv agar tim Tech dan tim Business dapat berkolaborasi tanpa saling memblokir (*siloed features*)?

### Untuk ChatGPT (Security Red Team & Authorization Auditor):
1. **RLS Multi-Role Security**: Dalam arsitektur Supabase, apakah lebih aman menggunakan kolom array di JWT claim / `auth.users.app_metadata`, atau mengecek tabel `user_roles` melalui fungsi PostgreSQL `has_role()`? Bagaimana mencegah *performance hit* pada setiap kueri RLS jika `has_role()` dipanggil berulang kali?
2. **Data Minimization untuk Role Support/CS**: Sesuai UU PDP No. 27 Tahun 2022 dan Invarian 13 (Biometric Minimization), bagaimana policy RLS yang tepat untuk membatasi CS agar bisa membantu komplain kuota user tanpa bisa mengintip foto wajah asli user atau riwayat diagnosis klinis pribadi?

### Untuk DeepSeek (Mathematical & Tokenomics Optimizer):
1. **Perhitungan MoM & Temporal Aggregation**: Untuk menghitung perbandingan biaya token dan omzet antar-bulan di database yang terus bertumbuh, apakah lebih efisien menggunakan `PostgreSQL Window Functions` (`LAG() OVER (...)`) pada Edge Function, query SQL terpisah per interval, atau Materialized View agregasi harian/bulanan?
2. **Rekonsiliasi Saldo Akhir Bulan (Monthly Rollover)**: Bagaimana memodelkan perlakuan saldo deposit provider yang tersisa di akhir bulan (apakah menjadi saldo awal bulan berikutnya / accrual vs cash basis) agar grafik tren bulanan tidak terdistorsi oleh satu deposit besar di awal bulan?

---

## 5. Invarian yang Tetap Wajib Dipatuhi
- **Invarian 1**: `universal_ai` tetap anchor kuota universal.
- **Invarian 2**: `face_validation` tetap 0-credit gatekeeper.
- **Invarian 10**: Server backend Edge Function tetap memegang otoritas validasi data dan otorisasi resource, bukan LLM.
- **Invarian 15**: Hierarchy of authority mutlak: Database Transaksi > Handbook > LLM.
- **Strictly Zero Emojis**: Bebas emoji di seluruh kode, commit message, dan dokumentasi arsitektur.

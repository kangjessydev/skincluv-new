# [RFC 015 Consensus Notes] Multi-Model Agreement: Admin RBAC, Runtime vs Accounting Boundary, and Commercial Financial Engine

**Reviewer Dewan AI:** Claude (Chief Software Architect), ChatGPT (Security Red Team), DeepSeek (Mathematical Optimizer), Antigravity (Lead Engineer)  
**Tanggal Konsensus:** 2026-09-28  
**Status:** CONSENSUS REACHED -> APPROVED FOR EXECUTION  

---

## 1. Ringkasan Eksekutif & The Grand Consensus

Dewan AI telah mencapai mufakat bulat (*unanimous agreement*) untuk menyelesaikan 4 pilar arsitektur Skincluv:

| No | Masalah Arsitektur | Konsensus Dewan AI (Claude × ChatGPT × DeepSeek) | Aksi Teknis |
| :--- | :--- | :--- | :--- |
| **1** | **Domain Separation** | **1 Tabel Registri Vendor + Kolom `category`**<br>Premis "kopling runtime" di RFC 015 dibantah Claude: `invoke-ai` membaca `model_configs`, bukan tabel akuntansi. Jangan over-engineering memecah tabel; cukup tambahkan `category` (`'llm'`, `'search'`, `'email'`, `'infra'`, `'other'`). | Tambah kolom `category` di `ai_providers` (atau alias `vendors`). |
| **2** | **Granular Admin RBAC** | **Hybrid Model (DB Authoritative + Safe Cache)**<br>Database `user_roles` memegang otoritas mutlak agar pencabutan hak akses instan (Claude/ChatGPT). Pertahankan `is_admin()` untuk backward compatibility, tambahkan helper `has_role(required_role)`. | Migrasi `user_roles`: tambah peran `tech_lead`, `business_lead`, `support_agent`, `clinical_reviewer`. |
| **3** | **Customer Support (CS) Boundary** | **Strict Least-Privilege & Biometric Isolation (UU PDP)**<br>CS DILARANG KERAS mengakses tabel `face_scans`, riwayat chat biometrik, atau men-generate signed URL di Storage. Akses CS diisolasi melalui RPC sempit `cs_get_customer_summary(user_id)`. | RLS Default-Deny pada CS + RPC DTO khusus billing & subscription. |
| **4** | **Dual-Track Accounting** | **Cash Treasury vs Accrual Consumption (3 Chart)**<br>Deposit kas adalah **aset prabayar**, bukan biaya. Biaya adalah **konsumsi token riil (`cost_usd`)**. Dashboard memisahkan 3 grafik: Cash Flow, Konsumsi AI, dan Sisa Saldo Rollover dengan metode **Weighted Average Cost (WAC)**. | Kueri MoM berbasis konsumsi aktual + view agregasi WAC. |
| **5** | **Dynamic Pricing & Promo** | **Separation of Truth (Harga Coret & Penagihan)**<br>Simpan `original_price_idr` (harga coret) dan `price_idr` (harga tagih). Persentase diskon dihitung dinamis di UI (`((original - final) / original) * 100`). `tripay_invoices` menagih `price_idr` aktual. | Tambah `original_price_idr` dan `features_list` di `subscription_tiers`. |

---

## 2. Rincian Teknis & Arsitektur

### A. Domain Separation: Registri Vendor Fleksibel
- Tabel `ai_providers` diperluas dengan kolom:
  ```sql
  ALTER TABLE public.ai_providers
    ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'llm'
    CHECK (category IN ('llm', 'search', 'email', 'infra', 'marketing', 'other'));
  ```
- **Aturan Runtime**: Deno Edge Function `invoke-ai` hanya memanggil provider yang terdaftar di `model_configs.provider`. Penambahan vendor non-runtime (misal: Midjourney, Resend, Supabase Compute) oleh rekan bisnis di kategori `'marketing'` / `'email'` / `'infra'` terjamin 100% aman dan tidak memengaruhi runtime AI.

### B. Matriks Hak Akses Granular (RBAC Matrix)

| Modul Halaman Admin | `super_admin` | `tech_lead` (Person A) | `business_lead` (Person B) | `support_agent` (CS) | `clinical_reviewer` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Prompt & Fitur AI** (`/admin/prompts`) | Full | Full (Read/Write) | Read-Only | Denied (403) | Denied (403) |
| **Model & API Key** (`/admin/models`) | Full | Full (Read/Write) | Denied (403) | Denied (403) | Denied (403) |
| **Unit Economics & Deposit** (`/admin/financials`) | Full | Full (Read/Write) | Full (Read/Write) | Denied (403) | Denied (403) |
| **Paket & Diskon Promo** (`/admin/pricing`) | Full | Read-Only | Full (Read/Write) | Denied (403) | Denied (403) |
| **Transaksi Tripay & Laporan Omzet** | Full | Read-Only | Full (Read/Write) | Read-Only (Billing) | Denied (403) |
| **Customer Lookup & Kuota** (`/admin/users`) | Full | Full | Read-Only | Restricted (RPC) | Denied (403) |
| **Handbook & Riset Klinis** (`/admin/knowledge`) | Full | Read-Only | Read-Only | Denied (403) | Full (Read/Write) |
| **Data Biometrik / Foto Wajah Asli** | Denied (Invarian 13) | Denied (Invarian 13) | Denied (Invarian 13) | **DENIED MUTLAK** | Denied (Invarian 13) |

- **Backward Compatibility Guarantee**:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'tech_lead', 'business_lead')
    );
  $$;
  ```
  Seluruh puluhan policy RLS lama tetap aman berjalan tanpa regresi logika.

### C. CS Data Boundary & Kepatuhan UU PDP (Invarian 13)
- Role `support_agent` menggunakan fungsi DTO aman:
  ```sql
  CREATE OR REPLACE FUNCTION public.cs_get_customer_summary(p_target_user_id uuid)
  RETURNS jsonb ...
  ```
  Hanya mengembalikan: `user_id`, `email`, `subscription_status`, `period_end`, `credit_balance`, `last_transactions`.
- **DILARANG KERAS** mengembalikan: `face_image_path`, `skin_analysis_results`, `clinical_notes`, atau `chat_messages`.
- Storage policy bucket `face-images` dikunci: CS tidak memiliki hak memanggil `storage.createSignedUrl()`.

### D. Akuntansi Dual-Track & Formula MoM (DeepSeek)
- **Tiga Grafik Terpisah di Dashboard Finansial**:
  1. **Cash Flow (Kas Keluar Vendor)**: Sumber dari `provider_deposits.amount_paid_idr`.
  2. **Konsumsi AI Riil (COGS Akrual)**: Sumber dari `ai_request_logs.cost_usd * wac_rate`.
  3. **Sisa Saldo Prabayar (Rollover)**: $B_M = B_{M-1} + \text{Deposit}_M - \text{Konsumsi}_M$.
- **Weighted Average Cost (WAC)**:
  $$\text{WAC Rate} = \frac{\sum \text{amount\_paid\_idr}}{\sum \text{credited\_amount\_usd}}$$
- **Sinyal Delta MoM**:
  Delta bulanan wajib membandingkan **Pertumbuhan Konsumsi AI Riil** ($\Delta \text{ Consumption}$), bukan fluktuasi setoran kas.

### E. Dynamic Package Builder & Promo Coret
- Tabel `subscription_tiers` diperluas:
  ```sql
  ALTER TABLE public.subscription_tiers
    ADD COLUMN IF NOT EXISTS original_price_idr numeric(12,2),
    ADD COLUMN IF NOT EXISTS features_list text[],
    ADD COLUMN IF NOT EXISTS promo_badge text,
    ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;
  ```
- Tripay Invoice menagih nilai `price_idr` aktual. Persentase diskon ditampilkan dinamis di frontend:
  $$\text{Diskon \%} = \text{ROUND}\left(\frac{\text{original\_price} - \text{price}}{\text{original\_price}} \times 100\right)$$

---

## 3. Penambahan Invarian Arsitektur di AGENTS.md

Dokumen ini mengesahkan 3 Invarian baru:

- **Invarian 16 (Biometric & Clinical Data Isolation for Support Roles)**: Role Customer Support (`support_agent`) hanya berhak membaca status pembayaran, langganan, dan saldo kuota via CS-safe DTO. DILARANG KERAS mengakses foto wajah asli, storage signed URL, atau rekam jejak klinis pengguna (UU PDP No. 27/2022).
- **Invarian 17 (Dual-Track Accounting: Cash Treasury vs Accrual Consumption)**: Setoran kas deposit ke provider adalah aset prabayar (*prepaid asset*), bukan biaya berjalan. Grafik tren biaya operasional bulanan wajib mem-plot konsumsi riil (`cost_usd`), bukan pergerakan kas deposit.
- **Invarian 18 (Pricing Integrity & Non-Derived Invoice Billing)**: Harga yang ditagihkan ke gateway pembayaran (Tripay) wajib merujuk langsung ke kolom `price_idr` saat transaksi dibuat. Persentase diskon hanya bersifat representasi visual pada antarmuka.

---

## 4. Rencana Implementasi Bertahap (Execution Phases)

- **Tahap 1: Polish Finansial & Koreksi Deposit Claude**:
  - Perbaiki validasi modal deposit (beri peringatan jelas bahwa provider USD memerlukan nominal dolar).
  - Tambahkan tombol **Edit Deposit** pada tabel riwayat agar admin dapat mengoreksi transaksi tanpa harus menghapus.
  - Perketat RLS `ai_providers` (Migration 071) agar tertutup dari akses publik anonim.
- **Tahap 2: Skema Multi-Role RBAC & Peran Person B (Business Lead)**:
  - Migrasi `user_roles` mendukung `super_admin`, `tech_lead`, `business_lead`, `support_agent`, `clinical_reviewer`.
  - Implementasikan helper `has_role()` dan perbarui `is_admin()`.
  - Berikan role `business_lead` untuk rekan bisnis Anda dan `super_admin`/`tech_lead` untuk Anda.
- **Tahap 3: Filter Periode & Analitik MoM (Bulan Ini vs Kemarin)**:
  - Tambahkan time filter (MTD, Bulan Kemarin, 30 Hari, All-Time).
  - Tampilkan 3 grafik: Cash Flow, Konsumsi AI, dan Rollover Saldo Prabayar.
- **Tahap 4: Dynamic Package Builder & Promo Coret**:
  - Kolom `features_list` dan `original_price_idr` di `subscription_tiers`.
  - Antarmuka Admin Pricing yang memungkinkan Person B mengelola poin paket dan harga diskon langsung dari dashboard.

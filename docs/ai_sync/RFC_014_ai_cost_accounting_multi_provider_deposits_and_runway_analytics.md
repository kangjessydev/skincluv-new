# [RFC 014] Konsultasi Arsitektur Produksi: AI Cost Accounting, Multi-Provider Flexible Deposits & Runway Analytics

**Target Reviewer**: Claude 3.5 Sonnet (Chief Architect), DeepSeek V3/R1 (Mathematical & Tokenomics Optimizer), ChatGPT o1/o3 (Security & Ledger Auditor)  
**Tanggal**: 2026-09-27  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions  
**Topik**: Fleksibilitas Deposit Multi-Provider AI, Pencatatan Saldo Riil, Komparasi HPP (Unit Economics), dan Proyeksi Runway Saldo  

---

## 1. Konteks & State Kode Saat Ini

### 1.1 Kondisi Eksisting
Saat ini Skincluv memiliki halaman admin finansial di [`src/pages/admin/AdminFinancialsPage.tsx`](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx) dengan modal pencatatan deposit: *"Catat Deposit Top-Up Provider AI"*.

Namun sistem saat ini memiliki kelemahan mendasar:
1. **Input Terbatas Hanya Uang Keluar (IDR) & Estimasi Statis USD**:
   - Modal saat ini hanya meminta:
     - `Nominal Top-Up (Rupiah - IDR)`
     - `Estimasi Ekuivalen USD (Kurs Rp 16.000 statis)`
   - **Kelemahan Nyata**: Di dunia nyata, saat admin mentransfer Rp 100.000 ke kartu kredit atau pembayaran provider:
     - Ada biaya admin valas / selisih kurs kartu kredit (kurs riil bukan Rp 16.000, melainkan Rp 16.350).
     - Ada pajak PPN 11% (bila ditagihkan oleh entitas lokal/GCP).
     - Ada **saldo riil yang masuk ke akun provider** (`credited_balance_usd` atau `credited_tokens`). Misal: bayar Rp 165.000, saldo masuk $10.00; atau ada promo voucher bonus $5 (total saldo masuk $15.00).
     - Admin saat ini **tidak bisa menginput berapa saldo riil yang diperoleh dari top-up**.

2. **Daftar Provider Hardcoded & Kaku**:
   - Di skema database [`supabase/migrations/20240001000044_provider_topups_reconciliation.sql`](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/migrations/20240001000044_provider_topups_reconciliation.sql):
     ```sql
     CREATE TABLE public.provider_topups (
       id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       provider      text NOT NULL CHECK (provider IN ('google', 'anthropic', 'groq', 'openai')),
       amount_idr    numeric NOT NULL CHECK (amount_idr >= 0),
       amount_usd    numeric CHECK (amount_usd >= 0),
       topped_up_at  date NOT NULL DEFAULT CURRENT_DATE,
       notes         text,
       created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
       created_at    timestamptz NOT NULL DEFAULT now()
     );
     ```
   - Di UI frontend, pilihan provider ditulis:
     ```tsx
     <option value="gemini">Google Gemini (Google Cloud Vertex / AI Studio)</option>
     <option value="groq">Groq Cloud (Llama / Qwen)</option>
     <option value="claude">Anthropic Claude</option>
     <option value="other">Provider Lain</option>
     ```
   - **Bug Skema**: Memilih `gemini`, `claude`, atau `other` akan gagal tersimpan karena ditolak oleh PostgreSQL `CHECK (provider IN ('google', 'anthropic', 'groq', 'openai'))`!
   - Padahal Skincluv memakai **Google Gemini** (Face & Ingredient Scan), **Groq** (Qwen 2.5 untuk Skinsistant), **Tavily** (Web Search), dan berpotensi memakai **DeepSeek**, **OpenRouter**, **Together AI**, dll.

3. **Tidak Ada Atribusi Biaya per Provider (Semua Dicampur)**:
   - Perhitungan sisa saldo di frontend saat ini:
     ```tsx
     const totalTopupIDR = topups.reduce((acc, t) => acc + (Number(t.amount_idr) || 0), 0)
     const totalCostIDR = financials.totalCostIDR
     const remainingIDR = totalTopupIDR - totalCostIDR
     ```
   - Semua biaya pemakaian log (`ai_request_logs.cost_usd`) dikurangkan secara global dari gabungan seluruh top-up provider, tanpa mengetahui:
     - Berapa saldo Gemini yang tersisa?
     - Berapa saldo Groq yang tersisa?
     - Provider mana yang paling boros atau paling efisien per request?

---

## 2. Sasaran Arsitektur Baru yang Diinginkan

Sistem akuntansi biaya AI (*AI Cost Accounting & Treasury*) Skincluv harus mampu:
1. **Fleksibilitas Provider**: Mendukung penambahan provider secara dinamis (Google, Groq, DeepSeek, OpenRouter, Anthropic, Tavily, dsb.) tanpa harus migrasi schema constraint setiap kali ada provider baru.
2. **Dual-Entry Deposit (Uang Keluar vs Saldo Masuk)**:
   - Mencatat **Biaya Modal yang Dikeluarkan (Gross Cash Outflow - IDR)**: total uang yang ditarik dari rekening/kartu kredit (termasuk fee & pajak).
   - Mencatat **Saldo Riil yang Masuk ke Provider (Net Credited Balance)**: nominal dollar (`credited_usd`) atau kuota token (`credited_tokens`).
   - Otomatis menghitung **Kurs Efektif Riil (Effective Exchange Rate)**: `amount_idr / credited_usd`.
3. **Atribusi Konsumsi & Rekonsiliasi per Provider**:
   - Menghubungkan setiap entri di `ai_request_logs` ke provider yang bersangkutan.
   - Menghitung sisa saldo per masing-masing provider secara terpisah (`remaining_balance_usd` & `remaining_idr`).
4. **Metrik Komparasi Bisnis & Proyeksi Runway**:
   - **Cost per 1k / 1M Tokens Efektif**: Komparasi antar provider (misal: Gemini Flash vs Groq Qwen vs DeepSeek V3).
   - **Average Daily Burn Rate**: Rata-rata konsumsi biaya 7 hari / 30 hari terakhir per provider.
   - **Estimated Days of Runway**: Berapa hari saldo masing-masing provider bertahan sebelum habis (dengan status *Healthy*, *Warning < 7 hari*, *Critical < 3 hari*).
   - **Unit Cost per Feature**: Berapa HPP riil 1x Face Scan, 1x Ingredient Scan, dan 1x Chat Message.

---

## 3. Rencana Perubahan Skema Database (Proposed Schema)

```sql
-- 1. Tabel Registri Provider AI yang Fleksibel
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id              text PRIMARY KEY, -- 'google', 'groq', 'deepseek', 'openrouter', 'anthropic', 'tavily'
  name            text NOT NULL,    -- 'Google Cloud / Vertex AI', 'Groq Cloud'
  billing_type    text NOT NULL DEFAULT 'prepaid_usd' CHECK (billing_type IN ('prepaid_usd', 'prepaid_tokens', 'postpaid_usd', 'free_tier')),
  currency        text NOT NULL DEFAULT 'USD',
  website_url     text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Modifikasi Tabel Deposit Top-Up
CREATE TABLE IF NOT EXISTS public.provider_deposits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         text NOT NULL REFERENCES public.ai_providers(id) ON DELETE RESTRICT,
  amount_paid_idr     numeric(12,2) NOT NULL CHECK (amount_paid_idr > 0),
  credited_amount_usd numeric(10,2) CHECK (credited_amount_usd >= 0),
  credited_tokens     bigint CHECK (credited_tokens >= 0),
  effective_rate_idr  numeric(10,2), -- amount_paid_idr / credited_amount_usd (kurs riil termasuk fee bank)
  invoice_number      text,
  notes               text,
  deposited_at        timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. Memastikan ai_request_logs memiliki provider_id atau relasi ke model_configs
-- (saat ini ai_request_logs -> model_config_id -> provider)
```

---

## 4. Pertanyaan Spesifik untuk Dewan AI Reviewer

### A. Untuk DeepSeek (Mathematical & Tokenomics Optimizer)
1. **Model Perhitungan Runway & Burn Rate**:
   - Jika laju pemakaian token berfluktuasi antara hari kerja dan akhir pekan, rumus *burn rate* apa yang paling objektif untuk menghitung sisa hari runway: apakah *Simple Moving Average (SMA 7 hari)*, *Exponential Moving Average (EMA)*, atau *Weighted Decay*?
2. **Formula Unit Economics per Scan**:
   - Bagaimana rumus terbaik untuk menghitung *Effective Cost per User Activity* (misal Face Scan yang melibatkan 2 model: `face_validation` kilat 0-credit + `face_analysis` 5-credit) dengan memasukkan faktor *Effective Exchange Rate* dari deposit?
3. **Komparasi Multimodel**:
   - Metrik komparasi apa yang paling berdampak bagi pemilik bisnis untuk melihat efisiensi token vs biaya (misal rasio output tokens per USD atau cost per completed diagnostic query)?

### B. Untuk Claude (Chief Software Architect)
1. **Arsitektur Provider Decoupling & Relasi**:
   - Di `ai_request_logs`, saat ini ada `model_config_id`. Apakah sebaiknya agregasi biaya per provider dilakukan via `JOIN model_configs` di SQL View / RPC, atau denormalisasi kolom `provider_id` langsung ke `ai_request_logs` demi performa query laporan admin yang cepat?
2. **Prepaid vs Postpaid Reconciliation**:
   - Sebagian provider (seperti GCP Vertex AI) menagih secara *postpaid* di akhir bulan, sedangkan Groq / OpenAI mengharuskan *prepaid deposit*. Bagaimana rancangan UX dan arsitektur data agar halaman finansial dapat menyandingkan kedua model penagihan ini tanpa membingungkan saldo kas?
3. **Data Immutability & Historical Accuracy**:
   - Jika kurs dolar bulan lalu Rp 16.000 dan bulan ini Rp 16.500, bagaimana memastikan rekam jejak biaya pemakaian bulan lalu tidak berubah mengikuti kurs baru?

### C. Untuk ChatGPT (Security & Ledger Auditor)
1. **Audit Trail & Role Integrity**:
   - Pencatatan deposit adalah pencatatan pengeluaran uang riil perusahaan. Kontrol RLS dan validasi apa yang harus diterapkan agar hanya Super Admin terverifikasi yang dapat mencatat atau mengoreksi deposit? Apakah perlu soft-delete / immutable audit ledger alih-alih `DELETE` biasa?
2. **Pencegahan Human Error pada Input Finansial**:
   - Edge case apa yang sering terjadi pada input angka desimal, format koma vs titik (Indonesia Rp 100.000 vs US $100.00), dan selisih pembulatan (*penny gap*) pada konversi valuta asing?

---

## 5. Invarian yang Tetap Dipertahankan (AGENTS.md)
1. **Universal Quota Engine**: Pemotongan kuota subscriber (`universal_ai`) tidak terpengaruh oleh sistem pelaporan admin ini.
2. **Zero Emojis**: Kode, UI, dan pesan sistem tetap wajib bebas dari emoji apa pun.
3. **Kemandirian Database**: Frontend tidak boleh menghitung saldo kotor di client-side tanpa verifikasi PostgreSQL.

---

### Cara Merespons:
Mohon dewan AI memberikan evaluasi kritis, formula matematis konkret, rekomendasi struktur SQL, dan checklist arsitektur sebelum fitur ini dibangun oleh Lead Engineer (Antigravity).

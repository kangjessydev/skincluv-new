# 🏛️ Konsensus Dewan AI — RFC 014: AI Cost Accounting, Multi-Provider Deposits & Runway Analytics

Dokumen ini merangkum hasil musyawarah resmi dewan AI (**Claude 3.5 Sonnet**, **ChatGPT o1/o3**, dan **DeepSeek V3/R1**) mengenai arsitektur akuntansi biaya AI, fleksibilitas deposit multi-provider, dan analitik runway saldo di Skincluv.

---

## 1. Ringkasan Evaluasi & Keputusan Dewan AI

| Dewan AI | Peran Utama | Keputusan & Poin Kritis |
| :--- | :--- | :--- |
| **Claude (Anthropic)** | Chief Software Architect | **APPROVED WITH MIGRATION CAVEATS**<br>• Mengonfirmasi bug kritis schema: `CHECK (provider IN ('google','anthropic','groq','openai'))` menolak `gemini`, `claude`, dan `other`.<br>• Menyetujui registri `ai_providers` dan dual-entry `provider_deposits`.<br>• Mewajibkan backfill data lama dari `provider_topups` sebelum didepresiasi.<br>• Memverifikasi bahwa `model_configs` memakai pola *insert-new-row*, sehingga relasi historis tetap terjaga. |
| **ChatGPT (OpenAI)** | Security & Ledger Auditor | **APPROVED WITH ACCOUNTING DISCIPLINE**<br>• Memisahkan konsep *Estimated Usage Cost* (`ai_request_logs`) dengan *Actual Financial Cash Ledger*.<br>• Kurs efektif riil (`effective_rate_idr`) wajib berupa generated column, bukan input statis yang bisa basi (*stale*).<br>• Menambahkan idempotency guard (`invoice_number UNIQUE`) untuk mencegah double-entry deposit.<br>• Menerapkan prinsip ledger append-only (koreksi via reversal/adjustment, bukan update sembarangan).<br>• Mendukung multi-tipe billing (prepaid USD, postpaid accrued, free-tier quota). |
| **DeepSeek (Moonshot/R1)** | Mathematical & Tokenomics Optimizer | **APPROVED WITH FULL MATHEMATICAL FORMULATION**<br>• Memberikan formula komputasi kurs efektif riil: `amount_paid_idr / credited_amount_usd`.<br>• Memberikan formula Runway: `remaining_balance / avg_daily_burn` dengan moving average 7 hari (responsif) dan 30 hari (stabil).<br>• Menentukan ambang batas kesehatan runway: Healthy (>30 hari), Warning (7-30 hari), Critical (3-7 hari), Depleted (<3 hari).<br>• Menghitung HPP unit economics per fitur: `face_analysis` ($0.0021 / Rp 37), `ingredient_scan` ($0.0015 / Rp 26), `chatbot` ($0.00008 / Rp 1.4). |
| **Kimi (Moonshot)** | Clinical Skincare Researcher | *Di-bypass untuk RFC 014 karena domain murni akuntansi finansial & arsitektur komputasi tanpa implikasi klinis/dermatologis.* |

---

## 2. Invarian Baru yang Disepakati

### Invarian 16: Immutable AI Provider Attribution & Financial Accounting
1. **Dual-Entry Deposit Separation**: Setiap deposit mencatat uang keluar riil (`amount_paid_idr`) dan saldo riil yang masuk ke provider (`credited_amount_usd` / `credited_tokens`).
2. **Generated Effective Rate**: Kurs efektif riil dihitung otomatis oleh database (`amount_paid_idr / credited_amount_usd`) untuk memasukkan biaya bank, fee konversi, dan PPN secara empiris.
3. **Immutable Usage Attribution**: Setiap baris log pemakaian AI mencatat atribusi `provider_id` secara langsung agar historis HPP tidak terdistorsi saat konfigurasi model aktif berganti di kemudian hari.
4. **Idempotency Guard**: Setiap transaksi deposit mewajibkan nomor referensi / invoice unik untuk mencegah duplikasi pencatatan.
5. **No Client-Side Financial Fabrication**: Saldo sisa, burn rate, dan estimasi runway dihitung secara deterministik di database view/RPC, bukan hasil kalkulasi lepas di frontend.

---

## 3. Rencana Eksekusi Bertahap (Sequential Execution Plan)

Sesuai aturan produksi: **Dilarang mengerjakan semua sekaligus, setiap tahap wajib diverifikasi dan diuji**.

- [ ] **Tahap 1: Database Migration (070)**
  - Buat tabel `ai_providers` dan seed data aktif (`google`, `groq`, `anthropic`, `openai`, `deepseek`, `openrouter`, `tavily`).
  - Buat tabel `provider_deposits` dengan dual-entry, generated `effective_rate_idr`, dan `invoice_number UNIQUE`.
  - Backfill data dari `provider_topups`, rename ke `provider_topups_deprecated`.
  - Tambah kolom `provider_id` di `ai_request_logs`.
  - Pasang RLS policies admin-only.
  - Buat view `provider_balances`.
- [ ] **Tahap 2: Backend Edge Function Attribution (`invoke-ai`)**
  - Pastikan Edge Function menyertakan `provider_id` saat mencatat log ke `ai_request_logs`.
- [ ] **Tahap 3: Form Modal Deposit Multi-Provider (`AdminFinancialsPage.tsx`)**
  - Perbarui form modal agar mendukung pemilihan provider dinamis, input uang keluar IDR vs saldo masuk USD, estimasi kurs otomatis, dan nomor invoice.
- [ ] **Tahap 4: Kartu Analitik Runway & Komparasi Provider (`AdminFinancialsPage.tsx`)**
  - Tampilkan komparasi sisa saldo per provider, 7-day burn rate, dan status runway (Healthy/Warning/Critical).

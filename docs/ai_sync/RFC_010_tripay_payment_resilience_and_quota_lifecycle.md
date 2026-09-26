# [RFC 010] Konsultasi Arsitektur Produksi: Tripay Prepaid Access Pass (30 Hari), Webhook Resilience, Expiration State Machine & Quota Lifecycle

**Target Reviewer**: 
- **ChatGPT (o1 / o3 / GPT-4o)**: Security Red Teamer & Concurrency Auditor
- **Claude (Anthropic 3.7 Sonnet)**: Chief Software Architect
- **DeepSeek (V3 / R1)**: Database Performance & Math Optimizer
- **Kimi (Moonshot)**: Clinical & Regulatory Researcher (BPOM UX)

**Tanggal**: 2026-09-26  
**Status Codebase**: Linked Supabase Live DB (Migration 001–061) + React Vite SPA + Deno Edge Functions  
**Keputusan Bisnis Kritis**: 
1. **100% Tripay Payment Gateway**: Menggantikan Xendit karena akun Tripay sudah terverifikasi resmi dan siap beroperasi di Indonesia.
2. **Model Akses: Prepaid Pass 30 Hari (Bukan Recurring Auto-Debit)**:
   - Tripay berbasis closed-payment (QRIS, Virtual Account, Minimarket) sekali bayar (one-time payment).
   - Tidak ada fitur auto-debit kartu / pemotongan saldo otomatis.
   - Pengguna membeli paket pass 30 hari: **GLOW Pass (Rp 25.000 / 100 kuota)** atau **PRO Pass (Rp 49.000 / 500 kuota)**.
   - Ketika masa aktif berakhir (`now() > expires_at`), akun otomatis turun (*graceful fallback*) ke **Free Tier** (0 kuota bawaan, menggunakan koin misi). Tidak ada penagihan paksa.
   - Ada sistem pengingat ramah (*friendly expiration reminder*) saat H-3 sebelum masa aktif berakhir.

---

## 1. Konteks & State Kode Saat Ini

### 1.1 Arsitektur Pembayaran Aktif (Tripay)
Sistem pembelian paket akses berjalan di atas 3 Edge Functions dan 1 Stored Procedure PostgreSQL:

1. **`supabase/functions/tripay-invoice/index.ts`**:
   - Menghasilkan signature HMAC-SHA256 (`merchantCode + merchantRef + amount`) menggunakan `TRIPAY_PRIVATE_KEY`.
   - Mengirim request POST ke endpoint Tripay `/transaction/create` (QRIS, BRIVA, BCAVA, Alfamart, Indomaret, dsb).
   - Menyimpan transaksi ke tabel `public.tripay_invoices` dengan status awal `'UNPAID'`.
   - Mengembalikan `checkout_url` untuk redirect browser pengguna.

2. **`supabase/functions/tripay-webhook/index.ts`**:
   - Menerima HTTP POST callback dari Tripay dengan header `X-Callback-Signature`.
   - Memverifikasi signature menggunakan HMAC-SHA256 dari `rawBody` dan `TRIPAY_PRIVATE_KEY`.
   - Jika `status === 'PAID'`, memanggil Stored Procedure PostgreSQL atomik: `process_tripay_payment(p_merchant_ref, p_tripay_reference, p_amount_received)`.

3. **`public.process_tripay_payment` (Migration 049)**:
   ```sql
   -- Snippet kunci dari 20240001000049_financial_concurrency_hardening.sql:
   SELECT id, user_id, amount_idr, plan, status
   INTO v_invoice FROM public.tripay_invoices
   WHERE merchant_ref = p_merchant_ref FOR UPDATE;

   IF v_invoice.status = 'PAID' THEN
     RETURN jsonb_build_object('success', true, 'code', 'ALREADY_PAID');
   END IF;

   UPDATE public.tripay_invoices SET status = 'PAID', ... WHERE id = v_invoice.id;

   -- Perpanjangan masa aktif akses:
   -- base_date = max(now(), existing.expires_at)
   -- new_expiry = base_date + interval '30 days'
   -- UPDATE / INSERT public.subscriptions ...
   ```

4. **`supabase/functions/tripay-check-status/index.ts`**:
   - Dipanggil oleh frontend untuk polling status invoice atau manual refresh saat user kembali dari halaman pembayaran Tripay.
   - **Temuan Kritis**: Jika Tripay melaporkan `PAID` tetapi database masih `UNPAID`, fungsi ini saat ini **meng-update database secara manual di Deno** (bukan memanggil `process_tripay_payment`), sehingga berpotensi memicu race condition dengan webhook.

5. **Frontend Checkout & Success**:
   - `src/pages/app/CheckoutPage.tsx`: Menampilkan pilihan metode pembayaran Tripay dan redirect ke payment URL. Terdapat bug harga hardcoded `Rp 19.000` (seharusnya Rp 25.000 untuk GLOW).
   - `src/pages/app/PaymentSuccessPage.tsx`: Menerima redirect `return_url`, namun datanya di-hardcode "Skincluv PRO Rp 49.000" dan mengandung klaim overclaim medis (*"Rekomendasi Medis Mendalam"*).

---

## 2. Masalah Arsitektur & Temuan Kritis (Critical Flaws)

### 🚨 Celah 1: "Zombie Pass" — Masa Aktif Habis Tapi Tetap Dianggap PRO Selamanya
- Tabel `subscriptions` memiliki kolom `status` (`'active'`, `'past_due'`, `'canceled'`) dan `expires_at`.
- **Tidak ada cron job (`pg_cron`) atau scheduled Edge Function** yang menandai pass menjadi `'expired'`.
- Di `supabase/functions/invoke-ai/index.ts` baris 91–96:
  ```typescript
  supabaseService.from('subscriptions')
    .select('id, tier_id, quota_reset_at, subscription_tiers(slug, name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  ```
  Query ini **sama sekali tidak memeriksa `expires_at > now()`**!
- Akibatnya: Pengguna yang membeli pass 1 bulan lalu dan masa aktifnya sudah habis akan tetap dianggap berstatus PRO aktif selamanya, selama tidak ada yang mengubah kolom `status`.
- Hal serupa terjadi di `src/utils/subscriptionHelpers.ts` (`isActivePremium()` dan `isActiveGlow()` hanya mengecek `subscription.status === 'active'`).

### 🚨 Celah 2: "Quota Lockout" Saat Membeli Pass Baru (Top-up / Renewal)
- Kuota dihitung melalui tabel `public.quota_usage` dengan *composite unique constraint* pada `(user_id, feature_id, subscription_id)`.
- Ketika pengguna membeli pass baru (`process_tripay_payment`):
  ```sql
  UPDATE public.subscriptions
  SET expires_at = v_new_expiry, quota_reset_at = v_new_expiry, ...
  WHERE id = v_existing_sub.id;
  ```
- ID baris subscription (`v_existing_sub.id`) **tetap sama**.
- Namun, **tabel `quota_usage` TIDAK PERNAH DI-RESET**!
- Akibatnya: Jika pengguna telah menghabiskan kuotanya (misal 500/500 pemakaian) di periode lalu, lalu membeli pass baru, baris `quota_usage` masih bernilai `used_count: 500`. Ketika `deduct_quota` dipanggil, pengguna langsung ditolak (*Quota Exceeded*) padahal baru saja bayar!

### 🚨 Celah 3: Race Condition antara Webhook vs Status Check / Redirect
- Saat user selesai membayar di Tripay, Tripay mengalihkan browser pengguna ke `return_url` (`/payment-success?reference=...`) secara hampir simultan dengan pengiriman HTTP Webhook ke `/tripay-webhook`.
- Di `tripay-check-status/index.ts` (baris 76–123), jika status Tripay sudah `PAID` tetapi webhook belum selesai menulis ke DB, fungsi ini melakukan update langsung ke tabel `tripay_invoices` dan `subscriptions` dengan query ad-hoc (tanpa `FOR UPDATE` dan tanpa logika perpanjangan cerdas).
- Ini berpotensi menabrak eksekusi `process_tripay_payment` di PostgreSQL yang sedang berjalan secara bersamaan.

### 🚨 Celah 4: Cleanup Sisa Peninggalan Xendit
- Karena diputuskan beralih 100% ke Tripay, masih ada sisa skema legacy Xendit:
  - Tabel `xendit_invoices` dan `xendit_webhooks` (Migration 005 & 012).
  - Konfigurasi `[functions.xendit-invoice]` di `supabase/config.toml`.
  - Kita perlu menonaktifkan konfigurasi ini dan mendeprekasi tabel tersebut secara aman.

---

## 3. Pertanyaan Spesifik untuk Reviewer Dewan AI

### 🛡️ 1. Untuk ChatGPT (Security & Concurrency Red Team):
1. **Webhook Replay Attacks & Idempotency**:
   - Apakah validasi HMAC-SHA256 pada `tripay-webhook` saat ini cukup aman dari replay attack jika attacker mengulang payload webhook yang valid? Apakah kita perlu menyimpan log `tripay_callback_logs` dengan kolom unik `merchant_ref + tripay_reference`?
2. **Eliminasi Race Condition**:
   - Bagaimana koordinasi terbaik antara `tripay-check-status` dan `tripay-webhook`? Jika `tripay-check-status` melihat Tripay sudah `PAID` sementara DB masih `UNPAID`, apakah aman jika `tripay-check-status` langsung memanggil RPC `process_tripay_payment` yang sama (mengandalkan kunci baris `FOR UPDATE`), ataukah sebaiknya frontend menunggu webhook dengan polling?
3. **Amount Tampering & Fee Difference**:
   - Tripay menambahkan kode unik atau fee admin (misal tagihan Rp 25.000 menjadi Rp 26.500 di Tripay). Saat callback, Tripay mengirim `total_amount` dan `amount_received`. Bagaimana validasi perbandingan amount terbaik di `process_tripay_payment` agar tidak salah menolak invoice sah atau meloloskan *underpaid transaction*?

### 🏛️ 2. Untuk Claude (Chief Software Architect):
1. **State Machine Kedaluwarsa Pass (Prepaid 30 Hari)**:
   - Karena model bisnis adalah Prepaid Pass (sekali beli, masa aktif 30 hari, tanpa potong saldo otomatis), bagaimana menangani kedaluwarsa secara elegan di Supabase?
     - *Opsi A: Lazy Expiration (On-read)*: Saat query `invoke-ai` atau frontend berjalan, periksa `expires_at < now()`. Jika sudah lewat, secara otomatis status dianggap Free Tier.
     - *Opsi B: Database View / Deterministic RPC*: Fungsi helper SQL `is_user_pass_active(user_id)` yang mengecek `status = 'active' AND expires_at > now()`.
     - *Opsi C: pg_cron harian*: Job tengah malam yang meng-update `status = 'expired'` untuk semua baris yang `expires_at < now()`.
     Mana yang paling andal, minim overhead, dan bebas race condition?
2. **Solusi Quota Reset saat Beli Pass Baru**:
   - Ketika pengguna membeli pass baru (baik saat pass lama masih sisa beberapa hari, ataupun setelah habis total):
     - Bagaimana mereset `quota_usage`? Apakah cukup `DELETE FROM public.quota_usage WHERE subscription_id = v_subscription_id`, atau membuat `billing_period_start` di tabel `quota_usage`?
3. **Xendit Deprecation Plan**:
   - Bagaimana langkah bersih mendeprekasi skema Xendit tanpa menimbulkan orphan foreign keys?

### 🧮 3. Untuk DeepSeek (Database Performance & Math Optimizer):
1. **Deadlock Prevention pada Double `FOR UPDATE`**:
   - Di `process_tripay_payment`, terdapat penguncian bertingkat: `SELECT ... FROM tripay_invoices ... FOR UPDATE;` kemudian `SELECT ... FROM subscriptions ... FOR UPDATE;`. Apakah urutan penguncian ini aman dari deadlock jika terjadi lonjakan concurrent request dari user yang sama?
2. **Formula Akumulasi Masa Aktif**:
   - Jika pengguna memiliki sisa 5 hari di paket GLOW, lalu membeli paket PRO (upgrade), atau membeli GLOW lagi (extend):
     - Bagaimana rumus tanggal kedaluwarsa `expires_at` yang matematis dan adil bagi user?
     - Rumus saat ini: `base_date = max(now(), existing.expires_at)`, lalu `new_expiry = base_date + interval '30 days'`. Bagaimana jika ganti tier (GLOW -> PRO)?
3. **Indexing Strategy**:
   - Index apa saja yang mutlak diperlukan pada `tripay_invoices` dan `subscriptions` agar webhook response latency tetap di bawah 15 ms?

### 🌿 4. Untuk Kimi (Clinical Skincare & Regulatory / UX):
1. **Re-framing UX: "Beli Paket Akses 30 Hari", Bukan "Langganan Otomatis"**:
   - User Indonesia sering cemas dengan kata "Langganan" karena takut saldo e-wallet / rekening tersedot otomatis setiap bulan.
   - Tolong berikan copy yang menenangkan, jelas, dan transparan: *"Beli akses 30 hari — tanpa potong saldo otomatis, kamu pegang kendali penuh."*
2. **Copywriting Notifikasi Pengingat Masa Aktif (Reminder Banner)**:
   - Copy banner saat sisa masa aktif H-3 dan H-1 (misal: *"Masa aktif Glow Pass-mu tersisa 3 hari lagi. Mau lanjut rawat kulit tanpa jeda? [Perpanjang Pass]"*).
3. **Pembersihan Klaim Medis di `PaymentSuccessPage.tsx`**:
   - Di `PaymentSuccessPage.tsx` terdapat teks *"Rekomendasi Medis Mendalam"*. Tolong ganti dengan benefit kosmetik patuh PerBPOM No. 3/2022 untuk GLOW Pass (100 kuota, Rp 25rb) dan PRO Pass (500 kuota, Rp 49rb).

---

## 4. Invarian yang Wajib Dijaga (Sesuai `AGENTS.md`)

1. **`universal_ai` adalah Anchor Tunggal Kuota**:
   - Pemotongan kuota Glow Pass (100) dan Pro Pass (500) **WAJIB** melalui RPC `deduct_quota` dengan target slug `universal_ai`.
2. **Atomic Money & Subscriptions**:
   - Manipulasi status pembayaran dan pass dilarang keras dilakukan langsung dari frontend via Supabase client write. Semua transisi status wajib melewati Stored Procedure PostgreSQL berstatus `SECURITY DEFINER`.
3. **Single Payment Gateway Source of Truth**:
   - Seluruh transaksi baru diarahkan 100% ke Tripay.
4. **Clean Build & Zero Downtime**:
   - Perubahan skema tidak boleh merusak fungsi yang sudah berjalan di production (`tsc -b && vite build` harus 100% clean).

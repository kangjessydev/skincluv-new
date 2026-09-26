# RFC 010 — Catatan Konsensus Dewan AI (Production Protocol)

**Topik**: Tripay Prepaid Access Pass (30 Hari), Webhook Resilience, Expiration State Machine & Quota Lifecycle  
**Tanggal**: 2026-09-26  
**Status**: In Review (Claude: Approved; Waiting for ChatGPT, DeepSeek, Kimi)

---

## 1. Masukan dari Claude (Chief Software Architect)

### 1.1 Verifikasi Empiris Celah
- **Konfirmasi Celah Quota Lockout**: Terverifikasi 100% nyata di `process_tripay_payment` (Migration 049). Baris `subscriptions` di-UPDATE in-place (mempertahankan `subscription_id` yang sama), namun `quota_usage.used_count` tidak pernah di-reset. Akibatnya user yang memperpanjang pass tetap terkunci.
- **Konfirmasi Celah Zombie Pass**: Terverifikasi 100% nyata di `invoke-ai/index.ts` dan `subscriptionHelpers.ts`. Pengecekan hanya menggunakan `status = 'active'` tanpa memverifikasi `expires_at > now()`.

### 1.2 Keputusan Arsitektur
1. **Opsi B (PostgreSQL View `active_subscriptions`) sebagai Ground Truth Akses**:
   - Menolak Opsi A (Lazy on-read side-effect write) karena menggabungkan READ dengan WRITE rawan race condition dan rentan terlewat oleh developer pada query path baru.
   - Membuat view `public.active_subscriptions`:
     ```sql
     CREATE OR REPLACE VIEW public.active_subscriptions AS
     SELECT s.*, t.slug AS tier_slug, t.name AS tier_name
     FROM public.subscriptions s
     JOIN public.subscription_tiers t ON s.tier_id = t.id
     WHERE s.status = 'active' AND s.expires_at > now();
     ```
   - Semua pengecekan (`invoke-ai`, `deduct_quota`, frontend helper) membaca dari view ini. Bersifat deterministik dan zero-latency.
   - Opsi C (pg_cron) hanya menjadi lapisan sekunder (untuk batch reporting / reminder), bukan penentu otorisasi akses real-time.

2. **Reset Kuota Instan di `process_tripay_payment`**:
   - Karena model bisnis adalah **Prepaid Pass (bukan recurring anniversary subscription)**, setiap pembelian adalah "beli kuota segar".
   - Di `process_tripay_payment`, saat status beralih ke `PAID`:
     ```sql
     -- Reset pemakaian kuota untuk pass yang baru diperpanjang
     DELETE FROM public.quota_usage WHERE subscription_id = v_existing_sub.id;
     ```
   - Menolak over-engineering `billing_period_start` karena itu pola untuk subscription recurring auto-debit yang tidak relevan dengan Tripay.

3. **Deprecate Xendit Bertahap**:
   - Jangan langsung `DROP TABLE` data finansial.
   - Pastikan RLS terkunci ketat, hapus referensi di kode dan `config.toml`, tandai deprecated di migration, dan baru drop di masa mendatang jika dipastikan bersih.

---

## 2. Masukan dari ChatGPT (Security & Concurrency Red Team)

### 2.1 Verdict: REQUEST CHANGES (Dengan 3 P0 & 1 P1)

1. **P0-1: Hapus Direct DB Mutation dari `tripay-check-status` (All Roads Lead to One Transaction)**:
   - Dilarang keras memiliki dua jalur mutasi pembayaran terpisah (`tripay-webhook` vs `tripay-check-status`).
   - Jika `tripay-check-status` mendapati status Tripay sudah `PAID` sementara DB masih `UNPAID`, fungsi ini **WAJIB memanggil Stored Procedure yang sama: `process_tripay_payment()`**.
   - `FOR UPDATE` di level PostgreSQL menjadi pengendali konkurensi tunggal. Jika webhook dan status-check tiba bersamaan, salah satu akan menunggu lock dan request kedua menerima `ALREADY_PAID` secara aman.

2. **P0-2: Simpan `total_amount_idr` (Expected Payable Amount) pada `tripay_invoices`**:
   - Tripay menambahkan fee admin / kode unik (misal nominal dasar Rp 25.000 menjadi total tagihan Rp 26.500).
   - Simpan `amount_idr` (nominal dasar) DAN `total_amount_idr` (nominal yang diharapkan dibayar user).
   - Di `process_tripay_payment`, lakukan validasi exact match terhadap nilai tagihan yang diharapkan (`p_amount_received = v_invoice.total_amount_idr`), bukan membandingkan naif dengan harga paket dasar dan dilarang menggunakan `>=`.

3. **P0-3: Invoice State Transition + Entitlement Atomik**:
   - Transisi status hanya sah dari `UNPAID -> PAID`:
     ```sql
     UPDATE public.tripay_invoices
     SET status = 'PAID', reference = COALESCE(p_tripay_reference, reference), updated_at = now()
     WHERE id = v_invoice.id AND status = 'UNPAID';
     ```
   - Invariant Kunci:
     > *"For one successful Tripay payment, regardless of webhook retries, callback ordering, client refreshes, or concurrent status checks, the corresponding prepaid entitlement is granted exactly once."*

4. **P1: Audit Trail `tripay_callback_logs` & Partial Unique Index**:
   - Buat tabel `tripay_callback_logs` untuk forensik / monitoring duplicate delivery.
   - Tambahkan partial unique index:
     ```sql
     CREATE UNIQUE INDEX IF NOT EXISTS uq_tripay_invoices_reference 
     ON public.tripay_invoices(reference) WHERE reference IS NOT NULL;
     ```

5. **Aturan Transisi Tier (Renewal vs Upgrade)**:
   - **GLOW -> GLOW atau PRO -> PRO**: Akumulasi masa aktif `new_expiry = GREATEST(current_expiry, now()) + interval '30 days'`. Kuota di-reset ke kuota penuh.
   - **GLOW -> PRO (Upgrade)**: Tier langsung diubah ke PRO, kuota baru 500 pemakaian, dan masa aktif menjadi `now() + interval '30 days'`.
   - **PRO -> GLOW (Downgrade)**: User yang sedang aktif PRO tidak disarankan membeli GLOW sebelum masa PRO habis (disable tombol GLOW di UI jika sedang aktif PRO).

---

## 3. Masukan dari DeepSeek (Performance & Math Optimizer)

### 3.1 Deadlock Prevention — Advisory Lock per User (`pg_advisory_xact_lock`)
- Menghindari risiko circular wait antara `tripay_invoices` dan `subscriptions` dengan menggunakan **Advisory Lock per user**:
  ```sql
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  ```
- Ini secara otomatis men-serialize seluruh mutasi transaksi untuk user yang bersangkutan, dan otomatis dilepas saat transaksi selesai (*commit/rollback*).
- Menjadikan urutan penguncian kebal dari *deadlock* (Zero Deadlock Risk).

### 3.2 Formula Akumulasi Masa Aktif — Value-Preserving Prorated Math
- Menghitung nilai hari berdasarkan daily rate:
  - `daily_rate(GLOW) = 25.000 / 30 = Rp 833,33 / hari`
  - `daily_rate(PRO) = 49.000 / 30 = Rp 1.633,33 / hari`
- **Formula Adil (Value-Preserving)**:
  ```
  V_remaining = max(0, existing_expiry - now()) dalam hari × daily_rate(current_tier)
  V_new       = 30 × daily_rate(new_tier)
  V_total     = V_remaining + V_new
  total_days  = V_total / daily_rate(new_tier)
  new_expiry  = now() + total_days
  ```
- **Sifat Formula**:
  - Same Tier (PRO -> PRO): 7 hari sisa + 30 hari = 37 hari PRO (stacking alami).
  - Upgrade (GLOW -> PRO): Sisa 7 hari GLOW (senilai Rp 5.833) dikonversi adil menjadi +3,57 hari PRO (Total 33,57 hari PRO). Tidak ada rupiah user yang hangus!
  - Downgrade (PRO -> GLOW): Sisa 7 hari PRO dikonversi menjadi +13,72 hari GLOW (Total 43,72 hari GLOW).
  - Cap durasi maksimal: 180 hari (6 bulan) untuk mencegah penumpukan eksposur abnormal.

### 3.3 Indexing Strategy (<15 ms Webhook Latency)
- `idx_tripay_invoices_merchant_ref` (UNIQUE)
- `idx_tripay_invoices_reference` (Partial Index `WHERE reference IS NOT NULL`)
- `idx_tripay_invoices_user_created` (Composite `user_id, created_at DESC`)
- `idx_subscriptions_user_active` (Partial Unique `user_id WHERE status IN ('active', 'trial')`)
- `idx_subscriptions_expires_at` (`expires_at WHERE status = 'active'`)
- Colocation infra: Supabase region Singapore (`ap-southeast-1`) memastikan latensi SQL ~3 ms + network ~7 ms = total webhook latency < 15 ms.

---

## 4. Masukan dari Kimi (Clinical Skincare & Regulatory / UX)

### 4.1 Pembersihan Pelanggaran PerBPOM No. 3/2022
- Teks *"Rekomendasi Medis Mendalam"* di `PaymentSuccessPage.tsx` adalah pelanggaran jelas batas kosmetik vs layanan medis.
- Wajib diganti menjadi: **"Rekomendasi Perawatan Kulit yang Dipersonalisasi"**.
- Menghapus semua istilah medis ("diagnosis", "konsultasi dokter") dan kata absolut/superlatif ("paling akurat", "ampuh").
- Menambahkan disclaimer wajib di footer: *"Skincluv adalah alat bantu perawatan kulit berbasis AI — bukan pengganti konsultasi dokter kulit."*

### 4.2 Copywriting Anti-Cemas (Prepaid Pass 30 Hari)
- **Pricing Card**:
  ```
  Rp 25.000 / 30 hari
  Sekali bayar. Selesai.
  Tanpa auto-debit • Tanpa langganan tersembunyi • Tanpa penalti
  ```
- **Checkout CTA Trust Box**:
  ```
  🔒 Pembayaran kamu aman & transparan
  Ini bukan langganan bulanan. Ini Paket Akses 30 Hari — sekali bayar, kuota langsung aktif.
  ✅ Saldo rekening / e-wallet TIDAK AKAN pernah terpotong otomatis
  ✅ Tidak ada auto-renewal. Tidak ada tagihan kejutan.
  ✅ Saat 30 hari habis, akunmu otomatis kembali ke Free Tier
  ✅ Data scan & riwayatmu tetap aman, tidak dihapus
  ```

### 4.3 Reminder Banner Masa Aktif (H-3 dan H-1)
- Nada pelayanan informatif tanpa dark pattern (tombol dismiss *"Nanti saja"* / *"Tidak sekarang"* berbobot setara, tanpa countdown merah panik).

### 4.4 Checklist Dinamis Benefit Pass di Layar Sukses
- Menampilkan checklist sesuai paket yang dibeli (GLOW 100 kuota vs PRO 500 kuota), bukan hardcoded PRO untuk semua user.

---

## 5. Rencana Aksi Implementasi (Consensus Action Plan)

### Tahap 1: Backend Database & Stored Procedure (Migration 062)
1. **Advisory Lock & Prorated Math**: Perbarui `process_tripay_payment` dengan `pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0))`, formula prorata DeepSeek, dan reset kuota `DELETE FROM public.quota_usage WHERE subscription_id = v_existing_sub.id`.
2. **View `public.active_subscriptions`**: Buat view deterministik `status = 'active' AND expires_at > now()`.
3. **Audit Log & Indeks**: Buat tabel `tripay_callback_logs` dan pasang 5 indeks performa Tripay.
4. **Kolom `total_amount_idr`**: Tambahkan kolom `total_amount_idr` pada `tripay_invoices`.

### Tahap 2: Edge Functions Refactoring
1. **`tripay-invoice`**: Simpan `total_amount` dari Tripay ke `total_amount_idr`.
2. **`tripay-webhook`**: Catat log ke `tripay_callback_logs`, verifikasi HMAC, dan panggil `process_tripay_payment`.
3. **`tripay-check-status`**: Hapus mutasi manual Deno! Jika status Tripay `PAID` dan DB `UNPAID`, panggil `process_tripay_payment`.
4. **`invoke-ai`**: Arahkan pengecekan langganan aktif ke view `active_subscriptions`.

### Tahap 3: Frontend UX & Copywriting
1. **`CheckoutPage.tsx`**: Perbaiki harga GLOW (Rp 25.000), tambahkan Trust Box anti-cemas Kimi.
2. **`PaymentSuccessPage.tsx`**: Bersihkan klaim medis, buat checklist benefit dinamis GLOW (100) / PRO (500), tambahkan disclaimer BPOM.
3. **`PricingPage.tsx`**: Pasang copy *"Sekali bayar. Selesai. Tanpa auto-debit"*.
4. **`DashboardPage.tsx`**: Pasang banner reminder H-3 & H-1 jika masa aktif mendekati kedaluwarsa.


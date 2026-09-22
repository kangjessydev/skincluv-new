# 🏛️ RFC 002: Audit Konkurensi Transaksi Finansial & Webhook

**Tanggal**: 2026-09-22  
**Status**: Consensual Review (Antigravity, Claude, ChatGPT)  
**Tingkat Urgensi**: 🔴 P0 - Financial Integrity & Zero-Exploit

---

## 1. Executive Summary (Konsensus AI Council)

Audit bersama antara **ChatGPT (Security Red Teamer)** dan **Claude (Chief Architect)** berhasil memetakan 5 titik rawan konkurensi fatal pada sistem transaksi Skincluv sebelum go-live:

| Komponen | Masalah Kritis | Dampak Jika Diserang | Solusi Terverifikasi |
| :--- | :--- | :--- | :--- |
| **`deduct_coins`** | `reference_id` belum diperiksa idempotensinya | Request ganda / retry memotong saldo ganda | RPC mendefinisikan semantik idempotensi: ref sama + amount sama = return existing, amount beda = reject. |
| **`claim_mission`** | TOCTOU race pada `SELECT EXISTS` & `user_missions` | User klik cepat saat klaim misi harian mendapatkan koin berganda | `SELECT ... FOR UPDATE` pada `user_missions` + constraint unik pada ledger. |
| **`rollback_deduction`** | Refund belum terikat referensi unik | Jika AI error dipanggil ganda, refund masuk berkali-kali | Referensi deterministik `REFUND-[UUID]` unik. |
| **Tripay Webhook** | Update invoice dan aktivasi subscription terpisah di Edge Function | Double subscription duration / kuota jika webhook retry | Satukan ke dalam 1 Stored Procedure atomik: transisi `UNPAID -> PAID` + entitlement. |
| **`invoke-ai`** | `const tempRef = crypto.randomUUID()` di-generate di server | Retry dari client menghasilkan UUID baru | Client mengirimkan `idempotency_key` (per aksi klik tombol). |

---

## 2. Bukti Empiris dari Live Database (Pre-Migration Checks)

Sebelum migrasi dibuat, Antigravity menjalankan verifikasi langsung ke live DB:

### A. Temuan Duplikasi Riil (`coin_transactions`)
Query audit mendeteksi ada **2 reference_id duplikat riil** pada tanggal 25 Agustus 2026:
- `3c574fd4-39f5-4695-8c5d-bed27f673e1d`: Terklaim **4 kali** (Klaim Misi Harian +5 Koin) dalam selang beberapa detik.
- `e788a85f-935f-4984-84a4-06c35836f1ab`: Terklaim **2 kali** (Klaim Misi Harian +10 Koin).
> **Kesimpulan:** Celah TOCTOU pada `claim_mission` yang diprediksi Claude dan ChatGPT **benar-benar terbukti pernah terjadi** saat testing! Pemasangan unique constraint wajib membersihkan/mendeduplikasi anomali historis ini terlebih dahulu.

### B. Rekonsiliasi Saldo vs Ledger
- Ditemukan diskrepansi +1000 koin pada akun testing (akibat manual admin adjustment tanpa row ledger di masa lalu).

---

## 3. Desain Arsitektur Solusi (Action Items)

### Item 1: Hardening `deduct_coins`
- Tambahkan `SET search_path = ''` (mencegah privilege escalation).
- Semantik idempotensi:
  ```sql
  -- Jika reference_id sudah pernah diproses untuk user ini
  IF EXISTS (SELECT 1 FROM public.coin_transactions WHERE user_id = p_user_id AND reference_id = p_reference_id) THEN
     -- Periksa konsistensi amount
     ...
     RETURN true; -- No-op idempotent
  END IF;
  ```

### Item 2: Hardening `claim_mission`
- Gunakan `SELECT ... FOR UPDATE` pada `public.user_missions`.
- Kunci claim reference ke `coin_transactions(user_id, reference_id)`.

### Item 3: Stored Procedure `process_tripay_payment`
- Input: `p_merchant_ref`, `p_tripay_reference`, `p_amount_received`.
- Transisi status: `UPDATE public.tripay_invoices SET status = 'PAID' WHERE merchant_ref = p_merchant_ref AND status = 'UNPAID' RETURNING ...`
- Perpanjangan langganan cerdas:
  $$\text{base\_date} = \max(\text{now}(), \text{existing.expires\_at})$$
  $$\text{new\_expiry} = \text{base\_date} + 1\text{ month}$$
  *(Mencegah pemendekan masa aktif jika user memperpanjang sebelum paket habis).*

### Item 4: Frontend Contract `idempotency_key`
- Frontend menghasilkan UUID sekali saat tombol submit ditekan.
- Retry HTTP mengirimkan UUID yang sama di header/body.

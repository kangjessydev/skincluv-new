# 🏛️ Skincluv FE ↔ BE Parity Matrix (Buku Induk Paritas)

> **Status Dokumen**: Living Document & Inspection Ledger  
> **Inspektur Utama (External Auditor)**: Claude 3.5 Sonnet / Chief Software Architect  
> **Inspektur Pelaksana (Local Runtime)**: Antigravity IDE  
> **Mandat Mutlak**: Mencegah terjadinya *Orphan FE* (antarmuka berpenampilan jadi namun data masih statis/mock array) dan *Orphan BE* (tabel/RPC/edge function yang telah selesai di database namun tidak memiliki tombol/antarmuka pemanggil di aplikasi).

---

## 1. Definisi Status Paritas

* 🟢 **100% Connected (Production Ready)**: Backend (Tabel/RPC) sudah aktif, Frontend hook/komponen sudah terhubung, mutasi data atomik bekerja secara live, dan lolos uji tipe TypeScript.
* 🟡 **Partial / Transition (Dalam Pengerjaan)**: Backend atau Frontend sudah sebagian terhubung, namun masih ada aksi sekunder atau validasi yang belum terpasang.
* 🔴 **ORPHAN FE (UI Ghost / Mocked)**: Antarmuka visual sudah ada di halaman, tetapi datanya masih berupa hardcoded dummy array (`const dummy = [...]`), atau tombolnya hanya memicu `alert()`/`console.log()`.
* 🔴 **ORPHAN BE (Dead / Forgotten Capability)**: Fungsi PostgreSQL, RPC, atau Edge Function sudah dibuat di `supabase/migrations/`, tetapi tidak ada komponen UI di `src/` yang mengonsumsinya.

---

## 2. Matriks Paritas Fitur Utama Aplikasi

### A. Core Experience (User App)

| Domain / Fitur | Backend Artifacts (`supabase/`) | Frontend Artifacts (`src/`) | Status Paritas | Catatan Inspeksi |
| :--- | :--- | :--- | :--- | :--- |
| **Autentikasi & Sesi** | • `auth.users`<br>• `user_profiles`<br>• RLS policies | • `LoginPage.tsx`<br>• `RegisterPage.tsx`<br>• `useAuth.ts` | 🟢 **Connected** | Sesi tersimpan, profil pengguna termuat otomatis. |
| **Dashboard Overview** | • RPC `get_dashboard_overview()`<br>• `user_clinical_memories` | • `DashboardPage.tsx`<br>• `useDashboardData.ts` | 🟢 **Connected** | Kontrak JSONB cocok 1:1 karakter dengan TypeScript. |
| **Scan Wajah AI** | • `face_scans`<br>• Edge Function `invoke-ai` (Gemini)<br>• RPC `deduct_coins` | • `FaceScanPage.tsx`<br>• `useInvokeAI.ts`<br>• `CameraViewfinder.tsx` | 🟢 **Connected** | Idempotency SHA-256 aktif, kuota/kredit terpotong live. |
| **Scan Komposisi Produk** | • `ingredient_scans`<br>• `products_catalog`<br>• Edge Function `invoke-ai` | • `IngredientScanPage.tsx`<br>• `IngredientScanDetailModal.tsx` | 🟢 **Connected** | OCR teks dan pencocokan bahaya bahan aktif terhubung. |
| **Misi Glow Harian/Mingguan**| • `user_missions`<br>• `mission_templates`<br>• RPC reset mingguan/harian | • `MissionsPage.tsx`<br>• Inset checklist `.cluv-checklist-group` | 🟢 **Connected** | Klaim koin reward atomik via PostgreSQL stored procedure. |
| **Skinsistant AI Chatbot** | • `chat_sessions`<br>• `chat_messages`<br>• Edge Function `invoke-ai` (Qwen)<br>• Search Tavily | • `ChatbotPage.tsx`<br>• Layout Tipe C `.cluv-canvas-bleed` | 🟢 **Connected** | Streaming markdown, persistensi sesi, consent memory PDP. |
| **Riwayat Scan Kulit** | • `face_scans`<br>• `ingredient_scans`<br>• RPC `get_scan_history` | • `ScanHistoryPage.tsx`<br>• Segmented tabs | 🟢 **Connected** | Filter multi-tipe dan pagination riwayat terhubung. |
| **Mutasi Credits (Koin)** | • `coin_balances`<br>• `coin_transactions` | • `CoinHistoryPage.tsx`<br>• `.cluv-ledger-card` | 🟢 **Connected** | Riwayat kredit masuk dan keluar live dari DB. |
| **Faktur Tagihan & Pembayaran**| • `tripay_invoices`<br>• Edge Function `tripay-webhook`<br>• Non-cascade SET NULL | • `ProfileBillingPage.tsx`<br>• `CheckoutPage.tsx`<br>• `PaymentSuccessPage.tsx` | 🟢 **Connected** | Status invoice pending/paid live dari Tripay gateway. |
| **Edit Profil Kulit** | • `user_skin_profiles`<br>• `skin_types` enum | • `ProfileSkinPage.tsx`<br>• Layout Tipe B `.cluv-canvas-focused` | 🟢 **Connected** | Form preferensi kulit tersimpan aman di tabel profil. |

---

### B. Admin & Telemetri Suhu Sistem

| Domain / Fitur | Backend Artifacts (`supabase/`) | Frontend Artifacts (`src/pages/admin/`) | Status Paritas | Catatan Inspeksi |
| :--- | :--- | :--- | :--- | :--- |
| **Manajemen Pengguna** | • `user_profiles` admin view<br>• RLS `role = 'admin'` | • `AdminUsersPage.tsx` | 🟢 **Connected** | Daftar pengguna, suspend akun, saldo koin live. |
| **Audit Logs Sistem** | • `system_audit_logs` | • `AdminAuditLogsPage.tsx` | 🟢 **Connected** | Jejak aktivitas admin dan transaksi tercatat live. |
| **Kesehatan Sistem & Provider**| • `ai_provider_health`<br>• Latency logs | • `AdminSystemHealthPage.tsx` | 🟢 **Connected** | Metrik uptime Gemini, OpenRouter, Qwen live. |
| **Buku Pedoman AI (Handbook)**| • `ai_handbook_knowledge` | • `AdminHandbookPage.tsx` | 🟢 **Connected** | Knowledge handbook CRUD live tersinkron ke RAG chatbot. |
| **Financial Treasury & WAC** | • `provider_deposit_ledgers`<br>• `daily_cost_rollups` | • `AdminFinancialsPage.tsx` | 🟢 **Connected** | Grafik beban akrual WAC vs pergerakan kas deposit. |

---

## 3. Protokol Audit bagi AI Inspektur (Cara Menjalankan Audit)

Setiap kali AI bertindak sebagai Inspektur Paritas:

1. **Pindai Frontend untuk Potongan Mock/Dummy**:
   ```bash
   # Cari variabel dummy atau mock di halaman aktif
   grep -rn "const mock" src/pages/
   grep -rn "TODO: connect" src/pages/
   ```
2. **Pindai Backend untuk Orphan RPC**:
   ```bash
   # Kumpulkan semua function di migration
   grep -rn "CREATE OR REPLACE FUNCTION" supabase/migrations/
   # Cross-check apakah nama fungsinya dipanggil di src/
   ```
3. **Verifikasi Kontrak Tipografi & Data**:
   * Pastikan interface TypeScript di `src/types/` memiliki field yang 1:1 identik dengan payload JSONB hasil `jsonb_build_object` di SQL RPC.

# Laporan Pengujian Otomatis (Automated Test) & Panduan Uji Manual Kesiapan Produksi

- **Tanggal:** 2026-11-09
- **Peran:** `role-devops` & `role-inspektur`
- **Target Lingkungan:** `skincluv` (`gapctakvmorjafqxaqjk`) & `skincluv-prod` (`vxyyediuoyxbozbizswi`)
- **Hasil Pengujian Otomatis:** **34/34 LULUS (100% PASS, 0 FAIL)** + **Invarian Database 100% Terverifikasi**

---

## 1. Hasil Pengujian Otomatis (34 Skenario E2E + Invarian DB)

### A. Kualitas Build & Kompilasi (`tsc -b && vite build`)
- **TypeScript Compiler (`tsc -b`)**: **LULUS (0 Error)**
- **Production Bundle (`vite build` + PWA Service Worker)**: **LULUS (3,28 detik, 96 precache entries)**
- **Secret Leakage Scan (`src/`)**: **CLEAN (0 rahasia/key bocor di kode frontend)**

### B. Verifikasi Invarian Arsitektur Database Live (`supabase db query --remote --read-only`)
| Invarian | Parameter Pemeriksaan | Hasil Aktual di DB | Status |
| :--- | :--- | :--- | :--- |
| **Invarian 1** | `universal_ai` aktif di `public.ai_features` | `1` (`is_active = true`) | ✅ LULUS |
| **Invarian 2** | `face_validation` `credit_cost = 0` & aktif | `1` (`credit_cost = 0, is_active = true`) | ✅ LULUS |
| **Invarian 6** | Aturan kontraindikasi deterministik (`clinical_condition_rules`) | `15` aturan aktif | ✅ LULUS |
| **Invarian 15** | Buku panduan resmi (`skincluv_handbook`) | `10` entri aktif | ✅ LULUS |
| **Invarian 18** | Harga paket resmi (`subscription_tiers`) | `free: Rp0, glow: Rp25.000, premium: Rp49.000` | ✅ LULUS |
| **Kontrak 5.2** | Skema kanonikal RPC `get_user_dashboard_summary` | `true` (`skin_assessment`, `scan_counts`, `recent_scans`, `product_summary`) | ✅ LULUS |
| **Katalog Misi** | Jumlah misi aktif di `public.missions` | `13` misi aktif | ✅ LULUS |

### C. Pengujian Penetrasi Keamanan RLS, View, RPC, & Edge Functions (34/34 PASS)
- **Isolasi RLS 16 Tabel (`S-RLS-*`)**: Seluruh percobaan baca tanpa login (`anon`) ke `profiles`, `face_scans`, `ingredient_scans`, `chat_sessions`, `chat_messages`, `user_clinical_memories`, `chat_session_summaries`, `coin_balances`, `coin_transactions`, `tripay_invoices`, `provider_deposits`, `ai_request_logs`, `admin_audit_logs`, `contact_messages`, `missions`, dan `products` mengembalikan **0 baris bocor**.
- **Proteksi View (`S-VIEW-*`)**: Percobaan akses `anon` ke `provider_balances` dan `active_subscriptions` ditolak keras dengan kode PostgreSQL **`42501: permission denied for view`**.
- **Proteksi Eksekusi RPC `SECURITY DEFINER` (`S-RPC-*`)**: Seluruh 10 percobaan eksploitasi tanpa izin ke `process_tripay_payment`, `rollback_deduction`, `deduct_coins`, `deduct_quota`, `get_decrypted_secret`, `set_vault_secret`, `admin_adjust_user_coins`, `admin_set_user_role`, `get_market_correlations`, dan `get_market_intelligence_stats` ditolak keras dengan kode **`42501: permission denied for function`**.
- **Gerbang Otentikasi & Signature Edge Functions (`E-FN-*`)**:
  - `/functions/v1/invoke-ai` → **`HTTP 401 Unauthorized`** (tanpa token valid)
  - `/functions/v1/admin-set-api-key` → **`HTTP 401 Unauthorized`** (tanpa token admin)
  - `/functions/v1/tripay-invoice` → **`HTTP 401 Unauthorized`** (tanpa token user)
  - `/functions/v1/tripay-check-status` → **`HTTP 401 Unauthorized`** (tanpa token user)
  - `/functions/v1/tripay-webhook` → **`HTTP 400 Bad Request`** (saat diberi signature HMAC palsu)

---

## 2. Panduan Uji Manual (Manual Test Checklist) untuk User

1. **Cek Beranda (`/dashboard`)**: Pastikan sapaan waktu dan strip informasi menampilkan *Ritme Kulit Hari Ini* (`Ritme Pagi/Siang/Sore/Malam`) tanpa angka suhu/UV palsu, serta ringkasan scan dan misi tampil normal.
2. **Cek Halaman Misi (`/missions`)**: Pastikan *Total Credits Diperoleh* tidak lagi menampilkan angka palsu `387` untuk akun baru, dan kartu check-in 7 hari (`H1`–`H7`) dimulai dari `H1` sesuai riwayat klaim asli.
3. **Cek Scan Wajah (`/face-scan`) & Scan Komposisi (`/ingredient-scan`)**: Coba unggah/ambil 1 foto wajah dan 1 foto komposisi produk untuk memastikan alur analisis dan pemotongan kredit berjalan lancar.
4. **Cek Skinsistant AI (`/chatbot`)**: Kirim 1 pesan konsultasi dan coba toggle *Memory Consent* untuk memastikan balasan AI dan pengaturan privasi berjalan normal.
5. **Cek Halaman Kontak Publik (`/contact`)**: Isi dan kirim 1 pesan percobaan pada formulir *Tinggalkan Pesan untuk Kami* dan pastikan muncul konfirmasi berhasil (tersimpan ke tabel `contact_messages`).
6. **Cek Panel Admin Keuangan (`/admin/financials`)**: Pastikan tabel *Unit Economics per Fitur* menampilkan label efisiensi biaya per credit secara dinamis dan simulator menggunakan harga Pro Club `Rp 49.000`.
7. **Cek Pemakaian Token di Google AI Studio vs `/admin/logs`**: Seluruh 4 fitur AI (`chatbot`, `face_analysis`, `face_validation`, `ingredient_scan`) telah disatukan ke `gemini-3.5-flash` (`gemini_api_key`). Setelah melakukan 1x chat atau scan, bandingkan angka `tokens_used` di `/admin/logs` dengan grafik **Usage** di Google AI Studio (`aistudio.google.com/usage`).

---

## 3. Catatan Rencana Pengaturan Hosting: Vercel (DEV) vs Cloudflare Pages (PROD)
*(Dicatat untuk dieksekusi bersama pengguna saat sesi testing & deployment)*

### A. Hosting Development — Vercel
- **Target Branch**: `development`
- **File Konfigurasi Keamanan & SPA**: [vercel.json](file:///home/kangjessy/Documents/projects/skinscan/skincluv/vercel.json)
- **Environment Variables di Dashboard Vercel**:
  - `VITE_SUPABASE_URL` = `https://gapctakvmorjafqxaqjk.supabase.co` (Project `skincluv` — DEV)
  - `VITE_SUPABASE_ANON_KEY` = *(Anon Key dari project `gapctakvmorjafqxaqjk`)*

### B. Hosting Production — Cloudflare Pages (Menggantikan Netlify)
- **Target Branch**: `main` (dengan opsi pembatasan rilis hanya pada Git Tag resmi `v*`)
- **File Konfigurasi Keamanan & SPA**: [public/_headers](file:///home/kangjessy/Documents/projects/skinscan/skincluv/public/_headers) & [public/_redirects](file:///home/kangjessy/Documents/projects/skinscan/skincluv/public/_redirects) (otomatis ter-bundle ke `dist/_headers` dan `dist/_redirects` saat `npm run build`)
- **Environment Variables di Dashboard Cloudflare Pages**:
  - `NODE_VERSION` = `22`
  - `VITE_SUPABASE_URL` = `https://vxyyediuoyxbozbizswi.supabase.co` (Project `skincluv-prod` — PROD)
  - `VITE_SUPABASE_ANON_KEY` = *(Anon Key dari project `vxyyediuoyxbozbizswi`)*
- **Daftar Persiapan Sebelum Live di PROD (`vxyyediuoyxbozbizswi`)**:
  - Memasukkan API Key (`gemini_api_key`, `groq_api_key`, `TAVILY_API_KEY`) melalui halaman `/admin/models` di lingkungan Production (atau via Vault) karena saat ini `vault.secrets` di `vxyyediuoyxbozbizswi` masih `0`.


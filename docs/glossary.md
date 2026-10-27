# Glosarium Istilah Proyek: Skincluv

Daftar istilah baku domain bisnis dan arsitektur proyek agar Tim Pengembang, AI Council, dan Pengguna memiliki bahasa yang selaras dan konsisten.

---

## 1. Terminologi Bisnis & Antarmuka Pengguna (User-Facing)

| Istilah Baku | Definisi / Makna | Istilah Terlarang (Antipattern) | Catatan Kepatuhan |
|---|---|---|---|
| **AI Skin Assessment** | Analisis observasi visual kondisi kulit wajah oleh AI (tekstur, kelembapan, pori, kemerahan). | *Diagnosis Medis, Hasil Klinis, Vonis Dermatologis* | Kepatuhan UU Kesehatan No. 17/2023 & batasan non-terapeutik. |
| **Ingredient Scan** | Pemindaian daftar komposisi/bahan kosmetik untuk mendeteksi potensi komedogenik atau alergen. | *Uji Lab Klinis, Uji Medis* | Bersifat edukatif berbasis basis data kosmetik publik. |
| **Skinsistant AI** | Asisten cerdas interaktif berbasis LLM (Qwen/Tavily) untuk konsultasi perawatan rutin. | *Dokter AI, Chatbot Medis* | Dilengkapi mikro-disclaimer: bukan pengganti dokter kulit. |
| **Credits / AI Credits** | Saldo poin yang digunakan pengguna untuk menjalankan pemindaian wajah atau komposisi. | *Koin, Token Kripto, Uang Digital* | Tabel internal DB tetap `coin_balances` (Invarian 23). |
| **Glow Missions** | Modul misi harian dan mingguan untuk melacak rutinitas perawatan kulit pengguna. | *Tugas Harian, Quest* | Memberikan reward credits secara atomik saat diselesaikan. |
| **Paket Akses (Tiers)** | Tingkatan langganan: Free Explorer (gratis), Glow Club, dan Pro Club. | *Tier, Membership, Kasta* | Memiliki kuota analisis bulanan via anchor `universal_ai`. |
| **Riwayat Tagihan** | Catatan faktur pembayaran langganan atau top-up credits via Tripay Payment Gateway. | *Billing History, Invoice Kasir* | Mempertahankan rekam jejak kas non-cascade (`ON DELETE SET NULL`). |

---

## 2. Terminologi Teknis & Arsitektur Sistem

| Istilah | Arti / Definisi Teknis | Lokasi Penerapan |
|---|---|---|
| **`universal_ai`** | *Virtual anchor feature* di tabel `ai_features` yang menjadi target pemotongan kuota subscriber (`deduct_quota`). | `supabase/functions/invoke-ai/`, Migration 041 |
| **`face_validation`** | Fitur gatekeeper 0-kredit kilat (`gemini-3.5-flash`, `thinking_budget: 0`) untuk menolak foto non-wajah. | `supabase/functions/invoke-ai/`, `FaceScanPage.tsx` |
| **Exact Idempotency** | Algoritma pencegah pemotongan kredit berulang untuk foto kanonikal SHA-256 yang sama dalam TTL 48 jam. | RFC 011, `useInvokeAI.ts`, `invoke-ai` |
| **MCID** | *Minimal Clinically Important Difference* (Ambang batas selisih < 5 poin dianggap variasi pencahayaan normal). | RFC 013, `useScanComparison.ts` |
| **WAC** | *Weighted Average Cost* — metode valuasi saldo deposit provider AI untuk pelaporan akrual riil bulanan. | RFC 015, `AdminFinancialsPage.tsx` |
| **Cluv Framework** | Micro-framework CSS murni modular berskala enterprise dengan penamaan selektor kanonikal `cluv-*`. | `src/styles/cluv/` |
| **Right to be Forgotten** | Kepatuhan UU PDP No. 27/2022: penghapusan total foto wajah biometrik saat akun atau rekam jejak dihapus. | RFC 016, `PrivacyCenterPage.tsx` |
| **Zero-Leakage Auth** | Mekanisme pembersihan token sensitif dari URL browser instan menggunakan `history.replaceState`. | RFC 016, `AuthCallbackPage.tsx` |

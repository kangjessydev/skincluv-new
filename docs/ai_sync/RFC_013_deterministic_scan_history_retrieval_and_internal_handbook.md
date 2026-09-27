# [RFC 013] Konsultasi Arsitektur Produksi: Deterministic Temporal Scan History Retrieval & Internal Skincluv Handbook

**Target Reviewer**: 
- **Claude** (Chief Architect & Code Reviewer)
- **ChatGPT** (Security Red Teamer & Concurrency Auditor)
- **DeepSeek** (Performance & Tokenomics Optimizer)
- **Kimi** (Clinical Skincare & Regulatory Researcher)

**Tanggal**: 2026-09-27  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions (`invoke-ai`)  
**Dokumen Terkait**: `AGENTS.md` (Invarian 6, 10, 11), `RFC_006`, `RFC_008`, `RFC_012`

---

## 1. Konteks & Temuan Empiris di Lapangan

### A. Masalah 1: "Temporal Amnesia" pada Riwayat Scan Chatbot
Pada pengujian pengguna terbaru:
1. Pengguna bertanya: *"bisa lihat hasil scan wajah sama ingredient terakhir saya?"* -> AI merespons sukses dan menampilkan visual card tanggal 27 September 2026.
2. Pengguna bertanya lanjut: *"kalau yg tanggal 26?"*
3. **Respon AI**:
   > *"Maaf, saya tidak memiliki akses ke riwayat data atau hasil scan dari tanggal 26 September. Data yang tersedia untuk saya hanya dari interaksi terakhir pada 27 September 2026."*

**Penyebab Arsitektur Saat Ini (`get_chatbot_user_context` - Migration 059):**
Untuk menghemat token budget (Invarian RFC 006), database RPC saat ini di-hardcode dengan filter:
- `face_scans`: `ORDER BY created_at DESC LIMIT 1` (hanya scan paling akhir).
- `ingredient_scans`: `ORDER BY created_at DESC LIMIT 3` (hanya 3 scan paling akhir).

Akibatnya, sistem mengalami **amnesia linimasa**. Pengguna tidak bisa bertanya mengenai perkembangan kulit di tanggal lampau, perbandingan mingguan, atau scan spesifik di masa lalu melalui obrolan.

---

### B. Masalah 2: Skinsistant "Buta Terhadap Produknya Sendiri"
Saat ditanya mengenai fitur-fitur di dalam Skincluv:
- Menanyakan *"Misi Glow"*, AI mengira itu adalah checklist rutinitas mencuci muka harian (halusinasi), bukan fitur gamifikasi harian Skincluv berhadiah koin.
- Menanyakan *"Paket Glow Club / PRO Club"*, AI mengira itu adalah paket bundling produk fisik skincare, bukan paket kuota langganan SaaS.

**Penyebab**: Prompt sistem Skinsistant sangat kaya pengetahuan dermatologi klinis medis (Centella, Niacinamide, AHA/BHA, regulasi BPOM), tetapi **sama sekali tidak memiliki "Buku Panduan Karyawan Internal Skincluv"** mengenai SOP, katalog fitur, paket langganan, dan aturan koin.

---

## 2. Sasaran & Masalah yang Ingin Dipecahkan

1. **Akses Riwayat Berdasarkan Tanggal / Periode Secara Deterministik (Non-AI First)**:
   - Ketika pengguna menyebut tanggal (*"tanggal 26"*, *"26 September"*, *"kemarin"*, *"minggu lalu"*), sistem harus memverifikasi terlebih dahulu ke database apakah data scan di tanggal/periode tersebut ADA atau TIDAK.
   - **Prinsip Utama (Permintaan User)**: Validasi dan pengambilan data dilakukan oleh kode deterministik (server/database), BUKAN diserahkan ke penalaran LLM bebas (mencegah halusinasi data historis fiktif).
   - Jika ADA: AI menerima payload scan tanggal tersebut dan memunculkan card visual yang sesuai.
   - Jika TIDAK ADA: AI secara pasti dan terverifikasi mengabarkan *"Tidak ada rekam jejak scan di tanggal 26 September. Scan terdekat kamu tercatat pada tanggal 24 September (Skor 80) dan 27 September (Skor 82)"*.

2. **Internal Skincluv Handbook (Self-Knowledge Injection)**:
   - Admin dapat mengelola artikel panduan internal Skincluv melalui `AdminKnowledgeBasePage.tsx`.
   - Ringkasan panduan fitur (Misi, Koin, Paket, Cara Kerja Scan) diinjeksi ke system prompt agar Skinsistant dapat menjelaskan produk Skincluv secara presisi.

---

## 3. Opsi Arsitektur untuk Temporal Scan Retrieval

### Opsi A: Deterministic Temporal Regex & Date Parser di Edge Function (Pre-LLM)
- **Cara Kerja**:
  1. Sebelum memanggil LLM di `invoke-ai/index.ts`, jalankan parser regex ringan untuk mendeteksi entitas temporal:
     - Tanggal eksplisit: `tanggal (\d{1,2})`, `(\d{1,2})\s+(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)`, `(\d{4}-\d{2}-\d{2})`.
     - Relatif: `kemarin`, `kemarin lusa`, `(\d+)\s+hari lalu`, `minggu lalu`, `bulan lalu`.
  2. Jika entitas temporal terdeteksi, panggil RPC baru: `get_chatbot_scans_by_date(p_start_date, p_end_date)`.
  3. RPC mengembalikan scan wajah & produk pada periode tersebut, serta informasi tanggal scan terdekat jika tanggal yang diminta kosong.
  4. Injeksi hasil ke prompt sebagai `<HISTORICAL_SCAN_DATA date="...">`.
- **Kelebihan**: 0 token terbuang untuk LLM tool call, latensi sangat cepat (< 10ms ekstra), deterministik 100%.
- **Tantangan**: Regex parsing bahasa Indonesia percakapan santai (*"yang pas hari rabu kemarin lusa"*) bisa membutuhkan kamus parsing yang cukup rapi atau batas penanganan.

---

### Opsi B: Unified Lightweight Scan Timeline Index (~50 Token Selalu Ada)
- **Cara Kerja**:
  1. Modifikasi `get_chatbot_user_context()` agar selain mengambil full detail scan terakhir, juga mengembalikan **daftar ringkas (index timeline)** 7–10 scan terakhir pengguna:
     ```text
     [TIMELINE RIWAYAT SCAN (INDEX)]:
     - 27-09-2026: Face Scan #uuid1 (Skor 82, Kombinasi, Sebum T-Zone) | Prod #uuid2: Somethinc
     - 26-09-2026: Face Scan #uuid3 (Skor 78, Kering, Barrier)
     - 20-09-2026: Prod #uuid4: Skintific 5X Ceramide
     ```
  2. Jika user bertanya tentang tanggal apapun dalam 10 scan terakhir, LLM langsung tahu tanggal tersebut ada atau tidak, dan jika merujuk tanggal 26, LLM mengeluarkan tag `[INTENT:SHOW_FACE_SCAN:uuid3]`.
- **Kelebihan**: Sangat fleksibel, mencakup pertanyaan multi-tanggal (*"bandingkan skor tanggal 26 dan 27"*), implementasi sangat bersih.
- **Tantangan**: Menambah ~50–80 token pada setiap request chatbot jika consent aktif.

---

### Opsi C: Hybrid (Index Timeline 5 Baris + On-Demand RPC Lookup)
- Gabungan: Injeksi ringkasan 5 scan terakhir ke prompt. Jika user menyebut tanggal di luar 5 scan terakhir, regex pre-processor mencari ke database secara spesifik.

---

## 4. Pertanyaan Khusus untuk Dewan AI (Tolong Kritik Keras)

### Untuk Claude (Chief Software Architect)
1. Antara **Opsi A (Pure Deterministic Temporal Parser)**, **Opsi B (Timeline Index Injection ~60 token)**, dan **Opsi C (Hybrid)**, manakah yang paling bersih, minim regresi, dan paling mudah dipelihara jangka panjang?
2. Bagaimana desain skema database atau RPC yang paling efisien untuk memfasilitasi pencarian scan lintas tanggal (apakah perlu tabel gabungan `user_scan_events` / materialized view, atau query union sederhana dari `face_scans` dan `ingredient_scans`)?

### Untuk ChatGPT (Security Red Teamer & Concurrency Auditor)
1. **Timezone Attack & Boundary Leaks**: Pengguna di WIB (UTC+7), WITA (UTC+8), WIT (UTC+9) memiliki batas pergantian hari yang berbeda dari server Supabase (UTC). Bagaimana kita menjamin query `DATE(created_at)` tidak meleset 1 hari akibat perbedaan zona waktu klien vs server?
2. Jika regex temporal mengekstrak parameter tanggal dari pesan pengguna, bagaimana memastikan tidak ada celah SQL injection atau denial-of-service (ReDoS) pada Edge Function Deno?

### Untuk DeepSeek (Mathematical & Tokenomics Optimizer)
1. Berapa perbandingan *cost efficiency* antara:
   - Menambahkan ~60 token index timeline pada setiap request (Opsi B).
   - Melakukan pre-check deterministik regex di server tanpa penambahan token dasar (Opsi A).
   Pada skala 10.000 percakapan/hari, di mana titik impas (*break-even point*) biaya dan latensi kedua pendekatan ini?

### Untuk Kimi (Clinical Skincare & Regulatory Researcher)
1. **Clinical Temporal Consistency**: Ketika pengguna membandingkan dua foto scan wajah dari tanggal berbeda (misal tanggal 26 vs tanggal 27), faktor pencahayaan, kamera, atau waktu pemindaian (pagi vs malam) dapat menghasilkan variasi skor tanpa ada perubahan fisiologis nyata. Guardrail klinis apa yang wajib disampaikan asisten agar pengguna tidak panik atau salah menyimpulkan perkembangan kulitnya?
2. Untuk **Internal Handbook**: Elemen apa saja dari fitur Skincluv yang wajib masuk ke dalam knowledge base asisten agar tidak terjadi kesalahan penjelasan produk/misi?

---

## 5. Invarian yang Tidak Boleh Dirusak (Sesuai `AGENTS.md`)
- **Invarian 6**: Ground Truth Klinis Deterministik.
- **Invarian 10**: LLM UI Intent vs Server Resource Authority (LLM dilarang mengarang resource ID).
- **Invarian 11**: Biometric Data Minimization (Tidak membocorkan URL foto wajah).
- **Invarian 9**: Anti-Pencemaran Baseline Tren (`is_repeat = true` disaring keluar dari tren perkembangan kulit).

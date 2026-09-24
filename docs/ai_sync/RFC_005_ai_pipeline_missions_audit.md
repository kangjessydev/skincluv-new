# 🏛️ RFC 005: Audit Arsitektur AI Pipeline, Standarisasi Scan Kulit & Gamifikasi Misi

**Target Reviewer**: Claude (Chief Architect) & ChatGPT (Security Red Teamer)  
**Kontributor**: DeepSeek (Performance) & Kimi (Clinical)  
**Tanggal**: 2026-09-24  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions (`main` @ `e8cfdc9`)  
**Tingkat Urgensi**: 🟡 P1 - Production Quality & Robustness

---

## 1. Konteks & State Kode Terkini (Ground Truth)

Dalam sprint terkini, Antigravity telah menyelesaikan modernisasi end-to-end pada 4 pilar inti:

1. **Ingredient Scan Engine (`supabase/functions/invoke-ai/index.ts` & `IngredientScanPage.tsx`)**:
   - Migrasi dari parser teks regex rapuh ke **Gemini Native Structured Output (`responseSchema`)**.
   - Penyingkiran total data hardcoded/palsu (mock steps, fake products, harga statis Rp89.000).
   - Sanitasi duplikasi bahan (seperti `Water/Aqua/Eau` disatukan) dan penghitungan real-time keselamatan formula.

2. **Neural Face Scan Engine (`FaceScanPage.tsx`)**:
   - Mempertahankan pipeline dual-gatekeeper: `face_validation` (0-credit gatekeeper via `gemini-2.5-flash`, `thinking_budget: 0`) menyaring foto non-wajah/buram -> jika lolos, trigger `face_analysis` (5 kredit via `gemini-3.6-flash`).
   - Tampilan diagnostik modern: Biometric laser HUD, breakdown 3 area klinis (Dahi/T-Zone, Pipi, Dagu/Rahang) yang membedah Diagnosis, Analogi Ramah, dan Rencana Aksi.
   - Hero Actives (bahan aktif rekomendasi seperti Salicylic Acid, Niacinamide, Ceramide) dengan intensi pencarian Shopee & tombol direct consultation ke Skinsistant Chatbot.

3. **Penyelarasan Riwayat Scan Kulit (`src/pages/app/ScanHistoryPage.tsx`)**:
   - Menghapus tampilan lama yang masih memakai fake e-commerce card.
   - Mengadopsi modal riwayat baru yang setara 100% dengan `FaceScanPage`: Radial Score Meter (`optimal`/`caution`/`warning`), 3-Area Granular Breakdown, Personal Tips (Hindari, Kurangi, Rutin Lakukan), dan Hero Actives.

4. **Audit Gamifikasi & Misi Glow (`MissionsPage.tsx` + DB Migration 053 + `invoke-ai`)**:
   - Penambahan kategori tab: **Semua, Harian, Mingguan, Milestone**.
   - Integrasi otomatis tracking konsultasi Chatbot (`daily_chatbot` +2 koin, `weekly_chatbot` +5 koin) di Edge Function `invoke-ai`.
   - Tombol shortcut pengerjaan misi (*Quick Action*) langsung mengarahkan user ke fitur relevan (`/app/scan`, `/app/ingredient-scan`, `/app/chat`, `/app/profile`).
   - Klaim hadiah koin divalidasi secara atomik melalui PostgreSQL RPC Stored Procedure `claim_mission` dengan row-locking.

---

## 2. Sasaran & Masalah yang Ingin Dipecahkan

Sebelum meluncurkan fitur-fitur ini ke publik skala besar (open production release), kami memerlukan tinjauan kritis (*peer-review*) dari Dewan AI:
- **Resilience**: Apakah struktur data `raw_ai_response` di riwayat scan tahan terhadap skema historis versi lawas tanpa memicu UI crash?
- **Anti-Abuse**: Apakah pemicu misi chatbot (`daily_chatbot`) rentan dieksploitasi oleh user yang melakukan spam chat 1 kata hanya untuk farming koin?
- **Cognitive Load & UX**: Apakah pemisahan hasil scan wajah ke dalam 3 area + Hero Actives sudah optimal untuk retensi pengguna?

---

## 3. Pertanyaan Spesifik untuk Reviewer (Tolong Kritik Keras)

### Untuk Claude (Chief Software Architect & Code Reviewer)
1. **Fallback & Backward Compatibility di `ScanHistoryPage.tsx`**:
   - Pengguna lama memiliki record di tabel `face_scans` dengan struktur `raw_ai_response` versi lawas (berisi `recommended_products` dengan format mock lama, bukan `hero_actives`).
   - Apakah sanitasi fallback di `ScanHistoryPage.tsx` sudah cukup defensif, atau apakah ada risiko `TypeError: undefined is not an object` pada edge case data historis?
2. **State Decoupling & Navigation Flow**:
   - Tombol "Tanya Cara Pakai di AI Chat" di Hero Actives mengirim prompt terformat ke chatbot melalui URL navigation state. Apakah pola ini sudah cukup elegan, atau lebih baik menggunakan persistent draft storage?

### Untuk ChatGPT (Security Red Teamer & Concurrency Auditor)
1. **Chatbot Mission Farming & Sybil Attack**:
   - Migration 053 menambahkan misi `daily_chatbot` (target: 1 chat, reward: 2 koin) dan `weekly_chatbot` (target: 5 chat, reward: 5 koin).
   - Di `invoke-ai`, setiap kali user sukses mengirim prompt chatbot, `record_mission_progress(user_id, 'chatbot', 1)` dipanggil.
   - Apakah ada celah di mana user mengirim 5 pesan kosong/spam pendek untuk memanen koin gratis, dan bagaimana mitigasi server-side terbaiknya (misal: validasi token length minimal atau cooldown)?
2. **Double Claim Protection**:
   - RPC `claim_mission` telah dipersenjatai row-locking, namun apakah ada celah pada sisi frontend di mana spam klik claim menimbulkan diskrepansi visual pada UI saldo?

### Untuk DeepSeek (Mathematical & Tokenomics Optimizer)
1. **Token Cost vs Value Delivery**:
   - Output JSON untuk `face_analysis` kini mencakup analisa 3 area granular, saran personal (hindari, kurangi, rutin), serta rekomendasi bahan aktif.
   - Rata-rata token output berkisar 800–1200 token (~18 detik latensi). Apakah ada pemotongan redundansi prompt yang bisa menghemat 20-30% token tanpa mengurangi kedalaman diagnosis klinis?

### Untuk Kimi (Clinical Skincare Researcher)
1. **Validasi Kontraindikasi Hero Actives**:
   - Sistem merekomendasikan bahan aktif berdasarkan keluhan area wajah (misal: Salicylic Acid untuk pori-pori/jerawat, AHA/Glycolic untuk tekstur).
   - Apakah prompt AI sudah cukup ketat dalam melarang layering bahan yang bertentangan (misalnya: tidak merekomendasikan Retinol bersamaan dengan Benzoyl Peroxide atau Vitamin C berkonsentrasi tinggi pada barrier yang sedang rusak)?

---

## 4. Invarian yang Wajib Dipertahankan
1. **`universal_ai` di `ai_features` JANGAN DIHAPUS**: Tetap menjadi virtual anchor mesin kuota subscription.
2. **`face_validation` adalah 0-Credit Gatekeeper**: Memakai `gemini-2.5-flash` dengan `thinking_budget: 0`.
3. **Atomic Balance Manipulation**: Manipulasi saldo koin dan klaim misi WAJIB via PostgreSQL RPC, dilarang direct SQL update dari client.

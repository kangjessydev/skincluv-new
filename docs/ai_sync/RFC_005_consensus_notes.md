# 🏛️ RFC 005: Consensus & AI Council Review Log

**Dokumen Induk**: `docs/ai_sync/RFC_005_ai_pipeline_missions_audit.md`  
**Status**: Active Review in Progress  
**Tanggal Mulai**: 2026-09-24  

---

## 1. Claude (Chief Software Architect & Code Reviewer)
**Waktu Submit**: 2026-09-24 15:19 WIB  
**Hasil Review & Temuan**:

1. **`ScanHistoryPage.tsx` Backward Compatibility**:
   - **Status**: ✅ **APPROVED / SECURE**.
   - **Catatan**: Mekanisme fallback `raw_ai_response` ke `{}` dan pengecekan `Array.isArray(...)` sudah defensif.
   - Priority chain eksplisit (`recommended_ingredients` -> `product_recommendations`) berhasil melindungi aplikasi dari `TypeError` pada data historis lama.

2. **Celah Keamanan Eksploitasi Misi Chatbot (`daily_chatbot` & `weekly_chatbot`)**:
   - **Status**: 🔴 **CRITICAL FINDING (Anti-Abuse Gating Needed)**.
   - **Analisis Claude**: Di `invoke-ai`, `record_mission_progress` dipanggil murni hanya berdasar keberhasilan respons AI tanpa ada validasi *effort* atau panjang pesan. User bisa mengirim teks 1 karakter ("a") sebanyak 5 kali untuk langsung memanen koin gratis.
   - **Rekomendasi Claude**: Wajib memasang gate validasi minimal pesan sebelum `record_mission_progress` dipanggil untuk action `chatbot`.

---

## 2. ChatGPT (Security Red Teamer & Concurrency Auditor)
**Waktu Submit**: 2026-09-24 15:31 WIB  
**Verdict**: 🔴 **REQUEST CHANGES (Pending Financial-Grade Gating)**  
**Temuan Kritis & Prinsip Arsitektur**:

1. **AI Pipeline adalah Financial Event Producer**:
   - `invoke-ai` bukan sekadar endpoint inferensi AI, tetapi kini juga memicu *business events* yang membagikan nilai ekonomi riil (Credits). Harus diaudit dengan standar yang sama seperti `deduct_coins` dan payment webhook.

2. **🔴 Definisi "Eligible Chatbot Interaction" (Bukan Sekadar Token Length)**:
   - Jangan hanya mengandalkan `length >= 20` karena rentan dibypass string dummy ("xxxx...") dan menghukum user yang bertanya singkat tapi legitimate ("Gimana cara pakainya?").
   - Syarat interaksi eligible:
     `Auth Valid` ➔ `Prompt Normal & Non-Empty` ➔ `Non-duplicate (Idempotency Key)` ➔ `Atomic Cooldown (misal 60 detik di level DB)` ➔ `AI Success`.

3. **Invarian Atomic Cooldown & Idempotensi End-to-End**:
   - Jangan lakukan pengecekan cooldown di TypeScript/Edge Function karena rentan TOCTOU race condition jika user submit cepat di 2 tab.
   - Cooldown dan event deduplikasi wajib atomik di dalam PostgreSQL Stored Procedure `record_mission_progress`.
   - **Invariant Baru**:
     `ONE logical user action ➔ ONE operation_id ➔ ONE AI operation ➔ ONE business event ➔ AT MOST ONE mission progress ➔ AT MOST ONE financial reward`.

4. **🟠 Normalizer Pattern untuk `raw_ai_response`**:
   - Gantikan pengecekan opsional chaining yang tersebar di banyak baris dengan **Domain Normalizer (`normalizeScanResult`)**.
   - Input (v1, v2, v3, legacy) ➔ diproses oleh `normalizeScanResult(raw)` ➔ menghasilkan output `NormalizedScanResult` yang stabil dan type-safe.

5. **🟡 Deterministic Contraindication Guardrail (Di Luar LLM)**:
   - Jangan mempercayakan validasi kontraindikasi skincare hanya pada prompt LLM.
   - Pasang rule engine deterministik sederhana: jika *skin barrier* terdeteksi rusak/kompromi, otomatis saring (*filter out*) Retinol atau eksfoliator kuat dari rekomendasi sebelum disajikan ke user.

6. **Kepatuhan Saldo Authoritative**:
   - UI tidak boleh optimistic `balance += reward`. Nilai saldo wajib mutlak berasal dari return value RPC `claim_mission` (`new_balance`).

7. **URL Navigation State vs Persistent Draft**:
   - ChatGPT sepakat dengan Claude: URL Navigation State untuk tombol "Tanya Cara Pakai" sudah tepat dan bersih untuk *transient intent*, tidak perlu persistent storage draft yang menambah overhead.

---

## 3. DeepSeek (Mathematical & Performance Optimizer)
**Waktu Submit**: 2026-09-24 15:36 WIB  
**Verdict**: 🟡 **ACTIONABLE LATENCY & TOKENOMICS AUDIT**  
**Temuan Matematis & Solusi Kinerja**:

1. **Dekomposisi Latensi 18 Detik (`face_analysis`)**:
   - 1.000 token dalam 18 detik = ~55 tok/s (terlalu lambat untuk tier Flash yang harusnya 150–250 tok/s).
   - Bottleneck utama:
     - Input preprocessing / tokenisasi gambar: ~4–6 detik.
     - Thinking / reasoning tokens: ~3–5 detik (jika `thinking_budget` aktif atau di-omit).
     - Output generation: ~5 detik.
     - Non-streaming buffering: ~2–3 detik.
   - **Target Latensi**: Dapat ditekan dari **18 detik ➔ 10–11 detik (P0) ➔ 8–9 detik (P0+P1)**!

2. **Matematika Abuse Margin Koin Chatbot**:
   - Biaya 5 chat spam pendek ke provider AI: **Rp 6,05**.
   - Reward 7 koin = bernilai **Rp 16,8 hingga Rp 84,0** dalam bentuk kredit scan.
   - **Abuse Margin mencapai 2,8× hingga 13,9×**! Setiap Rp 1 biaya yang dihabiskan abuser menghasilkan nilai Rp 14.

3. **Solusi Rekayasa P0**:
   - **Instrumentasi `usageMetadata`**: Catat `promptTokenCount`, `candidatesTokenCount`, dan `thoughtsTokenCount` di `aiProviders.ts`.
   - **Kompresi Gambar Client-side (800px / JPEG 0.70)** sebelum upload ke `invoke-ai` (menghemat ~2–4 detik preprocessing gambar).
   - **Audit `thinking_budget`**: Evaluasi apakah `face_analysis` membutuhkan budget penalaran penuh atau bisa dibatasi untuk memangkas ~3–5 detik.
   - **Layered Abuse Gate**: Min content gate + Atomic Cooldown 60s di RPC + Daily Coin Cap (50 koin/hari).

4. **Solusi Rekayasa P1 (Optimasi Output Schema −25%)**:
   - Batasi panjang analogi (*Analogi Ramah: maksimal 15 kata*).
   - Deduplikasi bahan aktif secara global lintas area wajah.
   - Circuit breaker hard-limit 15.000 input tokens.

---

## 4. Kimi (Clinical Skincare & Regulatory Researcher)
**Waktu Submit**: 2026-09-24 15:39 WIB  
**Verdict**: 🔴 **CRITICAL CLINICAL SAFETY ACTION ITEMS (P0)**  
**Temuan Klinis & Regulasi Dermatologi**:

1. **🔴 P0-1: `face_analysis` Tidak Diinjeksi Matriks Kontraindikasi Fatal**:
   - Injeksi matriks bahaya BPOM & kontraindikasi fatal sebelumnya hanya aktif untuk `ingredient_scan` dan `chatbot`.
   - `face_analysis` yang merekomendasikan **Hero Actives** sama sekali tidak memiliki panduan batas kontraindikasi. Gemini bisa merekomendasikan Retinol + AHA bersamaan atau bahan agresif saat barrier rusak.
   - **Solusi**: Masukkan `'face_analysis'` ke daftar injeksi matriks dengan klausul larangan meresepkan 2 bahan berpasangan fatal, larangan bahan keras (Retinoid/AHA/BHA/Vit C murni) jika barrier *compromised*, serta kewajiban menyertakan waktu pakai (AM/PM) dan sunscreen.

2. **🔴 P0-2: Hero Actives Tidak Divalidasi Terhadap `user_clinical_memories`**:
   - Riwayat memori klinis alergi & sensitivitas user di DB saat ini hanya diinjeksi ke chatbot.
   - Akibatnya, `face_analysis` bisa merekomendasikan bahan yang user alergi.
   - **Solusi**: Fetch memori `allergy`, `sensitivity`, `treatment_reaction` untuk `face_analysis`, lalu terapkan **deterministik post-filter** pada `recommended_ingredients`.

3. **🔴 P0-3: `danger_combos` di `ingredient_scan` Murni Mengandalkan LLM**:
   - Output `danger_combos` belum divalidasi ke tabel `ingredient_interactions` server-side, berpotensi memicu halusinasi bahaya palsu (*false positive*) atau luput mendeteksi bahaya riil (*false negative*).
   - **Solusi**: Filter deterministik server-side sebelum response dikirim ke client.

4. **🟡 P1 Klinis**:
   - Naikkan query limit `ingredient_interactions` dari 20 ke **100**.
   - Jadikan `ingredient_interactions` sebagai *single source of truth* (drop redundansi `incompatible_with`).
   - Standardisasi enum `severity`: `fatal | caution | myth`.

---

## 5. Matriks Tindakan Konsensus Penuh Dewan AI (Final Implementation Roadmap)

Semua AI (Claude, ChatGPT, DeepSeek, Kimi) telah mencapai **konsensus bulat**. Antigravity sebagai *Lead Runtime Builder* akan mengeksekusinya dalam urutan prioritas:

### 🚀 Sprint 1: Security, Financial & Clinical P0 (Wajib Sebelum Release)
1. **[Clinical & Safety] Gate Kontraindikasi & Barrier Guardrail di `invoke-ai`**:
   - Injeksi matriks kontraindikasi fatal & BPOM ke `face_analysis`.
   - Post-filter deterministik `recommended_ingredients` terhadap `user_clinical_memories` (alergi/sensitivitas).
   - Validasi `danger_combos` server-side terhadap tabel `ingredient_interactions` (`.limit(100)`).
2. **[Financial & Anti-Abuse] Atomic Cooldown & Idempotency RPC**:
   - Migrasi DB: Update Stored Procedure `record_mission_progress` dengan validasi Cooldown Atomik 60s per user untuk action `chatbot` + parameter `reference_id` agar retry jaringan tidak menggandakan reward.
   - Gating validasi di `invoke-ai`: Prompt chatbot wajib non-empty, trimmed, min 15 karakter / 4 kata yang bermakna.
3. **[Performance] Telemetri & Kompresi Foto**:
   - Logging `usageMetadata` (input, output, thoughts) di `aiProviders.ts`.
   - Client-side image compression di `FaceScanPage.tsx` (800px / JPEG 0.70) untuk memangkas 4–6 detik latensi upload & tokenisasi.

### 🛠️ Sprint 2: Arsitektur & Optimasi P1
4. **[Clean Code] Domain Normalizer (`scanNormalizer.ts`)**:
   - Satukan parsing `raw_ai_response` versi legacy dan v2 ke satu fungsi murni `normalizeScanResult`.
5. **[Tokenomics] Pemadatan Prompt & Analogi**:
   - Batasi Analogi Ramah maksimal 15 kata untuk menghemat ~120 token output.
   - Circuit-breaker limit input 15.000 token.



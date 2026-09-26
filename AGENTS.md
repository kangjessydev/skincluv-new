# 🏛️ SKINCLUV AI Council & Production Protocol

Dokumen ini adalah panduan resmi kolaborasi lintas AI (**Multi-Model Consensus & Production Protocol**) untuk pengembangan aplikasi **Skincluv**. Siapapun AI yang membaca repository ini (Claude, ChatGPT, DeepSeek, Kimi, atau Antigravity) **WAJIB** memahami dan mematuhi arsitektur serta aturan main di bawah ini.

---

## 1. Pembagian Peran AI (AI Council Roles)

Proyek ini dibangun secara sinergis oleh dewan AI dengan pemisahan tanggung jawab yang tegas:

| AI Agent / Model | Peran Utama | Tanggung Jawab & Batasan |
| :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | **Lead Engineer & Runtime Builder** | • Memegang eksekusi penuh di mesin lokal: terminal, git, linked live Supabase DB, build compiler, dan edge functions.<br>• Mengimplementasikan kode hasil review dari AI lain.<br>• Melakukan verifikasi empiris (menjalankan query SQL, `tsc -b && vite build`, benchmark latensi). |
| **Claude (Anthropic)** | **Chief Software Architect & Code Reviewer** | • Review arsitektur, clean code, konsistensi skema DB, dan refactoring modular.<br>• Memastikan kepatuhan privasi data (UU PDP / GDPR).<br>• Menemukan *dead code*, *orphan queries*, atau regresi logika. |
| **ChatGPT (OpenAI o1 / o3 / GPT-4o)** | **Security Red Teamer & Concurrency Auditor** | • Menguji kerentanan RLS (*Row Level Security*), otentikasi Supabase, dan penetrasi API.<br>• Audit konkurensi: *race conditions* pada sistem kredit/koin, *double-spending*, dan kegagalan webhook pembayaran (Tripay/Xendit). |
| **DeepSeek (R1 / V3)** | **Mathematical & Performance Optimizer** | • Analisis *execution plan* query SQL, efisiensi indexing PostgreSQL, dan regex optimization.<br>• Validasi rumus finansial, unit economics, dan optimasi *token budget*. |
| **Kimi (Moonshot)** | **Clinical Skincare & Regulatory Researcher** | • Validasi bahan aktif, kontraindikasi dermatologi, dan kepatuhan regulasi kosmetik (BPOM & FDA).<br>• Riset literatur klinis untuk memperkaya RAG knowledge base. |

---

## 2. Invarian Arsitektur Kritis (JANGAN DIUBAH / DIHAPUS SEMBARANGAN!)

Sebelum memberikan saran atau me-review kode, AI reviewer harus memahami invarian berikut:

1. **`universal_ai` di `ai_features` BUKAN Fitur Mati**:
   - Slug `universal_ai` adalah *virtual anchor feature* untuk mesin kuota langganan (*universal subscription quota engine*).
   - Di `supabase/functions/invoke-ai/index.ts` baris 175–195, kuota paket berbayar (Glow Club / Pro Club) dipotong melalui RPC `deduct_quota` dengan target fitur ini.
   - **DILARANG MENGHAPUS ATAU MENONAKTIFKAN `universal_ai`**, karena akan melumpuhkan seluruh sistem kuota subscriber berbayar!

2. **`face_validation` adalah 0-Credit Gatekeeper**:
   - `face_validation` berdiri sebagai fitur mandiri di `ai_features` dengan `credit_cost: 0` (gratis bagi user).
   - Menggunakan model kilat `gemini-3.5-flash` (dengan dynamic fallback ke `gemini-3.6-flash`) dengan `thinking_budget: 0` dan prompt ultra-singkat (Migration 041, 042, 055 & 056).
   - Bertujuan menolak foto bukan wajah manusia/buram SEBELUM `face_analysis` (5 kredit, `gemini-3.5-flash`) dipanggil.

3. **Thinking Budget Strategy**:
   - `ingredient_scan` dan `face_validation`: **Wajib `thinking_budget: 0`** demi latensi di bawah 10 detik.
   - `face_analysis`: **Reasoning penuh bawaan** (parameter `thinking_budget` di-omit) demi diagnosis klinis akurat.

4. **Right to be Forgotten (UU PDP No. 27 Tahun 2022)**:
   - Jika pengguna mematikan toggle *Memory Consent* di chatbot, sistem wajib menghapus bersih data `user_clinical_memories` **DAN** `chat_session_summaries` milik user tersebut secara atomik (`ChatbotPage.tsx`).

5. **Sanitasi Web Search (Tavily)**:
   - Query pencarian di `_shared/searchProvider.ts` wajib melalui pembersihan kata ganti orang pertama (`aku`, `saya`, `kulitku`, `wajahku`) dan disematkan anchor `skincare dermatologi` sebelum dikirim ke mesin pencari demi privasi data dan akurasi hasil pencarian.

6. **Ground Truth Klinis Deterministik**:
   - Tidak ada klaim risiko, bahaya kombinasi, atau kontraindikasi klinis yang lahir dari penalaran LLM murni (halusinasi bebas).
   - Seluruh kontraindikasi kondisi kulit × bahan aktif wajib bersumber dari tabel database deterministik terverifikasi (`clinical_condition_rules` & `ingredient_interactions`). LLM chatbot (Qwen) hanya bertindak sebagai *explainer* dan penyampai naratif edukatif, bukan penentu risiko klinis.

7. **Exact Image Idempotency (RFC 011)**:
   - Untuk user yang sama, foto kanonikal yang sama (`image_content_hash`), dan versi analisis yang kompatibel (`analysis_version: 'face-v4'`), permintaan duplikat identik di `invoke-ai` tidak boleh memotong kuota/kredit tambahan atau memanggil Gemini AI lebih dari sekali dalam jendela TTL (48 jam).

8. **No Perceptual False Clinical Equivalence (RFC 011)**:
   - Foto yang hanya mirip secara visual (*perceptual similarity* / pHash) dilarang keras dianggap sebagai duplikat klinis identik secara otomatis. Hanya *exact canonical hash* (SHA-256) yang berhak atas cache hit otomatis.

9. **Anti-Pencemaran Baseline Tren (RFC 011)**:
   - Hasil scan yang berasal dari cache hit ditandai permanen dengan `is_repeat = true`.
   - Baris dengan `is_repeat = true` wajib disaring keluar (`WHERE is_repeat = false`) dari perhitungan median baseline 28 hari dan riwayat grafik tren perkembangan kulit agar riwayat user tidak terdistorsi.

---

## 3. Enam Standar Kesiapan Produksi (Production Readiness Checklist)

Setiap fitur yang disetujui untuk masuk ke `main` branch harus memenuhi kriteria ini:

* [ ] **1. Security Zero-Trust & RLS**: Semua tabel baru/modifikasi memiliki RLS aktif dengan policy ketat (`USING (auth.uid() = user_id)`). Service role key dilarang keras bocor ke frontend `src/`.
* [ ] **2. Atomic Money & Credits**: Tidak ada manipulasi kredit/koin secara manual dari frontend. Wajib melalui PostgreSQL Stored Procedure atomik (`rpc('deduct_coins')`, `rpc('deduct_quota')`).
* [ ] **3. Resilience & Fallbacks**: Edge Function wajib menangani kegagalan API provider AI dengan graceful timeout dan response JSON yang terstruktur.
* [ ] **4. Privacy & Compliance**: Tidak menyimpan log percakapan sensitif tanpa consent, dan mendukung pembersihan data saat consent dicabut.
* [ ] **5. Type Safety & Validation**: Payload API di Edge Functions wajib divalidasi ketat (Zod / strongly typed).
* [ ] **6. Clean Build**: Bebas dari linting error, lolos uji compile `tsc -b && vite build`.

---

## 4. Protokol Komunikasi Antar-AI via `/diskusikan`

Untuk berkonsultasi dengan AI lain, alurnya adalah:
1. User menjalankan perintah `/diskusikan [topik]` di Antigravity.
2. Antigravity menghasilkan dokumen RFC di `docs/ai_sync/RFC_[TOPIK].md` yang berisi *Ground Truth*, kode saat ini, dan 3–5 pertanyaan audit spesifik.
3. User menyalin isi RFC ke Claude / ChatGPT / DeepSeek.
4. AI Reviewer menjawab dengan analisis mendalam, fokus pada celah keamanan, logika, arsitektur, atau optimasi.
5. User menempelkan kembali masukan tersebut ke Antigravity untuk dievaluasi secara logis dan diimplementasikan ke kode nyata.

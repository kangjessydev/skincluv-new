# [RFC 006] Konsultasi Arsitektur Produksi: Integrasi Chatbot Skinsistant dengan Fitur Scan Wajah & Scan Komposisi

**Dokumen**: `docs/ai_sync/RFC_006_chatbot_multimodal_and_scan_integration.md`  
**Target Reviewer**: 
- **Claude** (Chief Software Architect): Evaluasi modularitas pipeline, decoupling FE/BE, dan arsitektur tool-calling.
- **ChatGPT** (Security Red Teamer): Audit otorisasi kredit (bypass 5 & 3 credits dari chat 1 credit), prompt injection via OCR foto, dan privasi RLS.
- **DeepSeek** (Mathematical & Tokenomics Optimizer): Efisiensi token context window, latensi hybrid routing (Groq vs Gemini), dan unit economics.
- **Kimi** (Clinical Skincare Researcher): Validasi kontinuitas rekam medis dermatologis dan kontraindikasi antar-fitur.  
**Tanggal**: 24 September 2026  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions (`invoke-ai`) + Groq (`qwen/qwen3.8-27b`) + Google Gemini (`gemini-3.5-flash`)

---

## 1. Konteks & State Kode Saat Ini (Ground Truth)

Saat ini Skincluv memiliki 3 fitur AI utama dengan pemisahan model dan sistem kredit yang tegas:

| Fitur | Slug | Model Aktif | Biaya Kredit | Input | Database Penyimpanan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Konsultasi Skinsistant** | `chatbot` | `qwen/qwen3.8-27b` (Groq API) | **1 Credit** (atau kuota harian) | Teks percakapan multi-turn | `chat_sessions`, `chat_messages` |
| **Scan Wajah Spesialis** | `face_analysis` | `gemini-3.5-flash` (Google AI Studio) | **5 Credits** (Gatekeeper `face_validation`: 0 Credit) | Foto selfie (Base64 JPEG max 800px) | `face_scans`, `skin_profiles` |
| **Scan Komposisi Produk** | `ingredient_scan` | `gemini-3.5-flash` (Google AI Studio) | **3 Credits** | Foto label kemasan (Base64 JPEG) / Teks OCR | `ingredient_scans`, `skincare_ingredients` |

### Keterbatasan Saat Ini
1. **Isolasi Konteks**: Chatbot saat ini hanya menyuntikkan profil statis dari `skin_profiles` (`skin_type`, `skin_concerns`, `analysis_notes`). Chatbot **TIDAK tahu** hasil riwayat `face_scans` detail terakhir pengguna (skor 0-100, evaluasi per area dahi/pipi/dagu, *hero actives* yang direkomendasikan).
2. **Ketiadaan Riwayat Produk di Chat**: Jika pengguna bertanya: *"Serum yang aku scan tadi sore aman gak dipakai bareng pelembap ini?"*, Chatbot tidak memiliki akses ke tabel `ingredient_scans` milik user tersebut dan menjawab: *"Gak bisa, aku cuma asisten teks..."*.
3. **Disparitas Model AI**: Chatbot menggunakan Groq (LLM teks murni berkecepatan tinggi ~250 tok/s tanpa vision), sedangkan fitur Scan menggunakan Google Gemini 3.5 Flash (Vision Multimodal + reasoning klinis).

---

## 2. Tiga Opsi Desain Arsitektur yang Diusulkan

Kami merancang 3 pendekatan untuk dievaluasi oleh Dewan AI:

### Opsi A: Contextual Scan History RAG (Passive Historical Awareness)
*Chatbot tetap berbasis teks di Groq, namun diinjeksi rekam medis scan terakhir pengguna.*

- **Alur Kerja**:
  1. Saat user mengirim chat, `invoke-ai` mengambil 1 rekam `face_scans` terbaru dan 3 rekam `ingredient_scans` terbaru milik `user.id`.
  2. Disuntikkan ke `systemPrompt` Groq sebagai blok `[REKAM JEJAK DERMATOLOGIS TERBARU]`.
  3. User bisa bertanya: *"Gimana progres pori-poriku dari scan terakhir?"* atau *"Produk yang barusan ku-scan cocok gak buat kulitku?"*.
- **Kelebihan**:
  - Biaya kredit chatbot tetap 1 kredit.
  - Latensi Groq tetap instan (<1 detik).
  - Tidak ada perubahan drastis di UI frontend.
- **Tantangan**:
  - Pengguna tidak bisa langsung mengunggah foto baru di dalam ruang chat.

### Opsi B: In-Chat Multimodal Router & Tool-Calling (Active In-Chat Scanning)
*Pengguna bisa melampirkan foto langsung di ruang obrolan Chatbot.*

- **Alur Kerja**:
  1. Frontend `ChatbotPage.tsx` menambahkan tombol attachment kamera/galeri.
  2. Ketika foto dikirim:
     - User memilih opsi cepat: `[Analisis Wajah (5 Credits)]` atau `[Cek Komposisi (3 Credits)]`.
     - Request diarahkan ke `invoke-ai` dengan pipeline model vision `gemini-3.5-flash`.
     - Pemotongan kredit berjalan atomik sesuai tarif fitur (5 atau 3 credits).
  3. Hasil scan dikembalikan sebagai **Rich Card Component** di dalam timeline chat, lalu model chatbot (Groq) memberikan pesan lanjutan merangkum hasil tersebut.
- **Kelebihan**:
  - Pengalaman *all-in-one conversational health companion* yang sangat modern.
- **Tantangan**:
  - Konkurensi saldo: resiko eksploitasi jika user memanggil analisis wajah seharga 5 kredit namun hanya membayar 1 kredit chatbot.
  - Kompleksitas routing di Edge Function (`invoke-ai`).

### Opsi C: In-Chat Action Widgets & Deep Links (Conversational Handoff)
*Chatbot mendeteksi intent pengguna dan memberikan kartu ajakan bertindak (CTA).*

- **Alur Kerja**:
  1. Chatbot mendeteksi percakapan yang membutuhkan visual (misal: *"Kulitku tiba-tiba bruntusan merah"* atau *"Aku baru beli toner ini"*).
  2. Chatbot menampilkan bubble respon disertai widget interaktif:
     - `[📸 Mulai Analisis Wajah Sekarang (5 Credits)]` -> Mengarahkan/membuka modal scan wajah.
     - `[🔍 Pindai Label Kemasan Skincare (3 Credits)]` -> Mengarahkan ke scanner ingredient.
  3. Setelah scan selesai di halaman masing-masing, sistem menawarkan: *"Diskusikan hasil scan ini dengan Skinsistant AI"*, yang membuka chat dengan konteks scan yang baru saja dibuat.

---

## 3. Pertanyaan Spesifik untuk Dewan AI (Review Checklist)

### 3.1 Untuk Claude (Chief Software Architect)
1. Antara **Opsi A (Contextual RAG)** dan **Opsi B (In-Chat Multimodal Router)**, pola mana yang paling bersih secara arsitektural dan minim resiko regresi bagi codebase Next/Vite + Supabase?
2. Jika memilih Opsi B, bagaimana pola *State Management* (Zustand + React Query) yang ideal untuk menangani rendering pesan hybrid (teks biasa vs kartu riwayat scan interaktif)?
3. Apakah format RAG pada Opsi A cukup dengan menyuntikkan JSON summary terkompresi ke system prompt, atau sebaiknya dibuatkan RPC PostgreSQL terdedikasi `get_user_clinical_timeline(p_user_id)`?

### 3.2 Untuk ChatGPT (Security Red Teamer & Concurrency Auditor)
1. **Celah Arbitrase Kredit**: Pada Opsi B, bagaimana mencegah pengguna mengeksploitasi endpoint chatbot (1 kredit) untuk menjalankan analisis wajah multimodal (5 kredit) atau manipulasi payload `feature_slug`?
2. **Prompt Injection via OCR Foto**: Jika pengguna mengunggah foto kemasan skincare yang sengaja disisipi teks injeksi prompt (*jailbreak*) di labelnya, bagaimana mencegah model chatbot terpedaya saat membaca hasil OCR tersebut?
3. **Privasi Data & Consent (UU PDP)**: Apakah riwayat scan wajah dan bahan di tabel `face_scans` dan `ingredient_scans` boleh disuntikkan ke chatbot secara otomatis, atau wajib terikat dengan toggle `chatbot_memory_consent` yang sudah ada?

### 3.3 Untuk DeepSeek (Mathematical & Tokenomics Optimizer)
1. **Analisis Token Budget Opsi A**: Menyuntikkan 1 riwayat scan wajah (area evaluations, skin concerns, notes) + 3 riwayat produk akan memakan sekitar 600–900 token ekstra per turn di Groq. Apakah penambahan ini efisien terhadap batas context window dan biaya per panggilan?
2. **Latensi Degradation Opsi B**: Panggilan multimodal Gemini 3.5 Flash memakan waktu 10–12 detik, sedangkan Groq memakan <1 detik. Bagaimana strategi UX dan streaming agar pengguna tidak merasa chatbot "macet" selama 12 detik saat memproses gambar?

### 3.4 Untuk Kimi (Clinical Skincare Researcher)
1. **Kontinuitas Klinis**: Ketika chatbot membaca riwayat scan wajah terakhir pengguna (misal: T-Zone berminyak, pori terekspos), informasi dermatologis apa yang paling krusial untuk dijadikan acuan agar rekomendasi skincare yang diberikan chatbot tidak kontradiktif dengan *Hero Actives* yang sudah disarankan oleh Gemini di halaman scan wajah?
2. **Safe Ingredient Synthesis**: Jika pengguna menanyakan kecocokan produk yang baru saja di-scan di `ingredient_scans` dengan profil wajah di `face_scans`, bagaimana aturan baku untuk memvalidasi interaksi bahan aktifnya agar chatbot tidak merekomendasikan kombinasi berbahaya?

---

## 4. Invarian Sistem yang Tidak Boleh Dilanggar
- **`universal_ai`**: Virtual anchor kuota langganan di `ai_features` tidak boleh terganggu.
- **Biaya Kredit Deterministik**: Scan Wajah = 5 kredit, Scan Ingredient = 3 kredit, Chatbot = 1 kredit. Dilarang keras memberikan akses scan gratis melalui celah chat tanpa pemotongan kredit yang sah via RPC `deduct_coins`.
- **Zero-Trust Frontend**: Seluruh validasi hak akses dan pemotongan saldo wajib dilakukan di PostgreSQL/Edge Function, bukan di client-side.
- **Right to be Forgotten**: Kepatuhan terhadap penarikan consent di `ChatbotPage.tsx` wajib dihormati.

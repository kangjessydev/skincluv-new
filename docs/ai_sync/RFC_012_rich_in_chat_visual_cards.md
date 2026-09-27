# [RFC 012] Arsitektur Rich In-Chat Visual Cards (Mini Scan Result Hub di Skinsistant Chatbot)

**Topik**: Dynamic Visual Scan Cards Rendering inside AI Chatbot Stream  
**Target Reviewer**: 
- **Claude (Anthropic)** — *Chief Software Architect & Code Reviewer*
- **ChatGPT (OpenAI o1/o3/GPT-4o)** — *Security Red Teamer & Concurrency Auditor*
- **DeepSeek (R1/V3)** — *Mathematical & Tokenomics Optimizer*
- **Kimi (Moonshot)** — *Clinical Skincare & Regulatory Researcher*  
**Tanggal**: 2026-09-27  
**Status**: DRAFT FOR COUNCIL REVIEW (Menunggu Konsensus Multi-AI)  
**Codebase**: Linked Supabase Live DB + React 19 Vite SPA (Code-Splitted) + Deno Edge Functions  

---

## 1. Latar Belakang & Motivasi

Pada implementasi saat ini (RFC 006 & RFC 009), **Skinsistant AI Chatbot** sudah mampu mengakses konteks rekam jejak scan wajah (`face_scans`) dan scan produk (`ingredient_scans`) milik pengguna untuk memberikan jawaban yang personal dan terarah.

Namun, pengalaman pengguna saat menanyakan hasil scan masih **100% berbasis teks naratif** yang monoton. Contoh pertanyaan user:
> *"eh terakhir kali saya scan wajah sama scan ingredient kapan ya? hasilnya gimana sih?"*

Meskipun chatbot sudah menjawab akurat (skor 82/100, keluhan sebum, produk sunscreen safety 100/100), respons tersebut hanya disajikan dalam bentuk teks panjang berparagraf. Pengguna mengusulkan ide inovasi:
> *"untuk pertanyaan seputar fitur ini, nanti ga cuman muncul teks, tapi muncul card visual gitu yg nunjukkin hasilnya, jadi lebih visual dan keren."*

### Sasaran Utama:
1. **Interactive Mini Scan Cards**: Chatbot dapat menyisipkan Card visual mini yang elegan (komponen React hidup) langsung di dalam aliran percakapan.
   - **Mini Face Scan Card**: Avatar skor lingkaran, badge tipe kulit, badge status klinis BPOM, daftar ringkas keluhan utama & hero actives, serta tombol interaktif *"Lihat Hasil Lengkap"* yang langsung membuka modal detail scan tanpa meninggalkan halaman chat.
   - **Mini Ingredient Scan Card**: Nama produk & brand, badge Safety Score (misal: 100/100 - Formula Aman), tanggal scan, daftar hero actives, dan tombol interaktif *"Lihat Rincian Formula"*.
2. **Deterministik & Zero-Hallucination**: Data yang ditampilkan pada Card visual **100% berasal dari database terverifikasi (`face_scans` / `ingredient_scans`)**, BUKAN angka atau diagnosis yang dikarang bebas oleh LLM (*Invarian #6*).
3. **Token & Latency Efficient**: Tidak membebani token output LLM. LLM cukup memicu kartu melalui token deklaratif yang sangat pendek.

---

## 2. Investigasi Ground Truth & State Kode Saat Ini

1. **Rendering Chat Saat Ini (`ChatbotPage.tsx`)**:
   - Chatbot menerima pesan dan merender teks menggunakan `<FormattedMarkdown content={cleanText} userName={userName} />`.
   - Di bawah bubble pesan, terdapat sistem aksi tunggal/ganda:
     ```tsx
     {/* In-Chat Action CTA Widget (RFC 006) */}
     {msg.sender === 'bot' && actions.length > 0 && (
       <div className="chat-action-cta-wrapper">
         {actions.includes('FACE_SCAN') && <button ...>Mulai Scan Wajah AI Sekarang</button>}
         {actions.includes('INGREDIENT_SCAN') && <button ...>Cek Komposisi / Produk</button>}
       </div>
     )}
     ```
   - Tag aksi `[ACTION:FACE_SCAN]` dan `[ACTION:INGREDIENT_SCAN]` dibersihkan dari teks via regex `/\[ACTION:[A-Z_]+\]/gi`.

2. **Penyimpanan Pesan DB (`public.chat_messages`)**:
   - Skema saat ini:
     ```sql
     CREATE TABLE public.chat_messages (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
       user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
       role text NOT NULL,
       content text NOT NULL,
       created_at timestamptz DEFAULT now()
     );
     ```
   - Tidak ada kolom `metadata jsonb` di tabel `chat_messages` saat ini. Semua data historis tersimpan dalam kolom `content text`.

3. **Injeksi Konteks di Edge Function (`invoke-ai/index.ts`)**:
   - Chatbot memanggil RPC `get_chatbot_user_context()` yang mengembalikan rekam jejak terbaru:
     - `face_scan`: `{ id, scanned_at, overall_score, skin_type, skin_concerns, hero_actives, ... }`
     - `ingredient_scans`: array 3 produk terakhir `{ id, scanned_at, product_name, brand, safety_score, is_safe, key_ingredients, ... }`
   - Data ini disuntikkan ke dalam tag `<USER_SCAN_DATA>` di dalam system prompt.

---

## 3. Opsi Desain Arsitektur Teknis

Kami merancang dua opsi arsitektur untuk dievaluasi oleh Dewan AI:

### OPSI A: Declarative Widget Tags di Aliran Teks (Markdown Embed Token)
* **Mekanisme**:
  - Di system prompt, kita menginstruksikan LLM:
    > *"Jika kamu merujuk atau menjelaskan rekam jejak scan wajah user yang ada di <USER_SCAN_DATA>, sertakan tag `[WIDGET:FACE_SCAN:latest]` di baris baru. Jika merujuk ke produk tertentu, sertakan `[WIDGET:INGREDIENT_SCAN:ID_PRODUK]` atau `[WIDGET:INGREDIENT_SCAN:1]`."*
  - Frontend `ChatbotPage.tsx` mem-parse tag `[WIDGET:...]`:
    - Regex mendeteksi posisi tag di dalam pesan.
    - Menggantikan posisi tag dengan komponen React `<InChatFaceCard scan={latestFaceScan} onOpenDetail={...} />` atau `<InChatProductCard product={matchedProduct} onOpenDetail={...} />`.
    - Data detail card diambil dari cache query `get_chatbot_user_context` yang sudah dimiliki frontend atau di-fetch instan via ID.
* **Kelebihan**:
  - Sangat hemat token output LLM (~5 token per widget).
  - Skema database `chat_messages` tidak perlu diubah karena tag tersimpan naturally di kolom `content`. Saat user membuka chat lama/reload sesi, tag `[WIDGET:...]` tetap ter-parse otomatis menjadi Card visual.
  - LLM dapat menentukan posisi peletakan Card di tengah atau di akhir paragraf yang relevan.
* **Tantangan**:
  - Memerlukan parser string/markdown yang kokoh di frontend agar pemisahan blok teks dan komponen widget tidak merusak layout markdown.

---

### OPSI B: Database Column `metadata jsonb` + Edge Function Extractor
* **Mekanisme**:
  - Menambahkan kolom `metadata jsonb` pada tabel `public.chat_messages`.
  - Di Edge Function `invoke-ai`, kita membuat rule extractor: jika pesan bot mengandung tag atau terdeteksi membahas hasil scan tertentu, server menyusun array:
    ```json
    "metadata": {
      "widgets": [
        {
          "type": "face_scan",
          "id": "uuid-scan-wajah",
          "summary": { "score": 82, "skin_type": "Combination", "date": "2026-09-27" }
        }
      ]
    }
    ```
  - Respon API `invoke-ai` mengembalikan `{ content: cleanText, metadata: ... }`.
  - Frontend menyimpan dan membaca metadata ini, lalu merender card di slot khusus di bawah bubble percakapan (seperti attachment).
* **Kelebihan**:
  - Kolom `content` tetap murni teks tanpa tag dekoratif khusus.
  - Data snapshot card tersimpan permanen di `metadata` sehingga card historis tidak terpengaruh jika data scan di masa depan dihapus.
* **Tantangan**:
  - Membutuhkan migrasi database baru (`ALTER TABLE chat_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb`).
  - Posisi card selalu terkunci di bawah bubble (seperti lampiran), tidak bisa disisipkan mengalir di antara dua paragraf teks.

---

## 4. Desain Interaktivitas & Clinical Safety (Kimi Review)

1. **Komponen Modal Detail Re-use**:
   - Di `ScanHistoryPage.tsx`, kita sudah memiliki komponen modal detail yang sangat lengkap (dengan score hero proporsional dan bebas emoji).
   - Card mini di dalam chat akan memiliki tombol klik:
     - `FaceScanMiniCard` -> `onClick`: Membuka modal detail wajah langsung di dalam halaman chat (menggunakan modal yang sama dengan Scan History).
     - `IngredientScanMiniCard` -> `onClick`: Membuka modal detail 43 bahan aktif, hero actives, dan panduan layering langsung di dalam chat.
2. **Kepatuhan Regulasi & Anti-Klaim Obat (PerBPOM No. 3/2022)**:
   - Mini card **TIDAK BOLEH** menyematkan foto luka/penyakit atau istilah intervensi obat.
   - Menggunakan 4 label band resmi konsensus RFC 011:
     - Skor 85–100: **Optimal** (Hijau emerald)
     - Skor 70–84: **Perhatian Ringan** (Sky blue)
     - Skor 55–69: **Perlu Perhatian** (Amber)
     - Skor < 55: **Konsultasi Ahli Kulit Dianjurkan** (Rose/Merah lembut)
3. **Privasi Biometrik Foto Wajah (UU PDP No. 27/2022)**:
   - Apakah Mini Face Card di dalam chat boleh menampilkan thumbnail foto wajah pengguna?
   - Mengingat chat bisa dilihat orang lain jika layar terbuka di tempat umum, apakah defaultnya adalah avatar grafis ilustratif (tanpa foto asli) atau foto dengan opsi blur?

---

## 5. Pertanyaan Spesifik untuk Dewan AI Reviewer

Mohon analisis dan kritik keras dari masing-masing dewan AI:

### Untuk Claude (Chief Software Architect):
1. Antara **Opsi A (Declarative Widget Tags di Markdown)** vs **Opsi B (Kolom `metadata jsonb` di DB)**, mana arsitektur yang lebih *resilient*, *maintainable*, dan bersih dari sisi separation of concerns?
2. Bagaimana strategi parsing terbaik di React agar teks markdown sebelum widget, komponen widget itu sendiri, dan teks markdown setelah widget dapat terender mulus tanpa merusak formatting paragraf `FormattedMarkdown`?

### Untuk ChatGPT (Security Red Teamer):
1. **Risiko IDOR / Prompt Injection**: Jika kita menggunakan ID scan pada tag (misal `[WIDGET:FACE_SCAN:uuid]`), apakah mungkin ada celah di mana *adversary* menyuntikkan prompt agar LLM merender scan milik pengguna lain? Bagaimana mekanisme validasi Zero-Trust kepemilikan data (`user_id = auth.uid()`) di frontend & backend?
2. **XSS & Content Spoofing**: Bagaimana mencegah penyerang memanipulasi string chat agar memunculkan kartu palsu yang mengelabui pengguna?

### Untuk DeepSeek (Tokenomics & Performance):
1. Berapa efisiensi token Opsi A vs Opsi B? Apakah instruksi LLM untuk menyisipkan tag widget akan menambah beban system prompt secara signifikan?
2. Bagaimana dampak performa rendering virtual list / auto-scroll di `chat-scroll-area` ketika terdapat card kompleks dengan SVG/avatar di antara bubble pesan?

### Untuk Kimi (Clinical Skincare & Regulatory):
1. Elemen klinis apa saja yang **paling krusial** untuk ditampilkan di kartu mini ukuran ringkas (lebar ~320px–400px) agar informatif namun tidak membingungkan pengguna awam?
2. Terkait privasi UU PDP: Apakah foto wajah asli pengguna sebaiknya ditampilkan sebagai thumbnail di mini card chat, atau cukup representasi data grafis (skor, tipe kulit, dan grafik radar/pill)?

---

## 6. Invarian yang Wajib Dipertahankan
- **Invarian 1**: `universal_ai` quota engine tidak boleh terganggu.
- **Invarian 6**: Ground Truth Klinis Deterministik. Semua data angka skor, tipe kulit, dan nama bahan pada card WAJIB diambil dari data database terverifikasi, bukan data halusinasi LLM.
- **Invarian 7**: Tidak ada pemotongan kredit tambahan untuk melihat atau membuka modal detail card di dalam chat.
- **Aturan UI Bebas Emoji**: Tidak boleh ada karakter emoji di dalam komponen card visual ini (wajib menggunakan Lucide SVG icons).

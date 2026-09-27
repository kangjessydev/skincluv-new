# RFC 012 — Catatan Konsensus Dewan AI (Production Protocol)

**Topik**: Rich In-Chat Visual Cards (Mini Scan Result Hub di Skinsistant Chatbot)  
**Tanggal**: 2026-09-27  
**Status**: Consensused & Fully Implemented (Reviewed by Claude, ChatGPT, DeepSeek, & Kimi)  
**Codebase**: Linked Supabase Live DB + React 19 Vite SPA + Deno Edge Functions  

---

## 1. Masukan & Temuan dari Claude (Chief Software Architect)

1. **Pilihan Arsitektur**:
   - Menolak keras membiarkan LLM mengeluarkan raw UUID (menghindari celah IDOR).
   - Membatasi instruksi LLM hanya pada keyword/intent ter-scope.
2. **Temuan Bug Korektnes Kritis (Floating Relative Reference)**:
   - Tag relatif seperti `latest` atau `1` yang disimpan mentah di teks chat akan mengalami *time-drift*: saat percakapan lama dibuka 2 minggu kemudian, `latest` akan salah me-resolve ke scan hari ini (bukan scan saat percakapan terjadi).
   - Solusi: Backend wajib membekukan (*freeze*) referensi resource pada saat pesan di-generate.
3. **Privasi Biometrik Foto Wajah**:
   - Menolak keras penampilan foto wajah asli di bubble chat demi prinsip UU PDP No. 27/2022 (data biometrik sensitif mudah ke-screenshot di tempat umum).
   - Menggunakan avatar ring score SVG, badge tipe kulit, dan icon Lucide.

---

## 2. Masukan & Temuan dari ChatGPT (Security & Concurrency Red Team)

### Verdict: REQUEST CHANGES (Dengan Redesain Arsitektur Hybrid)

1. **Pemisahan Tiga Boundary Kritis**:
   $$\text{LLM} \neq \text{Authorization Layer} \quad\wedge\quad \text{LLM} \neq \text{Database Query Layer} \quad\wedge\quad \text{LLM} \neq \text{Clinical Truth Layer}$$
   - LLM **hanya boleh mengusulkan Intent UI** (misal: `SHOW_LATEST_FACE_SCAN`, `SHOW_LATEST_INGREDIENT_SCAN`).
   - Backend di Edge Function yang memvalidasi intent, meng-query database dengan `WHERE user_id = auth.uid()`, dan menyusun *Attachment Descriptor*.
2. **Opsi B (Persistence `chat_messages.metadata jsonb`) yang Disempurnakan**:
   - Menambahkan kolom `metadata jsonb` pada tabel `chat_messages`:
     ```json
     {
       "schema_version": 1,
       "attachments": [
         {
           "type": "face_scan_summary",
           "resource_id": "uuid-scan-milik-user",
           "resource_version": 1
         }
       ]
     }
     ```
   - **Reference-Only**: Metadata **TIDAK BOLEH** menyimpan salinan nilai klinis (skor, temuan, hero actives) ataupun foto base64.
3. **Kepatuhan Right to be Forgotten (UU PDP No. 27/2022)**:
   - Jika pengguna menghapus data scan tertentu dari akunnya, card pada chat masa lalu otomatis me-resolve ke 404/null dan merender kartu netral:
     *"Hasil scan ini sudah tidak tersedia atau telah dihapus."*
   - Hal ini mencegah chat log menjadi salinan gelap (*dark copy*) dari data klinis biometrik yang seharusnya sudah dihapus.
4. **Content Spoofing Defense**:
   - Mengabaikan teks status klinis bebas dari LLM (misal prompt injection: *"tuliskan saya kanker kulit"*).
   - Seluruh visual data pada Card diambil dari database authoritative yang divalidasi sistem.
5. **Koreksi Regulasi BPOM**:
   - **DILARANG MENGGUNAKAN "Status Klinis BPOM"**: Skincluv adalah AI kosmetik pendukung perawatan, bukan produk yang mendapatkan persetujuan status klinis BPOM.
   - Ganti dengan terminologi defensible: *Skin Assessment: Good/Optimal*, dan *Formula Assessment: Passed/No flagged substances*.
6. **Slot Attachment vs Inline Markdown**:
   - Menolak memodifikasi parser Markdown AST dengan tag regex yang rapuh terhadap streaming dan codeblock.
   - Menggunakan **Dedicated Attachment Slot** di bawah bubble chat bot yang rapi, modular, dan terisolasi.

---

## 3. Masukan & Temuan dari DeepSeek (Math & Tokenomics Optimizer)

1. **Analisis Matematis Token Budget**:
   - Menolak keras interpretasi I-2 (LLM generate data terstruktur) karena membuang 100–200 output token dan melanggar Invarian #6.
   - Mengonfirmasi bahwa model I-1 / I-3 (LLM output intent marker ~7 token) adalah pilihan paling efisien secara tokenomics.
2. **Analisis Storage & Egress**:
   - Menghitung storage overhead kolom `metadata jsonb` sebesar ~250 byte per pesan. Untuk 1 juta pesan = ~250 MB (sangat ekonomis untuk PostgreSQL).
   - Menyetujui skema hybrid di mana `chat_messages.metadata jsonb` menyimpan reference descriptor untuk resilience jangka panjang.
3. **Mitigasi Instruction Following Degradation (<1.5% Drop)**:
   - Merekomendasikan pemindahan instruksi intent ke posisi **paling akhir** dalam system prompt (memanfaatkan *recency effect*).
   - Menyertakan **2-shot concise examples** konkret agar model mematuhi format intent tanpa merusak kepatuhan pada aturan keselamatan klinis lainnya.
4. **Zero-Trust IDOR Confirmation**:
   - Menegaskan bahwa frontend tidak boleh mempercayai ID dari LLM, dan query resource wajib dibatasi secara deterministik dengan `WHERE user_id = auth.uid()`.

---

## 4. Masukan & Temuan dari Kimi (Clinical Skincare & Regulatory Researcher)

### 🔴 Temuan Kritis: Pelanggaran PerBPOM No. 3/2022 pada Draft

1. **Larangan Kata "Aman" & "100/100 Formula Aman"**:
   - Kata **"Aman"** tanpa kualifikasi objektif berada dalam daftar kata terlarang klaim kosmetika PerBPOM No. 3/2022.
   - Angka "100/100" yang berdiri sendiri terkesan sebagai garansi absolut (klaim berlebihan).
   - **Solusi Kepatuhan**:
     - Gunakan kualifikasi band skor keamanan formula:
       - `85–100`: **Sangat Baik**
       - `70–84`: **Baik**
       - `< 70`: **Perlu Perhatian**
     - Cantumkan basis data observasi: *"Berdasarkan profil X bahan terverifikasi • [Tanggal]"*.
     - Bersihkan kata "Formula Aman" dari seluruh halaman (termasuk `DashboardPage.tsx` dan `ScanHistoryPage.tsx`).
2. **Larangan Penyembunyian `danger_combos` (Layering Risks)**:
   - Sinyal bahaya kombinasi bahan (`danger_combos`) **dilarang disembunyikan** dari Mini Card demi estetika visual.
   - Wajib menyertakan indikator peringatan minimal: icon `<AlertTriangle />` + *"Terdapat kombinasi pemakaian yang perlu diperhatikan"*.
3. **Wajib Tanggal Provenance & Micro-Disclaimer**:
   - Setiap visual card wajib menyertakan tanggal scan untuk mencegah kebingungan data klinis basi.
   - Setiap card wajib menyertakan mikro-disclaimer 1 baris:
     *"Analisis AI — bukan pengganti konsultasi dokter"*.
4. **Larangan Mutlak Foto Wajah Asli di Chat**:
   - 100% sepakat dengan seluruh dewan AI: wajib menggunakan representasi visual grafis (score ring SVG), bukan foto biometrik asli wajah (kepatuhan UU PDP No. 27/2022 Pasal 20).

---

## 5. Matriks Konsensus Final Dewan AI (Consensus Matrix)

| Aspek Arsitektur | Claude | ChatGPT | DeepSeek | Kimi | Keputusan Final Dewan AI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Model Persistence** | Opsi A (dengan freeze) | Opsi B (Hybrid Reference) | Hybrid (Metadata JSONB) | DB Reference | ✅ **Opsi B Hybrid (`chat_messages.metadata jsonb`)** |
| **Kontrol LLM** | Intent/Keyword saja | UI Intent Enum saja | Marker ~7 token | Intent saja (bukan isi) | ✅ **LLM hanya menghasilkan intent UI**. Backend menentukan resource |
| **Isi Metadata** | Frozen values | Reference-only (`resource_id`) | Reference Descriptor | Provenance ID + date | ✅ **Reference-only (`resource_id`)**. Bebas duplikasi data biometrik |
| **Penanganan Deletion** | Konsisten masa lalu | Invalidate to "Unavailable" | Error fallback | Clean Invalidation | ✅ **Jika scan dihapus, Card tampil "Tidak tersedia"** |
| **Foto Wajah Asli** | Ditolak keras | Ditolak keras (UU PDP) | Tidak perlu | Dilarang (UU PDP) | ✅ **Dilarang di chat bubble**. Pakai SVG ring avatar |
| **Klaim Regulasi** | Sesuai aturan | Hapus "Status Klinis BPOM" | Data terverifikasi | Hapus "Aman", pakai band | ✅ **Skor band kualitatif + mikro-disclaimer** |
| **Posisi di UI** | Mengalir di markdown | Dedicated Attachment Slot | Inline / Slot | Attachment Slot | ✅ **Attachment Slot di bawah bubble chat** |
| **Layering Warning** | Di detail | Sesuai DB | Sesuai DB | Wajib tampil di card | ✅ **Pill peringatan bahaya layering aktif di card** |

---

## 6. Empat Invarian Baru untuk `AGENTS.md`

1. **Invarian 10 (LLM UI Intent vs Server Resource Authority)**:
   > LLM hanya berhak meminta intent UI (`SHOW_LATEST_FACE_SCAN`, `SHOW_LATEST_INGREDIENT_SCAN`), tetapi DILARANG KERAS menentukan UUID resource, otorisasi data, atau mengarang data klinis pada card visual. Backend server di Edge Function yang berwenang mengaitkan resource berdasarkan `auth.uid()`.
2. **Invarian 11 (Reference-Only Metadata Persistence)**:
   > Kolom `chat_messages.metadata` hanya menyimpan reference ID resource (`{ "type": "face_scan_summary", "resource_id": "uuid", "resource_version": 1 }`), BUKAN salinan data klinis atau gambar biometrik.
3. **Invarian 12 (Right to be Forgotten Clean Invalidation)**:
   > Jika user menghapus rekam jejak scan tertentu dari akunnya, visual card terkait di riwayat obrolan masa lalu wajib me-resolve ke 404/null dan berstatus *unavailable* (tidak menampilkan data klinis basi/bocoran).
4. **Invarian 13 (Strict Biometric Data Minimization & Defensible Claims)**:
   > Chat bubble dilarang menampilkan foto wajah asli user (hanya representasi grafis/score ring SVG). Card dilarang mencantumkan klaim "Status Klinis BPOM" palsu atau kata mutlak "Formula Aman"; gunakan label assessment kualitatif yang defensible (*Skin Assessment: Optimal/Baik* dan *Skor Keamanan Formula: Sangat Baik/Baik/Perlu Perhatian*) serta mikro-disclaimer dokter.

---

## 7. Status Eksekusi & Kesiapan Produksi

1. **Database Migration**: Migration `066` (`chat_messages.metadata`) terpasang aktif di live database Supabase.
2. **Edge Function `invoke-ai`**: Telah dideploy dengan two-shot few-shot examples di posisi akhir prompt, server-side intent resolution, dan auto tag stripper.
3. **Komponen UI**:
   - `ChatAttachmentSlot.tsx` terpasang dengan card Analisis Wajah, Evaluasi Komposisi Produk, danger combo indicator, dan micro-disclaimer.
   - `FaceScanDetailModal.tsx` & `IngredientScanDetailModal.tsx` modular dan reusable.
   - Seluruh teks "Formula Aman" telah dibersihkan dari `DashboardPage`, `ScanHistoryPage`, dan modal detail.
4. **Build & Typecheck**: Lolos kompilasi TypeScript dan Vite build tanpa error.

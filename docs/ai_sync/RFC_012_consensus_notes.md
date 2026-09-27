# RFC 012 — Catatan Konsensus Dewan AI (Production Protocol)

**Topik**: Rich In-Chat Visual Cards (Mini Scan Result Hub di Skinsistant Chatbot)  
**Tanggal**: 2026-09-27  
**Status**: Consensused & Ready for Implementation (Reviewed by Claude & ChatGPT)  
**Codebase**: Linked Supabase Live DB + React 19 Vite SPA + Deno Edge Functions  

---

## 1. Masukan & Temuan dari Claude (Chief Software Architect)

1. **Pilihan Arsitektur**:
   - Menolak keras membiarkan LLM mengeluarkan raw UUID (menghindari celah IDOR).
   - Membatasi instruksi LLM hanya pada keyword/intent ter-scope.
2. **🔴 Temuan Bug Korektnes Kritis (Floating Relative Reference)**:
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

## 3. Matriks Konsensus Final (AI Council Consensus)

| Aspek Arsitektur | Claude | ChatGPT | Keputusan Final Dewan AI |
| :--- | :--- | :--- | :--- |
| **Model Persistence** | Opsi A (dengan freeze) | Opsi B (Hybrid Reference) | ✅ **Opsi B Hybrid: Kolom `metadata jsonb` di `chat_messages`** |
| **Kontrol LLM** | Intent/Keyword saja | UI Intent Enum saja | ✅ **LLM hanya menghasilkan intent UI**. Backend menentukan resource |
| **Isi Metadata** | Frozen values | Reference-only (`resource_id`) | ✅ **Reference-only**. Bebas duplikasi biometrik/klinis |
| **Penanganan Deletion** | Konsisten masa lalu | Invalidate to "Unavailable" | ✅ **Jika scan dihapus, Card tampil "Tidak tersedia"** |
| **Foto Wajah Asli** | Ditolak keras | Ditolak keras (UU PDP) | ✅ **Dilarang di chat bubble**. Pakai SVG ring avatar |
| **Klaim Regulasi** | Sesuai aturan | Hapus "Status Klinis BPOM" | ✅ **Ganti jadi "Skin Assessment / Formula Assessment"** |
| **Posisi di UI** | Mengalir di markdown | Dedicated Attachment Slot | ✅ **Attachment Slot di bawah bubble chat** |

---

## 4. Empat Invarian Baru untuk `AGENTS.md`

1. **Invarian 10 (LLM Intent vs Server Resource Authority)**:
   > LLM hanya berhak meminta intent UI (`SHOW_LATEST_FACE_SCAN`, `SHOW_LATEST_INGREDIENT_SCAN`), tetapi dilarang keras menentukan UUID resource, otorisasi data, atau mengarang data klinis pada card visual. Backend server yang berwenang mengaitkan resource berdasarkan `auth.uid()`.
2. **Invarian 11 (Reference-Only Metadata Persistence)**:
   > Kolom `chat_messages.metadata` hanya menyimpan reference ID resource (`{ "type": "face_scan_summary", "resource_id": "uuid", "resource_version": 1 }`), BUKAN salinan data klinis atau gambar biometrik.
3. **Invarian 12 (Right to be Forgotten Clean Invalidation)**:
   > Jika user menghapus rekam jejak scan tertentu, visual card terkait di riwayat obrolan masa lalu wajib berstatus *unavailable* (tidak menampilkan data klinis basi/bocoran).
4. **Invarian 13 (Biometric Minimization & Defensible Claims)**:
   > Chat bubble dilarang menampilkan foto wajah asli user (hanya representasi grafis/score ring). Card dilarang mencantumkan klaim "Status Klinis BPOM" palsu; gunakan label assessment yang netral dan defensible (misal: *Skin Assessment: Good/Optimal*).

---

## 5. Rencana Aksi Implementasi

### Tahap 1: Database Migration (Migration 066)
- Tambahkan kolom `metadata jsonb DEFAULT '{}'::jsonb` pada `public.chat_messages`.

### Tahap 2: Edge Function `invoke-ai` Intent Resolver
- Di system prompt chatbot, tambahkan instruksi singkat intent enum:
  - `[INTENT:SHOW_LATEST_FACE_SCAN]`
  - `[INTENT:SHOW_LATEST_INGREDIENT_SCAN]`
- Edge Function membersihkan tag intent dari teks, mengecek `scanContext`, lalu menyematkan `metadata: { schema_version: 1, attachments: [...] }` pada payload response JSON.

### Tahap 3: Frontend Component & Attachment Slot (`ChatbotPage.tsx`)
- Simpan `metadata` ke Supabase `chat_messages` saat menyimpan pesan bot.
- Buat komponen `<ChatAttachmentSlot attachments={msg.metadata.attachments} />`:
  - Fetch data authoritative via React Query / hook dengan `WHERE user_id = auth.uid()`.
  - Jika row ditemukan: render Mini Face Scan Card / Mini Ingredient Card.
  - Jika row null (sudah dihapus): render Fallback Card *"Hasil scan ini sudah tidak tersedia"*.
  - Tombol *"Lihat Hasil Lengkap"* membuka modal detail yang sama dengan ScanHistoryPage.

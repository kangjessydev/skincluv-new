# [RFC 011] Face Scan Determinism, Image Hash Caching & Clinical Consistency Protocol

**Target Reviewer**: Claude (Software Architect), ChatGPT (Security & Concurrency Red Team), DeepSeek (Performance & Math), Kimi (Clinical Skincare)  
**Tanggal**: 2026-09-26  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions (`invoke-ai`)  
**Dokumen Terkait**: [AGENTS.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/AGENTS.md), [RFC_009_face_scan_pipeline_and_chatbot_handoff.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/ai_sync/RFC_009_face_scan_pipeline_and_chatbot_handoff.md)

---

## 1. Konteks & State Kode Saat Ini (Ground Truth)

### 1.1 Pipeline Scan Wajah Saat Ini
1. **Frontend (`src/pages/app/FaceScanPage.tsx`)**:
   - Pengguna mengambil/mengunggah foto wajah.
   - Foto dikompresi di browser via `compressImageForAI()` (WebP/JPEG max 1024px).
   - Dilakukan validasi orientasi dan deteksi wajah manusia di client (`detectHumanFace` / MediaPipe Landmarker).
   - Memanggil `invoke-ai` dengan `feature_slug: 'face_validation'` (0 kredit, `gemini-3.5-flash`, `thinking_budget: 0`).
   - Jika lolos validasi, memanggil `invoke-ai` dengan `feature_slug: 'face_analysis'` (5 kredit / 1 kuota Universal AI).
   - Hasil disimpan ke tabel `public.face_scans` (baris 426–450) dan `public.skin_profiles`.

### 1.2 Skema Tabel `public.face_scans`
```sql
CREATE TABLE public.face_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    overall_score INTEGER NOT NULL,
    skin_status_title TEXT,
    skin_type TEXT NOT NULL,
    skin_concerns TEXT[],
    analysis_notes TEXT,
    area_evaluations JSONB,
    product_recommendations JSONB,
    raw_ai_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
> **Fakta Kritis**: Tabel `face_scans` saat ini **TIDAK memiliki kolom `image_hash`**. Setiap pemanggilan scan dianggap sebagai peristiwa baru tanpa riwayat deduplikasi.

### 1.3 Parameter Model di Database (`model_configs`)
Hasil query live database untuk konfigurasi model:
```json
[
  {
    "slug": "face_validation",
    "model_name": "gemini-3.5-flash",
    "parameters": {
      "temperature": 0.1,
      "max_tokens": 250,
      "thinking_budget": 0
    }
  },
  {
    "slug": "face_analysis",
    "model_name": "gemini-3.5-flash",
    "parameters": {
      "temperature": 0.4,
      "max_tokens": 8192,
      "response_mime_type": "application/json"
    }
  }
]
```

---

## 2. Masalah Utama & Analisis Akar Masalah (Root Cause Analysis)

### 2.1 Anomali Inkonsistensi Hasil Foto Identik
Pengguna menguji mengunggah **satu foto yang sama persis** sebanyak 3 kali berturut-turut. Hasilnya:
- Skor keseluruhan berfluktuasi (misal: 74 → 82 → 78).
- Tingkat keparahan pori/jerawat berubah (misal: "Jerawat Ringan" menjadi "Jerawat Sedang").
- Kuota atau kredit pengguna terpotong 3 kali lipat (15 koin atau 3 kuota pass berkurang).

### 2.2 Akar Masalah
1. **`temperature: 0.4` pada `face_analysis`**:
   LLM multimodal melakukan *probabilistic top-p/temperature sampling*. Untuk tugas diagnosa visual klinis kuantitatif, nilai `0.4` memicu keacakan sampling token angka skor dan diksi analisis.
2. **Ketiadaan Deduplikasi Citra (Zero Image Caching)**:
   Sistem tidak menghitung *cryptographic/perceptual digest* dari gambar yang dikirim. Tidak ada mekanisme lookup: *"Apakah user ini baru saja menganalisis foto yang sama dalam 24 jam terakhir?"*.
3. **Pemberian Skor Angka Kontinu (Continuous Numerical Jitter)**:
   Gemini diminta mengeluarkan angka mutlak `1-100`. Karena sifat model generative, variasi 2–4 poin adalah hal alami, namun di mata pengguna variasi angka tersebut dipersepsikan sebagai "kesalahan diagnosa / halusinasi".

---

## 3. Usulan Solusi Arsitektur (Proposal)

### 3.1 Lapisan 1: Image Hash Generation (Client-Side & Server-Side Verification)
- Frontend menghitung `SHA-256` dari raw data payload foto sebelum dikirim ke server.
- Payload dikirim ke `invoke-ai`: `{ feature_slug: 'face_analysis', image_base64: '...', image_hash: '...' }`.
- Server memverifikasi kecocokan hash payload.

### 3.2 Lapisan 2: Database Fast-Lookup (Deterministic Cache Retrieval)
- Tambahkan kolom `image_hash TEXT` pada tabel `public.face_scans` beserta indeks komposit:
  ```sql
  CREATE INDEX idx_face_scans_user_hash_created 
  ON public.face_scans (user_id, image_hash, created_at DESC);
  ```
- Sebelum `invoke-ai` memotong kuota / kredit dan memanggil Gemini:
  1. Cek apakah ada record `face_scans` milik `user_id` dengan `image_hash` yang sama dalam kurun waktu $T$ (misal: 48 jam terakhir).
  2. **Jika Cache HIT**:
     - **0 Kredit / 0 Kuota Terpotong** (Bebas biaya).
     - Kembalikan langsung diagnosis tersimpan (`cached: true`, `scan_id: ...`).
     - Latensi turun dari ~8 detik menjadi < 150 milidetik.
  3. **Jika Cache MISS**:
     - Potong kuota/kredit secara atomik seperti biasa.
     - Panggil Gemini 3.5 Flash.
     - Simpan hasil baru beserta `image_hash`.

### 3.3 Lapisan 3: Penyetelan Parameter Model ke Mode Deterministik
- Ubah parameter di `model_configs` untuk `face_analysis`:
  ```json
  {
    "temperature": 0.0,
    "top_p": 1.0,
    "seed": 42,
    "response_mime_type": "application/json"
  }
  ```
  *(Menghilangkan keacakan sampling token pada kluster inference Google)*.

### 3.4 Lapisan 4: Clinical Score Quantization & Normalization (Kimi & BPOM Standard)
- Alih-alih mengekspos skor angka mentah murni yang rentan mikro-jitter, terapkan normalisasi kuantisasi:
  - Banding kategori:
    - 85–100: *Kondisi Optimal / Terawat*
    - 70–84: *Perhatian Ringan*
    - 50–69: *Perhatian Sedang (Pori/Kemerahan Terpantau)*
    - < 50: *Perlu Perawatan Khusus*
- Tetap sertakan disclaimer wajib BPOM: *"Skincluv adalah alat bantu perawatan kulit berbasis AI — bukan pengganti diagnosis medis dokter spesialis kulit."*

---

## 4. Pertanyaan Spesifik untuk Dewan AI (Tolong Kritik Keras)

### Untuk Claude (Chief Software Architect):
1. **Lokasi Hashing & Deduplikasi**: Apakah `image_hash` sebaiknya di-lookup langsung di Edge Function `invoke-ai` sebelum RPC `deduct_quota` dipanggil, ataukah di level frontend sebelum menembak Edge Function? Bagaimana mencegah race condition jika user mengklik tombol scan berkali-kali secara bersamaan?
2. **Masa Berlaku Cache (TTL)**: Berapa durasi ideal untuk cache scan foto identik (misal 24 jam, 7 hari, atau permanen per user)? Jika user menggunakan foto yang sama 3 bulan kemudian untuk tracking perkembangan kulit, apakah foto lama tersebut masih boleh me-return diagnosis lama?

### Untuk ChatGPT (Security & Concurrency Red Team):
1. **Cache Poisoning & Privacy Isolation**:
   - Jika User A dan User B mengunggah foto yang sama persis (misal foto sampel dari internet), apakah lookup cache **WAJIB terisolasi per-user (`user_id = auth.uid()`)**, atau boleh cross-user untuk menghemat biaya token global? Apa implikasi kebocoran data privasi / riwayat medis jika cross-user hashing diizinkan?
2. **Quota / Credit Abuse Protection**:
   - Jika user mendapatkan cache hit gratis, bagaimana mencegah bot atau script melakukan scraping gratis terus menerus terhadap ribuan gambar yang sudah ter-cache? Apakah tetap perlu rate limiter?

### Untuk DeepSeek (Mathematical & Performance Optimizer):
1. **Cryptographic Hash (SHA-256) vs Perceptual Hash (pHash/dHash)**:
   - Kompresi canvas di browser (`compressImageForAI`) kadang menghasilkan byte yang berbeda 1–2 bit jika di-render di browser berbeda (Chrome vs Safari / iOS) karena perbedaan antialiasing image rendering engine.
   - Apakah SHA-256 pada blob terkompresi cukup handal, atau kita butuh hashing pada raw canvas matrix / perceptual hashing sederhana?
2. **Reproducibility Gemini 3.5 Flash**:
   - Apakah `temperature: 0.0` dan `seed` pada Google Gemini API dijamin menghasilkan determinisme 100% pada multimodal input (gambar + teks), ataukah arsitektur MoE (Mixture of Experts) dan non-deterministik floating-point GPU Google tetap akan memicu sedikit variasi? Berapa estimasi variansi residualnya?

### Untuk Kimi (Clinical Skincare & Regulatory):
1. **Penyajian Hasil ke Pengguna**:
   - Jika pengguna memindai ulang foto yang sama dan sistem mengembalikan cache hit, bagaimana copy UX terbaik untuk memberitahukan pengguna tanpa membuat mereka merasa dicurangi?
   - Contoh: *"Foto ini identik dengan scan sebelumnya pada [Jam/Tanggal]. Menampilkan hasil analisis tersimpan (0 kredit terpotong)."*
2. **Validasi Skala Keparahan Klinis**:
   - Apakah sistem bucketing 4 tingkat keparahan di atas sudah sesuai dengan terminologi evaluasi kosmetik non-medis BPOM?

---

## 5. Invarian yang Tidak Boleh Dilanggar
1. **`face_validation` Tetap 0-Credit Gatekeeper**: Alur validasi orientasi & wajah manusia tidak boleh dilewati.
2. **Atomic Quota & Credits**: Transaksi pemotongan kuota tetap menggunakan `rpc('deduct_quota')` dan `rpc('deduct_coins')`. Jika cache hit, tidak ada RPC deduction yang dipanggil.
3. **UU PDP Privacy**: Hash foto tidak boleh mengungkap identitas biometrik mentah pengguna.

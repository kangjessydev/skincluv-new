# RFC 011 — Catatan Konsensus Dewan AI (Production Protocol)

**Topik**: Face Scan Determinism, Image Hash Caching & Clinical Consistency Protocol  
**Tanggal**: 2026-09-26  
**Status**: Consensused & Ready for Implementation (Reviewed by Claude, ChatGPT, DeepSeek, Kimi)

---

## 1. Masukan dari Claude (Chief Software Architect)

### 1.1 Evaluasi & Keputusan Kritis
1. **Lokasi Deduplikasi: Wajib di Edge Function (`invoke-ai`) Sebelum Pemotongan Saldo**:
   - Menolak keras pengecekan di frontend. Prinsip Zero-Trust: klien tidak boleh menentukan apakah kuota/koin dipotong atau tidak.
   - Pengecekan hash harus menjadi operasi pertama di `invoke-ai` sebelum baris `deduct_quota` atau `deduct_coins` dipanggil.
2. **TTL (Time to Live) Cache: Pendek (6–24 Jam)**:
   - Menolak usulan TTL panjang (7 hari / permanen).
   - Sasaran cache ini adalah menyelesaikan masalah nyata: *double-tap*, *network retry*, dan pengujian berulang dalam jeda singkat.
   - Jika pengguna mengunggah foto yang sama berbulan-bulan kemudian untuk evaluasi progress, menyajikan hasil diagnosis lama yang basi justru menjadi bug persepsi klinis.
3. **Cross-User Caching: Ditolak Keras (Strict `user_id = auth.uid()`)**:
   - Foto wajah adalah data biometrik sensitif di bawah naungan UU PDP No. 27/2022.
   - Cross-user cache membuka celah privasi (secara implisit membocorkan bahwa foto orang tersebut sudah ada di sistem oleh user lain).
   - Penghematan token global tidak sebanding dengan risiko pelanggaran kepatuhan privasi data.
4. **Rate Limiting Tetap Berlaku untuk Cache Hit**:
   - Jalur *cache hit* memang 0-kredit, tetapi **tetap wajib terkena rate limit** (`rate_limit_log`). Hal ini untuk mencegah serangan bot yang melakukan DoS/pemboman request secara gratis.
5. **Determinisme Model & Jaring Pengaman UX**:
   - `temperature: 0.0` dan `seed: 42` pada model multimodal Gemini adalah *best-effort*, bukan jaminan *bit-exact* karena sifat *asynchronous GPU batching* dan *floating-point approximation*.
   - Oleh karena itu, **Normalisasi 4 Band Keparahan Klinis** di lapisan UX tetap menjadi jaring pengaman wajib untuk meredam *micro-jitter*.

---

## 2. Masukan dari ChatGPT (Security & Concurrency Red Team)

### 2.1 Verdict: REQUEST CHANGES (Dengan Perbaikan Arsitektur Kunci)

#### A. Pemisahan Konsep: "AI Determinism" vs "Image Deduplication"
- **Dua Masalah Berbeda**:
  - Hash menyelesaikan **double-charging & redundansi token untuk input yang identik**.
  - `temperature: 0` dan `seed` **mengurangi stokastisitas sampling (reducing stochasticity)**, tetapi TIDAK menjamin bit-exact pada multimodal LLM dan TIDAK mencegah pemotongan kredit ganda.
- **Tolak Keras pHash untuk Automatic Clinical Cache Hit**:
  - Perceptual hash (pHash) tidak boleh dipakai untuk me-reuse hasil klinis secara otomatis.
  - Perubahan mikro pada foto (muncul jerawat baru, pencahayaan berbeda, perubahan warna kulit 2 minggu kemudian) bisa memiliki pHash yang berdekatan. Menggunakan diagnosis lama pada foto yang berbeda secara klinis adalah bahaya medis fatal.
  - **Aturan**:
    - `SHA-256 = exact duplicate = eligible untuk automatic cache hit (0 kredit)`.
    - `pHash = candidate visual similarity = UX hint saja, DILARANG auto-reuse hasil diagnosa`.

#### B. Canonicalization & Authority Hash
- **Pipeline Canonicalization Sebelum Hash**:
  - Decode $\to$ normalisasi orientasi $\to$ resize resolusi standar $\to$ strip EXIF metadata $\to$ fixed encoder settings $\to$ canonical bytes $\to$ SHA-256 (`image_content_hash`).
- **Client Hash = Hint, Server Hash = Authority**:
  - Server di Edge Function tetap memvalidasi/menghitung hash dari byte yang benar-benar dianalisis untuk mencegah *hash-spoofing attack* (mengirim foto baru tapi memakai hash foto lama).

#### C. Cache Key Komposit dengan `analysis_version`
- Cache key tidak boleh hanya `user_id + hash`, tetapi wajib menyertakan versi pipeline:
  $$\text{CACHE\_KEY} = \text{user\_id} + \text{image\_content\_hash} + \text{analysis\_version}$$
- Jika prompt atau aturan klinis di-deploy versi baru (`face-v4`), cache lama tidak akan terpakai secara salah jika kontrak data berubah.

#### D. Concurrency & Idempotency: `client_operation_id`
- Mencegah *race condition* double-click di mana dua request bersamaan sama-sama membaca MISS, keduanya memotong kuota, lalu salah satu gagal di unique constraint.
- Gunakan reservasi atomik dengan `client_operation_id` (idempotency tindakan user) bersamaan dengan `image_content_hash` (idempotency input citra).

#### E. Pemisahan Intent UX: Cache Hit vs `force_reanalysis`
- Jika exact cache hit ditemukan, UX bersikap transparan:
  > **Hasil scan tersedia**  
  > Foto ini sudah pernah dianalisis. Kami menggunakan hasil sebelumnya supaya kamu tidak perlu memakai Credits lagi.  
  > `[Lihat Hasil (0 Credits)]` • `[Analisis Ulang Foto Ini (5 Credits)]`
- Jika pengguna sengaja ingin menganalisis ulang (`force_reanalysis: true`), sistem menjalankan AI baru dengan kuota normal.

#### F. Deterministic Clinical Scoring Layer
- Alih-alih meminta Gemini mengarang angka skor sembarangan (74 vs 82):
  - Gemini bertugas melakukan **observasi dan klasifikasi terstruktur** (`surface_oil: 'moderate'`, `visible_pores: 'mild'`, `redness: 'low'`).
  - Lapisan aturan deterministik di sistem yang menghitung skor dan tingkat keparahan (*Ground Truth Invariant #6*).

#### G. Dua Invarian Baru untuk `AGENTS.md`
1. **Invariant 7 (Exact Image Idempotency)**:
   > *"For the same authenticated user, canonical image, and compatible analysis version, an exact duplicate request must never consume additional Credits or invoke the specialist AI more than once, regardless of retries or concurrent requests."*
2. **Invariant 8 (No Perceptual False Clinical Equivalence)**:
   > *"A perceptually similar image is never treated as an exact clinical duplicate automatically."*

---

## 3. Masukan dari DeepSeek (Math & Performance Optimizer)

### 3.1 Bukti Matematis & Kompresi Browser
1. **SHA-256 pada Blob Terkompresi Rentan terhadap Perbedaan Browser**:
   - WebP di Chrome (libwebp) vs Safari (WebKit encoder) menghasilkan perbedaan byte 15–25% meskipun pikselnya identik. SHA-256 pada raw compressed blob akan menghasilkan cache miss jika user berpindah browser.
   - Namun, untuk pengujian upload ulang di perangkat/browser yang sama (kasus 99% retry/testing), SHA-256 bekerja instan dan sempurna (~10–25 ms).
2. **Estimasi Variansi Residual Gemini 3.5 Flash**:
   - `temperature: 0.0, seed: 42` secara empiris memangkas variasi fluktuasi skor dari $\pm 8$ poin menjadi $\pm 1\text{–}3$ poin.
   - Fluktuasi kecil $\pm 1\text{–}3$ poin ini mustahil dihilangkan 100% tanpa caching karena sifat non-asosiatif floating-point pada kluster GPU/TPU Google (`(a+b)+c \neq a+(b+c)`).
   - **Kesimpulan**: Caching adalah satu-satunya mekanisme matematis untuk menghasilkan konsistensi 100% pada foto yang sama.
3. **Buffer Zone pada Boundary Skor Klinis**:
   - Pada batas kategori (misal skor 80 antara Perhatian Ringan dan Optimal): jika skor berada di sekitar batas ($80 \pm 2$), fluktuasi 2 poin dapat memicu lompatan kategori yang membingungkan user.
   - Solusi: Terapkan *hysteresis buffer zone* pada ambang batas skor agar kategori tidak mudah berganti-ganti (flip-flop).
4. **Analisis Biaya & Tokenomics Caching**:
   - Biaya komputasi marginal cache hit (SHA-256 + DB lookup) adalah $\approx$ Rp 0,05 vs biaya panggil Gemini Rp 16.
   - Memberikan cache hit = 0 kredit menghemat 67% biaya token pada 3x upload identik, sekaligus meningkatkan kepuasan pengguna tanpa kerugian finansial.
5. **Rate Limiting Anti-Abuse Cache Hit**:
   - Terapkan kuota request cache hit:
     - Maksimal 20 request / jam per user.
     - Maksimal 50 request / hari per user.
     - Maksimal 5 cache hit per hash identik per 48 jam (ke-6+ me-return 429).
   - Ini membatasi biaya beban server maksimal hanya $\approx$ Rp 2,5 / hari per attacker.

---

## 4. Masukan dari Kimi (Clinical Skincare & Regulatory)

### 4.1 Copywriting Anti-Cemas Cache Hit & Provenance
- User tidak boleh merasa "dicurangi" seolah sistem menyajikan data basi demi menghemat token diam-diam.
- **Copy Transparan (Template Kimi)**:
  ```
  ⚡ Hasil tersimpan ditampilkan — 0 kuota terpotong

  Ini foto yang sama dengan scan kamu pada [Tanggal], pukul [Jam].
  Foto yang sama berarti kondisi kulit yang terbaca juga sama, 
  sehingga hasil analisisnya identik. Kami tampilkan hasil tersimpanmu 
  secara instan tanpa memotong kuota.

  [📸 Scan foto baru]      [Lihat hasil tersimpan]
  ```
- Jika jeda foto > 7 hari: Beri catatan bahwa siklus regenerasi kulit adalah $\pm 28$ hari, sehingga foto lama tidak bisa mewakili kondisi saat ini dan tidak akan dimasukkan ke grafik tren.

### 4.2 Kepatuhan PerBPOM No. 3/2022 pada 4 Band Keparahan
- **Band ke-4 "Perlu Perawatan Khusus" DITOLAK KERAS**:
  - Istilah "perawatan khusus" mengimplikasikan intervensi medis/pengobatan penyakit kulit, yang dilarang keras untuk produk dan klaim kosmetik di Indonesia.
- **4 Band Resmi yang Disetujui Kimi**:
  1. **85–100 (Optimal)**: *"Kulitmu dalam kondisi baik — pertahankan rutinitasmu."*
  2. **70–84 (Perhatian Ringan)**: *"Ada hal kecil yang bisa ditingkatkan di rutinitasmu."*
  3. **55–69 (Perlu Perhatian)**: *"Beberapa area butuh perawatan rutin yang lebih konsisten."*
  4. **< 55 (Konsultasi Ahli Kulit Dianjurkan)**: *"Hasil scan-mu menunjukkan kondisi yang sebaiknya ditinjau dokter spesialis kulit. Skincluv adalah alat bantu perawatan sehari-hari, bukan pengganti konsultasi medis."*
  - Khusus Band 4 (< 55): Wajib memicu kartu rujukan/eskalasi dokter spesialis kulit dan **TIDAK BOLEH** menyarankan hero actives keras sebagai "solusi pengobatan".

### 4.3 Invarian Klinis Kritis: Anti-Pencemaran Baseline Tren
- Foto duplikat/cache hit yang di-load ulang diberi flag permanen: `is_repeat = true`.
- **Invarian**: Baris dengan `is_repeat = true` **WAJIB DIKELUARKAN dari perhitungan median baseline dan grafik tren kulit bulanan** di Dashboard & History (RFC 008). Jika tidak, baseline tren user akan tercemar oleh duplikasi data lama.

---

## 5. Matriks Konsensus Lengkap (Empat AI Council)

| Aspek Arsitektur | Claude | ChatGPT | DeepSeek | Kimi | Keputusan Final Antigravity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lokasi Dedup** | Edge Function | Edge Function (Authority) | Edge Function (Single Truth) | Server-side | ✅ **Di Edge Function `invoke-ai`** sebelum potong saldo |
| **Isolasi Privasi** | Strict per-user | Strict `auth.uid()` (UU PDP) | Wajib `user_id = auth.uid()` | Strict per-user | ✅ **Tolak cross-user**. Mutlak terisolasi per user |
| **Teknologi Hash** | SHA-256 | SHA-256 (Tolak pHash) | Dual-Hash (SHA-256 + pHash) | Exact photo only | ✅ **SHA-256 exact canonical blob hash**. |
| **Parameter Model** | Best-effort | Reducing stochasticity | Variance turun $\pm 1\text{–}3$ | Lapisan pelindung | ✅ **`temperature: 0.0, seed: 42`** di `model_configs` |
| **4 Band Klinis** | 4-Band UX | Deterministic Scoring | 4-Band + Buffer Zone | Optimal, Ringan, Perhatian, Konsultasi Ahli | ✅ **Pakai 4 Band BPOM Kimi + Buffer Zone DeepSeek** |
| **UX Cache Hit** | Transparan | `force_reanalysis` option | Bypass untuk progress | Transparan Tanggal & Alasan | ✅ **Tampilkan Provenance Jam/Tanggal + Opsi Scan Baru** |
| **Integritas Tren** | Tidak data basi | Versioned result | Freshness filtering | `is_repeat = true` excluded from trend | ✅ **Flag `is_repeat = true` dikeluarkan dari grafik tren** |

---

## 6. Rencana Aksi Implementasi (Consensus Action Plan)

### Tahap 1: Database Migration (Migration 064)
1. **Tambahkan Kolom di `public.face_scans`**:
   - `image_content_hash TEXT`: SHA-256 dari canonical image payload.
   - `analysis_version TEXT NOT NULL DEFAULT 'face-v4'`: Penanda versi kontrak model/prompt.
   - `is_repeat BOOLEAN NOT NULL DEFAULT false`: Penanda apakah hasil berasal dari cache hit.
2. **Indeks Komposit Cepat**:
   ```sql
   CREATE INDEX idx_face_scans_dedup 
   ON public.face_scans (user_id, image_content_hash, analysis_version, created_at DESC);
   ```
3. **Pembaruan Query Tren RFC 008**:
   - Pastikan RPC ringkasan tren dan grafik riwayat scan mem-filter `WHERE is_repeat = false`.

### Tahap 2: Database Configuration & Model Configs
1. **Update `model_configs` untuk `face_analysis`**:
   - Set `parameters = { "temperature": 0.0, "top_p": 1.0, "seed": 42, "max_tokens": 8192, "response_mime_type": "application/json" }`.

### Tahap 3: Edge Function `invoke-ai` Refactoring
1. **Canonical Hash Computation**:
   - Hitung SHA-256 dari image base64 / binary payload di Edge Function.
2. **Deduplication Check (Sebelum Potong Saldo)**:
   - Query `face_scans` milik `user.id` dengan `image_content_hash` dan `analysis_version = 'face-v4'` dalam jendela TTL 48 jam.
   - Jika ditemukan dan `force_reanalysis !== true`:
     - **0 Kredit / 0 Kuota Terpotong**.
     - Catat log request dengan status `CACHE_HIT`.
     - Kembalikan data diagnosa tersimpan dengan payload `{ success: true, is_cached: true, cached_at: ..., scan_data: ... }`.
3. **Normal AI Call**:
   - Jika MISS atau `force_reanalysis === true`: Jalankan flow normal (deduct quota/coins -> Gemini 3.5 Flash -> simpan `image_content_hash` ke `face_scans`).

### Tahap 4: Frontend UX (`FaceScanPage.tsx`)
1. **Tampilan Cache Hit Kimi**:
   - Muncul dialog modal transparan:
     *"⚡ Hasil tersimpan ditampilkan (0 kuota terpotong). Ini foto yang sama dengan scan kamu pada [Tanggal], [Jam]. [Lihat Hasil Tersimpan] [📸 Scan Foto Baru (5 Credits)]"*.
2. **Normalisasi 4 Band BPOM**:
   - Terapkan 4 label resmi BPOM Kimi (*Optimal*, *Perhatian Ringan*, *Perlu Perhatian*, *Konsultasi Ahli Kulit Dianjurkan*).

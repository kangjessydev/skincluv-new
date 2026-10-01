# [RFC 021] Konsultasi Arsitektur Produksi: AI Provider Resilience, Exponential Backoff, dan User-Friendly Error Masking

**Target Reviewer**: ChatGPT (Security & Concurrency Red Team) · Claude (Chief Architect) · DeepSeek (Performance & Math)
**Tanggal**: 2026-10-01
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions (`invoke-ai`)

---

## 1. Konteks & Insiden Terkini (Incident Ground Truth)

### 1.1 Deskripsi Insiden Nyata di Produksi
Saat pengguna menekan tombol **"Mulai Analisis Wajah AI"** di antarmuka `FaceScanPage.tsx`, sistem Edge Function menghubungi Google Gemini API (`gemini-3.5-flash`). Google Gemini mengembalikan status **HTTP 503 UNAVAILABLE** dengan payload:
```json
{
  "error": {
    "code": 503,
    "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
    "status": "UNAVAILABLE"
  }
}
```

### 1.2 Dampak pada Pengguna & Sistem
1. **Kebocoran Raw JSON ke Antarmuka Pengguna (UX Degraded)**:
   Edge Function meneruskan error mentah sebagai:
   `AI provider error: Gemini API error 503: {"error": {"code": 503, "message": "This model is currently experiencing high demand..."}}`
   Frontend menampilkan box error merah panjang berisi JSON mentah Google yang membingungkan dan menakutkan bagi pengguna non-teknis.
2. **Kekakuan Mekanisme Retry & Failover Saat Ini**:
   Di `supabase/functions/_shared/aiProviders.ts` baris 96–126:
   ```typescript
   for (const currentModel of candidateModels) {
     for (let attempt = 0; attempt < 2; attempt++) {
       if (attempt > 0) {
         await new Promise((r) => setTimeout(r, 1200)) // Jeda statis 1.2 detik!
       }
       // ... fetch Gemini API ...
       if (res.status === 503 || res.status === 429) {
         continue // langsung loop attempt kedua
       }
     }
   }
   ```
   - Jeda 1.2 detik (*static sleep*) terbukti terlalu singkat ketika Google mengalami lonjakan trafik (*demand spike*). Attempt kedua langsung ditembakkan saat server Google masih dalam kondisi macet yang sama.
   - Model cadangan hanya berpindah antara `gemini-3.5-flash` dan `gemini-3.6-flash`. Jika kedua model tersebut sama-sama sibuk di pool publik Google AI Studio Free Tier, request langsung gugur total.
3. **Integritas Saldo & Kuota (Sudah Aman, Tetapi Perlu Validasi Konkurensi)**:
   Di `supabase/functions/invoke-ai/index.ts` baris 978–980:
   ```typescript
   if (aiError) {
     await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, creditCost, operationRef)
   }
   ```
   Saldo koin dan kuota pengguna berhasil di-rollback secara otomatis jika AI provider gagal. Namun belum ada garansi atomisitas jika fungsi Deno Edge Function mengalami *hard kill / timeout* di tengah-tengah loop retry yang panjang.

---

## 2. Sasaran & Masalah yang Ingin Dipecahkan

1. **User-Friendly Error Sanitization**:
   Frontend tidak boleh lagi menampilkan raw string/JSON teknis vendor luar. Backend Edge Function wajib mengembalikan format error terstruktur:
   ```json
   {
     "success": false,
     "error": "Layanan AI sedang mengalami antrean padat sementara. Silakan coba kembali dalam 15–30 detik. Saldo Credit kamu tidak terpotong.",
     "error_code": "PROVIDER_HIGH_DEMAND",
     "retry_after_seconds": 20,
     "is_transient": true
   }
   ```
2. **Exponential Backoff dengan Full Jitter**:
   Mengganti `sleep(1200)` statis dengan algoritma backoff berbasis jitter untuk mencegah *thundering herd problem* ketika banyak pengguna me-retry pada detik yang sama.
3. **Hierarki Failover Multi-Tingkat (Multi-Tier Model / Provider Fallback)**:
   Menentukan urutan failover yang aman tanpa melanggar Thinking Budget Strategy (Invarian 3 di `AGENTS.md`) dan tanpa melanggar batasan biaya token.
4. **Proteksi Timeout Edge Function (Deno Execution Limits)**:
   Supabase Edge Function memiliki batas waktu eksekusi (biasanya 60–150 detik). Total durasi loop retry tidak boleh melampaui ambang batas timeout platform yang dapat memicu kegagalan rollback saldo koin.

---

## 3. Pertanyaan Spesifik untuk Reviewer (Tolong Kritik Keras!)

### 🔴 Pertanyaan 1: Concurrency, Thundering Herd & Timeout Safety (Khusus ChatGPT Red Team)
1. Jika puluhan pengguna mengalami error 503 bersamaan dan Edge Function melakukan retry dengan jeda waktu, bagaimana formula jitter terbaik agar tidak memperparah overload di gateway Google?
2. Jika Deno Edge Function mencapai batas waktu eksekusi (timeout) saat sedang menunggu retry kedua, fungsi `rollback(...)` di blok `catch` berisiko tidak tereksekusi. Bagaimana arsitektur rollback yang tahan banting (*fault-tolerant rollback*)? Apakah lebih baik menggunakan *idempotency reservation token* atau *two-phase commit* via PostgreSQL?

### 🏛️ Pertanyaan 2: Arsitektur Failover & Error Taxonomy (Khusus Claude Chief Architect)
1. Bagaimana taksonomi error yang bersih antara:
   - **Client Error (400)**: Foto blur, non-human face, parameter salah.
   - **Quota Exhaustion (429)**: Kuota harian API key Google habis (wajib beralih API key atau notifikasi admin).
   - **Transient Overload (503)**: Lonjakan antrean sesaat di Google.
   - **Permanent Provider Crash (500/502)**: Vendor AI down total.
2. Jika `gemini-3.5-flash` dan `gemini-3.6-flash` keduanya mengembalikan 503, model apakah yang paling aman dijadikan fallback ke-3? Apakah aman menambahkan `gemini-2.0-flash` atau fallback lintas-vendor (Anthropic Claude 3.5 Haiku) dengan mempertimbangkan Invarian 3 (`thinking_budget: 0` vs penalaran penuh)?

### ⚡ Pertanyaan 3: Optimasi Matematis, Jitter & Token Economics (Khusus DeepSeek)
1. Berapakah nilai optimal untuk $T_{base}$, multiplier, dan max retry attempts agar peluang sukses naik maksimal namun latensi ujung-ke-ujung bagi pengguna tidak melebihi 10 detik (SLA latensi wajah/komposisi)?
2. Bagaimana implikasi finansial (*unit economics*) jika failover beralih ke model dengan harga token berbeda (misal dari Flash ke Haiku atau Pro)? Bagaimana cara mencatat konsumsi biaya riil di `ai_request_logs.cost_usd` secara presisi jika failover terjadi di tengah jalan?

---

## 4. Invarian Kritis yang Tidak Boleh Dirusak (Dari AGENTS.md)
1. **`universal_ai` di `ai_features` BUKAN Fitur Mati** (Invarian 1): Anchor kuota subscriber Pro/Glow Club tidak boleh diubah.
2. **`face_validation` adalah 0-Credit Gatekeeper** (Invarian 2): Wajib cepat, gratis, dan tidak boleh mengonsumsi model mahal yang boros biaya.
3. **Thinking Budget Strategy** (Invarian 3): `ingredient_scan` dan `face_validation` **Wajib `thinking_budget: 0`** demi latensi di bawah 10 detik. `face_analysis` menggunakan reasoning bawaan.
4. **Exact Image Idempotency** (Invarian 7 & 8 / RFC 011): Cache hit berdasarkan SHA-256 tidak boleh di-bypass oleh mekanisme retry.

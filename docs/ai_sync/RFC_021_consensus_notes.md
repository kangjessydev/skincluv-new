# 🏛️ Konsensus Dewan AI — RFC 021: AI Provider Resilience, Failover, dan Error Masking

**Status**: Disepakati Penuh (*Full Consensus*) oleh Dewan AI  
**Tanggal**: 2026-10-01  
**Partisipan**:
- **ChatGPT (o1/o3-mini)**: Peran Ganda *Security Red Team* & *Chief Software Architect* (menggantikan Claude yang kehabisan token).
- **DeepSeek (R1)**: *Mathematical & Performance Optimizer*.
- **Antigravity (Google DeepMind)**: *Lead Engineer & Runtime Builder* (Eksekutor Kode).

---

## 1. Ringkasan Akar Masalah (Ground Truth Incident)
Saat pengguna melakukan scan wajah di `FaceScanPage.tsx`, Google Gemini API melempar status **HTTP 503 UNAVAILABLE** (*high demand spike*). Dua masalah arsitektur terungkap:
1. **Kebocoran Raw JSON ke UI**: Backend Deno Edge Function meneruskan payload mentah Google (`{"error": {"code": 503, "message": "This model is currently experiencing high demand..."}}`) langsung ke antarmuka pengguna tanpa sanitasi.
2. **Kelemahan Accounting saat Hard Timeout**: Pola lama `deduct -> callGemini -> catch { rollback }` memiliki celah fatal. Jika Edge Function terkena *platform hard kill/timeout* saat proses retry/sleep, fungsi `rollback` di blok `catch` tidak akan pernah dieksekusi, sehingga koin/kuota pengguna hilang tanpa hasil scan.

---

## 2. Empat Invarian Arsitektur Baru (AI Council Invariants)

1. **`INV-AI-ERR-01` (Zero Raw Leakage)**:
   Error vendor luar (Google Gemini, OpenAI, Claude, Tavily) **DILARANG KERAS** menyeberangi batas API publik ke frontend dalam format JSON/string mentah.
2. **`INV-AI-ERR-02` (Skincluv Error Taxonomy)**:
   Seluruh pesan error pengguna wajib dipetakan ke taksonomi error resmi Skincluv (`AIErrorCode`) dengan pesan ramah bahasa Indonesia yang menenangkan dan instruktif.
3. **`INV-AI-ERR-03` (Accurate Credit Safety Messaging)**:
   Pesan *"Credit Anda aman / sudah dikembalikan"* HANYA boleh dikirim jika backend mengonfirmasi status akuntansi adalah `RELEASED`. Jika terjadi *unknown status / timeout*, backend wajib mengembalikan status `PENDING` dengan pesan pengamanan saldo.
4. **`INV-AI-FAILOVER-01` (Capability-Based Model Failover)**:
   - Urutan failover: `gemini-3.5-flash` ➔ `gemini-3.6-flash` ➔ `gemini-2.5-flash`. Model `gemini-2.0-flash` dilarang digunakan karena sudah di-shutdown oleh Google pada Juni 2026.
   - Konfigurasi penalaran:
     - Untuk Gemini 2.5: gunakan `thinkingBudget: 0` (fast scan) dan `-1` (deep reasoning).
     - Untuk Gemini 3.x: gunakan `thinkingLevel: 'minimal'` (fast scan) dan `'high'` (deep reasoning) karena Gemini 3 tidak mendukung full thinking-off.

---

## 3. Formulasi Matematis Backoff & Latensi (Analisis DeepSeek)

* **SLA Latensi End-to-End**: Maksimal 10 detik.
* **Usable Budget AI**: 9.000 ms (buffer platform 1.000 ms).
* **Algoritma**: **Full Jitter Exponential Backoff**:
  $$\text{Delay} = \text{random}(0, \min(\text{Cap}, T_{base} \times 2^{\text{attempt}}))$$
* **Parameter Optimal**:
  - $T_{base} = 300\text{ ms}$
  - Multiplier = $2$
  - Cap = $2.000\text{ ms}$
  - Max Attempts = $4$
  - Overall Deadline = $9.000\text{ ms}$
  - Min Attempt Time = $500\text{ ms}$
* **Hasil Uji**:
  - Worst-case total durasi retry saat 503 fast-fail: **~5,1 detik** (Jauh di bawah SLA 10 detik).
  - Expected total durasi: **~3,0 detik**.
  - Peluang lolos lonjakan 503 dengan 4-5 attempts: **>95%**.

---

## 4. Format Kontrak Data Publik (`AIErrorDTO`)

```typescript
export type AIErrorCode =
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "AI_RATE_LIMITED"
  | "AI_INVALID_REQUEST"
  | "AI_CONFIGURATION_ERROR"
  | "AI_CONTENT_UNAVAILABLE"
  | "AI_REQUEST_TIMEOUT"
  | "AI_SERVICE_ERROR"
  | "AI_OPERATION_UNKNOWN";

export interface AIErrorDTO {
  ok: false;
  error: {
    error_code: AIErrorCode;
    is_transient: boolean;
    retry_after_seconds: number | null;
    credit_status: "NOT_CHARGED" | "RELEASED" | "COMMITTED" | "PENDING";
    message: string;
    operation_id: string;
  };
}
```

---

## 5. Rencana Pelaksanaan Bertahap (Mikro-Fase)
- [x] **Langkah 1**: Dokumentasi Konsensus Resmi Dewan AI (`RFC_021_consensus_notes.md`).
- [ ] **Langkah 2**: Refactoring `supabase/functions/_shared/aiProviders.ts` (Full Jitter Retry, Deadline 9s, Model Failover 3.5 ➔ 3.6 ➔ 2.5, Dynamic Thinking Config).
- [ ] **Langkah 3**: Refactoring `supabase/functions/invoke-ai/index.ts` (Sanitizer Error Mapper, Credit Status `RELEASED` vs `PENDING`, Zero-Leakage).
- [ ] **Langkah 4**: Refactoring `src/hooks/useInvokeAI.ts` & Frontend Handlers (Penanganan `AIClientError` dan `client_operation_id`).
- [ ] **Langkah 5**: Validasi Compiler & Verification (`tsc -b && vite build`).

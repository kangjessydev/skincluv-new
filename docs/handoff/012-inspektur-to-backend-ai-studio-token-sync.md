# Handoff: Sinkronisasi Penuh Token & Biaya Google AI Studio serta Kalibrasi Kredit User (Fase 2)

- **Dari:** role-inspektur
- **Untuk:** role-backend (koordinasi dengan role-database bila diperlukan migrasi RPC/view)
- **Tanggal:** 2026-11-08
- **Status:** done (Kode & DB selesai; injeksi API Key baru ditunda sesuai instruksi user)
- **Laporan Audit Terkait:** [2026-11-08-inspektur-audit-menyeluruh-kesiapan-produksi.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/reports/2026-11-08-inspektur-audit-menyeluruh-kesiapan-produksi.md)

---

## 1. Konteks & Temuan Audit
Berdasarkan audit Fase 1 atas permintaan user (*"memastikan kredit akun user yang digunakan sesuai dengan token yang saya beli di Google AI Studio"*), ditemukan 5 celah di backend yang menyebabkan selisih antara pencatatan di Skincluv vs dashboard Google AI Studio:

1. **`thoughtsTokenCount` Diabaikan ([_shared/aiProviders.ts:229-232](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/_shared/aiProviders.ts#L229-L232))**:
   - `_thoughtsTokens = data.usageMetadata?.thoughtsTokenCount ?? 0` tidak dijumlahkan ke `outputTokens` maupun `tokensUsed`, padahal Google AI Studio menghitung thinking tokens sebagai token berbayar (output/total).
2. **4 Panggilan Gemini Background Tidak Dicatat ke `ai_request_logs`**:
   - `enrichMissingIngredientsWithGemini` ([invoke-ai/index.ts:1774-1781](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L1774-L1781))
   - `extractMemoryWithAi` ([invoke-ai/index.ts:1871-1878](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L1871-L1878))
   - `generateSessionSummary` ([invoke-ai/index.ts:1997-2004](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L1997-L2004))
   - `test_connection` ([admin-set-api-key/index.ts:66-76](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/admin-set-api-key/index.ts#L66-L76))
   - Keempatnya memakan token Google AI Studio tanpa tercatat di `ai_request_logs` sehingga `provider_balances` tidak berkurang secara akurat.
3. **Model Failover Tidak Mengembalikan `modelUsed` Aktual ([_shared/aiProviders.ts:235](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/_shared/aiProviders.ts#L235))**:
   - Saat primary model failover ke model cadangan, perhitungan tarif `estimateCostUsd` masih memakai nama model pertama.
4. **Kalibrasi Tarif `MODEL_TOKEN_RATES` & `credit_cost` Fitur ([_shared/aiProviders.ts:416-455](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/_shared/aiProviders.ts#L416-L455))**:
   - Perlu disesuaikan dengan API key, model, dan tarif/deposit token Google AI Studio yang diberikan oleh user, serta menyelaraskan `ai_features.credit_cost` agar sebanding dengan konsumsi token per fitur.

---

## 2. Yang Diminta dari `/role-backend`
1. Terima API Key dan spesifikasi paket/token Google AI Studio dari user, lalu simpan/perbarui ke Supabase Vault (`gemini_api_key`) dan `model_configs`.
2. Perbaiki `callGemini` di `supabase/functions/_shared/aiProviders.ts` agar:
   - Mengikutsertakan `thoughtsTokenCount` ke dalam perhitungan token (`outputTokens` / `thoughtsTokens` dan `tokensUsed = data.usageMetadata?.totalTokenCount ?? (inputTokens + outputTokens + thoughtsTokens)`).
   - Mengembalikan `modelUsed: currentModel` di dalam `AiResponse`.
3. Pastikan seluruh panggilan Gemini background (`enrichMissingIngredientsWithGemini`, `extractMemoryWithAi`, `generateSessionSummary`, dan `admin-set-api-key`) juga mencatat konsumsi token dan `cost_usd` ke `public.ai_request_logs` dengan `provider_id: 'google'`.
4. Kalibrasi `MODEL_TOKEN_RATES` dan `ai_features.credit_cost` sesuai rasio token/deposit Google AI Studio yang dikonfirmasi user (dengan tetap menjaga Invarian 1 `universal_ai` aktif dan Invarian 2 `face_validation` = 0 kredit).
5. Deploy pembaruan Edge Function `invoke-ai` dan `admin-set-api-key` serta verifikasi dengan live ping.

---

## 3. Di Luar Cakupan
- Perubahan teks halaman publik / Landing Page (ditangani oleh `/role-frontend` pada Handoff 013).

---

## 4. Kriteria Selesai
- Setiap eksekusi Gemini mencatat `input_tokens`, `output_tokens` (termasuk `thoughtsTokenCount`), `tokens_used` (`totalTokenCount`), dan `cost_usd` yang 100% cocok dengan angka di dashboard Google AI Studio.
- Seluruh background AI calls tercatat di `ai_request_logs` sehingga `provider_balances` di `/admin/financials` presisi.
- `ai_features.credit_cost` telah terkalibrasi sesuai arahan user.

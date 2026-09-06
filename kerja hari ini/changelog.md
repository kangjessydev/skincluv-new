# 📝 Changelog — Scan Ingredient AI
**Tanggal:** 2026-09-06  
**Scope:** Fitur Scan Ingredient (`ingredient_scan`)

---

## [v3.0.0] — 2026-09-06

### 🗑️ Dihapus (Removed)
- **`SAMPLE_INGREDIENTS`** — Konstanta array 3 teks bahan dummy (`Aqua, Niacinamide 5%...`, `Water, Salicylic Acid 2%...`, `Aqua, Glycerin, Ceramide NP...`) dihapus dari `IngredientScanPage.tsx`
- **State `activeSample`** — `useState<string | null>(null)` untuk menyimpan teks sampel yang dipilih dihapus dari komponen
- **JSX Sample Chips** — Blok UI "Atau uji coba instan dengan sampel skincare:" beserta 3 tombol "Sampel Skincare #1/2/3" dihapus dari stage upload
- **Logika `textToAnalyze`** — `const textToAnalyze = customText || (activeSample ? activeSample : null)` dihapus dari `handleStartAnalysis`
- **Fallback `activeSample` di disabled button** — `(!imageBase64 && !activeSample)` diganti menjadi `!imageBase64` saja
- **`setActiveSample(null)` di `handleResetFlow`** — dihapus karena state sudah tidak ada

### ✅ Ditambahkan (Added)
- **Anti-Hallucination Guard** di `handleStartAnalysis()`:
  ```ts
  const isHallucination = (result.safety_score === 0 || result.safety_score === null)
    && !result.extracted_raw_text?.trim()
    && !customText
  ```
  Jika kondisi terpenuhi → tolak response, tampilkan error, kembali ke stage upload

- **Validasi Empty Ingredients** diperbaiki — `!textToAnalyze` diganti `!customText` agar konsisten

- **Migration `20240001000021_ingredient_scan_strict_prompt.sql`** — System prompt v3 baru di Supabase `prompt_versions`:
  - Instruksi 3-langkah berlapis (Klasifikasi → Anti-Halusinasi → Analisis)
  - Daftar exhaustive gambar yang harus ditolak: wajah/selfie, hewan, makanan, anime, deterjen, dll
  - Larangan keras mengarang bahan INCI
  - Wajibkan `ingredients_breakdown: []` dan `safety_score: null` jika rejected
  - Nonaktifkan prompt lama (migration 020) sebelum insert

### 🔧 Diubah (Changed)
- **`handleStartAnalysis(customText?)`** — Logika input sekarang bersih 2 jalur:
  1. `customText` ada → kirim sebagai `ingredient_text` (hanya untuk Quick-Correction re-analisis)
  2. `customText` tidak ada → kirim `imageBase64` sebagai `image_base64` (normal flow)
- **Tombol "Mulai Pindai Komposisi Skincare"** — `disabled` sekarang hanya `isAnalyzing || !imageBase64` (sebelumnya juga mengecek `!activeSample`)

---

## [v2.x] — 2026-08-31 (Referensi Sebelumnya)

### Yang Sudah Ada Sebelum Hari Ini
- Auto-kompresi foto dengan `compressImageForAI` (imageQualityValidator)
- Client-side face detection via MediaPipe (`detectHumanFace`) — menolak selfie wajah jelas
- Quick-Correction Box (edit teks OCR salah)
- Layering Guide Matrix (Best Combos & Danger Combos)
- Safety Score & Comedogenic Rating
- Partial read warning banner
- Smart Photography Tips di upload stage
- Fallback `displayIngredientsList: []` (mock data 5 bahan sudah dihapus di v2.1)

---

## File yang Berubah

| File | Jenis Perubahan | Status |
|------|-----------------|--------|
| `src/pages/app/IngredientScanPage.tsx` | Modified — hapus dummy, perketat OCR prompt, tambah guard | ✅ Terpasang |
| `supabase/migrations/20240001000021_ingredient_scan_strict_prompt.sql` | New — system prompt v3 strict | ✅ Pushed ke Cloud |
| `supabase/functions/invoke-ai/index.ts` | Modified — multimodal vision (`inlineData`) attachment | ✅ Deployed ke Cloud |
| `supabase/functions/_shared/aiProviders.ts` | Modified — Google Gemini multimodal payload handler | ✅ Deployed ke Cloud |

---

## Status Deployment Cloud

> ✅ **Database Migrations:**
> ```bash
> npx supabase db push
> ```
> Migrasi 019, 020, dan 021 telah berhasil di-push ke PostgreSQL database Supabase Cloud.

> ✅ **Edge Functions (Multimodal AI Vision):**
> ```bash
> npx supabase functions deploy invoke-ai --no-verify-jwt
> ```
> Edge function `invoke-ai` berhasil di-deploy ke Supabase Cloud (v11, size 70 kB).  
> **Sebelumnya:** Edge function di cloud adalah versi v10 (Agustus) yang belum memiliki kode lampiran gambar ke Gemini, sehingga Gemini menganalisis tanpa menerima gambar sama sekali (mengakibatkan halusinasi produk pasar Glad2Glow 22 bahan).  
> **Sekarang:** Foto kemasan dikirim secara utuh via base64 `inlineData` langsung ke mata Gemini Vision.

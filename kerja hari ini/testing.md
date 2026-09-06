# 🧪 Testing — Scan Ingredient AI
**Tanggal:** 2026-09-06  
**Lingkungan:** Local Dev (`npm run dev`)  

---

## Testing Otomatis

### TypeScript Compiler
```bash
npx tsc --noEmit
```
**Hasil: ✅ PASS — Exit Code 0, 0 error**

### Linting (OXLint)
```bash
npx oxlint src/pages/app/IngredientScanPage.tsx
```
**Hasil: ✅ PASS — 0 warnings, 0 errors (104 rules, 2 threads, 56ms)**

---

## Testing Manual (Pre-Fix vs Ekspektasi Post-Fix)

> ✅ **Migration 021 sudah berhasil di-push ke Supabase Cloud** via terminal (`npx supabase db push`).  
> Database cloud sekarang sudah memakai System Prompt v3 yang ketat. Siap diverifikasi langsung di browser.

### Skenario 1 — Upload Foto Wajah Manusia (Jelas Terlihat)
| | Detail |
|---|---|
| **Input** | Foto selfie/wajah manusia langsung |
| **Mekanisme Blok** | MediaPipe WASM `detectHumanFace()` — client-side |
| **Hasil Pre-Fix** | ✅ Ditolak dengan pesan: "Foto terdeteksi sebagai wajah manusia..." |
| **Hasil Post-Fix** | ✅ Tetap ditolak (tidak ada perubahan di lapisan ini) |
| **Status** | ✅ PASS |

---

### Skenario 2 — Upload Foto Orang + HP Menutupi Wajah
| | Detail |
|---|---|
| **Input** | Foto seseorang yang wajahnya tidak terlihat (tertutup HP) |
| **Mekanisme Blok (Pre-Fix)** | Hanya prompt AI — tidak efektif |
| **Hasil Pre-Fix** | ❌ LOLOS → AI mengarang 6 bahan (Niacinamide, Salicylic Acid, Caffeine, Zinc PCA, dll) |
| **Mekanisme Blok (Post-Fix)** | Anti-Hallucination Guard (`safety_score === 0` + `extracted_raw_text` kosong) + System Prompt v3 |
| **Ekspektasi Post-Fix** | ✅ Ditolak → pesan "AI tidak dapat mengidentifikasi teks komposisi skincare..." |
| **Status** | 🟢 READY TO TEST (Prompt v3 aktif di Supabase Cloud) |

---

### Skenario 3 — Upload Foto Kucing / Hewan
| | Detail |
|---|---|
| **Input** | Foto kucing atau hewan peliharaan |
| **Mekanisme Blok (Pre-Fix)** | Hanya prompt AI — tidak konsisten |
| **Hasil Pre-Fix** | ❌ Kadang lolos ke tahap scan, lalu gagal di akhir tanpa pesan jelas |
| **Mekanisme Blok (Post-Fix)** | System Prompt v3 wajib `is_valid_skincare: false` untuk hewan |
| **Ekspektasi Post-Fix** | ✅ Ditolak lebih awal dengan pesan rejection yang jelas |
| **Status** | 🟢 READY TO TEST (Prompt v3 aktif di Supabase Cloud) |

---

### Skenario 4 — Klik Sampel Lama, Lalu Upload Foto Baru
| | Detail |
|---|---|
| **Input** | User pernah klik "Sampel Skincare #1" → lalu pilih foto baru |
| **Bug Pre-Fix** | `activeSample` tidak di-reset → sistem kirim teks dummy ke AI, bukan foto |
| **Hasil Pre-Fix** | ❌ Analisis berdasarkan teks `"Aqua, Niacinamide 5%..."` bukan foto |
| **Post-Fix** | `SAMPLE_INGREDIENTS` & `activeSample` dihapus total |
| **Ekspektasi Post-Fix** | ✅ Tidak mungkin terjadi (fitur sample chips tidak ada lagi) |
| **Status** | ✅ FIXED — Fitur dihapus permanen |

---

### Skenario 5 — Upload Foto Kemasan Skincare Valid
| | Detail |
|---|---|
| **Input** | Foto kemasan produk skincare dengan teks ingredients jelas |
| **Hasil Pre-Fix** | ✅ Analisis berhasil (fitur utama normal) |
| **Ekspektasi Post-Fix** | ✅ Tetap berhasil, tidak ada regresi |
| **Status** | ✅ Tidak ada perubahan pada alur ini |

---

### Skenario 6 — Quick-Correction Re-Analisis
| | Detail |
|---|---|
| **Input** | Edit teks di Quick-Correction Box → klik "Hitung Ulang" |
| **Alur** | `handleReanalyzeWithText()` → `handleStartAnalysis(editableText)` |
| **Post-Fix** | `customText` parameter tetap berfungsi — jalur ini tidak terdampak penghapusan `activeSample` |
| **Ekspektasi** | ✅ Tetap berfungsi normal |
| **Status** | ✅ PASS (diverifikasi dari kode) |

---

## Checklist Verifikasi Setelah Migration 021 Dijalankan

Setelah `supabase db push` atau SQL Editor di dashboard:

- [ ] Upload foto wajah + HP → harus ditolak dengan `rejection_reason` yang jelas
- [ ] Upload foto kucing → harus ditolak
- [ ] Upload foto anime/kartun → harus ditolak
- [ ] Upload foto makanan → harus ditolak
- [ ] Upload foto kemasan skincare → harus berhasil dianalisis
- [ ] Upload foto kemasan terlalu silau → `is_readable: false`, minta foto ulang
- [ ] `safety_score: 0` tidak boleh muncul bersamaan dengan daftar bahan
- [ ] `extracted_raw_text` kosong tidak boleh menghasilkan `ingredients_breakdown` terisi

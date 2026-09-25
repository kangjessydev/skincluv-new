# 🏛️ Konsensus Dewan AI: RFC 008 — Unified Dashboard Data Pipeline & Integrated Scan History Hub

Dokumen ini mencatat kesepakatan bulat dan keputusan arsitektur produksi antara **Claude (Chief Architect)**, **ChatGPT (Security Red Team)**, **DeepSeek (Database Performance & SQL Optimizer)**, **Kimi (Clinical Dermatologist & Regulatory)**, dan **Antigravity (Lead Engineer & Runtime Builder)** untuk RFC 008.

---

## 1. Matriks Keputusan Dewan AI

| Aspek Arsitektur | Usulan Awal | Masukan Dewan AI | Keputusan Final Disepakati |
| :--- | :--- | :--- | :--- |
| **Pola Data Fetching Dashboard** | 4 query `Promise.all` di frontend | **DeepSeek**: 4 query menyedot 800 koneksi pada 200 concurrent users. Egress membengkak 55 KB. 1 RPC menghemat 75% pool koneksi dan memangkas 96,7% egress.<br>**ChatGPT**: Setuju 1 RPC dengan canonical projection DTO. | **1 RPC PostgreSQL `get_user_dashboard_summary()`** tanpa parameter `p_user_id` (identitas ditarik murni dari `auth.uid()`). |
| **Keamanan RPC & Authorization** | Parameter `p_user_id uuid` | **ChatGPT**: Fatal IDOR jika menerima `p_user_id`. Wajib `auth.uid()`, `SECURITY DEFINER SET search_path = public, pg_temp`, batasi `EXECUTE` hanya ke `authenticated`. | **Zero-IDOR RPC pattern**: Identitas dari session auth JWT, search_path diisolasi, revoke dari `anon/public`. |
| **Proyeksi Data (Data Minimization)** | Mengirim record penuh | **ChatGPT & DeepSeek**: DILARANG mengirim `raw_ai_response` dan `ingredients_breakdown` (JSONB) ke dashboard. | **Strict Selective Projection**: Hanya kirim `id`, `created_at`, `overall_score`, `product_name`, `brand`, `safety_score`. Egress turun dari 55 KB menjadi 1,8 KB. |
| **Pemisahan Domain Skor** | Menggabungkan skor produk ke skor wajah | **Kimi & Claude**: Error kategori (construct validity). Produk bukan kondisi biologis user. Dilarang merata-ratakan atau meminjam safety score untuk skor kulit. | **Isolasi Mutlak**: Kartu Kulit Wajah murni dari `face_scans`. Modul Produk (Rak Virtual) murni dari `ingredient_scans`. Keduanya berdampingan tanpa saling memengaruhi. |
| **Metodologi Tren Delta Skor** | "+4 minggu ini" (poin-ke-poin) | **Kimi & DeepSeek**: Delta 7 hari itu noise (variasi cahaya kamera & turn-over sel kulit butuh 28 hari). Bandingkan dengan median baseline 28 hari sebelumnya.<br>Jika <2 scan, sembunyikan delta. | **Metrik Jujur Klinis**: <br>• 0 scan: Empty State Onboarding.<br>• 1 scan: Tampilkan skor, sembunyikan delta ("Membangun baseline").<br>• $\ge 2$ scan: Delta vs median baseline ($\ge +5$ Membaik, $\le -5$ Perlu Perhatian, $\pm 4$ Stabil). |
| **Frontend State & Abstraksi** | Zustand store / monster card | **Claude**: Gunakan Custom Hook `useDashboardData()`, bukan Zustand store (karena data eksklusif untuk dashboard).<br>Di ScanHistory, pisahkan `FaceScanCard` dan `IngredientScanCard` dengan shared shell. | **Custom Hook `useDashboardData()`** + Dual-Tab di `ScanHistoryPage` dengan kartu modular terpisah. |
| **Strategi Database Indexing** | Belum ada indeks komposit | **DeepSeek & ChatGPT**: Butuh index-only scan untuk query dashboard dan keyset pagination history. | **Migration Indeks Komposit**: `idx_face_scans_user_created_cover` & `idx_ingredient_scans_user_created_cover` dengan `INCLUDE`. |

---

## 2. Kontrak Data Canonical DTO (`get_user_dashboard_summary`)

```json
{
  "profile": {
    "skin_type": "combination",
    "skin_concerns": ["Jerawat", "Kusam"]
  },
  "skin_assessment": {
    "has_face_scan": true,
    "latest_score": 80,
    "latest_status": "Kondisi Kulit Terpantau",
    "latest_scanned_at": "2026-09-25T10:00:00Z",
    "trend_direction": "stable",
    "trend_label": "Stabil dari baseline",
    "delta_score": 2,
    "can_show_delta": true
  },
  "product_summary": {
    "total_products_scanned": 5,
    "avg_safety_score": 86,
    "safe_products_count": 4,
    "caution_products_count": 1
  },
  "scan_counts": {
    "face_total": 3,
    "ingredient_total": 5,
    "total": 8
  },
  "missions_active": [
    {
      "id": "uuid",
      "title": "Analisis Wajah Mingguan",
      "progress": 1,
      "target": 1,
      "reward_coins": 10
    }
  ],
  "recent_scans": [
    {
      "type": "face",
      "id": "uuid",
      "title": "Analisis Wajah AI",
      "score": 80,
      "created_at": "2026-09-25T10:00:00Z"
    },
    {
      "type": "ingredient",
      "id": "uuid",
      "title": "CeraVe Foaming Cleanser",
      "score": 92,
      "created_at": "2026-09-24T15:30:00Z"
    }
  ]
}
```

---

## 3. Rencana Eksekusi Antigravity (Step-by-Step)

1. **Step 1: Migrasi Database (Migration 060)**
   - Buat fungsi RPC `public.get_user_dashboard_summary()` yang aman (tanpa argumen `user_id`, `SECURITY DEFINER`, search path terisolasi, defensive check `auth.uid()`, proyeksi terarah, perhitungan median baseline 28 hari).
   - Buat covering index `idx_face_scans_user_created_cover` dan `idx_ingredient_scans_user_created_cover`.
   - Apply migrasi ke live Supabase database.
2. **Step 2: Frontend Dashboard Revamp (`DashboardPage.tsx`)**
   - Buat hook `useDashboardData()` untuk memanggil RPC.
   - Hilangkan semua data hardcode (skor 82, streak 7 hari, riwayat statis Agustus).
   - Tambahkan Quick Action **Ingredient Scan** di samping Face Scan & Skinsistant.
   - Implementasikan 3-State Cold Start (State A: Baru, State B: Baru scan produk, State C: Rutin).
3. **Step 3: Scan History Dual-Tab Hub (`ScanHistoryPage.tsx`)**
   - Tambahkan Tab Switcher (*Analisis Wajah* vs *Analisis Komposisi Produk*).
   - Fetch data dari `face_scans` dan `ingredient_scans`.
   - Implementasikan modal detail produk untuk melihat kembali Hero Actives dan rincian bahan yang pernah di-scan.
4. **Step 4: Verifikasi & Build**
   - Lakukan `npm run build` (`tsc -b && vite build`) untuk memastikan 0 compile error.

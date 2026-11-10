# Konvensi Proyek & Panduan Stack (Project Conventions)

_Disintesis oleh `role-asisten` dari kerangka referensi arsitektur, anti-slop UI, dan database._  
_Terakhir diverifikasi: 2026-11-08 | Stack Terpilih: `Supabase Edge Functions (Deno) + PostgreSQL RPC` + `React 19 + TypeScript + Vite 8` + `Cluv Framework (Vanilla CSS)`_

---

## 1. Stack & Versi Terverifikasi
- **Backend & Edge Compute:** Supabase Edge Functions (Deno Runtime) + PostgreSQL 15+ Stored Procedures (RPC)
- **Frontend:** React (`v19.2.8`) + TypeScript + React Router DOM (`v7.18.2`) + Zustand (`v5.0.15`) + TanStack Query (`v5.101.4`)
- **Styling:** Cluv Micro-Framework (`src/styles/cluv/`, Pure Vanilla CSS dengan token `var(--cluv-*)`)
- **Database:** Supabase PostgreSQL (`@supabase/supabase-js` `v2.112.3`)
- **Mobile Hybrid:** Capacitor Android + Cloud CI/CD GitHub Actions (`.github/workflows/build-apk.yml`)
- **Arsitektur Dual-Environment (DEV vs PROD):**
  - **Development (DEV):** Hosting Web di **Vercel** + Supabase Project **`skincluv` (`gapctakvmorjafqxaqjk`)** (terhubung ke `.env.local`).
  - **Production (PROD):** Hosting Web di **Cloudflare Pages** + Supabase Project **`skincluv-prod` (`vxyyediuoyxbozbizswi`)**.
  - **Aturan Sinkronisasi Wajib:** Setiap migrasi SQL di `supabase/migrations/` dan perubahan Edge Functions di `supabase/functions/` wajib di-push/deploy ke kedua project Supabase (`gapctakvmorjafqxaqjk` dan `vxyyediuoyxbozbizswi`).

---

## 2. Struktur Proyek & Layering
Aturan peletakan kode untuk proyek ini:
- **Halaman Publik:** `src/pages/public/`
- **Halaman Aplikasi (User Login):** `src/pages/app/`
- **Halaman Konsol Admin:** `src/pages/admin/`
- **Hooks & Data Layer (Service/Repository Client):** `src/hooks/`
- **Edge Functions (Serverless API Gateway):** `supabase/functions/`
- **Database Schema & RPC:** `supabase/migrations/`

---

## 3. Penerjemahan Prinsip Arsitektur ke Sintaks Stack Terpilih

### A. Validasi Input & Keamanan (Threat Boundary)
- **Zero-Trust RLS & Auth:** Seluruh tabel user memiliki RLS aktif dengan `auth.uid() = user_id`. Dilarang membocorkan `SUPABASE_SERVICE_ROLE_KEY` ke dalam `src/`.
- **Mutasi Kredit & Kuota Atomik:** Pemotongan AI Credits atau kuota wajib melalui RPC PostgreSQL atomik (`deduct_coins`, `deduct_quota` dengan anchor `universal_ai`), dilarang menghitung atau mengurangi saldo langsung dari state frontend.
- **Batas Klaim Non-Terapeutik (Invarian 19):** Dilarang menggunakan kata *Diagnosis, Terapi, Resep, Mengobati, Menyembuhkan, Klinis, Medis*. Gunakan *AI Skin Assessment / Pemetaan Kondisi Kulit / Observasi Visual*.

### B. Optimasi Database & Integritas Skema (Anti-Schema Drift)
- **Kontrak 1:1 RPC ↔ TypeScript:** Nama atribut di `jsonb_build_object(...)` pada fungsi SQL wajib cocok karakter per karakter dengan interface TypeScript konsumernya (misal di `src/hooks/useDashboardData.ts`).
- **Database Invariant Hardening (Invarian 1, 2, & 23):**
  - `universal_ai` wajib aktif (`is_active = true`).
  - `face_validation` wajib `credit_cost = 0` dan `thinking_budget = 0`.
  - Seluruh riwayat scan duplikat (`is_repeat = true`) wajib disaring (`WHERE is_repeat = false`) dari perhitungan tren baseline 28 hari.

### C. Komponen Frontend & Standar Anti-AI Slop (Cluv Framework)
- **Protokol Reuse → Extend → Create:** Wajib mengecek [docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md) sebelum menambah class CSS.
- **Zero Hardcoded Hex & No Island `<style>`:** Dilarang menulis kode warna hex manual atau tag `<style>` di file `.tsx`; gunakan `var(--cluv-*)`.
- **Semantik & Aksesibilitas:** Semua aksi interaktif wajib menggunakan `<button>` atau `<Link>`, memiliki `:focus-visible`, dan angka metrik menggunakan `font-variant-numeric: tabular-nums`.

---

## 4. Cuplikan Kode Baku (Golden Code Sample)
```tsx
// Contoh Komponen Standar Cluv Framework + Data Hook Nyata
import { Sparkles } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

export function AssessmentSummaryCard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return <div className="cluv-card skincluv-skeleton" aria-busy="true" />;
  }

  return (
    <div className="cluv-canvas-focused">
      <div className="cluv-card">
        <div className="cluv-card-icon-wrap is-teal">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <h2 className="cluv-card-title">AI Skin Assessment</h2>
        <p className="cluv-text-muted">
          Total Pemindaian Wajah: {data?.scan_counts.face_total ?? 0}
        </p>
      </div>
    </div>
  );
}
```

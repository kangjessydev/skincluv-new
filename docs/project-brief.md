# Project Brief: Skincluv

_Terakhir diverifikasi: 2026-10-27, commit `ad07e0d`_

## Tujuan & Pengguna
- **Tujuan**: Platform cerdas berbasis AI untuk analisis observasi visual kulit (*AI Skin Assessment*), pemindaian komposisi bahan kosmetik (*Ingredient Scan*), rekomendasi personal non-terapeutik, pelacakan misi perawatan rutin (*Glow Missions*), serta konsultasi interaktif dengan *Skinsistant AI*.
- **Pengguna**:
  - Publik/End-User: Pengguna umum yang ingin memantau perkembangan kesehatan kulit dan keamanan bahan kosmetik secara harian via antarmuka mobile/desktop web responsive (PWA).
  - Admin/Operasional: Tim pengelola sistem untuk memonitor telemetri suhu AI provider, pembukuan kas deposit vs konsumsi akrual (WAC), audit log keamanan, dan moderasi buku pedoman AI (*Handbook*).

## Profil Risiko (Dikonfirmasi User: Ya)
- **Jenis proyek**: Web aplikasi publik (PWA-ready SPA) & Admin Console
- **Data yang disentuh**: Data biometrik foto wajah pengguna (wajib tunduk pada UU PDP No. 27/2022), data transaksi pembayaran Tripay, riwayat analisis kulit, saldo kredit AI/koin, dan log percakapan ber-consent.
- **Pengguna**: Publik & Tim Internal Admin
- **Dampak jika gagal**: **Besar** (potensi kebocoran privasi biometrik wajah, kegagalan transaksi keuangan/double-spending, atau pelanggaran regulasi SaMD/BPOM jika klaim terapeutik terlampaui).
- **Tingkat keamanan:** **Ketat (Strict)**

## Stack & Dependensi
| Bagian | Teknologi | Versi (Dipakai / Terbaru) | Alasan Pemilihan | Sumber Alasan |
|---|---|---|---|---|
| **Frontend Framework** | React + TypeScript | 19.2.8 / 19.3.1 | Kompatibilitas React Compiler, modularitas hooks, typing ketat | `package.json`, commit history |
| **Bundler & Tooling** | Vite + Rolldown/ESBuild | 8.2.0 / 8.3.5 | Kecepatan HMR instan (<100ms), build cepat (3.6s), PWA support | `vite.config.ts` |
| **Routing** | React Router DOM | 7.18.2 / 7.x | Routing deklaratif dengan layout bersarang (Public, App, Admin) | `src/App.tsx` |
| **State Management** | Zustand & React Query | 5.0.15 & 5.101.4 | Pemisahan client state (auth/modal) vs server state caching | `src/store/`, `src/hooks/` |
| **Database & Auth** | Supabase (PostgreSQL 15+) | `@supabase/supabase-js` 2.112.3 / 2.118.0 | RLS deklaratif, RPC atomik untuk saldo koin/kuota, Auth PKCE | `supabase/migrations/` |
| **Edge Compute** | Supabase Edge Functions (Deno) | Deno runtime | Serverless gateway untuk integrasi Gemini, Qwen, & webhook Tripay | `supabase/functions/` |
| **AI Models (Vision)** | Google Gemini (3.5 & 3.6 Flash) | Dynamic fallback | Face Validation (0 kredit, thinking budget: 0) & Face Analysis | `AGENTS.md`, Migration 041/042 |
| **AI Models (Chatbot)**| Qwen 2.5 72B / OpenRouter | Via `invoke-ai` | Skinsistant AI dengan RAG handbook deterministik & memory UU PDP | `supabase/functions/invoke-ai/` |
| **Web Search Provider**| Tavily Search API | Sanitized query | Pelengkap data komposisi kosmetik terkini dengan proteksi PII | `_shared/searchProvider.ts` |
| **On-Device Vision** | MediaPipe Tasks Vision | 1.0.1 | Validasi landmark wajah & kualitas pencahayaan sebelum kirim ke cloud | `src/utils/faceLandmarks.ts` |
| **Payment Gateway** | Tripay Payment API | Closed Payment v2 | Transaksi otomatis QRIS, Virtual Account, E-Wallet di Indonesia | `supabase/functions/tripay-*` |
| **CSS Architecture** | Cluv Framework (`cluv-*`) | Pure Vanilla CSS | Desain konsisten, zero-Tailwind overhead, 3 kanvas kanonikal | `src/styles/cluv/` |
| **Linter** | Oxlint | 1.75.0 | Linter ultra-cepat berbasis Rust (165ms untuk 95 file) | `package.json` |

## Perintah Penting
- **Jalankan (Dev Server)**: `npm run dev` (Port default: 5173)
- **Tes Tipe**: `tsc -b`
- **Build Produksi**: `npm run build` (`tsc -b && vite build`)
- **Lint**: `npm run lint` (`oxlint`)
- **Preview Build**: `npm run preview`

## Doktrin Desain & Visual Tokens
- **Gaya Desain (Style)**: *Minimalist Clean & Vibrant Wellness* (Menggabungkan rasa klinis terpercaya dengan kehangatan ramah pengguna).
- **Jenis Aset Visual**: SVG Vector Icons (`lucide-react`), Dynamic Circular Score Rings, dan observasi visual biometrik terlindungi (dilarang menampilkan foto mentah di chat).
- **Tipografi**:
  - Heading & Body (App & Public): `'Nunito', -apple-system, sans-serif`
  - Admin Surfaces: `'Inter', -apple-system, sans-serif`
  - Monospace / Code: `'JetBrains Mono', 'Fira Code', monospace`
- **Token Baku UI (Cluv Framework)**:
  - Brand Colors: `--cluv-teal: #1f9d97` (Hover: `#198782`), Companion: `--cluv-peach: #fbb090`, `--cluv-gold: #d97706`, `--cluv-rose: #f43f5e`.
  - Neutral Scale: `--cluv-neutral-50` (`#f8fafc`) s/d `--cluv-neutral-900` (`#0f172a`).
  - Radius: `sm: 6px`, `md: 10px`, `lg: 16px`, `xl: 24px`, `cloud: 28px`, `pill: 9999px`.
  - Kanvas Kanonikal: Tipe A Grid (`.cluv-canvas-grid`), Tipe B Focused Form (`.cluv-canvas-focused`, max 760px), Tipe C Bleed (`.cluv-canvas-bleed`).
  - Motion: Snappy (150ms), Normal (250ms), Smooth (350ms).

## Rencana Pembagian Fase & Paritas
- **Status Saat Ini**: Seluruh 15 domain fitur (Core User App + Admin Telemetry) telah 100% terhubung secara live (`🟢 Connected`) sesuai buku induk [docs/architecture/FE_BE_PARITY_MATRIX.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/architecture/FE_BE_PARITY_MATRIX.md).
- **Fase Pemeliharaan & Pengawasan**:
  - Fase 1 (Database & Integrity): Pemeliharaan RLS, CHECK constraint Invarian 1 & 2.
  - Fase 2 (Backend & AI Stability): Health check model Gemini/Qwen, kuota universal, webhook Tripay.
  - Fase 3 (Frontend & Cluv Hardening): Penerapan konsisten doktrin Cluv Framework, pembersihan warning unused vars/imports.
  - Fase 4 (Audit Inspektur): Audit kepatuhan UU PDP No. 27/2022, MCID 5 poin perbandingan kulit, dan batas non-terapeutik BPOM.

## Batasan & Hal yang Tidak Boleh Berubah (Invarian Kritis)
1. **Invarian 1 (`universal_ai`)**: Virtual anchor kuota langganan di `ai_features`. DILARANG DIHAPUS / DINONAKTIFKAN.
2. **Invarian 2 (`face_validation`)**: Gatekeeper validasi wajah 0-kredit (`gemini-3.5-flash`, `thinking_budget: 0`).
3. **Invarian 6 (Ground Truth Deterministik)**: Bahaya bahan aktif & kontraindikasi wajib dari tabel database, bukan karangan bebas LLM.
4. **Invarian 7-9 (Idempotency SHA-256 & Anti-Pencemaran Baseline)**: Scan duplikat ditandai `is_repeat = true` dan disaring dari baseline tren 28 hari.
5. **Invarian 19 (Non-Therapeutic Boundary)**: Dilarang menggunakan terminologi medis (*Diagnosis, Terapi, Resep, Mengobati*); gunakan label *AI Skin Assessment / Pemetaan Kondisi Kulit*.
6. **Invarian 20 (Dual-Track Deletion)**: Hapus akun wajib menghapus biometrik foto, namun faktur tagihan Tripay dipertahankan (`ON DELETE SET NULL`) demi pembukuan kas legal.
7. **Invarian Kontrak RPC ↔ TypeScript**: Nama field di `jsonb_build_object` di SQL wajib cocok 1:1 karakter dengan TypeScript di `src/types/` dan `useDashboardData.ts`.

## Kondisi Dasar (Baseline)
- **Compiler & Build**: Lolos bersih (`tsc -b && vite build` sukses dalam 3.60s, 0 error).
- **Linter (Oxlint)**: 0 error, 42 warning minor (unused variable / unused import di beberapa file rute).
- **Pengujian Fungsional**: Paritas 100% terverifikasi pada commit `ad07e0d`.

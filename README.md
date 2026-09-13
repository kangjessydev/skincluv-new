# Skincluv

Aplikasi skincare berbasis AI untuk analisis kondisi kulit wajah dan pengecekan bahan aktif produk skincare.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Scan Wajah** | Analisis dermatologi via AI — scoring, breakdown per area (dahi, T-zone, dagu), concern detection, dan rekomendasi produk |
| **Scan Ingredient** | OCR + analisis bahan aktif produk skincare — safety score, comedogenic rating, layering guide |
| **AI Chatbot** | Konsultasi skincare personal berbasis profil kulit user |
| **Misi & Koin** | Gamification — selesaikan misi harian/mingguan untuk dapat koin, tukar koin untuk akses AI |
| **Langganan** | Free tier (3 scan/bulan) dan Premium (Rp 49.000/bulan, kuota lebih besar) via Tripay |
| **Riwayat Scan** | Timeline perjalanan kulit — tracking perubahan kondisi dari waktu ke waktu |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Vite 8 |
| Styling | Vanilla CSS (custom design system) |
| State | Zustand 5 |
| Data fetching | TanStack Query 5 |
| Routing | React Router 7 |
| Backend / DB | Supabase (Postgres, Auth, Storage, Edge Functions) |
| AI providers | Google Gemini, Anthropic Claude (via Edge Functions) |
| Payment | Tripay (QRIS, Virtual Account, Retail) |
| Face detection | Google MediaPipe — 100% client-side WASM, zero server call |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |

---

## Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Supabase CLI** — `npm install -g supabase`
- Supabase project (free tier cukup untuk development)
- Tripay account (untuk fitur payment — opsional untuk dev lokal)
- Google Gemini API key atau Anthropic API key (untuk fitur AI)

---

## Environment Variables

Buat file `.env.local` di root project:

```bash
# Supabase — wajib
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...

# Edge Functions — disimpan di Supabase Vault/Secrets (bukan di .env frontend)
# Variabel berikut diset via Supabase Dashboard / CLI, bukan di sini:
# SUPABASE_SERVICE_ROLE_KEY   → auto-available di Edge Functions
# TRIPAY_PRIVATE_KEY          → set via `supabase secrets set TRIPAY_PRIVATE_KEY=<key>`
# API keys AI                 → set via Supabase Vault (lihat migration 007)
```

> **Catatan:** API key AI dan payment tidak pernah menyentuh frontend. Semua diakses via Supabase Vault dari dalam Edge Functions.

---

## Local Development Setup

```bash
# 1. Clone & install dependencies
git clone <repo-url>
cd skincluv
npm install

# 2. Setup environment
# Buat .env.local (lihat section di atas)

# 3. Start Supabase local (butuh Docker)
supabase start
supabase db reset   # apply semua migrations + seed data

# Salin URL dan anon key dari output `supabase start` ke .env.local

# 4. Setup MediaPipe assets (self-hosted, diperlukan untuk Scan Wajah)
# Letakkan files di:
#   public/wasm/                     — MediaPipe WASM binaries
#   public/models/face_landmarker.task

# 5. Run dev server
npm run dev
```

> **MediaPipe assets:** Download dari [MediaPipe releases](https://developers.google.com/mediapipe/solutions/vision/face_landmarker).

---

## Project Structure

```
skincluv/
├── public/
│   ├── wasm/                    # MediaPipe WASM binaries (self-hosted)
│   └── models/
│       └── face_landmarker.task
├── src/
│   ├── components/
│   │   ├── layout/              # AppLayout, navigation
│   │   └── ui/                  # CoinConfirmModal, FormattedMarkdown, LoadingScreen, dll
│   ├── hooks/
│   │   └── useInvokeAI.ts       # Custom hook untuk memanggil Edge Function invoke-ai
│   ├── lib/
│   │   └── supabase.ts          # Typed Supabase client
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── auth/                # Login, Register
│   │   └── app/                 # Halaman utama (protected routes)
│   │       ├── FaceScanPage.tsx        # Core AI scan feature
│   │       ├── IngredientScanPage.tsx  # Ingredient analysis
│   │       ├── ChatbotPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── ScanHistoryPage.tsx
│   │       ├── MissionsPage.tsx
│   │       ├── CheckoutPage.tsx
│   │       └── ...
│   ├── store/
│   │   └── authStore.ts         # Zustand store: user, profile, coinBalance
│   ├── types/
│   │   └── database.ts          # TypeScript types untuk semua tabel Supabase
│   └── utils/
│       ├── faceLandmarkDetector.ts  # MediaPipe wrapper — client-side face detection
│       └── imageQualityValidator.ts # Canvas-based blur & brightness check
├── supabase/
│   ├── functions/               # Edge Functions (Deno TypeScript)
│   │   ├── _shared/             # cors.ts, aiProviders.ts
│   │   ├── invoke-ai/           # Generic AI invocation handler
│   │   ├── tripay-invoice/      # Create payment invoice
│   │   ├── tripay-webhook/      # Handle payment webhook (HMAC verified)
│   │   └── tripay-check-status/ # Check invoice status
│   ├── migrations/              # 21 migration files (idempotent)
│   └── config.toml
├── vercel.json                  # SPA rewrite + security headers (CSP, dll)
└── vite.config.ts
```

---

## Database Schema

19 tabel, semua dengan RLS enabled. Semua policy scoped ke `auth.uid()`.

### Grup Tabel

```
auth.users (Supabase built-in)
    └── profiles                  ← mirror user, auto-created via trigger
            ├── skin_profiles     ← profil kulit aktif (1 per user)
            ├── face_scans        ← riwayat semua scan wajah
            ├── subscriptions     ← langganan aktif (auto-created: free tier)
            │       └── quota_usage
            ├── coin_balances     ← saldo koin (auto-created via trigger)
            ├── coin_transactions ← ledger koin (immutable)
            ├── user_missions     ← progress misi per user
            ├── ai_request_logs   ← log semua AI request
            ├── chat_sessions
            │       └── chat_messages
            └── tripay_invoices

ai_features ←─┬── prompt_versions   (config AI per fitur)
               ├── model_configs     (provider, model, vault secret name)
               └── quota_configs     (batas kuota per tier per fitur)

subscription_tiers ←── quota_configs
missions           ←── user_missions
rate_limit_log         (dikelola Edge Function, tidak ada client policy)
xendit_webhooks        (legacy, payment gateway lama)
```

---

### Detail Tabel

#### `profiles`
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | uuid PK | Mirror `auth.users.id` |
| `username` | text UNIQUE | |
| `full_name` | text | Diisi dari OAuth metadata saat signup |
| `avatar_url` | text | |
| `created_at`, `updated_at` | timestamptz | `updated_at` via trigger |

RLS: `SELECT` + `UPDATE` hanya pemilik. Trigger: `on_auth_user_created`.

---

#### `skin_profiles`
Profil kulit aktif — dipakai sebagai konteks oleh semua AI feature.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `skin_type` | text CHECK | `normal`, `oily`, `dry`, `combination`, `sensitive` |
| `skin_concerns` | text[] | `acne`, `hyperpigmentation`, `wrinkles`, `dryness`, `oiliness`, `sensitivity`, `redness`, `dark_circles`, `pores` |
| `is_active` | boolean | Unique partial index — hanya 1 aktif per user |

RLS: `SELECT`, `INSERT`, `UPDATE` hanya pemilik.

---

#### `face_scans`
Riwayat scan wajah — timeline perjalanan kulit.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `overall_score` | integer 0-100 | Skor kondisi kulit |
| `area_evaluations` | jsonb | Array breakdown per area (dahi, T-zone, dagu): `{id, area_name, score, status, finding, analogy, action_plan}` |
| `product_recommendations` | jsonb | Array rekomendasi produk dari AI |

RLS: `SELECT`, `INSERT`, `DELETE` hanya pemilik.

---

#### `ai_features`
| slug | Coin cost | Keterangan |
|------|-----------|-----------|
| `face_validation` | 2 | Validasi foto awal |
| `face_analysis` | 10 | Analisis kulit lengkap |
| `ingredient_scan` | 5 | Scan ingredient |
| `chatbot` | 1 | Pesan chatbot |
| `universal_ai` | — | Virtual feature untuk quota gabungan (Premium) |

---

#### `prompt_versions`
Versi prompt per fitur. Hanya 1 `is_active = true` per fitur. System prompt support template variables: `{user_name}`, `{skin_type}`, `{skin_concerns}`, `{analysis_notes}`.

#### `model_configs`
Konfigurasi model AI per fitur. `api_key_secret` adalah nama secret di Supabase Vault.

#### `subscription_tiers`
| slug | Harga | Face Analysis | Ingredient Scan | Chatbot |
|------|-------|---------------|-----------------|---------|
| `free` | Rp 0 | 3/bulan | 3/bulan | 5/bulan |
| `premium` | Rp 49.000/bulan | 100/bulan | 500/bulan | 2000/bulan |

#### `subscriptions`
Auto-created (free tier) via trigger saat profil dibuat. Status: `active`, `expired`, `cancelled`.

#### `quota_usage`
Atomic — hanya di-update via `deduct_quota()` RPC dengan `FOR UPDATE` lock.

#### `coin_balances`
1 baris per user. `balance >= 0` enforced di DB level. Auto-created via trigger.

#### `coin_transactions`
Immutable ledger. Type: `mission_reward`, `ai_usage`, `admin_adjustment`.

#### `missions` (seed data)
| slug | Type | Reward |
|------|------|--------|
| `daily_login` | daily | 5 koin |
| `daily_face_scan` | daily | 10 koin |
| `weekly_3_scans` | weekly | 30 koin |
| `first_scan` | one_time | 50 koin |
| `streak_7_days` | streak | 100 koin |
| `streak_30_days` | streak | 500 koin |
| `referral_first` | social | 75 koin |

#### `tripay_invoices`
Status: `UNPAID` → `PAID` / `FAILED` / `REFUND`. Diupdate oleh webhook setelah verifikasi HMAC.

#### `chat_sessions` + `chat_messages`
Sessions ordered by `last_activity DESC`. Messages immutable.

---

## Database Functions (RPC)

Semua `SECURITY DEFINER` — hanya bisa dipanggil dari service role (Edge Functions), tidak dari client.

| Fungsi | Returns | Keterangan |
|--------|---------|-----------|
| `deduct_quota(user_id, feature_id, subscription_id)` | boolean | Atomic increment. `false` jika kuota habis. |
| `deduct_coins(user_id, amount, reference_id)` | boolean | Atomic deduct. `false` jika balance kurang. |
| `rollback_deduction(user_id, feature_id, subscription_id, mode, coin_amount?)` | void | Rollback jika AI provider error. |
| `credit_coins(user_id, amount, mission_id, notes?)` | void | Credit koin untuk reward misi. |
| `claim_mission(user_id, mission_slug, reward_coins)` | boolean | Atomic claim + credit. |
| `get_decrypted_secret(secret_name)` | text | Baca secret dari Supabase Vault. |

---

## Edge Functions

| Function | Auth | Keterangan |
|----------|------|-----------|
| `invoke-ai` | ✅ JWT | Gateway AI. Flow: auth → rate limit (10/mnt) → quota/coin check → Vault → AI provider → log → rollback on error |
| `tripay-invoice` | ✅ JWT | Buat invoice Tripay baru |
| `tripay-webhook` | ❌ HMAC | Callback Tripay. Verifikasi HMAC-SHA256 sebelum proses payload. |
| `tripay-check-status` | ✅ JWT | Cek status invoice |

---

## Deployment

### Supabase

```bash
supabase db push                             # Push migrations
supabase functions deploy invoke-ai
supabase functions deploy tripay-invoice
supabase functions deploy tripay-webhook
supabase functions deploy tripay-check-status
supabase secrets set TRIPAY_PRIVATE_KEY=<key>
# API keys AI → Supabase Dashboard > Database > Vault
```

### Vercel

Set environment variables di Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Security headers (CSP, X-Frame-Options, Permissions-Policy, dll) sudah dikonfigurasi di `vercel.json`.

---

## Security Notes

- RLS aktif di semua 19 tabel, policy scoped ke `auth.uid()`
- API key AI dan payment tidak pernah ke client — disimpan di Supabase Vault
- Tripay webhook diverifikasi HMAC-SHA256 sebelum payload diproses
- Rate limiting: 10 request/menit per user per fitur
- Quota dan coin deduction menggunakan atomic Postgres functions dengan `FOR UPDATE` locking

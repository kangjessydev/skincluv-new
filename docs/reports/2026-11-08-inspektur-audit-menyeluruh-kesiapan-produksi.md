# Laporan: `/role-inspektur` — Audit Menyeluruh Kesiapan Produksi, Ekonomi Token AI Studio, & Inventarisasi Data Dummy

- **Tanggal:** 2026-11-08
- **Brief/handoff terkait:** [011-asisten-to-inspektur-full-audit-production-readiness.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/011-asisten-to-inspektur-full-audit-production-readiness.md)
- **Mode:** Normal (Read-Only Audit)

---

## 1. Ringkasan Eksekutif & Skor Kelayakan Produksi
- **Status Build & Compiler (`tsc -b && vite build`)**: **LOLOS BERSIH (0 Error)** untuk seluruh 2.013 modul.
- **Status Linter (`oxlint`)**: **0 Error, 30 Warning** (29 warning berasal dari halaman preview eksperimental `src/pages/admin/v2/*` dan 1 unused import di `AdminDashboardPage.tsx`).
- **Status Kelayakan Produksi**: **Perlu Perbaikan Terfokus pada Fase 2 (Backend Token Accounting) & Fase 3 (Pembersihan Sisa Dummy UI & Peresmian Landing Page)** sebelum mengeksekusi **Fase 4 (Rebuild APK via GitHub Actions)**.

---

## 2. Audit Domain 1: Kesehatan Fitur & Sinkronisasi End-to-End (Agenda #1)

| Domain / Fitur | File Frontend | Edge Function / RPC | Tabel Database | Status Alur Data |
| :--- | :--- | :--- | :--- | :--- |
| **Autentikasi & PKCE Callback** | `LoginPage.tsx`, `AuthCallbackPage.tsx` | Supabase Auth | `auth.users`, `profiles` | 🟢 **Sinkron Penuh** |
| **Dashboard Ringkasan** | `DashboardPage.tsx`, `useDashboardData.ts` | RPC `get_dashboard_overview` | `face_scans`, `ingredient_scans`, `user_missions` | 🟡 **95% Nyata** *(Widget cuaca/UV masih statis berdasar jam)* |
| **Scan Wajah AI** | `FaceScanPage.tsx`, `useInvokeAI.ts` | Edge `invoke-ai` (`face_validation` + `face_analysis`) | `face_scans`, RPC `deduct_quota` / `deduct_coins` | 🟢 **Sinkron Penuh** |
| **Scan Komposisi Skincare** | `IngredientScanPage.tsx` | Edge `invoke-ai` (`ingredient_scan`) | `ingredient_scans`, `skincare_ingredients` | 🟢 **Sinkron Penuh** |
| **Skinsistant AI Chatbot** | `ChatbotPage.tsx` | Edge `invoke-ai` (`chatbot`) | `chat_sessions`, `chat_messages`, `user_clinical_memories` | 🟢 **Sinkron Penuh** |
| **Misi & Hadiah Credits** | `MissionsPage.tsx` | RPC `claim_mission`, `record_mission_progress` | `missions`, `user_missions`, `coin_transactions` | 🟡 **90% Nyata** *(Fallback `387` & kartu visual 7-Day Streak H1-H7 masih hardcoded)* |
| **Checkout & Tagihan Tripay** | `CheckoutPage.tsx`, `TransactionHistoryPage.tsx` | Edge `tripay-create-transaction`, `tripay-callback` | `tripay_invoices`, `subscriptions` | 🟢 **Sinkron Penuh** |
| **Pusat Privasi UU PDP** | `PrivacyCenterPage.tsx` | RPC penghapusan biometrik & akun | `face_scans`, `chat_session_summaries`, Storage | 🟢 **Sinkron Penuh** |
| **Admin Konsol Utama (17 Rute)** | `src/pages/admin/*.tsx` | RPC Admin & `admin-set-api-key` | `ai_request_logs`, `provider_deposits`, `provider_balances` | 🟡 **95% Nyata** *(Ada gap perhitungan token Gemini & simulator diskon hardcoded)* |
| **Admin Preview V2 (16 Rute)** | `src/pages/admin/v2/*.tsx` | *(Tidak ada koneksi API)* | *(Tidak ada koneksi DB)* | 🔴 **100% Dummy Preview** |

---

## 3. Audit Domain 2: Ekonomi Token & Kredit Google AI Studio (Persiapan Agenda #2)

Berdasarkan pemeriksaan mendalam pada [supabase/functions/_shared/aiProviders.ts](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/_shared/aiProviders.ts), [supabase/functions/invoke-ai/index.ts](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts), dan [src/pages/admin/AdminFinancialsPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx), ditemukan **5 penyebab utama** mengapa angka pemakaian token/saldo di dashboard Skincluv bisa berbeda dari angka di dashboard **Google AI Studio**:

1. **Celah #2A — `thoughtsTokenCount` (Token Penalaran Gemini) Diabaikan dari Perhitungan Token & Biaya**:
   - **Lokasi**: [supabase/functions/_shared/aiProviders.ts:229-232](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/_shared/aiProviders.ts#L229-L232)
   - **Kutipan Kode**:
     ```ts
     const inputTokens = data.usageMetadata?.promptTokenCount ?? 0
     const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0
     const _thoughtsTokens = data.usageMetadata?.thoughtsTokenCount ?? 0
     const tokensUsed = inputTokens + outputTokens
     ```
   - **Masalah**: Pada model Gemini 2.5 / 3.x Flash (terutama `face_analysis` yang menggunakan reasoning penuh), Google AI Studio menagihkan `thoughtsTokenCount` sebagai bagian dari token output (`totalTokenCount = promptTokenCount + candidatesTokenCount + thoughtsTokenCount`). Karena `_thoughtsTokens` diabaikan, catatan token dan `cost_usd` di Skincluv selalu lebih rendah daripada tagihan aktual di Google AI Studio.

2. **Celah #2B — 4 Panggilan AI Background Tidak Dicatat ke `ai_request_logs`**:
   - **Lokasi**:
     1. `enrichMissingIngredientsWithGemini` di [supabase/functions/invoke-ai/index.ts:1774-1781](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L1774-L1781) (memanggil Gemini hingga 3x di background saat ada bahan kosmetik baru).
     2. `extractMemoryWithAi` di [supabase/functions/invoke-ai/index.ts:1871-1878](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L1871-L1878) (memanggil Gemini di background untuk ekstraksi memori alergi/kulit).
     3. `generateSessionSummary` di [supabase/functions/invoke-ai/index.ts:1997-2004](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L1997-L2004) (memanggil Gemini di background setiap >=4 pesan chat).
     4. `test_connection` di [supabase/functions/admin-set-api-key/index.ts:66-76](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/admin-set-api-key/index.ts#L66-L76) (saat admin menguji koneksi model).
   - **Masalah**: Keempat panggilan di atas memotong kuota/token API key Google AI Studio milik Anda, tetapi **tidak melakukan `INSERT INTO public.ai_request_logs`**. Akibatnya, view `public.provider_balances` (Migration 070) tidak mengurangi saldo deposit Google Anda untuk panggilan-panggilan tersebut.

3. **Celah #2C — Model Failover Tidak Mengembalikan Nama Model Aktual yang Dipakai**:
   - **Lokasi**: [supabase/functions/_shared/aiProviders.ts:60-66](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/_shared/aiProviders.ts#L60-L66) dan [supabase/functions/invoke-ai/index.ts:1081-1086](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L1081-L1086).
   - **Masalah**: `callGemini` memiliki daftar failover (`gemini-3.5-flash` → `gemini-3.6-flash` → `gemini-2.5-flash`), namun `AiResponse` tidak mengembalikan `modelUsed`, sehingga `estimateCostUsd` selalu menghitung tarif menggunakan nama model pertama.

4. **Celah #2D — Penyesuaian Bobot `credit_cost` User vs Konsumsi Token Aktual**:
   - **Lokasi**: [supabase/functions/invoke-ai/index.ts:55-60](file:///home/kangjessy/Documents/projects/skinscan/skincluv/supabase/functions/invoke-ai/index.ts#L55-L60) & tabel `public.ai_features`.
   - **Masalah**: Saat ini `credit_cost` di-set statis (`face_analysis = 5`, `ingredient_scan = 3`, `chatbot = 1`, `face_validation = 0`), dan kuota langganan (`deduct_quota` pada `universal_ai`) memotong 1 kuota per panggilan tanpa membedakan apakah fitur tersebut memakan ~3.000 token (`face_analysis` + reasoning) atau ~800 token (`chatbot`).

5. **Celah #2E — Query `ai_request_logs` di `AdminFinancialsPage.tsx` Terpotong Batas 1.000 Baris PostgREST**:
   - **Lokasi**: [src/pages/admin/AdminFinancialsPage.tsx:188-205](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx#L188-L205).
   - **Masalah**: Mengambil seluruh baris `ai_request_logs` ke browser klien tanpa agregasi RPC dan hanya mengambil `status = 'success'`. Ketika log melampaui 1.000 baris, total token & biaya di halaman Admin Financials menjadi tidak akurat terhadap `provider_balances`.

---

## 4. Audit Domain 3: Deteksi Sisa Data Dummy Statis di App & Admin (Agenda #3)

Berikut adalah **seluruh titik data dummy / statis** yang ditemukan di dalam kode aplikasi dan admin beserta bukti barisnya:

1. **Suhu & Indeks UV Harian Palsu di Dashboard Pengguna**:
   - **Lokasi**: [src/pages/app/DashboardPage.tsx:49-81](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/DashboardPage.tsx#L49-L81) dan [baris 253-260](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/DashboardPage.tsx#L253-L260).
   - **Bukti**: Fungsi `getEnvironmentalWeather()` mengembalikan angka suhu dan indeks UV hardcoded berdasarkan jam (`26°C · UV 3.2 (Sedang)` pada pagi hari, `31°C · UV 7.8 (Tinggi)` pada siang hari, dst.).
2. **Angka Fallback Dummy `387` pada Total Credits Diperoleh**:
   - **Lokasi**: [src/pages/app/MissionsPage.tsx:171](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L171).
   - **Bukti**: `setTotalEarned(coinBalance?.balance || 387)` — menampilkan `387 Credits` jika akun belum memiliki mutasi koin positif.
3. **Timeline 7-Hari Check-in Streak Hardcoded di `MissionsPage.tsx`**:
   - **Lokasi**: [src/pages/app/MissionsPage.tsx:314-325](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L314-L325).
   - **Bukti**: Array `checkinDays` meng-hardcode `day: 1` dan `day: 2` selalu `isClaimed: true`, serta `day: 3` selalu `isToday: true`, tanpa membaca riwayat klaim `daily_login` pengguna yang sebenarnya.
4. **Form Kontak Publik Tidak Menyimpan ke Database & Nomor WhatsApp Dummy**:
   - **Lokasi**: [src/pages/public/ContactPage.tsx:27-30](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx#L27-L30) dan [baris 81](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx#L81).
   - **Bukti**:
     - `handleSubmit` hanya menjalankan `e.preventDefault(); setSubmitted(true)` tanpa mengirim data ke Supabase, padahal pesan suksesnya menulis *"Catatanmu sudah kami simpan"*.
     - Link WhatsApp mengarah ke nomor placeholder `https://wa.me/6281234567890`.
5. **Angka Hardcoded pada Simulator Diskon & Badge Profitabilitas di `AdminFinancialsPage.tsx`**:
   - **Lokasi**: [src/pages/admin/AdminFinancialsPage.tsx:998-1002](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx#L998-L1002) (`simPricePro = 69000`, padahal harga PRO di DB adalah Rp 49.000) dan [baris 1832-1834](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx#L1832-L1834) (badge statis `Margin Super Tebal (>90%)`).
6. **Rute Preview Eksperimental `/v2/admin/*` Berisi 100% Data Dummy**:
   - **Lokasi**: `src/pages/admin/v2/*.tsx` yang didaftarkan di [src/App.tsx:155-172](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/App.tsx#L155-L172).
   - **Bukti**: Menampilkan nama anggota tim fiktif (`Toby Belhome`, `Jackson Lee`), invoice palsu, dan angka statistik hardcoded.

---

## 5. Audit Domain 4: Inventarisasi Lengkap Elemen Landing Page & Halaman Publik (Agenda #4)

Untuk memudahkan User mengganti konten dummy di halaman publik menjadi **teks resmi**, berikut adalah peta lengkap seluruh teks/elemen di [src/pages/LandingPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx), [src/pages/public/ContactPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx), dan [src/pages/public/DownloadPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/DownloadPage.tsx):

| Kode Item | Lokasi (`file:baris`) | Bagian Halaman | Konten Saat Ini di Kode | Catatan / Temuan Auditor |
| :--- | :--- | :--- | :--- | :--- |
| **LP-01** | [LandingPage.tsx:93-105](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L93-L105) | **Hero Headline & Lead** | • Badge: `"Teman Tenang Meja Riasmu"`<br>• H1: `"Rawat Kulitmu Pelan-pelan, Tanpa Rasa Cemas."`<br>• Lead: `"Cukup satu foto santai di depan cermin. Skinsistant membantumu membaca kebutuhan kulit harian dan mencocokkan skincare yang tepat — tanpa vonis angka, tanpa bikin overthinking."` | Klaim *"tanpa vonis angka"* bertabrakan dengan fitur nyata aplikasi yang menampilkan skor `/100`. |
| **LP-02** | [LandingPage.tsx:165-173](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L165-L173) | **Hero Floating Bubble** | `"Tarik napas dulu ya. Kemerahan ini wajar karena semalam tidurmu kurang lelap. Hari ini kita rawat pelan-pelan tanpa panik."` | Contoh kutipan respons Skinsistant di atas ilustrasi hero. |
| **LP-03** | [LandingPage.tsx:183-230](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L183-L230) | **Seksi 2: 3 Kartu Masalah** | 1. `"Udah checkout racun FYP, kok malah perih?"`<br>2. `"Meja rias penuh, tapi bingung mana yang aman digabung..."`<br>3. `"Capek dikasih skor merah jelek sama aplikasi scanner..."` (menyebut nilai 50/100). | Kartu ke-3 menyindir aplikasi yang memberi skor `/100`, padahal Skincluv sendiri memakai skor `/100`. |
| **LP-04** | [LandingPage.tsx:235-316](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L235-L316) | **Seksi 2.5: 3 Kartu Fitur Utama** | 1. `"Biar Gak Ragu Mau Pakai Apa Hari Ini"` (Scan Wajah)<br>2. `"Cegah Salah Beli Sebelum Boncos"` (Scan Komposisi)<br>3. `"Gak Ada Pertanyaan yang Terlalu Sepele"` (Skinsistant Chat) | Dilengkapi 3 kotak `feature-mock-screen` berisi tag & bubble simulasi. |
| **LP-05** | [LandingPage.tsx:321-489](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L321-L489) | **Seksi 3–5: Storytelling 3 Babak (Pagi, Siang, Malam)** | • Babak 1 (07:00 Pagi): 3 langkah + *"Janji Manis Skincluv: Kami tidak pernah memberi angka merah 40/100 pada wajahmu..."*<br>• Babak 2 (14:00 Siang): Cerita di depan rak toko kosmetik + kutipan Niacinamide.<br>• Babak 3 (21:30 Malam): Ruang curhat malam + dialog kulit kering kena AC kantor. | *Janji Manis* di baris 380 juga mengatakan tidak memberi angka `/100`. Perlu disesuaikan dengan teks resmi user. |
| **LP-06** | [LandingPage.tsx:494-550](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L494-L550) | **Seksi 6: Testimoni ("Suara Hati Sahabat")** | **3 Testimoni Fiktif (Dummy)**:<br>1. `Nadia Amanda (24 tahun • Mahasiswi)`<br>2. `Tara Clarissa (27 tahun • Product Designer)`<br>3. `Rania Putri (29 tahun • Ibu Muda & Pekerja)` | **100% Data Dummy**. Wajib diganti dengan testimoni/kutipan resmi dari user atau diganti menjadi seksi nilai jual resmi. |
| **LP-07** | [LandingPage.tsx:44-61](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L44-L61) & [607-645](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L607-L645) | **Seksi 8: FAQ Beranda (4 Pertanyaan)** | 1. Privasi foto wajah (UU PDP)<br>2. Cara kerja Ingredient Check<br>3. Pakai gratis dengan AI Credits<br>4. Perbedaan dengan dokter Sp.DVE/Sp.KK | Sudah selaras dengan Invarian 19 & 23, siap disesuaikan jika user punya daftar FAQ resmi. |
| **PUB-01** | [ContactPage.tsx:81](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx#L81), [107](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx#L107), [128-129](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/ContactPage.tsx#L128-L129) | **Kontak Resmi CS** | • WhatsApp: `https://wa.me/6281234567890`<br>• Email: `support@skincluv.com`<br>• Jam Operasional: Senin–Jumat 09.00–18.00 WIB, Sabtu–Minggu 10.00–16.00 WIB | Nomor WA `6281234567890` adalah dummy placeholder. |
| **PUB-02** | [DownloadPage.tsx:68-70](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/DownloadPage.tsx#L68-L70) & [250](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/public/DownloadPage.tsx#L250) | **Metadata Rilis APK** | Badge hardcoded: `Versi 1.0.0 (Build Resmi)` & `Ukuran: 24.3 MB` | Perlu disinkronkan setelah APK baru di-build di Fase 4. |

---

## 6. Handoff yang Dibuat
1. [012-inspektur-to-backend-ai-studio-token-sync.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/012-inspektur-to-backend-ai-studio-token-sync.md) — Untuk `/role-backend` & `/role-database` (Fase 2: Sinkronisasi API Key, `thoughtsTokenCount`, pencatatan background AI calls ke `ai_request_logs`, dan keselarasan kredit user dengan token Google AI Studio).
2. [013-inspektur-to-frontend-dummy-cleanup-and-landing.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/013-inspektur-to-frontend-dummy-cleanup-and-landing.md) — Untuk `/role-frontend` & `/role-copywriter` (Fase 3: Pembersihan sisa dummy di `DashboardPage`, `MissionsPage`, `ContactPage`, `AdminFinancialsPage`, serta penerapan teks resmi Landing Page dari user).

---

## 7. Rangkuman Sesi
Audit Fase 1 selesai dilaksanakan secara menyeluruh tanpa mengubah satu baris pun kode sumber (`src/`, `supabase/`, `.github/`). Seluruh bukti baris kode telah dipetakan dan siap dieksekusi pada Fase 2 dan Fase 3 setelah user menyerahkan detail API/token Google AI Studio dan teks resmi Landing Page.

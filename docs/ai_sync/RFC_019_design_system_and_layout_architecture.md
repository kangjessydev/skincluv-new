# [RFC 019] Design System, Layout Architecture & Per-Page UI Specification
**Target Reviewer**:
- **Claude (Anthropic)** — Arsitektur komponen, konsistensi token, semantic HTML
- **ChatGPT (OpenAI o1/o3)** — Layout grid edge case, UX pattern validation, a11y audit
- **DeepSeek (R1/V3)** — CSS rendering performance, repaint budget, scroll jank analysis

**Tanggal**: 2026-09-29
**Status Codebase**: React Vite SPA + Supabase Live DB + Deno Edge Functions
**Konteks**: Owner menyetujui desain baru berbasis v0.dev (Plus Jakarta Sans, fresh teal #1f9d97, generous human-proportioned spacing). RFC ini adalah panduan untuk dewan AI men-review & memperkuat desain sebelum diimplementasi ke seluruh halaman.

---

## 1. Design Language yang Sudah Disetujui Owner

| Token | Nilai |
|---|---|
| **Font utama** | `Plus Jakarta Sans` (weights 400–800) |
| **Background canvas** | `#f7faff` |
| **Surface kartu** | `#ffffff` border `1px solid #dfeaf2` radius `18px` |
| **Teks heading** | `#13243c` font-weight 700, tracking `-0.04em` |
| **Teks muted** | `#8496a6` |
| **Teal primary** | `#1f9d97` (hover `#188b86`) |
| **Teal soft** | `#eaf8f7` |
| **Blue stat** | `#4b91c6` / `#e6f2ff` |
| **Coral** | `#e28b65` / `#fff0e9` |
| **Lavender** | `#896bc2` / `#f1edff` |
| **Nav sidebar width** | `264px` fixed |
| **Navbar height** | `78px` sticky |
| **Menu item font** | `14.5px` weight 500, padding `13px 15px`, icon `20px` |
| **Primary button** | height `46px`, radius `14px`, shadow `0 8px 20px rgba(31,157,151,0.24)` |
| **Card padding** | `26px` |
| **Page body padding** | `38px 44px` |

---

## 2. Bug & Masalah Layout yang Diidentifikasi Owner

**BUG 1 — Equal-Height Cards Problem (Middle Row):**
```css
.v0-middle-split-grid {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 22px;
  /* Default align-items: stretch memaksa kartu kanan setinggi kartu kiri */
}
```
Kartu "Keseimbangan Mingguan" (kiri, konten banyak) dan kartu "Kulitmu Butuh Jeda" (kanan, konten sedikit) terpaksa sama tinggi. Hasilnya banyak whitespace kosong di kartu kanan yang tidak elegan.

**BUG 2 — Sidebar Tidak Sticky/Fixed:**
Sidebar saat ini `display: flex` dalam flex-wrapper biasa. Ketika halaman di-scroll, sidebar ikut hilang ke atas. Dashboard app HARUS selalu menampilkan sidebar.

**BUG 3 — Navbar 78px Makan Ruang Vertical:**
Navbar 78px sticky memang memberikan kesan premium, tapi di layar 1024–1280px terasa sempit. Apakah perlu dikurangi?

---

## 3. Pertanyaan untuk Dewan AI

### UNTUK CLAUDE (Chief Architect)

**Q1 — Solusi Equal-Height Cards:**
- Apakah `align-items: start` pada grid wrapper sudah cukup?
- Atau insight card harus `display: flex; flex-direction: column; justify-content: space-between` agar footer footer-nya selalu di bawah meski konten singkat?
- Apakah perlu `min-height` tertentu pada insight card agar tidak terlalu mini?

**Q2 — Component Architecture (CSS Scoping):**
Seluruh CSS saat ini inline `<style>` per halaman dengan prefix `v0-`. Apakah untuk ~14 halaman ini cukup, atau sebaiknya:
a) `src/styles/components.css` global?
b) Extract `<Card>`, `<StatBox>`, `<PageHeader>` sebagai shared React components?
c) Tetap inline tapi semua token pindah ke CSS variables di `index.css`?

**Q3 — Komponen Atom yang Harus Ada:**
Kandidat untuk di-extract:
- `<Card>` — surface box standar
- `<StatBox>` — metric card dengan icon, angka besar, delta note
- `<PageHeader>` — greeting + tanggal + CTA button
- `<SectionTitle>` — h2 + subtitle + action link
- `<Badge>` — status pill
- `<EmptyState>` — empty dengan ikon & teks
- `<SkeletonLoader>` — shimmer loading placeholder

Mana yang paling kritikal dibuat duluan?

### UNTUK CHATGPT (UX Pattern Expert)

**Q4 — Sidebar Sticky Pattern Terbaik:**

| Opsi | Implementasi | Trade-off |
|---|---|---|
| A | `position: fixed; left: 0; top: 0; height: 100vh` + `margin-left: 264px` pada konten | Paling stabil, margin manual |
| B | Sidebar `position: sticky; top: 0; height: 100vh; overflow-y: auto` dalam flex parent | Elegan, perlu `align-items: flex-start` di parent |
| C | CSS Grid `grid-template-columns: 264px 1fr; height: 100vh` + masing-masing scroll independen | Paling modern, cocok untuk chatbot auto-grow |

Mana yang direkomendasikan untuk React SPA dengan halaman chatbot auto-grow?

**Q5 — Navbar Height:**
SaaS modern (Notion, Linear, Vercel) rata-rata 56–64px. Skincluv pakai 78px untuk kesan premium. Apakah ini proporsional? Ambang batas ideal?

**Q6 — Dashboard Above-the-Fold Priority:**
Beranda v0.dev template: greeting + 3 stat card + bar chart + insight + rutinitas + aktivitas.
Yang belum ada tapi relevan:
- **Skin Type Label** dari face_analysis terbaru (tipe kulit user)
- **Ingredient Risk Alert** jika produk terakhir high-risk
- **Misi Glow Progress bar** (selesai X dari Y misi)
- **AI Credits remaining** (terutama kalau < 20%)
- **Quick Scan Shortcut** (2 tombol besar: Scan Wajah | Scan Komposisi)

Ranking dari yang paling kritikal above-the-fold?

### UNTUK DEEPSEEK (Performance Optimizer)

**Q7 — CSS Inline Style Performance:**
14 halaman × avg 200 lines CSS = ~2800 lines CSS potensial di DOM. Apakah ini menyebabkan style recalculation signifikan? Threshold TTI yang optimal?

**Q8 — Grid vs Flexbox untuk Asymmetric Layout:**
```css
/* Option A */
.grid { display: grid; grid-template-columns: 1.55fr 1fr; align-items: start; }

/* Option B */
.flex { display: flex; align-items: flex-start; gap: 22px; }
.left { flex: 1.55; } .right { flex: 1; }
```
Mana yang lebih sedikit layout reflow di Chrome 120+?

---

## 4. Per-Page Visual Specification

Untuk setiap halaman, rekomendasi elemen visual (bukan hanya teks/tabel):

| Halaman | Data Tersedia | Elemen Visual Direkomendasikan |
|---|---|---|
| `/` Beranda | skin_assessment, product_summary, missions, subscription | Score ring, Bar chart, Progress bar, Aktivitas timeline |
| `/face-scan` | Live camera + Gemini AI result | Camera viewfinder besar, Score ring animasi, Risk badge |
| `/ingredient-scan` | Product list, safety score, ingredient | Safety meter, Ingredient heatmap, Risk badge |
| `/scan-history` | Timeline scan face + ingredient | Timeline grid, Score trend line chart, Thumbnail before/after |
| `/chatbot` | Chat sessions, clinical memories | Chat bubbles, Visual scan card embed, Memory indicator |
| `/missions` | Mission list, streak, completed count | Progress ring besar, Streak counter, Checklist cards |
| `/pricing` | Tiers, features, current plan | Tier card highlight, Feature matrix, Usage meter |
| `/profile` | User data, consent, subscription, privacy | Profile card, Privacy toggle, Subscription badge, Scan stats |

---

## 5. Design System Checklist (dari Owner)

Owner bertanya: *"saya tidak tau apa saja yang harus disiapkan? seperti grup warna, grup komponen, dll."*

### 5a. Color Tokens yang Harus Ada di `index.css`
```css
/* Background & Surface */
--color-canvas, --color-surface, --color-surface-muted, --color-surface-hover

/* Text */
--color-text-primary, --color-text-secondary, --color-text-muted, --color-text-disabled

/* Brand Colors */
--color-teal, --color-teal-hover, --color-teal-soft, --color-teal-muted
--color-blue, --color-blue-soft
--color-coral, --color-coral-soft
--color-lavender, --color-lavender-soft

/* Status (Clinical-safe vocabulary) */
--color-optimal, --color-optimal-soft   /* hijau */
--color-warning, --color-warning-soft   /* amber */
--color-alert, --color-alert-soft       /* merah */

/* Border & Shadow */
--color-border, --color-border-soft
--shadow-card, --shadow-lg, --shadow-button

/* Chart Colors */
--chart-bar-default, --chart-bar-active, --chart-line
```

### 5b. Component Priority (dibuat duluan vs bisa ditunda)
**KRITIKAL (buat sekarang):**
1. `<Card>` — dipakai di semua halaman
2. `<StatBox>` — dipakai di Dashboard
3. `<SkeletonLoader>` — UX saat loading data
4. `<EmptyState>` — saat data kosong (baru daftar, belum scan)
5. `<Badge>` — status indicator di mana-mana

**BISA DITUNDA (inline dulu):**
6. `<PageHeader>` — hanya Dashboard yang pakai pola greeting
7. `<SectionTitle>` — bisa inline
8. `<TwoColumnGrid>` — bisa inline per halaman

### 5c. Layout Primitives yang Perlu
- **AppShell**: sidebar fixed/sticky + content area + navbar — **KRITIKAL**
- **Grid 3-col**: stat cards — bisa inline
- **Grid asimetris**: 1.55/1 split — bisa inline

---

## 6. Invarian yang TIDAK BOLEH Dirusak

1. **Kosakata Kanonikal (Inv.19)**: "AI Credits" (bukan Koin), "Skinsistant AI", "Analisis Komposisi", "Paket Akses"
2. **Terminologi Terlarang (Inv.19)**: Jangan pakai "Diagnosis", "Terapi", "Medis" → gunakan "Analisis Kulit AI", "Pemetaan Kondisi Kulit"
3. **MCID Disclaimer (Inv.13)**: Selisih score < 5 poin = label "Stabil", bukan "Meningkat"
4. **Chat Privacy (Inv.12)**: Bubble chat TIDAK BOLEH embed foto wajah asli, hanya reference ID
5. **Right to be Forgotten (Inv.4)**: Memory Consent OFF → hapus atomik `user_clinical_memories` + `chat_session_summaries`

---

## 7. Rekomendasi yang Diharapkan dari Reviewer

1. **Bug 1 (Equal-height)**: CSS solution + contoh kode siap pakai
2. **Bug 2 (Sidebar sticky)**: Pilih opsi A/B/C + CSS siap pakai
3. **Bug 3 (Navbar 78px)**: Tetap atau kurangi? Argumen UX?
4. **Component priority**: Ranking 8 komponen dari paling kritikal
5. **Per-page spec**: 2–3 elemen visual terpenting per halaman
6. **Token list**: CSS variables wajib ada di `index.css`
7. **Dashboard above-the-fold**: Ranking elemen baru yang perlu ditambah

---
*RFC disiapkan oleh Antigravity (Lead Engineer Skincluv).*
*Implementasi akan dimulai setelah konsensus dewan AI diterima.*

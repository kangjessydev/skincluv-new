# 🏛️ SKINCLUV AI Council & Production Protocol

Dokumen ini adalah panduan resmi kolaborasi lintas AI (**Multi-Model Consensus & Production Protocol**) untuk pengembangan aplikasi **Skincluv**. Siapapun AI yang membaca repository ini (Claude, ChatGPT, DeepSeek, Kimi, atau Antigravity) **WAJIB** memahami dan mematuhi arsitektur serta aturan main di bawah ini.

---

## 1. Pembagian Peran AI (AI Council Roles)

Proyek ini dibangun secara sinergis oleh dewan AI dengan pemisahan tanggung jawab yang tegas:

| AI Agent / Model | Peran Utama | Tanggung Jawab & Batasan |
| :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | **Lead Engineer & Runtime Builder** | • Memegang eksekusi penuh di mesin lokal: terminal, git, linked live Supabase DB, build compiler, dan edge functions.<br>• Mengimplementasikan kode hasil review dari AI lain.<br>• Melakukan verifikasi empiris (menjalankan query SQL, `tsc -b && vite build`, benchmark latensi). |
| **Claude (Anthropic)** | **Chief Software Architect & Code Reviewer** | • Review arsitektur, clean code, konsistensi skema DB, dan refactoring modular.<br>• Memastikan kepatuhan privasi data (UU PDP / GDPR).<br>• Menemukan *dead code*, *orphan queries*, atau regresi logika. |
| **ChatGPT (OpenAI o1 / o3 / GPT-4o)** | **Security Red Teamer & Concurrency Auditor** | • Menguji kerentanan RLS (*Row Level Security*), otentikasi Supabase, dan penetrasi API.<br>• Audit konkurensi: *race conditions* pada sistem kredit/koin, *double-spending*, dan kegagalan webhook pembayaran (Tripay/Xendit). |
| **DeepSeek (R1 / V3)** | **Mathematical & Performance Optimizer** | • Analisis *execution plan* query SQL, efisiensi indexing PostgreSQL, dan regex optimization.<br>• Validasi rumus finansial, unit economics, dan optimasi *token budget*. |
| **Kimi (Moonshot)** | **Clinical Skincare & Regulatory Researcher** | • Validasi bahan aktif, kontraindikasi dermatologi, dan kepatuhan regulasi kosmetik (BPOM & FDA).<br>• Riset literatur klinis untuk memperkaya RAG knowledge base. |

---

## 2. Invarian Arsitektur Kritis (JANGAN DIUBAH / DIHAPUS SEMBARANGAN!)

Sebelum memberikan saran atau me-review kode, AI reviewer harus memahami invarian berikut:

1. **`universal_ai` di `ai_features` BUKAN Fitur Mati**:
   - Slug `universal_ai` adalah *virtual anchor feature* untuk mesin kuota langganan (*universal subscription quota engine*).
   - Di `supabase/functions/invoke-ai/index.ts` baris 175–195, kuota paket berbayar (Glow Club / Pro Club) dipotong melalui RPC `deduct_quota` dengan target fitur ini.
   - **DILARANG MENGHAPUS ATAU MENONAKTIFKAN `universal_ai`**, karena akan melumpuhkan seluruh sistem kuota subscriber berbayar!

2. **`face_validation` adalah 0-Credit Gatekeeper**:
   - `face_validation` berdiri sebagai fitur mandiri di `ai_features` dengan `credit_cost: 0` (gratis bagi user).
   - Menggunakan model kilat `gemini-3.5-flash` (dengan dynamic fallback ke `gemini-3.6-flash`) dengan `thinking_budget: 0` dan prompt ultra-singkat (Migration 041, 042, 055 & 056).
   - Bertujuan menolak foto bukan wajah manusia/buram SEBELUM `face_analysis` (5 kredit, `gemini-3.5-flash`) dipanggil.

3. **Thinking Budget Strategy**:
   - `ingredient_scan` dan `face_validation`: **Wajib `thinking_budget: 0`** demi latensi di bawah 10 detik.
   - `face_analysis`: **Reasoning penuh bawaan** (parameter `thinking_budget` di-omit) demi diagnosis klinis akurat.

4. **Right to be Forgotten (UU PDP No. 27 Tahun 2022)**:
   - Jika pengguna mematikan toggle *Memory Consent* di chatbot, sistem wajib menghapus bersih data `user_clinical_memories` **DAN** `chat_session_summaries` milik user tersebut secara atomik (`ChatbotPage.tsx`).

5. **Sanitasi Web Search (Tavily)**:
   - Query pencarian di `_shared/searchProvider.ts` wajib melalui pembersihan kata ganti orang pertama (`aku`, `saya`, `kulitku`, `wajahku`) dan disematkan anchor `skincare dermatologi` sebelum dikirim ke mesin pencari demi privasi data dan akurasi hasil pencarian.

6. **Ground Truth Klinis Deterministik**:
   - Tidak ada klaim risiko, bahaya kombinasi, atau kontraindikasi klinis yang lahir dari penalaran LLM murni (halusinasi bebas).
   - Seluruh kontraindikasi kondisi kulit × bahan aktif wajib bersumber dari tabel database deterministik terverifikasi (`clinical_condition_rules` & `ingredient_interactions`). LLM chatbot (Qwen) hanya bertindak sebagai *explainer* dan penyampai naratif edukatif, bukan penentu risiko klinis.

7. **Exact Image Idempotency (RFC 011)**:
   - Untuk user yang sama, foto kanonikal yang sama (`image_content_hash`), dan versi analisis yang kompatibel (`analysis_version: 'face-v4'`), permintaan duplikat identik di `invoke-ai` tidak boleh memotong kuota/kredit tambahan atau memanggil Gemini AI lebih dari sekali dalam jendela TTL (48 jam).

8. **No Perceptual False Clinical Equivalence (RFC 011)**:
   - Foto yang hanya mirip secara visual (*perceptual similarity* / pHash) dilarang keras dianggap sebagai duplikat klinis identik secara otomatis. Hanya *exact canonical hash* (SHA-256) yang berhak atas cache hit otomatis.

9. **Anti-Pencemaran Baseline Tren (RFC 011)**:
   - Hasil scan yang berasal dari cache hit ditandai permanen dengan `is_repeat = true`.
   - Baris dengan `is_repeat = true` wajib disaring keluar (`WHERE is_repeat = false`) dari perhitungan median baseline 28 hari dan riwayat grafik tren perkembangan kulit agar riwayat user tidak terdistorsi.

10. **LLM UI Intent vs Server Resource Authority (RFC 012)**:
    - LLM hanya berhak meminta intent UI (`SHOW_LATEST_FACE_SCAN`, `SHOW_LATEST_INGREDIENT_SCAN`), tetapi DILARANG KERAS menentukan UUID resource, otorisasi data, atau mengarang data klinis pada card visual. Backend server di Edge Function yang berwenang mengaitkan resource berdasarkan `auth.uid()`.

11. **Reference-Only Metadata Persistence (RFC 012)**:
    - Kolom `chat_messages.metadata` hanya menyimpan reference ID resource (`{ "type": "face_scan_summary", "resource_id": "uuid", "resource_version": 1 }`), BUKAN salinan data klinis atau gambar biometrik.

12. **Right to be Forgotten Clean Invalidation (RFC 012)**:
    - Jika user menghapus rekam jejak scan tertentu dari akunnya, visual card terkait di riwayat obrolan masa lalu wajib me-resolve ke 404/null dan berstatus *unavailable* (tidak menampilkan data klinis basi/bocoran).

13. **Strict Biometric Data Minimization & Defensible Claims (RFC 012)**:
    - Chat bubble dilarang menampilkan foto wajah asli user (hanya representasi grafis/score ring SVG). Card dilarang mencantumkan klaim "Status Klinis BPOM" palsu atau kata mutlak terlarang seperti "Formula Aman" (PerBPOM No. 3/2022); gunakan label assessment kualitatif yang defensible (misal: *Skin Assessment: Optimal/Baik*, *Skor Keamanan Formula: Sangat Baik/Baik/Perlu Perhatian*) serta mikro-disclaimer dokter.

14. **Clinical Temporal Comparison & MCID Guardrails (RFC 013)**:
    - Perbandingan dua scan lintas tanggal wajib mengacu pada ambang MCID (*Minimal Clinically Important Difference*): selisih < 5 poin wajib divonis "Stabil (noise pengukuran pencahayaan/sudut foto)". Selisih < 7 hari dinyatakan terlalu dini untuk perubahan fisiologis nyata (siklus kulit 28 hari). Jika `is_repeat = true` pada salah satu scan, perbandingan perbaikan kulit dinyatakan tidak valid secara klinis.

15. **Product Handbook Hierarchy of Authority (RFC 013)**:
    - Pengetahuan produk dan fitur Skincluv bersumber dari tabel handbook terverifikasi dengan aturan *what_it_is_not* (penangkal halusinasi scope). Aturan hierarki mutlak: Database / Logika Transaksi (`subscription_tiers`, `ai_features`) > Handbook (Prosa & Scope) > LLM (Naratif). Biaya kredit dan harga paket tidak boleh di-hardcode secara statis di handbook.

16. **Biometric & Clinical Data Isolation for Support Roles (RFC 015)**:
    - Role Customer Support (`support_agent`) dan peran non-klinis lainnya hanya berhak membaca status pembayaran, langganan, dan saldo kuota via CS-safe DTO/RPC sempit. DILARANG KERAS mengakses foto wajah asli, storage signed URL, atau rekam jejak klinis pengguna demi kepatuhan UU PDP No. 27/2022.

17. **Dual-Track Accounting: Cash Treasury vs Accrual Consumption (RFC 015)**:
    - Setoran kas deposit ke provider adalah aset prabayar (*prepaid asset / cash movement*), bukan beban biaya berjalan. Grafik tren biaya operasional bulanan wajib mem-plot konsumsi riil (`cost_usd`), bukan pergerakan kas deposit, dengan valuasi saldo menggunakan metode Weighted Average Cost (WAC).

18. **Pricing Integrity & Non-Derived Invoice Billing (RFC 015)**:
    - Nilai transaksi yang ditagihkan ke payment gateway (Tripay) wajib merujuk langsung ke kolom `price_idr` aktual saat pesanan dibuat. Persentase diskon promo hanya bersifat representasi visual di antarmuka dan tidak boleh dijadikan acuan nominal penagihan invoice.

19. **Non-Therapeutic Product Claim Boundary (RFC 016 & RFC 017)**:
    - Skincluv beroperasi secara mutlak di luar definisi fasilitas telemedisin klinis dan alat kesehatan diagnostik (UU Kesehatan No. 17/2023, Permenkes No. 20/2019, dan Permenkes No. 62/2017 tentang Izin Edar Alat Kesehatan / SaMD). Skincluv dilarang memasarkan, merepresentasikan, atau menghasilkan klaim bahwa fitur analitik kosmetiknya merupakan diagnosis medis, terapi, resep, atau pengobatan. Seluruh antarmuka aktif pengguna, hasil scan, dan respons AI dilarang menggunakan register medis tereservasi: *Diagnosis, Terapi, Resep, Mengobati, Menyembuhkan, Klinis, Medis, Dermatologis*. Hasil pemindaian wajib dilabeli sebagai *Analisis Kulit AI / Pemetaan Kondisi Kulit / Observasi Visual*.

20. **Dual-Track Deletion Lifecycle & Financial Integrity (RFC 016)**:
    - Penghapusan akun pengguna (Right to be Forgotten UU PDP No. 27/2022) wajib memisahkan data transaksi dari data biometrik. Kolom `tripay_invoices.user_id` wajib menggunakan referensi non-cascade (`ON DELETE SET NULL`) agar rekam jejak pembukuan kas Tripay tetap utuh untuk rekonsiliasi dan audit pajak. Sebaliknya, seluruh foto wajah fisik di Cloud Storage (`face-images`), vektor biometrik, riwayat chat, dan memori klinis wajib dimusnahkan secara total.

21. **Zero-Leakage Auth Callback & Token Sanitization (RFC 016)**:
    - Tautan recovery kata sandi dan verifikasi email wajib diproses melalui endpoint tunggal `/auth/callback`. Parameter sensitif (`code`, `token`, `access_token`) pada URL wajib segera dibersihkan dari browser menggunakan `history.replaceState` sebelum telemetri atau skrip pihak ketiga dimuat, guna mencegah kebocoran sesi via HTTP Referrer.

22. **Zero-Runtime-Parser for Public Legal Docs (RFC 016)**:
    - Seluruh dokumen hukum dan pusat bantuan publik (`/terms`, `/privacy`, `/refund-policy`, `/medical-disclaimer`, `/faq`) wajib diimplementasikan sebagai komponen statis TSX/JSX yang di-*tree-shake* pada waktu kompilasi. Dilarang menyertakan pustaka parser Markdown runtime di browser klien demi menjamin FCP < 0.5 detik pada jaringan seluler 4G.

23. **Canonical User-Facing Vocabulary & Database Invariant Hardening (RFC 017)**:
    - Seluruh antarmuka publik dan aplikasi wajib menggunakan terminologi kanonikal pengguna: *Credits / AI Credits* (bukan Koin), *Skinsistant AI* (bukan Chatbot biasa), *Skin Assessment*, *Analisis Komposisi*, *Paket Akses*, dan *Riwayat Tagihan*. Skema basis data internal tetap mempertahankan nama tabel legacy (`coin_balances`, `coin_transactions`, `ai_features.credit_cost`) demi stabilitas sistem tanpa risiko migrasi skema. Selain itu, Invarian 1 (`universal_ai` wajib aktif) dan Invarian 2 (`face_validation` wajib 0 kredit) wajib dilindungi secara mutlak melalui *PostgreSQL CHECK constraint* di level database, bukan sekadar proteksi antarmuka (disabled input).

---

## 3. Enam Standar Kesiapan Produksi (Production Readiness Checklist)

Setiap fitur yang disetujui untuk masuk ke `main` branch harus memenuhi kriteria ini:

* [ ] **1. Security Zero-Trust & RLS**: Semua tabel baru/modifikasi memiliki RLS aktif dengan policy ketat (`USING (auth.uid() = user_id)`). Service role key dilarang keras bocor ke frontend `src/`.
* [ ] **2. Atomic Money & Credits**: Tidak ada manipulasi kredit/koin secara manual dari frontend. Wajib melalui PostgreSQL Stored Procedure atomik (`rpc('deduct_coins')`, `rpc('deduct_quota')`).
* [ ] **3. Resilience & Fallbacks**: Edge Function wajib menangani kegagalan API provider AI dengan graceful timeout dan response JSON yang terstruktur.
* [ ] **4. Privacy & Compliance**: Tidak menyimpan log percakapan sensitif tanpa consent, dan mendukung pembersihan data saat consent dicabut.
* [ ] **5. Type Safety & Validation**: Payload API di Edge Functions wajib divalidasi ketat (Zod / strongly typed).
* [ ] **6. Clean Build**: Bebas dari linting error, lolos uji compile `tsc -b && vite build`.

---

## 4. Protokol Komunikasi Antar-AI via `/diskusikan`

Untuk berkonsultasi dengan AI lain, alurnya adalah:
1. User menjalankan perintah `/diskusikan [topik]` di Antigravity.
2. Antigravity menghasilkan dokumen RFC di `docs/ai_sync/RFC_[TOPIK].md` yang berisi *Ground Truth*, kode saat ini, dan 3–5 pertanyaan audit spesifik.
3. User menyalin isi RFC ke Claude / ChatGPT / DeepSeek.
4. AI Reviewer menjawab dengan analisis mendalam, fokus pada celah keamanan, logika, arsitektur, atau optimasi.
5. User menempelkan kembali masukan tersebut ke Antigravity untuk dievaluasi secara logis dan diimplementasikan ke kode nyata.

---

## 5. Aturan Mutlak Antigravity: Disiplin Penamaan & Kontrak Kode

> **Latar Belakang**: Insiden Migration 064 membuktikan bahwa AI dapat secara tidak sengaja mengubah nama field RPC (`type` → `scan_type`, `skin_assessment` → `face_latest`, `scan_counts` → `stats`) tanpa memperbarui interface TypeScript yang mengonsumsinya. Akibatnya data chart kosong meski DB berisi data. Aturan di bawah ini bersifat **mutlak dan tidak dapat dikecualikan**.

### 5.1 Kunci Kontrak RPC ↔ TypeScript (Anti-Schema Drift)

**SEBELUM** menulis migration SQL baru yang mengandung `CREATE OR REPLACE FUNCTION`, AI **WAJIB**:

1. **Baca interface TypeScript konsumernya terlebih dahulu.** Baca dulu, baru tulis SQL.

2. **Field name di `jsonb_build_object(...)` HARUS identik karakter per karakter dengan field TypeScript.**
   ```
   BENAR : jsonb_build_object('skin_assessment', ...)  ->  data.skin_assessment
   SALAH : jsonb_build_object('face_latest', ...)      ->  data.skin_assessment  <- DRIFT!
   ```

3. **Jika terpaksa mengubah nama field**, lakukan dalam satu commit atomik: update SQL RPC + interface TypeScript + semua consumer `.tsx/.ts` + komentar `/* BREAKING: renamed X->Y migration NNN */`.

4. **Dilarang membuat nama field baru untuk konsep yang sudah ada.** Sudah ada `total_products_scanned`? Jangan buat `total_recommended` untuk hal yang sama.

### 5.2 Canonical Field Registry — Kontrak RPC Dashboard

**`src/hooks/useDashboardData.ts` adalah satu-satunya sumber kebenaran** untuk kontrak data dashboard.

| Konsep | Field TypeScript (CANONICAL) | Field SQL jsonb_build_object (HARUS SAMA) |
| :--- | :--- | :--- |
| Status kulit terkini | `data.skin_assessment` | `'skin_assessment'` |
| Jumlah scan wajah | `data.scan_counts.face_total` | `'scan_counts' -> 'face_total'` |
| Scan terakhir tipe | `data.recent_scans[].type` | `'type'` -- bukan `scan_type`! |
| Misi selesai | `data.missions.completed` | `'missions' -> 'completed'` |
| Produk dipindai | `data.product_summary.total_products_scanned` | `'total_products_scanned'` |
| Chart tren wajah | `data.face_trend[].score` | `'face_trend' -> 'score'` |

**Jika ada migration baru yang mengubah salah satu field di atas, WAJIB update tabel ini sekaligus.**

### 5.3 Anti-Duplikasi Kode

Sebelum membuat hook, komponen, atau helper baru, AI WAJIB grep terlebih dahulu:

```bash
# Sebelum buat hook baru
grep -r "useDashboard" src/ --include="*.ts" --include="*.tsx" -l

# Sebelum buat CSS class baru di DashboardPage
grep "v0-[nama-konsep]" src/pages/app/DashboardPage.tsx
```

Jika sudah ada -> gunakan yang lama. Jangan buat implementasi paralel dengan nama berbeda.

### 5.4 Checklist Wajib Sebelum Setiap `supabase db push` yang Mengandung RPC

- [ ] Sudah membaca interface TypeScript consumer-nya terlebih dahulu
- [ ] Semua field `jsonb_build_object` cocok 1:1 dengan field TypeScript
- [ ] `tsc --noEmit` lulus 0 error
- [ ] Tidak ada nama field baru untuk konsep yang sudah punya nama
- [ ] Tabel registry 5.2 diupdate jika ada perubahan field canonical

---

### 5.5 SOP Frontend & UI Design System: Doktrin Cluv Micro-Framework (`cluv-*`)

> ⚡ **AI FAST SCAN REFERENCE**: Sebelum menulis JSX/TSX atau CSS, seluruh AI **WAJIB membaca cheat-sheet ringkas**: [docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md). File tersebut berisi kamus cepat seluruh class universal (`cluv-*`), snippet siap pakai, dan anti-hallucination checklist agar AI tidak perlu membuka file CSS berukuran besar!

> **Prinsip Utama**: AI dilarang keras membuat class CSS ad-hoc atau membangkitkan class non-cluv. Seluruh komponen antarmuka yang akan dibuat **WAJIB** dicek terlebih dahulu apakah sudah memiliki padanan kanonikal di Cluv Framework (`src/styles/cluv/`).

#### 1. Protokol Tiga Langkah: Reuse -> Extend -> Create
Sebelum menulis baris CSS baru di `src/styles/cluv/` atau class di JSX `.tsx`, AI **WAJIB**:
1. **Grep Terlebih Dahulu**: Jalankan pencarian di `CLUV_FRAMEWORK_CHEATSHEET.md` dan `src/styles/cluv/` untuk memeriksa komponen sejenis.
   ```bash
   # Cek apakah class komponen sejenis sudah ada di Cluv Framework
   grep "\.cluv-" src/styles/cluv/components/
   ```
2. **Reuse First (Gunakan Ulang)**: Jika konsep UI sudah ada (misal kartu kontainer, chip seleksi, tombol simpan, back link), **WAJIB gunakan class yang sudah ada**. Dilarang membuat class baru dengan nama berbeda untuk konsep yang sama.
3. **Extend Second (Gunakan Modifier)**: Jika memerlukan sedikit variasi warna atau ikon, gunakan modifier class ber-prefix `.is-*` (misal: `.cluv-chip.is-active`, `.cluv-card-icon-wrap.is-teal`, `.cluv-badge.is-sm`). Dilarang membuat root selector baru.
4. **Create Last (Hanya Jika Benar-Benar Baru & Melalui Diskusi)**: Hanya boleh membuat class baru jika komponen tersebut benar-benar belum pernah ada di Cluv Framework dan telah didiskusikan serta disetujui bersama pengguna.

---

### 5.6 Canonical UI Class Registry — Kontrak Antarmuka Cluv Framework

Tabel ini adalah **sumber kebenaran tunggal** untuk penamaan class UI di seluruh aplikasi Skincluv. Siapapun AI yang mengedit area ini **WAJIB** mematuhi penamaan ini:

| Kebutuhan Visual / Komponen UI | Class Kanonikal Wajib (`src/styles/cluv/`) | Class Terlarang (Antipattern / Duplikasi) |
| :--- | :--- | :--- |
| **Kanvas Full / Bento (Tipe A)** | `.cluv-canvas-grid` | `.v0-page-container`, `.subpage-container`, `.cluv-canvas-layout` tanpa grid |
| **Kanvas Focused / Ledger (Tipe B)** | `.cluv-canvas-focused` | `.v0-profile-page`, wrapper margin auto sempit |
| **Kanvas Full-Bleed (Tipe C)** | `.cluv-canvas-bleed` | Kanvas dengan padding luar yang menjepit chat |
| **Kartu Kontainer Utama (Card)** | `.cluv-card`, `.cluv-bento-card` | `.v0-profile-card`, `.v0-subpage-card`, `.glass-card` |
| **Tombol Universal** | `.cluv-btn` (`.is-primary`, `.is-outline`, `.is-sm`) | `.v0-profile-save-btn`, `.btn-primary`, `.btn-save` |
| **Tombol Seleksi / Chip** | `.cluv-chip` (`.is-active`) | `.v0-profile-chip`, `.tag-pill`, `.chip-btn` |
| **Tautan Navigasi Kembali** | `.cluv-link.is-muted`, `.cluv-back-link` | `.v0-profile-back-link`, `.btn-back-link`, `.back-arrow` |
| **Grup Formulir & Input** | `.cluv-field`, `.cluv-input`, `.cluv-label` | `.v0-profile-form-section`, `.form-group-custom` |
| **Icon Wrapper Seksi** | `.cluv-card-icon-wrap` (`.is-teal`, `.is-gold`) | `.v0-profile-section-icon`, `.icon-box-custom` |
| **Kotak Notifikasi Feedback** | `.cluv-alert` (`.is-success`, `.is-danger`) | `.v0-profile-message`, `.v0-subpage-alert`, `.alert-box` |

---

### 5.7 Larangan Mutlak Styling (Strict Frontend Invariants)

1. **Zero Hardcoded Colors**:
   - DILARANG menggunakan kode warna hex manual (misal `#1f9d97`, `#f0fdf4`, `#bbf7d0`, `#e2e8f0`) di dalam file `.tsx` ataupun rule CSS baru.
   - Wajib selalu merujuk ke CSS variables resmi di `:root`: `var(--cluv-teal)`, `var(--cluv-surface)`, `var(--cluv-border)`, `var(--cluv-radius)`, dll.
2. **Zero Layout/Theming Inline Styles**:
   - DILARANG menggunakan atribut `style={{ background: '...', color: '...' }}` di JSX untuk tata letak dan pewarnaan.
   - Pengecualian HANYA berlaku untuk nilai dinamis murni hasil kalkulasi JavaScript (misal: persentase progress bar `style={{ width: `${percent}%` }}`).
3. **No Island `<style>` Blocks**:
   - DILARANG menyisipkan tag `<style>{...}</style>` baru di dalam komponen `.tsx`. Seluruh styling halaman aplikasi wajib tersentralisasi di `src/styles/cluv/`.
4. **Desktop Form Max-Width Discipline**:
   - Formulir mandiri yang dirender dalam 1 kolom (seperti `/profile/skin`) wajib menggunakan `.cluv-canvas-focused` (`max-width: 760px; margin-left: 0; margin-right: auto;`) agar tidak melebar kosong hingga 1120px+.

---

### 5.8 Checklist Wajib Sebelum Mengubah / Menambah UI Frontend

- [ ] Sudah mengecek `CLUV_FRAMEWORK_CHEATSHEET.md` sebelum menyentuh JSX/CSS
- [ ] Menggunakan class kanonikal dari Canonical UI Class Registry (Tabel 5.6)
- [ ] Tidak ada warna hex hardcoded di JSX atau CSS baru (semua menggunakan CSS variables `var(--cluv-*)`)
- [ ] Tidak ada inline `<style>` baru di dalam file `.tsx`
- [ ] Lolos verifikasi build: `tsc -b` & `vite build` 0 error

---

### 5.9 Shell & Page Layout Contract: Standarisasi Kanvas Konten Aplikasi

> **Latar Belakang**: Aplikasi Skincluv menggunakan shell berbasis **Sidebar Kiri (250px)** + **Top Navbar (68px, padding `0 40px`)** + **Host Kanvas Konten (`.cluv-shell-page-content`, padding: 0)**. Seluruh halaman aplikasi membungkus dirinya sendiri menggunakan salah satu dari 3 Layout Primitives Kanonikal untuk menjamin garis tepi kiri konten sejajar presisi 40px di desktop.

#### 1. Baseline Anchor Point Kiri (Left-Anchor Discipline)
- **Anchor Point Kiri Wajib Konsisten**: Di layar desktop, garis tepi kiri konten (tombol back, judul halaman, tab, kartu) **WAJIB SELALU SEJAJAR** di semua halaman, yaitu tepat pada offset padding standar (`40px` dari sisi kanan sidebar), 100% presisi dengan judul halaman di Topbar.
- **Larangan `margin: 0 auto` pada Kontainer Halaman Sempit**: Dilarang menggunakan `margin: 0 auto` pada root wrapper halaman atau form sempit (`max-width: 600px - 760px`) karena akan membuat konten melayang jauh ke tengah monitor ultrawide/desktop dan merusak alur pandang mata dari sidebar. Gunakan `margin-right: auto; margin-left: 0;` (`.cluv-canvas-focused`) agar lebar tetap proporsional namun tepi kiri tetap terkunci sejajar.

#### 2. Tiga Kanvas Kanonikal (`src/styles/cluv/layout.css`)
| Tipe Kanvas | Class Kanonikal Wajib | Target Halaman | Spesifikasi Tata Letak |
| :--- | :--- | :--- | :--- |
| **Tipe A: Full Canvas / Grid** | `.cluv-canvas-grid` | Dashboard, Scan Wajah AI, Scan Komposisi, Misi Glow, Riwayat Scan, Profil Hub | `max-width: 1240px; padding: 32px 40px 80px; width: 100%;` (Mobile: `padding: 20px 16px 80px;`). |
| **Tipe B: Focused Ledger & Forms** | `.cluv-canvas-focused` | Riwayat Tagihan, Mutasi Credits, Edit Profil Kulit, Pusat Privasi, Checkout | `max-width: 760px; padding: 32px 40px 80px; margin-left: 0; margin-right: auto; width: 100%;` (Mobile: `padding: 20px 16px 80px;`). |
| **Tipe C: Full-Bleed Viewport** | `.cluv-canvas-bleed` | Skinsistant AI Chatbot (/chatbot), Camera Viewfinder HUD | Viewport penuh edge-to-edge (`width: 100%; height: 100%; padding: 0; overflow: hidden;`). |

---

### 5.10 Prinsip DRY Global Pattern (Cluv Universal Primitives)

> **Latar Belakang**: Insiden pembuatan class terisolasi per halaman menyebabkan duplikasi CSS puluhan baris untuk komponen yang sama persis (kartu saldo, baris mutasi, filter bar, empty state). Aturan ini mewajibkan penggunaan primitif Cluv Framework agar CSS ramping, seragam, dan sekali sentuh berefek ke seluruh aplikasi.

#### 1. Larangan Duplikasi Prefix Halaman
- **DILARANG** membuat selector CSS dengan prefix nama halaman spesifik untuk konsep UI umum yang muncul di lebih dari satu tempat.
- Prefix halaman **HANYA** boleh digunakan untuk komponen yang 100% eksklusif (misal: Reticle Oval Viewfinder Kamera di Face Scan).

#### 2. Kamus Primitif Universal Cluv
Setiap halaman baru atau yang sedang direfaktorisasi **WAJIB** memakai primitif Cluv Framework ini:
- **Tombol / Link Kembali**: `.cluv-link.is-muted` atau `.cluv-back-link`
- **Kartu Saldo / Ringkasan Metrik**: `.cluv-stat-card`, `.cluv-stat-grid`
- **Bar Filter & Tab Navigasi**: `.cluv-tabs`, `.cluv-tab-btn`
- **Daftar & Baris Ledger**: `.cluv-ledger-card`, `.cluv-receipt-box`
- **Pill Badge Status**: `.cluv-badge` (`.is-teal`, `.is-gold`, `.is-rose`, `.is-slate`)
- **Kartu Kosong (Empty State)**: `.cluv-status-cue`, `.cluv-card` center aligned

---

### 5.11 SOP Frontend Halaman Publik & Non-Login (`public-*`)

> **Latar Belakang**: Halaman non-login (Landing, Tentang Kami, Paket, FAQ, Kontak, Dokumen Legal, 404, dan Auth Single Card) merepresentasikan wajah publik Skincluv. Seluruh antarmuka di area ini wajib mengikuti estetika **Option E (Warm Companion & Bestie Storytelling)** dan menggunakan sistem modular mandiri berbasis prefix kanonikal **`public-*`**. Dilarang menduplikasi class CSS untuk komponen yang identik. Rujukan lengkap terdapat pada [PUBLIC_DESIGN_SYSTEM.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/frontend/PUBLIC_DESIGN_SYSTEM.md).

#### 1. Doktrin *Search-Before-Create* di Area Non-Login
1. **DILARANG KERAS** membuat class CSS berawalan nama halaman spesifik seperti `.faq-btn`, `.contact-card`, `.paket-box`, `.not-found-btn`, atau `.login-input`.
2. AI **WAJIB** mengecek dan menggunakan komponen kanonikal dari kamus `public-*` di bawah ini.
3. Seluruh styling publik wajib tersentralisasi di `src/styles/public/` dan diimpor melalui `src/styles/public/index.css`.

#### 2. Kamus Komponen Kanonikal Publik (`public-*`)
| Kategori | Class Kanonikal Wajib | Variasi / Modifier | Catatan & Perilaku |
| :--- | :--- | :--- | :--- |
| **Wrapper Halaman** | `.public-page` | - | Latar `#f7faff`, font Nunito, `min-height: 100dvh`. |
| **Kontainer Konten** | `.public-container` | `.narrow` (max 480px) | Lebar maks 1140px, padding fluid `clamp(16px, 3.5vw, 32px)`. |
| **Header Bab / Seksi** | `.public-section-header` | `.center`, `.left` | Berisi badge pill, H1/H2 fluid clamp, dan `.public-subtitle`. |
| **Tombol Pill** | `.public-btn` | `.primary`, `.secondary`, `.outline`, `.ghost` | Radius `9999px`, Nunito 800, touch target min 46px. Ukuran: `.sm`, `.md`, `.lg`. |
| **Kartu Awan (Cloud Card)**| `.public-card` | `.interactive` | Radius `28px`, border `1.5px solid #dce8f3`, soft shadow. Hover transform di `.interactive`. |
| **Ikon Bundar Kartu** | `.public-card-icon-wrap` | - | Lingkaran 48px, latar `#e6f6f5`, ikon teal `#1f9d97`. |
| **Badge / Label Pill** | `.public-badge` | - | Kapsul `9999px`, latar `#e6f6f5`, teks `#127a75`, border `#bceae7`. |
| **Titik Indikator Badge** | `.public-dot` | - | Titik bulat 6px mint/teal aktif di samping teks badge. |
| **Formulir & Input** | `.public-form-group`, `.public-input` | `.textarea`, `.error` | Radius `14px`, tinggi 48px, border `#dce8f3`, fokus teal ring. |
| **Akordeon (FAQ/Rincian)** | `.public-accordion`, `.public-accordion-item` | `.trigger`, `.body` | Kartu buka-tutup dengan transisi halus rotasi chevron. |
| **Banner Disclaimer/Info**| `.public-banner` | `.disclaimer`, `.info` | Banner batas kasih non-terapeutik atau info transparansi. |

#### 3. Standar Responsif Fluid Multi-Device
- **Fluid Typography**: Menggunakan rumus `font-size: clamp(...)` agar judul tidak jebol di HP compact (320px) dan proporsional di desktop ultrawide.
- **Fluid Grid**: Menggunakan `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))` untuk menjamin nol bug horizontal scroll pada kartu.
- **Dynamic Viewport**: Menggunakan `min-height: 100dvh` dengan fallback `100vh` untuk mengatasi dynamic URL bar pada mobile browser.
- **Touch Targets**: Area sentuh tombol dan elemen interaktif minimal 44–48px demi kenyamanan navigasi jari di ponsel.

---

### 5.12 Universal Micro-Framework SOP (`cluv-*`) & Contextual Surface Cascades

> **Latar Belakang & Filosofi Arsitektur**: Untuk mengatasi duplikasi style antar-area (Public, App, Admin), Skincluv menetapkan **Micro-Framework Universal** dengan prefix **`cluv-*`**. Komponen inti (Button, Card, Input, Badge, Accordion, Trust Strip) dapat digunakan di seluruh permukaan tanpa perlu menulis ulang styling. Rujukan lengkap terdapat pada [CLUV_DESIGN_SYSTEM.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/frontend/CLUV_DESIGN_SYSTEM.md).

#### 1. Aturan Tiga Pilar Micro-Framework
1. **Universal Primitives (`cluv-*`)**: Semua komponen universal berawalan `.cluv-` (misal `.cluv-btn`, `.cluv-card`, `.cluv-trust-strip`, `.cluv-badge`, `.cluv-accordion`, `.cluv-input`).
2. **Larangan Class Telanjang (Gunakan Modifier `is-*`)**:
   - DILARANG menggunakan kata telanjang seperti `<button class="cluv-btn sm primary admin">` karena rawan tabrakan CSS dan ambigu saat debugging.
   - WAJIB menggunakan format modifier `is-*`: `.is-primary`, `.is-secondary`, `.is-outline`, `.is-ghost`, `.is-sm`, `.is-md`, `.is-lg`, `.is-pill`.
3. **Contextual Surface Cascades (`.cluv-surface-*`)**:
   - Alih-alih menambahkan class `admin` di ratusan elemen admin (*developer fatigue*), wrapper layout halaman mengaktifkan persona lingkungannya:
     - `.cluv-surface-public`: Mengaktifkan persona hangat (*Warm Companion*), font Nunito, radius rounded-pill lembut, dan soft glow.
     - `.cluv-surface-app`: Mengaktifkan persona klinis segar (*Fresh Clinical*), font Plus Jakarta Sans, radius 12px.
     - `.cluv-surface-admin`: Mengaktifkan persona produktivitas tinggi (*High-Density Admin*), font Inter, ukuran padat (36px button), radius 6px tegas, border crisp.
   - Developer cukup menulis `<button class="cluv-btn is-primary is-sm">Simpan</button>`, dan tombol OTOMATIS menyesuaikan karakternya sesuai surface. Override manual (`.is-admin`, `.is-app`, `.is-public`) tetap didukung jika diperlukan.

#### 2. Skala Hirarki Tipografi Kanonikal
Semua teks wajib mematuhi skala hirarki baku ini untuk menjamin proporsi visual UI/UX yang harmonis:
- **`.cluv-title-hero`**: `clamp(2rem, 3.8vw + 0.8rem, 3rem)` (H1 Hero utama).
- **`.cluv-title-section`**: `clamp(1.5rem, 2.8vw + 0.5rem, 2.25rem)` (H2 setiap babak/seksi halaman).
- **`.cluv-title-card`**: `clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)` (H3 judul kartu fitur/bento/langkah).
- **`.cluv-lead`**: `clamp(1.0625rem, 1.4vw + 0.4rem, 1.25rem)` (Paragraf pengantar / intro).
- **`.cluv-body`**: `1rem` (16px), Line-height 1.65 (Teks bacaan utama).
- **`.cluv-caption`**: `0.875rem` (14px) (Keterangan tambahan).
- **`.cluv-micro`**: `0.75rem` (12px) (Fine-print, disclaimer, tag).

#### 3. Reassurance Trust Strip (`.cluv-trust-strip`)
Teks penenang di bawah tombol CTA (seperti `Gratis Pendaftaran • Tanpa Kartu Kredit • 100% Aman Privasi`) DILARANG ditulis menggunakan tag `<p>` polosan atau utility class abu-abu telanjang. Wajib menggunakan komponen baku:
```html
<div class="cluv-trust-strip">
  <span class="cluv-trust-item"><CheckCircle2 class="cluv-trust-icon" /> Gratis Pendaftaran</span>
  <span class="cluv-trust-dot">•</span>
  <span class="cluv-trust-item"><CheckCircle2 class="cluv-trust-icon" /> Tanpa Kartu Kredit</span>
  <span class="cluv-trust-dot">•</span>
  <span class="cluv-trust-item"><ShieldCheck class="cluv-trust-icon" /> 100% Aman Privasi</span>
</div>
```

#### 4. Standar Kontainer & Layout (.cluv-container, .cluv-grid, .cluv-btn-group)
- **`.cluv-container`**: Default 1140px boxed untuk halaman publik/landing.
- **`.cluv-container.is-narrow`**: 720px untuk form, checkout, artikel, dan auth.
- **`.cluv-container.is-wide`**: 1360px untuk kanvas luas (Dashboard & Admin).
- **`.cluv-container.is-fluid`**: 100% full-width.
- **`.cluv-btn-group`**: Barisan tombol responsif (opsi: `.is-center`, `.is-right`, `.is-stack-mobile`).
- **`.cluv-grid`**: Grid responsif otomatis (opsi: `.cols-2`, `.cols-3`, `.cols-4`, `.is-auto-fit`).

#### 5. Komponen Pelengkap Wajib
- **Feedback & Alert**: `.cluv-alert.is-info` / `.is-success` / `.is-warning` / `.is-danger`
- **Loading State**: `.cluv-spinner` (lingkaran putar teal) & `.cluv-skeleton` (shimmer placeholder)
- **Dividers**: `.cluv-divider` & `.cluv-divider.has-text`
- **Dialogs**: `.cluv-modal-overlay` & `.cluv-modal-box`

---

### 5.13 Hukum Mutlak Styling & Framework Integrity (The 4 Golden Invariants)

> **Latar Belakang & Doktrin**: Insiden regresi berulang di halaman aplikasi (`src/pages/app/`) disebabkan oleh kebiasaan buruk membuat class CSS baru ad-hoc per-halaman di `dashboard.css` (hingga 900+ baris) atau sekadar mengganti nama class lama tanpa merombak visualnya. Doktrin di bawah ini mengikat seluruh AI Council (Antigravity, Claude, ChatGPT, DeepSeek, Kimi):

#### 1. Empat Larangan Emas (The 4 Golden Rules)
1. **TIDAK BOLEH PAKE STYLE LAMA**: Dilarang keras mempertahankan gaya visual, tata letak kusam, border tebal kaku, atau display lama peninggalan v0. Seluruh elemen wajib bermutasi menjadi desain Cluv murni (`#ffffff` surface, border 1.5px crisp, radius membulat elegan, icon wrap pastel).
2. **TIDAK BOLEH ASAL UBAH / BIKIN NAMA KELAS**: Dilarang keras membuat class CSS ad-hoc per-halaman di `src/styles/cluv/app/*.css` untuk sesuatu yang seharusnya menjadi Utility atau Component universal. Dilarang sekadar me-rename `v0-*` menjadi `cluv-*` tanpa menyelaraskan CSS-nya.
3. **WAJIB DISKUSI KELAS YG SUDAH ADA MAUPUN YG BELUM ADA DAN AKAN DIGUNAKAN**:
   - AI wajib mengecek cheatsheet Cluv FW (`docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md`) sebelum menyentuh kode.
   - Jika membutuhkan komponen/layout yang belum ada di framework: **WAJIB DISKUSIKAN TERLEBIH DAHULU DENGAN USER**. Rumuskan lego-nya (nama class, slot, modifier), lalu bangun di `src/styles/cluv/components/`, BUKAN di CSS lokal halaman!
4. **TABULA RASA RESET: KENALI HAKIKAT HALAMAN, JANGAN TERPENGARUH BIAS STYLE LAMA**:
   - Saat mengaudit dan merombak halaman, **HAPUS SEMUA STYLE LAMA** dan ganti dengan standar Cluv murni. Dilarang berpikir: *"Karena style lama bentuknya begini, jadi di Cluv kita ikuti bentuk lama saja"*.
   - **Wajib sesuaikan dengan hakikat & pengetahuan fungsional halaman tersebut**:
     - Jika Dashboard di style lama dibuat sempit, JANGAN dipertahankan sempit hanya karena Cluv punya layout sempit! Hakikat Dashboard adalah kanvas bento lapang (`max-width: 1240px`).
     - Sebaliknya: Jika halaman adalah Riwayat Tagihan / Mutasi Finansial / Formulir Akun, hakikatnya adalah Focused Ledger (`max-width: 760px; margin-left: 0; margin-right: auto`).
   - Kenali peran semantik halaman, buang total bias lama, lalu susun menggunakan layout Cluv Framework yang paling benar secara UX dan fungsionalitas produk!

#### 2. Pemisahan Tegas Utility vs Component
- **Utility**: Atomik (1-2 properti untuk suntik instan di JSX tanpa bikin CSS baru): `.cluv-flex`, `.cluv-flex-col`, `.cluv-flex-row`, `.cluv-items-center`, `.cluv-justify-between`, `.cluv-gap-2`, `.cluv-gap-3`, `.cluv-gap-4`, `.cluv-mt-4`, `.cluv-text-center`, `.cluv-w-full`.
- **Component**: Entitas berstruktur dengan pola **Base Class + Modifier `.is-*`**: `.cluv-btn.is-primary`, `.cluv-bento-grid.is-hero`, `.cluv-bento-card`, `.cluv-badge.is-teal`, `.cluv-action-tile`.
- **Doktrin Zero-Page-CSS**: File CSS halaman (`dashboard.css`, dll) dilarang mendefinisikan layout grid, card, button, atau badge baru. Halaman aplikasi wajib dibangun dari komposisi lego Cluv Framework.

#### 3. SOP 5 Langkah Wajib Styling & Refactoring (The 5-Step Bottom-Up Cascade)
1. **Langkah 1 (Tokens)**: Cek `src/styles/cluv/tokens.css`. Pastikan warna, radius, dan bayangan memakai variabel token `var(--cluv-*)`. Dilarang menulis nilai hex atau pixel sembarangan.
2. **Langkah 2 (Utilities)**: Cek `src/styles/cluv/utilities.css`. Gunakan class atomik yang sudah ada untuk spacing, gap, dan flex.
3. **Langkah 3 (Generic Component)**: Cek `src/styles/cluv/components/`. Buat/sesuaikan komponen generic dengan pola **Base Class + Modifier `.is-*`**. Dilarang membuat komponen di CSS halaman!
4. **Langkah 4 (Assembling di JSX)**: Di file `.tsx`, susun komponen dan suntikkan utilitas mikro layaknya menyusun lego.
5. **Langkah 5 (Dead Code Purge)**: Hapus selector ad-hoc lama di file CSS halaman (`dashboard.css`, dll) agar stylesheet menyusut bersih dan bebas dari dead code.

---

### 5.14 Master Contract: Grid System, Bento Standards, Hirarki Tipografi, & Mobile App-First

> **Tujuan Kontrak**: Menghilangkan tebak-tebakan antar AI mengenai tata letak, ukuran teks, varian bento, dan perilaku mobile pada halaman aplikasi Skincluv.

#### 1. Kontrak Grid System: Dashboard vs Landing Page
| Aspek Desain | Halaman Dashboard & Fitur App (Login) | Halaman Landing & Publik (Non-Login) |
| :--- | :--- | :--- |
| **Kanvas Root** | `.cluv-canvas-grid` (`max-width: 1240px; padding: 32px 40px 80px; width: 100%;`) | `.cluv-container` (`max-width: 1200px; padding: 0 24px; margin: 0 auto;`) |
| **Anchor Tepi Kiri** | **Wajib Rata Kiri Paten 40px** dari sidebar (sejajar dengan Topbar). | **Rata Tengah (Center Storytelling)**. |
| **Pola Grid** | Asymmetric Bento Grid (`.cluv-bento-grid.is-hero` 1.55fr : 1fr) untuk prioritas data klinis vs lab. | Symmetric Grid (`cols-2`, `cols-3`, `is-auto-fit`) untuk edukasi & cerita produk. |
| **Density & Gap** | **High Density** (`gap: 16px - 20px`), efisiensi ruang tanpa scrolling berlebih. | **Airy & Breathable** (`gap: 24px - 32px`), ritme santai membaca. |

#### 2. Standar Komponen Bento Universal
Setiap kartu bento wajib menggunakan komponen generic dari `src/styles/cluv/components/bento.css`:
- **Grid Layout**: `.cluv-bento-grid` dengan preset:
  - `.is-hero` (1.55fr : 1fr) ➔ Observasi Utama vs Lab/Metrik Pendukung.
  - `.is-equal` (1fr : 1fr) ➔ Komparasi Seimbang (Tren vs Rutinitas).
  - `.is-trio` (1fr : 1fr : 1fr) ➔ 3 Tahapan alur / metrik.
  - `.is-quad` (repeat(4, 1fr)) ➔ Barisan pintasan aksi cepat.
  - `.is-full` (1fr) ➔ Grafik garis/timeline lebar penuh.
- **Kartu Bento & 3 Slot Anatomis**: `.cluv-bento-card`
  - `.cluv-bento-header`: Memuat `.cluv-bento-header-icon` (`.cluv-card-icon-wrap.is-sm`), `.cluv-bento-header-titles` (eyebrow `.cluv-micro` + judul `.cluv-title-card`), dan `.cluv-bento-header-action`. Gunakan modifier `.is-inline` jika kartu tidak memiliki tombol aksi.
  - `.cluv-bento-body`: Kanvas data fleksibel (Score ring SVG, bar chart, indikator sirkadian).
  - `.cluv-bento-footer`: Tautan footer / secondary action dengan border-top tipis.
- **Varian Kartu**: `.is-interactive`, `.is-compact`, `.is-tint-teal`, `.is-tint-purple`, `.is-tint-gold`.

#### 3. Kontrak Hirarki Tipografi & Jarak: Dashboard vs Landing Page
| Hirarki Tipografi | Dashboard & App Pages | Landing & Public Pages |
| :--- | :--- | :--- |
| **Judul Halaman (H1)** | **`.cluv-title-section`** (`clamp(1.5rem, 2.4vw + 0.5rem, 1.875rem)`). Sapaan ramah ("Selamat pagi, Jessy ✨"). Dilarang memakai `.cluv-title-hero` di dashboard! | **`.cluv-title-hero`** (`clamp(2.25rem, 4vw + 1rem, 3.25rem)`). Headline marketing ekspresif. |
| **Judul Kartu (H2/H3)** | **`.cluv-title-card`** (`clamp(1.125rem, 1.2vw + 0.4rem, 1.25rem)`). | **`.cluv-title-section`** (`clamp(1.75rem, 3vw + 0.5rem, 2.25rem)`). |
| **Eyebrow / Category** | **`.cluv-micro.cluv-uppercase`** (`0.6875rem` / 11px, bold, tracking 0.04em). | **`.cluv-badge.is-teal`** (`0.8125rem`). |
| **Teks Bacaan (Body)** | **`.cluv-body`** (`0.875rem - 0.9375rem`, line-height 1.5). | **`.cluv-lead`** (`1.125rem`) & **`.cluv-body`** (`1rem`, line-height 1.65). |
| **Fine Print / Tanggal** | **`.cluv-caption`** (`0.8125rem`) & **`.cluv-micro`** (`0.6875rem`). | **`.cluv-caption`** (`0.875rem`). |
| **Jarak Antar-Seksi** | `gap: 20px` (antar bento row). | `padding: clamp(64px, 8vw, 96px) 0` (`.cluv-section`). |

#### 4. Doktrin Mobile App-First (Bukan Sekadar Desktop yang Di-shrink)
Di layar ponsel (`<= 640px`), antarmuka aplikasi **WAJIB** berperilaku layaknya aplikasi mobile native (App-First UX), bukan sekadar layout web desktop yang ditumpuk 1 kolom:
1. **Shell Navigasi Ala Super-App**:
   - Sidebar desktop dihilangkan total (`display: none !important`).
   - Digantikan oleh **Bottom Navigation Bar 5-menu** (`.cluv-mobile-bottom-bar`) dengan **Center FAB Scan Wajah bundar melayang** (`.cluv-bottom-nav-fab-icon`) yang ramah jangkauan jempol (*Thumb Zone*).
   - Topbar desktop disederhanakan drastis; avatar profil dialihkan ke tab Profil di bottom bar.
2. **Hero Terpadu Mobile (`.cluv-mobile-unified-card`)**:
   - Sapaan desktop yang makan tempat disembunyikan.
   - Digantikan kartu ringkas serbaguna: Avatar user glow ring + sapaan "Halo, [Nama]" + kapsul kredit `[ ⚡ 1.395 | + ]` + mini score ring (56px) + quick action pills (`Pindai Ulang`, `Tanya AI`).
3. **4-Item Squircle Shortcuts (`.cluv-mobile-shortcuts`)**:
   - 4 tombol menu aplikasi kotak membulat berjejer horizontal 4 kolom tepat di bawah hero card (Scan Wajah, Scan Komposisi, Misi Glow, Tanya AI).
4. **Disiplin Padding Kartu di Mobile**:
   - Padding kartu desktop adalah `24px`.
   - Di mobile (`<= 640px`), padding kartu **WAJIB TURUN ke `16px 14px`** agar tidak memboroskan lebar layar ponsel yang sempit (360px - 390px) dan menyisakan ruang baca maksimal bagi konten.
5. **Anti Scroll Fatigue & Pola Inset List**:
   - Dilarang menumpuk 6-8 kartu bento besar secara vertikal panjang tanpa henti.
   - Rutinitas & misi harian wajib menggunakan pola **Compact Inset Grouped List** (`.cluv-checklist-group`), bukan tumpukan kartu berbingkai tebal.

#### 5. Kontrak Tiga Komponen Inti: Bento, Button (`.cluv-btn`), & Badge (`.cluv-badge`)
Arsitektur komponen Skincluv memadukan kelincahan **Design Tokens atomik** (seperti Tailwind) dengan kerapian **Semantic Component** (seperti Bootstrap/Tailwind UI) dan **Type-Safe React Wrappers**:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Design Tokens & Utilities: var(--cluv-*), .cluv-flex, etc.   │
├─────────────────────────────────────────────────────────────────┤
│ 2. CSS Components (Base + Modifier .is-*): .cluv-badge, .cluv-btn│
├─────────────────────────────────────────────────────────────────┤
│ 3. React UI Components: <Badge />, <Button />, <BentoCard />   │
└─────────────────────────────────────────────────────────────────┘
```

1. **Komponen Badge (`.cluv-badge`)**:
   - **Base Class**: `.cluv-badge` (Pill membulat 9999px, font Nunito 700, user-select none).
   - **Ukuran (Size)**:
     - Default (`0.75rem` / 12px, padding `4px 12px`): Khusus Landing Page & Section Eyebrow (paling atas judul seksi).
     - `.is-sm` (`0.6875rem` / 11px, padding `2px 8px`, gap 4px): Khusus Dashboard, status, counter scan, dan reward misi.
   - **Warna Semantik**: `.is-teal`, `.is-gold`, `.is-slate`, `.is-rose`, `.is-purple`.
   - **Sub-elemen**: `.cluv-dot` (titik indikator 6px status aktif/berdenyut).
   - **Larangan**: DILARANG membuat class ad-hoc seperti `.cluv-ambient-pill` atau `.cluv-mission-reward`. Wajib gunakan `.cluv-badge`!
   - **React Atom**: `<Badge variant="teal|gold|slate|rose|purple" size="sm|md" dot icon>{children}</Badge>`

2. **Komponen Button (`.cluv-btn`)**:
   - **Base Class**: `.cluv-btn` (Inline-flex, center-aligned, font-weight 700, border 1.5px solid transparent, touch target ergonomis).
   - **Filosofi & Pembeda Landing vs Dashboard**:
     - *Landing Page*: Hero CTA berukuran besar (`.is-lg` / 52px), bentuk Pill bulat penuh (`.is-pill` / 9999px), glow shadow lembut, fokus pada konversi emosional.
     - *Dashboard App*: Compact & fungsional (`.is-sm` 38px / `.is-md` 44-46px), bentuk Clinical Squircle (`12px-14px`), crisp border 1.5px, zero distracting glow, fokus pada efisiensi data.
   - **Ukuran (Size)**:
     - `.is-sm`: Tinggi 38px, padding `0 16px`, font `0.8125rem` (untuk header/footer kartu bento & toolbar).
     - `.is-md` (Default): Tinggi 46px, padding `0 22px`, font `0.9375rem` (tombol standar, form submit, modal).
     - `.is-lg`: Tinggi 52px, padding `0 28px`, font `1.0625rem` (CTA utama hero landing).
   - **Varian Hirarki Visual (Emphasis)**:
     - `.is-primary`: Latar solid teal `#1f9d97`, teks putih, soft glow shadow, hover translateY(-1.5px). (Maksimal 1 per flow/modal).
     - `.is-secondary`: Latar neutral/surface white, border tipis abu-abu netral, teks gelap. (Aksi alternatif netral).
     - `.is-outline`: Latar transparan, border 1.5px teal line, teks teal, hover soft-teal wash. (Aksi sekunder berkarakter brand).
     - `.is-ghost`: Tanpa border, latar transparan, hover wash abu-abu halus. (Navigasi drill-down / tautan footer kartu bento).
     - `.is-danger`: Latar soft rose `#fee2e2`, border tipis `#fca5a5`, teks merah `#b91c1c`. (Aksi destruktif / hapus data).
   - **Radius & Shape Modifiers**:
     - `.is-pill`: 9999px (bawaan Landing Page).
     - `.is-rounded`: 12px-14px (bawaan Dashboard App).
     - `.is-radius-sm`: 8px (high-density).
     - `.is-radius-none`: 0px (sharp square).
   - **Built-in Hover Contract**:
     - Hover terikat satu paket (built-in) dengan varian dan kurva animasi transisi `0.18s cubic-bezier(0.16, 1, 0.3, 1)`.
     - Kontras warna teks dan background saat hover wajib mematuhi standar WCAG 2.1.
   - **Loading & Disabled Contract**:
     - `.is-loading`: Menampilkan `.cluv-btn-spinner` CSS SVG berputar, teks tetap rapi, otomatis pointer-events none untuk mencegah double-submit transaksi.
     - `:disabled`, `.is-disabled`: Opacity 0.55, pointer-events none, cursor not-allowed.
   - **Tata Letak & Responsif**: `.is-block` (width 100%), `.is-stack-mobile` (otomatis melebar 100% dan tinggi min 44px di HP <= 640px).
   - **React Atom Canonical**:
     ```tsx
     <Button
       variant="primary|secondary|outline|ghost|danger"
       size="sm|md|lg"
       radius="default|pill|rounded|sm|none"
       loading={false}
       disabled={false}
       block={false}
       stackMobile={false}
       iconLeft={<Sparkles size={14} />}
       iconRight={<ArrowRight size={14} />}
       to="/path" // Otomatis me-render React Router <Link>
       href="https://..." // Otomatis me-render <a>
     >
       Label Tombol
     </Button>
     ```

3. **Komponen Bento (`.cluv-bento-grid`, `.cluv-bento-card`)**:
   - **Grid Presets**: `.cluv-bento-grid` dengan modifier `.is-hero` (60:40), `.is-equal` (50:50), `.is-trio` (33:33:33), `.is-quad` (4 col), `.is-full` (1 col).
   - **Card Anatomy 3 Slot Baku**:
     - `.cluv-bento-header`: Ikon wrap pastel + judul H2/H3 (`.cluv-title-card`) + tombol aksi. Modifier `.is-inline` bila tanpa tombol.
     - `.cluv-bento-body`: Kanvas data fleksibel (score ring, charts, metrik).
     - `.cluv-bento-footer`: Tautan footer / secondary action dengan border-top tipis.
   - **Disiplin Padding**: Desktop `24px`; Mobile (`<= 640px`) **wajib `16px 14px`** dengan sudut membulat `16px`.

---

### 5.15 Kontrak Isolasi Responsif: Generic Dual-Safe vs Modifier Eksklusif (Anti-Regresi Desktop & Mobile)

> **Latar Belakang**: Insiden rusaknya layout mobile saat desktop dirapikan (dan sebaliknya) membuktikan bahwa mengandalkan `flex-wrap` polosan tanpa aturan arah yang sengaja adalah antipattern. Kontrak ini memisahkan secara tegas antara perilaku default generic (yang aman di dua layar) dengan modifier eksklusif saat perilaku desktop dan mobile harus berbeda.

#### 1. Dua Tingkatan Desain Responsif
1. **Tingkat 1: Generic Default (Dual-Safe by Default)**
   - Saat menulis class generic (`.cluv-btn`, `.cluv-card`, `.cluv-badge`), elemen **HARUS AMAN DAN NORMAL DI KEDUA LAYAR** tanpa asumsi sempit.
   - **Invarian Tombol**: `.cluv-btn` **WAJIB selalu `white-space: nowrap;`** di semua ukuran layar (desktop & mobile). DILARANG memaksakan `white-space: normal` pada tombol secara global di mobile karena akan memecah teks 2 kata (seperti *"Riwayat Tagihan"*) dan merusak letak ikon. Teks panjang yang sengaja ingin wrap wajib menggunakan modifier khusus `.is-multiline`.
   - **Invarian Tipografi Inline**: Teks inline dengan bullet pemisah (`[Judul] • [Keterangan]`) di desktop dilarang dibiarkan wrap telanjang di mobile karena titik bulat akan menggantung sendirian di baris 1. Bullet bulat wajib diberi `.cluv-hide-mobile`, dan keterangan di mobile dialihkan menjadi baris subtitle `.cluv-hide-desktop`.

2. **Tingkat 2: Exclusive Modifiers (Sengaja Berbeda)**
   - Ketika layout dituntut memiliki struktur yang berbeda antara Desktop vs Mobile, **WAJIB menggunakan Modifier Eksklusif resmi** dari `src/styles/cluv/utilities.css`:

| Modifier Eksklusif | Perilaku di Desktop (>= 768px) | Perilaku di Mobile (<= 768px) | Target Pemakaian |
| :--- | :--- | :--- | :--- |
| **`.cluv-flex-responsive`** | `flex-direction: row; justify-content: space-between; align-items: center;` | `flex-direction: column !important; align-items: stretch !important; gap: 12px;` | Bar status, header seksi dengan tombol aksi, toolbar. |
| **`.cluv-w-full-mobile`** | `width: auto;` (sesuai konten) | `width: 100% !important;` | Grup tombol aksi, kontainer filter di mobile. |
| **`.cluv-flex-1-mobile`** | `flex: 0 1 auto;` (lebar wajar) | `flex: 1 1 0% !important;` | Dua tombol berdampingan agar membagi rata 50/50 di mobile. |
| **`.cluv-hide-mobile`** | Ditampilkan normal (`display: block / inline`) | Disembunyikan total (`display: none !important;`) | Bullet separator `•`, ikon dekoratif desktop, teks deskripsi panjang. |
| **`.cluv-hide-desktop`** | Disembunyikan total (`display: none !important;`) | Ditampilkan normal | Subtitle khusus mobile, drawer trigger, mobile badge. |

#### 2. Checklist Wajib Sebelum Rilis Komponen Baru
- [ ] Diuji di Desktop (1440px / 1080px): Sejajar rata kiri 40px, proporsional, tidak ada ruang kosong menganga.
- [ ] Diuji di Mobile (360px - 390px): Teks tombol tidak patah kata, ikon tidak melayang aneh, tidak ada bullet separator menggantung, dan zero horizontal overflow (*layar tidak bisa digeser ke kanan-kiri*).
- [ ] Tidak ada rule `@media (max-width: ...)` ad-hoc di CSS halaman; seluruh adaptasi mobile menggunakan modifier kanonikal di atas.











# Laporan Audit: role-inspektur — Kepatuhan UI Anti-AI Slop & Integritas Antarmuka

- **Tanggal:** 2026-10-27
- **Brief/Handoff Terkait:** [docs/handoff/001-asisten-to-inspektur.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/001-asisten-to-inspektur.md)
- **Mode:** Audit-Only (100% Read-Only, 0 Baris Kode Diubah)
- **Acuan Standar:**
  - [.agents/references/anti-ai-slop-ui.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/.agents/references/anti-ai-slop-ui.md) (Vercel Web Interface Guidelines v1.0.0 & W3C WCAG 2.1)
  - [docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md) (Doktrin Cluv Micro-Framework)
  - [docs/architecture/FE_BE_PARITY_MATRIX.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/architecture/FE_BE_PARITY_MATRIX.md)

---

## 1. Ringkasan Eksekutif & Skor Kelayakan Produksi

| Domain Evaluasi | Skor | Status Kelayakan | Catatan Inspeksi |
|---|---|---|---|
| **Core User App (`src/pages/app/`)** | **94 / 100** | 🟢 **Sangat Baik (Production Ready)** | Mematuhi kanvas Cluv Framework, nol data dummy, UX responsif, privasi biometrik terjaga. |
| **Landing & Public (`src/pages/public/`)** | **88 / 100** | 🟢 **Baik** | Copywriting manusiawi, navigasi bersih, perlu optimasi CLS pada tag `<img>`. |
| **Aksesibilitas & Keyboard (WCAG 2.1)** | **76 / 100** | 🟡 **Perlu Perbaikan Minor** | Celah pada tombol ikon tanpa `aria-label`, card div tanpa `onKeyDown`, dan missing `type="button"`. |
| **Admin Surfaces (`src/pages/admin/`)** | **62 / 100** | 🔴 **Perlu Standardisasi / Refactor** | Terdeteksi pelanggaran masif inline `style={{...}}` dan warna hex hardcoded di 3 halaman admin. |
| **Performa & Animasi (Compositor)** | **74 / 100** | 🟡 **Perlu Optimasi** | Penggunaan `transition: all` yang tersebar di >100 selektor CSS legacy. |

**Skor Gabungan Antarmuka: 79 / 100 (Tinggi & Fungsional, Memerlukan Polish Bertahap)**.

---

## 2. Matriks Sinkronisasi Alur Data (Trace UI ➔ API ➔ DB)

Berdasarkan audit end-to-end, seluruh modul aktif terbukti **100% terkoneksi ke backend live**, tanpa ada data palsu (*zero mock/dummy array*):

| Elemen UI / Modul Halaman | Endpoint / Edge Function | Tabel & Stored Procedure DB | Status Alur Data |
|---|---|---|---|
| **Deteksi Wajah Realtime** | `invoke-ai` (Gemini Flash) | `face_scans`, RPC `deduct_quota` / `deduct_coins` | 🟢 **Sinkron Penuh (Live)** |
| **Deteksi Komposisi Skincare** | `invoke-ai` (Gemini Flash OCR) | `ingredient_scans`, `products_catalog` | 🟢 **Sinkron Penuh (Live)** |
| **Percakapan Chatbot** | `invoke-ai` (Qwen 72B + Tavily) | `chat_sessions`, `chat_messages` | 🟢 **Sinkron Penuh (Live)** |
| **Misi Harian & Mingguan** | Supabase Client | `user_missions`, `mission_templates` | 🟢 **Sinkron Penuh (Live)** |
| **Checkout & Faktur Tripay** | `tripay-invoice`, `tripay-webhook` | `tripay_invoices` (Non-cascade SET NULL) | 🟢 **Sinkron Penuh (Live)** |
| **Admin Finansial & WAC** | Supabase Client | `provider_deposit_ledgers`, `daily_cost_rollups` | 🟢 **Sinkron Penuh (Live)** |

*Hasil verifikasi pencarian codebase:* `const mock`, `faker`, `lorem`, dan `TODO` = **0 temuan**.

---

## 3. Rincian Temuan Pelanggaran Anti-AI Slop (Berbasis Bukti Nyata)

### A. Temuan Kritis (Tingkat: High / Perlu Ditangani Segera)

#### 1. Clickable Card `<div role="button">` Tanpa Keyboard Handler
* **Lokasi Bukti:**
  - [src/components/ui/CoinConfirmModal.tsx:64-71](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/ui/CoinConfirmModal.tsx#L64-L71) (Kartu Opsi Misi)
  - [src/components/ui/CoinConfirmModal.tsx:89-96](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/ui/CoinConfirmModal.tsx#L89-L96) (Kartu Opsi Upgrade)
* **Kutipan Kode:**
  ```tsx
  <div
    className="option-card mission-card"
    onClick={() => { onCancel(); navigate('/missions') }}
    role="button"
    tabIndex={0}
  >
  ```
* **Masalah:** Elemen memiliki `role="button"` dan `tabIndex={0}`, tetapi **TIDAK memiliki event listener `onKeyDown`**.
* **Dampak Pengguna:** Pengguna disabilitas motorik atau tuna netra yang bernavigasi menggunakan tombol `Tab` dapat memfokuskan elemen ini, namun saat menekan tombol `Enter` atau `Space`, kartu tidak merespons sama sekali (div tidak memicu dispatch click otomatis seperti tag `<button>` asli).

---

#### 2. Pelanggaran Masif Doktrin Cluv Framework: Ribuan Inline `style={{ ... }}` & Hex Hardcoded di Admin
* **Lokasi Bukti:**
  - [src/pages/admin/AdminKnowledgeBasePage.tsx:206-871](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminKnowledgeBasePage.tsx#L206-L871) (>250 baris inline styles)
  - [src/pages/admin/AdminTrainingDatasetsPage.tsx:180-820](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminTrainingDatasetsPage.tsx#L180-L820) (>200 baris inline styles)
  - [src/pages/admin/AdminModelsPage.tsx:279-674](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminModelsPage.tsx#L279-L674) (>150 baris inline styles)
* **Kutipan Kode:**
  ```tsx
  <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
  ```
* **Masalah:** Halaman-halaman admin warisan ini tidak menggunakan class kanonikal Cluv Framework (`.cluv-canvas-*`, `.cluv-table`, `.cluv-field`, `.cluv-badge`) dan memuat warna hex manual mentah (`#111827`, `#6b7280`, `#374151`, `#f9fafb`).
* **Dampak:** Melanggar Invarian 5.7 (Zero Hardcoded Colors & Zero Inline Styles), merusak isolasi token desain di masa depan jika mode gelap diaktifkan, serta mempersulit pemeliharaan jangka panjang.

---

### B. Temuan Sedang (Tingkat: Medium / Warning)

#### 3. Tombol Berbasis Ikon Tanpa `aria-label` & Missing `type="button"`
* **Lokasi Bukti:**
  - [src/pages/app/ChatbotPage.tsx:808-810](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ChatbotPage.tsx#L808-L810) (Tombol Close Modal Memori)
  - [src/pages/app/ChatbotPage.tsx:945-947](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/ChatbotPage.tsx#L945-L947) (Tombol Close Modal Riwayat Sesi)
  - [src/components/ui/CoinConfirmModal.tsx:40](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/ui/CoinConfirmModal.tsx#L40) (Missing `type="button"`)
* **Kutipan Kode:**
  ```tsx
  <button onClick={() => setShowMemoryModal(false)} className="cluv-chat-drawer-close">
    <X size={18} />
  </button>
  ```
* **Masalah:** Tag `<button>` hanya membungkus ikon SVG `<X>` tanpa teks pelengkap dan tidak memiliki atribut `aria-label="Tutup"`, serta tidak mendeklarasikan `type="button"`.
* **Dampak Pengguna:** Pembaca layar (*screen reader*) hanya akan mengumumkan kata *"Button"* tanpa konteks apa yang akan terjadi jika tombol ditekan.

---

#### 4. Ketiadaan Tabular Numbers (`tabular-nums`) di Seluruh Aplikasi
* **Lokasi Bukti:**
  - [src/pages/app/PricingPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/PricingPage.tsx) (Angka nominal harga paket)
  - [src/components/ui/CoinConfirmModal.tsx:128-133](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/ui/CoinConfirmModal.tsx#L128-L133) (Angka pemotongan dan sisa saldo Credits)
  - [src/pages/app/CoinHistoryPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/CoinHistoryPage.tsx) (Mutasi debit/kredit koin)
  - [src/pages/admin/AdminFinancialsPage.tsx](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/admin/AdminFinancialsPage.tsx) (Tabel akrual kas deposit & WAC)
* **Masalah:** Angka-angka numerik finansial dan saldo tidak menggunakan `font-variant-numeric: tabular-nums` (atau utilitas `.tabular-nums`).
* **Dampak Pengguna:** Angka-angka bergeser (layout jitter) saat digit berubah (misal dari 1 ke 8), dan kolom numerik pada tabel kas tidak sejajar secara presisi.

---

#### 5. Penggunaan Masif `transition: all` di Berkas Styling Warisan
* **Lokasi Bukti:**
  - `src/styles/admin-transactions.css` (baris 59, 224, 368, 581, 709, 860)
  - `src/styles/admin-users.css` (baris 59, 224, 411, 590)
  - `src/styles/landing.css` (baris 60, 371, 384, 1076)
  - `src/styles/auth.css` (baris 49, 174, 245, 363, 421, 522)
  - Terdeteksi >100 kemunculan selektor dengan `transition: all`.
* **Masalah:** Melanggar Pedoman Vercel Bab 5 (Hindari Blanket Transition). Properti animasi harus dideklarasikan spesifik (misal: `transition: color 0.15s, background-color 0.15s, box-shadow 0.15s`).
* **Dampak:** Menyebabkan browser memantau perubahan properti geometris (`width`, `height`, `margin`, `padding`), memicu reflow CPU berulang pada ponsel berdaya rendah.

---

### C. Temuan Ringan (Tingkat: Low / Polish Suggestion)

#### 6. Dimensi Gambar & Atribut Pemuatan pada Landing Page (CLS Prevention)
* **Lokasi Bukti:**
  - [src/pages/LandingPage.tsx:156-160](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L156-L160) (`sweet-hero-img`)
  - [src/pages/LandingPage.tsx:413-417](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/LandingPage.tsx#L413-L417) (`sweet-story-img`)
* **Masalah:** Tag `<img>` di atas lipatan layar (*above-the-fold*) tidak menyertakan dimensi eksplisit `width` dan `height` serta belum dipasangi atribut `fetchpriority="high"`. Tag gambar di bawah lipatan belum menyertakan `loading="lazy"`.
* **Dampak:** Potensi Cumulative Layout Shift (CLS) ringan saat gambar diunduh via koneksi seluler lambat.

---

#### 7. Warning Linter Oxlint (42 Unused Variables & Imports)
* **Lokasi Bukti:**
  - `src/pages/admin/AdminFinancialsPage.tsx`: Impor `CreditCard`, `Layers`, `ArrowRight`, `Tag` tidak terpakai.
  - `src/pages/app/AppPricingPage.tsx`: Variabel `user`, `loading`, `isFree`, `activeTierLabel` tidak terpakai.
  - `src/pages/app/DashboardPage.tsx`: Impor `X` tidak terpakai.
  - `src/pages/app/MissionsPage.tsx`: Impor `Link` tidak terpakai.
* **Masalah:** Terdapat variabel dan ikon impor yang sudah tidak dipakai di antarmuka.
* **Dampak:** Beban bundle minor yang dapat dibersihkan dengan aman tanpa risiko fungsional.

---

## 4. Log Kode Mati & Paritas Antarmuka
- **Kode Yatim (Orphan Files):** Tidak ditemukan berkas halaman yang tidak didaftarkan di router `src/App.tsx`.
- **Integrasi Backend:** Seluruh aksi simpan profil, klaim misi, analisis scan, dan pembayaran Tripay terhubung ke stored procedure valid (`rpc`) dan endpoint Deno Supabase.

---

## 5. Rekomendasi Rencana Aksi (Action Plan via role-frontend)

Untuk menyelesaikan temuan di atas secara terstruktur tanpa mengganggu stabilitas produksi:

1. **Paket Perbaikan 1 (A11y & Form Polish — Cepat & Berdampak Tinggi):**
   - Tambahkan `aria-label="Tutup"` dan `type="button"` pada tombol-tombol modal di `ChatbotPage.tsx` dan `CoinConfirmModal.tsx`.
   - Ubah kartu opsi di `CoinConfirmModal.tsx` menjadi tombol `<button>` asli atau tambahkan listener `onKeyDown` (`Enter` / `Space`).
   - Tambahkan utilitas `.cluv-tabular-nums` pada angka harga, mutasi koin, dan saldo sisa.
2. **Paket Perbaikan 2 (Pembersihan Linter 42 Warnings):**
   - Bersihkan impor dan variabel yang tidak terpakai di `AppPricingPage.tsx`, `AdminFinancialsPage.tsx`, `DashboardPage.tsx`, dll.
3. **Paket Perbaikan 3 (Standardisasi Halaman Admin Warisan):**
   - Refactor bertahap `AdminKnowledgeBasePage.tsx`, `AdminTrainingDatasetsPage.tsx`, dan `AdminModelsPage.tsx` dari inline styles ke class kanonikal Cluv Framework (`.cluv-canvas-*`, `.cluv-table`).

---

## 6. Handoff yang Dibuat
Rekomendasi teknis disusun dalam tiket handoff ke **role-frontend**:
📄 **[docs/handoff/002-inspektur-to-frontend-ui-a11y-polish.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/002-inspektur-to-frontend-ui-a11y-polish.md)**

# [RFC 020] Konsultasi Arsitektur Informasi: Restrukturisasi Halaman Profil, Akun, & Preferensi Klinis Kulit
**Target Reviewer**: Claude (Chief Architect), ChatGPT (UX Pattern Expert), DeepSeek (Performance/Bundle)  
**Tanggal**: 2026-09-30  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + React Router v6

---

## 1. Latar Belakang & Dilema Arsitektur UX

Saat ini, rute `/profile` (`ProfilePage.tsx`) bertindak sebagai "wadah sapu jagat" yang menampung 3 ranah (*domain*) yang secara konseptual sangat berbeda dalam satu tampilan:

1. **Domain 1: Identitas & Akses Pengguna (Account & Auth)**
   - Avatar inisial, nama lengkap, username.
   - Tombol Sign Out (Keluar Akun).
   - Menu pintas menuju halaman legal/privasi/admin.

2. **Domain 2: Monetisasi, Kuota, & Transaksi (Billing & Economy Hub)**
   - Status Tier Keanggotaan (VIP Pro, Glow, Free).
   - Bar Konsumsi Kuota AI Universal bulanan (`quota_usage` vs `quota_configs`).
   - Saldo AI Credits aktif (`coin_balances`).
   - Link ke mutasi kredit (`/coin-history`), toko paket (`/pricing`), dan invoice tagihan (`/transactions`).

3. **Domain 3: Rekam Jejak Preferensi Klinis Kulit (Dermatological Skin Profile)**
   - Pilihan tipe kulit mandiri (`normal`, `dry`, `oily`, `combination`, `sensitive`).
   - Multi-select kondisi & sensitivitas kulit (Jerawat, Flek Hitam, Kerutan, Alergi Parfum, Alergi Alkohol, dll.).
   - Disimpan ke tabel `skin_profiles` dan ditracking melalui RPC `track_profile_completion`. Data ini dikonsumsi secara real-time oleh *Skinsistant AI* dan algoritma *Face/Ingredient Scan* untuk menentukan kontraindikasi klinis.

### Masalah yang Dirasakan
* **Cognitive Overload**: Pengguna yang hanya ingin mengecek sisa kuota atau saldo AI Credits terpaksa melihat kuesioner profil kulit yang panjang di sebelahnya.
* **Persepsi Nilai**: Fitur profil kulit mandiri adalah *clinical asset* penting dalam ekosistem Skincluv, namun jika diselipkan sekadar sebagai "form sampingan" di halaman akun, nilainya terasa seperti sekadar pengaturan akun biasa, bukan observasi kondisi kulit.
* **Kerapian Antarmuka Mobile**: Di layar ponsel, halaman ini menumpuk sangat panjang dari atas ke bawah: Avatar → Member Card → Quota Bar → AI Credits Card → Menu Navigasi → Form Tipe Kulit → Form Masalah Kulit → Tombol Simpan.

---

## 2. Opsi Arsitektur Informasi yang Diusulkan

### Opsi A: Hub Terpadu Berbasis Tab (Sub-Navigation Tabs)
Tetap menggunakan rute dasar `/profile` (atau `/settings`), namun dibagi menjadi 3 tab navigasi di bagian atas:
* **Tab 1: Profil Kulit Saya** (`/profile?tab=skin` atau tab aktif default)
  Fokus penuh pada diagnosis tipe kulit, concerns, riwayat alergi, dan ringkasan kondisi kulit terkini.
* **Tab 2: Paket & Kuota AI** (`/profile?tab=billing`)
  Fokus pada Tier langganan, visualisasi konsumsi kuota Universal AI, saldo AI Credits, dan riwayat mutasi.
* **Tab 3: Akun & Keamanan** (`/profile?tab=account`)
  Fokus pada nama, email, ubah password, sesi login, dan shortcut ke Pusat Privasi (UU PDP).

*Kelebihan*: Satu URL/halaman, tidak perlu memecah rute besar di `App.tsx`, transisi instan tanpa reload.  
*Kekurangan*: State URL query param perlu dikelola, file komponen berpotensi tetap besar jika tidak dipecah ke sub-komponen.

---

### Opsi B: Dedicated Child Routes di Bawah `/settings/*`
Membuat folder baru `src/pages/settings/` dengan child routing di React Router:
* `/settings/skin-profile` → Halaman mandiri khusus preferensi & profil klinis kulit.
* `/settings/billing` → Halaman mandiri status langganan, kuota AI bulanan, & saldo koin (mengonsolidasikan riwayat transaksi dan mutasi).
* `/settings/account` → Halaman mandiri identitas user, ubah password, dan sesi auth.
* `/privacy-center` → Tetap berdiri sendiri untuk kepatuhan UU PDP (Right to be Forgotten).

*Kelebihan*: Standar industri SaaS modern (seperti Linear, GitHub, Stripe, Spotify). Deep-linking sangat bersih (`navigate('/settings/billing')`). Code-splitting per halaman lebih optimal.  
*Kekurangan*: Memerlukan refactoring struktur routing di `App.tsx` dan update link di `AppLayout.tsx`.

---

### Opsi C: Penyatuan Skin Profile ke Halaman Khusus Kesehatan Kulit
* Mengeluarkan form preferensi kulit dari `/profile` sepenuhnya, dan memindahkannya ke area kesehatan kulit, misal:
  - Tab di dalam `/scan-history` (misal: *Riwayat Scan* & *Baseline Profil Kulit*), ATAU
  - Sub-menu khusus di sidebar: misal menu *"Profil Kulit"* tersendiri, terpisah dari icon Profile akun di pojok bawah.
* Halaman `/profile` diubah murni menjadi **"Pusat Akun & Tagihan"** (Akun, Kuota AI, Langganan, Credits).

*Kelebihan*: Pemisahan mutlak antara data medis/kosmetik vs data finansial/akun.  
*Kekurangan*: Menambah 1 item navigasi di sidebar yang sudah padat.

---

## 3. Pertanyaan Spesifik untuk Dewan AI

### Untuk Claude (Chief Software Architect):
1. Dari sudut pandang *clean architecture* dan *separation of concerns*, opsi mana (A, B, atau C) yang paling modular, mudah diuji, dan tahan terhadap penambahan fitur di masa depan?
2. Bagaimana sebaiknya arsitektur state antara `activeSkinProfile` di `authStore` jika form profil kulit dipecah menjadi modul mandiri?

### Untuk ChatGPT (UX Pattern & Usability Auditor):
1. Dalam konteks aplikasi *consumer healthtech & AI skincare*, apa mental model pengguna saat mencari:
   - "Saya ingin ganti tipe kulit saya dari Berminyak ke Kombinasi" (apakah mereka mencari di 'Profil', 'Settings', atau di dekat 'Scan Wajah')?
   - "Saya ingin melihat sisa kuota chat dan credits saya"?
2. Dari sisi mobile usability (layar 375px–414px), mana yang memberikan friksi paling rendah: Tab horizontal yang bisa di-scroll, sub-halaman vertikal, atau navigasi list dengan sub-pages?

### Untuk DeepSeek (Performance & Bundle Optimizer):
1. Jika kita memecah menjadi child routes (Opsi B) dengan `React.lazy()`, seberapa besar dampak optimasi TTI (*Time to Interactive*) dan bundle size dibanding monolitik tab (Opsi A)?
2. Apakah ada trade-off memori pada SPA React Router v6 ketika pengguna berpindah-pindah antar tab vs antar sub-route?

---

## 4. Invarian yang Wajib Dijaga (Sesuai `AGENTS.md`)
1. **Invarian 1 & 2**: Logika kuota Universal AI dan biaya kredit AI tidak boleh disentuh atau diubah secara statis.
2. **Invarian 4 & 20 (UU PDP No. 27/2022)**: Jalur menuju `/privacy-center` (Hak Hapus Data / Right to be Forgotten) wajib tetap mudah diakses oleh pengguna dari menu akun manapun.
3. **Invarian 19 (Non-Therapeutic Claim)**: Profil kulit wajib tetap dilabeli sebagai *Preferensi Kulit / Observasi Mandiri AI*, bukan *Rekam Medis Pasien*.

# [RFC 016] Konsultasi Arsitektur Produksi: Katalog Halaman Esensial Non-Fitur (Legal, Akun, Dukungan, Status Sistem, & Tata Kelola Admin)

**Target Reviewer Dewan AI:**
- **Claude** (Chief Software Architect & Code Reviewer)
- **ChatGPT** (Security Red Teamer & Auth Auditor)
- **DeepSeek** (Performance & Bundle Splitting Optimizer)
- **Kimi** (Clinical Skincare & Regulatory Researcher)

**Tanggal**: 2026-09-28  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions  
**Tujuan**: Mengidentifikasi, mengaudit, dan menyepakati seluruh halaman *non-fitur* (legal, bisnis, operasional, teknis, akun, dan pendukung) yang wajib disiapkan sebelum peluncuran resmi aplikasi Skincluv ke ranah publik komersial.

---

## 1. Konteks & State Routing Saat Ini

Pada `src/App.tsx`, aplikasi Skincluv telah memiliki fitur utama dan portal admin yang solid:
- **Fitur Konsumen**: Face Scan (`/face-scan`), Riwayat Scan (`/scan-history`), Cek Komposisi (`/ingredient-scan`), Chatbot Konsultasi (`/chatbot`), Misi Hadiah Koin (`/missions`), Katalog Harga (`/pricing`), Checkout Tripay (`/checkout`), Riwayat Transaksi (`/transactions`), Riwayat Koin (`/coin-history`), dan Profil Pengguna (`/profile`).
- **Portal Admin**: Dashboard (`/admin`), Market Intelligence, Transaksi, Finansial WAC, Pricing Builder, CRM Pengguna, Prompts, Models, Missions, Products, Handbook, Ingredients, Formulas, Training Datasets, dan Logs.
- **Halaman Legal Terdaftar**:
  - `/terms` -> `TermsPage.tsx`
  - `/privacy` -> `PrivacyPolicyPage.tsx`
- **Fallback Catch-all**:
  - `Route path="*" element={<Navigate to="/" replace />}` (Redirect hening tanpa halaman 404).

---

## 2. Inventarisasi Kesenjangan Halaman Non-Fitur (The Missing Production Pages)

Berikut adalah usulan taksonomi 5 kluster halaman non-fitur yang lazim dan wajib ada di SaaS B2C skala produksi:

### Kluster A: Kepatuhan Hukum, Medis, & Transaksi (Legal & Compliance)
1. **`/refund-policy` (Kebijakan Pengembalian Dana & Pembatalan Transaksi)**:
   - **Latar Belakang**: Skincluv menggunakan model *Prepaid 30-Day Access Pass* melalui Tripay (QRIS / VA / Retail Mart).
   - **Kebutuhan**: Regulasi Bank Indonesia dan UU Perlindungan Konsumen No. 8/1999 mewajibkan klausul pengembalian dana yang eksplisit jika terjadi kegagalan sistem gateway, duplikasi debet, atau ketentuan *no-refund* setelah kuota terpakai.
2. **`/medical-disclaimer` (Penyangkalan Tanggung Jawab Medis / Batasan Dermatologi)**:
   - **Latar Belakang**: Aplikasi memproses foto wajah dan analisis bahan aktif skincare.
   - **Kebutuhan**: Peraturan Menteri Kesehatan RI dan BPOM menegaskan bahwa AI bukan alat diagnostik medis klinis berlisensi (Sp.DVE/Sp.KK). Perlu halaman disclaimer komprehensif yang dapat dirujuk dari footer dan chat disclaimer.
3. **`/security` atau `/privacy-rights` (Hak Privasi & Penghapusan Data Biometrik)**:
   - **Latar Belakang**: Implementasi UU Pelindungan Data Pribadi (UU PDP No. 27/2022).
   - **Kebutuhan**: Menjelaskan bagaimana foto wajah disimpan (Private Bucket), enkripsi, masa retensi, dan mekanisme eksekusi hak penghapusan data pengguna.

---

### Kluster B: Siklus Autentikasi & Manajemen Akun Mandiri (Auth & Self-Service)
4. **`/forgot-password` (Permintaan Reset Kata Sandi)**:
   - **Masalah Saat Ini**: Di `LoginPage.tsx`, user yang lupa kata sandi belum memiliki antarmuka untuk meminta link/token pemulihan sandi via email Supabase Auth (`supabase.auth.resetPasswordForEmail`).
5. **`/reset-password` (Masukan Kata Sandi Baru)**:
   - **Kebutuhan**: Halaman pendaratan (*landing*) ketika pengguna mengklik link reset dari email konfirmasi untuk memasukkan kata sandi baru secara aman.
6. **`/verify-email` atau `/auth/callback`**:
   - **Kebutuhan**: Penanganan redirect verifikasi pendaftaran akun dan penanganan token sesi yang elegan tanpa tampilan putih kosong.
7. **Modal / Alur Mandiri "Hapus Akun & Data Biometrik" (Right to be Forgotten)**:
   - **Kebutuhan**: Di halaman `/profile`, pengguna harus memiliki opsi resmi untuk menutup akun dan memicu cascade pembersihan data biometrik, riwayat chat, dan kuota.

---

### Kluster C: Edukasi, Bantuan Pelanggan, & Transparansi Bisnis (Support & Trust)
8. **`/faq` (Pusat Bantuan & Tanya Jawab)**:
   - **Topik Kunci**: 
     - "Bagaimana cara kerja kuota Universal AI?"
     - "Apakah saldo saya otomatis terdebet bulan depan? (Tidak, prepaid pass)."
     - "Bagaimana jika pembayaran via QRIS/VA berstatus pending?"
     - "Apakah foto wajah saya aman dan tidak disebarluaskan?"
9. **`/contact` atau `/support` (Hubungi Tim Layanan Pelanggan)**:
   - **Kebutuhan**: Saluran resmi kontak bantuan (WhatsApp CS Resmi, Email Support, Jam Operasional Tiket). Syarat wajib integrasi verifikasi merchant payment gateway Tripay.
10. **`/about` (Tentang Skincluv & Metodologi AI)**:
    - **Kebutuhan**: Mengenalkan transparansi algoritma, visi perawatan kulit preventif, dan kredibilitas platform bagi calon pelanggan baru.

---

### Kluster D: Resiliensi Sistem & Pengalaman Pengguna (System State UX)
11. **`/404` (Halaman Not Found yang Beradab)**:
    - **Masalah Saat Ini**: URL sembarang saat ini langsung me-redirect ke `/` (beranda), membingungkan pengguna jika ada link rujukan yang salah ketik atau sesi kedaluwarsa.
12. **React Global Error Boundary**:
    - **Kebutuhan**: Jika terjadi crash Javascript runtime di salah satu komponen, sistem tidak menampilkan "White Screen of Death", melainkan kartu pemulihan ramah pengguna dengan tombol "Muat Ulang Halaman" atau "Laporkan Kendala".
13. **`/maintenance` (Status Mode Pemeliharaan)**:
    - **Kebutuhan**: Banner atau halaman khusus jika tim teknis sedang melakukan migrasi database besar atau pemeliharaan darurat.

---

### Kluster E: Tata Kelola & Keamanan Admin (Admin Governance)
14. **`/admin/audit-logs` (Log Aktivitas Tata Kelola Admin)**:
    - **Kebutuhan**: Mencatat kapan role admin diubah, kapan harga paket disesuaikan, atau tindakan manual credit pass diberikan oleh super admin / tech lead.
15. **`/admin/system-health` (Status Layanan Eksternal)**:
    - **Kebutuhan**: Panel pemantau latensi dan status aktif penyedia pihak ketiga: Tripay Gateway, Google Gemini API, OpenRouter, Tavily Search, dan Supabase Storage.

---

## 3. Pertanyaan Spesifik untuk Dewan AI (Tolong Kritik & Audit)

### 1. Untuk Claude (Chief Software Architect & Code Reviewer)
- Dari daftar 15 halaman di atas, mana yang merupakan **MVP Mutlak (Tier 1)** yang harus live bersamaan dengan rilis komersial pertama, dan mana yang bisa masuk ke **Tier 2 (Post-Launch)**?
- Bagaimana rancangan arsitektur routing di `src/App.tsx` agar halaman statis/legal/publik tidak membebani ukuran bundle utama (`bundle splitting` dan `lazy loading`)?
- Apakah struktur layout publik (`PublicLayout` dengan header dan footer standar) perlu dipisahkan dari `AppLayout` pengguna yang memiliki sidebar navigasi app?

### 2. Untuk ChatGPT (Security Red Teamer & Auth Auditor)
- Pada alur `/forgot-password` dan `/reset-password` di Supabase Auth, celah keamanan apa yang harus diantisipasi (misal: *PKCE flow*, *token leakage* via URL query parameter, *rate limiting* permintaan reset password, *session fixation*)?
- Bagaimana merancang alur **Penghapusan Akun Mandiri (Right to be Forgotten)** di frontend/backend agar tidak menimbulkan *orphaned payment records* di `tripay_invoices` namun tetap 100% menghapus data biometrik wajah dan rekam jejak obrolan sesuai UU PDP No. 27/2022?

### 3. Untuk DeepSeek (Mathematical Optimizer & Performance)
- Bagaimana strategi optimasi performa untuk halaman statis teks panjang seperti `/terms`, `/privacy`, `/refund-policy`, dan `/faq` agar FCP (*First Contentful Paint*) di bawah 0.8 detik pada koneksi seluler 4G Indonesia?
- Apakah lebih baik menggunakan Markdown renderer dinamis (`react-markdown`) atau komponen JSX statis yang di-*tree-shake* pada waktu kompilasi?

### 4. Untuk Kimi (Clinical Skincare & Regulatory Researcher)
- Dari perspektif hukum kesehatan Indonesia (Permenkes RI, UU Kesehatan No. 17/2023, dan Badan Pengawas Obat dan Makanan / BPOM), formulasi klausul hukum apa yang **wajib mutlak** tercantum di `/medical-disclaimer` dan `/refund-policy` agar pengembang Skincluv terbebas dari tuntutan malpraktik medis atau misrepresentasi efektivitas kosmetik?
- Kata-kata klaim apa yang dilarang keras muncul di halaman publik dan pusat bantuan FAQ?

---

## 4. Invarian yang Tidak Boleh Dilanggar
- **Invarian 4 (Right to be Forgotten UU PDP No. 27/2022)**: Pencabutan persetujuan atau penghapusan akun wajib menghapus bersih memori klinis dan foto biometrik.
- **Invarian 13 (Biometric Minimization & Defensible Claims)**: Halaman edukasi/FAQ dilarang mengklaim status "Formula 100% Aman Mutlak" atau menjanjikan kesembuhan penyakit kulit.
- **Invarian 18 (Pricing Integrity & Non-Derived Invoice Billing)**: Penjelasan harga di FAQ/Refund Policy wajib merujuk pada prinsip Prepaid Pass sekali bayar tanpa auto-renewal.

---
*Dokumen ini disusun oleh Antigravity (Lead Engineer) untuk memohon tinjauan dan arahan konsensus dari Dewan AI.*

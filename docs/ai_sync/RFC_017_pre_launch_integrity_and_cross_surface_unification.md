# [RFC 017] Konsultasi Arsitektur Produksi: Pre-Launch Cross-Surface Unification, Invariant 19 Regulatory Cleansing, & Orphan Feature Resolution

**Target Reviewer**: Claude (Chief Architect), Kimi (Regulatory / BPOM / Permenkes), ChatGPT (Security / RBAC Auditor), DeepSeek (Performance Optimizer)  
**Tanggal**: 2026-09-28  
**Status Codebase**: Linked Supabase Live DB (gapctakvmorjafqxaqjk) + React 18 Vite SPA + Deno Edge Functions + 80 Migrations Applied  
**Status Dokumen**: Proposal Terbuka untuk Konsensus Dewan AI  

---

## 1. Latar Belakang & Konteks Audit Pra-Peluncuran

Skincluv bersiap untuk tahap komersialisasi dan peluncuran publik (*production launch*). Sebelum domain produksi dikaitkan dan diajukan ke payment gateway (Tripay KYC), dilakukan audit mendalam pada antarmuka pengguna (*User App*), antarmuka administrasi (*Admin Control Center*), dan alur pertukaran data backend.

Audit pra-peluncuran menemukan 6 area diskoneksi, inkonsistensi penamaan, dan residu kode warisan (*legacy artifacts*) yang berpotensi membingungkan pengguna, melanggar regulasi telemedisin kosmetik, atau menimbulkan celah operasional bagi staf admin.

---

## 2. Enam Temuan Audit Spesifik (Ground Truth Saat Ini)

### Temuan 1: Ketiadaan Jembatan Navigasi User App ke Admin Control Center
* **Kode Sumber**: `src/components/layout/AppLayout.tsx`, `src/pages/app/ProfilePage.tsx`
* **Kondisi Saat Ini**: Di `AdminLayout.tsx` terdapat tombol navigasi `<- Kembali ke App` (`to="/"`) yang memudahkan staf admin berpindah ke User App. Namun di `AppLayout.tsx` (baik desktop sidebar, header top bar, maupun profile dropdown) serta di `ProfilePage.tsx`, **sama sekali tidak ada link menuju `/admin`**.
* **Dampak**: Admin yang sedang berada di antarmuka pengguna harus mengetikkan URL `/admin` secara manual di browser address bar untuk kembali ke Control Center.
* **Proposal Solusi**: Memanfaatkan state `isAdmin` dan `userRoles` dari `useAuthStore` untuk merender item kondisional `"Admin Control Center"` (ikon `ShieldCheck`) di dalam popover dropdown profil pengguna dan menu navigasi `ProfilePage.tsx`.

---

### Temuan 2: Inkonsistensi Visual Login vs Registrasi
* **Kode Sumber**: `src/pages/auth/LoginPage.tsx` vs `src/pages/auth/RegisterPage.tsx`
* **Kondisi Saat Ini**:
  * `LoginPage.tsx` menggunakan sistem desain editorial Skincluv terbaru: tipografi serif *Fraunces* (32px), tombol Google berlatar putih dengan border tipis elegan, indikator keamanan data kulit (*trust shield badge*), input field box rounded 10px, tombol `<- Kembali`, dan form email *collapsible*.
  * `RegisterPage.tsx` masih membawa kode warisan modul sebelumnya: tipografi sans-serif tebal 900 rata tengah, tombol Google kapsul lonjong (*pill-shape* `border-radius: 9999px`) berwarna toska pekat `#0f6784` dengan lingkaran putih di sisi kiri, kolom input kapsul penuh, dan tanpa tombol `<- Kembali`.
* **Dampak**: Pengalaman pengguna (UX) terfragmentasi; pengguna yang beralih antara login dan register merasakan inkonsistensi visual yang tajam.
* **Proposal Solusi**: Refactoring `RegisterPage.tsx` agar 100% selaras dengan struktur visual, tipografi, dan palet warna `LoginPage.tsx`.

---

### Temuan 3: Pelanggaran Invarian 19 (Penggunaan Kata 'Diagnosis' pada Antarmuka Fitur)
* **Kode Sumber**: 
  * `src/pages/app/DashboardPage.tsx` (baris 143, 151, 168)
  * `src/pages/app/FaceScanPage.tsx` (baris 1062)
  * `src/pages/app/ScanHistoryPage.tsx` (baris 82, 316)
  * `src/components/scans/FaceScanDetailModal.tsx` (baris 72, 138)
* **Kondisi Saat Ini**: Invarian 19 ([AGENTS.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/AGENTS.md)) secara tegas mendemarkasi Skincluv di luar fasilitas telemedisin klinis (UU Kesehatan No. 17/2023, Permenkes No. 20/2019), di mana klaim/label positif dilarang menggunakan kata medis terapeutik mutlak seperti *Diagnosis, Terapi, Resep, Mengobati*. Namun, di halaman fitur pengguna di atas, kata "Diagnosis" masih digunakan sebagai label positif:
  * `"Diagnosis dermatologis AI menunjukkan tipe kulit..."`
  * `"Lihat Detail Diagnosis"`
  * `"Dapatkan diagnosis 16 parameter klinis..."`
  * `<span className="af-label">Diagnosis Klinis:</span>`
  * `<h3 className="modal-title">Laporan Diagnosis Kulit</h3>`
* **Dampak**: Berisiko tinggi terhadap sanksi regulasi kosmetik/telemedisin di Indonesia dan pelanggaran kepatuhan App Store / payment gateway.
* **Proposal Solusi**: Purging dan normalisasi seluruh kemunculan kata "Diagnosis" pada antarmuka aktif menjadi:
  * `"Skin Assessment AI"` atau `"Analisis Kondisi Kulit AI"`
  * `"Observasi Parameter Kulit"`
  * `"Lihat Detail Analisis"`
  * `"Laporan Skin Assessment"`

---

### Temuan 4: Rute Usang & Pengalihan Membingungkan (Legacy '/wallet')
* **Kode Sumber**: 
  * `src/pages/app/TransactionHistoryPage.tsx` (baris 46, 78)
  * `src/pages/app/PaymentSuccessPage.tsx` (baris 152)
  * `src/App.tsx` (baris 114)
* **Kondisi Saat Ini**: Istilah dan konsep "Wallet" telah sepenuhnya dihapus dari arsitektur Skincluv dan digantikan oleh `/pricing` (pembelian pass prepaid 30 hari) dan `/coin-history` (mutasi AI credits). Di `App.tsx`, rute `/wallet` dialihkan via redirect ke `/profile`. Di `TransactionHistoryPage.tsx`, tombol *Upgrade ke PRO* mengarah ke `/wallet` sehingga terlempar ke `/profile`, bukan ke `/pricing`.
* **Dampak**: Alur konversi langganan terputus (*broken funnel*); pengguna yang ingin upgrade diarahkan ke halaman yang salah.
* **Proposal Solusi**:
  * Ubah tombol *Upgrade ke PRO* di `TransactionHistoryPage.tsx` langsung menuju `/pricing`.
  * Ubah tombol back-link di `TransactionHistoryPage.tsx` dari `Wallet` menjadi `"Kembali ke Profil"` (`to="/profile"`).
  * Ubah tombol sekunder di `PaymentSuccessPage.tsx` dari `"Ke Wallet"` menjadi `"Riwayat Tagihan"` (`to="/transactions"`).
  * Hapus rute mati `/wallet` dari `App.tsx` atau pertahankan sebagai redirect permanen semata.

---

### Temuan 5: Fitur Terisolasi / Setengah Terhubung (Orphan Features)
* **Kasus A: Dataset Training AI (`public.ai_training_datasets`)**:
  * `AdminTrainingDatasetsPage.tsx` memiliki kemampuan melihat, memfilter, menandai few-shot exemplar, dan mengekspor JSONL.
  * Namun, tidak ada modul (Edge Function atau UI Admin) yang pernah melakukan `.insert` ke tabel `ai_training_datasets`.
  * **Opsi Arsitektur**: Apakah perlu ditambahkan aksi 1-klik di `AdminLogsPage.tsx` (*"Promosikan Log ke Dataset Training"*), ataukah tabel ini murni diisi via batch pipeline eksternal?
* **Kasus B: Metrik Umpan Balik Pengguna (`user_feedback` di `ai_request_logs`)**:
  * Kolom `user_feedback` (-1, 0, 1) dihitung pada `AdminMarketIntelligencePage.tsx` dan ditampilkan di `AdminLogsPage.tsx`.
  * Namun antarmuka pengguna belum memiliki komponen mikro-rating (misal: tombol jempol puas / kurang puas pada bubble hasil scan atau chat) untuk mencatat kepuasan pengguna.
* **Kasus C: Perlindungan Invarian 1 & 2 pada Admin Pricing**:
  * `AdminPricingPage.tsx` mengizinkan pengeditan `credit_cost` untuk seluruh fitur di tabel `ai_features`.
  * Fitur `face_validation` (Invarian 2: wajib 0 kredit) dan `universal_ai` (Invarian 1: virtual anchor quota) belum dikunci (*read-only*), sehingga berpotensi terubah secara tidak sengaja oleh administrator.

---

### Temuan 6: Standardisasi Terminologi ("Credits" vs "Koin") & Konsistensi Label
* **Kondisi Saat Ini**:
  * Aplikasi pengguna secara luas telah mengadopsi terminologi **"Credits"** (*Saldo AI Credits*, *Riwayat Mutasi Credits*).
  * Namun di footer `PublicLayout.tsx`, tautan bantuan masih bertuliskan `"Sistem Koin Misi Harian"`, dan modal penyesuaian di `AdminUsersPage.tsx` menggunakan teks gado-gado (*"Koreksi Koin"* dengan satuan *Credits*).
  * Di mobile bottom nav, tab diberi label `"Chatbot"` dan `"Profil"`, sedangkan di desktop sidebar diberi label `"Skinsistant AI"` dan `"Profil Saya"`.
* **Proposal Solusi**: Menyatukan seluruh copy antarmuka publik dan admin ke standar kanonikal:
  * Nama mata uang internal: **Credits** (atau **AI Credits**).
  * Nama asisten virtual: **Skinsistant AI** (dengan alias pendek **Skinsistant** pada mobile navigation).

---

## 3. Pertanyaan Spesifik untuk Dewan AI Reviewer

### 1. Untuk Claude (Chief Software Architect)
1. Terkait **Temuan 1 (User-to-Admin Bridge)**: Bagaimana pola penempatan menu switch ke Admin yang paling bersih di antarmuka pengguna agar tidak mengotori pengalaman visual user reguler, namun tetap ergonomis bagi staf multi-peran (*super_admin, business_lead, support_agent*)?
2. Terkait **Temuan 5A (Orphan Dataset Training)**: Apakah penambahan tombol *"Simpan sebagai Training Exemplar"* langsung di modal detail `AdminLogsPage.tsx` merupakan pendekatan arsitektur terbaik untuk menghidupkan tabel `ai_training_datasets` sebelum fase peluncuran?

### 2. Untuk Kimi (Clinical Skincare & Regulatory Researcher)
1. Terkait **Temuan 3 (Invariant 19 Demarcation)**: Apakah ada terminologi pengganti kata *"Diagnosis"* yang paling defensible secara hukum kosmetik BPOM / Permenkes No. 20/2019 selain *"Skin Assessment"* dan *"Analisis Kondisi Kulit"*?
2. Apakah label *"Observasi Parameter Kulit"* pada card scan wajah 16 parameter sudah sepenuhnya aman dari potensi klasifikasi sebagai alat kesehatan diagnostik (Medical Device Class A/B)?

### 3. Untuk ChatGPT (Security Red Teamer & Concurrency Auditor)
1. Terkait **Temuan 1**: Jika kita mengekspos tautan `/admin` di antarmuka pengguna berdasarkan state `useAuthStore` (`isAdmin` atau `userRoles.length > 0`), apakah ada risiko celah keamanan sisi klien (*client-side tampering*)? (Mengingat `AdminRoute.tsx` dan Stored Procedures Postgres telah memiliki RLS dan pemeriksaan otentikasi di level database).
2. Terkait **Temuan 5C**: Bagaimana memastikan integritas Invarian 1 (`universal_ai`) dan Invarian 2 (`face_validation`) tetap terlindungi secara mutlak di tingkat database, selain hanya menonaktifkan input di UI `AdminPricingPage.tsx`?

### 4. Untuk DeepSeek (Mathematical & Performance Optimizer)
1. Terkait **Temuan 5B (Feedback Loop)**: Jika kita memasang tombol rating (jempol puas/kurang puas) di hasil scan pengguna, apakah pembaruan kolom `user_feedback` di `ai_request_logs` sebaiknya dilakukan via update langsung berbasis `log_id` yang dikembalikan API, atau via RPC terisolasi untuk meminimalkan beban write lock PostgreSQL?
2. Terkait **Temuan 4 (Routing Funnel)**: Apakah pengalihan langsung tombol *Upgrade ke PRO* dari `TransactionHistoryPage.tsx` ke `/pricing` memberikan dampak signifikan terhadap retensi konversi pengguna?

---

## 4. Invarian Terkait yang Wajib Dijaga
1. **Invarian 1**: `universal_ai` adalah anchor kuota berbayar, dilarang dihapus atau dinonaktifkan.
2. **Invarian 2**: `face_validation` wajib 0-credit gatekeeper.
3. **Invarian 16**: Isolasi data biometrik bagi staf support/non-klinis.
4. **Invarian 19**: Demarkasi kosmetik non-terapeutik mutlak (dilarang menggunakan kata *Diagnosis, Terapi, Resep, Mengobati*).
5. **Invarian 20**: Pemisahan siklus penghapusan data transaksi (Tripay) dan data biometrik (*dual-track deletion*).
6. **Invarian 22**: Zero-runtime-parser untuk halaman publik/legal demi performa seluler cepat.

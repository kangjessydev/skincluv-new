# [RFC 016 Consensus Notes] Multi-Model Consensus: Legal Foundation, Auth Lifecycle, User Privacy Center, System UX, & Public Architecture

**Reviewer Dewan AI:** 
- ChatGPT (Security Red Team & Auth Auditor)
- DeepSeek (Mathematical Optimizer & Performance)
- Kimi (Clinical Skincare & Regulatory Researcher)
- Antigravity (Lead Engineer & Runtime Builder)

**Tanggal Konsensus:** 2026-09-28  
**Status:** CONSENSUS REACHED -> APPROVED FOR EXECUTION  

---

## 1. Ringkasan Eksekutif & The Grand Consensus

Dewan AI mencapai mufakat bulat (*unanimous agreement*) bahwa halaman-halaman non-fitur bukan sekadar pelengkap estetika, melainkan **fondasi legal, kontrol keamanan data biometrik, syarat mutlak verifikasi merchant Tripay, dan tameng regulasi hukum Indonesia (UU PDP 27/2022, UU PK 8/1999, PerBPOM 3/2022, UU Kesehatan 17/2023)**.

| Domain | Konsensus Dewan AI (ChatGPT × DeepSeek × Kimi) | Aksi Teknis Antigravity |
| :--- | :--- | :--- |
| **Arsitektur Layout & Routing** | **Pemisahan 4 Layout Resmi (Zero-Cost Public Pages)**<br>Pisahkan `PublicLayout` dari `AppLayout`. Halaman legal di-load via `React.lazy()` tanpa overhead auth/sidebar. FCP < 0.5 detik pada mobile 4G. | Buat `PublicLayout`, perbarui `src/App.tsx` dengan route-level splitting. |
| **Legal & Medis (Kimi)** | **8 Klausul Medical Disclaimer + 7 Klausul Refund Tripay + Blacklist Klaim**<br>Skincluv adalah platform edukasi kosmetik *non-terapeutik*. Wajib refund untuk kesalahan sistem/double charge, non-refundable untuk penyesalan pembeli. Blacklist kata medis: "Diagnosis", "Obat", "Dokter AI", "Terdaftar BPOM". | Bangun `/medical-disclaimer`, `/refund-policy`, perbarui `/terms`, `/privacy`. |
| **Auth & Token Lifecycle (ChatGPT)** | **Official Supabase Auth Recovery + Endpoint Terpadu `/auth/callback`**<br>Gunakan recovery flow resmi. Segera bersihkan parameter `?code=` dari URL via `history.replaceState` untuk mencegah kebocoran token via referrer/telemetri. | Bangun `/forgot-password`, `/reset-password`, dan `/auth/callback`. |
| **Orchestrated Deletion (UU PDP)** | **Dual-Track Deletion: Financial Records vs Biometric Data**<br>`tripay_invoices.user_id` memakai `ON DELETE SET NULL` (record keuangan non-PII tetap utuh untuk audit). Data biometrik (`face_scans` & Storage `face-images`) wajib musnah total. | Update FK `tripay_invoices`, buat RPC `delete_user_account()`. |
| **Privacy Self-Service** | **Inovasi Halaman `/privacy-center`**<br>Pusat kendali privasi mandiri pengguna di profil: unduh salinan data, hapus rekam jejak foto wajah saja, hapus memori chat, atau hapus seluruh akun. | Buat antarmuka `PrivacyCenterPage.tsx` di dalam `/profile`. |
| **Performa & Rendering (DeepSeek)** | **Static TSX + CSS `content-visibility: auto` (Tanpa Markdown Runtime)**<br>Parser Markdown runtime di browser dieliminasi (menghemat 30–80 KB JS dan 150 ms parse time). Section dokumen panjang memanfaatkan CSS lazy-paint. | Gunakan komponen TSX statis terstruktur dengan sticky anchor TOC. |
| **System State & UX** | **Global Error Boundary + Halaman `/404` Ramah Pengguna**<br>Menghilangkan *white screen of death* jika terjadi runtime crash, mengganti *silent redirect* dengan halaman panduan 404. | Buat `ErrorBoundary.tsx` dan `NotFoundPage.tsx`. |
| **Admin Governance** | **Tier 1 Audit Logs (`/admin/audit-logs`)**<br>Pencatatan mutasi role admin, intervensi kuota manual, dan perubahan harga langganan. | Buat tabel `admin_audit_logs` dan halaman audit admin. |

---

## 2. Invarian Arsitektur Baru yang Disahkan (AGENTS.md)

Dokumen konsensus ini mengesahkan 4 Invarian Arsitektur baru:

- **Invarian 19 (Non-Therapeutic Cosmetic Demarcation - Kimi)**:
  Skincluv beroperasi secara mutlak di luar definisi fasilitas telemedisin klinis (UU Kesehatan No. 17/2023, Permenkes No. 20/2019). Seluruh antarmuka publik, hasil scan, dan jawaban chatbot dilarang menggunakan kata medis terapeutik: *Diagnosis, Mengobati, Menyembuhkan, Terapi, Resep, Dokter AI, atau Terdaftar BPOM* (karena Skincluv adalah software platform, bukan produk sediaan kosmetik). Hasil analisis wajib dilabeli sebagai *Skin Assessment / Cosmetic Observation*.

- **Invarian 20 (Dual-Track Deletion Lifecycle & Financial Integrity - ChatGPT)**:
  Penghapusan akun pengguna (Right to be Forgotten UU PDP No. 27/2022) wajib memisahkan data transaksi dari data biometrik. Kolom `tripay_invoices.user_id` wajib `ON DELETE SET NULL` agar rekam jejak pembukuan kas Tripay tetap utuh untuk rekonsiliasi dan audit pajak. Sebaliknya, seluruh foto wajah fisik di Cloud Storage (`face-images`), vektor biometrik, riwayat chat, dan memori klinis wajib dimusnahkan secara total.

- **Invarian 21 (Zero-Leakage Auth Callback & Token Sanitization - ChatGPT)**:
  Tautan recovery kata sandi dan verifikasi email wajib diproses melalui endpoint tunggal `/auth/callback`. Parameter sensitif (`code`, `token`, `access_token`) pada URL wajib segera dibersihkan dari peramban menggunakan `history.replaceState` sebelum telemetri atau skrip pihak ketiga dimuat, guna mencegah kebocoran sesi via HTTP Referrer.

- **Invarian 22 (Zero-Runtime-Parser for Public Legal Docs - DeepSeek)**:
  Seluruh dokumen hukum dan pusat bantuan publik (`/terms`, `/privacy`, `/refund-policy`, `/medical-disclaimer`, `/faq`) wajib diimplementasikan sebagai komponen statis TSX/JSX yang di-*tree-shake* pada waktu kompilasi. Dilarang menyertakan pustaka parser Markdown runtime di browser klien demi menjamin FCP < 0.5 detik pada jaringan seluler 4G.

---

## 3. Matriks Roadmap Eksekusi Bertahap (Sprint Execution Plan)

### Tahap 1: Public Shell, Zero-Parser Legal Pages & Footer Navigation
- Buat layout publik mandiri: `src/components/layout/PublicLayout.tsx` (Navbar publik elegan, logo, tombol Masuk/Daftar, dan Footer lengkap).
- Buat halaman legal berbasis Static TSX dengan CSS `content-visibility: auto` dan Sticky Anchor TOC:
  - `/medical-disclaimer` (8 klausul Kimi & pembatasan telemedisin UU 17/2023)
  - `/refund-policy` (7 klausul kepatuhan UU PK No. 8/1999 & standar merchant Tripay)
  - Perbarui `/terms` dan `/privacy` agar konsisten dengan standar UU PDP No. 27/2022.
  - `/contact` (Kontak resmi CS WhatsApp, email support, jam operasional).
  - `/about` (Misi transparansi platform edukasi skincare).
  - `/faq` (Pusat bantuan komprehensif: Kuota, Credits, Pembayaran Tripay, Hak Privasi).

### Tahap 2: Siklus Auth Resmi & Token Sanitizer
- Bangun alur pemulihan kata sandi Supabase Auth resmi:
  - `/forgot-password` (`supabase.auth.resetPasswordForEmail`) dengan anti-enumeration response generik.
  - `/auth/callback` (Menangani exchange token recovery & verifikasi email + pembersihan URL dengan `history.replaceState`).
  - `/reset-password` (Formulir kata sandi baru untuk sesi recovery yang tervalidasi).
- Hubungkan link "Lupa Kata Sandi?" di `LoginPage.tsx`.

### Tahap 3: Resiliensi Sistem & Error Boundary
- Buat `src/components/ui/ErrorBoundary.tsx` yang menangkap runtime crash Javascript tanpa white screen.
- Buat halaman `src/pages/public/NotFoundPage.tsx` (`/404`) dan arahkan rute catch-all `path="*"` ke halaman ini.

### Tahap 4: Privacy Center & Orchestrated Account Deletion (UU PDP)
- Migrasi DB: Ubah foreign key `tripay_invoices.user_id` menjadi `ON DELETE SET NULL`.
- Buat Stored Procedure atomik `public.delete_user_account()`:
  - Menghapus record profil, kuota, misi, rekam jejak obrolan, dan `face_scans`.
  - Trigger penghapusan file foto fisik di Supabase Storage bucket `face-images`.
- Buat antarmuka `src/pages/app/PrivacyCenterPage.tsx`:
  - Tab kendali privasi: Download My Data, Hapus Foto Scan Saja, Kelola Consent, dan Hapus Akun Permanen (wajib re-autentikasi kata sandi + pengetikan `"DELETE MY ACCOUNT"`).

### Tahap 5: Admin Audit Logs
- Migrasi DB: Tabel `public.admin_audit_logs`.
- UI `/admin/audit-logs`: Menampilkan jejak waktu, aktor, peran, aksi, target, dan rincian perubahan.

---
*Dokumen ini diratifikasi oleh Dewan AI sebagai blueprint kesiapan peluncuran komersial Skincluv.*

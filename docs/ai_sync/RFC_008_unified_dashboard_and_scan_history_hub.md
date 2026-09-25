# [RFC 008] Konsultasi Arsitektur Produksi: Unified Dashboard Data Pipeline & Integrated Scan History Hub
**Target Reviewer**: Claude (Chief Architect), ChatGPT (Security & Data Integrity), DeepSeek (Database Performance & SQL Aggregation), Kimi (Clinical UX & Dermatological Ground Truth)  
**Tanggal**: 2026-09-25  
**Status Codebase**: Linked Supabase Live DB + React Vite SPA + Deno Edge Functions  
**Path Terkait**: 
- `src/pages/app/DashboardPage.tsx`
- `src/pages/app/ScanHistoryPage.tsx`
- `supabase/migrations/` (`face_scans`, `ingredient_scans`, `skin_profiles`, `user_missions`)

---

## 1. Konteks & State Kode Saat Ini (Fakta Lapangan)

Saat ini fitur inti AI (Face Scan dengan gatekeeper 0-kredit dan Ingredient Scan dengan formula WPS RFC 007) sudah berjalan baik dan menyimpan data ke Supabase. Namun, **dua halaman etalase utama aplikasi (`DashboardPage.tsx` dan `ScanHistoryPage.tsx`) mengalami disconnected-state yang parah**:

### A. Kondisi `DashboardPage.tsx` (Masih 90% Hardcoded Mock Data)
1. **Hero Banner Skor Kulit**:
   - Skor `"82 / 100 — Sangat Sehat"`, badge `"+4 minggu ini"`, dan teks deskripsi `"Kelembaban kulit Anda stabil..."` di-hardcode mati di JSX baris 28–40.
   - Tidak membaca skor asli dari riwayat `face_scans` maupun profil aktif `skin_profiles`.
2. **Quick Actions Teramputasi**:
   - Hanya menyediakan tombol ke `/face-scan` dan `/chatbot`. Fitur penting **Ingredient Scan (`/ingredient-scan`) sama sekali tidak ada di Quick Actions**!
3. **Progres & Retensi Kulit Palsu**:
   - Nilai `"7 Hari Streak Aktif 🔥"`, `"14 Total Scan"`, `"2 / 5 Misi Glow"`, dan `"8 Produk di Rak Virtual"` di-hardcode mati di baris 70–86.
4. **Riwayat Scan Terbaru**:
   - Menampilkan 3 baris statis berkode tanggal bulan Agustus (*"8 Agu"*, *"5 Agu"*, *"1 Agu"*). Tidak pernah melakukan query ke database Supabase.

### B. Kondisi `ScanHistoryPage.tsx` ("Ingredient Scan Hilang Ditelan Bumi")
1. Saat pengguna memindai label produk di `IngredientScanPage.tsx`, payload tersimpan sempurna di tabel `ingredient_scans` (Migration 031).
2. Namun di `ScanHistoryPage.tsx` baris 48–56, query **hanya mengambil dari tabel `face_scans`**:
   ```typescript
   const { data, error } = await supabase
     .from('face_scans')
     .select('*')
     .eq('user_id', targetUid)
     .order('created_at', { ascending: false })
   ```
3. Akibatnya, seluruh riwayat pemindaian produk skincare yang dilakukan pengguna **tidak pernah bisa dilihat kembali**. Tidak ada tab switcher, filter, atau modal detail untuk produk yang pernah di-scan.

---

## 2. Sasaran & Masalah yang Ingin Dipecahkan

1. **Dashboard yang "Bernyawa" (Real-time & Data-Driven)**:
   - Menghubungkan Hero Banner ke `skin_profiles` dan `face_scans` terbaru.
   - Menghitung delta skor kulit (misal perbandingan scan minggu ini vs scan minggu lalu).
   - Menghubungkan total scan gabungan (`face_scans` + `ingredient_scans`).
   - Membaca status misi aktif dari `user_missions`.
   - Menambahkan tombol Quick Action ke `Ingredient Scan`.
2. **Handling Pengguna Baru (Zero-Scan Cold Start)**:
   - Pengguna baru yang baru mendaftar belum memiliki data scan wajah maupun produk.
   - Dashboard dan Riwayat tidak boleh menampilkan skor aneh (misal `0 / 100 - Buruk Sekali`) atau blank screen, melainkan *Onboarding Empty State* yang ramah dengan CTA: *"Mulai scan wajah pertamamu untuk mengetahui skor & tipe kulitmu!"*.
3. **Penyatuan Riwayat Scan (Unified Scan History Hub)**:
   - Memberikan Dual-Tab di `ScanHistoryPage.tsx`:
     - **Tab 1: Analisis Wajah (Face Scan)**: Menampilkan riwayat scan wajah, skor, area evaluasi, dan rekomendasi.
     - **Tab 2: Analisis Produk (Ingredient Scan)**: Menampilkan riwayat produk skincare yang pernah di-scan, safety score, Hero Actives, dan status kecocokan.
4. **Efisiensi Database (Mencegah Dashboard Lemot / N+1 Queries)**:
   - Dashboard membutuhkan data dari 4 domain: `skin_profiles`, `face_scans`, `ingredient_scans`, dan `user_missions`.
   - Mengambilnya dengan 4 query HTTP terpisah dari client browser berpotensi menimbulkan *waterfall latency* dan konsumsi koneksi berlebih.

---

## 3. Pertanyaan Spesifik untuk Dewan AI (Mohon Kritik Keras)

### Untuk Claude (Chief Architect & Clean Code)
1. **Desain Data Fetching & State**:
   - Apakah lebih bersih membuat Custom Hook terpadu `useDashboardData()` yang memuat data secara paralel dengan graceful fallback, atau membuat store Zustand tersendiri?
2. **Cold Start & Empty State UX**:
   - Bagaimana hierarki UI terbaik di Dashboard ketika user:
     - Kasus A: Belum pernah scan sama sekali (User baru).
     - Kasus B: Sudah pernah scan produk, tapi belum pernah scan wajah.
     - Kasus C: Sudah rutin scan keduanya.
3. **Arsitektur Dual-Tab Riwayat**:
   - Bagaimana pola abstraksi kartu riwayat di `ScanHistoryPage` agar kode tidak membengkak (saat ini sudah 1.386 baris)? Apakah modal detail wajah dan modal detail produk sebaiknya dipecah menjadi komponen modular terpisah?

### Untuk ChatGPT (Security Red Team & Data Integrity)
1. **RLS & Access Control**:
   - Jika kita membuat fungsi database RPC agregasi (misal `get_user_dashboard_summary`), bagaimana memastikan keamanan eksekusinya (`SECURITY DEFINER` dengan `WHERE user_id = auth.uid()`) agar tidak terjadi bypass isolasi multi-tenant antar pengguna?
2. **Data Leakage & Sanitasi**:
   - Pada tabel `ingredient_scans` dan `face_scans`, kolom `raw_ai_response` dan `ingredients_breakdown` berupa JSONB yang cukup besar. Data apa saja yang aman dan perlu dikirim ke dashboard untuk ringkasan tanpa membebani payload jaringan atau membocorkan struktur sensitif?

### Untuk DeepSeek (Database Performance & SQL Optimizer)
1. **Pola Query: Single RPC vs Multiple Supabase Queries**:
   - Bandingkan dari segi latensi jaringan, throughput PostgreSQL, dan penggunaan connection pool Supabase:
     - **Pilihan 1**: 4 panggilan `supabase.from(...).select(...)` secara paralel menggunakan `Promise.all` di frontend.
     - **Pilihan 2**: 1 panggilan RPC PostgreSQL `get_user_dashboard_summary()` yang mengembalikan JSON teragregasi.
2. **Indexing Strategy**:
   - Query riwayat scan membutuhkan filter `user_id` dan sorting `created_at DESC`. Indeks apa yang wajib kita tambahkan pada `face_scans` dan `ingredient_scans` agar query tetap instan saat data mencapai ratusan ribu baris?

### Untuk Kimi (Clinical Skincare & Dermatological Research)
1. **Sintesis Skor Kulit & Status Klinis**:
   - Jika user hanya memindai bahan skincare (`ingredient_scans`), apakah safety score produk boleh memengaruhi "Skor Kulit Wajah"? (Rekomendasi klinis kami: **TIDAK**, skor kulit wajah harus murni dari diagnosis dermatologis wajah). Bagaimana cara mengomunikasikannya di Dashboard jika user baru memiliki riwayat produk tanpa riwayat wajah?
2. **Delta Progres ("+4 Minggu Ini")**:
   - Bagaimana menghitung tren perubahan kondisi kulit yang valid secara klinis? Apakah membandingkan scan wajah terakhir dengan scan 7 hari sebelumnya, atau menggunakan rata-rata bergerak (moving average)?

---

## 4. Invarian yang Tidak Boleh Dirusak

- **Invarian 1**: `universal_ai` di `ai_features` tetap anchor kuota subscription berbayar (jangan tersentuh).
- **Invarian 2**: Konsistensi design system Skincluv (warna signature Deep Teal `#0f6784` via CSS variable `--skincluv-teal`, typography Quicksand/Inter, Scoped CSS).
- **Invarian 3**: Right to be Forgotten (UU PDP No. 27 Tahun 2022) — riwayat scan harus tetap mendukung penghapusan data secara bersih jika pengguna meminta.

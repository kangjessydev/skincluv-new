# Panduan Operasional: Deployment Netlify, Supabase Prod, & Unduh APK Mobile

Dokumen ini memandu transisi dari **Development** ke **Production Komersial** serta cara menghasilkan aplikasi native **Android (.APK)** tanpa perlu menginstal Android Studio atau emulator di laptop Anda.

---

## 1. Menyiapkan Database Supabase Production (Dev vs Prod)

Agar data testing, foto coba-coba, dan saldo koin dummy tidak mencemari lingkungan komersial:

### Langkah di Dashboard Supabase (Tugas Pengguna):
1. Buka [database.new](https://database.new) dan login dengan akun Supabase Anda.
2. Buat Project Baru, beri nama misalnya: `skincluv-prod`.
3. Pilih region terdekat: `Singapore (ap-southeast-1)`.
4. Setelah project siap (sekitar 1–2 menit), buka **Project Settings** -> **API**:
   - Salin **Project URL** (misal: `https://xyzcompany.supabase.co`).
   - Salin **anon / public key**.
   - Salin **Project Reference ID** (terletak di URL browser Anda, e.g. `xyzcompany`).

### Langkah Migrasi Skema Otomatis (Cukup Jalankan di Terminal):
Seluruh 85 migrasi Skincluv sudah siap. Cukup jalankan perintah ini di terminal:
```bash
npx supabase link --project-ref <project-reference-id-prod-anda>
npx supabase db push
```
*Hasil:* Seluruh tabel, fungsi RPC atomik, trigger proteksi Invarian 1 & 2, serta seed benchmark RFC 022 akan langsung terpasang di database Production dalam 30 detik!

---

## 2. Menghubungkan ke Netlify (Komersial Bebas ToS)

Netlify Free Tier sah digunakan untuk komersial tahap awal.

### Langkah di Dashboard Netlify (Tugas Pengguna):
1. Login ke [app.netlify.com](https://app.netlify.com).
2. Klik **Add new site** -> **Import an existing project**.
3. Pilih **GitHub** dan pilih repositori `kangjessydev/skincluv-new`.
4. Konfigurasi build (sudah otomatis terdeteksi dari `netlify.toml`):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Buka **Site configuration** -> **Environment variables**, tambahkan:
   - `VITE_SUPABASE_URL` = *(URL Supabase Production Anda)*
   - `VITE_SUPABASE_ANON_KEY` = *(Anon Public Key Supabase Production Anda)*
6. Klik **Deploy site**.
7. Situs web Skincluv Anda kini aktif secara publik dan aman!

---

## 3. Menghasilkan File Android APK Tanpa Android Studio (GitHub Actions Cloud Builder)

Laptop Anda **tidak perlu menginstal Android Studio atau emulator sama sekali**. Proses kompilasi dijalankan di server cloud GitHub (16GB RAM).

### Langkah di GitHub (Tugas Pengguna):
1. Buka repositori Anda di browser: [github.com/kangjessydev/skincluv-new](https://github.com/kangjessydev/skincluv-new).
2. Buka menu **Settings** -> **Secrets and variables** -> **Actions**:
   - Tambahkan Secret: `VITE_SUPABASE_URL`
   - Tambahkan Secret: `VITE_SUPABASE_ANON_KEY`
3. Buka tab **Actions** di atas repositori GitHub Anda.
4. Di bilah samping kiri, pilih workflow: **Build Android APK (Cloud Runner)**.
5. Klik tombol **Run workflow** -> pilih branch `main` -> klik **Run workflow**.
6. Tunggu sekitar 3 menit hingga status centang hijau (Success).
7. Klik run tersebut, dan di bagian bawah (**Artifacts**) Anda akan melihat file:
   **`skincluv-android-apk`**
8. Klik unduh, ekstrak file zip-nya, dan Anda mendapatkan file **`app-debug.apk`**!
9. Kirim file `.apk` tersebut ke ponsel Android Anda via WhatsApp / Google Drive, lalu klik **Install**.

---

## 4. Ringkasan Pembagian Akses

| Komponen | Siapa yang Mengurus | Lokasi Akses |
| :--- | :--- | :--- |
| **Kompilasi APK Android** | Cloud GitHub Actions | Tab Actions di GitHub |
| **Hosting Web Komersial** | Netlify | `app.netlify.com` |
| **Database Produksi** | Supabase Project Baru | `supabase.com` |
| **Kode & Pengujian AI** | Antigravity AI (`role-asisten`) | Repositori Lokal Laptop |

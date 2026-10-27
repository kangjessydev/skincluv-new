# Matriks Spesifikasi Kebutuhan Fitur (Feature Requirement Matrix & Production DoD)

Dokumen acuan untuk `role-asisten` dan `role-blueprint` dalam merumuskan skenario kebutuhan lengkap, serta untuk `role-backend` dan `role-frontend` agar tidak melakukan jalan pintas (*fast-working asal jadi*).

Setiap fitur yang dirancang **WAJIB** memenuhi Skenario Fungsional & Kriteria Selesai (Definition of Done) di bawah ini.

---

## 1. Modul Autentikasi & Akun Pengguna

### A. Fitur Fundamental (Pondasi Wajib - Non-Negotiable):
- **Registrasi & Validasi:** Input nama, email valid, password kuat (min 8 karakter), validasi inline seketika.
- **Login & Keamanan Sesi:** Login email/password, proteksi brute-force rate-limiting (maks 5x gagal dalam 15 menit per IP).
- **Lupa Password (Reset Flow):** Input email → token reset bertenggat waktu (expired 15 menit) → form password baru. Token hanya valid 1x pakai.
- **Profil User Dasar:** Edit profil, ganti password (wajib konfirmasi password lama).
- **Logout:** Invalidasi token/sesi di server secara aman.

### B. Fitur Lanjutan (Extended / Ekstensi Masa Depan):
- **OAuth Social Login:** Tombol "Masuk dengan Google" atau "GitHub" (OAuth 2.0 / OpenID Connect).
- **Two-Factor Authentication (2FA):** Verifikasi TOTP Authenticator app (Google Authenticator) untuk akun admin/keuangan.
- **Role-Based Access Control (RBAC Granular):** Manajemen hak akses dinamis (Super Admin, Editor, Finance, Customer Service).
- **Session Device Manager:** Melihat daftar perangkat yang sedang aktif login dan opsi "Logout dari semua perangkat lain".

---

## 2. Modul Manajemen Produk & Katalog

### A. Fitur Fundamental (Pondasi Wajib - Anti-Sunat Form):
- **Sisi User:** Grid katalog produk responsif, pencarian teks dasar (debounced 300ms), filter kategori, halaman detail produk lengkap (galeri foto, stok real-time, deskripsi).
- **Sisi Admin (Form CRUD Wajib 100% Cermin Skema Database):**
  - Nama produk, slug unik (bisa diedit), kategori dropdown, SKU unik, harga normal, harga modal/HPP, jumlah stok, threshold stok rendah, textarea deskripsi singkat, rich-text editor deskripsi lengkap, upload multi-gambar (pilih gambar utama), berat pengiriman, status switch (Draft/Published), dan soft-delete (`deleted_at`).

### B. Fitur Lanjutan (Extended / Ekstensi Masa Depan):
- **Varian Produk Multi-Dimensi:** Kombinasi matriks varian (Warna x Ukuran) dengan harga dan stok independen per kombinasi.
- **Harga Grosir / Tiered Pricing:** Diskon kuantitas (misal: beli 10 harga @80.000, beli 50 harga @70.000).
- **Bulk Import / Export Excel/CSV:** Unggah 1.000 produk sekaligus via file spreadsheet dengan validasi baris error.
- **AI Smart Description Generator:** Tombol bantu untuk men-generate copywriting deskripsi produk dari nama & kata kunci.

---

## 3. Modul Keranjang, Checkout & Transaksi

### A. Fitur Fundamental (Pondasi Wajib):
- **Keranjang Belanja (Cart):** Sinkronisasi keranjang belanja, penambahan/pengurangan kuantitas dengan validasi batas stok real-time.
- **Checkout Manual/Dasar:** Input alamat pengiriman, pemilihan metode transfer bank manual atau COD, kalkulasi subtotal.
- **Pembuatan Order & Status Transaksi:**
  - Pembuatan order dengan UUID/nomor invoice unik dan `idempotency_key`.
  - Status order: `Pending` → `Paid` → `Processing` → `Shipped` → `Completed` → `Cancelled`.
  - Pengurangan stok otomatis saat order dibuat, pengembalian stok otomatis jika order dibatalkan.

### B. Fitur Lanjutan (Extended / Ekstensi Masa Depan):
- **Automated Payment Gateway:** Integrasi Midtrans / Xendit / Stripe (Virtual Account otomatis, QRIS, Kartu Kredit, Webhook notifikasi pembayaran realtime).
- **Kalkulasi Ongkos Kirim Otomatis:** Integrasi API ekspedisi (JNE, SiCepat, J&T via RajaOngkir/Biteship) berdasarkan koordinat kecamatan & berat paket.
- **Sistem Diskon & Kupon Promo:** Kupon potongan nominal/persen dengan validasi minimal belanja, batas pemakaian per user, dan periode kedaluwarsa.
- **Program Afiliasi (Affiliate & Referral):** Link referral unik per kreator/affiliator, pelacakan komisi otomatis saat transaksi berhasil, dashboard pencairan saldo komisi.
- **Notifikasi Multi-Channel:** Pengiriman invoice dan resi pengiriman otomatis via WhatsApp Gateway atau transactional email (Resend/SendGrid).

---

## 4. Modul Studio Generatif Media (Drama AI / Content Studio)

### A. Fitur Fundamental (Pondasi Wajib):
- **Editor Naskah & Breakdown Adegan:** Editor teks bab cerita, pemecahan dialog per scene bernomor dan karakter.
- **Karakter Casting & Suara Dasar:** Pemilihan avatar wajah dari library, penetapan model suara TTS dasar per tokoh dengan preview audio.
- **Timeline & Render Asinkronus:** Tombol render adegan, integrasi job queue (Redis), indikator status antrean realtime, video player hasil render dengan opsi download 720p/1080p.
- **Atomic Credit Reservation:** Kuota kredit dipotong saat render dimulai, dan otomatis di-refund jika GPU worker error.

### B. Fitur Lanjutan (Extended / Ekstensi Masa Depan):
- **Voice Cloning Kustom:** Unggah 1 menit rekaman suara untuk membuat model TTS kloning suara pengguna sendiri.
- **Interactive Live Streaming AI Avatar:** Avatar virtual yang siaran langsung membaca chat YouTube/TikTok live dan membalas secara interaktif real-time.
- **Multi-Camera Director Mode:** Pemilihan sudut kamera dinamis (Close-up, Wide shot, Over-the-shoulder) per adegan.
- **Auto Multi-Language Dubbing:** Mengubah bahasa drama ke bahasa Inggris/Jepang/Mandarin secara otomatis dengan lip-sync disesuaikan.

---

## 5. Doktrin Definition of Done (DoD) - Standar Kesiapan Produksi

Sebelum sebuah peran mengklaim tugas "selesai", wajib memenuhi 5 pilar kesiapan produksi:

1. **Kelengkapan Skema:** Tidak ada field tabel yang sengaja diabaikan di antarmuka admin maupun API.
2. **Validasi Dua Sisi (Client & Server):** Frontend menampilkan pesan ramah seketika, dan Backend memvalidasi tipe data & batasan panjang sebelum query DB.
3. **Penyaluran Error Ramah:** Tidak ada error mentah database (seperti `SQLSTATE[23000]`) yang bocor ke layar pengguna. Tampilkan pesan kesalahan manusiawi ("SKU ini sudah digunakan, silakan pilih SKU lain").
4. **State Interaksi:** Tombol aksi wajib memiliki state `disabled` + icon spinner saat request asinkronus sedang dikirim.
5. **Responsif Multi-Device:** Semua halaman form dan tabel wajib dites keterbacaannya pada layar mobile (375px) dan desktop (1440px).

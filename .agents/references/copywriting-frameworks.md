# Kerangka Kerja Copywriting & UX Writing (Anti-AI Text Slop) ✍️

Dokumen acuan untuk `role-copywriter`, `role-frontend`, dan `role-asisten` dalam merumuskan teks antarmuka, microcopy, headline penjualan, dan dokumentasi yang manusiawi, bebas dari basa-basi robotik (*AI Slop*).

---

## 📚 5 Pilihan Kerangka Komunitas Terbuka (Open Attribution)

Setiap kerangka di bawah ini bersumber dari repositori agen open-source komunitas dan dapat dipilih sesuai kebutuhan proyek:

### 1. Direct-Response & Landing Page Conversion
* **Sumber Komunitas:** `coreyhaines31/marketingskills` (`skills/copywriting/SKILL.md`).
* **Fokus:** Menulis headline beranda, value proposition, bagian penawaran harga, dan CTA yang memicu konversi tinggi.
* **Prinsip Utama:**
  - Utamakan hasil nyata bagi pengguna (*Outcome-driven*), bukan sekadar pamer fitur teknis (*Feature-dump*).
  - Gunakan formula PAS (*Problem - Agitate - Solve*) atau BAB (*Before - After - Bridge*).
  - Kejelasan (*Clarity*) selalu mengalahkan kepintaran kata-kata puitis (*Cleverness*).

### 2. Systematic UX Writing & Microcopy
* **Sumber Komunitas:** `content-designer/ux-writing-skill`.
* **Fokus:** Teks tombol, alur onboarding, pesan error, tooltip, dan konfirmasi dialog di dalam aplikasi.
* **Prinsip 4 Pilar UX:**
  - **Purposeful:** Setiap kata harus membantu pengguna menyelesaikan tugasnya saat itu.
  - **Concise:** Singkat, padat, dan menghormati ruang layar (khususnya tampilan mobile).
  - **Conversational:** Bersuara seperti manusia ramah yang sedang berbicara, bukan robot sistem operasi.
  - **Clear:** Hilangkan ambiguitas; jelaskan konsekuensi aksi secara gamblang (misal: "Hapus Akun Permanen" vs sekadar "Lanjutkan").

### 3. UI Microcopy Audit Scanner
* **Sumber Komunitas:** `markj81/ux-writing` (`/ux-microcopy-audit`).
* **Fokus:** Memindai kode komponen frontend yang sudah ada untuk menemukan teks kaku, istilah teknis yang bocor ke pengguna awam, atau tombol tanpa kata kerja aksi.
* **Metode Audit:** Memindai string literal di file `.vue`, `.jsx`, `.tsx`, dan form masukan.

### 4. Accessible Design System Tone
* **Sumber Komunitas:** `plugin87/ux-ui-agent-skills`.
* **Fokus:** Kepatuhan aksesibilitas kognitif (WCAG 2.2), pembaca layar (*screen reader / aria-label*), konsistensi huruf (*sentence case*), dan pemetaan nada bicara brand eksklusif.

### 5. Clear Tech Docs & README
* **Sumber Acuan:** *Google Technical Writing Guidelines* & *Stripe Documentation Style*.
* **Fokus:** Menulis README repositori, panduan instalasi, dan dokumentasi API yang ringkas, to-the-point, dan ramah pemula tanpa jargon yang membingungkan.

---

## 🎨 Opsi 6: Sintesis Mandiri & Protokol Kejujuran (Self-Synthesis & Honesty)

Jika kebutuhan gaya bahasa proyek bersifat unik (misalnya: humor lokal Indonesia, storytelling personal kreator, sarkasme santai, atau drama komedi):

1. **Pencarian Memori Internal:** Asisten menelusuri referensi internal di repositori (`docs/`, `.agents/references/`, persona brand di brief).
2. **Sintesis Gaya Baru:** Asisten merumuskan panduan gaya khusus yang memadukan prinsip UX manusiawi dengan karakter unik tersebut.
3. **Kewajiban Deklarasi Keyakinan (Anti-Ngasal):**
   Asisten **DILARANG MENGARANG BEBAS** dan **WAJIB MENYAMPAIKAN DENGAN JUJUR**:
   - Bagian mana yang **diyakini kuat & tepat** (berdasarkan bukti konteks atau kaidah copywriting solid).
   - Bagian mana yang **masih diragukan / memiliki blindspot** (misal: slang daerah tertentu, batas kesopanan emosional, atau istilah industri spesifik).
   - Meminta koreksi eksplisit dari user sebelum gaya tersebut dikunci.

---

## 🚫 Daftar Terlarang: "AI Text Slop" (Banned Clichés)

Teks yang mengandung frasa di bawah ini **WAJIB DITOLAK DAN DITULIS ULANG**:

| Kategori | Frasa Terlarang (AI Slop) | Gantilah Menjadi (Manusiawi) |
|---|---|---|
| **Basa-Basi Pembuka** | *"Di era digital yang serba cepat dan dinamis ini..."* | **Hapus total.** Langsung masuk ke masalah utama yang dihadapi pengguna. |
| **Pujian Berlebihan** | *"Solusi revolusioner yang mutakhir dan komprehensif..."* | Jelaskan manfaat spesifik: *"Bikin laporan penjualan otomatis dalam 10 detik."* |
| **Tombol Pasif** | *"Submit"*, *"Klik Di Sini"*, *"Lanjutkan"* | Gunakan kata kerja aktif: *"Bungkus Pesanan"*, *"Buat Akun Gratis"*, *"Mulai Belajar"*. |
| **Pesan Error Robotik** | *"Error 422: Validasi input gagal."* | *"Format email belum pas. Coba cek lagi ya, contoh: nama@email.com"*. |
| **Layar Kosong Hambar** | *"Tidak ada data."* | *"Belum ada pesanan di sini. Yuk intip katalog terbaru hari ini!"* |
| **Slogan Mengambang** | *"Buka potensi penuh bisnis Anda bersama kami."* | *"Hemat 15 jam kerja tim tiap minggu tanpa lembur."* |

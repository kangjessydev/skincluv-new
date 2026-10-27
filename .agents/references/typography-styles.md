# Katalog Gaya Tipografi (Typography Archetypes)

Dokumen acuan untuk `role-asisten` dan `role-frontend` dalam menentukan pasangan font (font pairing), hierarki heading, dan karakter keterbacaan.

---

## 1. Editorial Serif Pairing (Luxury, Heritage, Storytelling)
- **Karakter:** Elegan, berkelas, intelektual, klasik modern.
- **Kombinasi Rekomendasi:**
  - Heading Display: `Playfair Display`, `Cormorant Garamond`, atau `Cinzel` (Google Fonts).
  - Body Text: `Inter` atau `Plus Jakarta Sans` (Sans bersih berukuran 15-16px, line-height 1.7) agar teks panjang tetap mudah dibaca.
- **Aturan Heading:**
  - Huruf kapital dengan letter-spacing lebar pada sub-heading: `uppercase tracking-[0.2em] text-xs font-medium`.
- **Penggunaan:** Resort mewah, majalah editorial, fine dining, firma hukum, artikel esai mendalam.

---

## 2. Modern Tech Neo-Grotesque (SaaS, Minimal, Dashboard)
- **Karakter:** Netral, fungsional, tidak bias, sangat tajam di layar resolusi tinggi (Retina display).
- **Kombinasi Rekomendasi:**
  - Font Utama (All-in-One): `Inter`, `Geist Sans`, atau sistem font native OS (`system-ui, -apple-system, sans-serif`).
- **Aturan Body & Heading:**
  - Heading: Weight `font-semibold` (600) atau `font-bold` (700) dengan sedikit negative tracking: `tracking-tight` (-0.02em) pada ukuran font besar.
  - Body: Regular (400) atau Medium (500) dengan line-height 1.5.
- **Penggunaan:** Dashboard produktivitas, aplikasi enterprise, cloud tools, antarmuka admin.

---

## 3. Geometric Modern Sans (Consumer Brand, Tech Startup, Creative)
- **Karakter:** Ramah, percaya diri, modern, lingkaran geometris sempurna (huruf 'o', 'g').
- **Kombinasi Rekomendasi:**
  - Heading: `Outfit`, `Plus Jakarta Sans`, atau `Poppins`.
  - Body: `Inter` atau `Plus Jakarta Sans`.
- **Aturan Heading:**
  - Sangat menonjol di ukuran besar (H1 40px - 56px) dengan kontras warna tegas.
- **Penggunaan:** Landing page B2C, fintech anak muda, aplikasi mobile, creative agencies.

---

## 4. Cyber / Developer Monospace (Studio AI, Code, Terminal, Web3)
- **Karakter:** Presisi, mekanik, data-driven, estetika hacker/studio.
- **Kombinasi Rekomendasi:**
  - Primary UI / Data Meta: `JetBrains Mono`, `Geist Mono`, atau `Fira Code`.
  - Heading Display: Bisa dipadu dengan Sans tebal atau Monospace murni.
- **Aturan Khusus:**
  - Tampilkan metadata (timestamp, tag status, commit hash, nilai angka koordinat) selalu dalam Monospace dengan ukuran kompak (11-13px).
- **Penggunaan:** Drama AI studio, dashboard analitik server, Web3 dApps, dev tools.

---

## 5. Tabular Numeric Rule (Wajib untuk Semua Data Angka & Finansial)
- **Aturan Kritis:** Setiap komponen yang menampilkan angka berurutan (tabel harga, saldo, countdown timer, counter stok) **WAJIB** menerapkan properti CSS:
  ```css
  font-variant-numeric: tabular-nums;
  ```
- **Alasan:** Mencegah angka bergoyang (layout jitter) saat nilai berubah (misal: angka `1` dan `8` memiliki lebar horizontal yang sama persis).

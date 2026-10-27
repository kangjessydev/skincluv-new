# Katalog Jenis Aset Visual (Visual Asset Archetypes)

Dokumen acuan untuk `role-asisten` saat mengonfirmasi kebutuhan aset dengan user, dan untuk `role-frontend` saat mengintegrasikan aset ke UI.

---

## 1. Fotografi Nyata / Editorial Photography
- **Karakteristik:** Menggunakan foto manusia, tempat, produk, atau arsitektur nyata dengan pencahayaan profesional.
- **Kesan:** Kredibel, autentik, manusiawi, luxury/eksklusif.
- **Standar Teknis:**
  - Format Wajib: Format modern berbobot ringan (`.webp` atau `.avif`), bukan `.png` atau `.jpg` mentah berukuran megabyte.
  - Aspek Rasio Baku: 16:9 (Hero banner landscape), 4:3 / 1:1 (Katalog produk), 3:4 (Potret/Editorial).
  - Optimasi: Wajib menyertakan atribut `loading="lazy"` (kecuali foto hero di atas lipatan layar yang wajib `fetchpriority="high"`).
- **Cocok Untuk:** Resort/Hotel, E-Commerce fashion/makanan, Company profile korporat, Media berita.

---

## 2. 3D Renders & Interactive 3D (WebGL / Spline / Three.js)
- **Karakteristik:** Objek bervolume, pencahayaan dinamis, material glossy/glass/metallic, atau model interaktif yang bisa diputar kursor.
- **Kesan:** Futuristik, mutakhir (cutting-edge), teknologi tinggi, premium modern.
- **Standar Teknis:**
  - Static 3D: Ekspor sebagai `.webp` transparan atau video loop pendek `.webm` (jangan gunakan PNG ratusan KB).
  - Interactive WebGL/Three.js: Wajib membatasi polycount model (<50.000 poligon), kompresi tekstur basis/KTX2, dan pastikan mematikan render loop saat canvas tidak terlihat di viewport (IntersectionObserver) agar GPU laptop/HP user tidak panas.
- **Cocok Untuk:** Landing page produk teknologi/gadget, platform Web3/Kripto, AI Studio, portfolio kreatif.

---

## 3. 2D Flat & Clean Line Vector (Icon & Illustration)
- **Karakteristik:** Ilustrasi berbasis bentuk geometris bersih, outline tipis elegan, atau palet warna datar tanpa gradien berlebihan.
- **Kesan:** Jelas, mudah dipahami seketika, ringan, ramah.
- **Standar Teknis:**
  - Format Wajib: SVG murni (Scalable Vector Graphics) yang telah di-optimize via SVGO (hapus metadata tidak berguna).
  - Ketebalan Garis: Konsisten di seluruh UI (misal: semua icon wajib menggunakan stroke `1.5px` atau `2px`, jangan campur-aduk icon tipis dan tebal).
- **Cocok Untuk:** SaaS Dashboard, aplikasi produktivitas, portal perbankan, form wizard langkah-demi-langkah.

---

## 4. Hand-Drawn & Sketched / Doodle
- **Karakteristik:** Goresan tangan organik, garis tidak simetris, coretan stabilo/panah petunjuk, aksen tulisan tangan.
- **Kesan:** Bersahabat, hangat, kasual, tidak mengintimidasi, berjiwa muda.
- **Standar Teknis:**
  - Gunakan sebagai aksen penunjuk (misal: lingkaran melingkari kata kunci di hero headline, atau panah menunjuk tombol CTA), jangan mendominasi seluruh card data.
- **Cocok Untuk:** Platform edukasi anak muda, produk komunitas independen, newsletter personal, landing page indie hacker.

---

## 5. Generative AI Media & Dynamic Canvas
- **Karakteristik:** Gambar, avatar, atau video yang digenerate on-the-fly oleh AI berdasarkan prompt atau naskah pengguna.
- **Kesan:** Canggih, personalisasi tak terbatas, dinamis.
- **Standar Teknis:**
  - Wajib menyediakan **Placeholder Skeleton** dan status download bertahap saat aset sedang digenerate di server.
  - Sediakan fallback image statis jika layanan API generative AI mengalami rate limit atau downtime.
- **Cocok Untuk:** Drama AI, avatar streamer studio, AI photo generator, tool kreatif.

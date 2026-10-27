# Katalog Gaya Desain (Design Style Archetypes)

Dokumen acuan untuk `role-asisten`, `role-blueprint`, dan `role-frontend`.
Gaya desain bersifat **independen dari jenis website**. Pengguna bisa memilih jenis website apa saja (misal: Hotel, E-commerce, atau Portofolio) lalu memadukannya dengan gaya desain di bawah ini.

---

## 1. Minimalist Clean (Modern Minimal)
- **Karakter Visual:** Bersih, lapang, berfokus murni pada konten dan hierarki ruang putih (whitespace), tanpa ornamen hiasan yang tidak berguna.
- **Token Baku:**
  - Border Radius: `rounded-sm` (2px - 4px) atau `rounded-md` (6px). Garis tepi sangat tipis (`1px border-slate-200/border-zinc-800`).
  - Spacing & Padding: Lega dan proporsional. Tidak ada elemen yang saling berebut perhatian.
  - Palet Warna: Monokromatik (putih, abu-abu slate/zinc, hitam) dengan maksimal satu warna aksen fungsional untuk tombol CTA.
  - Shadow: Sangat lembut atau ditiadakan (`shadow-none` hingga `shadow-sm`).
- **Cocok Untuk:** Web portfolio arsitektur, hotel butik modern, SaaS produktivitas, blog pemikiran esai, brand pakaian minimalis.

---

## 2. Luxury & Editorial Elegance
- **Karakter Visual:** Megah, eksklusif, lambat, bernilai tinggi (high prestige). Memberikan kesan mahal dan timeless.
- **Token Baku:**
  - Border Radius: `rounded-none` (0px tajam kaku) atau `rounded-sm` (maksimal 2px).
  - Tipografi: Wajib display Serif untuk judul (Playfair Display, Cinzel, Cormorant Garamond), dipadu dengan clean sans tipis ber-letter-spacing lebar (`tracking-widest uppercase`).
  - Palet Warna: Deep Charcoal, Off-White/Cream, Warm Stone, aksen Bronze/Muted Gold atau Champagne (bukan kuning norak).
  - Spacing: Sangat luas (Section padding 120-160px), margin foto besar layaknya majalah cetak Vogue/Kinfolk.
- **Cocok Untuk:** Resort & hotel bintang lima, properti mewah, brand jam tangan/perhiasan, firma hukum elit, restoran fine dining.

---

## 3. Dark Studio & Cybernetic (Creative Studio)
- **Karakter Visual:** Imersif, fokus tinggi, bernuansa ruang kerja software kreatif profesional.
- **Token Baku:**
  - Border Radius: `rounded-xl` (10px - 14px) untuk card dan kanvas editor.
  - Latar Belakang: Tingkatan hitam berlapis (Background: `#09090b` / Zinc-950, Surface Card: `#18181b` / Zinc-900, Border: `#27272a` / Zinc-800).
  - Aksen: Glow fungsional lembut (neon indigo, purple, atau cyan dengan opacity 20-30%) untuk menunjukkan state aktif/fokus.
  - Tekstur: Glassmorphism halus (`backdrop-blur-md bg-zinc-900/70`) pada header melayang dan floating toolbars.
- **Cocok Untuk:** Drama AI, video editor web, platform musik/podcast, crypto/Web3 dashboard, AI tool interface.

---

## 4. Corporate High-Trust & Enterprise
- **Karakter Visual:** Stabil, andal, formal, aman, berorientasi data dan kepatuhan.
- **Token Baku:**
  - Border Radius: `rounded-md` (6px) standar industri.
  - Palet Warna: Navy blue, deep royal blue, slate grey, dengan aksen hijau emerald untuk indikator sukses/keamanan.
  - Struktur: Grid 12 kolom yang simetris dan dapat diprediksi. Card dengan border tegas dan shadow lembut (`shadow-sm`).
  - Densitas: Sedang hingga tinggi (informasi mudah dipindai oleh eksekutif/manajer).
- **Cocok Untuk:** Perbankan, fintech B2B, asuransi, software HR/ERP, portal kesehatan/medis.

---

## 5. Playful Neo-Brutalism & Modern Retro
- **Karakter Visual:** Berani, eksperimental, menyenangkan, ramah generasi muda, penuh energi visual.
- **Token Baku:**
  - Border & Stroke: Garis tepi hitam tebal nyata (`2px` atau `3px solid black`).
  - Shadow: Hard drop shadow tanpa blur (`box-shadow: 4px 4px 0px 0px #000000`).
  - Border Radius: Campuran antara kaku kotak (`0px`) atau pil bulat penuh (`rounded-full`).
  - Palet Warna: Warna cerah saturasi tinggi (kuning lemon, lavender cerah, mint green, oranye pop) dipadu kontras teks hitam pekat.
- **Cocok Untuk:** Produk creator economy, tool edukasi, event kreatif, brand anak muda, komunitas gaming/pop culture.

---

## 6. Warm Organic & Handcrafted (Earthy Natural)
- **Karakter Visual:** Ramah lingkungan, manusiawi, hangat, autentik, tidak kaku seperti mesin.
- **Token Baku:**
  - Border Radius: `rounded-2xl` (16px) hingga kurva asimetris organik.
  - Palet Warna: Terracotta, olive green, warm clay, oatmeal linen, sage.
  - Tekstur: Aksen kertas daur ulang (subtle noise grain), pembatas bergelombang halus.
- **Cocok Untuk:** Brand kopi/kafe, produk ramah lingkungan (eco-friendly), komunitas wellness/yoga, pertanian organik, kerajinan tangan.

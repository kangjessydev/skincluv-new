# Handoff 009: Asisten ke Frontend - Redesign Bottom Sheet Panduan Scan Komposisi

- **Pengirim**: `/role-asisten`
- **Penerima**: `/role-frontend`
- **Tanggal**: 2026-10-31
- **Status**: Open

---

## 1. Latar Belakang & Masalah
Pada halaman Scan Komposisi (`IngredientScanPage.tsx`), bottom sheet panduan membaca label (ikon tanda tanya `?`) dilaporkan kurang sesuai dengan standar aplikasi mobile:
1. **Kartu Profil Kulit Kaku**: Menggunakan format alert box dengan garis tepi teal tebal dan paragraf teks panjang.
2. **3 Prinsip Membaca Label Monoton**: Disajikan sebagai 3 kotak terpisah yang bertumpuk vertikal (layout desktop yang diperkecil), memakan ruang layar ponsel.

## 2. Arahan Solusi
1. **Redesign Kartu Profil Kulit (Gaya Bento Kertas / Paspor)**:
   - Mengadopsi estetika `.cluv-bento-wallet`: background gradasi hangat krem-gold, border halus emas/amber, sudut melengkung 20px, garis putus-putus (*dashed line*).
   - Tipe kulit ditampilkan besar dan tegas dengan badge status sinkronisasi.
   - Dua metrik ringkas di bawah: Fokus Perhatian (*concerns*) dan Status Analisis AI (*Cocok Otomatis*).
2. **Redesign 3 Prinsip Membaca Label (1 Kartu Terpadu Numbered Guide)**:
   - Satukan ke dalam 1 kartu bersih dengan 3 butir berpenomoran bulat (`1`, `2`, `3`) dan garis pemisah halus.
   - Teks to-the-point dan scannable.

## 3. Kriteria Selesai (Definition of Done)
- [ ] Kartu profil kulit di bottom sheet menggunakan desain Bento bernuansa kertas to-the-point.
- [ ] 3 prinsip membaca label di bottom sheet disatukan ke dalam 1 kartu terpadu berpenomoran rapi.
- [ ] `tsc -b && vite build` lulus 0 error.

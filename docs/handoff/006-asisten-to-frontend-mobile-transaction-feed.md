# Handoff: 006-asisten-to-frontend-mobile-transaction-feed

- **Dari Peran**: `/role-asisten`
- **Ke Peran**: `/role-frontend`
- **Tanggal**: 2026-10-30
- **Status**: completed
- **Tujuan**: Merombak tampilan `src/pages/app/TransactionHistoryPage.tsx` menjadi Clean Feed List ala aplikasi mobile modern (GoPay / App Store Subscriptions) dengan grouping bulan dan BottomSheet Detail Transaksi.

---

## 1. Konteks Masalah
Tampilan saat ini menggunakan pola *Desktop Ledger / Invoice Table* yang diperkecil ke mobile:
- Nomor invoice `INV-...` panjang mendominasi pandangan pengguna.
- Tab filter terpotong di tepi kanan layar mobile.
- Kartu terlalu tinggi (~180px) dan hanya muat 2 transaksi per layar.
- Tidak ada interaksi tap detail transaksi yang lazim di mobile apps.

---

## 2. Spesifikasi Desain & Fitur (In Scope)

### A. Filter Chips Horizontal Scroll
- Ganti tab kaku desktop dengan **Horizontal Pill Chips**:
  - `Semua (N)`
  - `Belum Dibayar (N)`
  - `Lunas (N)`
  - `Kadaluarsa / Gagal (N)`
- Mendukung scroll horizontal mulus di mobile (`overflow-x: auto; scrollbar-width: none;`).

### B. Pengelompokan Berdasarkan Periode (Date Grouping)
- Transaksi dikelompokkan secara otomatis berdasarkan Bulan & Tahun (misal: `Oktober 2026`, `September 2026`).
- Menggunakan header pemisah periode yang bersih dan ringan.

### C. Clean Feed Transaction Row (Tap-Friendly)
Setiap baris transaksi didesain kompak (~72px-80px), ramah jempol, dan mencakup:
- **Kiri**: Icon Kategori (misal Icon Mahkota / Sparkle / CreditCard) dengan wrapper rounded pastel Cluv.
- **Tengah**:
  - Judul Paket (`Skincluv PRO — 1 Bulan`).
  - Subteks: Tanggal singkat (`27 Okt, 17:10`) & info metode pembayaran.
- **Kanan**:
  - Nominal harga tebal (`Rp 49.000`).
  - Badge status mikro (`LUNAS` teal, `MENUNGGU` gold, `BATAL` neutral).
  - Chevron right (`›`) halus penanda interaktif.

### D. BottomSheet Detail Transaksi Resmi
- Ketika transaksi di-tap, buka modal kanonikal `<BottomSheet>` resmi (`import { BottomSheet } from '@/components/ui'`).
- Memuat rincian nota digital lengkap:
  1. Header Status & Total Nominal besar.
  2. Rincian Produk & Masa Berlaku.
  3. Nomor Referensi Merchant (dengan tombol `Salin / Copy`).
  4. Waktu Pembuatan & Waktu Bayar.
  5. Tombol Aksi:
     - Jika `UNPAID`: Tombol primer *"Bayar Sekarang"* mengarah ke `/checkout/{merchant_ref}`.
     - Jika `PAID`: Tombol sekunder bantuan / salin ref.

---

## 3. Di Luar Cakupan (Out of Scope)
- Mengubah skema database `tripay_invoices`.
- Mengubah endpoint backend atau API payment gateway Tripay.

---

## 4. Kriteria Selesai (Definition of Done)
- [x] Tab filter dapat digulir horizontal di mobile tanpa terpotong kaku.
- [x] Transaksi tersusun rapi dalam grup bulan dengan nomor invoice tidak lagi mendominasi baris utama.
- [x] Setiap transaksi dapat di-tap untuk membuka `<BottomSheet>` detail nota digital.
- [x] Tombol bayar pada tagihan `UNPAID` berfungsi normal.
- [x] Tampilan tetap rapi dan seimbang di desktop (`.cluv-canvas-focused`).
- [x] Bebas inline style dan kode warna hardcoded (mematuhi Cluv Design System).
- [x] Lolos verifikasi build `tsc -b && vite build` (0 error).

# Laporan Implementasi: Redesign Mobile Gamifikasi Misi Glow V2

- **Peran**: `/role-frontend`
- **Tanggal**: 2026-10-30
- **Status**: Selesai (Completed)
- **Handoff Terkait**: `docs/handoff/007-asisten-to-frontend-mobile-missions-redesign-v2.md`

---

## 1. Ringkasan Perubahan
Mengeksekusi penyempurnaan desain antarmuka mobile halaman **Misi Glow & Hadiah** (`src/pages/app/MissionsPage.tsx`) dan Topbar navigasi (`src/components/layout/AppLayout.tsx`) sesuai referensi visual pengguna:

1. **Bento Wallet Card Kanonikal (`.cluv-bento-wallet`)**:
   - Mengadopsi format kartu saldo dari Riwayat Koin (Gambar 1).
   - Menampilkan total saldo AI Credits tebal dengan unit emas di header.
   - Pojok kanan dilengkapi badge status dinamis (`X Siap Klaim` pulsing teal atau `Reset 00:00`).
   - Garis pemisah putus-putus dan 2 kolom metrik:
     - Kiri: **Total Diperoleh** (`+X Credits` warna teal) dari akumulasi `coin_transactions`.
     - Kanan: **Progres Misi Hari Ini** (`X dari Y Selesai (Z%)` warna teal/dark).

2. **Kapsul Kredit Topbar Mobile (`AppLayout.tsx`)**:
   - Menampilkan kapsul interaktif `⚡ 1.387 | +` (Gambar 3) di Topbar kanan pada rute `/missions`.
   - Mengetuk tombol `+` langsung mengarahkan pengguna ke rute `/pricing` untuk pembelian paket / isi ulang AI Credits.

3. **Dropdown Filter Popover Kompak (`.cluv-filter-trigger-btn` + menu)**:
   - Menggantikan horizontal chip bar (Gambar 4) dengan dropdown popover kompak di sisi kanan bar judul misi.
   - Pilihan filter: *Semua*, *Harian*, *Mingguan*, dan *Prestasi* lengkap dengan counter jumlah misi dan centang teal saat aktif.
   - Otomatis tertutup saat opsi dipilih atau ketika pengguna menyentuh area luar (*outside click listener*).

4. **Timeline Gamifikasi Check-in Harian (7-Day Streak)**:
   - Misi Login Harian dipisahkan dari daftar reguler dan disajikan sebagai kartu gamifikasi khusus di bagian teratas feed.
   - Menampilkan 7 node horizontal (H1 s/d H7):
     - Hari lalu: Lingkaran centang hijau `✓` (`.is-claimed`).
     - Hari ini: Ring aktif bercahaya emas (`.is-active`) dengan nilai reward `+2`.
     - Hari mendatang: Lingkaran koin terkunci (`.is-locked`).
     - Hari ke-7: Kado spesial akhir pekan (`.is-gift` dengan ikon `<Gift />`).
   - Tombol aksi terpadu: *"Check-in Sekarang (+2 Credits) ⚡"* atau *"Sudah Check-in Hari Ini (Reset 00:00)"* yang memicu RPC `claim_mission` atomik.

5. **Simple Mission Task Cards (Minimalis & Compact)**:
   - Kartu misi reguler (Gambar 5) disederhanakan total tanpa squircle icon besar, tanpa badge "Harian" yang berulang, dan tanpa progress bar tebal.
   - Memuat:
     - Sisi Kiri: Nama Misi (14px bold), deskripsi ringkas, dan reward `+X Credits` (emas bold).
     - Sisi Kanan: Tombol aksi langsung (`Klaim ⚡`, `Scan`, `Pindai`, `Tanya AI`, `Isi Profil`) atau badge `Diklaim`.
   - Mengurangi tinggi kartu hingga ~40%, mencegah kejenuhan scrolling (*scroll fatigue*) di perangkat mobile.

---

## 2. Bukti Pengujian & Verifikasi
- **Kompilasi TypeScript & Bundling Vite**:
  - `tsc -b && vite build` lulus 100% (0 error, build time 3.62s).
- **Semantik & Aksesibilitas**:
  - Semua pemicu interaksi menggunakan elemen semantik `<button type="button">` atau `<Button>`.
  - Format angka moneter dan progres menerapkan `cluv-tabular-nums`.
  - Zero Layout Shift: Feedback notifikasi mengambang via `<Toast>`.

---

## 3. Berkas yang Diubah
- `src/pages/app/MissionsPage.tsx`
- `src/styles/cluv/components/cards.css`
- `src/components/layout/AppLayout.tsx`
- `CHANGELOG.md`

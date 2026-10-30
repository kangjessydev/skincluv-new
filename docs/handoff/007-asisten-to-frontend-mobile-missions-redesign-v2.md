# Handoff: 007-asisten-to-frontend-mobile-missions-redesign-v2

- **Dari Peran**: `/role-asisten`
- **Ke Peran**: `/role-frontend`
- **Tanggal**: 2026-10-30
- **Status**: open
- **Tujuan**: Merombak tampilan mobile halaman Misi Glow (`src/pages/app/MissionsPage.tsx`) dan Topbar (`src/components/layout/AppLayout.tsx`) sesuai referensi desain baru (Bento Wallet Card, Dropdown Filter, Simple Mission Row, dan Hardcoded Daily Check-in Streak Timeline).

---

## 1. Konteks Masalah & Kebutuhan Pengguna
Berdasarkan feedback visual pengguna:
1. **Kotak Saldo Kredit**: Mengadopsi gaya Bento Wallet Card dari halaman Mutasi Koin (`.cluv-bento-wallet`), di mana header menampilkan total saldo AI Credits, dan bagian bawah 2 kolom menampilkan `Total Diperoleh` di kiri serta `Progres Misi Hari Ini` di kanan (menggantikan "Total Digunakan").
2. **Topbar Mobile Action**: Menampilkan kapsul interaktif kredit (`⚡ 1.387 | +`) di sisi kanan Topbar pada rute `/missions` (identik dengan `/coin-history`).
3. **Filter Kategori Mobile**: Mengganti deretan chip horizontal dengan **Dropdown Menu Filter** kompak (seperti di `CoinHistoryPage.tsx` / `ScanHistoryPage.tsx`) agar hemat ruang vertikal.
4. **List Kartu Misi Minimalis**: Menyederhanakan kartu misi biasa (menghapus icon squircle besar, badge "Harian/Mingguan", dan progress bar berulang) menjadi baris tugas simpel: Nama Misi + Reward `+X Credits` + Tombol Aksi/Klaim.
5. **Timeline Gamifikasi Check-in Harian**: Khusus untuk Misi Login Harian, dibuatkan komponen timeline gamifikasi 7 Hari (Day 1 - Day 7 Streak) khas aplikasi mobile populer (Gojek / Shopee Games / Duolingo).

---

## 2. Rincian Spesifikasi Desain & Fitur (In Scope)

### A. Bento Credit Card Mobile (`.cluv-bento-wallet`)
- Menggunakan struktur kanonikal `.cluv-bento-wallet` yang sudah ada di `cards.css`:
  - **Header**: `⚡ TOTAL SALDO AI CREDITS` + Nilai Besar `1.387 Credits`.
  - **Pojok Kanan**: Badge status `X Siap Klaim` (pulsing teal) atau `Reset 00:00`.
  - **Divider**: Garis putus-putus halus.
  - **2 Kolom Bawah**:
    - Kiri: `Total Diperoleh` (`+{totalIncome} Credits` warna teal).
    - Kanan: `Progres Misi Hari Ini` (`X/Y Selesai (Z%)` warna navy/dark).

### B. Topbar Right Action Capsule (`AppLayout.tsx`)
- Mengaktifkan `.cluv-credit-capsule` di Topbar saat user berada di rute `/missions`:
  ```tsx
  location.pathname.startsWith('/coin-history') || location.pathname.startsWith('/missions')
  ```
- Mengetuk tombol `+` mengarahkan pengguna ke `/pricing` (Beli AI Credits).

### C. Dropdown Filter Mobile
- Menggantikan `.cluv-filter-scroll` di mobile dengan komponen dropdown filter (`.cluv-filter-trigger-btn` + menu popover):
  - Label aktif: *"Semua (13)"*, *"Harian (3)"*, *"Mingguan (3)"*, *"Milestone (7)"*.
  - Dilengkapi ikon `Filter` dan panah chevron, menutup otomatis saat opsi dipilih atau saat klik di luar area.

### D. Simple Mission Task Rows
- Misi standar (non-login) disajikan dalam format kartu ramping:
  - **Sisi Kiri**: Judul Misi (tebal), keterangan singkat 1 baris, dan label reward `+X Credits` emas (`tabular-nums`).
  - **Sisi Kanan**: Tombol aksi langsung (`Klaim Hadiah ⚡`, `Mulai Scan`, `Pindai Produk`, `Tanya AI`) atau badge `Diklaim`.
  - Menghilangkan: Icon squircle besar, badge kategori ganda, dan progress bar berulang.

### E. Gamified 7-Day Daily Check-in Timeline (Hardcoded Component)
- Card khusus di atas feed misi biasa: *"Check-in Harian (Streak)"*.
- Grid/Flex 7 hari (Hari 1 hingga Hari 7):
  - **Hari 1**: +1 Credit (Centang `✓` hijau jika sudah lewat/diklaim).
  - **Hari 2**: +2 Credits (Centang `✓` hijau jika sudah lewat/diklaim).
  - **Hari 3**: +2 Credits (Aktif / Hari Ini dengan ring glow teal dan tombol klaim).
  - **Hari 4**: +3 Credits (Terkunci / abu-abu).
  - **Hari 5**: +3 Credits (Terkunci / abu-abu).
  - **Hari 6**: +4 Credits (Terkunci / abu-abu).
  - **Hari 7**: +10 Credits 🎁 (Peti Harta / Hadiah Spesial Akhir Pekan).
- Tombol aksi utama: *"Check-in Hari Ini (+2 Credits)"* atau status *"Sudah Check-in Hari Ini"*.

---

## 3. Di Luar Cakupan (Out of Scope)
- Mengubah RPC database Supabase `claim_mission_reward`.
- Mengubah tampilan desktop (> 879px) yang sudah stabil.

---

## 4. Kriteria Selesai (Definition of Done)
1. Tampilan mobile Misi Glow mencerminkan gaya Bento Wallet Card (Gambar 1) dengan kolom kanan progres misi hari ini.
2. Topbar kanan menampilkan kapsul kredit (Gambar 3).
3. Filter kategori mobile berbentuk dropdown menu popover yang rapi.
4. Kartu misi standar bersih, ramping, tanpa icon/badge/progress bar yang berlebihan.
5. Daily Check-in tampil sebagai timeline gamifikasi 7 hari yang interaktif.
6. Lolos kompilasi `npm run build` (`tsc -b && vite build`) 0 error.

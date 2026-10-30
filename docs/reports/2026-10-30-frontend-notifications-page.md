# Laporan Implementasi: Pusat Notifikasi Mobile & Desktop (/notifications)

- **Peran**: `/role-frontend`
- **Tanggal**: 2026-10-30
- **Status**: Selesai (Completed)
- **Rute Baru**: `/notifications`

---

## 1. Ringkasan Perubahan
Membangun dan meluncurkan fitur **Pusat Notifikasi Aplikasi** (`src/pages/app/NotificationsPage.tsx`) dengan pendekatan mobile-first yang responsif, berorientasi tindakan (*actionable microcopy*), dan terintegrasi langsung dengan ekosistem data pengguna:

1. **Kanvas Kanonikal & Navigasi**:
   - Menerapkan `.cluv-canvas-focused` (`layout.css`) dengan layout responsif mobile-first.
   - Mengintegrasikan rute baru `/notifications` ke `App.tsx` (Lazy loaded route) dengan proteksi autentikasi.
   - Mendaftarkan rute ke dalam `isSubpage` di `AppLayout.tsx` sehingga bottom navigation bar otomatis disembunyikan (*hidesBottomBarWhenPushed*) dan judul Topbar menampilkan panah kembali `← Notifikasi`.
   - Menghubungkan ikon lonceng (*Bell*) di Topbar (desktop dan mobile) agar langsung bernavigasi ke `/notifications`.

2. **Kategori Notifikasi Kontekstual & Actionable Feed**:
   Mengkonsolidasikan event pengguna ke dalam 4 kategori praktis tanpa spam notifikasi:
   - **Transaksi & Tagihan (`/transactions`)**:
     - *Invoice Menunggu Pembayaran*: Menampilkan tenggat waktu, nominal tagihan, dan tombol *"Bayar Sekarang →"*.
     - *Pembayaran Berhasil*: Konfirmasi paket aktif dan nominal transaksi yang telah lunas.
   - **Misi & Credits (`/missions`)**:
     - *Misi Siap Diklaim*: Mendeteksi misi yang selesai dan siap diambil koinnya (`+X Credits`).
     - *Check-in Harian*: Pengingat check-in streak hari ini agar streak kado tidak terputus.
   - **Skin Journey (`/history`)**:
     - *Rutinitas Scan 7 Hari*: Pengingat berkala jika pemindaian wajah terakhir sudah lewat dari 7 hari.
     - *Observasi Skor Kulit*: Ringkasan skor kesehatan kulit terkini.
   - **Wawasan AI Skinsistant (`/chat`)**:
     - *Tips Personal*: Rekomendasi perawatan cerdas yang disesuaikan dengan jenis kulit pengguna (`skin_type` & `skin_concerns` dari profil aktif).

3. **Interaksi & Manajemen Status Baca (Read State)**:
   - Tab filter horizontal kompak: *Semua*, *Transaksi*, *Misi & Hadiah*, *Aktivitas & AI* dengan badge indikator unread count.
   - Tombol *"Tandai Semua Dibaca"* untuk mereset status unread secara instan.
   - Klik/tap pada item notifikasi otomatis menandai notifikasi tersebut sebagai sudah dibaca dan mengarahkan pengguna langsung ke halaman target (*deep-linking*).
   - Persistence status baca disimpan rapi di `localStorage` per user ID (`skincluv_read_notifs_${userId}`) dan men-dispatch event global `cluv:notifications-updated`.

4. **Desain Komponen Kanonikal Cluv (`cards.css`)**:
   - Menambahkan class feed kanonikal: `.cluv-notif-item`, `.cluv-notif-left`, `.cluv-notif-icon-wrap` (`.is-teal`, `.is-gold`, `.is-purple`, `.is-rose`), `.cluv-notif-content`, `.cluv-notif-title-row`, `.cluv-notif-dot`, `.cluv-notif-time`.
   - Menggunakan 100% token warna CSS variables (`var(--cluv-*)`) tanpa hardcoded hex.
   - Micro-interaction hover dan active scaling yang halus (120-200ms).

---

## 2. Bukti Pengujian & Verifikasi
- **Kompilasi TypeScript & Bundling Vite**:
  - `npm run build` (`tsc -b && vite build`) lulus 100% tanpa error:
    - Output chunk: `dist/assets/NotificationsPage-DZgvbae3.js` (9.13 kB │ gzip: 2.85 kB)
    - Total build time: 4.18s
- **Semantik & Aksesibilitas**:
  - Elemen daftar notifikasi menggunakan interaktif `role="button"` dengan `tabIndex={0}` dan handler `onKeyDown` (Enter / Space).
  - Chip filter menggunakan semantic `<button type="button">`.
  - Format angka moneter dan waktu menerapkan `cluv-tabular-nums`.

---

## 3. Berkas yang Diubah / Dibuat
- `src/pages/app/NotificationsPage.tsx` *(Dibuat)*
- `src/styles/cluv/components/cards.css` *(Dimodifikasi)*
- `src/App.tsx` *(Dimodifikasi)*
- `src/components/layout/AppLayout.tsx` *(Dimodifikasi)*
- `CHANGELOG.md` *(Dimodifikasi)*

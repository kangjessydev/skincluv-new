# Laporan Pengerjaan: Desktop Notification Popover Dropdown & Full-Width Canvas

**Tanggal**: 2026-10-31  
**Peran**: `role-frontend` / Lead Engineer  
**Topik**: Transformasi Notifikasi Desktop Menjadi Popover Dropdown & Penyesuaian Kanvas Penuh Halaman `/notifications`

---

## 1. Ringkasan Perubahan

Sesuai instruksi dan kesepakatan desain desktop:

1. **Desktop Notifications Popover Dropdown (`AppLayout.tsx`, `shell.css`)**:
   - Di desktop, tombol lonceng (*Bell*) pada Topbar tidak lagi langsung berpindah ke halaman `/notifications`.
   - Tombol kini memicu **Popover Dropdown** mengambang (`.cluv-topbar-notif-dropdown`) dengan lebar 380px, radius 20px, animasi pop lembut, dan bayangan elevasi halus.
   - **Limit Pesan**: Menampilkan hingga 6 notifikasi terbaru (`notifications.slice(0, 6)`) dengan icon wrap pastel, judul, waktu, cuplikan pesan 2 baris, dan penanda dot unread.
   - **Interaksi & Aksi**:
     - Klik item: menandai sebagai dibaca (`markAsRead`), menutup dropdown, dan mengarahkan ke target aksi (`actionUrl`).
     - Tombol cepat *"Tandai Dibaca"* di header popover.
     - Tautan *"Lihat Semua Notifikasi (N)"* di footer popover untuk navigasi ke riwayat lengkap di `/notifications`.
   - **Outside Click & Route Change**: Otomatis tertutup saat pengguna mengklik area luar atau berpindah rute.
   - **Mobile Parity**: Tombol notifikasi di mobile tetap mengarah langsung ke halaman `/notifications` agar nyaman dioperasikan satu tangan.

2. **Full-Width Canvas Halaman Notifikasi Desktop (`NotificationsPage.tsx`)**:
   - Mengubah wrapper root kanvas dari `.cluv-canvas-focused` (yang dibatasi 760px dan menyisakan ruang kosong di kanan) menjadi **`.cluv-canvas-grid`** (Kanvas Tipe A 1240px penuh).
   - Seluruh feed kartu notifikasi kini membentang penuh (*full-width*) dan harmonis dengan layout desktop lainnya seperti Dashboard dan Riwayat Scan.

---

## 2. Berkas yang Diubah

1. `src/styles/cluv/app/shell.css`:
   - Penambahan style `.cluv-topbar-notif-wrap`, `.cluv-topbar-notif-dropdown`, `.cluv-notif-dropdown-header`, `.cluv-notif-dropdown-list`, `.cluv-notif-dropdown-item`, `.cluv-notif-dropdown-footer`, dan sub-elemennya.
2. `src/components/layout/AppLayout.tsx`:
   - Integrasi state `isNotifDropdownOpen`, outside click listener, dan template popover dropdown notifikasi desktop.
3. `src/pages/app/NotificationsPage.tsx`:
   - Penggantian wrapper kanvas ke `.cluv-canvas-grid`.
4. `CHANGELOG.md`:
   - Pencatatan pembaruan fitur di bagian `[Unreleased] - 2026-10-31`.

---

## 3. Bukti Verifikasi

- **Build Check**: `npm run build` sukses (exit code 0) dalam 4.19s tanpa error TypeScript maupun linting.

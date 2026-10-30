# Laporan Implementasi: Badge Lonceng Notifikasi Dinamis & Auto-Hide

- **Peran**: `/role-frontend`
- **Tanggal**: 2026-10-30
- **Status**: Selesai (Completed)

---

## 1. Ringkasan Perubahan
Menindaklanjuti permintaan pengguna:
> *"kalau ada pesan, ada angkanya, kalau udah dibaca semua hide angkanya"*

Telah dilakukan refactoring dan integrasi real-time antara Topbar Lonceng (`AppLayout.tsx`) dan halaman Notifikasi:

1. **Custom Hook Terpusat (`src/hooks/useNotifications.ts`)**:
   - Menyatukan logika kueri data notifikasi dan pelacakan status baca (`localStorage` + custom event `cluv:notifications-updated`).
   - Menyediakan return nilai reaktif: `{ notifications, readIds, unreadCount, loading, markAsRead, markAllAsRead }`.
   - Menghilangkan duplikasi kode antara shell navigasi dan halaman notifikasi.

2. **Dinamisasi Ikon Lonceng Topbar (`AppLayout.tsx` & `shell.css`)**:
   - Menyingkirkan dot merah statis (`.cluv-topbar-bell-dot`).
   - Menerapkan badge bulat berpenghitung angka tabular (`.cluv-topbar-bell-badge`):
     - Jika `unreadCount > 0`: Menampilkan badge bulat merah rose dengan angka notifikasi belum dibaca (misal `6`, atau `9+` jika di atas 9).
     - Jika `unreadCount === 0`: Badge dan angka **disembunyikan sepenuhnya (*hidden*)**, menyisakan ikon lonceng bersih tanpa ornamen tambahan.
   - Berlaku identik pada Topbar mobile maupun Topbar desktop.

3. **Perapihan Halaman Notifikasi (`NotificationsPage.tsx`)**:
   - Memanfaatkan langsung hook `useNotifications` sehingga file halaman menjadi sangat ramping (dari 412 baris menjadi 135 baris).
   - Ketika pengguna menekan *"Tandai Dibaca"* di halaman notifikasi atau mengklik salah satu notifikasi, angka di ikon lonceng Topbar langsung berkurang / hilang secara instan tanpa reload browser.

---

## 2. Bukti Pengujian & Verifikasi
- **Kompilasi TypeScript & Bundling Vite**:
  - `npm run build` (`tsc -b && vite build`) lulus 100% tanpa error:
    - Output bundle: `dist/assets/NotificationsPage-DcpAvpJT.js` (3.13 kB).
    - Waktu build: 3.67s.
- **Kepatuhan Desain Cluv Framework**:
  - Badge angka menggunakan `font-variant-numeric: tabular-nums`.
  - Warna badge mengacu pada variabel resmi `var(--cluv-rose)` dan `var(--cluv-surface)`.

---

## 3. Berkas yang Diubah / Dibuat
- `src/hooks/useNotifications.ts` *(Dibuat)*
- `src/components/layout/AppLayout.tsx` *(Dimodifikasi)*
- `src/pages/app/NotificationsPage.tsx` *(Dimodifikasi)*
- `src/styles/cluv/app/shell.css` *(Dimodifikasi)*
- `CHANGELOG.md` *(Dimodifikasi)*

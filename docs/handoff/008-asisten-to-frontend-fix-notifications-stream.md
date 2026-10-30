# Handoff 008: Asisten ke Frontend - Pembersihan Kategori & Perbaikan Layout Notifikasi

- **Pengirim**: `/role-asisten`
- **Penerima**: `/role-frontend`
- **Tanggal**: 2026-10-30
- **Status**: Open

---

## 1. Latar Belakang & Masalah
Pengguna melaporkan adanya cacat tampilan (*broken styles*) pada antarmuka mobile Pusat Notifikasi (`/notifications`):
1. **Tab Kategori Rusak & Terpotong**: Tab horizontal terpotong di tepi kanan layar mobile, memakan ruang, dan diputuskan tidak diperlukan.
2. **Posisi Dot & Chevron Melayang Canggung**: Dot unread teal dan icon panah berada di tengah vertikal (`align-self: center`), menempel di samping teks paragraf body dan merusak layout.

## 2. Arahan Solusi
1. **Hapus Kategori Total**:
   - Hilangkan filter tabs (Semua, Transaksi, Misi, Aktivitas). Tidak perlu tab atau dropdown.
   - Sajikan notifikasi sebagai **Single Stream Feed** kronologis.
2. **Perbaiki Header Mobile**:
   - Sisi kiri: "Pusat Pesan" + badge unread count.
   - Sisi kanan: Tombol aksi "Tandai Dibaca" yang rapi.
3. **Perbaiki Layout Kartu (`.cluv-notif-item`)**:
   - Struktur kartu dibuat clean:
     - Ikon di sebelah kiri (sejajar atas).
     - Header item: Judul notifikasi + badge kategori/status + waktu (`timeAgo`) + indikator dot unread di pojok kanan atas.
     - Body text membentang 100% di bawah judul tanpa terhimpit.
     - Hilangkan chevron yang menempel di tengah atau posisikan di pojok kanan secara elegan.

## 3. Kriteria Selesai (Definition of Done)
- [ ] Kategori/tab filter dihapus sepenuhnya dari `NotificationsPage.tsx`.
- [ ] Layout kartu notifikasi di mobile rapi, tidak ada elemen yang melayang di tengah teks.
- [ ] Dot indikator unread dan waktu tampil presisi di baris atas.
- [ ] `tsc -b && vite build` lulus 0 error.

# Laporan Audit Kualitas & Kesiapan Produksi: Halaman Misi Glow & Usulan Mobile V2

- **Peran**: `/role-inspektur` (Audit-Only / Read-Only Mode)
- **Tanggal**: 2026-10-30
- **Status**: Siap Masuk Tahap Refinement (Audit Passed with Recommendations)
- **Topik**: Audit End-to-End Data Flow, Anti-AI Slop UI, Kerapian Arsitektur, dan Validasi Desain Ulang Mobile V2 Halaman Misi

---

## 1. Ringkasan Kesehatan Kode & Skor Produksi

| Kategori Audit | Status | Keterangan & Catatan Auditor |
| :--- | :---: | :--- |
| **Kompilasi & Build** | **100% HIJAU** | `tsc -b && vite build` lulus 0 error (waktu build: 4.62s). |
| **Aksesibilitas & Semantik** | **SANGAT BAIK** | 0 `<div onClick>`, semua aksi menggunakan `<button type="button">`, tabs menggunakan `role="tab"`. |
| **Tipografi & Angka** | **SANGAT BAIK** | Semua nilai nominal kredit dan progress counter menerapkan `cluv-tabular-nums`. |
| **Zero Layout Shift (CLS)** | **TERVERIFIKASI** | Feedback klaim hadiah menggunakan floating `<Toast>`, tidak mendorong elemen feed. |
| **Sinkronisasi Data (E2E)** | **SINKRON** | Terhubung ke tabel `missions`, `user_missions`, dan PostgreSQL RPC `claim_mission`. |
| **Ergonomi Layar Mobile** | **PERLU REFINEMENT** | Layout mobile saat ini bebas overflow, namun kartu terlalu tinggi/repetitif dan belum mengadopsi standar Bento Wallet kanonikal. |

---

## 2. Matriks Sinkronisasi Alur Data (UI ➔ API ➔ DB)

| Komponen / Aksi UI | Endpoint / RPC Backend | Tabel & Kolom Database | Status Alur Data |
| :--- | :--- | :--- | :--- |
| **Daftar Misi** | `supabase.from('missions').select('*')` | `missions` (`id`, `slug`, `name`, `coin_reward`, `target_count`, `type`) | **Sinkron Penuh** |
| **Progres User** | `supabase.from('user_missions').select('*')` | `user_missions` (`user_id`, `mission_id`, `current_count`, `is_completed`) | **Sinkron Penuh** |
| **Klaim Hadiah** | `supabase.rpc('claim_mission')` | `coin_balances`, `coin_transactions`, `user_missions` | **Sinkron Atomik (RPC)** |
| **Saldo AI Credits** | `useAuthStore.coinBalance` | `coin_balances` (`balance`, `user_id`) | **Sinkron Penuh** |
| **Total Diperoleh (Usulan Bento)** | Belum di-query di `MissionsPage` | `coin_transactions` (`amount > 0`) | **Perlu Query Akumulatif** (seperti di `CoinHistoryPage`) |

---

## 3. Temuan Pelanggaran Ergonomi & Observasi Lapangan

### A. Inkonsistensi Hero Bento Card Mobile vs Gambar 1
- **Lokasi**: [MissionsPage.tsx:528-572](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L528-L572) dan [cards.css:1362-1373](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/styles/cluv/components/cards.css#L1362-L1373).
- **Temuan**: Saat ini `MissionsPage` membuat hero card custom `.cluv-mobile-mission-hero` dengan icon squircle cream di kiri. Padahal aplikasi sudah memiliki komponen Bento Wallet kanonikal `.cluv-bento-wallet` di [cards.css:529-625](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/styles/cluv/components/cards.css#L529-L625) yang dipakai di halaman Riwayat Koin (Gambar 1).
- **Dampak**: Visual antar-halaman terasa berbeda (*design fragmentation*).
- **Rekomendasi Auditor**: **Gunakan ulang (Reuse)** class `.cluv-bento-wallet` untuk hero card Misi, dengan mengganti kolom kanan bawah "Total Digunakan" menjadi "Progres Misi Hari Ini".

### B. Filter Tab Horizontal Memakan Ruang Vertikal (Gambar 4)
- **Lokasi**: [MissionsPage.tsx:575-592](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L575-L592).
- **Temuan**: Deretan chip scrollable `.cluv-filter-scroll` memakan ~44px ruang vertikal di atas feed dan rentan tergeser saat scrolling halaman.
- **Rekomendasi Auditor**: Ganti dengan dropdown filter popover kompak (mengadopsi pola `.cluv-filter-trigger-btn` dari [CoinHistoryPage.tsx:326-370](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/CoinHistoryPage.tsx#L326-L370)).

### C. Kartu Misi Mobile Terlalu Gemuk & Informasi Berulang (Gambar 5)
- **Lokasi**: [MissionsPage.tsx:618-715](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L618-L715).
- **Temuan**: Setiap kartu misi memuat squircle icon 38px, badge kategori "Harian", progress bar track, dan baris aksi terpisah. Untuk 10+ misi, pengguna mengalami *scroll fatigue*.
- **Rekomendasi Auditor**: Sederhanakan menjadi baris tugas minimalis:
  - Sisi Kiri: Judul Misi + deskripsi 1 baris + label `+X Credits` (emas, tabular-nums).
  - Sisi Kanan: Tombol aksi langsung (`Klaim Hadiah ⚡`, `Mulai Scan`, `Pindai Produk`, `Tanya AI`) atau badge status.

### D. Hilangnya Sentuhan Gamifikasi pada Misi Login Harian
- **Lokasi**: [MissionsPage.tsx:41-51](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/pages/app/MissionsPage.tsx#L41-L51).
- **Temuan**: Login Harian saat ini diperlakukan seperti misi biasa. Di aplikasi mobile modern (Gojek, Shopee, Duolingo), login harian disajikan sebagai **Daily Check-in Streak 7 Hari** dengan reward bertingkat dan peti hadiah akhir pekan.
- **Rekomendasi Auditor**: Pisahkan misi `daily_login` dari daftar biasa, jadikan kartu gamifikasi khusus di bagian paling atas feed.

### E. Topbar Action Belum Aktif di Halaman Misi (Gambar 3)
- **Lokasi**: [AppLayout.tsx:275](file:///home/kangjessy/Documents/projects/skinscan/skincluv/src/components/layout/AppLayout.tsx#L275).
- **Temuan**: Kapsul kredit `⚡ 1.387 | +` baru aktif di `/coin-history`, belum mencakup `/missions`.
- **Rekomendasi Auditor**: Tambahkan kondisi `|| location.pathname.startsWith('/missions')` agar kapsul kredit tampil di pojok kanan Topbar saat membuka halaman Misi.

---

## 4. Rekomendasi Teknis untuk `role-frontend`

1. **Query Akumulasi Total Diperoleh**: Di `MissionsPage.tsx`, tambahkan query ringan ke `coin_transactions` (`user_id = user.id AND amount > 0`) atau hitung total reward misi yang telah diklaim pengguna untuk mengisi slot "Total Diperoleh" di Bento Wallet.
2. **Reuse First Doktrin Cluv**: Jangan buat class CSS baru untuk Bento Wallet, gunakan `.cluv-bento-wallet` kanonikal yang sudah ada di `cards.css`.
3. **Penyederhanaan Styling**: Hapus styling `.cluv-mobile-mission-hero` yang tidak terpakai setelah beralih ke `.cluv-bento-wallet` demi menjaga kebersihan bundle CSS.
4. **Validasi Build**: Tetap pastikan `tsc -b && vite build` lulus 0 error setelah restrukturisasi.

---

## 5. Kesimpulan Auditor
Usulan perbaikan yang diajukan oleh pengguna **100% valid, sejalan dengan doktrin anti-AI slop, dan secara signifikan meningkatkan ergonomi serta retensi pengguna pada perangkat mobile**.

Audit selesai. Tiket handoff [007-asisten-to-frontend-mobile-missions-redesign-v2.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/handoff/007-asisten-to-frontend-mobile-missions-redesign-v2.md) dinyatakan **VALID & SIAP DIKERJAKAN** oleh `/role-frontend`.

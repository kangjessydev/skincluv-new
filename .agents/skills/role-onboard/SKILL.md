---
name: role-onboard
description: >-
  Untuk proyek lanjutan yang sudah ada: baca kode, pahami stack beserta alasannya, lalu buat
  project-brief, project-map, glossary, dan baseline. Hanya membaca, tidak mengubah kode.
---

# role-onboard

Ikuti `.agents/rules/team-protocol.md`. Tujuan: peran lain tidak perlu scan ulang dan
mengikuti pola yang sudah ada. **Hanya membaca kode**; hanya menulis ke `docs/`.

## Langkah
1. **Tanya, rencana & audit `.agents/` eksisting** (tunggu persetujuan):
   - Konfirmasi lokasi proyek, bagian yang penting/berisiko, dokumentasi, dan batas pemindaian.
   - **Audit `.agents/` Lokal:** Cek apakah proyek sudah memiliki folder `.agents/`.
     - Jika ada skill/rules bawaan proyek (tidak berawalan `role-`), catat daftarnya dan usulkan untuk didaftarkan ke `roster.md` sebagai **Custom Project Tools** agar tidak tertimpa atau hilang.
     - Jika ada tim peran versi lama, catat kesenjangan katalog referensinya.
2. **Deteksi stack** dari `package.json`/`composer.json`/lockfile/konfigurasi/struktur folder.
   Catat versi dipakai vs versi terbaru (cek sumber resmi/registry, cantumkan tanggal).
3. **Cari alasan pemilihan stack** dari git log, README, komentar, dokumen. Jika tidak
   ditemukan, **tanya user**; jangan menebak. Tandai "alasan tidak diketahui" bila perlu.
4. **Petakan struktur**: folder, titik masuk, alur utama, peta fitur UI → API → DB beserta
   status (nyata/dummy/putus; tanda dummy: array literal di komponen, mock/faker/lorem/TODO,
   endpoint tak dipanggil). Bukti: file:baris.
5. **Catat konvensi** dengan contoh kode nyata (penamaan, gaya, pola, struktur modul).
   Sorot ketidakkonsistenan sebagai temuan, **jangan memperbaikinya**.
6. **Bangun glossary**: satu konsep = satu nama; catat alias ganda yang ditemukan.
7. **Baseline**: ada tidaknya tes/linter, perintah jalankan/tes/build (coba jalankan bila aman
   dan user setuju; catat hasilnya). Jika belum ada tes/linter, buat handoff berprioritas
   untuk fase awal (linter/formatter, lalu characterization test pada alur kritis); jangan
   memasangnya sendiri.
8. **Profil risiko**: usulkan berdasarkan temuan, **minta user mengonfirmasi**. Jika ragu,
   pilih tingkat lebih tinggi.
9. **Tulis dokumen** dari `.agents/templates/`: `docs/project-brief.md`, `project-map.md`,
   `glossary.md`; sertakan tanggal dan commit verifikasi. Jaga ringkas.
10. **Laporan** + handoff untuk temuan (stack usang, duplikasi, dummy, kerentanan) tanpa
    mengubah apa pun. Tutup dengan "ada lagi yang bisa dibantu?" dan sarankan `/role-asisten`
    untuk menyusun tugas berikutnya.

## Pembaruan (jika dokumen sudah ada)
Bandingkan commit verifikasi dengan `git diff`; periksa **hanya bagian yang berubah**, lalu
perbarui tanggal/commit.

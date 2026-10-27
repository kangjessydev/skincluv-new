# Katalog Jenis Website (Website Archetypes) & Panduan Fundamental Teknis

Dokumen acuan untuk `role-asisten`, `role-blueprint`, `role-frontend`, `role-backend`, dan `role-inspektur` agar aplikasi dibangun dengan visual tepat guna dan arsitektur yang tahan banting (anti-AI slop & anti-vibe coder blindspots).

Format dokumen ini dirancang modular agar mudah ditambah seiring berkembangnya jenis proyek.

---

## 1. SaaS Dashboard / Web App Produktivitas
- **Karakteristik:** Padat data (high data density), workflow multi-langkah, interaksi frekuensi tinggi oleh pengguna harian.
- **Standar UI:**
  - Layout: Sidebar navigasi persisten, collapsible, header breadcrumbs yang informatif.
  - Tipografi: Tabular numbers (angka rata kanan pada tabel finansial/metrik), font kompak (12-14px pada tabel/grid).
  - Skema Warna: Dominan netral/slate gelap atau terang dengan satu warna aksen fungsional; hindari gradien heboh di kanvas kerja utama.
  - Kontrol: Keyboard shortcuts, filter multi-kriteria, bulk action bar, pagination/virtual scrolling.
- **Jebakan AI Slop UI:** Card raksasa dengan whitespace boros padahal user butuh membandingkan 50 baris data; chart kosmetik tanpa makna operasional.
- **Hal Fundamental Teknis (Vibe-Coder Blindspots):**
  - **Auto-Save Race Condition:** Jika ada fitur auto-save (misal editor/form), request lama yang lambat di jaringan tidak boleh menimpa (overwrite) hasil ketikan terbaru yang sudah terkirim. Gunakan timestamp checking atau abort controller (`AbortController`).
  - **Stale Cache vs Live Mutation:** Setelah aksi update/delete di modal, data di tabel latar belakang harus otomatis di-invalidasi dan direfresh, bukan menunggu reload browser.
  - **Tenant Boundary (IDOR):** Pastikan query selalu menyertakan `WHERE organization_id = current_user.org_id`. Jangan percaya `org_id` dari payload JSON yang dikirim client.

---

## 2. Landing Page / Marketing & Conversion
- **Karakteristik:** Narasi visual linier, fokus pada konversi tunggal (CTA), target audiens baru/calon pembeli.
- **Standar UI:**
  - Hero Section: Headline tajam, social proof instan (rating, logo klien), CTA dengan kontras tertinggi di viewport.
  - Visual: Tipografi modern berkarakter (display font pada judul), visualisasi produk nyata, testimonial terverifikasi.
  - Ritme: Spacing lega (section padding 80-120px), pembagian section kontras (gelap-terang selang-seling).
- **Jebakan AI Slop UI:** Teks marketing klise ("Revolutionize your workflow with AI"), 3 kolom fitur generik dengan ikon abstrak ungu/cyan.
- **Hal Fundamental Teknis (Vibe-Coder Blindspots):**
  - **Double Submit Form:** Tombol "Daftar / Konsultasi" WAJIB di-disable seketika setelah klik pertama untuk mencegah duplikasi leads saat user mengklik berkali-kali secara cepat.
  - **Bot & Spam Protection:** Gunakan perlindungan transparan (seperti Honeypot field atau Cloudflare Turnstile), bukan captcha gambar rumit yang merusak konversi user sungguhan.
  - **Cumulative Layout Shift (CLS):** Berikan aspek rasio eksplisit (`width` dan `height` atau `aspect-ratio`) pada semua gambar hero dan video agar layout tidak melompat saat aset selesai diunduh.

---

## 3. E-Commerce / Toko Online
- **Karakteristik:** Eksplorasi produk cepat, pertimbangan harga/katalog, alur checkout tanpa friksi.
- **Standar UI:**
  - Katalog: Filter faceted (kategori, harga, ukuran, rating) yang instan, badge ketersediaan stok, sticky price summary.
  - Gambar Produk: Aspek rasio konsisten (1:1 atau 3:4), zoom hover, thumbnail gallery horizontal/vertical.
  - Checkout: Alur checkout transparan, kalkulasi ongkir dan pajak sebelum input pembayaran.
- **Jebakan AI Slop UI:** Tombol "Beli Sekarang" tersembunyi di bawah fold; deskripsi panjang tanpa spesifikasi ringkas.
- **Hal Fundamental Teknis (Vibe-Coder Blindspots):**
  - **Race Condition Pengurangan Stok (Concurrency Lock):** Dua user membeli 1 sisa barang di detik yang sama. JANGAN gunakan `SELECT stock` lalu `UPDATE stock = stock - 1` terpisah di backend. Gunakan atomic update: `UPDATE products SET stock = stock - qty WHERE id = $id AND stock >= qty` atau database row locking (`SELECT FOR UPDATE`).
  - **Idempotency Key pada Pembayaran:** Request pembayaran WAJIB menyertakan `idempotency_key` (UUID unik per sesi order). Jika koneksi terputus dan client mencoba mengirim ulang, backend tidak boleh mendebit rekening user dua kali.
  - **Client-Side Price Tampering:** Harga produk dan total belanja WAJIB dihitung ulang di server berdasarkan database saat checkout. JANGAN PERNAH menerima total nominal harga belanja mentah dari payload frontend!

---

## 4. Content / Blog / Media / Dokumentasi
- **Karakteristik:** Fokus keterbacaan (readability), konsumsi teks panjang, pencarian cepat.
- **Standar UI:**
  - Tipografi: Lebar baris terukur (measure: 65-75 karakter per baris), line-height nyaman (1.6 - 1.8), hierarki heading tegas.
  - Navigasi: Table of Contents (ToC) melayang (sticky) dengan active scroll indicator, estimasi waktu baca, command palette (`Ctrl+K`).
  - Fitur Khusus: Syntax highlighter dengan copy-button untuk code block, callout note/warning yang jelas.
- **Jebakan AI Slop UI:** Font abu-abu pucat berkontras rendah; banner/pop-up yang menutupi teks artikel.
- **Hal Fundamental Teknis (Vibe-Coder Blindspots):**
  - **Hydration Mismatch:** Konten tanggal (seperti "2 jam yang lalu") yang di-render di server sering berbeda timezone dengan browser client, menyebabkan hydration error pada Next.js/Nuxt. Render waktu statis di server atau tangani format relatif hanya di client (`useEffect`/`mounted`).
  - **Search Debouncing & Abort:** Fitur pencarian instan WAJIB menggunakan debounce (300ms) dan membatalkan request lama yang belum selesai. Jika user mengetik "apel" lalu cepat mengganti "jeruk", respon data "apel" yang datang terlambat tidak boleh menimpa hasil "jeruk".

---

## 5. Portal Internal / Admin Enterprise
- **Karakteristik:** Utilitas murni, kontrol akses bertingkat (RBAC), audit trail, keandalan CRUD.
- **Standar UI:**
  - Form & Input: Label jelas di atas input, validasi inline seketika (bukan setelah submit), dialog konfirmasi destruktif berlapis.
  - Status & Log: Badge status terstandardisasi (Success/Pending/Failed), log aktivitas dengan timestamp absolut.
- **Jebakan AI Slop UI:** Tampilan warna-warni layaknya game; animasi lambat yang menghambat pekerjaan operator input data.
- **Hal Fundamental Teknis (Vibe-Coder Blindspots):**
  - **Database Transactions (Atomic Rollback):** Operasi yang mengubah lebih dari satu tabel (misal: buat pesanan + potong saldo + buat log) WAJIB dibungkus dalam Database Transaction. Jika satu langkah gagal, seluruh perubahan harus di-rollback.
  - **Bulk Action Timeout:** Menghapus atau mengupdate 5.000 data sekaligus di HTTP request akan menyebabkan timeout. Pisahkan ke background job/queue (worker) dengan progress bar status.
  - **Hard Delete vs Soft Delete:** Data bisnis penting sebaiknya menggunakan soft-delete (`deleted_at`) dengan audit trail siapa yang menghapus dan kapan.

---

## 6. Mobile-First Web App / PWA
- **Karakteristik:** Digunakan dengan sentuhan jempol (thumb zone), viewport kecil, latensi jaringan dinamis.
- **Standar UI:**
  - Touch Target: Minimal 44x44px untuk semua elemen interaktif.
  - Komponen: Bottom navigation bar, swipeable bottom sheets (daripada modal popup yang kaku di tengah layar).
  - Feedback: Haptic feedback / tactile tap state yang responsif (<100ms).
- **Jebakan AI Slop UI:** Hover state yang macet di layar sentuh; scroll horizontal yang tidak sengaja terpicu.
- **Hal Fundamental Teknis (Vibe-Coder Blindspots):**
  - **Virtual Keyboard Shift:** Input form di bagian bawah layar sering tertutup keyboard virtual Android/iOS. Gunakan `scrollIntoView({ behavior: 'smooth' })` saat input menerima focus.
  - **Offline / Flaky Network Graceful Handling:** Jangan biarkan aplikasi crash layar putih saat sinyal hilang. Sediakan state offline yang jelas dan cache data lokal (IndexedDB / LocalStorage) untuk dibaca saat offline.

---

## 7. AI Creative Studio & Generative Media (Drama AI & Virtual Streamer)
- **Alias / Tag Shortcut:** `drama-ai`, `creative-ai`, `virtual-streamer`, `ai-studio`
- **Karakteristik:** Workflow generatif multi-langkah (naskah → storyboard → adegan → rendering video berseri), aset media berat (audio TTS, kloning suara, video stitch), live interactive AI avatar streaming, konsumsi kuota/kredit komputasi GPU tinggi.
- **Standar UI (Creative Studio Aesthetic):**
  - Skema Gelap (Dark Studio): Dominan zinc/slate gelap (meniru standar Runway, CapCut, DaVinci) agar mata nyaman saat mengedit teks naskah dan preview video dalam durasi lama.
  - Multi-Pane Workspace:
    - Sisi Kiri: Tab naskah (scriptwriting editor) dengan auto-breakdown per scene/adegan & karakter casting.
    - Sisi Tengah: Canvas preview video, timeline track sederhana (audio, scene clips, caption), dan kontrol playback.
    - Sisi Kanan: Panel parameter model (preset suara, style video, camera motion, rasio 9:16 vs 16:9).
  - Progress Rendering Transparan: Menampilkan persentase, estimasi sisa waktu (*estimated time remaining*), dan posisi antrean render (*queue position*), bukan sekadar spinner berputar tanpa kepastian.
- **Jebakan AI Slop UI:** Tampilan form putih silau seperti blog biasa; ketiadaan status antrean yang jelas sehingga user mengira aplikasi hang saat proses render berlangsung.
- **Hal Fundamental Teknis (Vibe-Coder Blindspots):**
  - **Asynchronous Job Queue & Webhook/SSE:** Proses render video AI memakan waktu 30 detik hingga 5 menit. HTTP request biasa PASTI timeout (504 Gateway Timeout). Backend WAJIB menggunakan job queue (Redis BullMQ / Celery), dan status dikirim ke frontend secara real-time via Server-Sent Events (SSE) atau WebSocket.
  - **Atomic Credit Reservation & Auto-Refund:** Kredit/token user dipotong (reserved) saat klik render dimulai. Namun jika GPU worker mengalami error/OOM (Out Of Memory), sistem WAJIB secara otomatis mengembalikan kredit (auto-refund/rollback) dalam Database Transaction atomic.
  - **Direct Upload ke Object Storage (Pre-Signed URL):** File suara naskah dan video render berukuran puluhan hingga ratusan MB. JANGAN unggah file mentah melewati server aplikasi Node/Python (bisa memicu memory leak & bandwidth choke). Gunakan Pre-signed URL langsung ke Object Storage (S3 / Cloudflare R2 / GCS).
  - **Character Consistency Constraint:** Menyimpan parameter seed, prompt anchoring, dan referensi visual karakter agar wajah dan pakaian tokoh tidak berubah drastis antar adegan dalam satu drama berseri.
  - **Live Stream Chat Buffer & Moderation Guard:** Pada modul live streaming AI, ratusan komentar chat penonton masuk per detik. LLM avatar tidak boleh overload. Terapkan buffer queue (ambil 1 komentar terbaik per interval jeda wicara), saring dengan filter kata terlarang/profanity sebelum diumpankan ke Text-to-Speech avatar.

---

## 8. Daftar Cek Fundamental Teknis Lintas Fitur (Vibe-Coder Blindspots)

Saat merancang arsitektur atau mengaudit kode, seluruh peran wajib memverifikasi 6 pilar ini:

1. **Race Conditions & Concurrency:**
   - Apakah aksi cepat (multiple click) ditangani dengan button disabling atau loading state?
   - Apakah request asinkronus yang berganti cepat dibatalkan (`AbortController`)?
   - Apakah update angka di database bersifat atomic (`field = field + 1`), bukan hasil pembacaan memori client?
2. **Idempotency (Pencegahan Duplikasi Data):**
   - Apakah ada proteksi jika request POST/mutasi terkirim ulang oleh retry jaringan atau refresh browser?
3. **Authorization Boundary (IDOR Defense):**
   - Apakah backend memverifikasi kepemilikan resource (`WHERE id = :id AND user_id = :current_user`)?
   - Apakah role/permission dicek di sisi server pada setiap endpoint, bukan hanya menyembunyikan tombol di frontend?
4. **Data Integrity & Schema Constraints:**
   - Apakah kolom penting memiliki constraint `NOT NULL`, `UNIQUE`, dan `FOREIGN KEY` di level database (bukan sekadar validasi JavaScript di frontend)?
5. **Error Boundary & Graceful Degradation:**
   - Jika satu komponen API gagal/error, apakah seluruh halaman langsung blank putih (crash), atau hanya komponen tersebut yang menampilkan fallback pesan ramah?
6. **Input Sanitization & Output Encoding:**
   - Semua input user yang ditampilkan kembali wajib di-escape untuk mencegah Cross-Site Scripting (XSS).
   - Hindari penggunaan `dangerouslySetInnerHTML` atau raw HTML kecuali sudah melewati sanitizer terpercaya (DOMPurify).

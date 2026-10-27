# Kerangka Kerja Anti-AI Slop UI (Quality & Design Guidelines)

> **Atribusi Sumber Referensi:**  
> Standar dasar dalam dokumen ini diadopsi dan diselaraskan dari **Vercel Web Interface Guidelines** (v1.0.0, open-source via Vercel Labs), serta prinsip web accessibility W3C WCAG 2.1.  
> *Status:* Terbuka untuk diadopsi, disempurnakan, atau diganti dengan standar desain internal tim jika sudah dirumuskan.

Dokumen ini menjadi acuan mutlak bagi `role-frontend` saat menulis antarmuka, dan `role-inspektur` saat mengaudit kualitas UI.

---

## 1. Semantik HTML & Aksesibilitas (Bukan Sekadar Div)
- **Tombol vs Navigasi:**
  - Gunakan elemen `<button>` untuk aksi/mutasi state (buka modal, submit, toggle).
  - Gunakan elemen `<a>` atau `<Link>` untuk perpindahan URL navigasi.
  - **DILARANG KERAS:** `<div onClick>` atau `<span onClick>` tanpa keyboard support.
- **Aria Label pada Tombol Ikon:**
  - Setiap tombol yang HANYA berisi icon SVG (misal icon X untuk close, icon sampah untuk delete) **WAJIB** memiliki atribut `aria-label="Tutup modal"` atau `aria-label="Hapus data"`.
  - Icon SVG dekoratif wajib memiliki `aria-hidden="true"`.
- **Label Form:**
  - Semua input form wajib terhubung dengan elemen `<label htmlFor="...">` yang dapat diklik.

---

## 2. Status Fokus & Navigasi Keyboard (Focus States)
- **Aturan Outline:**
  - **DILARANG KERAS** menggunakan `outline-none` atau `outline: none` tanpa menyediakan pengganti focus indicator yang jelas.
  - Gunakan `:focus-visible` (misal: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500`) agar lingkaran fokus muncul saat navigasi keyboard, namun tidak mengganggu saat klik mouse biasa.
- **Tumpukan Overlay:**
  - Sticky header, modal backdrop, atau fixed toolbar tidak boleh menutupi elemen yang sedang menerima fokus tab keyboard.

---

## 3. Stabilitas Tata Letak & Anti-Layout Shift (CLS Prevention)
- **Dimensi Gambar & Video:**
  - Semua tag `<img>`, `<video>`, atau container media wajib menyertakan rasio aspek eksplisit (`width` dan `height` atau class CSS `aspect-video`, `aspect-square`). Hal ini mencegah layout melompat mendadak saat gambar selesai diunduh.
- **Optimasi Pemuatan:**
  - Gambar di atas lipatan layar (*above-the-fold*): gunakan atribut `fetchpriority="high"` atau Next.js `priority`.
  - Gambar di bawah lipatan (*below-the-fold*): gunakan `loading="lazy"`.

---

## 4. Tipografi Presisi & Keterbacaan (Anti-Typographic Slop)
- **Penanganan Kata Menggantung (Widow Prevention):**
  - Pada elemen heading (H1, H2, H3), gunakan class `text-wrap: balance` atau `text-pretty` agar baris terakhir tidak menyisakan satu kata sendirian yang canggung.
- **Simbol Karakter Tipografi Baku:**
  - Gunakan simbol elipsis resmi `…` (bukan tiga titik biasa `...`).
  - Gunakan tanda petik kurva tipografi `“` dan `”` (bukan petik lurus ganda `"`).
- **Tabular Numbers:**
  - Angka harga, stok, waktu countdown, dan data tabel **WAJIB** memiliki class `font-variant-numeric: tabular-nums` agar tidak bergoyang saat nilainya berganti.
- **Pencegahan Teks Meluap (Overflow):**
  - Flexbox children yang memuat teks dinamis wajib diberi class `min-w-0` agar utilitas `truncate` atau `line-clamp` dapat berfungsi dan tidak merusak layout grid.

---

## 5. Animasi Hemat Kompositor (Zero Lag & Hardware Friendly)
- **Properti yang Boleh Dianimasikan:**
  - **HANYA** animasikan `transform` (scale, translate, rotate) dan `opacity`.
  - **DILARANG KERAS** menganimasikan properti layout: `width`, `height`, `top`, `left`, `margin`, `padding` karena memicu CPU layout reflow.
- **Hindari Blanket Transition:**
  - **DILARANG KERAS** menggunakan `transition: all`. Sebutkan properti secara eksplisit, misal: `transition-colors duration-150` atau `transition-transform duration-200`.
- **Kepatuhan Reduced Motion:**
  - Semua animasi pergerakan wajib dinonaktifkan atau disederhanakan jika user mengaktifkan pengaturan OS `prefers-reduced-motion: reduce`.

---

## 6. Formulir Siap Produksi (Anti-Fast Working)
- **Status Submit:**
  - Tombol submit tetap aktif hingga request mulai dikirim.
  - Saat request asinkronus berjalan: tombol submit wajib `disabled` dan menampilkan ikon loading spinner.
- **Pencegahan Kehilangan Data:**
  - Tampilkan dialog peringatan konfirmasi jika user mencoba menutup tab browser saat formulir input belum selesai disimpan (*unsaved changes guard*).
- **Validasi Inline:**
  - Tampilkan pesan error tepat di bawah field yang bermasalah, dan otomatis fokuskan kursor ke field error pertama saat user menekan submit.

# 🌸 Skincluv Universal Micro-Framework Design System (`cluv-*`)

Dokumen ini adalah **panduan arsitektur resmi** untuk seluruh antarmuka Skincluv (lintas AI Council: Antigravity, Claude, ChatGPT, DeepSeek, Kimi). Siapapun AI atau developer yang mengembangkan fitur di halaman Public, App, maupun Admin **WAJIB** memahami dan mematuhi aturan main sistem ini.

---

## 1. Latar Belakang & Filosofi Arsitektur (Mengapa Micro-Framework Ini Lahir?)

Sebelumnya, proyek ini memisahkan styling secara kaku berdasarkan permukaan:
- `.public-*` untuk halaman marketing/publik.
- `.v0-profile-*` / `.app-*` untuk area pengguna terotentikasi.
- `.admin-*` untuk backoffice.

### Permasalahan yang Ditemukan:
1. **Duplikasi Kode Berulang-ulang**:
   Komponen dasar seperti Tombol (*Button*), Kartu (*Card*), Formulir (*Input*), dan *Badge* memiliki fungsi logika dan struktur yang sama di mana-mana. Memisahkannya ke file-file terisolasi menyebabkan developer menulis ulang puluhan baris CSS untuk hal yang sama.
2. **Jebakan Class Telanjang (*Naked Modifier Collision*)**:
   Jika kita menulis tombol seperti `<button class="cluv-btn sm primary admin">`, kata `sm`, `primary`, atau `admin` terlalu generik. Di dunia CSS nyata, class telanjang seperti `.primary` atau `.sm` rawan bertabrakan dengan utility Tailwind, styling library pihak ketiga, atau breakpoint responsive (`sm:`).
3. **Kelelahan Developer (*Developer Fatigue*) di Admin & App**:
   Jika ada 50 tombol di tabel Admin, mewajibkan developer menulis kata `admin` di setiap tombol (`cluv-btn sm primary admin`) adalah anti-pola. Cepat atau lambat, developer akan lupa menulis `admin` pada tombol ke-25, menghasilkan inkonsistensi UI yang memalukan.

---

## 2. Tiga Pilar Arsitektur `cluv-*`

Sistem ini memecahkan masalah di atas menggunakan **Tiga Pilar**:

```
+------------------------------------------------------------------------+
|                      1. Universal Primitives                           |
|      (.cluv-btn, .cluv-card, .cluv-trust-strip, .cluv-badge, etc.)     |
+------------------------------------------------------------------------+
                                   ▲
                                   │
+------------------------------------------------------------------------+
|                      2. Scoped Modifiers (is-*)                        |
|        (.is-primary, .is-secondary, .is-sm, .is-md, .is-lg, .is-pill)   |
+------------------------------------------------------------------------+
                                   ▲
                                   │
+------------------------------------------------------------------------+
|                   3. Contextual Surface Cascades                       |
|   (.cluv-surface-public, .cluv-surface-app, .cluv-surface-admin)       |
+------------------------------------------------------------------------+
```

### Pilar 1: Universal Primitives (`cluv-*`)
Semua komponen dasar (tombol, card, badge, input, accordion, trust strip) adalah komponen universal dengan prefix `.cluv-`. Komponen ini bisa dipakai langsung di Public, App, maupun Admin tanpa menulis ulang CSS.

### Pilar 2: Scoped Modifiers (`is-*`)
Untuk mengubah varian warna, ukuran, atau bentuk, gunakan format modifier **`is-*`**:
- Ukuran: `.is-sm`, `.is-md` (default), `.is-lg`, `.is-block`
- Varian Warna: `.is-primary`, `.is-secondary`, `.is-outline`, `.is-ghost`, `.is-danger`
- Bentuk: `.is-pill`, `.is-rounded`

*Keunggulan*: Format `is-*` (standar Bulma & Shoelace) aman 100% dari tabrakan class CSS umum, mudah di-*grep*, dan jelas terbaca sebagai kondisi/status di DevTools.

### Pilar 3: Contextual Surface Cascade (`.cluv-surface-*`)
Daripada mengetik `admin` di setiap tombol, cukup pasang class penanda lingkungan pada wrapper layout halaman:
- **`.cluv-surface-public`**: Mengaktifkan persona hangat (*Warm Companion*), font Nunito, radius rounded-pill lembut, dan bayangan soft.
- **`.cluv-surface-app`**: Mengaktifkan persona klinis segar (*Fresh Clinical*), font Plus Jakarta Sans, dan radius 12px.
- **`.cluv-surface-admin`**: Mengaktifkan persona produktivitas tinggi (*High-Density Admin*), font Inter, ukuran compact (36px button), radius 6px tegas, dan border crisp.

*Hasilnya*: Developer di halaman Admin cukup menulis `<button class="cluv-btn is-primary is-sm">Simpan</button>`, dan tombol tersebut **OTOMATIS** berpenampilan khas Admin tanpa perlu mengetik kata `admin` berulang kali!

*(Catatan: Jika sewaktu-waktu butuh override manual di luar lingkungannya, modifier `.is-admin`, `.is-app`, atau `.is-public` tetap didukung).*

---

## 3. Skala Hirarki Tipografi Kanonikal (Fluid Typography)

Untuk mencegah judul section yang kebesaran atau teks card yang jomplang, seluruh teks wajib menggunakan skala baku ini:

| Class Kanonikal | Ukuran Desktop | Ukuran Mobile | Bobot & Line-Height | Kegunaan Resmi |
| :--- | :--- | :--- | :--- | :--- |
| **`.cluv-title-hero`** | `clamp(2rem, 3.8vw + 0.8rem, 3rem)` | ~32px | 800, LH 1.2 | Judul utama paling atas (Hero section). |
| **`.cluv-title-section`** | `clamp(1.5rem, 2.8vw + 0.5rem, 2.25rem)` | ~24px | 800, LH 1.25 | Judul setiap babak / seksi halaman. |
| **`.cluv-title-card`** | `clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)` | ~18px | 800, LH 1.35 | Judul dalam kartu bento / fitur / step. |
| **`.cluv-lead`** | `clamp(1.0625rem, 1.4vw + 0.4rem, 1.25rem)` | ~16px | 500, LH 1.6 | Paragraf pengantar di bawah judul hero/seksi. |
| **`.cluv-body`** | `1rem` (16px) | 15px | 500, LH 1.65 | Teks bacaan utama sehari-hari. |
| **`.cluv-caption`** | `0.875rem` (14px) | 13px | 500, LH 1.5 | Keterangan tambahan, subtitle kartu. |
| **`.cluv-micro`** | `0.75rem` (12px) | 12px | 600, LH 1.4 | Label tag, copyright, catatan kaki halus. |

---

## 4. Komponen Kanonikal & Contoh Penggunaan

### 4.1 Tombol (`.cluv-btn`)
```html
<!-- Tombol Utama (Besar) untuk CTA Landing Page -->
<a href="/register" class="cluv-btn is-primary is-lg">
  <Heart size={16} />
  <span>Mulai Cerita Bareng Skincluv</span>
</a>

<!-- Tombol Sekunder di Hero -->
<a href="/about" class="cluv-btn is-secondary is-lg">
  <span>Kenapa Kami Berbeda?</span>
</a>

<!-- Tombol Standar Form -->
<button type="submit" class="cluv-btn is-primary is-md">
  Simpan Perubahan
</button>

<!-- Tombol Kecil di Tabel Data -->
<button type="button" class="cluv-btn is-outline is-sm">
  Lihat Detail
</button>
```

### 4.2 Reassurance Trust Strip (`.cluv-trust-strip`)
Digunakan untuk mikro-copy penenang di bawah tombol CTA atau form agar tidak tampil polosan/rusak:
```html
<div class="cluv-trust-strip">
  <span class="cluv-trust-item">
    <CheckCircle2 size={14} class="cluv-trust-icon" />
    <span>Gratis Pendaftaran</span>
  </span>
  <span class="cluv-trust-dot">•</span>
  <span class="cluv-trust-item">
    <CheckCircle2 size={14} class="cluv-trust-icon" />
    <span>Tanpa Kartu Kredit</span>
  </span>
  <span class="cluv-trust-dot">•</span>
  <span class="cluv-trust-item">
    <ShieldCheck size={14} class="cluv-trust-icon" />
    <span>100% Aman Privasi</span>
  </span>
</div>
```

### 4.3 Kartu Serbaguna (`.cluv-card`)
```html
<div class="cluv-card is-interactive">
  <div class="cluv-card-icon-wrap">
    <Sparkles size={20} />
  </div>
  <h3 class="cluv-title-card">Observasi Wajah Mandiri</h3>
  <p class="cluv-body">Membaca sinyal kulit secara lembut tanpa vonis yang menghakimi.</p>
</div>
```

### 4.4 Accordion Tanya Jawab (`.cluv-accordion`)
```html
<div class="cluv-accordion">
  <div class="cluv-accordion-item">
    <button type="button" class="cluv-accordion-trigger" onClick={toggle}>
      <span>Apakah foto wajah saya aman?</span>
      <ChevronDown class="cluv-accordion-chevron rotate" />
    </button>
    <div class="cluv-accordion-body">
      <p class="cluv-body">Foto wajahmu dienkripsi dan diproses sesuai UU PDP No. 27/2022.</p>
    </div>
### 4.5 Standar Kontainer & Layout (.cluv-container, .cluv-section, .cluv-grid, .cluv-btn-group)
Sistem layout modular terinspirasi oleh standar WordPress/Elementor dan Bootstrap:

```html
<!-- 1. Kontainer Standar (Boxed 1140px) -->
<div class="cluv-container">
  <!-- Konten landing page / beranda -->
</div>

<!-- 2. Kontainer Sempit (Narrow 720px) untuk formulir / login / checkout / reading -->
<div class="cluv-container is-narrow">
  <form class="cluv-field">...</form>
</div>

<!-- 3. Kontainer Lebar (Wide 1360px) untuk Dashboard & Admin -->
<div class="cluv-container is-wide">
  <!-- Grid data / telemetry -->
</div>

<!-- 4. Button Group: Pengatur barisan tombol otomatis responsif -->
<div class="cluv-btn-group is-center is-stack-mobile">
  <button class="cluv-btn is-primary is-lg">Mulai Sekarang</button>
  <button class="cluv-btn is-secondary is-lg">Pelajari Dulu</button>
</div>

<!-- 5. Responsive Grid (2, 3, atau 4 Kolom) -->
<div class="cluv-grid cols-3">
  <div class="cluv-card">...</div>
  <div class="cluv-card">...</div>
  <div class="cluv-card">...</div>
</div>
```

### 4.6 Status & Feedback Alert (.cluv-alert)
Untuk notifikasi formulir, peringatan kuota, atau umpan balik sistem:
```html
<div class="cluv-alert is-success">
  <CheckCircle2 class="cluv-alert-icon" size={18} />
  <div class="cluv-alert-content">
    <div class="cluv-alert-title">Berhasil Disimpan</div>
    <p class="cluv-alert-message">Profil kulitmu telah diperbarui dengan aman.</p>
  </div>
</div>

<div class="cluv-alert is-warning">
  <AlertCircle class="cluv-alert-icon" size={18} />
  <div class="cluv-alert-content">
    <div class="cluv-alert-title">Sisa Kuota Menipis</div>
    <p class="cluv-alert-message">Tersisa 1 kuota scan wajah bulan ini.</p>
  </div>
</div>
```

### 4.7 Loading States (.cluv-spinner & .cluv-skeleton)
Untuk transisi asinkron (API Supabase, Gemini AI, Tripay):
```html
<!-- Spinner Putar -->
<div class="cluv-spinner is-md"></div>

<!-- Shimmer Skeleton Placeholder -->
<div class="cluv-skeleton is-title"></div>
<div class="cluv-skeleton is-text"></div>
<div class="cluv-skeleton is-text" style="width: 80%;"></div>
```

### 4.8 Pembatas / Dividers (.cluv-divider)
```html
<!-- Garis Halus -->
<hr class="cluv-divider" />

<!-- Garis Pemisah dengan Teks Tengah (misal login/register) -->
<div class="cluv-divider has-text">
  <span class="cluv-divider-label">atau masuk dengan</span>
</div>
```

### 4.9 Modal & Dialog Popup (.cluv-modal)
```html
<div class="cluv-modal-overlay">
  <div class="cluv-modal-box">
    <div class="cluv-modal-header">
      <h3 class="cluv-modal-title">Konfirmasi Penghapusan Data</h3>
      <button class="cluv-modal-close"><X size={18} /></button>
    </div>
    <div class="cluv-modal-body">
      <p>Seluruh riwayat scan dan foto wajahmu akan dimusnahkan secara permanen.</p>
    </div>
    <div class="cluv-modal-footer">
      <button class="cluv-btn is-ghost is-sm">Batal</button>
      <button class="cluv-btn is-danger is-sm">Hapus Permanen</button>
    </div>
  </div>
</div>
```

---

## 5. Struktur Berkas (File Structure)

```
src/styles/cluv/
├── index.css               # Master bundle import
├── tokens.css              # Brand colors, status colors, neutral scale, radii
├── surfaces.css            # Contextual cascades (.cluv-surface-public, .cluv-surface-app, .cluv-surface-admin)
├── layout.css              # Containers (.cluv-container), Sections, Grid (.cluv-grid), Button Groups (.cluv-btn-group)
├── typography.css          # Fluid scales (.cluv-title-hero, .cluv-title-section, .cluv-lead, .cluv-body, etc.)
└── components/
    ├── buttons.css         # .cluv-btn (.is-primary, .is-sm, etc.)
    ├── cards.css           # .cluv-card (.is-interactive, .is-compact)
    ├── trust-strip.css     # .cluv-trust-strip (.cluv-trust-item)
    ├── badges.css          # .cluv-badge (.is-gold, .is-rose), .cluv-dot
    ├── accordions.css      # .cluv-accordion (.cluv-accordion-item)
    ├── forms.css           # .cluv-input, .cluv-label, .cluv-field
    ├── alerts.css          # .cluv-alert (.is-info, .is-success, .is-warning, .is-danger)
    ├── spinners.css        # .cluv-spinner, .cluv-skeleton
    ├── dividers.css        # .cluv-divider (has-text)
    └── modals.css          # .cluv-modal-overlay, .cluv-modal-box
```

---

## 6. Aturan Mutlak bagi Seluruh AI (AI Invariants)

1. **Dilarang Membuat Class Telanjang**: Jangan gunakan `.sm`, `.primary`, atau `.admin` sendirian. Wajib gunakan `.is-sm`, `.is-primary`, atau wrapper `.cluv-surface-admin`.
2. **Dilarang Menulis Ulang Komponen Tombol/Card/Layout**: Jika butuh kontainer gunakan `.cluv-container` (dengan modifier `.is-narrow` atau `.is-wide`). Jika butuh tombol gunakan `.cluv-btn`. Jika butuh grup tombol gunakan `.cluv-btn-group`.
3. **Patuhi Hirarki Tipografi**: Judul Hero wajib `.cluv-title-hero`, judul seksi/chapter wajib `.cluv-title-section`, judul kartu wajib `.cluv-title-card`. Dilarang menggunakan H1 untuk seksi tengah halaman.
4. **Zero Inline Styles untuk Layout & Warna**: Semua pewarnaan dan tata letak wajib merujuk ke variabel tokens CSS (`var(--cluv-teal)`, `var(--cluv-neutral-*)`).


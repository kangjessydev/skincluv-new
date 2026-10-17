# 🌸 Skincluv Public Design System & Component Registry (`public-*`)

> **Status**: Dokumen Resmi Arsitektur & Panduan Baku Frontend Non-Login  
> **Target Audience**: Seluruh AI Agent (Antigravity, Claude, ChatGPT, DeepSeek) & Developer Manusia  
> **Lingkup**: Seluruh Halaman Publik / Non-Login (`LandingPage`, `AboutPage`, `PricingPage/Paket`, `FaqPage`, `ContactPage`, `TermsPage`, `PrivacyPolicyPage`, `MedicalDisclaimerPage`, `RefundPolicyPage`, `NotFoundPage`, `AuthLayout/SingleCard`).  
> ⚡ **Quick Reference / Cheat-Sheet**: [CLUV_FRAMEWORK_CHEATSHEET.md](file:///home/kangjessy/Documents/projects/skinscan/skincluv/docs/frontend/CLUV_FRAMEWORK_CHEATSHEET.md) (Dokumen ringkas berdensitas tinggi untuk AI).

---

## 1. Filosofi & Karakter Visual: Option E (Warm Companion)

Halaman publik Skincluv dirancang dengan identitas **"Sahabat Setia Meja Riasmu" (Warm Companion & Bestie Storytelling)**:
- **Tone of Voice**: Bersahabat, hangat, jujur, mengayomi, edukatif tanpa rasa cemas, dan berakar pada demarkasi non-terapeutik (bukan diagnosis medis).
- **Tipografi**: **Nunito** murni di seluruh teks judul, subjudul, isi, dan tombol.
- **Palet Warna Utama**:
  - Canvas / Latar Belakang: `#f7faff` (Soft Sky White)
  - Teks Utama / Judul: `#1a2d42` (Deep Ink Teal)
  - Teks Redup / Subtitle: `#556980` (Muted Slate)
  - Aksen Brand Utama: `#1f9d97` (Pure Soft Teal)
  - Aksen Hover Brand: `#198782` (Deeper Teal)
  - Latar Badge & Pill: `#e6f6f5` (Soft Teal Wash)
  - Border Badge & Pembatas: `#bceae7` (Crisp Aqua Line)
  - Garis Kartu Standar: `#dce8f3` (Soft Slate Line)
  - Kartu Awan: `#ffffff` dengan border radius `28px` dan soft shadow `0 10px 30px -10px rgba(26, 45, 66, 0.06)`.
- **Anti AI-Slop**:
  - Dilarang menggunakan gradien neon/linear murahan.
  - Dilarang menggunakan emoji mentah tanpa styling di JSX (gunakan ikon Lucide di dalam badge pill/lingkaran halus).
  - Dilarang membuat daftar bullet point mentah tanpa kartu.

---

## 2. Prinsip Responsif Fluid: Solusi Multi-Device Nyata

Untuk mengatasi rentang ukuran layar nyata (iPhone SE compact 320px, mobile standar 375–414px, foldable/phablet 428–480px, HP panjang 21:9, tablet 600–1024px, hingga desktop ultrawide 1440px+), sistem ini mewajibkan **4 Pilar Responsif Fluid**:

### 2.1 Fluid Sizing dengan `clamp()`
Dilarang menggunakan breakpoint kaku satu per satu untuk ukuran tipografi dan padding utama:
```css
/* Teks Judul Utama: Otomatis mengecil di HP kecil (1.75rem), mengalir mulus hingga 2.75rem di desktop */
font-size: clamp(1.75rem, 4vw + 1rem, 2.75rem);

/* Padding Kontainer: Otomatis 16px di layar 320px dan 32px di layar desktop */
padding: clamp(16px, 3.5vw, 32px);
```

### 2.2 Fluid Auto-Fit Grid (Anti Kolom Jebol)
Seluruh grid kartu wajib menggunakan `minmax(min(100%, ...), 1fr)` agar di layar HP 320px kartu tidak pernah terpotong ke samping:
```css
/* Otomatis 1 kolom di HP, 2 kolom di tablet, 3 kolom di desktop tanpa media query kaku */
grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
```

### 2.3 Dynamic Viewport Height (`dvh`)
Mengatasi bilah navigasi Chrome/Safari mobile yang muncul-tenggelam di layar HP panjang/pendek:
```css
min-height: 100vh;
min-height: 100dvh;
```

### 2.4 Touch Target Ergonomics (Ramah Jempol)
Seluruh tombol pill dan link aksi wajib memiliki area sentuh minimal **44px – 48px** agar nyaman digunakan pada layar sentuh ponsel tanpa salah klik.

---

## 3. Kamus Komponen Kanonikal (`public-*`)

> **DOKTRIN MUTLAK**: Siapapun AI atau developer **DILARANG** membuat selector CSS dengan nama halaman seperti `.faq-btn`, `.contact-card`, `.paket-box`, atau `.login-input`. **WAJIB** gunakan class kanonikal di bawah ini:

### 3.1 Layout & Wrapper
| Class | Fungsi | CSS Utama & Catatan |
| :--- | :--- | :--- |
| `.public-navbar-wrapper` | Navbar publik baku (Tipe A: Seamless Header) | `height: 80px (desktop) / 64px (mobile); position: sticky; top: 0; background: rgba(247, 250, 255, 0.88); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(220, 235, 245, 0.7);` |
| `.public-navbar-container` | Penahan grid navbar lega | `max-width: 1200px; margin: 0 auto; width: 100%; display: flex; justify-content: space-between; align-items: center;` |
| `.public-mobile-overlay` | Backdrop blur gelap penutup layar menu mobile | `position: fixed; inset: 0; z-index: 999; background: rgba(15, 27, 42, 0.45); backdrop-filter: blur(10px);` |
| `.public-mobile-drawer` | Kartu menu mobile rounded modern | `max-width: 480px; width: 100%; border-radius: 28px; background: #ffffff; box-shadow: 0 24px 50px -12px rgba(10,25,45,0.25);` |
| `.btn-mobile-primary` | Tombol CTA utama mobile | `height: 48px; border-radius: 9999px; background: #1f9d97; color: #fff; font-weight: 800;` |
| `.btn-mobile-secondary` | Tombol login sekunder mobile | `height: 44px; border-radius: 9999px; background: #f0f7fb; color: #1a2d42; border: 1px solid #dce8f3;` |
| `.public-page` | Root container halaman publik | `background: #f7faff; color: #1a2d42; font-family: 'Nunito', sans-serif; min-height: 100dvh;` |
| `.public-container` | Penahan lebar konten | `max-width: 1140px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 32px); width: 100%; box-sizing: border-box;` |
| `.public-container-narrow` | Kontainer halaman formulir/fokus | `max-width: 480px; margin: 0 auto;` (Untuk Auth Single Card, Reset Password). |
| `.public-section` | Seksi vertikal halaman | `padding: clamp(40px, 8vw, 80px) 0;` |
| `.public-grid-2` | Grid 2 kolom responsif | `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: clamp(16px, 3vw, 32px);` |
| `.public-grid-3` | Grid 3 kolom responsif | `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: clamp(16px, 2.5vw, 28px);` |

---

### 3.2 Header Seksi & Judul Bab (`.public-section-header`)
Digunakan untuk judul utama halaman atau judul seksi bab:
```tsx
<div className="public-section-header center">
  <div className="public-badge">
    <span className="public-dot" />
    <span>TENTANG KAMI</span>
  </div>
  <h1>Cerita Meja Rias &amp; Sahabat Kulitmu</h1>
  <p className="public-subtitle">
    Skincluv lahir dari keresahan membaca label kemasan yang rumit dan rasa bingung memilih perawatan yang tepat.
  </p>
</div>
```
- `.public-section-header.center`: Perataan tengah.
- `.public-section-header.left`: Perataan kiri (cocok untuk halaman legal atau grid berdampingan).
- `.public-subtitle`: Paragraf keterangan warna `#556980` dengan line-height 1.65.

---

### 3.3 Tombol Pill (`.public-btn`)
Tombol berbentuk kapsul lembut (*pill shape*) seragam:
```tsx
{/* Tombol Utama */}
<button className="public-btn primary md">
  <Sparkles size={16} />
  <span>Mulai Sekarang</span>
</button>

{/* Tombol Sekunder / Putih */}
<Link to="/faq" className="public-btn secondary md">
  <HelpCircle size={16} />
  <span>Pusat Bantuan</span>
</Link>

{/* Tombol Garis Halus */}
<button className="public-btn outline sm">
  <span>Rincian</span>
</button>
```
- **Varian Warna**:
  - `.primary`: Latar `#1f9d97`, teks putih, hover `#198782`, soft shadow.
  - `.secondary`: Latar putih `#ffffff`, border `1.5px solid #dce8f3`, teks `#1a2d42`, hover `#f7faff` border `#bceae7`.
  - `.outline`: Latar transparan, border `1.5px solid #bceae7`, teks `#127a75`.
  - `.ghost`: Latar transparan tanpa border, teks `#556980`, hover color `#1f9d97`.
- **Ukuran**:
  - `.sm`: Tinggi 38px, padding 0 16px, font 0.8125rem.
  - `.md`: Tinggi 46px, padding 0 22px, font 0.9375rem (standar utama).
  - `.lg`: Tinggi 52px, padding 0 28px, font 1rem (hero CTA).

---

### 3.4 Kartu Awan & Bento (`.public-card`)
Wadah konten putih bersih ber-radius 28px:
```tsx
<div className="public-card interactive">
  <div className="public-card-icon-wrap">
    <ShieldCheck size={22} />
  </div>
  <h3>Privasi Foto Terjaga</h3>
  <p>Foto wajahmu dienkripsi dan diproses sesuai standar UU PDP No. 27/2022.</p>
</div>
```
- `.public-card`: `background: #ffffff; border: 1.5px solid #dce8f3; border-radius: 28px; padding: clamp(20px, 4vw, 36px); box-shadow: 0 10px 30px -10px rgba(26, 45, 66, 0.06);`
- `.public-card.interactive`: Memiliki transisi halus saat disentuh/hover (`transform: translateY(-2px); border-color: #bceae7;`).
- `.public-card-icon-wrap`: Lingkaran ikon halus (`width: 48px; height: 48px; border-radius: 50%; background: #e6f6f5; color: #1f9d97;`).

---

### 3.5 Badge & Status Pill (`.public-badge`)
Label keterangan lembut di atas judul atau penanda fitur:
```tsx
<div className="public-badge">
  <span className="public-dot" />
  <span>TEMAN SETIA MEJA RIASMU</span>
</div>
```
- `.public-badge`: `border-radius: 9999px; background: #e6f6f5; border: 1px solid #bceae7; color: #127a75; font-size: 0.8125rem; font-weight: 800; padding: 4px 14px;`
- `.public-dot`: Titik bulat 6px dengan warna teal/mint aktif di samping label.

---

### 3.6 Formulir Ramah Pengguna (`.public-form-*`)
Komponen input data yang bersih dan tidak melelahkan mata:
```tsx
<div className="public-form-group">
  <label className="public-form-label">Email Anda</label>
  <div className="public-input-wrap">
    <Mail size={16} className="public-input-icon" />
    <input type="email" className="public-input" placeholder="nama@email.com" />
  </div>
</div>
```
- `.public-form-group`: Menjaga jarak vertikal antar field (16px).
- `.public-form-label`: Font Nunito 800, ukuran 0.8125rem, warna `#1a2d42`.
- `.public-input-wrap`: Pembungkus ikon dan input agar terisolasi rapi.
- `.public-input`: Input ber-radius `14px`, border `1.5px solid #dce8f3`, tinggi 48px, fokus ring teal lembut.
- `.public-form-alert.error` / `.success`: Kotak status pesan feedback ber-radius `14px`.

---

### 3.7 Akordeon Pertanyaan & Rincian (`.public-accordion-*`)
Untuk FAQ, rincian paket, dan ketentuan:
```tsx
<div className="public-accordion">
  <div className="public-accordion-item">
    <button className="public-accordion-trigger" onClick={toggle}>
      <span>Apakah foto wajah saya aman?</span>
      <ChevronDown size={18} className={`public-accordion-chevron ${isOpen ? 'rotate' : ''}`} />
    </button>
    {isOpen && (
      <div className="public-accordion-body">
        <p>Tentu saja! Kami mematuhi penuh UU Perlindungan Data Pribadi...</p>
      </div>
    )}
  </div>
</div>
```

---

### 3.8 Banner Pendamping & Disclaimer (`.public-banner`)
Untuk pesan transparansi, janji sahabat, dan disclaimer medis:
```tsx
<div className="public-banner disclaimer">
  <AlertCircle size={20} className="public-banner-icon" />
  <div className="public-banner-text">
    <strong>Batas Kasih &amp; Komitmen Medis:</strong> Skincluv adalah software edukasi kosmetik mandiri berbasis AI, bukan fasilitas pelayanan medis klinik dokter spesialis.
  </div>
</div>
```

---

## 4. Struktur Folder Modular di Kode

Seluruh modul CSS publik diatur terpusat di `src/styles/public/`:

```
src/styles/public/
├── index.css            <-- Gerbang utama (@import semua file di bawah)
├── tokens.css           <-- Variabel warna, radius 28px, font Nunito
├── typography.css       <-- H1-H4, subtitle, lead, fluid clamp
├── layout.css           <-- .public-page, .public-container, .public-grid-*
└── components/
    ├── buttons.css      <-- .public-btn (primary, secondary, outline, ghost)
    ├── cards.css        <-- .public-card, .public-card-icon-wrap
    ├── badges.css       <-- .public-badge, .public-dot
    ├── forms.css        <-- .public-form-group, .public-input, .public-form-alert
    ├── accordions.css   <-- .public-accordion, .public-accordion-item
    └── banners.css      <-- .public-banner
```

---

## 5. Checklist Validasi AI Sebelum Merge / Edit Halaman Non-Login

Setiap kali AI membuat atau memodifikasi file di bawah folder `src/pages/public/` atau halaman non-login:
- [ ] Apakah seluruh font menggunakan **Nunito**?
- [ ] Apakah seluruh tombol pill menggunakan class kanonikal `.public-btn`?
- [ ] Apakah seluruh kartu awan putih menggunakan `.public-card`?
- [ ] Apakah tidak ada class lokal duplikat (seperti `.faq-*`, `.contact-*`, `.paket-*`, `.login-*`)?
- [ ] Apakah grid dan tipografi menggunakan prinsip fluid `clamp()` dan anti-jebol `minmax(min(100%, ...), 1fr)`?
- [ ] Apakah tidak ada inline styles `style={{ ... }}`?
- [ ] Lolos verifikasi build `npx tsc -b` dengan **0 error**.

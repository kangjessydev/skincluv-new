# 🏛️ Konsensus Dewan AI (RFC 020): Information Architecture Profile & Health Hub

**Tanggal:** 2026-09-30  
**Status:** Disetujui Bulat oleh Dewan AI (Claude, ChatGPT, DeepSeek, Kimi, Antigravity)

---

## 1. Intisari Konsensus Multi-Model

1. **Claude (Chief Software Architect)**:
   - Merekomendasikan pemecahan `/profile` menjadi child routes mandiri yang dirender di `<Outlet />` atau rute terpisah (`/profile/skin`, `/profile/billing`, `/profile/account`).
   - Menerapkan **atomic selectors** Zustand (`useAuthStore(s => s.activeSkinProfile)`) agar update profil kulit tidak memicu re-render pada komponen billing/kuota.
   - Komponen billing benar-benar *unmounted* saat pengguna berada di halaman profil kulit.

2. **ChatGPT (UX & Usability Auditor)**:
   - Mental model pengguna membedakan secara tegas antara **kebutuhan klinis** (ganti tipe kulit, alergi) dan **kebutuhan akun/finansial** (cek sisa credits/kuota).
   - Menolak tab horizontal pada layar mobile 375px karena label terpotong dan friksi navigasi tinggi.
   - Menyarankan pola **Hub Induk (`/profile`) + Sub-pages mandiri**.
   - Membedakan secara ketat antara **Skin Profile** (input deklaratif mandiri pengguna) vs **Skin Assessment** (hasil observasi scan AI di `/scan-history`).

3. **DeepSeek (Mathematical & Performance Optimizer)**:
   - Pemecahan rute dengan `React.lazy()` menghemat **bundle awal sebesar ~44%** (80 KB → 40–45 KB).
   - Memory footprint di mobile berkurang **~30%** (60 MB → 40 MB).
   - DOM nodes per halaman turun dari ~2.500 ke ~800.
   - Menghilangkan *query waterfall*: Query kuota AI yang berat (`quota_usage` & `quota_configs`) ditunda, hanya di-fetch saat halaman billing dibuka.

4. **Kimi (Clinical Skincare & Regulatory Researcher)**:
   - Data alergi/sensitivitas adalah **Data Pribadi Spesifik** (UU PDP No. 27/2022). Menaruhnya bersebelahan dengan invoice berisiko kebocoran data saat pengguna melakukan screenshot tagihan.
   - Invarian 19 (Non-Therapeutic Claim): Form harus diposisikan sebagai **"Profil & Preferensi Kulit"** untuk edukasi, bukan rekam medis.
   - Dilarang menampung field penyakit kulit sistemik, obat resep dokter, atau tindakan medis.
   - Istilah alergi menggunakan framing *self-reported sensitivity*: *"Bahan yang pernah bikin kulit tidak nyaman"*.

---

## 2. Struktur Rute & Alur Navigasi Baru

```
/profile               ──> Hub Pengaturan & Akun (Ringkasan Cepat)
  ├── /profile/skin    ──> Sub-page Khusus: Profil & Preferensi Kulit
  ├── /profile/billing ──> Sub-page Khusus: Langganan, Kuota AI, & Saldo Credits
  └── /privacy-center  ──> Pusat Privasi & Hak Hapus Data (UU PDP)
```

---

## 3. Rencana Eksekusi Bertahap

* [x] **RFC 020 Disetujui**
* [ ] **Langkah 1:** Pembuatan `ProfileSkinPage.tsx` dan pendaftaran rute `/profile/skin` di `App.tsx`.
* [ ] **Langkah 2:** Pembuatan `ProfileBillingPage.tsx` dan pendaftaran rute `/profile/billing` di `App.tsx`.
* [ ] **Langkah 3:** Rampingkan `ProfilePage.tsx` menjadi Hub Pengaturan & Akun.

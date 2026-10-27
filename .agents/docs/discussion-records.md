# Catatan Diskusi & Keputusan Arsitektur (Discussion Records & ADR)

Dokumen ini adalah **memori resmi** dari seluruh sesi perancangan tim peran, mencatat ide, pertimbangan, kesepakatan yang sah, serta poin-poin yang masih dalam tahap eksplorasi atau ditunda.

---

## 1. Keputusan yang Sudah Disepakati (Consensus & Locked Decisions)

### A. Pola Komunikasi & Batas Wewenang Peran
- **Keputusan:** Peran adalah instruksi sesi tunggal (*stateless session prompt*), bukan proses yang berjalan otomatis sendiri. Komunikasi antar-peran terjadi lewat artefak file di `docs/handoff/`, bukan komunikasi lisan langsung di satu prompt.
- **Wewenang Asisten (`role-asisten`):**
  - Asisten bersifat non-invasif: tidak boleh mengubah kode atau memerintah peran lain secara diam-diam.
  - Setiap tindakan wajib meminta izin konfirmasi user terlebih dahulu.
  - Opsi Delegasi Berkelanjutan: Asisten diperbolehkan menawarkan *"Apakah diizinkan menjalankan alur sampai fitur selesai tanpa menunggu persetujuan di setiap langkah kecil?"*. Jika disetujui user, baru boleh otonom.

### B. Pemisahan Jenis Website vs Gaya Desain (Multi-Dimensional Matrix)
- **Keputusan:** Jenis website (domain) TIDAK BOLEH mengunci gaya desain secara kaku.
  - Contoh: Proyek Hotel tidak otomatis bergaya Luxury; user bebas memilih gaya Minimalist Clean, Scandinavian, atau Neo-Brutalism.
- **Struktur Katalog Referensi Modular:**
  - `website-archetypes.md`: Mengatur domain bisnis, flow fitur, dan anti-vibe coder blindspots (race condition, idempotency, IDOR).
  - `design-styles.md`: Mengatur visual language (border-radius, padding, shadow, palette).
  - `asset-types.md`: Mengatur aset visual (foto nyata, 3D render, 2D vector, generative media).
  - `typography-styles.md`: Mengatur font pairing dan aturan `tabular-nums`.
  - `motion-guidelines.md`: Mengatur kurva easing, timing baku (150-300ms), dan reduced-motion.

### C. Standar Produksi (Anti Fast-Working & Schema Mirroring)
- **Keputusan:** Form di sisi admin WAJIB mencerminkan 100% kolom yang disepakati di skema database (slug, deskripsi, harga beli, harga jual, stok, status, metadata). Dilarang keras menyunat form admin menjadi sekadar input nama dan harga di tabel.
- **Rujukan:** `references/feature-matrix.md` dan aturan *Schema Mirroring Rule* di `rules/team-protocol.md`.

### D. Pencegahan Lupa Konteks (Context Window Guard & Phase-Gating)
- **Keputusan:** Jika tugas menyentuh **lebih dari 3 file** atau diproyeksikan menghasilkan **lebih dari 200 baris kode baru**, tugas **DILARANG** dikerjakan sekaligus dalam satu sesi.
- **Solusi:** Wajib dipecah bertahap (Fase 1: DB & Kontrak → Fase 2: Backend & Validasi → Fase 3: Frontend & UI → Fase 4: Audit Inspektur).

### E. Kerangka Kerja Anti-AI Slop UI & Atribusi Terbuka
- **Keputusan:** Anti-AI Slop diikat oleh aturan mikroskopis terukur (semantik tombol/link, aria-label icon, `outline: none` dicegah, penanganan CLS gambar, penanganan flex overflow `min-w-0`, dilarang `transition: all`).
- **Atribusi Sumber:** Diadopsi dari **Vercel Web Interface Guidelines** (open-source), dicatat di `references/anti-ai-slop-ui.md`. Jika di masa depan ada referensi internal/lain yang lebih baik, sumbernya akan diperbarui secara transparan.

### F. Deteksi & Rekonsiliasi `.agents/` di Proyek Lanjutan
- **Keputusan:** Jika sebuah proyek lanjutan sudah memiliki `.agents/` lama:
  - Asisten mendeteksi via signature file (`team-protocol.md` & `roster.md`).
  - Jika versi lama tim peran kita: tawarkan update non-destruktif tanpa menyentuh `docs/`.
  - Jika ada skill lokal bawaan proyek (tidak berawalan `role-`): DILARANG MENIMPA, tawarkan pendaftaran ke `roster.md` sebagai *Custom Project Tools*.

### G. Arsitektur Backend Modular & Database Best Practices
- **Keputusan:** Proyek baru menggunakan pendekatan *Feature-Based / Vertical Slice Architecture* (`src/features/<feature>/`) dan pemisahan ketat 4 lapis (Routes → Controllers → Services → Repositories). Dilarang meletakkan query database di controller.
- **Database Rules:** Wajib index pada foreign key, cursor pagination untuk data besar, dan pencegahan N+1 query.
- **Atribusi Sumber Terbuka:** Diselaraskan secara terbuka dari `agent-skills-hub/skills` dan `supabase/agent-skills` (*Postgres Best Practices*), didokumentasikan di `references/backend-architecture-best-practices.md`.

### H. Verifikasi Versi Real-Time (Protokol Live Registry Ping)
- **Keputusan:** Dilarang menebak versi stack dari memori model AI. Sebelum merekomendasikan dependensi, peran wajib melakukan *live ping* ke registry publik resmi (`npm view`, `curl pypi`, `composer info`) atau GitHub Releases agar data selalu mutakhir dan bebas ketergantungan pihak ketiga.

### I. Mode Audit Saja (Audit-Only Mode)
- **Keputusan:** Jika peran dipanggil dalam mode audit, peran DILARANG mengubah kode satu baris pun. Output murni laporan ringkas berbobot (*High Signal-to-Noise*) dengan rujukan `file:baris` nyata.

### J. Pola Sintesis Konvensi Tepat Waktu (Just-In-Time Stack Synthesis & Progressive Reading)
- **Keputusan:** AI tidak boleh dipaksa membaca seluruh folder referensi mentah di setiap sesi (mencegah context bloat).
- **Alur Kerja:**
  1. `references/` bertindak sebagai perpustakaan yang hanya dibuka jika diperlukan.
  2. Saat stack disepakati (misal: LaraVue, Next.js, Django), `role-asisten` menerjemahkan prinsip-prinsip umum ke dalam sintaks resmi framework tersebut, lalu menulisnya ke `docs/conventions.md` (menggunakan template `.agents/templates/conventions.md`).
  3. Peran pembangun (`role-backend` / `role-frontend`) **hanya membaca 1 file `docs/conventions.md` tersebut** sebagai panduan baku kerja, menjaga konteks tetap bersih dan presisi.

---

## 2. Topik yang Masih Berstatus Eksplorasi / Ditunda (Open & Pending Topics)

### A. Implementasi MCP Server Terpusat di GitHub (Ditunda)
- **Status:** Ide disepakati sangat layak, namun **ditunda** implementasinya sampai kerangka sistem peran lokal teruji stabil di beberapa proyek nyata.
- **Catatan Desain Masa Depan:**
  - Kode MCP di-host di GitHub (`kangjessydev/team-roles-mcp`).
  - Database pengalaman bersama menggunakan serverless cloud DB (Turso SQLite over HTTP atau Supabase) agar pengalaman dan koreksi di laptop A bisa langsung dibaca laptop B.

### B. Pembuatan Micro-Framework / Design System Mandiri Milik Sendiri
- **Status:** Dalam pertimbangan jangka panjang.
- **Pertimbangan:**
  - Keinginan awal: membuat framework komponen utilitas Tailwind khas sendiri (mirip DaisyUI tapi dengan style khas).
  - Konsensus sementara: Menggunakan doktrin token visual baku (`design-styles.md`) dan primitif teruji (Radix/Shadcn) terlebih dahulu. Jika pola visual khas sudah terbukti konsisten, baru diekstraksi menjadi framework komponen mandiri.

### C. Visual Regression Testing & Screenshot Inspection
- **Status:** Ide terbuka untuk masa depan.
- **Pertimbangan:** Membekali `role-inspektur` dengan kemampuan mengambil screenshot browser headless (via Puppeteer/Playwright) untuk memverifikasi secara visual apakah UI rendered benar-benar bebas dari cacat layout sebelum rilis.

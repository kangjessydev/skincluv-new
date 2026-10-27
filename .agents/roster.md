# Roster Peran

Ketik `/role` di chat untuk melihat peran yang sudah ada. Mulai hampir selalu dari `/role-asisten`.
- Spesifikasi detail peran yang direncanakan: [planned-roles.md](./planned-roles.md)
- Arsitektur & alasan keberadaan peran (Developer Reference): [docs/role-architecture.md](./docs/role-architecture.md)
- Catatan Diskusi & Keputusan (ADR / Memory): [docs/discussion-records.md](./docs/discussion-records.md)
- Kerangka Kerja Anti-AI Slop UI (Vercel Guidelines): [references/anti-ai-slop-ui.md](./references/anti-ai-slop-ui.md)
- Praktik Terbaik Backend & Database (Layered & Postgres): [references/backend-architecture-best-practices.md](./references/backend-architecture-best-practices.md)
- Katalog acuan jenis website: [references/website-archetypes.md](./references/website-archetypes.md)
- Katalog gaya desain: [references/design-styles.md](./references/design-styles.md)
- Katalog jenis aset visual: [references/asset-types.md](./references/asset-types.md)
- Katalog gaya tipografi: [references/typography-styles.md](./references/typography-styles.md)
- Panduan standar animasi/motion: [references/motion-guidelines.md](./references/motion-guidelines.md)
- Matriks spesifikasi fitur & Production DoD: [references/feature-matrix.md](./references/feature-matrix.md)

Status: ✅ ada · 📝 direncanakan

| Shortcut | Status | Fungsi satu baris | Boleh ubah kode? |
|---|---|---|---|
| `/role-asisten` | ✅ | Pintu masuk: cek pemahaman proyek, gali kebutuhan, tulis brief ke peran tujuan | Tidak |
| `/role-onboard` | ✅ | Proyek lanjutan: baca kode, pahami stack dan alasannya, buat peta/glossary/baseline | Tidak |
| `/role-init` | 📝 | Proyek baru: kebutuhan, brief, kontrak awal, SOP, glossary | Tidak |
| `/role-research` | 📝 | Riset (termasuk rekomendasi stack berbasis bukti terkini) | Tidak |
| `/role-blueprint` | 📝 | Rancangan kasar dan kontrak API/DB | Tidak |
| `/role-frontend` | ✅ | UI dan frontend (anti-slop, schema mirroring, micro-interactions) | Ya |
| `/role-mobile` | ✅ | Aplikasi mobile native/hybrid (Capacitor, Android, permissions, APK) | Ya (mobile/native) |
| `/role-motion` | 📝 | Konsultan & auditor animasi/motion UI (timing, easing, performa, anti-AI slop) | Tidak |
| `/role-backend` | ✅ | Backend/API (arsitektur 4 lapis, validasi ketat, anti-race condition) | Ya |
| `/role-database` | ✅ | Skema, migrasi aman, relasi, indexing, RLS, zero data loss | Ya |
| `/role-inspektur` | ✅ | Cek ketidaksinkronan UI-API-DB-kontrak, audit data dummy, audit anti-slop | Tidak |
| `/role-security` | 📝 | Cek keamanan sesuai profil risiko | Tidak |
| `/role-bug-hunter` | 📝 | Cari bug dengan bukti | Tidak |
| `/role-devops` | 📝 | Tes, build, rilis, optimasi sebelum production | Terbatas (config/CI) |
| `/role-simplifier` | 📝 | Hapus duplikasi, kode mati, over-engineering | Ya (tes harus hijau) |
| `/role-retro` | 📝 | Tinjau log penyimpangan, usulkan perbaikan SKILL.md | Tidak |
| `/role-help` | 📝 | Tampilkan kartu contekan ini | Tidak |
| `/role-copywriter` | ✅ | Teks produk, microcopy UI, landing page, anti-AI text slop, 6 opsi gaya | Ya (teks/copy) |
| `/role-marketer` | 📝 | Strategi pemasaran | Tidak |

Peran baru diusulkan lewat handoff `...-to-NEW-ROLE`, lalu ditambahkan ke sini setelah disetujui user.

---

## Custom Project Tools (Bawaan Proyek Eksisting)
Jika proyek lanjutan ini memiliki skill/tools lokal bawaan (tidak berawalan `role-`), daftarkan di sini agar diakui dan dapat dipanggil oleh tim peran tanpa tertimpa atau campur aduk:

| Shortcut / Skill Name | Fungsi | Sumber File / Path |
|---|---|---|
| `diskusikan` | Penyusunan RFC Arsitektur Multi-AI Council (Claude, GPT, DeepSeek, Kimi) | [.agents/skills/diskusikan/SKILL.md](./skills/diskusikan/SKILL.md) |
| `skincluv-frontend` | Panduan Resmi & Memori Permanen Arsitektur Frontend Skincluv | [.agents/skills/skincluv-frontend/SKILL.md](./skills/skincluv-frontend/SKILL.md) |
